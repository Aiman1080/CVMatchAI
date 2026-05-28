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
function jsonResponse(body: any, status = 200): any {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    arrayBuffer: async () => new ArrayBuffer(8),
  }
}

function errorResponse(status: number, text = 'error'): any {
  return {
    ok: false,
    status,
    json: async () => ({ error: text }),
    text: async () => text,
    arrayBuffer: async () => new ArrayBuffer(0),
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
    expect(call[0]).toContain('filter[status]=published')
    expect((call[1] as any).headers.Authorization).toBe('Token token=test-key')
    expect((call[1] as any).headers['X-Api-Version']).toBeTruthy()
  })

  it('teamtailorFetchJobs: parses jobs from data array', async () => {
    const { teamtailorFetchJobs } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [
        { id: '1', attributes: { title: 'Engineer', body: 'desc', 'human-requirements': 'react', status: 'published', 'created-at': '2024-01-01' } },
        { id: '2', attributes: { title: 'Designer', status: 'published', 'created-at': '2024-01-02' } },
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
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '1', attributes: { title: 'A', status: 'p', 'created-at': '2024' } }], links: { next: 'https://api.teamtailor.com/v1/jobs?page=2' } }))
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: '2', attributes: { title: 'B', status: 'p', 'created-at': '2024' } }], links: {} }))

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

  it('teamtailorFetchApplications: passes since filter when provided', async () => {
    const { teamtailorFetchApplications } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [], links: {} }))
    await teamtailorFetchApplications('k', new Date('2024-01-15'))
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('filter[created-at][gte]=')
  })

  it('teamtailorDownloadCV: returns null on failure (does not crash)', async () => {
    const { teamtailorDownloadCV } = await import('../teamtailor')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    const r = await teamtailorDownloadCV('https://x/y', 'k')
    expect(r).toBeNull()
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

  it('recruiteeFetchCandidates: paginates while batch size full', async () => {
    const { recruiteeFetchCandidates } = await import('../recruitee')
    const big = Array.from({ length: 100 }, (_, i) => ({ id: i, name: 'A B', emails: [{ address: `a${i}@x.com` }], phones: [], created_at: '2024' }))
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ candidates: big }))
      .mockResolvedValueOnce(jsonResponse({ candidates: [{ id: 999, name: 'C D', emails: [], phones: [], created_at: '2024' }] }))
    const cands = await recruiteeFetchCandidates('k', 'co')
    expect(cands).toHaveLength(101)
    expect(fetch).toHaveBeenCalledTimes(2)
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
    expect(r).toEqual([])
  })

  it('recruiteeTestConnection: returns ok on success', async () => {
    const { recruiteeTestConnection } = await import('../recruitee')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ offers: [] }))
    const r = await recruiteeTestConnection('k', 'co')
    expect(r.ok).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 3. SMARTRECRUITERS
