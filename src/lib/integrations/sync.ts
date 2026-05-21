// Core sync engine — pulls candidates from an ATS and creates/updates them in CVMatch AI
import prisma from '@/lib/prisma'
import { parseDocument } from '@/lib/pdf-parser'
import { analyzeCVAgainstVacancy } from '@/lib/ai'
import {
  teamtailorFetchJobs, teamtailorFetchApplications, teamtailorFetchCandidate,
  teamtailorDownloadCV,
} from './teamtailor'
import {
  recruiteeFetchOffers, recruiteeFetchCandidates, recruiteeDownloadCV,
} from './recruitee'
import {
  smartrecruitersFetchJobs, smartrecruitersFetchCandidates,
  smartrecruitersFetchCandidateCV,
} from './smartrecruiters'

export interface SyncResult {
  imported: number
  updated: number
  skipped: number
  errors: string[]
}

// Ensure a CVMatch AI vacancy exists for an external job, returns its id
async function upsertVacancy(userId: string, externalId: string, platform: string, job: {
  title: string; description: string; requirements: string; company: string; location?: string
}): Promise<string> {
  const existing = await prisma.vacancy.findFirst({
    where: { userId, externalId, externalSource: platform },
  })
  if (existing) return existing.id

  const created = await prisma.vacancy.create({
    data: {
      userId,
      title: job.title,
      company: job.company,
      description: job.description || job.title,
      requirements: job.requirements || '',
      location: job.location,
      status: 'active',
      externalId,
      externalSource: platform,
    },
  })
  return created.id
}

// Create or update a candidate, run AI analysis on the CV if available
async function upsertCandidate(userId: string, platform: string, data: {
  externalId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  linkedIn?: string
  cvBuffer?: Buffer | null
  cvFileName?: string
  motivationText?: string
  vacancyId: string
  atsStatus?: string
}): Promise<'imported' | 'updated' | 'skipped'> {
  const existing = await prisma.candidate.findFirst({
    where: { externalId: data.externalId, externalSource: platform, userId },
  })
  if (existing) return 'skipped'

  // Also skip if same email+vacancy already exists (could be manual upload of same person)
  if (data.email) {
    const byEmail = await prisma.candidate.findFirst({
      where: { email: data.email, vacancyId: data.vacancyId },
    })
    if (byEmail) {
      // Update externalId so we don't re-import
      await prisma.candidate.update({
        where: { id: byEmail.id },
        data: { externalId: data.externalId, externalSource: platform },
      })
      return 'updated'
    }
  }

  let cvContent: string | null = null
  let cvFileName = data.cvFileName || null

  if (data.cvBuffer) {
    try {
      const mimeType = cvFileName?.endsWith('.pdf') ? 'application/pdf'
        : cvFileName?.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/octet-stream'
      cvContent = await parseDocument(data.cvBuffer, mimeType)
      if (cvContent && cvContent.trim().length < 50) cvContent = null
    } catch {
      cvContent = null
    }
  }

  const candidate = await prisma.candidate.create({
    data: {
      firstName: data.firstName || 'Unknown',
      lastName: data.lastName || 'Candidate',
      email: data.email || null,
      phone: data.phone || null,
      linkedIn: data.linkedIn || null,
      cvContent,
      cvFileName,
      motivationText: data.motivationText || null,
      status: mapAtsStatus(data.atsStatus),
      source: platform,
      externalId: data.externalId,
      externalSource: platform,
      gdprConsent: true,
      gdprConsentDate: new Date(),
      vacancyId: data.vacancyId,
      userId,
    },
  })

  if (cvContent) {
    const vacancy = await prisma.vacancy.findUnique({ where: { id: data.vacancyId } })
    if (vacancy) {
      try {
        const analysis = await analyzeCVAgainstVacancy(
          cvContent,
          vacancy.title,
          vacancy.description,
          vacancy.requirements,
          data.motivationText || undefined,
        )
        const contactPatch: any = {}
        if (analysis.firstName && candidate.firstName === 'Unknown') contactPatch.firstName = analysis.firstName
        if (analysis.lastName && candidate.lastName === 'Candidate') contactPatch.lastName = analysis.lastName
        if (analysis.email && !candidate.email) contactPatch.email = analysis.email
        if (analysis.phone && !candidate.phone) contactPatch.phone = analysis.phone
        if (analysis.language) contactPatch.language = analysis.language

        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            matchScore: analysis.matchScore,
            summary: analysis.summary,
            strengths: JSON.stringify(analysis.strengths),
            weaknesses: JSON.stringify(analysis.weaknesses),
            skills: JSON.stringify(analysis.skills),
            experience: analysis.experience,
            education: analysis.education,
            recommendation: analysis.recommendation,
            analyzedAt: new Date(),
            ...contactPatch,
          },
        })
      } catch (e) {
        console.error('[sync] Analysis failed for', candidate.id, e)
      }
    }
  }

  return 'imported'
}

