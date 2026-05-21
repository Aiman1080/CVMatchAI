// SmartRecruiters API integration
// Docs: https://developers.smartrecruiters.com/reference
// Auth: X-SmartToken header

export interface SRCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  web?: { linkedIn?: string }
  location?: { city?: string; country?: string }
  tags?: { label: string }[]
  createdon: string
  primaryAssignment?: {
    job: { id: string; title: string }
    status: { id: string; label: string }
    activeApplication?: {
      answers?: Array<{ questionText: string; answerText: string }>
    }
  }
}

export interface SRJob {
  id: string
  title: string
  jobDescription?: { text?: string }
  qualifications?: { text?: string }
  status: string
  location?: { city?: string; country?: string }
  createdon: string
}

const SR_BASE = 'https://api.smartrecruiters.com'

async function srFetch(path: string, apiKey: string) {
  const res = await fetch(`${SR_BASE}${path}`, {
    headers: {
      'X-SmartToken': apiKey,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SmartRecruiters API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function smartrecruitersTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    const data = await srFetch('/v1/users/me', apiKey)
    return { ok: true, company: data.companyIdentifier || data.firstName }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function smartrecruitersFetchJobs(apiKey: string): Promise<SRJob[]> {
  const jobs: SRJob[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const data = await srFetch(`/v1/jobs?status=PUBLISHED&limit=${limit}&offset=${offset}`, apiKey)
    const batch: SRJob[] = data.content || []
    jobs.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }
  return jobs
}

export async function smartrecruitersFetchCandidates(apiKey: string, since?: Date): Promise<SRCandidate[]> {
  const candidates: SRCandidate[] = []
  let offset = 0
  const limit = 100
  while (true) {
    let url = `/v1/candidates?limit=${limit}&offset=${offset}`
    if (since) url += `&updatedAfter=${since.toISOString()}`
    const data = await srFetch(url, apiKey)
    const batch: SRCandidate[] = data.content || []
    candidates.push(...batch)
    if (batch.length < limit) break
    offset += limit
  }
  return candidates
}

export async function smartrecruitersFetchCandidateCV(apiKey: string, candidateId: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`${SR_BASE}/v1/candidates/${candidateId}/documents/cv`, {
      headers: { 'X-SmartToken': apiKey },
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
