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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    supportTicket: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-temp-password'),
  },
}))

// Mock notifications
vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}))

const prisma = (await import('@/lib/prisma')).default
const { getServerSession } = await import('next-auth')

const adminSession = {
  user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'admin', subscription: 'pro' },
}

const recruiterSession = {
  user: { id: 'user-1', name: 'Recruiter', email: 'recruiter@test.com', role: 'recruiter', subscription: 'pro' },
}

describe('Admin Flow - List Users', () => {
  let GET: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../admin/users/route')
    GET = mod.GET
  })

  it('list users as admin → 200', async () => {
    ;(getServerSession as any).mockResolvedValue(adminSession)
    ;(prisma.user.findMany as any).mockResolvedValue([
      { id: 'u1', name: 'Alice', email: 'alice@test.com', role: 'recruiter', subscription: 'free', _count: { vacancies: 2, candidates: 10, emailInboxes: 0, supportTickets: 1 } },
      { id: 'u2', name: 'Bob', email: 'bob@test.com', role: 'recruiter', subscription: 'pro', _count: { vacancies: 5, candidates: 50, emailInboxes: 1, supportTickets: 0 } },
    ])

    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(2)
  })

  it('list users as non-admin → 403', async () => {
    ;(getServerSession as any).mockResolvedValue(recruiterSession)

    const response = await GET()
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toBe('Forbidden')
  })
})

describe('Admin Flow - Update User Subscription', () => {
  let PATCH: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(adminSession)
    const mod = await import('../admin/users/[id]/route')
    PATCH = mod.PATCH
  })

  it('update user subscription → 200', async () => {
    ;(prisma.user.update as any).mockResolvedValue({
      id: 'u1',
      name: 'Alice',
      email: 'alice@test.com',
      role: 'recruiter',
      subscription: 'pro',
      subscriptionEnd: null,
      suspended: false,
      company: null,
      createdAt: new Date(),
    })

    const req = new Request('http://localhost/api/admin/users/u1', {
      method: 'PATCH',
      body: JSON.stringify({ subscription: 'pro' }),
    })

    const response = await PATCH(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.subscription).toBe('pro')
  })
})

describe('Admin Flow - Delete User', () => {
  let DELETE: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(adminSession)
    const mod = await import('../admin/users/[id]/route')
    DELETE = mod.DELETE
  })

  it('delete user → 200', async () => {
    ;(prisma.user.delete as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/admin/users/u1', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})

describe('Admin Flow - Reset User Password', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(adminSession)
    const mod = await import('../admin/users/[id]/reset-password/route')
    POST = mod.POST
  })

  it('reset user password → 200 + temp password returned', async () => {
    ;(prisma.user.update as any).mockResolvedValue({ email: 'alice@test.com' })

    const req = new Request('http://localhost/api/admin/users/u1/reset-password', { method: 'POST' })
    const response = await POST(req, { params: Promise.resolve({ id: 'u1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.tempPassword).toBeDefined()
    expect(typeof data.tempPassword).toBe('string')
    expect(data.tempPassword.length).toBe(12)
    expect(data.email).toBe('alice@test.com')
  })
})

describe('Admin Flow - Reply to Support Ticket', () => {
  let PATCH: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(adminSession)
    const mod = await import('../admin/support/[id]/route')
    PATCH = mod.PATCH
  })

  it('reply to support ticket → 200', async () => {
    ;(prisma.supportTicket.update as any).mockResolvedValue({
      id: 'ticket-1',
      subject: 'Help with import',
      status: 'resolved',
      adminReply: 'Fixed it!',
      repliedAt: new Date(),
      userId: 'u1',
      user: { name: 'Alice', email: 'alice@test.com' },
    })

    const req = new Request('http://localhost/api/admin/support/ticket-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved', adminReply: 'Fixed it!' }),
    })

    const response = await PATCH(req, { params: Promise.resolve({ id: 'ticket-1' }) })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.adminReply).toBe('Fixed it!')
    expect(data.status).toBe('resolved')
  })
})

describe('Admin Flow - Broadcast Notification', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(adminSession)
    const mod = await import('../admin/broadcast/route')
    POST = mod.POST
  })

  it('broadcast notification → 200', async () => {
    ;(prisma.user.findMany as any).mockResolvedValue([
      { id: 'u1' },
      { id: 'u2' },
      { id: 'u3' },
    ])
    ;(prisma.notification.createMany as any).mockResolvedValue({ count: 3 })

    const req = new Request('http://localhost/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title: 'New feature!', message: 'We added email scanning.' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.sent).toBe(3)
  })
})
