// Teamtailor API integration
// Docs: https://docs.teamtailor.com/ (JSON:API)
// Auth: "Authorization: Token token=<apiKey>" header + the REQUIRED X-Api-Version header.
// The CV is the candidate's `resume` (converted PDF) / `original-resume` (original
// file), both exposed as short-lived pre-signed URLs - NOT a field on the
// job-application.

export interface TTCandidate {
  id: string
  attributes: {
    'first-name': string
    'last-name': string
    email: string
    phone?: string
    'linkedin-url'?: string
    pitch?: string
    resume?: string
    'original-resume'?: string
    'created-at': string
  }
  relationships?: {
    'job-applications'?: { data: Array<{ id: string; type: string }> }
  }
}

export interface TTJob {
  id: string
  attributes: {
    title: string
    body?: string
    status: string
    'human-status'?: string
    'created-at': string
  }
}

export interface TTJobApplication {
  id: string
  attributes: {
    'created-at': string
    'cover-letter'?: string
  }
  relationships: {
    job: { data: { id: string } }
    candidate: { data: { id: string } }
    stage?: { data?: { id: string } }
  }
  // Resolved from the included `stages` (the stage is a relationship, not an attribute).
  stageName?: string
}

const TT_BASE = 'https://api.teamtailor.com/v1'
// The docs require an X-Api-Version header; 20240904 is the current required version.
const TT_VERSION = '20240904'

async function ttFetch(path: string, apiKey: string) {
  const res = await fetch(`${TT_BASE}${path}`, {
    headers: {
      Authorization: `Token token=${apiKey}`,
      'X-Api-Version': TT_VERSION,
      'Content-Type': 'application/vnd.api+json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Teamtailor API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function teamtailorTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    const data = await ttFetch('/company', apiKey)
    return { ok: true, company: data.data?.attributes?.name }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function teamtailorFetchCompanyName(apiKey: string): Promise<string | null> {
  try {
    const data = await ttFetch('/company', apiKey)
    return data.data?.attributes?.name || null
  } catch {
    return null
  }
}

export async function teamtailorFetchJobs(apiKey: string): Promise<TTJob[]> {
  const jobs: TTJob[] = []
  // page[size] max is 30. There is no `filter[status]=published` - "published" is the
  // human-status; the raw `status` is open/draft/archived/etc. So fetch and filter
  // to published jobs client-side.
  let url = '/jobs?page[size]=30'
  while (url) {
    const data = await ttFetch(url, apiKey)
    jobs.push(...(data.data || []))
    url = data.links?.next ? data.links.next.replace(TT_BASE, '') : null
  }
  return jobs.filter(j => j.attributes['human-status'] === 'published')
}

export async function teamtailorFetchApplications(apiKey: string, since?: Date): Promise<TTJobApplication[]> {
  const apps: TTJobApplication[] = []
  const stageNames = new Map<string, string>() // stageId -> name (from `included`)
  let url = '/job-applications?include=candidate,job,stage&page[size]=30'
  while (url) {
    const data = await ttFetch(url, apiKey)
    for (const inc of (data.included || [])) {
      if (inc?.type === 'stages') stageNames.set(inc.id, inc.attributes?.name || inc.attributes?.title || '')
    }
    apps.push(...(data.data || []))
    url = data.links?.next ? data.links.next.replace(TT_BASE, '') : null
  }
  // The stage is a relationship, not an attribute - resolve its name from the includes.
  for (const app of apps) {
    const stageId = app.relationships?.stage?.data?.id
    if (stageId) app.stageName = stageNames.get(stageId)
  }
  // The API has no documented created-at filter, so apply `since` client-side.
  return since
    ? apps.filter(a => !a.attributes['created-at'] || new Date(a.attributes['created-at']) >= since)
    : apps
}

export async function teamtailorFetchCandidate(apiKey: string, candidateId: string): Promise<TTCandidate | null> {
  try {
    const data = await ttFetch(`/candidates/${candidateId}`, apiKey)
    return data.data || null
  } catch {
    return null
  }
}

// Resume URLs are short-lived pre-signed (S3) URLs, so no auth is needed. We only
// attach the API token if the file is unexpectedly served from Teamtailor's own host.
export async function teamtailorDownloadCV(cvUrl: string, apiKey?: string): Promise<Buffer | null> {
  try {
    const headers: Record<string, string> = {}
    if (apiKey && /api\.teamtailor\.com/.test(cvUrl)) {
      headers.Authorization = `Token token=${apiKey}`
      headers['X-Api-Version'] = TT_VERSION
    }
    const res = await fetch(cvUrl, { headers })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
