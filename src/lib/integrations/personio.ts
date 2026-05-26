// Personio Recruiting API integration
// Docs: https://developer.personio.de/reference
// Auth: Bearer token with API key

export interface PersonioPosition {
  id: number
  name: string
  description?: string
  department?: string
  office?: string
  status: string
  created_at: string
}

export interface PersonioApplication {
  id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
  status: string
  created_at: string
  documents?: Array<{
    id: number
    filename: string
    url: string
    category: string
  }>
}

export interface PersonioDocument {
  id: number
  filename: string
  url: string
  category: string
}

const PERSONIO_BASE = 'https://api.personio.de/v1'

function personioAuthHeader(apiKey: string) {
  return `Bearer ${apiKey}`
}

async function personioFetch(path: string, apiKey: string) {
  const url = path.startsWith('http') ? path : `${PERSONIO_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: personioAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Personio API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function personioTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await personioFetch('/company/employees?limit=1', apiKey)
    return { ok: true, company: 'Personio' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function personioFetchJobs(apiKey: string): Promise<PersonioPosition[]> {
  const data = await personioFetch('/recruiting/positions?status=active', apiKey)
  const items = data?.data || data?.items || data || []
  return Array.isArray(items) ? items : []
}

export async function personioFetchApplications(apiKey: string, positionId: number): Promise<PersonioApplication[]> {
  const data = await personioFetch(`/recruiting/positions/${positionId}/applications`, apiKey)
  const items = data?.data || data?.items || data || []
  return Array.isArray(items) ? items : []
}

export async function personioDownloadCV(apiKey: string, applicationId: number): Promise<{ buffer: Buffer; filename: string } | null> {
  try {
    const data = await personioFetch(`/recruiting/applications/${applicationId}/documents`, apiKey)
    const documents: PersonioDocument[] = data?.data || data?.items || data || []
    const doc = documents[0]
    if (!doc) return null

    const res = await fetch(doc.url, {
      headers: { Authorization: personioAuthHeader(apiKey) },
    })
    if (!res.ok) return null
    return { buffer: Buffer.from(await res.arrayBuffer()), filename: doc.filename }
  } catch {
    return null
  }
}
