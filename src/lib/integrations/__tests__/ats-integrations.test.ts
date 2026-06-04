// Comprehensive test suite for all 14 ATS integrations
// Verifies: request format (URL, auth, method), response parsing, error handling,
// edge cases, pagination, and sync orchestration.

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Global fetch mock ────────────────────────────────────────────────────────
vi.stubGlobal('fetch', vi.fn())

// ── Prisma mock (no real DB hits) ───────────────────────────────────────────
const prismaMock = {
  vacancy: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  candidate: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
  prisma: prismaMock,
}))

// Mock pdf-parser to avoid real PDF parsing
vi.mock('@/lib/pdf-parser', () => ({
  parseDocument: vi.fn().mockResolvedValue('parsed CV text content with enough characters to be considered valid content here'),
}))

// Mock AI analysis
vi.mock('@/lib/ai', () => ({
  analyzeCVAgainstVacancy: vi.fn().mockResolvedValue({
    matchScore: 75,
    summary: 'good candidate',
    strengths: ['react'],
    weaknesses: ['no docker'],
    skills: ['ts'],
    experience: '5 years',
    education: 'BSc',
    recommendation: 'consider',
    language: 'en',
    firstName: undefined,
    lastName: undefined,
    email: undefined,
    phone: undefined,
  }),
}))

// Helper: build a fetch response stub
function jsonResponse(body: any, status = 200, headers: Record<string, string> = {}): any {
  const lower: Record<string, string> = {}
  for (const k in headers) lower[k.toLowerCase()] = headers[k]
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    arrayBuffer: async () => new ArrayBuffer(8),
    headers: { get: (k: string) => lower[k.toLowerCase()] ?? null },
  }
}

function errorResponse(status: number, text = 'error'): any {
  return {
    ok: false,
    status,
    json: async () => ({ error: text }),
    text: async () => text,
    arrayBuffer: async () => new ArrayBuffer(0),
    headers: { get: () => null },
  }
}

beforeEach(() => {
  vi.mocked(fetch).mockReset()
  Object.values(prismaMock).forEach(model => {
    Object.values(model).forEach((fn: any) => {
      if (typeof fn?.mockReset === 'function') fn.mockReset()
    })
  })
  // Sensible defaults
  prismaMock.vacancy.findFirst.mockResolvedValue(null)
  prismaMock.vacancy.findMany.mockResolvedValue([])
  prismaMock.vacancy.findUnique.mockResolvedValue({
    id: 'vac-1', title: 'Job', description: 'd', requirements: 'r',
  })
  prismaMock.vacancy.create.mockImplementation(async ({ data }: any) =>
    ({ id: 'vac-' + (data.externalId || 'new'), ...data }))
  prismaMock.vacancy.update.mockImplementation(async ({ where, data }: any) =>
    ({ id: where.id, ...data }))
  prismaMock.candidate.findFirst.mockResolvedValue(null)
  prismaMock.candidate.create.mockImplementation(async ({ data }: any) =>
    ({ id: 'cand-' + (data.externalId || 'new'), firstName: data.firstName, lastName: data.lastName, email: data.email, ...data }))
  prismaMock.candidate.update.mockResolvedValue({ id: 'cand-1' })
  prismaMock.user.findUnique.mockResolvedValue({ company: 'TestCo' })
})

