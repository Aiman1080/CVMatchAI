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
    },
    candidate: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    emailInbox: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
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
    emailInbox: true,
  }),
}))

// Mock AI
vi.mock('@/lib/ai', () => ({
  analyzeCVAgainstVacancy: vi.fn().mockResolvedValue({
    firstName: 'Alex',
    lastName: 'Johnson',
    phone: '+32 471 555 001',
    matchScore: 75,
    summary: 'Experienced developer',
    strengths: ['React', 'Node'],
    weaknesses: ['No Go'],
    skills: ['React', 'TypeScript'],
    experience: '7 years',
    education: 'Master Software Engineering',
    recommendation: 'yes',
    language: 'en',
  }),
}))

// Mock imapflow for connect route — must be a class (not plain fn) for `new` to work
vi.mock('imapflow', () => ({
  ImapFlow: class MockImapFlow {
    connect() { return Promise.resolve() }
    logout() { return Promise.resolve() }
  },
}))

const prisma = (await import('@/lib/prisma')).default
const { getServerSession } = await import('next-auth')
const { getPlanLimits } = await import('@/lib/plans')

describe('Email Scan Flow - Connect Inbox', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../email/connect/route')
    POST = mod.POST
  })

  it('connect inbox without plan → 403', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ subscription: 'free' })
    ;(getPlanLimits as any).mockReturnValue({ emailInbox: false })

    const req = new Request('http://localhost/api/email/connect', {
      method: 'POST',
      body: JSON.stringify({
        email: 'inbox@test.com',
        provider: 'imap',
        host: 'imap.test.com',
        port: 993,
        username: 'inbox@test.com',
        password: 'secret',
      }),
    })

    const response = await POST(req)
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.upgrade).toBe(true)
  })

  it('connect inbox with pro plan → 200', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ subscription: 'pro' })
    ;(getPlanLimits as any).mockReturnValue({ emailInbox: true })
    ;(prisma.emailInbox.create as any).mockResolvedValue({
      id: 'inbox-1',
      email: 'inbox@test.com',
      provider: 'imap',
      active: true,
      lastScan: null,
      createdAt: new Date(),
    })

    const req = new Request('http://localhost/api/email/connect', {
      method: 'POST',
      body: JSON.stringify({
        email: 'inbox@test.com',
        provider: 'imap',
        host: 'imap.test.com',
        port: 993,
        username: 'inbox@test.com',
        password: 'secret',
      }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe('inbox-1')
    expect(data.email).toBe('inbox@test.com')
  })
})

describe('Email Scan Flow - Demo Scan', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter', subscription: 'pro' },
    })
    const mod = await import('../email/demo-scan/route')
    POST = mod.POST
  })

  it('demo scan with no vacancies → 400', async () => {
    ;(prisma.vacancy.findMany as any).mockResolvedValue([])

    const req = new Request('http://localhost/api/email/demo-scan', { method: 'POST' })
    const response = await POST()
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('vacancy')
  })

  it('demo scan with vacancies → 200 + { scanned, relevant, processed }', async () => {
    ;(prisma.vacancy.findMany as any).mockResolvedValue([
      { id: 'v1', title: 'Senior Developer', description: 'Build React apps', requirements: 'React, TypeScript, Node.js' },
    ])
    ;(prisma.emailInbox.findFirst as any).mockResolvedValue(null)
    ;(prisma.emailInbox.create as any).mockResolvedValue({ id: 'demo-inbox-1' })
    ;(prisma.candidate.findMany as any).mockResolvedValue([])
    ;(prisma.candidate.create as any).mockResolvedValue({ id: 'c-new' })

    const req = new Request('http://localhost/api/email/demo-scan', { method: 'POST' })
    const response = await POST()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.scanned).toBe(4)
    expect(data.relevant).toBe(4)
    expect(data.processed).toBe(4)
  })

  it('demo scan duplicate handling → processed: 0 on second run', async () => {
    ;(prisma.vacancy.findMany as any).mockResolvedValue([
      { id: 'v1', title: 'Senior Developer', description: 'Build React apps', requirements: 'React, TypeScript, Node.js' },
    ])
    ;(prisma.emailInbox.findFirst as any).mockResolvedValue({ id: 'demo-inbox-1' })
    // All demo emails already exist
    ;(prisma.candidate.findMany as any).mockResolvedValue([
      { email: 'alex.johnson@gmail.com' },
      { email: 'maya.patel@outlook.com' },
      { email: 'julien.bernard@free.fr' },
      { email: 'nina.schmidt@web.de' },
    ])

    const req = new Request('http://localhost/api/email/demo-scan', { method: 'POST' })
    const response = await POST()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.processed).toBe(0)
  })
})
