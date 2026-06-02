// SmartRecruiters API integration
// Docs: https://developers.smartrecruiters.com/reference
// Auth: x-smarttoken header (company API key). Base: https://api.smartrecruiters.com
//
// Verified against the live Candidates API + Jobs API OpenAPI specs:
//  - NO /v1 prefix. Both /jobs and /candidates paginate with a CURSOR
//    (nextPageId in the body -> pageId query param), NOT offset.
//  - GET /candidates returns { content, nextPageId, totalFound }; each item has
//    primaryAssignment.job {id,title} + status (a STRING enum), but NOT the phone
//    or LinkedIn - those only exist on GET /candidates/:id (where the field is
//    web.linkedin, lowercase).
//  - GET /jobs returns summaries only (id/title/location/status - no description).
//    Cursor paging needs sort=job_id.
//  - CVs: the candidate detail exposes actions.attachments (a URL to the
//    candidate's attachments); the per-file download is
//    GET /candidates/:id/attachments/:attachmentId.

const SR_BASE = 'https://api.smartrecruiters.com'

export interface SRLocation { city?: string; country?: string; countryCode?: string; region?: string }

export interface SRJob {
  id: string
  title: string
  refNumber?: string
  createdOn?: string
  updatedOn?: string
  department?: { label?: string }
  location?: SRLocation
  status?: string
  postingStatus?: string
}

export interface SRCandidate {
  id: string
  firstName: string
  lastName: string
  email?: string
  createdOn?: string
  updatedOn?: string
  location?: SRLocation
  tags?: string[]
  primaryAssignment?: {
    job?: { id?: string; title?: string }
    status?: string
    subStatus?: string
  }
}

export interface SRAction { url?: string; method?: string }

// GET /candidates/:id - much richer than the list (phone, web.linkedin,
// education/experience, and the attachments link).
export interface SRCandidateDetails {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  location?: SRLocation
  web?: { linkedin?: string; website?: string; facebook?: string; twitter?: string }
  createdOn?: string
  updatedOn?: string
  tags?: string[]
  primaryAssignment?: any
  actions?: { attachments?: SRAction; properties?: SRAction; [k: string]: SRAction | undefined }
}

async function srFetch(path: string, apiKey: string) {
  // Follow absolute URLs (e.g. an `actions` href) verbatim; otherwise resolve
  // against the API base.
  const url = path.startsWith('http') ? path : `${SR_BASE}${path}`
  const res = await fetch(url, {
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
    // Validate the key against an endpoint we actually use (no /v1 prefix).
    await srFetch('/candidates?limit=1', apiKey)
    return { ok: true, company: 'SmartRecruiters' }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// Cursor pagination via nextPageId. sort=job_id is required to page jobs.
export async function smartrecruitersFetchJobs(apiKey: string): Promise<SRJob[]> {
  const jobs: SRJob[] = []
  let pageId: string | undefined
  while (true) {
    let url = `/jobs?limit=100&sort=job_id`
    if (pageId) url += `&pageId=${encodeURIComponent(pageId)}`
    const data = await srFetch(url, apiKey)
    jobs.push(...(data.content || []))
    pageId = data.nextPageId
    if (!pageId) break
  }
  return jobs
}

export async function smartrecruitersFetchCandidates(apiKey: string, since?: Date): Promise<SRCandidate[]> {
  const candidates: SRCandidate[] = []
  let pageId: string | undefined
  while (true) {
    let url = `/candidates?limit=100`
    if (since) url += `&updatedAfter=${encodeURIComponent(since.toISOString())}`
    if (pageId) url += `&pageId=${encodeURIComponent(pageId)}`
    const data = await srFetch(url, apiKey)
    candidates.push(...(data.content || []))
    pageId = data.nextPageId
    if (!pageId) break
  }
  return candidates
}

// Phone, web.linkedin (lowercase) and the attachments link are only on the
// single-candidate endpoint. Null on failure so enrichment never aborts a sync.
export async function smartrecruitersFetchCandidate(apiKey: string, candidateId: string): Promise<SRCandidateDetails | null> {
  try {
    return await srFetch(`/candidates/${candidateId}`, apiKey)
  } catch {
    return null
  }
}

// Download the candidate's CV. The detail exposes actions.attachments (a URL to
// the attachments list); we follow it, pick the résumé and download it via the
// per-file endpoint.
// NOTE: the attachments-LIST response shape is not yet verified against the docs
// (we only have "Get a candidate's attachment" by id), so this parses
// defensively and returns null on anything unexpected - never aborts a sync.
export async function smartrecruitersDownloadCV(apiKey: string, attachmentsUrl?: string): Promise<{ buffer: Buffer; filename: string } | null> {
  if (!attachmentsUrl) return null
  try {
    const data = await srFetch(attachmentsUrl, apiKey)
    const list: any[] = Array.isArray(data) ? data : (data.content || data.attachments || [])
    if (!list.length) return null

    const isDoc = (n?: string) => /\.(pdf|docx?|rtf|odt)$/i.test(n || '')
    const isResumeMime = (m?: string) => /pdf|msword|officedocument|rtf/i.test(m || '')
    const item =
      list.find(a => /resume|cv|curriculum/i.test(`${a?.category || ''} ${a?.type || ''} ${a?.name || ''}`)) ||
      list.find(a => isDoc(a?.name) || isResumeMime(a?.mimeType || a?.contentType)) ||
      list[0]
    if (!item) return null

    const base = attachmentsUrl.split('?')[0].replace(/\/$/, '')
    const downloadUrl: string | undefined =
      item.actions?.download?.url || item.actions?.original?.url || item.url ||
      (item.id ? `${base}/${item.id}` : undefined)
    if (!downloadUrl) return null

    const res = await fetch(downloadUrl, { headers: { 'X-SmartToken': apiKey } })
    if (!res.ok) return null
    return { buffer: Buffer.from(await res.arrayBuffer()), filename: item.name || item.fileName || 'cv.pdf' }
  } catch {
    return null
  }
}
