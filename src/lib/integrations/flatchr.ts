// Flatchr API integration
// Docs: https://developers.flatchr.io/
// Auth: Bearer token

export interface FLJob {
  id: string
  title: string
  description?: string
  requirements?: string
  location?: string
  status: string
  created_at: string
}

export interface FLCandidate {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  status?: string
  cv_url?: string
  created_at: string
}

const FL_BASE = 'https://api.flatchr.io/v2'

async function flFetch(path: string, apiKey: string) {
  const res = await fetch(`${FL_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Flatchr API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function flatchrTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    const data = await flFetch('/company', apiKey)
    return { ok: true, company: data.name || 'Flatchr' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function flatchrFetchJobs(apiKey: string): Promise<FLJob[]> {
  const jobs: FLJob[] = []
  let page = 1
  while (true) {
    const data = await flFetch(`/jobs?status=published&page=${page}&per_page=100`, apiKey)
    const batch: FLJob[] = data.data || data.jobs || []
    jobs.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return jobs
}

export async function flatchrFetchCandidates(apiKey: string, jobId: string): Promise<FLCandidate[]> {
  const candidates: FLCandidate[] = []
  let page = 1
  while (true) {
    const data = await flFetch(`/jobs/${jobId}/applications?page=${page}&per_page=100`, apiKey)
    const batch: FLCandidate[] = data.data || data.applications || []
    candidates.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return candidates
}

export async function flatchrDownloadCV(cvUrl: string, apiKey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(cvUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
