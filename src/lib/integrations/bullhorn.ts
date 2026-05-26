// Bullhorn REST API integration
// Docs: https://bullhorn.github.io/rest-api-docs/
// Auth: BhRestToken header

export interface BHJobOrder {
  id: number
  title: string
  publicDescription?: string
  skillList?: string
  isOpen: boolean
  address?: { city?: string; state?: string; countryCode?: string }
  clientCorporation?: { name: string }
  dateAdded: number
}

export interface BHCandidate {
  id: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  linkedPersonId?: number
  status?: string
  dateAdded: number
}

async function bhFetch(url: string, apiKey: string) {
  const res = await fetch(url, {
    headers: {
      BhRestToken: apiKey,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Bullhorn API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

export async function bullhornTestConnection(apiKey: string, restUrl: string): Promise<{ ok: boolean; company?: string; error?: string }> {
  try {
    await bhFetch(`${restUrl}/entity/Candidate?count=1&fields=id`, apiKey)
    return { ok: true, company: 'Bullhorn' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function bullhornFetchJobs(apiKey: string, restUrl: string): Promise<BHJobOrder[]> {
  const jobs: BHJobOrder[] = []
  let start = 0
  const count = 100
  while (true) {
    const data = await bhFetch(
      `${restUrl}/search/JobOrder?query=isOpen:true&fields=id,title,publicDescription,skillList,isOpen,address,clientCorporation,dateAdded&count=${count}&start=${start}`,
      apiKey,
    )
    const batch: BHJobOrder[] = data.data || []
    jobs.push(...batch)
    if (batch.length < count) break
    start += count
  }
  return jobs
}

export async function bullhornFetchCandidates(apiKey: string, restUrl: string, since?: Date): Promise<BHCandidate[]> {
  const candidates: BHCandidate[] = []
  let start = 0
  const count = 100
  const sinceTs = since ? since.getTime() : 0
  const query = sinceTs ? `dateAdded:[${sinceTs} TO *]` : 'id:>0'
  while (true) {
    const data = await bhFetch(
      `${restUrl}/search/Candidate?query=${encodeURIComponent(query)}&fields=id,firstName,lastName,email,phone,status,dateAdded&count=${count}&start=${start}`,
      apiKey,
    )
    const batch: BHCandidate[] = data.data || []
    candidates.push(...batch)
    if (batch.length < count) break
    start += count
  }
  return candidates
}