// ════════════════════════════════════════════════════════════════════════════
describe('SmartRecruiters integration', () => {
  it('smartrecruitersFetchJobs: uses X-SmartToken header', async () => {
    const { smartrecruitersFetchJobs } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ content: [] }))
    await smartrecruitersFetchJobs('tok')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.smartrecruiters.com/v1/jobs')
    expect((call[1] as any).headers['X-SmartToken']).toBe('tok')
  })

  it('smartrecruitersFetchJobs: parses content array', async () => {
    const { smartrecruitersFetchJobs } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      content: [
        { id: '1', title: 'PM', jobDescription: { text: 'desc' }, status: 'PUBLISHED', createdon: '2024' },
      ],
    }))
    const jobs = await smartrecruitersFetchJobs('k')
    expect(jobs[0].title).toBe('PM')
    expect(jobs[0].jobDescription?.text).toBe('desc')
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

  it('smartrecruitersFetchCandidateCV: returns null on 404', async () => {
    const { smartrecruitersFetchCandidateCV } = await import('../smartrecruiters')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    const r = await smartrecruitersFetchCandidateCV('k', 'cand-1')
    expect(r).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 4. GREENHOUSE
// ════════════════════════════════════════════════════════════════════════════
describe('Greenhouse integration', () => {
  it('greenhouseFetchJobs: uses Basic auth (key:)', async () => {
    const { greenhouseFetchJobs } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
    await greenhouseFetchJobs('mykey')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('harvest.greenhouse.io/v1/jobs')
    const auth = (call[1] as any).headers.Authorization as string
    expect(auth).toMatch(/^Basic /)
    const decoded = Buffer.from(auth.replace('Basic ', ''), 'base64').toString()
    expect(decoded).toBe('mykey:')
  })

  it('greenhouseFetchJobs: paginates until short page', async () => {
    const { greenhouseFetchJobs } = await import('../greenhouse')
    const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i, name: 'J' + i, status: 'open', created_at: '2024' }))
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(fullPage))
      .mockResolvedValueOnce(jsonResponse([{ id: 999, name: 'last', status: 'open', created_at: '2024' }]))
    const jobs = await greenhouseFetchJobs('k')
    expect(jobs).toHaveLength(101)
  })

  it('greenhouseFetchCandidates: appends updated_after for since', async () => {
    const { greenhouseFetchCandidates } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
    await greenhouseFetchCandidates('k', new Date('2024-06-01'))
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('updated_after=')
  })

  it('greenhouseFetchJobs: throws on 401', async () => {
    const { greenhouseFetchJobs } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401))
    await expect(greenhouseFetchJobs('bad')).rejects.toThrow(/401/)
  })

  it('greenhouseDownloadCV: returns null when no resume found', async () => {
    const { greenhouseDownloadCV } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([{ filename: 'other.txt', url: 'x', type: 'other' }]))
    const r = await greenhouseDownloadCV('k', 123)
    expect(r).toBeNull()
  })

  it('greenhouseDownloadCV: returns buffer when resume present', async () => {
    const { greenhouseDownloadCV } = await import('../greenhouse')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([{ filename: 'cv.pdf', url: 'https://x/y', type: 'resume' }]))
      .mockResolvedValueOnce(jsonResponse('binary'))
    const r = await greenhouseDownloadCV('k', 123)
    expect(r).not.toBeNull()
    expect(r?.filename).toBe('cv.pdf')
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
})

