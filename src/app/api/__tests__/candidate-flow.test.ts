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
    candidate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    vacancy: {
      findFirst: vi.fn(),
    },
    candidateActivity: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ subscription: 'pro', subscriptionEnd: null }),
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

// Mock @/lib/plans for plan limit checks
vi.mock('@/lib/plans', () => ({
  getPlanLimits: vi.fn().mockReturnValue({
    maxVacancies: Infinity,
    maxCandidatesPerMonth: Infinity,
    csvImport: true,
    interviewQuestions: true,
    hiringReport: true,
    export: true,
  }),
  getEffectiveSubscription: vi.fn((sub: string) => sub),
}))

// Mock AI
vi.mock('@/lib/ai', () => ({
  generateInterviewQuestions: vi.fn().mockResolvedValue({ questions: [{ question: 'Tell me about your experience', category: 'technical' }] }),
  generateHiringReport: vi.fn().mockResolvedValue({ report: 'This candidate is a strong fit.' }),
}))

// Mock activity logger
vi.mock('@/lib/activity', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}))

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({}),
    }),
  },
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  escapeHtml: vi.fn((str: string) => str),
  cn: vi.fn(),
  formatDate: vi.fn(),
}))

const prisma = (await import('@/lib/prisma')).default
const { getServerSession } = await import('next-auth')
const { generateInterviewQuestions, generateHiringReport } = await import('@/lib/ai')

describe('Candidate Flow - List with pagination', () => {
  let GET: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/route')
    GET = mod.GET
  })

  it('get candidates with pagination → 200 + correct shape', async () => {
    ;(prisma.candidate.findMany as any).mockResolvedValue([
      { id: 'c1', firstName: 'Alice', lastName: 'A', matchScore: 90, vacancy: { title: 'Dev', company: 'Acme' } },
      { id: 'c2', firstName: 'Bob', lastName: 'B', matchScore: 70, vacancy: { title: 'Dev', company: 'Acme' } },
    ])
    ;(prisma.candidate.count as any).mockResolvedValue(15)

    const req = new Request('http://localhost/api/candidates?page=1&limit=2')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.candidates).toHaveLength(2)
    expect(data.total).toBe(15)
    expect(data.page).toBe(1)
    expect(data.totalPages).toBe(8)
  })
})

describe('Candidate Flow - Get by ID', () => {
  let GET: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/[id]/route')
    GET = mod.GET
  })

  it('get candidate by ID (own) → 200', async () => {
    ;(prisma.candidate.findFirst as any).mockResolvedValue({
      id: 'c1',
      firstName: 'Alice',
      lastName: 'A',
      userId: 'user-1',
      viewedAt: new Date(),
      vacancy: { title: 'Dev' },
      emailSource: null,
    })

    const req = new Request('http://localhost/api/candidates/c1')
    const response = await GET(req, { params: Promise.resolve({ id: 'c1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe('c1')
    expect(data.firstName).toBe('Alice')
  })

  it('get candidate by ID (not own) → 404', async () => {
    ;(prisma.candidate.findFirst as any).mockResolvedValue(null)

    const req = new Request('http://localhost/api/candidates/c99')
    const response = await GET(req, { params: Promise.resolve({ id: 'c99' }) })
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Not found')
  })
})

describe('Candidate Flow - Update status', () => {
  let PATCH: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/[id]/route')
    PATCH = mod.PATCH
  })

  it('update candidate status → 200', async () => {
    ;(prisma.candidate.findFirst as any).mockResolvedValue({ id: 'c1', userId: 'user-1', status: 'new', notes: '' })
    ;(prisma.candidate.update as any).mockResolvedValue({ id: 'c1', status: 'shortlisted' })

    const req = new Request('http://localhost/api/candidates/c1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'shortlisted' }),
    })

    const response = await PATCH(req, { params: Promise.resolve({ id: 'c1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('shortlisted')
  })
})

describe('Candidate Flow - Delete', () => {
  let DELETE: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/[id]/route')
    DELETE = mod.DELETE
  })

  it('delete candidate → 200', async () => {
    ;(prisma.candidate.findFirst as any).mockResolvedValue({ id: 'c1', userId: 'user-1' })
    ;(prisma.candidate.delete as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/candidates/c1', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'c1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})

describe('Candidate Flow - Import CSV', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/import/route')
    POST = mod.POST
  })

  it('import CSV with valid data → 200 + { imported, skipped }', async () => {
    ;(prisma.vacancy.findFirst as any).mockResolvedValue({ id: 'v1', userId: 'user-1' })
    ;(prisma.candidate.findFirst as any).mockResolvedValue(null)
    ;(prisma.candidate.create as any).mockResolvedValue({ id: 'c-new' })

    const csvContent = 'firstName,lastName,email,phone,status\nAlice,Smith,alice@test.com,+123,new\nBob,Jones,bob@test.com,+456,new'

    // jsdom loses File content through FormData serialization in Request,
    // so we mock the request's formData method directly
    const mockFile = { text: () => Promise.resolve(csvContent), name: 'candidates.csv' }
    const req = {
      formData: () => Promise.resolve({
        get: (key: string) => key === 'file' ? mockFile : key === 'vacancyId' ? 'v1' : null,
      }),
    } as unknown as Request

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.imported).toBe(2)
    expect(data.skipped).toBe(0)
  })

  it('import CSV with missing vacancy → 404', async () => {
    ;(prisma.vacancy.findFirst as any).mockResolvedValue(null)

    const csvContent = 'firstName,lastName,email\nAlice,Smith,alice@test.com'
    const mockFile = { text: () => Promise.resolve(csvContent), name: 'candidates.csv' }
    const req = {
      formData: () => Promise.resolve({
        get: (key: string) => key === 'file' ? mockFile : key === 'vacancyId' ? 'non-existent' : null,
      }),
    } as unknown as Request

    const response = await POST(req)
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })
})

