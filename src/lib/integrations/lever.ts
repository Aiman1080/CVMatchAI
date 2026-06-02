// Lever API integration
// Docs: https://hire.lever.co/developer/documentation
// Auth: Basic auth with API key as username, empty password

export interface LeverPosting {
  id: string
  text: string
  categories?: {
    team?: string
    department?: string
    location?: string
  }
  content?: {
    description?: string
    descriptionHtml?: string
    lists?: Array<{ text: string; content: string }>
  }
  state: string
  createdAt: number
}

export interface LeverApplication {
  posting?: string
  comments?: string
  resume?: string | null
  email?: string
  phone?: { value?: string }
}

export interface LeverOpportunity {
  id: string
  name?: string
  emails?: string[]
  phones?: Array<{ value: string }>
  links?: string[]
  // A string UID by default; a { id, text } object when expand=stage is used.
  stage?: string | { id: string; text: string }
  // String ids by default; full application objects when expand=applications is used.
  // NOTE: the opportunity has NO top-level `postings` field - the posting lives on
  // each application (app.posting).
  applications?: Array<string | LeverApplication>
  resume?: string | null
  updatedAt: number
  createdAt: number
}

export interface LeverResume {
  id: string
  file?: { name?: string; ext?: string; downloadUrl?: string }
}

const LEVER_BASE = 'https://api.lever.co/v1'

function leverAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
}

async function leverFetch(path: string, apiKey: string) {
  const url = path.startsWith('http') ? path : `${LEVER_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: leverAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Lever API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function leverTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await leverFetch('/postings?limit=1', apiKey)
    return { ok: true, company: 'Lever' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function leverFetchPostings(apiKey: string): Promise<LeverPosting[]> {
  const postings: LeverPosting[] = []
  let offset: string | undefined
  while (true) {
    let url = '/postings?state=published&limit=100'
    if (offset) url += `&offset=${offset}`
    const data = await leverFetch(url, apiKey)
    postings.push(...(data.data || []))
    if (!data.hasNext) break
    offset = data.next
  }
  return postings
}

export async function leverFetchOpportunities(apiKey: string, since?: Date): Promise<LeverOpportunity[]> {
  const opportunities: LeverOpportunity[] = []
  let offset: string | undefined
  while (true) {
    // expand applications (to reach the posting) AND stage (to get its display name).
    let url = '/opportunities?limit=100&expand=applications&expand=stage'
    if (since) url += `&updated_at_start=${since.getTime()}`
    if (offset) url += `&offset=${offset}`
    const data = await leverFetch(url, apiKey)
    opportunities.push(...(data.data || []))
    if (!data.hasNext) break
    offset = data.next
  }
  return opportunities
}

// List the opportunity's resumes (most recent first is not guaranteed, so we just
// take one with a downloadable file).
export async function leverFetchResume(apiKey: string, opportunityId: string): Promise<LeverResume | null> {
  try {
    const data = await leverFetch(`/opportunities/${opportunityId}/resumes`, apiKey)
    const resumes: LeverResume[] = data.data || []
    return resumes.find(r => r.file?.downloadUrl) || resumes[0] || null
  } catch {
    return null
  }
}

// Download a resume's binary via the dedicated download endpoint (Basic auth).
export async function leverDownloadCV(apiKey: string, opportunityId: string, resumeId: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`${LEVER_BASE}/opportunities/${opportunityId}/resumes/${resumeId}/download`, {
      headers: { Authorization: leverAuthHeader(apiKey) },
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