// ════════════════════════════════════════════════════════════════════════════
// 6. BULLHORN
// ════════════════════════════════════════════════════════════════════════════
describe('Bullhorn integration', () => {
  it('bullhornFetchJobs: uses BhRestToken header', async () => {
    const { bullhornFetchJobs } = await import('../bullhorn')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await bullhornFetchJobs('tok', 'https://rest.bullhorn.com/e1')
    const call = vi.mocked(fetch).mock.calls[0]
    expect((call[1] as any).headers.BhRestToken).toBe('tok')
    expect(call[0]).toContain('rest.bullhorn.com/e1/search/JobOrder')
  })

  it('bullhornFetchJobs: parses data array', async () => {
    const { bullhornFetchJobs } = await import('../bullhorn')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 1, title: 'Eng', publicDescription: 'd', isOpen: true, dateAdded: 123 }],
    }))
    const jobs = await bullhornFetchJobs('k', 'https://r')
    expect(jobs[0].title).toBe('Eng')
  })

  it('bullhornFetchCandidates: uses since-based query', async () => {
    const { bullhornFetchCandidates } = await import('../bullhorn')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await bullhornFetchCandidates('k', 'https://r', new Date('2024-01-01'))
    expect(decodeURIComponent(vi.mocked(fetch).mock.calls[0][0] as string)).toMatch(/dateAdded:\[\d+ TO \*\]/)
  })

  it('bullhornFetchJobSubmissions: parses submission entries', async () => {
    const { bullhornFetchJobSubmissions } = await import('../bullhorn')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 1, candidate: { id: 10 }, jobOrder: { id: 100 }, status: 'New', dateAdded: 1 }],
    }))
    const s = await bullhornFetchJobSubmissions('k', 'https://r')
    expect(s[0].candidate?.id).toBe(10)
    expect(s[0].jobOrder?.id).toBe(100)
  })

  it('bullhornFetchJobs: throws on 500', async () => {
    const { bullhornFetchJobs } = await import('../bullhorn')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500))
    await expect(bullhornFetchJobs('k', 'https://r')).rejects.toThrow(/500/)
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

  it('workableFetchCandidates: uses job shortcode in URL', async () => {
    const { workableFetchCandidates } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ candidates: [], paging: {} }))
    await workableFetchCandidates('k', 'acme', 'SHORT1')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/jobs/SHORT1/candidates')
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

  it('workableFetchJobs: throws on 401', async () => {
    const { workableFetchJobs } = await import('../workable')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401))
    await expect(workableFetchJobs('k', 's')).rejects.toThrow(/401/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 8. FLATCHR
// ════════════════════════════════════════════════════════════════════════════
describe('Flatchr integration', () => {
  it('flatchrFetchJobs: uses Bearer auth', async () => {
    const { flatchrFetchJobs } = await import('../flatchr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await flatchrFetchJobs('tk')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.flatchr.io/v2/jobs')
    expect((call[1] as any).headers.Authorization).toBe('Bearer tk')
  })

  it('flatchrFetchJobs: supports both data.data and data.jobs response shape', async () => {
    const { flatchrFetchJobs } = await import('../flatchr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      jobs: [{ id: '1', title: 'Eng', status: 'published', created_at: '2024' }],
    }))
    const r = await flatchrFetchJobs('k')
    expect(r).toHaveLength(1)
  })

  it('flatchrFetchCandidates: uses jobId in URL', async () => {
    const { flatchrFetchCandidates } = await import('../flatchr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await flatchrFetchCandidates('k', 'JOB42')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/jobs/JOB42/applications')
  })

  it('flatchrDownloadCV: returns null on network failure', async () => {
    const { flatchrDownloadCV } = await import('../flatchr')
    vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))
    const r = await flatchrDownloadCV('https://x/y', 'k')
    expect(r).toBeNull()
  })

  it('flatchrTestConnection: returns company name', async () => {
    const { flatchrTestConnection } = await import('../flatchr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ name: 'Flatchr Co' }))
    const r = await flatchrTestConnection('k')
    expect(r.ok).toBe(true)
    expect(r.company).toBe('Flatchr Co')
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

  it('ashbyFetchJobs: sends isLive in body', async () => {
    const { ashbyFetchJobs } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false }))
    await ashbyFetchJobs('k')
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body)
    expect(body.isLive).toBe(true)
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

  it('ashbyFetchCandidates: passes createdAfter when since given', async () => {
    const { ashbyFetchCandidates } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false }))
    await ashbyFetchCandidates('k', new Date('2024-02-02'))
    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body)
    expect(body.createdAfter).toBeTruthy()
  })

  it('ashbyFetchApplications: parses applications array', async () => {
    const { ashbyFetchApplications } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      results: [{ id: 'a1', candidateId: 'c1', jobId: 'j1', status: 'Active' }],
      moreDataAvailable: false,
    }))
    const r = await ashbyFetchApplications('k')
    expect(r[0].candidateId).toBe('c1')
  })

  it('ashbyFetchJobs: throws on 401', async () => {
    const { ashbyFetchJobs } = await import('../ashby')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401))
    await expect(ashbyFetchJobs('bad')).rejects.toThrow(/401/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 10. BREEZY HR
// ════════════════════════════════════════════════════════════════════════════
describe('Breezy HR integration', () => {
  it('breezyFetchPositions: uses Bearer auth and company URL', async () => {
    const { breezyFetchPositions } = await import('../breezyhr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
    await breezyFetchPositions('tk', 'COMP1')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.breezy.hr/v3/company/COMP1/positions')
    expect((call[1] as any).headers.Authorization).toBe('Bearer tk')
  })

  it('breezyFetchPositions: parses array response', async () => {
    const { breezyFetchPositions } = await import('../breezyhr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([
      { _id: 'p1', name: 'Dev', description: 'd', state: 'published' },
    ]))
    const r = await breezyFetchPositions('k', 'co')
    expect(r[0]._id).toBe('p1')
  })

  it('breezyFetchPositions: returns empty array if response not array', async () => {
    const { breezyFetchPositions } = await import('../breezyhr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'unexpected' }))
    const r = await breezyFetchPositions('k', 'co')
    expect(r).toEqual([])
  })

  it('breezyFetchCandidates: uses position id in URL', async () => {
    const { breezyFetchCandidates } = await import('../breezyhr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
    await breezyFetchCandidates('k', 'CO', 'POS9')
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/company/CO/position/POS9/candidates')
  })

  it('breezyFetchPositions: throws on 403', async () => {
    const { breezyFetchPositions } = await import('../breezyhr')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(403))
    await expect(breezyFetchPositions('k', 'co')).rejects.toThrow(/403/)
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
    expect(call[0]).toContain('api.homerun.co/v2/jobs')
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
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/jobs/JOB1/applications')
  })

  it('homerunFetchJobs: throws on 429', async () => {
    const { homerunFetchJobs } = await import('../homerun')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(429))
    await expect(homerunFetchJobs('k')).rejects.toThrow(/429/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 12. PERSONIO
// ════════════════════════════════════════════════════════════════════════════
describe('Personio integration', () => {
  it('personioFetchJobs: uses Bearer auth', async () => {
    const { personioFetchJobs } = await import('../personio')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await personioFetchJobs('tk')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.personio.de/v1/recruiting/positions')
    expect((call[1] as any).headers.Authorization).toBe('Bearer tk')
  })

  it('personioFetchJobs: parses data array', async () => {
    const { personioFetchJobs } = await import('../personio')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 1, name: 'Dev', status: 'active', created_at: '2024' }],
    }))
    const r = await personioFetchJobs('k')
    expect(r[0].name).toBe('Dev')
  })

  it('personioFetchJobs: returns empty array when response is malformed object', async () => {
    const { personioFetchJobs } = await import('../personio')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ unexpected: 'shape' }))
    const r = await personioFetchJobs('k')
    expect(r).toEqual([])
  })

  it('personioFetchApplications: uses position id in URL', async () => {
    const { personioFetchApplications } = await import('../personio')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await personioFetchApplications('k', 42)
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/recruiting/positions/42/applications')
  })

  it('personioFetchJobs: throws on 401', async () => {
    const { personioFetchJobs } = await import('../personio')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(401))
    await expect(personioFetchJobs('bad')).rejects.toThrow(/401/)
  })

  it('personioDownloadCV: returns null when no documents', async () => {
    const { personioDownloadCV } = await import('../personio')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    const r = await personioDownloadCV('k', 1)
    expect(r).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 13. iCIMS
// ════════════════════════════════════════════════════════════════════════════
describe('iCIMS integration', () => {
  it('icimsFetchJobs: uses Bearer auth with customer id in URL', async () => {
    const { icimsFetchJobs } = await import('../icims')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await icimsFetchJobs('tk', 'CUST1')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.icims.com/customers/CUST1/jobs')
    expect((call[1] as any).headers.Authorization).toBe('Bearer tk')
  })

  it('icimsFetchJobs: parses data array', async () => {
    const { icimsFetchJobs } = await import('../icims')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 1, title: 'Dev', status: 'open' }],
    }))
    const r = await icimsFetchJobs('k', 'c')
    expect(r[0].title).toBe('Dev')
  })

  it('icimsFetchCandidates: uses job id in URL', async () => {
    const { icimsFetchCandidates } = await import('../icims')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await icimsFetchCandidates('k', 'c', 555)
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/jobs/555/candidateworkflows')
  })

  it('icimsFetchJobs: throws on 403', async () => {
    const { icimsFetchJobs } = await import('../icims')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(403))
    await expect(icimsFetchJobs('k', 'c')).rejects.toThrow(/403/)
  })

  it('icimsFetchJobs: returns [] when response shape unknown', async () => {
    const { icimsFetchJobs } = await import('../icims')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ randomKey: 'noise' }))
    const r = await icimsFetchJobs('k', 'c')
    expect(r).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════════════════════
