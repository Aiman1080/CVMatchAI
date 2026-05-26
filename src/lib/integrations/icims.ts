// iCIMS Talent Cloud API integration
// Docs: https://developer.icims.com
// Auth: Bearer token with API key

export interface IcimsJob {
  id: number
  title: string
  description?: string
  jobLocation?: string
  status: string
  folder?: { value: string }
}

export interface IcimsCandidateWorkflow {
  id: number
  person: { id: number }
  status: string
  createdDate: string
}

export interface IcimsPerson {
  id: number
  firstname: string
  lastname: string
  email?: string
  phone?: string
  addresses?: Array<{ addressStreet1?: string; addressCity?: string }>
}

export interface IcimsAttachment {
  id: number
  filename: string
  url: string
  type?: string
}

const ICIMS_BASE = 'https://api.icims.com'

function icimsAuthHeader(apiKey: string) {
  return `Bearer ${apiKey}`
}

async function icimsFetch(path: string, apiKey: string, customerId: string) {
  const url = `${ICIMS_BASE}/customers/${customerId}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: icimsAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`iCIMS API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function icimsTestConnection(apiKey: string, customerId: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await icimsFetch('/jobs?count=1', apiKey, customerId)
    return { ok: true, company: 'iCIMS' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function icimsFetchJobs(apiKey: string, customerId: string): Promise<IcimsJob[]> {
  const data = await icimsFetch('/jobs?status=open', apiKey, customerId)
  const items = data?.data || data?.items || data?.searchResults || data || []
  return Array.isArray(items) ? items : []
}

export async function icimsFetchCandidates(apiKey: string, customerId: string, jobId: number): Promise<IcimsCandidateWorkflow[]> {
  const data = await icimsFetch(`/jobs/${jobId}/candidateworkflows`, apiKey, customerId)
  const items = data?.data || data?.items || data?.searchResults || data || []
  return Array.isArray(items) ? items : []
}

export async function icimsDownloadCV(apiKey: string, customerId: string, personId: number): Promise<{ buffer: Buffer; filename: string } | null> {
  try {
    const data = await icimsFetch(`/people/${personId}/attachments`, apiKey, customerId)
    const attachments: IcimsAttachment[] = data?.data || data?.items || data || []
    const doc = attachments.find(a => a.type === 'Resume' || a.filename?.match(/\.(pdf|docx?)$/i)) || attachments[0]
    if (!doc) return null

    const res = await fetch(doc.url, {
      headers: { Authorization: icimsAuthHeader(apiKey) },
    })
    if (!res.ok) return null
    return { buffer: Buffer.from(await res.arrayBuffer()), filename: doc.filename }
  } catch {
    return null
  }
}