function mapAtsStatus(atsStatus?: string): string {
  if (!atsStatus) return 'new'
  const s = atsStatus.toLowerCase()
  if (s.includes('hired') || s.includes('offer') || s.includes('accepted')) return 'hired'
  if (s.includes('reject') || s.includes('declined') || s.includes('disqualified')) return 'rejected'
  if (s.includes('interview') || s.includes('shortlist') || s.includes('assessment')) return 'shortlisted'
  if (s.includes('review') || s.includes('screen') || s.includes('phone')) return 'reviewing'
  return 'new'
}

// ── Teamtailor ────────────────────────────────────────────────────────────────

export async function syncTeamtailor(userId: string, apiKey: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const [jobs, applications] = await Promise.all([
      teamtailorFetchJobs(apiKey),
      teamtailorFetchApplications(apiKey, since),
    ])

    const jobMap = new Map(jobs.map(j => [j.id, j]))

    // Get company name from first job or fallback
    const company = jobs[0]?.attributes?.title ? 'Company' : 'Company'

    for (const app of applications) {
      try {
        const jobId = app.relationships?.job?.data?.id
        const candidateId = app.relationships?.candidate?.data?.id
        if (!jobId || !candidateId) continue

        const job = jobMap.get(jobId)
        if (!job) continue

        const vacancyId = await upsertVacancy(userId, jobId, 'teamtailor', {
          title: job.attributes.title,
          description: job.attributes.body || job.attributes.title,
          requirements: job.attributes['human-requirements'] || '',
          company,
        })

        const candidate = await teamtailorFetchCandidate(apiKey, candidateId)
        if (!candidate) continue

        const cvBuffer = app.attributes['cv-url']
          ? await teamtailorDownloadCV(app.attributes['cv-url'], apiKey)
          : null

        const coverLetter = app.attributes['cover-letter-url']
          ? await (async () => {
              try {
                const buf = await teamtailorDownloadCV(app.attributes['cover-letter-url']!, apiKey)
                if (!buf) return undefined
                const text = await parseDocument(buf, 'application/pdf')
                return text || undefined
              } catch { return undefined }
            })()
          : undefined

        const status = await upsertCandidate(userId, 'teamtailor', {
          externalId: `${app.id}`,
          firstName: candidate.attributes['first-name'] || '',
          lastName: candidate.attributes['last-name'] || '',
          email: candidate.attributes.email,
          phone: candidate.attributes.phone,
          linkedIn: candidate.attributes['linkedin-url'],
          cvBuffer,
          cvFileName: cvBuffer ? 'cv.pdf' : undefined,
          motivationText: coverLetter || candidate.attributes.pitch,
          vacancyId,
          atsStatus: app.attributes.stage,
        })

        if (status === 'imported') result.imported++
        else if (status === 'updated') result.updated++
        else result.skipped++
      } catch (e: any) {
        result.errors.push(`App ${app.id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}

// ── Recruitee ─────────────────────────────────────────────────────────────────

export async function syncRecruitee(userId: string, apiKey: string, companySlug: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const [offers, candidates] = await Promise.all([
      recruiteeFetchOffers(apiKey, companySlug),
      recruiteeFetchCandidates(apiKey, companySlug, since),
    ])

    const offerMap = new Map(offers.map(o => [o.id, o]))

    for (const candidate of candidates) {
      try {
        const placements = candidate.placements || []
        if (placements.length === 0) continue

        for (const placement of placements) {
          const offer = offerMap.get(placement.offer_id)
          if (!offer) continue

          const vacancyId = await upsertVacancy(userId, `${offer.id}`, 'recruitee', {
            title: offer.title,
            description: offer.description || offer.title,
            requirements: offer.requirements || '',
            company: companySlug,
            location: offer.location,
          })

          const cvBuffer = placement.cv?.url
            ? await recruiteeDownloadCV(placement.cv.url, apiKey)
            : null

          const email = candidate.emails?.[0]?.address
          const phone = candidate.phones?.[0]?.number
          const linkedIn = candidate.social_links?.find(l => l.type === 'linkedin')?.url

          const nameParts = candidate.name?.split(' ') || []
          const firstName = nameParts[0] || 'Unknown'
          const lastName = nameParts.slice(1).join(' ') || 'Candidate'

          const status = await upsertCandidate(userId, 'recruitee', {
            externalId: `${placement.id}`,
            firstName,
            lastName,
            email,
            phone,
            linkedIn,
            cvBuffer,
            cvFileName: placement.cv?.filename || (cvBuffer ? 'cv.pdf' : undefined),
            motivationText: candidate.cover_letter,
            vacancyId,
            atsStatus: placement.stage?.name,
          })

          if (status === 'imported') result.imported++
          else if (status === 'updated') result.updated++
          else result.skipped++
        }
      } catch (e: any) {
        result.errors.push(`Candidate ${candidate.id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}

// ── SmartRecruiters ───────────────────────────────────────────────────────────

export async function syncSmartRecruiters(userId: string, apiKey: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const [jobs, candidates] = await Promise.all([
      smartrecruitersFetchJobs(apiKey),
      smartrecruitersFetchCandidates(apiKey, since),
    ])

    const jobMap = new Map(jobs.map(j => [j.id, j]))

    for (const candidate of candidates) {
      try {
        const assignment = candidate.primaryAssignment
        if (!assignment) continue

        const jobId = assignment.job?.id
        if (!jobId) continue

        const job = jobMap.get(jobId)
        if (!job) continue

        const vacancyId = await upsertVacancy(userId, jobId, 'smartrecruiters', {
          title: job.title,
          description: job.jobDescription?.text || job.title,
          requirements: job.qualifications?.text || '',
          company: 'Company',
          location: job.location?.city,
        })

        const cvBuffer = await smartrecruitersFetchCandidateCV(apiKey, candidate.id)

        const motivationText = assignment.activeApplication?.answers
          ?.map(a => `${a.questionText}: ${a.answerText}`)
          .join('\n') || undefined

        const status = await upsertCandidate(userId, 'smartrecruiters', {
          externalId: candidate.id,
          firstName: candidate.firstName || 'Unknown',
          lastName: candidate.lastName || 'Candidate',
          email: candidate.email,
          phone: candidate.phoneNumber,
          linkedIn: candidate.web?.linkedIn,
          cvBuffer,
          cvFileName: cvBuffer ? 'cv.pdf' : undefined,
          motivationText,
          vacancyId,
          atsStatus: assignment.status?.label,
        })

        if (status === 'imported') result.imported++
        else if (status === 'updated') result.updated++
        else result.skipped++
      } catch (e: any) {
        result.errors.push(`Candidate ${candidate.id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}