describe('Candidate Flow - Compare', () => {
  let GET: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/compare/route')
    GET = mod.GET
  })

  it('compare 2 candidates → 200', async () => {
    ;(prisma.candidate.findMany as any).mockResolvedValue([
      { id: 'c1', firstName: 'Alice', lastName: 'A', vacancy: { title: 'Dev', company: 'Acme' } },
      { id: 'c2', firstName: 'Bob', lastName: 'B', vacancy: { title: 'Dev', company: 'Acme' } },
    ])

    const req = new Request('http://localhost/api/candidates/compare?ids=c1,c2')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.candidates).toHaveLength(2)
  })

  it('compare 1 candidate → 400 error', async () => {
    const req = new Request('http://localhost/api/candidates/compare?ids=c1')
    const response = await GET(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('2 or 3')
  })
})

describe('Candidate Flow - Interview Questions', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/interview-questions/route')
    POST = mod.POST
  })

  it('interview questions for valid candidate → 200', async () => {
    ;(prisma.candidate.findFirst as any).mockResolvedValue({
      id: 'c1',
      userId: 'user-1',
      cvContent: 'Some CV text with experience...',
      language: 'en',
      vacancy: { title: 'Dev', description: 'Build stuff', requirements: 'React' },
    })

    const req = new Request('http://localhost/api/candidates/interview-questions', {
      method: 'POST',
      body: JSON.stringify({ candidateId: 'c1' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.questions).toBeDefined()
    expect(generateInterviewQuestions).toHaveBeenCalledOnce()
  })
})

describe('Candidate Flow - Hiring Report', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/hiring-report/route')
    POST = mod.POST
  })

  it('hiring report for valid candidate → 200', async () => {
    ;(prisma.candidate.findFirst as any).mockResolvedValue({
      id: 'c1',
      userId: 'user-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@test.com',
      phone: '+123',
      matchScore: 85,
      summary: 'Great candidate',
      strengths: 'React, Node',
      weaknesses: 'No Go experience',
      skills: 'React, TypeScript',
      experience: '5 years',
      education: 'BSc CS',
      recommendation: 'yes',
      language: 'en',
      vacancy: { title: 'Dev', description: 'Build stuff' },
    })

    const req = new Request('http://localhost/api/candidates/hiring-report', {
      method: 'POST',
      body: JSON.stringify({ candidateId: 'c1' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.report).toBeDefined()
    expect(generateHiringReport).toHaveBeenCalledOnce()
  })
})

describe('Candidate Flow - Send Email', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../candidates/send-email/route')
    POST = mod.POST
  })

  it('send email without SMTP → 400', async () => {
    // Ensure SMTP vars are not set
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS

    ;(prisma.candidate.findFirst as any).mockResolvedValue({
      id: 'c1',
      userId: 'user-1',
      email: 'alice@test.com',
      vacancy: { title: 'Dev' },
    })

    const req = new Request('http://localhost/api/candidates/send-email', {
      method: 'POST',
      body: JSON.stringify({
        candidateId: 'c1',
        type: 'interview',
        subject: 'Interview Invitation',
        body: 'We would like to invite you...',
      }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('not configured')
  })
})
