// Workable API integration
// Docs: https://workable.readme.io/reference
// Base: https://{subdomain}.workable.com/spi/v3  ·  Auth: Authorization: Bearer <token>
//
// Gotchas baked in below (verified against the v3 SPI docs):
//  - Candidates are listed via GET /candidates?shortcode=... . The path
//    /jobs/:shortcode/candidates is the POST *create* endpoint, NOT a list.
//  - Both /jobs and /candidates paginate via an absolute `paging.next` URL
//    (sometimes on a different Workable host), which must be followed verbatim.
//  - The /jobs list omits description/requirements; the per-job record
//    (/jobs/:shortcode) carries them.
//  - CVs are not inline: /candidates/:id/files returns the documents with
//    temporary pre-signed (S3) download URLs.

import { createLogger } from '@/lib/logger'

const log = createLogger('workable')

export interface WKJob {
  id: string
  shortcode: string
  title: string
  full_title?: string
  state: string
  created_at: string
  department?: string
  location?: { city?: string; country?: string; country_code?: string }
  // Present on /jobs/:shortcode (and on /jobs only when include_fields is asked for).
  description?: string
  requirements?: string
  benefits?: string
}

export interface WKCandidate {
  id: string
  name?: string
  firstname?: string
  lastname?: string
  email?: string
  phone?: string
  stage?: string
  disqualified?: boolean
  created_at: string
  resume_metadata?: { filename?: string; filetype?: string }
}

// The single-candidate record (GET /candidates/:id) carries fields the list omits:
// the cover letter, the profile summary and the social profiles (incl. the real
// LinkedIn URL - profile_url is only an internal Workable backend link).
export interface WKCandidateDetail extends WKCandidate {
  cover_letter?: string | null
  summary?: string | null
  resume_url?: string | null
  social_profiles?: Array<{ type?: string; url?: string }>
}

export interface WKFile {
  name?: string
  preview_url?: string
  kind?: string
  source?: string
}

function wkBase(subdomain: string) {
  return `https://${subdomain}.workable.com/spi/v3`
}

async function wkFetch(pathOrUrl: string, apiKey: string, subdomain: string) {
  // paging.next comes back as an absolute URL, so follow it verbatim;
  // otherwise resolve the path against the account base.
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${wkBase(subdomain)}${pathOrUrl}`
  const res = await fetch(url, {
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
    // Validate the token against the scope we actually sync with (r_jobs).
    await wkFetch('/jobs?limit=1', apiKey, subdomain)
    return { ok: true, company: subdomain }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

export async function workableFetchJobs(apiKey: string, subdomain: string): Promise<WKJob[]> {
  const jobs: WKJob[] = []
  // No state filter: fetch jobs in ALL states (draft/published/closed/archived)
  // so we also import candidates from non-published jobs (e.g. drafts, closed reqs).
  let url: string | undefined = '/jobs?limit=100'
  while (url) {
    const data = await wkFetch(url, apiKey, subdomain)
    jobs.push(...(data.jobs || []))
    url = data.paging?.next
  }
  return jobs
}

// The /jobs list omits the long-form fields; the per-job record carries
// description / requirements / benefits. Returns null on failure so a single
// bad job doesn't abort the whole sync.
export async function workableFetchJob(apiKey: string, subdomain: string, shortcode: string): Promise<WKJob | null> {
  try {
    return await wkFetch(`/jobs/${shortcode}`, apiKey, subdomain)
  } catch {
    return null
  }
}

export async function workableFetchCandidates(apiKey: string, subdomain: string, shortcode: string): Promise<WKCandidate[]> {
  const candidates: WKCandidate[] = []
  let url: string | undefined = `/candidates?shortcode=${encodeURIComponent(shortcode)}&limit=100`
  while (url) {
    const data = await wkFetch(url, apiKey, subdomain)
    candidates.push(...(data.candidates || []))
    url = data.paging?.next
  }
  return candidates
}

// Single candidate (GET /candidates/:id) - the only place the cover letter,
// summary and social profiles (real LinkedIn URL) are exposed. Returns null on
// failure so enrichment never aborts a sync. Response is wrapped in { candidate }.
export async function workableFetchCandidate(apiKey: string, subdomain: string, id: string): Promise<WKCandidateDetail | null> {
  try {
    const data = await wkFetch(`/candidates/${id}`, apiKey, subdomain)
    return data.candidate || null
  } catch {
    return null
  }
}

// Download a Workable file URL. Pre-signed S3 links need no auth; workable.com
// URLs need the Bearer token - so try plain first, then with auth.
async function wkDownload(url: string, apiKey: string): Promise<Buffer | null> {
  for (const opts of [undefined, { headers: { Authorization: `Bearer ${apiKey}` } }]) {
    try {
      const res = await fetch(url, opts as any)
      if (res.ok) return Buffer.from(await res.arrayBuffer())
    } catch { /* try next */ }
  }
  return null
}

// Download a candidate's CV. Prefer the candidate detail's `resume_url` (the
// canonical résumé link); fall back to scanning /candidates/:id/files for a
// résumé. Returns null (never throws) so a missing CV never aborts a sync.
export async function workableDownloadCV(
  apiKey: string,
  subdomain: string,
  candidateId: string,
  resumeFilename?: string,
  resumeUrl?: string,
): Promise<{ buffer: Buffer; filename: string } | null> {
  // 1) Direct resume_url from the candidate detail.
  if (resumeUrl) {
    const buf = await wkDownload(resumeUrl, apiKey)
    if (buf) {
      log.info('cv via resume_url', { candidateId })
      return { buffer: buf, filename: resumeFilename || 'cv.pdf' }
    }
  }
  // 2) Fall back to the candidate's files list.
  try {
    const data = await wkFetch(`/candidates/${candidateId}/files`, apiKey, subdomain)
    const files: WKFile[] = data.files || (Array.isArray(data) ? data : [])
    log.info('cv files lookup', { candidateId, fileCount: files.length, names: files.map(f => f.name) })
    if (!files.length) return null

    const isDoc = (n?: string) => /\.(pdf|docx?|rtf|odt)$/i.test(n || '')
    const file =
      (resumeFilename ? files.find(f => f.name === resumeFilename) : undefined) ||
      files.find(f => /resume|cv|curriculum/i.test(`${f.source || ''} ${f.kind || ''}`)) ||
      files.find(f => isDoc(f.name)) ||
      files[0]
    const url = file?.preview_url || (file as any)?.url
    if (!url) { log.warn('cv file has no url', { candidateId, file }); return null }

    const buf = await wkDownload(url, apiKey)
    if (!buf) { log.warn('cv download failed', { candidateId, url: url.split('?')[0] }); return null }
    return { buffer: buf, filename: file.name || resumeFilename || 'cv.pdf' }
  } catch (e: any) {
    log.warn('cv files error', { candidateId, error: e.message })
    return null
  }
}
