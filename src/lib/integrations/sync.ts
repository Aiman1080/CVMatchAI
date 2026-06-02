// Core sync engine - pulls candidates from an ATS and creates/updates them in DeltaMatch
import prisma from '@/lib/prisma'
import { parseDocument } from '@/lib/pdf-parser'
import { persistDocument } from '@/lib/storage'
import { analyzeCVAgainstVacancy } from '@/lib/ai'
import {
  teamtailorFetchJobs, teamtailorFetchApplications, teamtailorFetchCandidate,
  teamtailorDownloadCV, teamtailorFetchCompanyName,
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
  leverFetchPostings, leverFetchOpportunities, leverFetchResume, leverDownloadCV,
  type LeverApplication,
} from './lever'
import {
  bullhornFetchJobs, bullhornFetchCandidates, bullhornFetchJobSubmissions,
} from './bullhorn'
import {
  workableFetchJobs, workableFetchCandidates,
} from './workable'
import {
  flatchrFetchJobs, flatchrFetchCandidates, flatchrDownloadCV,
} from './flatchr'
import {
  ashbyFetchJobs, ashbyFetchCandidates, ashbyFetchApplications, ashbyFileUrl, ashbyDownloadCV,
  type AshbyJobPosting, type AshbyApplication,
} from './ashby'
import {
  breezyFetchPositions, breezyFetchCandidates, breezyDownloadCV,
} from './breezyhr'
import {
  homerunFetchJobs, homerunFetchApplications, homerunDownloadCV,
} from './homerun'
import {
  personioFetchJobs, personioFetchApplications, personioDownloadCV,
} from './personio'
import {
  icimsFetchJobs, icimsFetchCandidates, icimsDownloadCV,
} from './icims'
import {
  softgardenFetchJobs, softgardenFetchApplications, softgardenDownloadCV,
} from './softgarden'

export interface SyncResult {
  imported: number
  updated: number
  skipped: number
  errors: string[]
  duplicatesDetected: number
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 2))
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 2))
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length
  const union = new Set([...wordsA, ...wordsB]).size
  return union > 0 ? intersection / union : 0
}