// ════════════════════════════════════════════════════════════════════════════
// 1. TEAMTAILOR
// ════════════════════════════════════════════════════════════════════════════
describe('Teamtailor integration', () => {
  it('teamtailorFetchJobs: calls correct URL and auth header', async () => {
    const { teamtailorFetchJobs } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [], links: {} }))

    await teamtailorFetchJobs('test-key')

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.teamtailor.com/v1/jobs')
    expect(call[0]).toContain('page[size]=30')
    expect((call[1] as any).headers.Authorization).toBe('Token token=test-key')
    expect((call[1] as any).headers['X-Api-Version']).toBeTruthy()
  })

  it('teamtailorFetchJobs: parses jobs from data array', async () => {
    const { teamtailorFetchJobs } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [
        { id: '1', attributes: { title: 'Engineer', body: 'desc', status: 'open', 'human-status': 'published', 'created-at': '2024-01-01' } },
        { id: '2', attributes: { title: 'Designer', status: 'open', 'human-status': 'published', 'created-at': '2024-01-02' } },
      ],
      links: {},
    }))

    const jobs = await teamtailorFetchJobs('k')
    expect(jobs).toHaveLength(2)
    expect(jobs[0].attributes.title).toBe('Engineer')
    expect(jobs[0].attributes.body).toBe('desc')
  })

  it('teamtailorFetchJobs: follows pagination via links.next', async () => {
    const { teamtailorFetchJobs } = await import('../teamtailor')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '1', attributes: { title: 'A', status: 'open', 'human-status': 'published', 'created-at': '2024' } }], links: { next: 'https://api.teamtailor.com/v1/jobs?page=2' } }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '2', attributes: { title: 'B', status: 'open', 'human-status': 'published', 'created-at': '2024' } }], links: {} }))

    const jobs = await teamtailorFetchJobs('k')
    expect(jobs).toHaveLength(2)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('teamtailorFetchJobs: throws on 401', async () => {
    const { teamtailorFetchJobs } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401, 'unauthorized'))
    await expect(teamtailorFetchJobs('bad')).rejects.toThrow(/401/)
  })

  it('teamtailorTestConnection: returns ok with company name', async () => {
    const { teamtailorTestConnection } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: { attributes: { name: 'ACME' } } }))
    const r = await teamtailorTestConnection('k')
    expect(r.ok).toBe(true)
    expect(r.company).toBe('ACME')
  })

  it('teamtailorTestConnection: catches errors gracefully', async () => {
    const { teamtailorTestConnection } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(403))
    const r = await teamtailorTestConnection('k')
    expect(r.ok).toBe(false)
    expect(r.error).toBeTruthy()
  })

  it('teamtailorFetchApplications: filters by since client-side', async () => {
    const { teamtailorFetchApplications } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [
        { id: 'old', attributes: { 'created-at': '2024-01-01' }, relationships: {} },
        { id: 'new', attributes: { 'created-at': '2024-02-01' }, relationships: {} },
      ],
      links: {},
    }))
    const apps = await teamtailorFetchApplications('k', new Date('2024-01-15'))
    expect(apps).toHaveLength(1)
    expect(apps[0].id).toBe('new')
  })

  it('teamtailorDownloadCV: returns null on failure (does not crash)', async () => {
    const { teamtailorDownloadCV } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    const r = await teamtailorDownloadCV('https://x/y', 'k')
    expect(r).toBeNull()
  })

  it('teamtailorResolveBase: falls back from the EU host to NA when the EU key check fails', async () => {
    const { teamtailorResolveBase } = await import('../teamtailor')
    vi.mocked(fetch)
      .mockResolvedValueOnce(errorResponse(401)) // EU rejects this key
      .mockResolvedValueOnce(jsonResponse({ data: { attributes: { name: 'ACME-NA' } } })) // NA works
    const r = await teamtailorResolveBase('k')
    expect(r.baseUrl).toContain('api.na.teamtailor.com')
    expect(r.company).toBe('ACME-NA')
    expect(vi.mocked(fetch).mock.calls[0][0] as string).toContain('api.teamtailor.com/v1/company') // EU tried first
    expect(vi.mocked(fetch).mock.calls[1][0] as string).toContain('api.na.teamtailor.com/v1/company')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 2. RECRUITEE
// ════════════════════════════════════════════════════════════════════════════
describe('Recruitee integration', () => {
  it('recruiteeFetchOffers: uses Bearer auth and includes company slug', async () => {
    const { recruiteeFetchOffers } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ offers: [] }))
    await recruiteeFetchOffers('apikey', 'my-co')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.recruitee.com/c/my-co')
    expect((call[1] as any).headers.Authorization).toBe('Bearer apikey')
  })

  it('recruiteeFetchOffers: returns parsed offers', async () => {
    const { recruiteeFetchOffers } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      offers: [
        { id: 1, title: 'Dev', description: 'd', requirements: 'r', status: 'published', created_at: '2024' },
      ],
    }))
    const offers = await recruiteeFetchOffers('k', 'co')
    expect(offers).toHaveLength(1)
    expect(offers[0].title).toBe('Dev')
  })

  it('recruiteeFetchCandidates: paginates via offset while batch size full', async () => {
    const { recruiteeFetchCandidates } = await import('../recruitee')
    const big = Array.from({ length: 100 }, (_, i) => ({ id: i, name: 'A B', emails: [`a${i}@x.com`], phones: [], created_at: '2024' }))
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ candidates: big }))
      .mockResolvedValueOnce(jsonResponse({ candidates: [{ id: 999, name: 'C D', emails: [], phones: [], created_at: '2024' }] }))
    const { candidates } = await recruiteeFetchCandidates('k', 'co')
    expect(candidates).toHaveLength(101)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain('offset=100')
  })

  it('recruiteeFetchCandidates: throws on 500', async () => {
    const { recruiteeFetchCandidates } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500, 'oops'))
    await expect(recruiteeFetchCandidates('k', 'co')).rejects.toThrow(/500/)
  })

  it('recruiteeFetchCandidates: handles empty candidates array', async () => {
    const { recruiteeFetchCandidates } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ candidates: [] }))
    const r = await recruiteeFetchCandidates('k', 'co')
    expect(r.candidates).toEqual([])
  })

  it('recruiteeTestConnection: returns ok on success', async () => {
    const { recruiteeTestConnection } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ offers: [] }))
    const r = await recruiteeTestConnection('k', 'co')
    expect(r.ok).toBe(true)
  })

  it('recruiteeFetchCandidate: GETs /candidates/:id and unwraps the candidate', async () => {
    const { recruiteeFetchCandidate } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      candidate: { id: 27746490, name: 'John Smith', cv_original_url: 'https://s3/cv.pdf', cover_letter: 'Hi' },
      references: [],
    }))
    const c = await recruiteeFetchCandidate('k', 'co', 27746490)
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/c/co/candidates/27746490')
    expect(c?.cv_original_url).toBe('https://s3/cv.pdf')
  })

  it('recruiteeFetchCandidate: returns null on 404 (no crash)', async () => {
    const { recruiteeFetchCandidate } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    expect(await recruiteeFetchCandidate('k', 'co', 1)).toBeNull()
  })

  it('recruiteeDownloadCV: downloads the S3 url WITHOUT the API token and derives the filename', async () => {
    const { recruiteeDownloadCV } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse('binary'))
    const r = await recruiteeDownloadCV('https://recruitee-main.s3.eu-central-1.amazonaws.com/candidates/1/john_cv.pdf', 'tok')
    expect(r?.filename).toBe('john_cv.pdf')
    const opts = vi.mocked(fetch).mock.calls[0][1] as any
    expect(opts?.headers?.Authorization).toBeUndefined()
  })

  it('recruiteeDownloadCV: sends Bearer auth for api.recruitee.com URLs', async () => {
    const { recruiteeDownloadCV } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse('binary'))
    await recruiteeDownloadCV('https://api.recruitee.com/c/co/candidates/1/cv', 'tok')
    const opts = vi.mocked(fetch).mock.calls[0][1] as any
    expect(opts?.headers?.Authorization).toBe('Bearer tok')
  })

  it('recruiteeDownloadCV: returns null on download failure', async () => {
    const { recruiteeDownloadCV } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(403))
    expect(await recruiteeDownloadCV('https://s3/x.pdf', 'tok')).toBeNull()
  })

  it('normalizeRecruiteeCompany: reduces every form a user might paste to the bare slug', async () => {
    const { normalizeRecruiteeCompany } = await import('../recruitee')
    // bare slug + numeric company id pass through untouched (trimmed)
    expect(normalizeRecruiteeCompany('acme-corp')).toBe('acme-corp')
    expect(normalizeRecruiteeCompany('  acme-corp  ')).toBe('acme-corp')
    expect(normalizeRecruiteeCompany('123456')).toBe('123456')
    // careers-site subdomain, with or without scheme / path
    expect(normalizeRecruiteeCompany('acme-corp.recruitee.com')).toBe('acme-corp')
    expect(normalizeRecruiteeCompany('https://acme-corp.recruitee.com')).toBe('acme-corp')
    expect(normalizeRecruiteeCompany('https://acme-corp.recruitee.com/o/dev-job')).toBe('acme-corp')
    // app / api urls that carry the /c/{company} segment
    expect(normalizeRecruiteeCompany('https://app.recruitee.com/c/acme-corp/#/overview')).toBe('acme-corp')
    expect(normalizeRecruiteeCompany('api.recruitee.com/c/acme-corp/candidates')).toBe('acme-corp')
    // empty stays empty
    expect(normalizeRecruiteeCompany('')).toBe('')
  })

  it('normalizeRecruiteeCompany: never mistakes the reserved app/api subdomain for a slug', async () => {
    const { normalizeRecruiteeCompany } = await import('../recruitee')
    // app.recruitee.com WITHOUT a /c/ segment has no slug to extract -> must not yield "app"
    expect(normalizeRecruiteeCompany('https://app.recruitee.com/#/settings/api_tokens')).not.toBe('app')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 3. SMARTRECRUITERS
// ════════════════════════════════════════════════════════════════════════════
describe('SmartRecruiters integration', () => {
  it('smartrecruitersFetchJobs: uses X-SmartToken + /jobs (no /v1) + cursor sort', async () => {
    const { smartrecruitersFetchJobs } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ content: [] }))
    await smartrecruitersFetchJobs('tok')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.smartrecruiters.com/jobs')
    expect(call[0]).not.toContain('/v1/')
    expect(call[0]).toContain('sort=job_id')
    expect((call[1] as any).headers['X-SmartToken']).toBe('tok')
  })

  it('smartrecruitersTestConnection: validates via /candidates (no /v1) with X-SmartToken', async () => {
    const { smartrecruitersTestConnection } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ content: [] }))
    const r = await smartrecruitersTestConnection('tok')
    expect(r.ok).toBe(true)
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.smartrecruiters.com/candidates')
    expect(call[0]).not.toContain('/v1/')
    expect((call[1] as any).headers['X-SmartToken']).toBe('tok')
  })

  it('smartrecruitersFetchJobs: parses content array (summary fields)', async () => {
    const { smartrecruitersFetchJobs } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      content: [{ id: '1', title: 'PM', status: 'SOURCING', createdOn: '2024', location: { city: 'Paris' } }],
    }))
    const jobs = await smartrecruitersFetchJobs('k')
    expect(jobs[0].title).toBe('PM')
    expect(jobs[0].location?.city).toBe('Paris')
  })

  it('smartrecruitersFetchCandidates: paginates via nextPageId (cursor, not offset)', async () => {
    const { smartrecruitersFetchCandidates } = await import('../smartrecruiters')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ content: [{ id: 'c1', firstName: 'A', lastName: 'B' }], nextPageId: 'PAGE2' }))
      .mockResolvedValueOnce(jsonResponse({ content: [{ id: 'c2', firstName: 'C', lastName: 'D' }] }))
    const r = await smartrecruitersFetchCandidates('k')
    expect(r.map(c => c.id)).toEqual(['c1', 'c2'])
    expect(vi.mocked(fetch).mock.calls[1][0]).toContain('pageId=PAGE2')
  })

  it('smartrecruitersFetchCandidates: passes updatedAfter when since provided', async () => {
    const { smartrecruitersFetchCandidates } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ content: [] }))
    await smartrecruitersFetchCandidates('k', new Date('2024-01-01'))
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('updatedAfter=')
  })

  it('smartrecruitersFetchCandidates: throws on 429 rate limit', async () => {
    const { smartrecruitersFetchCandidates } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(429, 'rate limited'))
    await expect(smartrecruitersFetchCandidates('k')).rejects.toThrow(/429/)
  })

  it('smartrecruitersFetchCandidate: GETs /candidates/:id (phone + web.linkedin lowercase)', async () => {
    const { smartrecruitersFetchCandidate } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      id: 'c1', phoneNumber: '+33', web: { linkedin: 'http://lnkd.in/x' },
      actions: { attachments: { url: 'https://api.smartrecruiters.com/candidates/c1/attachments', method: 'GET' } },
    }))
    const d = await smartrecruitersFetchCandidate('k', 'c1')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/candidates/c1')
    expect(d?.web?.linkedin).toBe('http://lnkd.in/x')
  })

  it('smartrecruitersDownloadCV: picks the résumé and downloads via actions.download.url', async () => {
    const { smartrecruitersDownloadCV } = await import('../smartrecruiters')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ content: [
        { id: 'a1', name: 'photo.png', type: 'OTHER', contentType: 'image/png', actions: { download: { url: 'https://files/x.png', method: 'GET' } } },
        { id: 'a2', name: 'jane_cv.pdf', type: 'RESUME', contentType: 'application/pdf', actions: { download: { url: 'https://files/cv.pdf', method: 'GET' } } },
      ] }))
      .mockResolvedValueOnce(jsonResponse('binary'))
    const r = await smartrecruitersDownloadCV('k', 'https://api.smartrecruiters.com/candidates/c1/attachments')
    expect(r?.filename).toBe('jane_cv.pdf')
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('https://files/cv.pdf')
  })

  it('smartrecruitersDownloadCV: returns null when there is no attachments url', async () => {
    const { smartrecruitersDownloadCV } = await import('../smartrecruiters')
    expect(await smartrecruitersDownloadCV('k', undefined)).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 4. GREENHOUSE
// ════════════════════════════════════════════════════════════════════════════
describe('Greenhouse integration (Harvest v3)', () => {
  it('greenhouseGetToken: POSTs client_credentials with Basic auth', async () => {
    const { greenhouseGetToken } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ token_type: 'Bearer', access_token: 'JWT123' }))
    const tok = await greenhouseGetToken('cid', 'secret')
    expect(tok).toBe('JWT123')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('auth.greenhouse.io/token?grant_type=client_credentials')
    expect((call[1] as any).method).toBe('POST')
    const auth = (call[1] as any).headers.Authorization as string
    expect(Buffer.from(auth.replace('Basic ', ''), 'base64').toString()).toBe('cid:secret')
  })

  it('greenhouseFetchJobs: uses Bearer + /v3/jobs and follows the Link cursor', async () => {
    const { greenhouseFetchJobs } = await import('../greenhouse')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'A' }], 200, { link: '<https://harvest.greenhouse.io/v3/jobs?cursor=C2>; rel="next"' }))
      .mockResolvedValueOnce(jsonResponse([{ id: 2, name: 'B' }]))
    const jobs = await greenhouseFetchJobs('JWT')
    expect(jobs.map(j => j.id)).toEqual([1, 2])
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('harvest.greenhouse.io/v3/jobs')
    expect((call[1] as any).headers.Authorization).toBe('Bearer JWT')
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('https://harvest.greenhouse.io/v3/jobs?cursor=C2')
  })

  it('greenhouseFetchCandidates: appends the v3 pipe-operator updated_at filter for since', async () => {
    const { greenhouseFetchCandidates } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
    await greenhouseFetchCandidates('JWT', new Date('2024-06-01'))
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('updated_at=gte|')
  })

  it('greenhouseFetchApplications: hits /v3/applications', async () => {
    const { greenhouseFetchApplications } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ id: 1, candidate_id: 5, job_id: 9, status: 'in_process', stage_name: 'Review' }]))
    const apps = await greenhouseFetchApplications('JWT')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/v3/applications')
    expect(apps[0].candidate_id).toBe(5)
  })

  it('greenhouseFetchResumes: filters by type=resume + candidate_ids', async () => {
    const { greenhouseFetchResumes } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ id: 1, candidate_id: 5, type: 'resume', filename: 'cv.pdf', url: 'https://x' }]))
    const atts = await greenhouseFetchResumes('JWT', [5, 6])
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('/v3/attachments')
    expect(url).toContain('type=resume')
    expect(url).toContain('candidate_ids=5,6')
    expect(atts[0].filename).toBe('cv.pdf')
  })

  it('greenhouseFetchResumes: no candidates -> no request', async () => {
    const { greenhouseFetchResumes } = await import('../greenhouse')
    expect(await greenhouseFetchResumes('JWT', [])).toEqual([])
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('greenhouseDownloadResume: downloads the signed url', async () => {
    const { greenhouseDownloadResume } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse('binary'))
    const r = await greenhouseDownloadResume({ id: 1, type: 'resume', filename: 'cv.pdf', url: 'https://files/cv.pdf' })
    expect(r?.filename).toBe('cv.pdf')
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('https://files/cv.pdf')
  })

  it('greenhouseDownloadResume: returns null when no attachment', async () => {
    const { greenhouseDownloadResume } = await import('../greenhouse')
    expect(await greenhouseDownloadResume(null)).toBeNull()
  })

  it('greenhouseFetchJobs: throws on 401', async () => {
    const { greenhouseFetchJobs } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401))
    await expect(greenhouseFetchJobs('bad')).rejects.toThrow(/401/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 5. LEVER
// ════════════════════════════════════════════════════════════════════════════
describe('Lever integration', () => {
  it('leverFetchPostings: uses Basic auth', async () => {
    const { leverFetchPostings } = await import('../lever')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [], hasNext: false }))
    await leverFetchPostings('apik')
    const auth = (vi.mocked(fetch).mock.calls[0][1] as any).headers.Authorization
    expect(auth).toMatch(/^Basic /)
    expect(Buffer.from(auth.replace('Basic ', ''), 'base64').toString()).toBe('apik:')
  })

  it('leverFetchPostings: parses postings with content', async () => {
    const { leverFetchPostings } = await import('../lever')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{
        id: 'p1', text: 'Frontend Eng', state: 'published',
        content: { description: 'cool job', lists: [{ text: 'Reqs', content: 'react' }] },
        createdAt: 123,
      }],
      hasNext: false,
    }))
    const r = await leverFetchPostings('k')
    expect(r).toHaveLength(1)
    expect(r[0].text).toBe('Frontend Eng')
    expect(r[0].content?.description).toBe('cool job')
  })

  it('leverFetchOpportunities: follows pagination via next cursor', async () => {
    const { leverFetchOpportunities } = await import('../lever')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 'a', createdAt: 1, updatedAt: 1 }], hasNext: true, next: 'CURSOR' }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 'b', createdAt: 2, updatedAt: 2 }], hasNext: false }))
    const r = await leverFetchOpportunities('k')
    expect(r).toHaveLength(2)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect((vi.mocked(fetch).mock.calls[1][0] as string)).toContain('offset=CURSOR')
  })

  it('leverFetchOpportunities: appends updated_at_start when since given', async () => {
    const { leverFetchOpportunities } = await import('../lever')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [], hasNext: false }))
    await leverFetchOpportunities('k', new Date('2024-03-01'))
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('updated_at_start=')
  })

  it('leverTestConnection: catches API error', async () => {
    const { leverTestConnection } = await import('../lever')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(403))
    const r = await leverTestConnection('k')
    expect(r.ok).toBe(false)
  })

  it('leverFetchResume: lists the opportunity resumes and returns one with a file', async () => {
    const { leverFetchResume } = await import('../lever')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 'r1', file: { name: 'cv.pdf', ext: 'pdf', downloadUrl: 'https://hire.lever.co/x/download' } }],
    }))
    const r = await leverFetchResume('k', 'opp1')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/opportunities/opp1/resumes')
    expect(r?.id).toBe('r1')
    expect(r?.file?.name).toBe('cv.pdf')
  })

  it('leverDownloadCV: hits the resume download endpoint with Basic auth', async () => {
    const { leverDownloadCV } = await import('../lever')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse('binary'))
    const buf = await leverDownloadCV('k', 'opp1', 'r1')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('/opportunities/opp1/resumes/r1/download')
    expect((call[1] as any).headers.Authorization).toContain('Basic ')
    expect(buf).toBeInstanceOf(Buffer)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 7. WORKABLE
// ════════════════════════════════════════════════════════════════════════════
describe('Workable integration', () => {
  it('workableFetchJobs: uses Bearer auth and correct subdomain URL', async () => {
    const { workableFetchJobs } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ jobs: [], paging: {} }))
    await workableFetchJobs('tok', 'acme')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('acme.workable.com/spi/v3/jobs')
    expect((call[1] as any).headers.Authorization).toBe('Bearer tok')
  })

  it('workableFetchJobs: parses jobs array', async () => {
    const { workableFetchJobs } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      jobs: [{ id: 'j1', shortcode: 'sc1', title: 'Dev', state: 'published', created_at: '2024' }],
      paging: {},
    }))
    const r = await workableFetchJobs('k', 's')
    expect(r[0].shortcode).toBe('sc1')
  })

  it('workableFetchJobs: follows the absolute paging.next URL verbatim', async () => {
    const { workableFetchJobs } = await import('../workable')
    const next = 'https://www.workable.com/spi/v3/accounts/acme/jobs?since_id=j1'
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({
        jobs: [{ id: 'j1', shortcode: 'sc1', title: 'A', state: 'published', created_at: '2024' }],
        paging: { next },
      }))
      .mockResolvedValueOnce(jsonResponse({
        jobs: [{ id: 'j2', shortcode: 'sc2', title: 'B', state: 'published', created_at: '2024' }],
        paging: {},
      }))
    const r = await workableFetchJobs('k', 'acme')
    expect(r.map(j => j.shortcode)).toEqual(['sc1', 'sc2'])
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe(next)
  })

  it('workableFetchJob: reads the full record from /jobs/:shortcode', async () => {
    const { workableFetchJob } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      id: 'j1', shortcode: 'sc1', title: 'Dev', state: 'published', created_at: '2024',
      description: '<p>desc</p>', requirements: '<ul><li>react</li></ul>',
    }))
    const r = await workableFetchJob('k', 'acme', 'sc1')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('acme.workable.com/spi/v3/jobs/sc1')
    expect(r?.requirements).toContain('react')
  })

  it('workableFetchJob: returns null on failure (one bad job must not abort the sync)', async () => {
    const { workableFetchJob } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    expect(await workableFetchJob('k', 's', 'nope')).toBeNull()
  })

  it('workableFetchCandidates: lists via /candidates?shortcode= (NOT the POST create path)', async () => {
    const { workableFetchCandidates } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ candidates: [], paging: {} }))
    await workableFetchCandidates('k', 'acme', 'SHORT1')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('/candidates?shortcode=SHORT1')
    expect(url).not.toContain('/jobs/SHORT1/candidates')
  })

  it('workableFetchCandidates: handles special unicode names', async () => {
    const { workableFetchCandidates } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      candidates: [{ id: 'c1', name: 'Émilie Müller 中', email: 'e@m.com', created_at: '2024' }],
      paging: {},
    }))
    const r = await workableFetchCandidates('k', 's', 'SC')
    expect(r[0].name).toBe('Émilie Müller 中')
  })

  it('workableDownloadCV: picks the résumé file and downloads its pre-signed url', async () => {
    const { workableDownloadCV } = await import('../workable')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ files: [
        { name: 'portfolio.png', preview_url: 'https://s3/x.png', source: 'other' },
        { name: 'jane-cv.pdf', preview_url: 'https://s3/cv.pdf', source: 'resume' },
      ] }))
      .mockResolvedValueOnce(jsonResponse('binary'))
    const r = await workableDownloadCV('k', 'acme', 'c1', 'jane-cv.pdf')
    expect(r?.filename).toBe('jane-cv.pdf')
    // The 2nd fetch must hit the pre-signed url directly (no auth-base prefixing).
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe('https://s3/cv.pdf')
  })

  it('workableDownloadCV: returns null when the candidate has no files (no crash)', async () => {
    const { workableDownloadCV } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ files: [] }))
    expect(await workableDownloadCV('k', 's', 'c1')).toBeNull()
  })

  it('workableFetchCandidate: GETs /candidates/:id and unwraps the candidate', async () => {
    const { workableFetchCandidate } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      candidate: { id: 'c1', cover_letter: 'Hire me', social_profiles: [{ type: 'linkedin', url: 'http://linkedin.com/in/x' }] },
    }))
    const c = await workableFetchCandidate('k', 'acme', 'c1')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('acme.workable.com/spi/v3/candidates/c1')
    expect(c?.social_profiles?.[0].url).toBe('http://linkedin.com/in/x')
  })

  it('workableFetchCandidate: returns null on failure (enrichment never aborts a sync)', async () => {
    const { workableFetchCandidate } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    expect(await workableFetchCandidate('k', 's', 'c1')).toBeNull()
  })

  it('workableFetchJobs: throws on 401', async () => {
    const { workableFetchJobs } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401))
    await expect(workableFetchJobs('k', 's')).rejects.toThrow(/401/)
  })

  it('normalizeWorkableSubdomain: reduces a pasted URL to the bare subdomain', async () => {
    const { normalizeWorkableSubdomain } = await import('../workable')
    expect(normalizeWorkableSubdomain('acme')).toBe('acme')
    expect(normalizeWorkableSubdomain('  acme  ')).toBe('acme')
    expect(normalizeWorkableSubdomain('acme.workable.com')).toBe('acme')
    expect(normalizeWorkableSubdomain('https://acme.workable.com')).toBe('acme')
    expect(normalizeWorkableSubdomain('https://acme.workable.com/spi/v3/jobs')).toBe('acme')
    expect(normalizeWorkableSubdomain('')).toBe('')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 9. ASHBY
// ════════════════════════════════════════════════════════════════════════════
describe('Ashby integration', () => {
  it('ashbyFetchJobs: uses POST and Basic auth', async () => {
    const { ashbyFetchJobs } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false }))
    await ashbyFetchJobs('mykey')
    const call = vi.mocked(fetch).mock.calls[0]
    expect((call[1] as any).method).toBe('POST')
    const auth = (call[1] as any).headers.Authorization
    expect(Buffer.from(auth.replace('Basic ', ''), 'base64').toString()).toBe('mykey:')
    expect(call[0]).toContain('api.ashbyhq.com/jobPosting.list')
  })

  it('ashbyFetchJobs: does not send the (invalid) isLive param', async () => {
    const { ashbyFetchJobs } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false }))
    await ashbyFetchJobs('k')
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body)
    expect(body.isLive).toBeUndefined()
    expect(body.limit).toBe(100)
  })

  it('ashbyFetchJobs: paginates via cursor', async () => {
    const { ashbyFetchJobs } = await import('../ashby')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'j1', title: 'A' }], moreDataAvailable: true, nextCursor: 'CUR' }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'j2', title: 'B' }], moreDataAvailable: false }))
    const r = await ashbyFetchJobs('k')
    expect(r).toHaveLength(2)
    const body2 = JSON.parse((vi.mocked(fetch).mock.calls[1][1] as any).body)
    expect(body2.cursor).toBe('CUR')
  })

  it('ashbyFetchCandidates: posts to candidate.list and paginates', async () => {
    const { ashbyFetchCandidates } = await import('../ashby')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'c1' }], moreDataAvailable: true, nextCursor: 'CUR' }))
      .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'c2' }], moreDataAvailable: false }))
    const r = await ashbyFetchCandidates('k')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('api.ashbyhq.com/candidate.list')
    expect(r).toHaveLength(2)
    expect(JSON.parse((vi.mocked(fetch).mock.calls[1][1] as any).body).cursor).toBe('CUR')
  })

  it('ashbyFetchApplications: flattens the nested candidate + job', async () => {
    const { ashbyFetchApplications } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      results: [{
        id: 'a1',
        candidate: { id: 'c1', name: 'Jane Doe', primaryEmailAddress: { value: 'jane@x.com' } },
        job: { id: 'j1', title: 'Engineer' },
        status: 'Active',
        currentInterviewStage: { title: 'Phone Screen' },
      }],
      moreDataAvailable: false,
    }))
    const r = await ashbyFetchApplications('k')
    expect(r[0].candidateId).toBe('c1')
    expect(r[0].jobId).toBe('j1')
    expect(r[0].jobTitle).toBe('Engineer')
    expect(r[0].email).toBe('jane@x.com')
    expect(r[0].stageName).toBe('Phone Screen')
  })

  it('ashbyFileUrl: posts the fileHandle to file.info and returns the url', async () => {
    const { ashbyFileUrl } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ results: { url: 'https://s3/cv.pdf' } }))
    const url = await ashbyFileUrl('k', 'HANDLE123')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('api.ashbyhq.com/file.info')
    expect(JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body).fileHandle).toBe('HANDLE123')
    expect(url).toBe('https://s3/cv.pdf')
  })

  it('ashbyFetchJobs: throws on 401', async () => {
    const { ashbyFetchJobs } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401))
    await expect(ashbyFetchJobs('bad')).rejects.toThrow(/401/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 11. HOMERUN
// ════════════════════════════════════════════════════════════════════════════
describe('Homerun integration', () => {
  it('homerunFetchJobs: uses Bearer auth', async () => {
    const { homerunFetchJobs } = await import('../homerun')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await homerunFetchJobs('tk')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.homerun.co/v2/vacancies')
    expect((call[1] as any).headers.Authorization).toBe('Bearer tk')
  })

  it('homerunFetchJobs: parses jobs from data', async () => {
    const { homerunFetchJobs } = await import('../homerun')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 'j1', title: 'Dev', status: 'published', created_at: '2024' }],
    }))
    const r = await homerunFetchJobs('k')
    expect(r[0].title).toBe('Dev')
  })

  it('homerunFetchJobs: handles direct array response (no .data wrapper)', async () => {
    const { homerunFetchJobs } = await import('../homerun')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([
      { id: 'j1', title: 'Dev', status: 'published', created_at: '2024' },
    ]))
    const r = await homerunFetchJobs('k')
    expect(r).toHaveLength(1)
  })

  it('homerunFetchApplications: uses job id in URL', async () => {
    const { homerunFetchApplications } = await import('../homerun')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await homerunFetchApplications('k', 'JOB1')
    const appUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(appUrl).toContain('/job-applications')
    expect(appUrl).toContain('JOB1')
  })

  it('homerunFetchJobs: backs off and retries on 429, then succeeds', async () => {
    vi.useFakeTimers()
    try {
      const { homerunFetchJobs } = await import('../homerun')
      vi.mocked(fetch)
        .mockResolvedValueOnce(errorResponse(429)) // rate limited once
        .mockResolvedValueOnce(jsonResponse([{ id: 'j1', title: 'Dev', status: 'published', created_at: '2024' }]))
      const p = homerunFetchJobs('k')
      await vi.runAllTimersAsync() // flush the back-off delay
      const r = await p
      expect(r).toHaveLength(1)
      expect(fetch).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// SYNC ORCHESTRATION
// ════════════════════════════════════════════════════════════════════════════
describe('Sync orchestration (sync.ts)', () => {
  // ── Teamtailor sync ────────────────────────────────────────────────────────
  describe('syncTeamtailor', () => {
    it('creates vacancy and candidate records for valid response', async () => {
      const { syncTeamtailor } = await import('../sync')

      // Order: region-resolve (/company), then jobs, applications, candidate fetch
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ data: { attributes: { name: 'ACME' } } })) // resolve base + company
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 'job1', attributes: { title: 'Engineer', body: 'desc', status: 'open', 'human-status': 'published', 'created-at': '2024' } }],
          links: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ // applications
          data: [{
            id: 'app1',
            attributes: { stage: 'New', 'created-at': '2024' },
            relationships: { job: { data: { id: 'job1' } }, candidate: { data: { id: 'cand1' } } },
          }],
          links: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidate fetch
          data: { id: 'cand1', attributes: { 'first-name': 'Jan', 'last-name': 'Doe', email: 'j@d.com', 'created-at': '2024' } },
        }))

      const result = await syncTeamtailor('user-1', 'apikey')

      expect(result.errors).toEqual([])
      expect(result.imported).toBe(1)
      expect(prismaMock.vacancy.create).toHaveBeenCalled()
      expect(prismaMock.candidate.create).toHaveBeenCalled()
      const candCall = prismaMock.candidate.create.mock.calls[0][0]
      expect(candCall.data.firstName).toBe('Jan')
      expect(candCall.data.lastName).toBe('Doe')
      expect(candCall.data.email).toBe('j@d.com')
      expect(candCall.data.externalSource).toBe('teamtailor')
    })

    it('captures auth error in result.errors', async () => {
      const { syncTeamtailor } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401, 'unauthorized'))
      const r = await syncTeamtailor('u', 'k')
      expect(r.errors.length).toBeGreaterThan(0)
      expect(r.errors.join(' ')).toMatch(/401/)
      expect(r.imported).toBe(0)
    })

    it('passes since parameter through to API', async () => {
      const { syncTeamtailor } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ data: { attributes: { name: 'X' } } })) // resolve base + company
        .mockResolvedValueOnce(jsonResponse({ data: [], links: {} })) // jobs
        .mockResolvedValueOnce(jsonResponse({ data: [], links: {} })) // applications (uses since)

      await syncTeamtailor('u', 'k', new Date('2024-05-01'))

      // Find the applications call (URL contains job-applications). `since` is now
      // applied client-side, so it is no longer a URL filter; the call includes the stage.
      const appsCall = vi.mocked(fetch).mock.calls.find(c => (c[0] as string).includes('job-applications'))
      expect(appsCall).toBeTruthy()
      expect(appsCall![0]).toContain('include=candidate,job,stage')
    })
  })

  // ── Recruitee sync ────────────────────────────────────────────────────────
  describe('syncRecruitee', () => {
    it('imports candidates with placements linked to offers', async () => {
      const { syncRecruitee } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // offers
          offers: [{ id: 100, title: 'Dev', description: 'd', requirements: 'r', status: 'published', created_at: '2024' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates (emails/phones are strings; stage via references)
          candidates: [{
            id: 1, name: 'Jane Doe',
            emails: ['j@d.com'],
            phones: ['+1'],
            created_at: '2024',
            placements: [{ id: 50, offer_id: 100, stage_id: 7 }],
          }],
          references: [{ id: 7, type: 'Stage', name: 'New' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // GET /candidates/1 detail (no CV on file)
          candidate: { id: 1, name: 'Jane Doe', cv_original_url: null, cv_url: null, cover_letter: null, social_links: [] },
          references: [],
        }))
      const r = await syncRecruitee('u', 'k', 'co')
      expect(r.imported).toBe(1)
      expect(r.errors).toEqual([])
    })

    it('downloads the CV + cover letter + LinkedIn from the single-candidate endpoint', async () => {
      const { syncRecruitee } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({
          offers: [{ id: 100, title: 'Dev', description: 'd', requirements: 'r', status: 'published' }],
        }))
        .mockResolvedValueOnce(jsonResponse({
          candidates: [{ id: 1, name: 'Jane Doe', emails: ['j@d.com'], phones: ['+1'], created_at: '2024', placements: [{ id: 50, offer_id: 100, stage_id: 7 }] }],
          references: [{ id: 7, type: 'Stage', name: 'New' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // GET /candidates/1
          candidate: {
            id: 1, name: 'Jane Doe',
            cv_original_url: 'https://recruitee-main.s3.eu-central-1.amazonaws.com/candidates/1/jane_cv.pdf',
            cover_letter: 'Motivated!',
            social_links: ['https://www.facebook.com/jane', 'https://linkedin.com/in/jane'],
          },
          references: [],
        }))
        .mockResolvedValueOnce(jsonResponse('binary')) // CV download (S3)
      const r = await syncRecruitee('u', 'k', 'co')
      expect(r.imported).toBe(1)
      const data = prismaMock.candidate.create.mock.calls[0][0].data
      expect(data.cvFileName).toBe('jane_cv.pdf')
      expect(data.linkedIn).toBe('https://linkedin.com/in/jane')
      expect(data.motivationText).toBe('Motivated!')
    })

    it('skips candidates without placements', async () => {
      const { syncRecruitee } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ offers: [] }))
        .mockResolvedValueOnce(jsonResponse({
          candidates: [{ id: 1, name: 'No Job', emails: [], phones: [], created_at: '2024', placements: [] }],
        }))
      const r = await syncRecruitee('u', 'k', 'co')
      expect(r.imported).toBe(0)
    })

    it('captures auth error', async () => {
      const { syncRecruitee } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401))
      const r = await syncRecruitee('u', 'k', 'co')
      expect(r.errors.length).toBeGreaterThan(0)
    })
  })

  // ── SmartRecruiters sync ─────────────────────────────────────────────────
  describe('syncSmartRecruiters', () => {
    it('imports candidates with primaryAssignment (status is a string enum)', async () => {
      const { syncSmartRecruiters } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          content: [{ id: 'j1', title: 'PM', status: 'SOURCING', createdOn: '2024', location: { city: 'Paris' } }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates
          content: [{
            id: 'c1', firstName: 'A', lastName: 'B', email: 'a@b.com', createdOn: '2024',
            primaryAssignment: { job: { id: 'j1', title: 'PM' }, status: 'NEW' },
          }],
        }))
        .mockResolvedValueOnce(jsonResponse({ id: 'c1', phoneNumber: '+33', web: { linkedin: 'http://x' } })) // detail (no attachments)

      const r = await syncSmartRecruiters('u', 'k')
      expect(r.imported).toBe(1)
    })

    it('pulls phone + LinkedIn + CV from the candidate detail', async () => {
      const { syncSmartRecruiters } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ content: [{ id: 'j1', title: 'PM' }] }))
        .mockResolvedValueOnce(jsonResponse({
          content: [{ id: 'c1', firstName: 'Jane', lastName: 'Doe', email: 'j@d.com', primaryAssignment: { job: { id: 'j1' }, status: 'IN_REVIEW' } }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // detail
          id: 'c1', phoneNumber: '+33', web: { linkedin: 'http://lnkd/jane' },
          actions: { attachments: { url: 'https://api.smartrecruiters.com/candidates/c1/attachments', method: 'GET' } },
        }))
        .mockResolvedValueOnce(jsonResponse({ content: [{ id: 'a2', name: 'jane_cv.pdf', type: 'RESUME', contentType: 'application/pdf', actions: { download: { url: 'https://files/cv.pdf', method: 'GET' } } }] })) // attachments list
        .mockResolvedValueOnce(jsonResponse('binary')) // download
      const r = await syncSmartRecruiters('u', 'k')
      expect(r.imported).toBe(1)
      const data = prismaMock.candidate.create.mock.calls[0][0].data
      expect(data.linkedIn).toBe('http://lnkd/jane')
      expect(data.phone).toBe('+33')
      expect(data.cvFileName).toBe('jane_cv.pdf')
    })

    it('skips candidates without primaryAssignment', async () => {
      const { syncSmartRecruiters } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ content: [] }))
        .mockResolvedValueOnce(jsonResponse({
          content: [{ id: 'c1', firstName: 'A', lastName: 'B', email: 'a@b.com', createdOn: '2024' }],
        }))
      const r = await syncSmartRecruiters('u', 'k')
      expect(r.imported).toBe(0)
    })
  })

  // ── Greenhouse sync ───────────────────────────────────────────────────────
  describe('syncGreenhouse', () => {
    it('imports candidate per application (token -> jobs/candidates/applications -> resumes)', async () => {
      const { syncGreenhouse } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ token_type: 'Bearer', access_token: 'JWT' })) // token
        .mockResolvedValueOnce(jsonResponse([{ id: 5, name: 'Eng', status: 'open' }]))        // jobs
        .mockResolvedValueOnce(jsonResponse([{ id: 11, first_name: 'A', last_name: 'B', email_addresses: [{ value: 'a@b.com' }] }])) // candidates
        .mockResolvedValueOnce(jsonResponse([{ id: 200, candidate_id: 11, job_id: 5, status: 'in_process', stage_name: 'Phone Interview' }])) // applications
        .mockResolvedValueOnce(jsonResponse([])) // attachments (no resume)

      const r = await syncGreenhouse('cid', 'secret', 'u')
      expect(r.imported).toBe(1)
      expect(r.errors).toEqual([])
    })

    it('attaches the résumé + LinkedIn from the separate v3 endpoints', async () => {
      const { syncGreenhouse } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ access_token: 'JWT' }))                          // token
        .mockResolvedValueOnce(jsonResponse([{ id: 5, name: 'Eng', status: 'open' }]))          // jobs
        .mockResolvedValueOnce(jsonResponse([{ id: 11, first_name: 'Jane', last_name: 'Doe', email_addresses: [{ value: 'j@d.com' }], social_media_addresses: [{ value: 'https://linkedin.com/in/jane' }] }])) // candidates
        .mockResolvedValueOnce(jsonResponse([{ id: 200, candidate_id: 11, job_id: 5, status: 'in_process', stage_name: 'Phone' }])) // applications
        .mockResolvedValueOnce(jsonResponse([{ id: 9, candidate_id: 11, type: 'resume', filename: 'jane_cv.pdf', url: 'https://files/cv.pdf' }])) // attachments
        .mockResolvedValueOnce(jsonResponse('binary'))                                          // CV download
      const r = await syncGreenhouse('cid', 'secret', 'u')
      expect(r.imported).toBe(1)
      const data = prismaMock.candidate.create.mock.calls[0][0].data
      expect(data.cvFileName).toBe('jane_cv.pdf')
      expect(data.linkedIn).toBe('https://linkedin.com/in/jane')
    })

    it('captures auth error (token exchange fails)', async () => {
      const { syncGreenhouse } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401))
      const r = await syncGreenhouse('cid', 'secret', 'u')
      expect(r.errors.length).toBeGreaterThan(0)
      expect(r.imported).toBe(0)
    })
  })

  // ── Lever sync ────────────────────────────────────────────────────────────
  describe('syncLever', () => {
    it('imports opportunity linked to posting', async () => {
      const { syncLever } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // postings
          data: [{ id: 'p1', text: 'Eng', state: 'published', content: { description: 'd' }, createdAt: 1 }],
          hasNext: false,
        }))
        .mockResolvedValueOnce(jsonResponse({ // opportunities (posting is on the application)
          data: [{
            id: 'o1', name: 'John Smith',
            emails: ['j@s.com'], phones: [{ value: '+1' }],
            applications: [{ posting: 'p1' }], createdAt: 1, updatedAt: 1,
          }],
          hasNext: false,
        }))

      const r = await syncLever('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('skips opportunities whose applications have no posting', async () => {
      const { syncLever } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ data: [], hasNext: false }))
        .mockResolvedValueOnce(jsonResponse({
          data: [{ id: 'o1', name: 'X Y', applications: [], createdAt: 1, updatedAt: 1 }],
          hasNext: false,
        }))
      const r = await syncLever('k', 'u')
      expect(r.imported).toBe(0)
    })
  })

  // ── Workable sync ─────────────────────────────────────────────────────────
  describe('syncWorkable', () => {
    it('imports candidates for each job (enriching the vacancy from /jobs/:shortcode)', async () => {
      const { syncWorkable } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs list (no description)
          jobs: [{ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ // /jobs/SC1 detail (carries description/requirements)
          id: 'j1', shortcode: 'SC1', title: 'Eng', description: 'd', requirements: 'r', state: 'published', created_at: '2024',
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates for SC1
          candidates: [{ id: 'c1', name: 'A B', email: 'a@b.com', created_at: '2024-01-15' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ candidate: { id: 'c1' } })) // /candidates/c1 detail (enrichment)

      const r = await syncWorkable('k', 'sub', 'u')
      expect(r.imported).toBe(1)
      // 2nd call is the per-job detail fetch.
      expect(vi.mocked(fetch).mock.calls[1][0]).toContain('/jobs/SC1')
    })

    it('enriches candidates with LinkedIn + cover letter from /candidates/:id', async () => {
      const { syncWorkable } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({
          jobs: [{ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }))
        .mockResolvedValueOnce(jsonResponse({
          candidates: [{ id: 'c1', name: 'A B', email: 'a@b.com', created_at: '2024-01-15' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ candidate: {
          id: 'c1',
          cover_letter: 'I would love this role',
          social_profiles: [
            { type: 'twitter', url: 'http://twitter.com/ab' },
            { type: 'linkedin', url: 'http://www.linkedin.com/in/ab' },
          ],
        } }))
      const r = await syncWorkable('k', 'sub', 'u')
      expect(r.imported).toBe(1)
      const data = prismaMock.candidate.create.mock.calls[0][0].data
      expect(data.linkedIn).toBe('http://www.linkedin.com/in/ab')
      expect(data.motivationText).toBe('I would love this role')
    })

    it('fetches the candidate files when a résumé exists', async () => {
      const { syncWorkable } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({
          jobs: [{ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }))
        .mockResolvedValueOnce(jsonResponse({
          candidates: [{ id: 'c1', name: 'A B', email: 'a@b.com', created_at: '2024-01-15', resume_metadata: { filename: 'cv.pdf' } }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ candidate: { id: 'c1' } })) // detail (enrichment)
        .mockResolvedValueOnce(jsonResponse({ files: [] })) // /candidates/c1/files -> no downloadable file
      const r = await syncWorkable('k', 'sub', 'u')
      expect(r.imported).toBe(1)
      expect(vi.mocked(fetch).mock.calls.some(c => String(c[0]).includes('/candidates/c1/files'))).toBe(true)
    })

    it('respects since filter (filters out older candidates)', async () => {
      const { syncWorkable } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({
          jobs: [{ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }))
        .mockResolvedValueOnce(jsonResponse({
          candidates: [{ id: 'c1', name: 'A B', email: 'a@b.com', created_at: '2020-01-01' }],
          paging: {},
        }))
      const r = await syncWorkable('k', 'sub', 'u', new Date('2023-01-01'))
      expect(r.imported).toBe(0)
    })
  })

  // ── Ashby sync ────────────────────────────────────────────────────────────
  describe('syncAshby', () => {
    // syncAshby fetches in this order: candidate.list, application.list, jobPosting.list
    it('links candidates to jobs via the nested application payload', async () => {
      const { syncAshby } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // candidates (candidate.list)
          results: [{ id: 'c1', name: 'A B', primaryEmailAddress: { value: 'a@b.com' } }],
          moreDataAvailable: false,
        }))
        .mockResolvedValueOnce(jsonResponse({ // applications (application.list) - candidate + job inline
          results: [{ id: 'a1', candidate: { id: 'c1' }, job: { id: 'j1', title: 'Eng' }, status: 'Active', createdAt: '2024' }],
          moreDataAvailable: false,
        }))
        .mockResolvedValueOnce(jsonResponse({ // jobs (jobPosting.list) - location enrichment
          results: [{ id: 'jp1', jobId: 'j1', title: 'Eng', locationName: 'NYC' }],
          moreDataAvailable: false,
        }))
      const r = await syncAshby('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('imports nothing when there are no applications', async () => {
      const { syncAshby } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ results: [{ id: 'c1', name: 'A B' }], moreDataAvailable: false })) // candidates
        .mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false })) // applications (none)
        .mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false })) // jobs
      const r = await syncAshby('k', 'u')
      expect(r.imported).toBe(0)
    })
  })

  // ── Homerun sync ──────────────────────────────────────────────────────────
  describe('syncHomerun', () => {
    it('imports applications per job', async () => {
      const { syncHomerun } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 'j1', title: 'Eng', description: 'd', status: 'published', created_at: '2024' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // applications
          data: [{ id: 'a1', first_name: 'A', last_name: 'B', email: 'a@b.com', created_at: '2024' }],
        }))
      const r = await syncHomerun('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('captures error on auth failure', async () => {
      const { syncHomerun } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401))
      const r = await syncHomerun('k', 'u')
      expect(r.errors.length).toBeGreaterThan(0)
    })
  })

})

