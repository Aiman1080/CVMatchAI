// Teamtailor API integration
// Docs: https://docs.teamtailor.com/
// Auth: API key in header X-Api-Key, version header required

export interface TTCandidate {
  id: string
  attributes: {
    'first-name': string
    'last-name': string
    email: string
    phone?: string
    'linkedin-url'?: string
    pitch?: string
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
    'human-requirements'?: string
    status: string
    'created-at': string
  }
}

export interface TTJobApplication {
  id: string
  attributes: {
    stage: string
    'created-at': string
    'cv-url'?: string
    'cover-letter-url'?: string
  }
  relationships: {
    job: { data: { id: string } }
    candidate: { data: { id: string } }
  }
}

const TT_BASE = 'https://api.teamtailor.com/v1'
const TT_VERSION = '20240404'

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

export async function teamtailorFetchJobs(apiKey: string): Promise<TTJob[]> {
  const jobs: TTJob[] = []
  let url = '/jobs?filter[status]=published&page[size]=50'
  while (url) {
    const data = await ttFetch(url, apiKey)
    jobs.push(...(data.data || []))
    url = data.links?.next ? data.links.next.replace(TT_BASE, '') : null
  }
  return jobs
}

export async function teamtailorFetchApplications(apiKey: string, since?: Date): Promise<TTJobApplication[]> {
  const apps: TTJobApplication[] = []
  let url = '/job-applications?include=candidate,job&page[size]=50'
  if (since) url += `&filter[created-at][gte]=${since.toISOString()}`
  while (url) {
    const data = await ttFetch(url, apiKey)
    apps.push(...(data.data || []))
    url = data.links?.next ? data.links.next.replace(TT_BASE, '') : null
  }
  return apps
}

export async function teamtailorFetchCandidate(apiKey: string, candidateId: string): Promise<TTCandidate | null> {
  try {
    const data = await ttFetch(`/candidates/${candidateId}`, apiKey)
    return data.data || null
  } catch {
    return null
  }
}

export async function teamtailorDownloadCV(cvUrl: string, apiKey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(cvUrl, {
      headers: { Authorization: `Token token=${apiKey}`, 'X-Api-Version': TT_VERSION },
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
