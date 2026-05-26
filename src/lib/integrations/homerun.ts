// Homerun API integration
// Docs: https://developers.homerun.co
// Auth: Bearer token

export interface HomerunJob {
  id: string
  title: string
  description?: string
  department?: string
  location?: string
  status: string
  created_at: string
}

export interface HomerunApplication {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  linkedin_url?: string
  cover_letter?: string
  resume_url?: string
  resume_filename?: string
  stage?: string
  created_at: string
  updated_at?: string
}

const HOMERUN_BASE = 'https://api.homerun.co/v2'

async function homerunFetch(path: string, apiKey: string) {
  const res = await fetch(`${HOMERUN_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Homerun API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function homerunTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await homerunFetch('/jobs?per_page=1', apiKey)
    return { ok: true, company: 'Homerun' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function homerunFetchJobs(apiKey: string): Promise<HomerunJob[]> {
  const jobs: HomerunJob[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const data = await homerunFetch(`/jobs?status=published&per_page=${perPage}&page=${page}`, apiKey)
    const batch: HomerunJob[] = data.data || data || []
    const items = Array.isArray(batch) ? batch : []
    jobs.push(...items)
    if (items.length < perPage) break
    page++
  }
  return jobs
}

export async function homerunFetchApplications(apiKey: string, jobId: string): Promise<HomerunApplication[]> {
  const applications: HomerunApplication[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const data = await homerunFetch(`/jobs/${jobId}/applications?per_page=${perPage}&page=${page}`, apiKey)
    const batch: HomerunApplication[] = data.data || data || []
    const items = Array.isArray(batch) ? batch : []
    applications.push(...items)
    if (items.length < perPage) break
    page++
  }
  return applications
}

export async function homerunDownloadCV(url: string, apiKey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
