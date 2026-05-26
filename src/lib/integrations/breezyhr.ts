// Breezy HR API integration
// Docs: https://developer.breezy.hr
// Auth: Bearer token

export interface BreezyPosition {
  _id: string
  name: string
  description?: string
  department?: string
  location?: { city?: string; country?: string }
  state?: string
  creation_date?: string
}

export interface BreezyCandidate {
  _id: string
  name?: string
  email_address?: string
  phone_number?: string
  profile_url?: string
  summary?: string
  stage?: { name: string }
  resume?: { url: string; file_name: string }
  creation_date?: string
  updated_date?: string
}

const BREEZY_BASE = 'https://api.breezy.hr/v3'

async function breezyFetch(path: string, apiKey: string) {
  const res = await fetch(`${BREEZY_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Breezy HR API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function breezyTestConnection(apiKey: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    const data = await breezyFetch('/user/details', apiKey)
    return { ok: true, company: data.name || 'Breezy HR' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function breezyFetchPositions(apiKey: string, companyId: string): Promise<BreezyPosition[]> {
  const data = await breezyFetch(`/company/${companyId}/positions`, apiKey)
  return Array.isArray(data) ? data : []
}

export async function breezyFetchCandidates(apiKey: string, companyId: string, positionId: string): Promise<BreezyCandidate[]> {
  const data = await breezyFetch(`/company/${companyId}/position/${positionId}/candidates`, apiKey)
  return Array.isArray(data) ? data : []
}

export async function breezyDownloadCV(url: string, apiKey: string): Promise<Buffer | null> {
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
