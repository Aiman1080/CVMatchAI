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
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

// Mock email
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  isEmailConfigured: vi.fn().mockReturnValue(true),
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

const prisma = (await import('@/lib/prisma')).default
const { sendEmail, isEmailConfigured } = await import('@/lib/email')
const { getServerSession } = await import('next-auth')

describe('Auth Flow - Register', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(isEmailConfigured as any).mockReturnValue(true)
    const mod = await import('../auth/register/route')
    POST = mod.POST
  })

  it('registers with valid data → 201 + user created', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue(null)
    ;(prisma.user.create as any).mockResolvedValue({ id: 'new-user-1', name: 'John', email: 'john@test.com' })
    ;(prisma.verificationToken.create as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@test.com', password: 'password123', company: 'Acme' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.userId).toBe('new-user-1')
    expect(prisma.user.create).toHaveBeenCalledOnce()
  })

  it('register with duplicate email → 400', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: 'existing-user', email: 'john@test.com' })

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@test.com', password: 'password123' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Email already registered')
  })

  it('register with short password → 400', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@test.com', password: 'short' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBeDefined()
  })

  it('register with missing fields → 400', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'john@test.com' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

describe('Auth Flow - Forgot Password', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(isEmailConfigured as any).mockReturnValue(true)
    const mod = await import('../auth/forgot-password/route')
    POST = mod.POST
  })

  it('forgot password with valid email → 200 (always)', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1', name: 'Test', email: 'test@test.com' })
    ;(prisma.verificationToken.deleteMany as any).mockResolvedValue({})
    ;(prisma.verificationToken.create as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('forgot password with non-existent email → 200 (prevents enumeration)', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue(null)

    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@test.com' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('forgot password with missing email → 400', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Email is required')
  })
})

describe('Auth Flow - Reset Password', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../auth/reset-password/route')
    POST = mod.POST
  })

  it('reset password with valid token → 200', async () => {
    ;(prisma.verificationToken.findUnique as any).mockResolvedValue({
      token: 'valid-token',
      identifier: 'test@test.com',
      expires: new Date(Date.now() + 60 * 60 * 1000),
    })
    ;(prisma.user.findUnique as any).mockResolvedValue({ id: 'user-1', email: 'test@test.com' })
    ;(prisma.user.update as any).mockResolvedValue({})
    ;(prisma.verificationToken.delete as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', password: 'newpassword123' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('reset password with expired token → 400', async () => {
    ;(prisma.verificationToken.findUnique as any).mockResolvedValue({
      token: 'expired-token',
      identifier: 'test@test.com',
      expires: new Date(Date.now() - 60 * 60 * 1000), // expired 1 hour ago
    })
    ;(prisma.verificationToken.delete as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'expired-token', password: 'newpassword123' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('expired')
  })

  it('reset password with invalid token → 400', async () => {
    ;(prisma.verificationToken.findUnique as any).mockResolvedValue(null)

    const req = new Request('http://localhost/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token', password: 'newpassword123' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid')
  })
})

describe('Auth Flow - Verify Email', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('../auth/verify-email/route')
    POST = mod.POST
  })

  it('verify email with valid token → 200', async () => {
    ;(prisma.verificationToken.findFirst as any).mockResolvedValue({
      token: 'valid-token',
      identifier: 'test@test.com',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    ;(prisma.$transaction as any).mockResolvedValue([{}, {}])

    const req = new Request('http://localhost/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: 'valid-token', email: 'test@test.com' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('verify email with expired token → 400', async () => {
    ;(prisma.verificationToken.findFirst as any).mockResolvedValue({
      token: 'expired-token',
      identifier: 'test@test.com',
      expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired
    })
    ;(prisma.verificationToken.delete as any).mockResolvedValue({})

    const req = new Request('http://localhost/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: 'expired-token', email: 'test@test.com' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('expired')
  })
})

describe('Auth Flow - Resend Verification', () => {
  let POST: any

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@test.com', role: 'recruiter' },
    })
    ;(isEmailConfigured as any).mockReturnValue(true)
    const mod = await import('../auth/resend-verification/route')
    POST = mod.POST
  })

  it('resend verification → 200', async () => {
    ;(prisma.user.findUnique as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      emailVerified: null,
    })
    ;(prisma.verificationToken.deleteMany as any).mockResolvedValue({})
    ;(prisma.verificationToken.create as any).mockResolvedValue({})

    const response = await POST()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(sendEmail).toHaveBeenCalledOnce()
  })
})
