// Recruitee API integration
// Docs: https://docs.recruitee.com/reference
// Auth: API token in header Authorization: Bearer <token>
// Company slug required for all endpoints

export interface RCCandidate {
  id: number
  name: string
  emails: Array<{ address: string }>
  phones: Array<{ number: string }>
  social_links?: Array<{ type: string; url: string }>
  cover_letter?: string
  created_at: string
  placements?: Array<{
    id: number
    offer_id: number
    stage: { name: string }
    cv?: { filename: string; url: string }
  }>
}

export interface RCOffer {
  id: number
  title: string
  description?: string
  requirements?: string
  status: string
  created_at: string
  remote_status?: string
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
    const data = await rcFetch('/offers?limit=1', apiKey, companySlug)
    return { ok: true, company: companySlug }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function recruiteeFetchOffers(apiKey: string, companySlug: string): Promise<RCOffer[]> {
  const offers: RCOffer[] = []
  let page = 1
  while (true) {
    const data = await rcFetch(`/offers?limit=100&page=${page}&status=published`, apiKey, companySlug)
    const batch: RCOffer[] = data.offers || []
    offers.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return offers
}

export async function recruiteeFetchCandidates(apiKey: string, companySlug: string, since?: Date): Promise<RCCandidate[]> {
  const candidates: RCCandidate[] = []
  let page = 1
  while (true) {
    let url = `/candidates?limit=100&page=${page}&include_placements=true`
    if (since) url += `&created_after=${encodeURIComponent(since.toISOString())}`
    const data = await rcFetch(url, apiKey, companySlug)
    const batch: RCCandidate[] = data.candidates || []
    candidates.push(...batch)
    if (batch.length < 100) break
    page++
  }
  return candidates
}

export async function recruiteeDownloadCV(cvUrl: string, apiKey: string): Promise<Buffer | null> {
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