// 14. SOFTGARDEN
// ════════════════════════════════════════════════════════════════════════════
describe('Softgarden integration', () => {
  it('softgardenFetchJobs: uses Bearer auth', async () => {
    const { softgardenFetchJobs } = await import('../softgarden')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await softgardenFetchJobs('tk')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain('api.softgarden.de/api/rest/2.0/jobs')
    expect((call[1] as any).headers.Authorization).toBe('Bearer tk')
  })

  it('softgardenFetchJobs: parses data array', async () => {
    const { softgardenFetchJobs } = await import('../softgarden')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 1, jobName: 'Dev', jobDescription: 'desc', status: 'ACTIVE' }],
    }))
    const r = await softgardenFetchJobs('k')
    expect(r[0].jobName).toBe('Dev')
  })

  it('softgardenFetchApplications: uses job id in URL', async () => {
    const { softgardenFetchApplications } = await import('../softgarden')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    await softgardenFetchApplications('k', 77)
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/jobs/77/applications')
  })

  it('softgardenFetchJobs: throws on 500', async () => {
    const { softgardenFetchJobs } = await import('../softgarden')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(500))
    await expect(softgardenFetchJobs('k')).rejects.toThrow(/500/)
  })

  it('softgardenFetchJobs: handles empty array response', async () => {
    const { softgardenFetchJobs } = await import('../softgarden')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
    const r = await softgardenFetchJobs('k')
    expect(r).toEqual([])
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

      // Order: jobs, applications, companyName, then candidate fetch
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 'job1', attributes: { title: 'Engineer', body: 'desc', 'human-requirements': 'r', status: 'published', 'created-at': '2024' } }],
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
        .mockResolvedValueOnce(jsonResponse({ data: { attributes: { name: 'ACME' } } })) // company
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
        .mockResolvedValueOnce(jsonResponse({ data: [], links: {} })) // jobs
        .mockResolvedValueOnce(jsonResponse({ data: [], links: {} })) // applications (uses since)
        .mockResolvedValueOnce(jsonResponse({ data: { attributes: { name: 'X' } } })) // company

      await syncTeamtailor('u', 'k', new Date('2024-05-01'))

      // Find the applications call (URL contains job-applications)
      const appsCall = vi.mocked(fetch).mock.calls.find(c => (c[0] as string).includes('job-applications'))
      expect(appsCall).toBeTruthy()
      expect(appsCall![0]).toContain('filter[created-at][gte]=')
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
        .mockResolvedValueOnce(jsonResponse({ // candidates
          candidates: [{
            id: 1, name: 'Jane Doe',
            emails: [{ address: 'j@d.com' }],
            phones: [{ number: '+1' }],
            created_at: '2024',
            placements: [{ id: 50, offer_id: 100, stage: { name: 'New' } }],
          }],
        }))
      const r = await syncRecruitee('u', 'k', 'co')
      expect(r.imported).toBe(1)
      expect(r.errors).toEqual([])
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
    it('imports candidates with primaryAssignment', async () => {
      const { syncSmartRecruiters } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          content: [{ id: 'j1', title: 'PM', status: 'PUBLISHED', createdon: '2024', jobDescription: { text: 'd' } }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates
          content: [{
            id: 'c1', firstName: 'A', lastName: 'B', email: 'a@b.com', createdon: '2024',
            primaryAssignment: { job: { id: 'j1', title: 'PM' }, status: { id: 'NEW', label: 'New' } },
          }],
        }))
        .mockResolvedValueOnce(errorResponse(404)) // CV fetch returns null

      const r = await syncSmartRecruiters('u', 'k')
      expect(r.imported).toBe(1)
    })

    it('skips candidates without primaryAssignment', async () => {
      const { syncSmartRecruiters } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ content: [] }))
        .mockResolvedValueOnce(jsonResponse({
          content: [{ id: 'c1', firstName: 'A', lastName: 'B', email: 'a@b.com', createdon: '2024' }],
        }))
      const r = await syncSmartRecruiters('u', 'k')
      expect(r.imported).toBe(0)
    })
  })

  // ── Greenhouse sync ───────────────────────────────────────────────────────
  describe('syncGreenhouse', () => {
    it('imports candidate per application', async () => {
      const { syncGreenhouse } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse([ // jobs
          { id: 5, name: 'Eng', status: 'open', created_at: '2024' },
        ]))
        .mockResolvedValueOnce(jsonResponse([ // candidates
          {
            id: 11, first_name: 'A', last_name: 'B',
            emails: [{ value: 'a@b.com', type: 'personal' }],
            applications: [{ id: 200, job: { id: 5, name: 'Eng' }, status: 'active', current_stage: { name: 'Phone' } }],
            updated_at: '2024',
          },
        ]))
        .mockResolvedValueOnce(jsonResponse([])) // attachments empty -> null cv

      const r = await syncGreenhouse('k', 'u')
      expect(r.imported).toBe(1)
      expect(r.errors).toEqual([])
    })

    it('captures auth error', async () => {
      const { syncGreenhouse } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401))
      const r = await syncGreenhouse('k', 'u')
      expect(r.errors.length).toBeGreaterThan(0)
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
        .mockResolvedValueOnce(jsonResponse({ // opportunities
          data: [{
            id: 'o1', name: 'John Smith',
            emails: ['j@s.com'], phones: [{ value: '+1' }],
            postings: ['p1'], createdAt: 1, updatedAt: 1,
          }],
          hasNext: false,
        }))

      const r = await syncLever('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('skips opportunities without postings', async () => {
      const { syncLever } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ data: [], hasNext: false }))
        .mockResolvedValueOnce(jsonResponse({
          data: [{ id: 'o1', name: 'X Y', postings: [], createdAt: 1, updatedAt: 1 }],
          hasNext: false,
        }))
      const r = await syncLever('k', 'u')
      expect(r.imported).toBe(0)
    })
  })

  // ── Bullhorn sync ─────────────────────────────────────────────────────────
  describe('syncBullhorn', () => {
    it('links candidates to jobs via submissions, picks most recent', async () => {
      const { syncBullhorn } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 1, title: 'Eng', isOpen: true, publicDescription: 'd', dateAdded: 1 }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates
          data: [{ id: 10, firstName: 'A', lastName: 'B', email: 'a@b.com', dateAdded: 1 }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // submissions
          data: [{ id: 100, candidate: { id: 10 }, jobOrder: { id: 1 }, status: 'New', dateAdded: 5 }],
        }))

      const r = await syncBullhorn('k', 'https://r', 'u')
      expect(r.imported).toBe(1)
    })

    it('skips candidates with no submission', async () => {
      const { syncBullhorn } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ data: [{ id: 1, title: 'Eng', isOpen: true, dateAdded: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ data: [{ id: 10, firstName: 'A', lastName: 'B', dateAdded: 1 }] }))
        .mockResolvedValueOnce(jsonResponse({ data: [] }))
      const r = await syncBullhorn('k', 'https://r', 'u')
      expect(r.imported).toBe(0)
      expect(r.skipped).toBe(1)
    })
  })

  // ── Workable sync ─────────────────────────────────────────────────────────
  describe('syncWorkable', () => {
    it('imports candidates for each job', async () => {
      const { syncWorkable } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          jobs: [{ id: 'j1', shortcode: 'SC1', title: 'Eng', description: 'd', state: 'published', created_at: '2024' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates for SC1
          candidates: [{ id: 'c1', name: 'A B', email: 'a@b.com', created_at: '2024-01-15' }],
          paging: {},
        }))

      const r = await syncWorkable('k', 'sub', 'u')
      expect(r.imported).toBe(1)
    })

    it('respects since filter (filters out older candidates)', async () => {
      const { syncWorkable } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({
          jobs: [{ id: 'j1', shortcode: 'SC1', title: 'Eng', state: 'published', created_at: '2024' }],
          paging: {},
        }))
        .mockResolvedValueOnce(jsonResponse({
          candidates: [{ id: 'c1', name: 'A B', email: 'a@b.com', created_at: '2020-01-01' }],
          paging: {},
        }))
      const r = await syncWorkable('k', 'sub', 'u', new Date('2023-01-01'))
      expect(r.imported).toBe(0)
    })
  })

  // ── Flatchr sync ──────────────────────────────────────────────────────────
  describe('syncFlatchr', () => {
    it('imports candidates per job', async () => {
      const { syncFlatchr } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 'j1', title: 'Eng', description: 'd', status: 'published', created_at: '2024' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates
          data: [{ id: 'c1', first_name: 'A', last_name: 'B', email: 'a@b.com', created_at: '2024' }],
        }))
      const r = await syncFlatchr('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('reports network error in errors[]', async () => {
      const { syncFlatchr } = await import('../sync')
      vi.mocked(fetch).mockRejectedValue(new Error('timeout'))
      const r = await syncFlatchr('k', 'u')
      expect(r.errors.length).toBeGreaterThan(0)
    })
  })

  // ── Ashby sync ────────────────────────────────────────────────────────────
  describe('syncAshby', () => {
    it('links candidates to jobs via applications', async () => {
      const { syncAshby } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          results: [{ id: 'j1', title: 'Eng' }],
          moreDataAvailable: false,
        }))
        .mockResolvedValueOnce(jsonResponse({ // candidates
          results: [{ id: 'c1', name: 'A B', primaryEmailAddress: { value: 'a@b.com' } }],
          moreDataAvailable: false,
        }))
        .mockResolvedValueOnce(jsonResponse({ // applications
          results: [{ id: 'a1', candidateId: 'c1', jobId: 'j1', status: 'Active', createdAt: '2024' }],
          moreDataAvailable: false,
        }))
      const r = await syncAshby('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('skips candidates with no application link', async () => {
      const { syncAshby } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false }))
        .mockResolvedValueOnce(jsonResponse({
          results: [{ id: 'c1', name: 'A B' }],
          moreDataAvailable: false,
        }))
        .mockResolvedValueOnce(jsonResponse({ results: [], moreDataAvailable: false }))
      const r = await syncAshby('k', 'u')
      expect(r.imported).toBe(0)
      expect(r.skipped).toBe(1)
    })
  })

  // ── Breezy sync ───────────────────────────────────────────────────────────
  describe('syncBreezy', () => {
    it('imports candidates per position', async () => {
      const { syncBreezy } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse([ // positions
          { _id: 'p1', name: 'Eng', description: 'd', state: 'published' },
        ]))
        .mockResolvedValueOnce(jsonResponse([ // candidates
          { _id: 'c1', name: 'A B', email_address: 'a@b.com', creation_date: '2024' },
        ]))
      const r = await syncBreezy('k', 'COMP', 'u')
      expect(r.imported).toBe(1)
    })

    it('handles empty positions', async () => {
      const { syncBreezy } = await import('../sync')
      vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
      const r = await syncBreezy('k', 'COMP', 'u')
      expect(r.imported).toBe(0)
      expect(r.errors).toEqual([])
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

  // ── Personio sync ─────────────────────────────────────────────────────────
  describe('syncPersonio', () => {
    it('imports applications per position', async () => {
      const { syncPersonio } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 1, name: 'Eng', description: 'd', status: 'active', created_at: '2024' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // applications
          data: [{ id: 100, first_name: 'A', last_name: 'B', email: 'a@b.com', status: 'pending', created_at: '2024' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ data: [] })) // documents (no CV)

      const r = await syncPersonio('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('captures top-level error', async () => {
      const { syncPersonio } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401))
      const r = await syncPersonio('k', 'u')
      expect(r.errors.length).toBeGreaterThan(0)
    })
  })

  // ── iCIMS sync ────────────────────────────────────────────────────────────
  describe('syncIcims', () => {
    it('imports workflows per job', async () => {
      const { syncIcims } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 1, title: 'Eng', description: 'd', status: 'open' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // workflows
          data: [{ id: 100, person: { id: 200 }, status: 'New', createdDate: '2024-06-01' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ data: [] })) // attachments empty

      const r = await syncIcims('k', 'cust', 'u')
      expect(r.imported).toBe(1)
    })

    it('captures error on auth failure', async () => {
      const { syncIcims } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401))
      const r = await syncIcims('k', 'c', 'u')
      expect(r.errors.length).toBeGreaterThan(0)
    })
  })

  // ── Softgarden sync ──────────────────────────────────────────────────────
  describe('syncSoftgarden', () => {
    it('imports applications per job', async () => {
      const { syncSoftgarden } = await import('../sync')
      vi.mocked(fetch)
        .mockResolvedValueOnce(jsonResponse({ // jobs
          data: [{ id: 1, jobName: 'Eng', jobDescription: 'd', status: 'ACTIVE' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ // applications
          data: [{ id: 100, firstname: 'A', lastname: 'B', email: 'a@b.com', status: 'NEW', createdOn: '2024' }],
        }))
        .mockResolvedValueOnce(jsonResponse({ data: [] })) // docs (no CV)

      const r = await syncSoftgarden('k', 'u')
      expect(r.imported).toBe(1)
    })

    it('captures error on auth failure', async () => {
      const { syncSoftgarden } = await import('../sync')
      vi.mocked(fetch).mockResolvedValue(errorResponse(401))
      const r = await syncSoftgarden('k', 'u')
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
    expect(r[0].emails).toEqual([])
  })

  it('Greenhouse: handles candidate with no CV (returns null without crash)', async () => {
    const { greenhouseDownloadCV } = await import('../greenhouse')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse([]))
    const r = await greenhouseDownloadCV('k', 1)
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

  it('Personio: handles position with no description', async () => {
    const { personioFetchJobs } = await import('../personio')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({
      data: [{ id: 1, name: 'Eng', status: 'active', created_at: '2024' }],
    }))
    const r = await personioFetchJobs('k')
    expect(r[0].description).toBeUndefined()
  })

  it('iCIMS: handles attachments shape variations', async () => {
    const { icimsDownloadCV } = await import('../icims')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 1, filename: 'resume.pdf', url: 'https://x/y', type: 'Resume' }] }))
      .mockResolvedValueOnce(jsonResponse('content'))
    const r = await icimsDownloadCV('k', 'c', 1)
    expect(r?.filename).toBe('resume.pdf')
  })

  it('Softgarden: handles document with .docx extension as fallback CV', async () => {
    const { softgardenDownloadCV } = await import('../softgarden')
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: 1, filename: 'my-cv.docx', url: 'https://x', type: 'OTHER' }] }))
      .mockResolvedValueOnce(jsonResponse('content'))
    const r = await softgardenDownloadCV('k', 1)
    expect(r?.filename).toBe('my-cv.docx')
  })

  it('Breezy: candidate without resume returns null (no crash)', async () => {
    const { breezyDownloadCV } = await import('../breezyhr')
    vi.mocked(fetch).mockResolvedValueOnce(errorResponse(404))
    const r = await breezyDownloadCV('https://x/y', 'k')
    expect(r).toBeNull()
  })

  it('Homerun: download CV failure returns null', async () => {
    const { homerunDownloadCV } = await import('../homerun')
    vi.mocked(fetch).mockRejectedValueOnce(new Error('socket hang up'))
    const r = await homerunDownloadCV('https://x/y', 'k')
    expect(r).toBeNull()
  })

  it('Flatchr: empty job list returns empty array', async () => {
    const { flatchrFetchJobs } = await import('../flatchr')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ data: [] }))
    const r = await flatchrFetchJobs('k')
    expect(r).toEqual([])
  })
})
