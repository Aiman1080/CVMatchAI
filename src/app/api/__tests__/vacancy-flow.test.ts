import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    vacancy: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    candidate: {
      findMany: vi.fn(),
    },
  },
}))

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
  }),
}))

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock plans
vi.mock('@/lib/plans', () => ({
  getPlanLimits: vi.fn().mockReturnValue({
    maxVacancies: Infinity,
    maxCandidatesPerMonth: Infinity,
    aiAnalysis: true,
    emailInbox: true,
  }),
}))

// Mock AI
vi.mock('@/lib/ai', () => ({
  generateJobDescription: vi.fn().mockResolvedValue({ description: 'Generated description', requirements: 'Generated requirements', niceToHave: 'Generated nice to have' }),
  rankCandidates: vi.fn().mockResolvedValue({ ranking: [{ id: 'c1', rank: 1 }, { id: 'c2', rank: 2 }] }),
}))

const prisma = (await import('@/lib/prisma')).default
const { getServerSession } = await import('next-auth')
const { getPlanLimits } = await import('@/lib/plans')
const { generateJobDescription, rankCandidates } = await import('@/lib/ai')

describe('Vacancy Flow - Create', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    ;(getPlanLimits as any).mockReturnValue({ maxVacancies: Infinity })
    const mod = await import('../vacancies/route')
    POST = mod.POST
  })

  it('create vacancy with valid data → 201', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ subscription: 'pro' })
    ;(prisma.vacancy.count as any).mockResolvedValue(0)
    ;(prisma.vacancy.create as any).mockResolvedValue({
      id: 'vacancy-1',
      title: 'Senior Developer',
      company: 'Acme',
      description: 'Build great things for us here.',
      requirements: 'Must know React',
    })

    const req = new Request('http://localhost/api/vacancies', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Senior Developer',
        company: 'Acme',
        description: 'Build great things for us here.',
        requirements: 'Must know React',
      }),
    })

    const response = await POST(req)
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.id).toBe('vacancy-1')
    expect(prisma.vacancy.create).toHaveBeenCalledOnce()
  })

  it('create vacancy with missing title → 400', async () => {
    const req = new Request('http://localhost/api/vacancies', {
      method: 'POST',
      body: JSON.stringify({
        company: 'Acme',
        description: 'Build great things for us here.',
        requirements: 'Must know React',
      }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('create vacancy with plan limit reached → 403', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ subscription: 'free' })
    ;(getPlanLimits as any).mockReturnValue({ maxVacancies: 3 })
    ;(prisma.vacancy.count as any).mockResolvedValue(3)

    const req = new Request('http://localhost/api/vacancies', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Senior Developer',
        company: 'Acme',
        description: 'Build great things for us here.',
        requirements: 'Must know React',
      }),
    })

    const response = await POST(req)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.upgrade).toBe(true)
  })
})

describe('Vacancy Flow - List', () => {
  let GET: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../vacancies/route')
    GET = mod.GET
  })

  it('get vacancies list → 200 with array', async () => {
    ;(prisma.vacancy.findMany as any).mockResolvedValue([
      { id: 'v1', title: 'Dev', _count: { candidates: 5 } },
      { id: 'v2', title: 'Designer', _count: { candidates: 2 } },
    ])

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
  })
})

describe('Vacancy Flow - Update Status', () => {
  let PATCH: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../vacancies/[id]/route')
    PATCH = mod.PATCH
  })

  it('update vacancy status with valid value → 200', async () => {
    ;(prisma.vacancy.findFirst as any).mockResolvedValue({ id: 'v1', userId: 'user-1' })
    ;(prisma.vacancy.update as any).mockResolvedValue({ id: 'v1', status: 'archived' })

    const req = new Request('http://localhost/api/vacancies/v1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'archived' }),
    })

    const response = await PATCH(req, { params: Promise.resolve({ id: 'v1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('archived')
  })

  it('update vacancy status with invalid value → 400', async () => {
    ;(prisma.vacancy.findFirst as any).mockResolvedValue({ id: 'v1', userId: 'user-1' })

    const req = new Request('http://localhost/api/vacancies/v1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'invalid_status' }),
    })

    const response = await PATCH(req, { params: Promise.resolve({ id: 'v1' }) })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid status')
  })
})

describe('Vacancy Flow - Delete', () => {
  let DELETE: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../vacancies/[id]/route')
    DELETE = mod.DELETE
  })

  it('delete vacancy → 200', async () => {
    ;(prisma.vacancy.findFirst as any).mockResolvedValue({ id: 'v1', userId: 'user-1' })
    ;(prisma.vacancy.delete as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/vacancies/v1', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'v1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})

describe('Vacancy Flow - Duplicate', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    ;(getPlanLimits as any).mockReturnValue({ maxVacancies: Infinity })
    const mod = await import('../vacancies/[id]/duplicate/route')
    POST = mod.POST
  })

  it('duplicate vacancy → 201', async () => {
    ;(prisma.vacancy.findFirst as any).mockResolvedValue({
      id: 'v1',
      title: 'Senior Dev',
      company: 'Acme',
      department: 'Engineering',
      location: 'Remote',
      type: 'full-time',
      description: 'Great job description here.',
      requirements: 'React, Node',
      niceToHave: 'Go',
      salary: '80k',
      language: 'en',
      userId: 'user-1',
    })
    ;(prisma.user.findUnique as any).mockResolvedValue({ subscription: 'pro' })
    ;(prisma.vacancy.count as any).mockResolvedValue(1)
    ;(prisma.vacancy.create as any).mockResolvedValue({
      id: 'v2',
      title: 'Copy of Senior Dev',
      company: 'Acme',
    })

    const req = new Request('http://localhost/api/vacancies/v1/duplicate', { method: 'POST' })
    const response = await POST(req, { params: Promise.resolve({ id: 'v1' }) })
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.title).toBe('Copy of Senior Dev')
  })
})

describe('Vacancy Flow - Generate Description', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../vacancies/generate-description/route')
    POST = mod.POST
  })

  it('generate description with title → 200', async () => {
    const req = new Request('http://localhost/api/vacancies/generate-description', {
      method: 'POST',
      body: JSON.stringify({ title: 'Senior Developer', keywords: 'React, Node', language: 'en' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.description).toBe('Generated description')
    expect(data.requirements).toBe('Generated requirements')
    expect(generateJobDescription).toHaveBeenCalledOnce()
  })

  it('generate description without title → 400', async () => {
    const req = new Request('http://localhost/api/vacancies/generate-description', {
      method: 'POST',
      body: JSON.stringify({ keywords: 'React, Node' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Title required')
  })
})

describe('Vacancy Flow - Ranking', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../vacancies/ranking/route')
    POST = mod.POST
  })

  it('ranking with < 2 candidates → 400', async () => {
    ;(prisma.vacancy.findFirst as any).mockResolvedValue({ id: 'v1', title: 'Dev', description: 'Desc', requirements: 'Req' })
    ;(prisma.candidate.findMany as any).mockResolvedValue([
      { id: 'c1', firstName: 'Alice', lastName: 'A', matchScore: 80, summary: '', strengths: '', weaknesses: '', skills: '', experience: '' },
    ])

    const req = new Request('http://localhost/api/vacancies/ranking', {
      method: 'POST',
      body: JSON.stringify({ vacancyId: 'v1' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('at least 2')
  })
})
