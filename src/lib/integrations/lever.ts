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

export interface LeverOpportunity {
  id: string
  name?: string
  emails?: string[]
  phones?: Array<{ value: string }>
  links?: string[]
  stage?: string
  stageChanges?: Array<{ toStageId: string }>
  applications?: string[]
  postings?: string[]
  updatedAt: number
  createdAt: number
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
    let url = '/opportunities?limit=100&expand=applications'
    if (since) url += `&updated_at_start=${since.getTime()}`
    if (offset) url += `&offset=${offset}`
    const data = await leverFetch(url, apiKey)
    opportunities.push(...(data.data || []))
    if (!data.hasNext) break
    offset = data.next
  }
  return opportunities
}