// Ensure a DeltaMatch vacancy exists for an external job, returns its id
// and whether a similar manual vacancy was found and linked (duplicate detection)
async function upsertVacancy(userId: string, externalId: string, platform: string, job: {
  title: string; description: string; requirements: string; company: string; location?: string
}): Promise<{ id: string; similarMatch: boolean }> {
  const existing = await prisma.vacancy.findFirst({
    where: { userId, externalId, externalSource: platform },
  })
  if (existing) return { id: existing.id, similarMatch: false }

  // Check if a similar vacancy already exists (same user, similar title)
  const existingVacancies = await prisma.vacancy.findMany({
    where: { userId, externalId: null }, // Only manual vacancies (no externalId)
    select: { id: true, title: true, company: true },
  })

  for (const ev of existingVacancies) {
    const similarity = calculateSimilarity(ev.title.toLowerCase(), job.title.toLowerCase())
    if (similarity > 0.7) {
      // Link the existing vacancy to this external source instead of creating a new one
      await prisma.vacancy.update({
        where: { id: ev.id },
        data: { externalId, externalSource: platform },
      })
      return { id: ev.id, similarMatch: true }
    }
  }

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
  return { id: created.id, similarMatch: false }
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
  let cvMimeType: string | null = null

  if (data.cvBuffer) {
    try {
      cvMimeType = cvFileName?.endsWith('.pdf') ? 'application/pdf'
        : cvFileName?.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/octet-stream'
      // Fallback when the ATS didn't provide a filename: sniff PDF/DOCX magic bytes
      if (cvMimeType === 'application/octet-stream') {
        const head4 = data.cvBuffer.slice(0, 4)
        if (head4.toString('utf-8') === '%PDF') cvMimeType = 'application/pdf'
        else if (head4.toString('hex').toLowerCase().startsWith('504b0304')) {
          cvMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      }
      cvContent = await parseDocument(data.cvBuffer, cvMimeType)
      if (cvContent && cvContent.trim().length < 50) cvContent = null
    } catch {
      cvContent = null
    }
  }

  const cvDoc = data.cvBuffer
    ? await persistDocument(data.cvBuffer, cvMimeType || 'application/octet-stream', 'cv')
    : null

  const candidate = await prisma.candidate.create({
    data: {
      firstName: data.firstName || 'Unknown',
      lastName: data.lastName || 'Candidate',
      email: data.email || null,
      phone: data.phone || null,
      linkedIn: data.linkedIn || null,
      cvContent,
      cvFileName,
      // Also persist the original binary so the recruiter can preview the real
      // PDF/DOCX in the candidate detail page - not just the extracted text.
      // ATS adapters that don't download the file (cvBuffer null) fall back to
      // text-only view, with the amber notice shown by DocumentViewer.
      cvFile: cvDoc?.fileBytes ?? undefined,
      cvStoragePath: cvDoc?.storagePath ?? undefined,
      cvMimeType: data.cvBuffer ? (cvMimeType || 'application/octet-stream') : undefined,
      motivationText: data.motivationText || null,
      status: mapAtsStatus(data.atsStatus),
      source: platform,
      externalId: data.externalId,
      externalSource: platform,
      gdprConsent: true,
      gdprConsentDate: new Date(),
      vacancyId: data.vacancyId,
      userId,
      summary: !cvContent ? `Imported from ${platform} without CV. AI analysis not available - please upload the CV manually for full scoring.` : undefined,
      notes: !cvContent ? `⚠️ No CV available from ${platform}. Upload the CV manually to get AI analysis.${!data.motivationText ? ' No motivation letter available either.' : ''}` : undefined,
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
  // Hired / Offer
  if (s.includes('hired') || s.includes('offer') || s.includes('accepted') || s.includes('onboarding') || s.includes('placed') || s.includes('aangenomen') || s.includes('embauché') || s.includes('eingestellt')) return 'hired'
  // Rejected
  if (s.includes('reject') || s.includes('declined') || s.includes('disqualified') || s.includes('withdrawn') || s.includes('not selected') || s.includes('afgewezen') || s.includes('refusé') || s.includes('abgelehnt') || s.includes('closed') || s.includes('archived')) return 'rejected'
  // Shortlisted / Interview
  if (s.includes('interview') || s.includes('shortlist') || s.includes('assessment') || s.includes('final') || s.includes('second') || s.includes('on-site') || s.includes('onsite') || s.includes('entretien') || s.includes('gesprek') || s.includes('vorstellungsgespräch') || s.includes('selected') || s.includes('qualified')) return 'shortlisted'
  // Reviewing / Screening
  if (s.includes('review') || s.includes('screen') || s.includes('phone') || s.includes('applied') || s.includes('received') || s.includes('submitted') || s.includes('in progress') || s.includes('in behandeling') || s.includes('en cours') || s.includes('consideration') || s.includes('pre-screen') || s.includes('initial')) return 'reviewing'
  // New / Default
  if (s.includes('new') || s.includes('lead') || s.includes('prospect') || s.includes('sourced') || s.includes('open') || s.includes('active') || s.includes('nieuw') || s.includes('nouveau')) return 'new'
  return 'new'
}

// ── Teamtailor ────────────────────────────────────────────────────────────────

export async function syncTeamtailor(userId: string, apiKey: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const [jobs, applications, companyName] = await Promise.all([
      teamtailorFetchJobs(apiKey),
      teamtailorFetchApplications(apiKey, since),
      teamtailorFetchCompanyName(apiKey),
    ])

    const jobMap = new Map(jobs.map(j => [j.id, j]))

    // Use the actual company name from Teamtailor's /company endpoint;
    // fall back to the user's own company on file, or an empty string.
    let company = companyName || ''
    if (!company) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { company: true } })
      company = user?.company || ''
    }

    for (const app of applications) {
      try {
        const jobId = app.relationships?.job?.data?.id
        const candidateId = app.relationships?.candidate?.data?.id
        if (!jobId || !candidateId) continue

        const job = jobMap.get(jobId)
        if (!job) continue

        const vacancyResult = await upsertVacancy(userId, jobId, 'teamtailor', {
          title: job.attributes.title,
          description: job.attributes.body || job.attributes.title,
          requirements: '',
          company,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        const candidate = await teamtailorFetchCandidate(apiKey, candidateId)
        if (!candidate) continue

        // The CV lives on the candidate (resume = converted PDF, original-resume =
        // the original file), exposed as a short-lived pre-signed URL.
        const resumeUrl = candidate.attributes.resume || candidate.attributes['original-resume']
        const cvBuffer = resumeUrl ? await teamtailorDownloadCV(resumeUrl, apiKey) : null
        const cvFileName = resumeUrl
          ? (resumeUrl.split('?')[0].split('/').pop() || 'cv.pdf')
          : undefined

        const status = await upsertCandidate(userId, 'teamtailor', {
          externalId: `${app.id}`,
          firstName: candidate.attributes['first-name'] || '',
          lastName: candidate.attributes['last-name'] || '',
          email: candidate.attributes.email,
          phone: candidate.attributes.phone,
          linkedIn: candidate.attributes['linkedin-url'],
          cvBuffer,
          cvFileName,
          motivationText: app.attributes['cover-letter'] || candidate.attributes.pitch,
          vacancyId,
          atsStatus: app.stageName,
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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
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

          const vacancyResult = await upsertVacancy(userId, `${offer.id}`, 'recruitee', {
            title: offer.title,
            description: offer.description || offer.title,
            requirements: offer.requirements || '',
            company: companySlug,
            location: offer.location,
          })
          const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
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

        const vacancyResult = await upsertVacancy(userId, jobId, 'smartrecruiters', {
          title: job.title,
          description: job.jobDescription?.text || job.title,
          requirements: job.qualifications?.text || '',
          company: 'Company',
          location: job.location?.city,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
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

          const vacancyResult = await upsertVacancy(userId, `${job.id}`, 'greenhouse', {
            title: job.name,
            description: job.notes || job.name,
            requirements: '',
            company: 'Greenhouse',
            location: job.offices?.[0]?.location || job.offices?.[0]?.name,
          })
          const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const [postings, opportunities] = await Promise.all([
      leverFetchPostings(apiKey),
      leverFetchOpportunities(apiKey, since),
    ])

    const postingMap = new Map(postings.map(p => [p.id, p]))

    for (const opp of opportunities) {
      try {
        // The opportunity has no `postings` field; the posting is on its applications
        // (expanded). Use the first application that references a posting.
        const apps = Array.isArray(opp.applications) ? opp.applications : []
        const app = apps.find((a): a is LeverApplication => !!a && typeof a === 'object' && !!a.posting)
        const postingId = app?.posting
        if (!postingId) { result.skipped++; continue }

        const posting = postingMap.get(postingId)
        if (!posting) { result.skipped++; continue }

        const description = posting.content?.description || posting.text
        const requirements = posting.content?.lists
          ?.map(l => `${l.text}: ${l.content}`)
          .join('\n') || ''

        const vacancyResult = await upsertVacancy(userId, posting.id, 'lever', {
          title: posting.text,
          description,
          requirements,
          company: 'Lever',
          location: posting.categories?.location,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        const nameParts = opp.name?.split(' ') || []
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || 'Candidate'

        const email = opp.emails?.[0] || app?.email
        const phone = opp.phones?.[0]?.value || app?.phone?.value
        const linkedIn = opp.links?.find(l => l.includes('linkedin'))
        // `stage` is a UID string unless expanded; with expand=stage it is { id, text }.
        const stageName = typeof opp.stage === 'object' && opp.stage ? opp.stage.text : undefined

        // CV: fetch the resume only when one is referenced (avoids an extra call per
        // resume-less candidate). resumes -> download endpoint -> binary.
        let cvBuffer: Buffer | null = null
        let cvFileName: string | undefined
        if (opp.resume || app?.resume) {
          const resume = await leverFetchResume(apiKey, opp.id)
          if (resume?.id) {
            cvBuffer = await leverDownloadCV(apiKey, opp.id, resume.id)
            cvFileName = resume.file?.name || (resume.file?.ext ? `cv.${resume.file.ext}` : undefined)
          }
        }

        const status = await upsertCandidate(userId, 'lever', {
          externalId: opp.id,
          firstName,
          lastName,
          email,
          phone,
          linkedIn,
          cvBuffer,
          cvFileName,
          motivationText: app?.comments,
          vacancyId,
          atsStatus: stageName,
        })

        if (status === 'imported') result.imported++
        else if (status === 'updated') result.updated++
        else result.skipped++
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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const [jobs, candidates, submissions] = await Promise.all([
      bullhornFetchJobs(apiKey, restUrl),
      bullhornFetchCandidates(apiKey, restUrl, since),
      bullhornFetchJobSubmissions(apiKey, restUrl, since),
    ])

    // Create vacancies for all open jobs
    const jobVacancyMap = new Map<number, string>()
    for (const job of jobs) {
      const vacancyResult = await upsertVacancy(userId, `${job.id}`, 'bullhorn', {
        title: job.title,
        description: job.publicDescription || job.title,
        requirements: job.skillList || '',
        company: job.clientCorporation?.name || 'Bullhorn',
        location: job.address?.city,
      })
      const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++
      jobVacancyMap.set(job.id, vacancyId)
    }

    // Build candidateId -> most recent jobId mapping from submissions
    // If a candidate has multiple submissions, pick the most recent (highest dateAdded)
    const candidateJobMap = new Map<number, { jobId: number; dateAdded: number; status?: string }>()
    for (const sub of submissions) {
      const candId = sub.candidate?.id
      const jobId = sub.jobOrder?.id
      if (!candId || !jobId) continue
      const existing = candidateJobMap.get(candId)
      if (!existing || sub.dateAdded > existing.dateAdded) {
        candidateJobMap.set(candId, { jobId, dateAdded: sub.dateAdded, status: sub.status })
      }
    }

    for (const candidate of candidates) {
      try {
        const link = candidateJobMap.get(candidate.id)
        if (!link) {
          // No job submission for this candidate - skip rather than incorrectly link to first job
          result.skipped++
          continue
        }
        const vacancyId = jobVacancyMap.get(link.jobId)
        if (!vacancyId) {
          // Candidate's job isn't in our synced list (e.g. closed job) - skip
          result.skipped++
          continue
        }

        const status = await upsertCandidate(userId, 'bullhorn', {
          externalId: `${candidate.id}`,
          firstName: candidate.firstName || 'Unknown',
          lastName: candidate.lastName || 'Candidate',
          email: candidate.email,
          phone: candidate.phone,
          cvBuffer: null,
          vacancyId,
          atsStatus: link.status || candidate.status,
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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const jobs = await workableFetchJobs(apiKey, subdomain)

    for (const job of jobs) {
      try {
        const vacancyResult = await upsertVacancy(userId, job.id, 'workable', {
          title: job.title,
          description: job.description || job.title,
          requirements: job.requirements || '',
          company: subdomain,
          location: job.location?.city,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const jobs = await flatchrFetchJobs(apiKey)

    for (const job of jobs) {
      try {
        const vacancyResult = await upsertVacancy(userId, job.id, 'flatchr', {
          title: job.title,
          description: job.description || job.title,
          requirements: job.requirements || '',
          company: 'Flatchr',
          location: job.location,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    // Applications carry the candidate + job inline; candidates carry the resume
    // file handle; postings are only used to enrich the vacancy location.
    const [candidates, applications, postings] = await Promise.all([
      ashbyFetchCandidates(apiKey),
      ashbyFetchApplications(apiKey, since),
      ashbyFetchJobs(apiKey).catch(() => [] as AshbyJobPosting[]),
    ])

    const candById = new Map(candidates.map(c => [c.id, c]))
    const postingByJobId = new Map<string, AshbyJobPosting>()
    for (const p of postings) {
      const key = p.jobId || p.id
      if (key && !postingByJobId.has(key)) postingByJobId.set(key, p)
    }

    // Keep only the most recent application per candidate (a candidate may apply
    // to several jobs). Applications without a candidate+job are unusable.
    const bestApp = new Map<string, AshbyApplication>()
    for (const a of applications) {
      if (!a.candidateId || !a.jobId) continue
      const prev = bestApp.get(a.candidateId)
      const ts = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const prevTs = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0
      if (!prev || ts >= prevTs) bestApp.set(a.candidateId, a)
    }

    const jobVacancyMap = new Map<string, string>()
    for (const [candidateId, app] of bestApp) {
      try {
        const jobId = app.jobId as string
        let vacancyId = jobVacancyMap.get(jobId)
        if (!vacancyId) {
          const posting = postingByJobId.get(jobId)
          const vacancyResult = await upsertVacancy(userId, jobId, 'ashby', {
            title: app.jobTitle || posting?.title || 'Untitled role',
            description: app.jobTitle || posting?.title || 'Imported from Ashby',
            requirements: '',
            company: 'Ashby',
            location: posting?.locationName,
          })
          vacancyId = vacancyResult.id
          if (vacancyResult.similarMatch) result.duplicatesDetected++
          jobVacancyMap.set(jobId, vacancyId)
        }

        const cand = candById.get(candidateId)
        const fullName = (app.candidateName || cand?.name || '').trim()
        const nameParts = fullName ? fullName.split(/\s+/) : []
        const firstName = nameParts[0] || 'Unknown'
        const lastName = nameParts.slice(1).join(' ') || 'Candidate'
        const email = app.email || cand?.primaryEmailAddress?.value
        const phone = app.phone || cand?.primaryPhoneNumber?.value
        const linkedIn = cand?.socialLinks?.find(l => /linkedin/i.test(l.type || '') || /linkedin/i.test(l.url || ''))?.url

        // Resume: resumeFileHandle.handle -> file.info -> pre-signed URL -> download.
        let cvBuffer: Buffer | null = null
        let cvFileName: string | undefined
        const handle = cand?.resumeFileHandle?.handle
        if (handle) {
          const url = await ashbyFileUrl(apiKey, handle)
          if (url) {
            cvBuffer = await ashbyDownloadCV(url)
            cvFileName = cand?.resumeFileHandle?.name
          }
        }

        const status = await upsertCandidate(userId, 'ashby', {
          externalId: candidateId,
          firstName,
          lastName,
          email,
          phone,
          linkedIn,
          cvBuffer,
          cvFileName,
          vacancyId,
          atsStatus: app.stageName || app.status,
        })

        if (status === 'imported') result.imported++
        else if (status === 'updated') result.updated++
        else result.skipped++
      } catch (e: any) {
        result.errors.push(`Candidate ${candidateId}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}

// ── Breezy HR ───────────────────────────────────────────────────────────────

export async function syncBreezy(apiKey: string, companyId: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const positions = await breezyFetchPositions(apiKey, companyId)

    for (const position of positions) {
      try {
        const vacancyResult = await upsertVacancy(userId, position._id, 'breezyhr', {
          title: position.name,
          description: position.description || position.name,
          requirements: '',
          company: companyId,
          location: position.location?.city,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

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
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const jobs = await homerunFetchJobs(apiKey)

    for (const job of jobs) {
      try {
        const vacancyResult = await upsertVacancy(userId, job.id, 'homerun', {
          title: job.title,
          description: job.description || job.title,
          requirements: '',
          company: 'Homerun',
          location: job.location,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

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

// ── Personio ───────────────────────────────────────────────────────────────

export async function syncPersonio(apiKey: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const jobs = await personioFetchJobs(apiKey)

    for (const job of jobs) {
      try {
        const vacancyResult = await upsertVacancy(userId, `${job.id}`, 'personio', {
          title: job.name,
          description: job.description || job.name,
          requirements: '',
          company: 'Personio',
          location: job.office,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        const applications = await personioFetchApplications(apiKey, job.id)

        for (const app of applications) {
          try {
            if (since && new Date(app.created_at) < since) continue

            const cv = await personioDownloadCV(apiKey, app.id)

            const status = await upsertCandidate(userId, 'personio', {
              externalId: `${app.id}`,
              firstName: app.first_name || 'Unknown',
              lastName: app.last_name || 'Candidate',
              email: app.email,
              phone: app.phone,
              cvBuffer: cv?.buffer || null,
              cvFileName: cv?.filename || (cv ? 'cv.pdf' : undefined),
              vacancyId,
              atsStatus: app.status,
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

// ── iCIMS ─────────────────────────────────────────────────────────────────

export async function syncIcims(apiKey: string, customerId: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const jobs = await icimsFetchJobs(apiKey, customerId)

    for (const job of jobs) {
      try {
        const vacancyResult = await upsertVacancy(userId, `${job.id}`, 'icims', {
          title: job.title,
          description: job.description || job.title,
          requirements: '',
          company: 'iCIMS',
          location: job.jobLocation,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        const workflows = await icimsFetchCandidates(apiKey, customerId, job.id)

        for (const wf of workflows) {
          try {
            if (since && new Date(wf.createdDate) < since) continue

            const cv = await icimsDownloadCV(apiKey, customerId, wf.person.id)

            const status = await upsertCandidate(userId, 'icims', {
              externalId: `${wf.id}`,
              firstName: 'Unknown',
              lastName: 'Candidate',
              cvBuffer: cv?.buffer || null,
              cvFileName: cv?.filename || (cv ? 'cv.pdf' : undefined),
              vacancyId,
              atsStatus: wf.status,
            })

            if (status === 'imported') result.imported++
            else if (status === 'updated') result.updated++
            else result.skipped++
          } catch (e: any) {
            result.errors.push(`Workflow ${wf.id}: ${e.message}`)
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

// ── Softgarden ────────────────────────────────────────────────────────────

export async function syncSoftgarden(apiKey: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const jobs = await softgardenFetchJobs(apiKey)

    for (const job of jobs) {
      try {
        const vacancyResult = await upsertVacancy(userId, `${job.id}`, 'softgarden', {
          title: job.jobName,
          description: job.jobDescription || job.jobName,
          requirements: '',
          company: 'Softgarden',
          location: job.jobLocation,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        const applications = await softgardenFetchApplications(apiKey, job.id)

        for (const app of applications) {
          try {
            if (since && new Date(app.createdOn) < since) continue

            const cv = await softgardenDownloadCV(apiKey, app.id)

            const status = await upsertCandidate(userId, 'softgarden', {
              externalId: `${app.id}`,
              firstName: app.firstname || 'Unknown',
              lastName: app.lastname || 'Candidate',
              email: app.email,
              phone: app.phone,
              cvBuffer: cv?.buffer || null,
              cvFileName: cv?.filename || (cv ? 'cv.pdf' : undefined),
              vacancyId,
              atsStatus: app.status,
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

// ============================================================================
// Demo ATS sync - fabricates a couple of realistic jobs + candidates so a user
// (or a sales demo) can see the full ATS pipeline (import -> AI analysis -> kanban)
// WITHOUT any external ATS account or API key. It runs through the SAME upsert
// path as a real sync, so it genuinely exercises the integration code. Idempotent:
// dedup by externalId means re-running just skips rows that already exist.
// ============================================================================

const DEMO_ATS_PLATFORM = 'demo'

const DEMO_ATS_JOBS = [
  {
    externalId: 'demo-job-dev',
    title: 'Senior Full-Stack Developer',
    company: 'DemoTech (demo)',
    location: 'Brussels, BE',
    description: 'We are looking for a senior full-stack developer to help build and scale our SaaS platform. You will own features end to end across a React/TypeScript frontend and a Node.js backend, and mentor junior engineers.',
    requirements: 'React, TypeScript, Node.js, PostgreSQL, REST APIs, Docker, AWS. 5+ years of experience.',
  },
  {
    externalId: 'demo-job-mkt',
    title: 'Marketing Manager',
    company: 'DemoTech (demo)',
    location: 'Amsterdam, NL',
    description: 'Own our B2B marketing: demand generation, content, paid acquisition and product marketing. Define the strategy and run campaigns across channels.',
    requirements: 'B2B SaaS marketing, demand generation, Google Ads, Meta Ads, SEO, HubSpot, analytics. 4+ years of experience.',
  },
]

const DEMO_ATS_CANDIDATES = [
  {
    externalId: 'demo-cand-alex', jobExternalId: 'demo-job-dev', status: 'shortlisted',
    firstName: 'Alex', lastName: 'Janssens', email: 'alex.janssens@demo-ats.example', phone: '+32 471 00 00 01',
    cvText: `Alex Janssens
alex.janssens@demo-ats.example | +32 471 00 00 01 | Leuven, Belgium

EXPERIENCE
Senior Software Engineer - FinTech Brussels (2019-present)
- Built a React/TypeScript frontend for a banking dashboard serving 150,000 users
- Designed Node.js microservices (REST + gRPC), PostgreSQL with 10M+ records
- Deployed on AWS EKS with Docker and Kubernetes

Software Engineer - Consulting Bruges (2016-2019)
- Vue.js + PHP/Laravel ERP modules, third-party API integrations

EDUCATION
MSc Software Engineering - KU Leuven (2016)

SKILLS
React, TypeScript, Node.js, PostgreSQL, Docker, Kubernetes, AWS, Redis`,
    motivationText: 'I would love to bring my 7+ years of React/Node experience to your team and help scale your platform.',
  },
  {
    externalId: 'demo-cand-nina', jobExternalId: 'demo-job-dev', status: 'reviewing',
    firstName: 'Nina', lastName: 'Schmidt', email: 'nina.schmidt@demo-ats.example', phone: '+49 176 99 98 88',
    cvText: `Nina Schmidt
nina.schmidt@demo-ats.example | Berlin, Germany

EXPERIENCE
Full-Stack Developer - Berlin SaaS (2022-present)
- React/Next.js + TypeScript frontend, Node.js REST APIs, PostgreSQL
- Deployed on AWS with Docker

Junior Developer - Web Agency Hamburg (2020-2022)
- React and Vue.js websites, WordPress

EDUCATION
BSc Computer Science - TU Berlin (2020)

SKILLS
React, Next.js, TypeScript, Node.js, PostgreSQL, Docker, AWS`,
    motivationText: '',
  },
  {
    externalId: 'demo-cand-maya', jobExternalId: 'demo-job-mkt', status: 'new',
    firstName: 'Maya', lastName: 'Patel', email: 'maya.patel@demo-ats.example', phone: '+44 7911 23 45 67',
    cvText: `Maya Patel
maya.patel@demo-ats.example | London, UK

EXPERIENCE
B2B Marketing Manager - SaaS Scale-up London (2020-present)
- Owned demand generation: Google Ads, Meta Ads, LinkedIn; tripled pipeline in 2 years
- Built a content + SEO engine and marketing automation in HubSpot
- Managed a team of 3 and a EUR 1.2M annual budget

Growth Marketer - Startup (2017-2020)
- Paid acquisition, landing pages, A/B testing, analytics

EDUCATION
BA Marketing - University of Manchester (2017)

SKILLS
Demand generation, Google Ads, Meta Ads, SEO, HubSpot, analytics, content`,
    motivationText: 'Your product marketing role is exactly the B2B SaaS challenge I am looking for.',
  },
  {
    externalId: 'demo-cand-tom', jobExternalId: 'demo-job-mkt', status: 'reviewing',
    firstName: 'Tom', lastName: 'De Vos', email: 'tom.devos@demo-ats.example', phone: '+32 478 11 22 33',
    cvText: `Tom De Vos
tom.devos@demo-ats.example | Antwerp, Belgium

EXPERIENCE
Marketing Assistant - Retail Brand Antwerp (2022-present)
- Social media content, email newsletters (Mailchimp), basic Google Ads
- Helped organize trade shows and events

EDUCATION
Bachelor Communication - AP Hogeschool Antwerp (2022)

SKILLS
Social media, Mailchimp, Canva, basic Google Ads, content writing, Dutch/English`,
    motivationText: 'I am eager to grow into a B2B marketing role and learn from an experienced team.',
  },
]

// Run a fake ATS sync for the given user: creates the demo jobs + candidates
// through the real upsert pipeline (CV text -> parsing -> AI analysis -> kanban).
export async function syncDemoAts(userId: string): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  const jobIdByExternal: Record<string, string> = {}
  try {
    for (const job of DEMO_ATS_JOBS) {
      const v = await upsertVacancy(userId, job.externalId, DEMO_ATS_PLATFORM, {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        company: job.company,
        location: job.location,
      })
      jobIdByExternal[job.externalId] = v.id
      if (v.similarMatch) result.duplicatesDetected++
    }

    for (const c of DEMO_ATS_CANDIDATES) {
      const vacancyId = jobIdByExternal[c.jobExternalId]
      if (!vacancyId) continue
      try {
        const status = await upsertCandidate(userId, DEMO_ATS_PLATFORM, {
          externalId: c.externalId,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          cvBuffer: Buffer.from(c.cvText, 'utf-8'),
          cvFileName: 'cv.txt',
          motivationText: c.motivationText || undefined,
          vacancyId,
          atsStatus: c.status,
        })
        if (status === 'imported') result.imported++
        else if (status === 'updated') result.updated++
        else result.skipped++
      } catch (e: any) {
        result.errors.push(`${c.externalId}: ${e.message}`)
      }
    }
  } catch (e: any) {
    result.errors.push(e.message)
  }
  return result
}
