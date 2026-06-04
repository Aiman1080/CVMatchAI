// Recruitee (Tellent) ATS API integration
// Docs: https://docs.recruitee.com/reference (ATS API)
// Auth: "Authorization: Bearer <personal API token>". Company id (or subdomain) in
// the path: https://api.recruitee.com/c/{company}
//
// Field notes VERIFIED against the real /candidates JSON (the old version was wrong
// on almost every field):
//  - `emails` / `phones` are arrays of STRINGS, not objects.
//  - each placement carries `offer_id` + `stage_id` (integers). The stage NAME and
//    the offer (title/location/status) are returned in the top-level `references`
//    array (entries typed "Stage" / "Offer").
//  - pagination is `offset`/`limit` (NOT `page`).
//  - the CV / social links / cover letter are NOT in the list response - they live
//    on the single-candidate endpoint (GET /candidates/:id).

export interface RCPlacement {
  id: number
  offer_id: number
  stage_id: number
}

export interface RCCandidate {
  id: number
  name: string
  emails: string[]
  phones: string[]
  created_at: string
  placements?: RCPlacement[]
}

// The single-candidate endpoint (GET /candidates/:id) returns far more than the
// list - including the CV URLs, cover letter and social links. `cv_original_url`
// is the file the candidate uploaded; `cv_url` is a parsed/normalised version.
export interface RCCandidateDetail extends RCCandidate {
  cv_original_url?: string | null
  cv_url?: string | null
  cover_letter?: string | null
  social_links?: string[]
}

// Top-level `references` entries - offers (type "Offer") and stages (type "Stage").
export interface RCReference {
  id: number
  type: string
  title?: string
  location?: string
  status?: string
  name?: string
}

export interface RCOffer {
  id: number
  title: string
  description?: string
  requirements?: string
  status?: string
  location?: string
}

const RC_BASE = 'https://api.recruitee.com/c'

// Users routinely can't find the bare "company slug" - especially since Recruitee
// migrated to Tellent (app.tellent.com), where the slug no longer appears in the
// app URL (it shows an internal `ts_org_guid` instead). Accept whatever they paste
// - a careers-site URL, a {slug}.recruitee.com subdomain, the numeric company id,
// or an api/app.recruitee.com/c/{company} path - and reduce it to the bare
// {company} token the API path needs. Best-effort: if we guess wrong the
// connection test fails loudly, so nothing bad is ever stored silently.
export function normalizeRecruiteeCompany(raw: string): string {
  let s = (raw || '').trim()
  if (!s) return s
  s = s.replace(/^https?:\/\//i, '') // drop scheme so host/path parsing is predictable
  // .../c/{company}/... (api.recruitee.com or app.recruitee.com)
  const cMatch = s.match(/\/c\/([^/?#]+)/i)
  if (cMatch) return cMatch[1].trim()
  // {slug}.recruitee.com (careers site) - but ignore the reserved app/api/www hosts
  const subMatch = s.match(/^([a-z0-9-]+)\.recruitee\.com/i)
  if (subMatch && !['app', 'api', 'www'].includes(subMatch[1].toLowerCase())) return subMatch[1]
  // Bare slug / numeric id: drop any trailing path/query/hash and we're done. An
  // unrelated host (e.g. the Tellent app URL, which simply does NOT contain the
  // slug) is left intact so the connection test fails loudly instead of storing a
  // silently-wrong value.
  return s.split(/[/?#]/)[0]
}

async function rcFetch(path: string, apiKey: string, companySlug: string) {
  const res = await fetch(`${RC_BASE}/${companySlug}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Recruitee API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function recruiteeTestConnection(apiKey: string, companySlug: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await rcFetch('/candidates?limit=1', apiKey, companySlug)
    return { ok: true, company: companySlug }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// Offers (jobs). The /offers endpoint takes no limit/offset (it returns the whole
// collection); `scope=active` filters to active jobs.
export async function recruiteeFetchOffers(apiKey: string, companySlug: string): Promise<RCOffer[]> {
  const data = await rcFetch('/offers?scope=active', apiKey, companySlug)
  return data.offers || []
}

// Candidates, paginated with offset/limit. The top-level `references` (offers +
// stages) are accumulated alongside so the caller can resolve their names.
export async function recruiteeFetchCandidates(
  apiKey: string,
  companySlug: string,
  since?: Date,
): Promise<{ candidates: RCCandidate[]; references: RCReference[] }> {
  const candidates: RCCandidate[] = []
  const references: RCReference[] = []
  let offset = 0
  const limit = 100
  while (true) {
    // created_after wants yyyy-mm-ddThh:mm:ss (no milliseconds / timezone suffix).
    let url = `/candidates?limit=${limit}&offset=${offset}`
    if (since) url += `&created_after=${encodeURIComponent(since.toISOString().slice(0, 19))}`
    const data = await rcFetch(url, apiKey, companySlug)
    const batch: RCCandidate[] = data.candidates || []
    candidates.push(...batch)
    references.push(...(data.references || []))
    if (batch.length < limit) break
    offset += limit
  }
  return { candidates, references }
}

// Single candidate (GET /candidates/:id) - the only place the CV / cover letter /
// social links are exposed. Returns null on failure so one bad record never
// aborts the whole sync.
export async function recruiteeFetchCandidate(
  apiKey: string,
  companySlug: string,
  id: number,
): Promise<RCCandidateDetail | null> {
  try {
    const data = await rcFetch(`/candidates/${id}`, apiKey, companySlug)
    return data.candidate || null
  } catch {
    return null
  }
}

// Download a CV from the URL exposed on the single-candidate endpoint
// (cv_original_url / cv_url). These point at Recruitee's S3 bucket and must be
// fetched WITHOUT the API token; only api.recruitee.com URLs take the Bearer
// header. Returns null on any failure so a missing CV never aborts a sync.
export async function recruiteeDownloadCV(cvUrl: string, apiKey: string): Promise<{ buffer: Buffer; filename: string } | null> {
  try {
    const onApi = /\/\/api\.recruitee\.com/i.test(cvUrl)
    const res = await fetch(cvUrl, onApi ? { headers: { Authorization: `Bearer ${apiKey}` } } : {})
    if (!res.ok) return null
    let filename = 'cv.pdf'
    try {
      const base = new URL(cvUrl).pathname.split('/').pop()
      if (base) filename = decodeURIComponent(base)
    } catch { /* keep default filename */ }
    return { buffer: Buffer.from(await res.arrayBuffer()), filename }
  } catch {
    return null
  }
}
