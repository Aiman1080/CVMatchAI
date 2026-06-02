// Ashby API integration
// Docs: https://developers.ashbyhq.com (OpenAPI spec)
// Auth: HTTP Basic with the API key as the username and an empty password.
// Every endpoint is POST; responses look like
//   { success: true, results: <object|array>, moreDataAvailable?: bool, nextCursor?: string }
//
// Field notes from the spec (these were wrong/missing in the old version):
//   - application.list returns the candidate and job INLINE, not as ids:
//       candidate: { id, name, primaryEmailAddress: { value }, primaryPhoneNumber: { value } }
//       job:       { id, title }
//       status:    "Active" | "Hired" | "Archived" | "Lead"
//       currentInterviewStage: { title }
//     (there is NO top-level candidateId / jobId)
//   - The CV is a file handle: candidate.resumeFileHandle.handle -> file.info -> { url }.

export interface AshbyJobPosting {
  id: string
  jobId?: string
  title: string
  locationName?: string
  departmentName?: string
  employmentType?: string
  publishedDate?: string
}

export interface AshbyCandidate {
  id: string
  name?: string
  primaryEmailAddress?: { value: string }
  primaryPhoneNumber?: { value: string }
  socialLinks?: Array<{ type?: string; url?: string }>
  resumeFileHandle?: { id: string; name: string; handle: string }
  fileHandles?: Array<{ id: string; name: string; handle: string }>
}

// Flattened from the nested application.list shape into what the sync consumes.
export interface AshbyApplication {
  id: string
  candidateId?: string
  candidateName?: string
  email?: string
  phone?: string
  jobId?: string
  jobTitle?: string
  status?: string
  stageName?: string
  createdAt?: string
}

const ASHBY_BASE = 'https://api.ashbyhq.com'

function ashbyAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
}

async function ashbyPost(path: string, apiKey: string, body: Record<string, any> = {}) {
  const res = await fetch(`${ASHBY_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: ashbyAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ashby API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function ashbyTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await ashbyPost('/jobPosting.list', apiKey, { limit: 1 })
    return { ok: true, company: 'Ashby' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// Published job postings - used only to enrich the vacancy with a real
// location/department. There is NO `isLive` param in the API (postings are
// published by default); the old code sent one that Ashby ignored.
export async function ashbyFetchJobs(apiKey: string): Promise<AshbyJobPosting[]> {
  const jobs: AshbyJobPosting[] = []
  let cursor: string | undefined
  while (true) {
    const body: Record<string, any> = { limit: 100 }
    if (cursor) body.cursor = cursor
    const data = await ashbyPost('/jobPosting.list', apiKey, body)
    for (const p of (data.results || [])) {
      jobs.push({
        id: p.id,
        jobId: p.jobId,
        title: p.title,
        locationName: p.locationName,
        departmentName: p.departmentName,
        employmentType: p.employmentType,
        publishedDate: p.publishedDate,
      })
    }
    if (!data.moreDataAvailable) break
    cursor = data.nextCursor
    if (!cursor) break
  }
  return jobs
}

// Candidates carry the resume file handle + social links, which the application
// payload does not include - so we list them and map by id.
export async function ashbyFetchCandidates(apiKey: string): Promise<AshbyCandidate[]> {
  const candidates: AshbyCandidate[] = []
  let cursor: string | undefined
  while (true) {
    const body: Record<string, any> = { limit: 100 }
    if (cursor) body.cursor = cursor
    const data = await ashbyPost('/candidate.list', apiKey, body)
    candidates.push(...(data.results || []))
    if (!data.moreDataAvailable) break
    cursor = data.nextCursor
    if (!cursor) break
  }
  return candidates
}

// Applications link a candidate to a job. The candidate and job are returned
// INLINE, so we flatten them. The API has no `createdAfter`; `since` is applied
// client-side on the returned createdAt.
export async function ashbyFetchApplications(apiKey: string, since?: Date): Promise<AshbyApplication[]> {
  const applications: AshbyApplication[] = []
  let cursor: string | undefined
  while (true) {
    const body: Record<string, any> = { limit: 100 }
    if (cursor) body.cursor = cursor
    const data = await ashbyPost('/application.list', apiKey, body)
    for (const a of (data.results || [])) {
      applications.push({
        id: a.id,
        candidateId: a.candidate?.id,
        candidateName: a.candidate?.name,
        email: a.candidate?.primaryEmailAddress?.value,
        phone: a.candidate?.primaryPhoneNumber?.value,
        jobId: a.job?.id,
        jobTitle: a.job?.title,
        status: a.status,
        stageName: a.currentInterviewStage?.title || a.currentInterviewStage?.name,
        createdAt: a.createdAt,
      })
    }
    if (!data.moreDataAvailable) break
    cursor = data.nextCursor
    if (!cursor) break
  }
  return since
    ? applications.filter(a => !a.createdAt || new Date(a.createdAt).getTime() >= since.getTime())
    : applications
}

// Resolve a candidate file handle to a temporary, pre-signed download URL.
export async function ashbyFileUrl(apiKey: string, fileHandle: string): Promise<string | null> {
  try {
    const data = await ashbyPost('/file.info', apiKey, { fileHandle })
    return data?.results?.url || null
  } catch {
    return null
  }
}

// Download a CV from the pre-signed URL (no auth header on the S3 URL).
export async function ashbyDownloadCV(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
