// Workable API integration
// Docs: https://workable.readme.io/reference
// Auth: Bearer token + subdomain-based URL

export interface WKJob {
  id: string
  shortcode: string
  title: string
  description?: string
  requirements?: string
  department?: string
  location?: { city?: string; country_code?: string }
  state: string
  created_at: string
}

export interface WKCandidate {
  id: string
  name: string
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  profile_url?: string
  summary?: string
  stage?: string
  disqualified?: boolean
  created_at: string
}

function wkBase(subdomain: string) {
  return `https://${subdomain}.workable.com/spi/v3`
}

async function wkFetch(path: string, apiKey: string, subdomain: string) {
  const res = await fetch(`${wkBase(subdomain)}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Workable API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function workableTestConnection(apiKey: string, subdomain: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await wkFetch('/members?limit=1', apiKey, subdomain)
    return { ok: true, company: subdomain }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function workableFetchJobs(apiKey: string, subdomain: string): Promise<WKJob[]> {
  const jobs: WKJob[] = []
  let sinceId: string | undefined
  while (true) {
    let url = '/jobs?state=published&limit=100'
    if (sinceId) url += `&since_id=${sinceId}`
    const data = await wkFetch(url, apiKey, subdomain)
    const batch: WKJob[] = data.jobs || []
    jobs.push(...batch)
    if (!data.paging?.next) break
    sinceId = batch[batch.length - 1]?.id
    if (!sinceId) break
  }
  return jobs
}

export async function workableFetchCandidates(apiKey: string, subdomain: string, shortcode: string): Promise<WKCandidate[]> {
  const candidates: WKCandidate[] = []
  let sinceId: string | undefined
  while (true) {
    let url = `/jobs/${shortcode}/candidates?limit=100`
    if (sinceId) url += `&since_id=${sinceId}`
    const data = await wkFetch(url, apiKey, subdomain)
    const batch: WKCandidate[] = data.candidates || []
    candidates.push(...batch)
    if (!data.paging?.next) break
    sinceId = batch[batch.length - 1]?.id
    if (!sinceId) break
  }
  return candidates
}
