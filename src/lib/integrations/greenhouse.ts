// Greenhouse Harvest API integration
// Docs: https://developers.greenhouse.io/harvest.html
// Auth: Basic auth with API key as username, empty password

export interface GHJob {
  id: number
  name: string
  notes?: string
  status: string
  departments?: Array<{ name: string }>
  offices?: Array<{ name: string; location?: string }>
  created_at: string
}

export interface GHCandidate {
  id: number
  first_name: string
  last_name: string
  emails?: Array<{ value: string; type: string }>
  phone_numbers?: Array<{ value: string; type: string }>
  social_media_addresses?: Array<{ value: string }>
  applications?: Array<{
    id: number
    job: { id: number; name: string }
    status: string
    current_stage?: { name: string }
  }>
  attachments?: Array<{
    filename: string
    url: string
    type: string
  }>
  updated_at: string
}

export interface GHAttachment {
  filename: string
  url: string
  type: string
}

const GH_BASE = 'https://harvest.greenhouse.io/v1'

function ghAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
}

async function ghFetch(path: string, apiKey: string) {
  const url = path.startsWith('http') ? path : `${GH_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: ghAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Greenhouse API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function greenhouseTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await ghFetch('/candidates?per_page=1', apiKey)
    return { ok: true, company: 'Greenhouse' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function greenhouseFetchJobs(apiKey: string): Promise<GHJob[]> {
  const jobs: GHJob[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const batch: GHJob[] = await ghFetch(`/jobs?status=open&per_page=${perPage}&page=${page}`, apiKey)
    jobs.push(...batch)
    if (batch.length < perPage) break
    page++
  }
  return jobs
}

export async function greenhouseFetchCandidates(apiKey: string, since?: Date): Promise<GHCandidate[]> {
  const candidates: GHCandidate[] = []
  let page = 1
  const perPage = 100
  while (true) {
    let url = `/candidates?per_page=${perPage}&page=${page}`
    if (since) url += `&updated_after=${since.toISOString()}`
    const batch: GHCandidate[] = await ghFetch(url, apiKey)
    candidates.push(...batch)
    if (batch.length < perPage) break
    page++
  }
  return candidates
}

export async function greenhouseDownloadCV(apiKey: string, candidateId: number): Promise<{ buffer: Buffer; filename: string } | null> {
  try {
    const attachments: GHAttachment[] = await ghFetch(`/candidates/${candidateId}/attachments`, apiKey)
    const resume = attachments.find(a => a.type === 'resume')
    if (!resume) return null

    const res = await fetch(resume.url, {
      headers: { Authorization: ghAuthHeader(apiKey) },
    })
    if (!res.ok) return null
    return { buffer: Buffer.from(await res.arrayBuffer()), filename: resume.filename }
  } catch {
    return null
  }
}
