// Softgarden API integration
// Docs: https://dev.softgarden.de
// Auth: Bearer token with API key

export interface SoftgardenJob {
  id: number
  jobName: string
  jobDescription?: string
  jobLocation?: string
  status: string
  channel?: string
}

export interface SoftgardenApplication {
  id: number
  firstname: string
  lastname: string
  email?: string
  phone?: string
  status: string
  createdOn: string
  documents?: Array<{
    id: number
    filename: string
    url: string
    type?: string
  }>
}

export interface SoftgardenDocument {
  id: number
  filename: string
  url: string
  type?: string
}

const SOFTGARDEN_BASE = 'https://api.softgarden.de/api/rest/2.0'

function softgardenAuthHeader(apiKey: string) {
  return `Bearer ${apiKey}`
}

async function softgardenFetch(path: string, apiKey: string) {
  const url = path.startsWith('http') ? path : `${SOFTGARDEN_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: softgardenAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Softgarden API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function softgardenTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await softgardenFetch('/channels', apiKey)
    return { ok: true, company: 'Softgarden' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function softgardenFetchJobs(apiKey: string): Promise<SoftgardenJob[]> {
  const data = await softgardenFetch('/jobs?status=ACTIVE', apiKey)
  const items = data?.data || data?.results || data?.items || data || []
  return Array.isArray(items) ? items : []
}

export async function softgardenFetchApplications(apiKey: string, jobId: number): Promise<SoftgardenApplication[]> {
  const data = await softgardenFetch(`/jobs/${jobId}/applications`, apiKey)
  const items = data?.data || data?.results || data?.items || data || []
  return Array.isArray(items) ? items : []
}

export async function softgardenDownloadCV(apiKey: string, applicationId: number): Promise<{ buffer: Buffer; filename: string } | null> {
  try {
    const data = await softgardenFetch(`/applications/${applicationId}/documents`, apiKey)
    const documents: SoftgardenDocument[] = data?.data || data?.results || data?.items || data || []
    const doc = documents.find(d => d.type === 'CV' || d.filename?.match(/\.(pdf|docx?)$/i)) || documents[0]
    if (!doc) return null

    const res = await fetch(doc.url, {
      headers: { Authorization: softgardenAuthHeader(apiKey) },
    })
    if (!res.ok) return null
    return { buffer: Buffer.from(await res.arrayBuffer()), filename: doc.filename }
  } catch {
    return null
  }
}
