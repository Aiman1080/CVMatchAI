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
import {
  greenhouseFetchJobs, greenhouseFetchCandidates, greenhouseDownloadCV,
} from './greenhouse'
import {
  leverFetchPostings, leverFetchOpportunities,
} from './lever'
import {
  bullhornFetchJobs, bullhornFetchCandidates,
} from './bullhorn'
import {
  workableFetchJobs, workableFetchCandidates,
} from './workable'
import {
  flatchrFetchJobs, flatchrFetchCandidates, flatchrDownloadCV,
} from './flatchr'
import {
  ashbyFetchJobs, ashbyFetchCandidates,
} from './ashby'
import {
  breezyFetchPositions, breezyFetchCandidates, breezyDownloadCV,
} from './breezyhr'
import {
  homerunFetchJobs, homerunFetchApplications, homerunDownloadCV,
} from './homerun'

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

// ── Greenhouse ───────────────────────────────────────────────────────────────

export async function syncGreenhouse(apiKey: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const [jobs, candidates] = await Promise.all([
      greenhouseFetchJobs(apiKey),
      greenhouseFetchCandidates(apiKey, since),
    ])

    const jobMap = new Map(jobs.map(j => [j.id, j]))

    for (const candidate of candidates) {
      try {
        const applications = candidate.applications || []
        if (applications.length === 0) continue

        for (const app of applications) {
          const jobId = app.job?.id
          if (!jobId) continue

          const job = jobMap.get(jobId)
          if (!job) continue

          const vacancyId = await upsertVacancy(userId, `${job.id}`, 'greenhouse', {
            title: job.name,
            description: job.notes || job.name,
            requirements: '',
            company: 'Greenhouse',
            location: job.offices?.[0]?.location || job.offices?.[0]?.name,
          })

          const cv = await greenhouseDownloadCV(apiKey, candidate.id)

          const email = candidate.emails?.[0]?.value
          const phone = candidate.phone_numbers?.[0]?.value
          const linkedIn = candidate.social_media_addresses?.[0]?.value

          const status = await upsertCandidate(userId, 'greenhouse', {
            externalId: `${app.id}`,
            firstName: candidate.first_name || 'Unknown',
            lastName: candidate.last_name || 'Candidate',
            email,
            phone,
            linkedIn,
            cvBuffer: cv?.buffer || null,
            cvFileName: cv?.filename || (cv ? 'cv.pdf' : undefined),
            vacancyId,
            atsStatus: app.current_stage?.name || app.status,
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

// ── Lever ────────────────────────────────────────────────────────────────────

export async function syncLever(apiKey: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const [postings, opportunities] = await Promise.all([
      leverFetchPostings(apiKey),
      leverFetchOpportunities(apiKey, since),
    ])

    const postingMap = new Map(postings.map(p => [p.id, p]))

    for (const opp of opportunities) {
      try {
        const postingIds = opp.postings || []
        if (postingIds.length === 0) continue

        for (const postingId of postingIds) {
          const posting = postingMap.get(postingId)
          if (!posting) continue

          const description = posting.content?.description || posting.text
          const requirements = posting.content?.lists
            ?.map(l => `${l.text}: ${l.content}`)
            .join('\n') || ''

          const vacancyId = await upsertVacancy(userId, posting.id, 'lever', {
            title: posting.text,
            description,
            requirements,
            company: 'Lever',
            location: posting.categories?.location,
          })

          const nameParts = opp.name?.split(' ') || []
          const firstName = nameParts[0] || 'Unknown'
          const lastName = nameParts.slice(1).join(' ') || 'Candidate'

          const email = opp.emails?.[0]
          const phone = opp.phones?.[0]?.value
          const linkedIn = opp.links?.find(l => l.includes('linkedin'))

          const status = await upsertCandidate(userId, 'lever', {
            externalId: opp.id,
            firstName,
            lastName,
            email,
            phone,
            linkedIn,
            cvBuffer: null,
            vacancyId,
            atsStatus: opp.stage,
          })

          if (status === 'imported') result.imported++
          else if (status === 'updated') result.updated++
          else result.skipped++
        }
      } catch (e: any) {
        result.errors.push(`Opportunity ${opp.id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}

// ── Bullhorn ─────────────────────────────────────────────────────────────────

export async function syncBullhorn(apiKey: string, restUrl: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const [jobs, candidates] = await Promise.all([
      bullhornFetchJobs(apiKey, restUrl),
      bullhornFetchCandidates(apiKey, restUrl, since),
    ])

    // Create vacancies for all open jobs
    const jobVacancyMap = new Map<number, string>()
    for (const job of jobs) {
      const vacancyId = await upsertVacancy(userId, `${job.id}`, 'bullhorn', {
        title: job.title,
        description: job.publicDescription || job.title,
        requirements: job.skillList || '',
        company: job.clientCorporation?.name || 'Bullhorn',
        location: job.address?.city,
      })
      jobVacancyMap.set(job.id, vacancyId)
    }

    // Use the first job as fallback vacancy if no specific mapping
    const fallbackVacancyId = jobVacancyMap.values().next().value

    for (const candidate of candidates) {
      try {
        const vacancyId = fallbackVacancyId
        if (!vacancyId) continue

        const status = await upsertCandidate(userId, 'bullhorn', {
          externalId: `${candidate.id}`,
          firstName: candidate.firstName || 'Unknown',
          lastName: candidate.lastName || 'Candidate',
          email: candidate.email,
          phone: candidate.phone,
          cvBuffer: null,
          vacancyId,
          atsStatus: candidate.status,
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

// ── Workable ─────────────────────────────────────────────────────────────────

export async function syncWorkable(apiKey: string, subdomain: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const jobs = await workableFetchJobs(apiKey, subdomain)

    for (const job of jobs) {
      try {
        const vacancyId = await upsertVacancy(userId, job.id, 'workable', {
          title: job.title,
          description: job.description || job.title,
          requirements: job.requirements || '',
          company: subdomain,
          location: job.location?.city,
        })

        const candidates = await workableFetchCandidates(apiKey, subdomain, job.shortcode)

        for (const candidate of candidates) {
          try {
            if (since && new Date(candidate.created_at) < since) continue

            const nameParts = candidate.name?.split(' ') || []
            const firstName = candidate.firstname || nameParts[0] || 'Unknown'
            const lastName = candidate.lastname || nameParts.slice(1).join(' ') || 'Candidate'

            const status = await upsertCandidate(userId, 'workable', {
              externalId: candidate.id,
              firstName,
              lastName,
              email: candidate.email,
              phone: candidate.phone,
              linkedIn: candidate.profile_url,
              cvBuffer: null,
              motivationText: candidate.summary,
              vacancyId,
              atsStatus: candidate.disqualified ? 'disqualified' : candidate.stage,
            })

            if (status === 'imported') result.imported++
            else if (status === 'updated') result.updated++
            else result.skipped++
          } catch (e: any) {
            result.errors.push(`Candidate ${candidate.id}: ${e.message}`)
          }
        }
      } catch (e: any) {
        result.errors.push(`Job ${job.id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}

// ── Flatchr ──────────────────────────────────────────────────────────────────

export async function syncFlatchr(apiKey: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const jobs = await flatchrFetchJobs(apiKey)

    for (const job of jobs) {
      try {
        const vacancyId = await upsertVacancy(userId, job.id, 'flatchr', {
          title: job.title,
          description: job.description || job.title,
          requirements: job.requirements || '',
          company: 'Flatchr',
          location: job.location,
        })

        const candidates = await flatchrFetchCandidates(apiKey, job.id)

        for (const candidate of candidates) {
          try {
            if (since && new Date(candidate.created_at) < since) continue

            const cvBuffer = candidate.cv_url
              ? await flatchrDownloadCV(candidate.cv_url, apiKey)
              : null

            const status = await upsertCandidate(userId, 'flatchr', {
              externalId: candidate.id,
              firstName: candidate.first_name || 'Unknown',
              lastName: candidate.last_name || 'Candidate',
              email: candidate.email,
              phone: candidate.phone,
              cvBuffer,
              cvFileName: cvBuffer ? 'cv.pdf' : undefined,
              vacancyId,
              atsStatus: candidate.status,
            })

            if (status === 'imported') result.imported++
            else if (status === 'updated') result.updated++
            else result.skipped++
          } catch (e: any) {
            result.errors.push(`Candidate ${candidate.id}: ${e.message}`)
          }
        }
      } catch (e: any) {
        result.errors.push(`Job ${job.id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}

// ── Ashby ───────────────────────────────────────────────────────────────────

export async function syncAshby(apiKey: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const [jobs, candidates] = await Promise.all([
      ashbyFetchJobs(apiKey),
      ashbyFetchCandidates(apiKey, since),
    ])

    const jobMap = new Map(jobs.map(j => [j.jobId || j.id, j]))

    for (const candidate of candidates) {
      try {
        // Use the first job as fallback if candidate has no specific job link
        const firstJob = jobs[0]
        if (!firstJob) continue

        const job = firstJob
        const vacancyId = await upsertVacancy(userId, job.id, 'ashby', {
          title: job.title,
          description: job.content || job.title,
          requirements: '',
          company: 'Ashby',
          location: job.locationName,
        })

        const nameParts = candidate.name?.split(' ') || []
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || 'Candidate'
        const email = candidate.primaryEmailAddress?.value
        const phone = candidate.primaryPhoneNumber?.value
        const linkedIn = candidate.socialLinks?.find(l => l.type === 'LinkedIn')?.url

        const status = await upsertCandidate(userId, 'ashby', {
          externalId: candidate.id,
          firstName,
          lastName,
          email,
          phone,
          linkedIn,
          cvBuffer: null,
          vacancyId,
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

// ── Breezy HR ───────────────────────────────────────────────────────────────

export async function syncBreezy(apiKey: string, companyId: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const positions = await breezyFetchPositions(apiKey, companyId)

    for (const position of positions) {
      try {
        const vacancyId = await upsertVacancy(userId, position._id, 'breezyhr', {
          title: position.name,
          description: position.description || position.name,
          requirements: '',
          company: companyId,
          location: position.location?.city,
        })

        const candidates = await breezyFetchCandidates(apiKey, companyId, position._id)

        for (const candidate of candidates) {
          try {
            if (since && candidate.creation_date && new Date(candidate.creation_date) < since) continue

            const nameParts = candidate.name?.split(' ') || []
            const firstName = nameParts[0] || 'Unknown'
            const lastName = nameParts.slice(1).join(' ') || 'Candidate'

            const cvBuffer = candidate.resume?.url
              ? await breezyDownloadCV(candidate.resume.url, apiKey)
              : null

            const status = await upsertCandidate(userId, 'breezyhr', {
              externalId: candidate._id,
              firstName,
              lastName,
              email: candidate.email_address,
              phone: candidate.phone_number,
              linkedIn: candidate.profile_url,
              cvBuffer,
              cvFileName: candidate.resume?.file_name || (cvBuffer ? 'cv.pdf' : undefined),
              motivationText: candidate.summary,
              vacancyId,
              atsStatus: candidate.stage?.name,
            })

            if (status === 'imported') result.imported++
            else if (status === 'updated') result.updated++
            else result.skipped++
          } catch (e: any) {
            result.errors.push(`Candidate ${candidate._id}: ${e.message}`)
          }
        }
      } catch (e: any) {
        result.errors.push(`Position ${position._id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}

// ── Homerun ─────────────────────────────────────────────────────────────────

export async function syncHomerun(apiKey: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [] }
  try {
    const jobs = await homerunFetchJobs(apiKey)

    for (const job of jobs) {
      try {
        const vacancyId = await upsertVacancy(userId, job.id, 'homerun', {
          title: job.title,
          description: job.description || job.title,
          requirements: '',
          company: 'Homerun',
          location: job.location,
        })

        const applications = await homerunFetchApplications(apiKey, job.id)

        for (const app of applications) {
          try {
            if (since && new Date(app.created_at) < since) continue

            const cvBuffer = app.resume_url
              ? await homerunDownloadCV(app.resume_url, apiKey)
              : null

            const status = await upsertCandidate(userId, 'homerun', {
              externalId: app.id,
              firstName: app.first_name || 'Unknown',
              lastName: app.last_name || 'Candidate',
              email: app.email,
              phone: app.phone,
              linkedIn: app.linkedin_url,
              cvBuffer,
              cvFileName: app.resume_filename || (cvBuffer ? 'cv.pdf' : undefined),
              motivationText: app.cover_letter,
              vacancyId,
              atsStatus: app.stage,
            })

            if (status === 'imported') result.imported++
            else if (status === 'updated') result.updated++
            else result.skipped++
          } catch (e: any) {
            result.errors.push(`Application ${app.id}: ${e.message}`)
          }
        }
      } catch (e: any) {
        result.errors.push(`Job ${job.id}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}