// ════════════════════════════════════════════════════════════════════════════
// CROSS-CUTTING EDGE CASES
// ════════════════════════════════════════════════════════════════════════════
describe('Cross-cutting edge cases', () => {
  it('Teamtailor: handles special characters in candidate names', async () => {
    const { teamtailorFetchCandidate } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: { id: 'c1', attributes: { 'first-name': 'José', 'last-name': 'Müller-Sørensen', email: 'j@m.com', 'created-at': '2024' } },
    }))
    const r = await teamtailorFetchCandidate('k', 'c1')
    expect(r?.attributes['first-name']).toBe('José')
    expect(r?.attributes['last-name']).toBe('Müller-Sørensen')
  })

  it('Recruitee: handles candidate with no email gracefully', async () => {
    const { recruiteeFetchCandidates } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      candidates: [{ id: 1, name: 'A B', emails: [], phones: [], created_at: '2024' }],
    }))
    const r = await recruiteeFetchCandidates('k', 'co')
    expect(r.candidates[0].emails).toEqual([])
  })

  it('Greenhouse: handles candidate with no CV (returns null without crash)', async () => {
    const { greenhouseDownloadResume } = await import('../greenhouse')
    const r = await greenhouseDownloadResume(undefined)
    expect(r).toBeNull()
  })

  it('All ATS: malformed JSON does not crash test connections (returns error)', async () => {
    const { teamtailorTestConnection } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('Unexpected token') },
      text: async () => '<html>not json</html>',
    } as any)
    const r = await teamtailorTestConnection('k')
    // Test connection wraps the parse error in result
    expect(r.ok).toBe(false)
  })

  it('Lever: handles opportunity with no name (defaults gracefully)', async () => {
    const { leverFetchOpportunities } = await import('../lever')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 'o1', createdAt: 1, updatedAt: 1, emails: [], phones: [], postings: [] }],
      hasNext: false,
    }))
    const r = await leverFetchOpportunities('k')
    expect(r[0].name).toBeUndefined()
  })

  it('Ashby: empty results returns []', async () => {
    const { ashbyFetchJobs } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false }))
    const r = await ashbyFetchJobs('k')
    expect(r).toEqual([])
  })

  it('Workable: handles no jobs response', async () => {
    const { workableFetchJobs } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ jobs: [], paging: {} }))
    const r = await workableFetchJobs('k', 's')
    expect(r).toEqual([])
  })

  it('Homerun: download CV failure returns null', async () => {
    const { homerunDownloadCV } = await import('../homerun')
    vi.mocked(fetch).mockRejectedValueOnce(new Error('socket hang up'))
    const r = await homerunDownloadCV('https://x/y', 'k')
    expect(r).toBeNull()
  })
})
