// Homerun API integration
// Docs: https://developers.homerun.co (Public API v2)
// Auth: Bearer token. Jobs live under /vacancies, candidates under
// /job-applications. Personal data is nested under `personal_info`, the stage is
// an object ({ name }), and the CV is a file (type 'resume') exposed via a
// temporary, pre-signed download URL on the application detail.

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
  // Homerun caps the API at 60 req/min and we make one detail call per candidate,
  // so back off and retry on 429 (honour Retry-After when present) before giving up.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${HOMERUN_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (res.status === 429 && attempt < 3) {
      const retryAfter = Number(res.headers?.get('retry-after')) || 0
      await new Promise(r => setTimeout(r, retryAfter > 0 ? retryAfter * 1000 : 1500 * (attempt + 1)))
      continue
    }
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Homerun API ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json()
  }
}

// /ping is Homerun's dedicated "is this key valid?" endpoint ({ pong: true }).
export async function homerunTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await homerunFetch('/ping', apiKey)
    return { ok: true, company: 'Homerun' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// Jobs = "vacancies" in Homerun. We pull the live ones (private + public) and
// flatten the nested location/department/page_content into our shared shape.
export async function homerunFetchJobs(apiKey: string): Promise<HomerunJob[]> {
  const jobs: HomerunJob[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const data = await homerunFetch(
      `/vacancies?filter[status]=private,public&include[]=location&include[]=page_content&perPage=${perPage}&page=${page}`,
      apiKey,
    )
    const batch: any[] = Array.isArray(data) ? data : (data.data || [])
    for (const v of batch) {
      jobs.push({
        id: v.id,
        title: v.title,
        description: v.description || v.page_content,
        department: typeof v.department === 'string' ? v.department : v.department?.name,
        location: typeof v.location === 'string' ? v.location : (v.location?.name || v.location?.city),
        status: v.status,
        created_at: v.created_at,
      })
    }
    const lastPage = data && data.meta ? data.meta.last_page : undefined
    if (batch.length < perPage || (lastPage && page >= lastPage)) break
    page++
  }
  return jobs
}

// Candidates = "job applications", filtered by vacancy. The list carries the
// nested personal_info + stage; the CV file lives on the application detail
// (files[] with a temporary, pre-signed download URL), so we resolve it per app.
export async function homerunFetchApplications(apiKey: string, jobId: string): Promise<HomerunApplication[]> {
  const applications: HomerunApplication[] = []
  let page = 1
  const perPage = 100
  while (true) {
    const data = await homerunFetch(
      `/job-applications?filter[vacancy_id]=${jobId}&include[]=stage&perPage=${perPage}&page=${page}`,
      apiKey,
    )
    const batch: any[] = Array.isArray(data) ? data : (data.data || [])
    for (const a of batch) {
      const pi = a.personal_info || {}
      const resume = await homerunResumeFile(apiKey, a.id)
      applications.push({
        id: a.id,
        first_name: pi.first_name || a.first_name,
        last_name: pi.last_name || a.last_name,
        email: pi.email || a.email,
        phone: pi.phone_number || a.phone_number,
        linkedin_url: a.linkedin,
        cover_letter: a.assignment,
        resume_url: resume.url,
        resume_filename: resume.name,
        stage: typeof a.stage === 'string' ? a.stage : a.stage?.name,
        created_at: a.created_at,
      })
    }
    const lastPage = data && data.meta ? data.meta.last_page : undefined
    if (batch.length < perPage || (lastPage && page >= lastPage)) break
    page++
  }
  return applications
}

// The CV is not returned in the application list; fetch the detail and pick the
// resume file (falling back to the first attachment). Best-effort: any failure
// here just means the candidate is imported without a CV.
async function homerunResumeFile(apiKey: string, appId: string): Promise<{ url?: string; name?: string }> {
  try {
    const data = await homerunFetch(`/job-applications/${appId}`, apiKey)
    const app = (data && data.data) || data
    const files: any[] = (app && app.files) || []
    const resume = files.find(f => f && f.type === 'resume') || files[0]
    return { url: resume?.temporary_download_url, name: resume?.name }
  } catch {
    return {}
  }
}

// temporary_download_url is a pre-signed URL, so it is fetched directly, without
// the API Bearer header.
export async function homerunDownloadCV(url: string, _apiKey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
