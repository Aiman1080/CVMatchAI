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

// Download a CV from its (token-authenticated) URL. The CV URL comes from the
// single-candidate endpoint, not the list.
export async function recruiteeDownloadCV(cvUrl: string, apiKey: string): Promise<Buffer | null> {
  try {
    const res = await fetch(cvUrl, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}
