// Core sync engine - pulls candidates from an ATS and creates/updates them in DeltaMatch
import prisma from '@/lib/prisma'
import { parseDocument } from '@/lib/pdf-parser'
import { persistDocument } from '@/lib/storage'
import { analyzeCVAgainstVacancy } from '@/lib/ai'
import { createLogger } from '@/lib/logger'
import {
  teamtailorFetchJobs, teamtailorFetchApplications, teamtailorFetchCandidate,
  teamtailorDownloadCV, teamtailorFetchCompanyName,
} from './teamtailor'
import {
  recruiteeFetchOffers, recruiteeFetchCandidates, recruiteeFetchCandidate, recruiteeDownloadCV,
  type RCOffer, type RCReference,
} from './recruitee'
import {
  smartrecruitersFetchJobs, smartrecruitersFetchCandidates,
  smartrecruitersFetchCandidate, smartrecruitersDownloadCV,
} from './smartrecruiters'
import {
  greenhouseGetToken, greenhouseFetchJobs, greenhouseFetchCandidates,
  greenhouseFetchApplications, greenhouseFetchResumes, greenhouseDownloadResume,
  type GHJob, type GHAttachment,
} from './greenhouse'
import {
  leverFetchPostings, leverFetchOpportunities, leverFetchResume, leverDownloadCV,
  type LeverApplication,
} from './lever'
import {
  workableFetchJobs, workableFetchJob, workableFetchCandidates, workableFetchCandidate, workableDownloadCV,
} from './workable'
import {
  ashbyFetchJobs, ashbyFetchCandidates, ashbyFetchApplications, ashbyFileUrl, ashbyDownloadCV,
  type AshbyJobPosting, type AshbyApplication,
} from './ashby'
import {
  homerunFetchJobs, homerunFetchApplications, homerunDownloadCV,
} from './homerun'

const log = createLogger('ats-sync')

export interface SyncResult {
  imported: number
  updated: number
  skipped: number
  errors: string[]
  duplicatesDetected: number
  jobsFound?: number
  candidatesFound?: number
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
    const [offers, candidatesData] = await Promise.all([
      recruiteeFetchOffers(apiKey, companySlug).catch(() => [] as RCOffer[]),
      recruiteeFetchCandidates(apiKey, companySlug, since),
    ])
    const { candidates, references } = candidatesData

    // Full offers (with description) by id; references give a verified fallback
    // (title/location) plus the stage-id -> name map.
    const offerMap = new Map<number, RCOffer>(offers.map(o => [o.id, o]))
    const offerRefMap = new Map<number, RCReference>()
    const stageMap = new Map<number, string>()
    for (const ref of references) {
      if (ref.type === 'Offer') offerRefMap.set(ref.id, ref)
      else if (ref.type === 'Stage' && ref.name) stageMap.set(ref.id, ref.name)
    }

