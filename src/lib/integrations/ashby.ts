// Ashby API integration
// Docs: https://developers.ashbyhq.com
// Auth: Basic auth with API key as username, empty password
// Note: Ashby uses POST for all endpoints

export interface AshbyJobPosting {
  id: string
  title: string
  departmentName?: string
  locationName?: string
  employmentType?: string
  publishedDate?: string
  jobId?: string
  content?: string
}

export interface AshbyCandidate {
  id: string
  name: string
  primaryEmailAddress?: { value: string }
  primaryPhoneNumber?: { value: string }
  socialLinks?: Array<{ type: string; url: string }>
  fileHandles?: Array<{ id: string; name: string; handle: string }>
  applicationIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface AshbyApplication {
  id: string
  candidateId: string
  jobId?: string
  status: string
  currentInterviewStage?: { name: string }
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

export async function ashbyFetchJobs(apiKey: string): Promise<AshbyJobPosting[]> {
  const jobs: AshbyJobPosting[] = []
  let cursor: string | undefined
  while (true) {
    const body: Record<string, any> = { isLive: true }
    if (cursor) body.cursor = cursor
    const data = await ashbyPost('/jobPosting.list', apiKey, body)
    const batch: AshbyJobPosting[] = data.results || []
    jobs.push(...batch)
    if (!data.moreDataAvailable) break
    cursor = data.nextCursor
    if (!cursor) break
  }
  return jobs
}

export async function ashbyFetchCandidates(apiKey: string, since?: Date): Promise<AshbyCandidate[]> {
  const candidates: AshbyCandidate[] = []
  let cursor: string | undefined
  while (true) {
    const body: Record<string, any> = {}
    if (cursor) body.cursor = cursor
    if (since) body.createdAfter = since.toISOString()
    const data = await ashbyPost('/candidate.list', apiKey, body)
    const batch: AshbyCandidate[] = data.results || []
    candidates.push(...batch)
    if (!data.moreDataAvailable) break
    cursor = data.nextCursor
    if (!cursor) break
  }
  return candidates
}

// Fetch all applications to map candidates to jobs
export async function ashbyFetchApplications(apiKey: string, since?: Date): Promise<AshbyApplication[]> {
  const applications: AshbyApplication[] = []
  let cursor: string | undefined
  while (true) {
    const body: Record<string, any> = {}
    if (cursor) body.cursor = cursor
    if (since) body.createdAfter = since.toISOString()
    const data = await ashbyPost('/application.list', apiKey, body)
    const batch: AshbyApplication[] = data.results || []
    applications.push(...batch)
    if (!data.moreDataAvailable) break
    cursor = data.nextCursor
    if (!cursor) break
  }
  return applications
}
