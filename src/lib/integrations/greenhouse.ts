// Greenhouse Harvest API v3 integration
// Docs: https://developers.greenhouse.io  (Harvest API v3)
//
// Auth (v3) is OAuth2 client-credentials, NOT the old v1 Basic API key:
//   POST https://auth.greenhouse.io/token?grant_type=client_credentials
//        Authorization: Basic base64(client_id:client_secret)
//   -> { token_type: "Bearer", access_token: "<JWT>", expires_at }
//   then call https://harvest.greenhouse.io/v3/... with Authorization: Bearer <JWT>.
// (Harvest v1/v2 are deprecated and unavailable after 2026-08-31.)
//
// Pagination is cursor-based: each list response carries a `Link` header with a
// rel="next" URL (already containing the cursor) to follow verbatim.
//
// v3 split nested data onto its own endpoints: the candidate no longer inlines
// applications or attachments, so we read /v3/applications (candidate <-> job +
// status) and /v3/attachments?type=resume (the CV, a 7-day signed URL) separately.

const GH_HARVEST = 'https://harvest.greenhouse.io'
const GH_AUTH = 'https://auth.greenhouse.io'

export interface GHJob {
  id: number
  name: string
  notes?: string | null
  status?: string
  department_id?: number | null
  office_ids?: number[]
  created_at?: string
}

export interface GHCandidate {
  id: number
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  title?: string | null
  email_addresses?: Array<{ value: string; type?: string }>
  phone_numbers?: Array<{ value: string; type?: string }>
  social_media_addresses?: Array<{ value: string }>
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export interface GHApplication {
  id: number
  candidate_id: number
  job_id?: number | null
  status?: string        // in_process | rejected | hired | converted
  stage_name?: string | null
  prospect?: boolean
  created_at?: string
}

export interface GHAttachment {
  id: number
  application_id?: number
  candidate_id?: number | null
  type?: string          // resume | cover_letter | ...
  filename?: string
  url?: string
}

function ghBasic(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

// Exchange client credentials for a short-lived JWT access token.
export async function greenhouseGetToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`${GH_AUTH}/token?grant_type=client_credentials`, {
    method: 'POST',
    headers: { Authorization: ghBasic(clientId, clientSecret), Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Greenhouse auth ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  if (!data?.access_token) throw new Error('Greenhouse auth: no access_token returned')
  return data.access_token as string
}

// One page + the next-cursor URL parsed from the Link header.
async function ghFetchPage(pathOrUrl: string, token: string): Promise<{ items: any[]; next?: string }> {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${GH_HARVEST}${pathOrUrl}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Greenhouse API ${res.status}: ${text.slice(0, 200)}`)
  }
  const items = await res.json()
  const link = res.headers?.get('link') || ''
  const next = link.match(/<([^>]+)>\s*;\s*rel="next"/i)?.[1]
  return { items: Array.isArray(items) ? items : [], next }
}

async function ghFetchAll(path: string, token: string): Promise<any[]> {
  const all: any[] = []
  let next: string | undefined = path
  while (next) {
    const page = await ghFetchPage(next, token)
    all.push(...page.items)
    next = page.next
  }
  return all
}

export async function greenhouseTestConnection(clientId: string, clientSecret: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    const token = await greenhouseGetToken(clientId, clientSecret)
    await ghFetchPage('/v3/candidates?per_page=1', token)
    return { ok: true, company: 'Greenhouse' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function greenhouseFetchJobs(token: string): Promise<GHJob[]> {
  return ghFetchAll('/v3/jobs?per_page=100&status=open', token)
}

export async function greenhouseFetchCandidates(token: string, since?: Date): Promise<GHCandidate[]> {
  let path = '/v3/candidates?per_page=100'
  if (since) path += `&updated_at[gte]=${encodeURIComponent(since.toISOString())}`
  return ghFetchAll(path, token)
}

export async function greenhouseFetchApplications(token: string, since?: Date): Promise<GHApplication[]> {
  let path = '/v3/applications?per_page=100'
  if (since) path += `&updated_at[gte]=${encodeURIComponent(since.toISOString())}`
  return ghFetchAll(path, token)
}

// Résumé attachments for a batch of candidates (candidate_ids is capped at 50).
export async function greenhouseFetchResumes(token: string, candidateIds: number[]): Promise<GHAttachment[]> {
  if (!candidateIds.length) return []
  const path = `/v3/attachments?per_page=100&type=resume&candidate_ids=${candidateIds.join(',')}`
  return ghFetchAll(path, token)
}

// The attachment `url` is a time-limited signed link - fetch it directly (no auth).
export async function greenhouseDownloadResume(att?: GHAttachment | null): Promise<{ buffer: Buffer; filename: string } | null> {
  if (!att?.url) return null
  try {
    const res = await fetch(att.url)
    if (!res.ok) return null
    return { buffer: Buffer.from(await res.arrayBuffer()), filename: att.filename || 'cv.pdf' }
  } catch {
    return null
  }
}