    for (const candidate of candidates) {
      try {
        const placements = candidate.placements || []
        if (placements.length === 0) { result.skipped++; continue }

        // CV / cover letter / LinkedIn live only on the single-candidate endpoint.
        // Fetch once per candidate and reuse across all their placements.
        const detail = await recruiteeFetchCandidate(apiKey, companySlug, candidate.id)
        const cvUrl = detail?.cv_original_url || detail?.cv_url || undefined
        const cv = cvUrl ? await recruiteeDownloadCV(cvUrl, apiKey) : null
        const coverLetter = detail?.cover_letter || undefined
        const linkedIn = detail?.social_links?.find(l => /linkedin\.com/i.test(l)) || undefined

        for (const placement of placements) {
          const offer = offerMap.get(placement.offer_id)
          const ref = offerRefMap.get(placement.offer_id)
          const title = offer?.title || ref?.title
          if (!title) { result.skipped++; continue }

          const vacancyResult = await upsertVacancy(userId, `${placement.offer_id}`, 'recruitee', {
            title,
            description: offer?.description || title,
            requirements: offer?.requirements || '',
            company: companySlug,
            location: offer?.location || ref?.location,
          })
          const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

          // emails/phones are arrays of strings (from the list); the CV / cover
          // letter / LinkedIn were resolved from the detail fetch above.
          const email = candidate.emails?.[0]
          const phone = candidate.phones?.[0]
          const nameParts = candidate.name?.split(' ') || []
          const firstName = nameParts[0] || 'Unknown'
          const lastName = nameParts.slice(1).join(' ') || 'Candidate'
          const stageName = stageMap.get(placement.stage_id)

          const status = await upsertCandidate(userId, 'recruitee', {
            externalId: `${placement.id}`,
            firstName,
            lastName,
            email,
            phone,
            linkedIn,
            cvBuffer: cv?.buffer || null,
            cvFileName: cv?.filename,
            motivationText: coverLetter,
            vacancyId,
            atsStatus: stageName,
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
      smartrecruitersFetchJobs(apiKey).catch(() => [] as Awaited<ReturnType<typeof smartrecruitersFetchJobs>>),
      smartrecruitersFetchCandidates(apiKey, since),
    ])

    const jobMap = new Map(jobs.map(j => [j.id, j]))

    for (const candidate of candidates) {
      try {
        const assignment = candidate.primaryAssignment
        const jobId = assignment?.job?.id
        if (!jobId) { result.skipped++; continue }

        // The /jobs list carries no description; use it for the title/location,
        // falling back to the title carried on the candidate's assignment so a
        // candidate is never skipped just because its job wasn't in the page.
        const job = jobMap.get(jobId)
        const title = job?.title || assignment?.job?.title || 'Position'

        const vacancyResult = await upsertVacancy(userId, jobId, 'smartrecruiters', {
          title,
          description: title,
          requirements: '',
          company: 'SmartRecruiters',
          location: job?.location?.city,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        // Phone, LinkedIn and the attachments link are only on the detail.
        const detail = await smartrecruitersFetchCandidate(apiKey, candidate.id)
        const cv = await smartrecruitersDownloadCV(apiKey, detail?.actions?.attachments?.url)

        const status = await upsertCandidate(userId, 'smartrecruiters', {
          externalId: candidate.id,
          firstName: candidate.firstName || 'Unknown',
          lastName: candidate.lastName || 'Candidate',
          email: candidate.email || detail?.email,
          phone: detail?.phoneNumber,
          linkedIn: detail?.web?.linkedin,
          cvBuffer: cv?.buffer || null,
          cvFileName: cv?.filename,
          vacancyId,
          atsStatus: assignment?.status,
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

export async function syncGreenhouse(clientId: string, clientSecret: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const token = await greenhouseGetToken(clientId, clientSecret)

    // v3: candidate, job and application are separate resources. The application
    // is the candidate<->job bridge (and carries the status), so it drives the loop.
    const [jobs, candidates, applications] = await Promise.all([
      greenhouseFetchJobs(token).catch(() => [] as GHJob[]),
      greenhouseFetchCandidates(token, since),
      greenhouseFetchApplications(token, since),
    ])

    const jobMap = new Map(jobs.map(j => [j.id, j]))
    const candidateMap = new Map(candidates.map(c => [c.id, c]))

    // Real (non-prospect) applications attached to a job + a known candidate.
    const relevant = applications.filter(a => !a.prospect && a.job_id && candidateMap.has(a.candidate_id))

    // Résumés for just those candidates, batched (candidate_ids caps at 50).
    const resumeMap = new Map<number, GHAttachment>()
    const candidateIds = [...new Set(relevant.map(a => a.candidate_id))]
    for (let i = 0; i < candidateIds.length; i += 50) {
      const atts = await greenhouseFetchResumes(token, candidateIds.slice(i, i + 50)).catch(() => [] as GHAttachment[])
      for (const a of atts) {
        if (a.candidate_id && !resumeMap.has(a.candidate_id)) resumeMap.set(a.candidate_id, a)
      }
    }

    for (const app of relevant) {
      try {
        const candidate = candidateMap.get(app.candidate_id)!
        const job = jobMap.get(app.job_id!)
        const title = job?.name || 'Position'

        const vacancyResult = await upsertVacancy(userId, `${app.job_id}`, 'greenhouse', {
          title,
          description: job?.notes || title,
          requirements: '',
          company: 'Greenhouse',
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        const cv = await greenhouseDownloadResume(resumeMap.get(app.candidate_id))
        const linkedIn = candidate.social_media_addresses?.map(s => s.value).find(v => /linkedin\.com/i.test(v))
        // Terminal states come from `status`; in-process ones from the stage name.
        const atsStatus = (app.status === 'rejected' || app.status === 'hired') ? app.status : (app.stage_name || app.status)

        const status = await upsertCandidate(userId, 'greenhouse', {
          externalId: `${app.id}`,
          firstName: candidate.first_name || 'Unknown',
          lastName: candidate.last_name || 'Candidate',
          email: candidate.email_addresses?.[0]?.value,
          phone: candidate.phone_numbers?.[0]?.value,
          linkedIn,
          cvBuffer: cv?.buffer || null,
          cvFileName: cv?.filename,
          vacancyId,
          atsStatus,
        })

        if (status === 'imported') result.imported++
        else if (status === 'updated') result.updated++
        else result.skipped++
      } catch (e: any) {
        result.errors.push(`Application ${app.id}: ${e.message}`)
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

// ── Workable ─────────────────────────────────────────────────────────────────

export async function syncWorkable(apiKey: string, subdomain: string, userId: string, since?: Date): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, updated: 0, skipped: 0, errors: [], duplicatesDetected: 0 }
  try {
    const jobs = await workableFetchJobs(apiKey, subdomain)
    result.jobsFound = jobs.length
    log.info('workable: jobs fetched (all states)', { subdomain, count: jobs.length })

    for (const job of jobs) {
      try {
        // The /jobs list omits description/requirements - read the full record.
        const detail = await workableFetchJob(apiKey, subdomain, job.shortcode)
        const vacancyResult = await upsertVacancy(userId, job.id, 'workable', {
          title: detail?.title || job.title,
          description: detail?.description || job.title,
          requirements: detail?.requirements || '',
          company: subdomain,
          location: detail?.location?.city || job.location?.city,
        })
        const vacancyId = vacancyResult.id; if (vacancyResult.similarMatch) result.duplicatesDetected++

        const candidates = await workableFetchCandidates(apiKey, subdomain, job.shortcode)
        result.candidatesFound = (result.candidatesFound ?? 0) + candidates.length
        log.info('workable: candidates for job', { shortcode: job.shortcode, count: candidates.length })

        for (const candidate of candidates) {
          try {
            if (since && new Date(candidate.created_at) < since) { result.skipped++; continue }

            const nameParts = candidate.name?.split(' ') || []
            const firstName = candidate.firstname || nameParts[0] || 'Unknown'
            const lastName = candidate.lastname || nameParts.slice(1).join(' ') || 'Candidate'

            // LinkedIn / cover letter / summary are only on the single-candidate
            // record (the list's profile_url is an internal Workable link, not
            // LinkedIn). Best-effort enrichment - null on failure.
            const detail = await workableFetchCandidate(apiKey, subdomain, candidate.id)
            const linkedIn = detail?.social_profiles?.find(p => p.type === 'linkedin')?.url || undefined
            const motivationText = detail?.cover_letter || detail?.summary || undefined

            // CV is not inline; pull it from the candidate's files (only when the
            // candidate actually has a résumé, to avoid a wasted request).
            const cv = candidate.resume_metadata?.filename
              ? await workableDownloadCV(apiKey, subdomain, candidate.id, candidate.resume_metadata.filename)
              : null

            const status = await upsertCandidate(userId, 'workable', {
              externalId: candidate.id,
              firstName,
              lastName,
              email: candidate.email || detail?.email,
              phone: candidate.phone || detail?.phone,
              linkedIn,
              cvBuffer: cv?.buffer || null,
              cvFileName: cv?.filename,
              motivationText,
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
