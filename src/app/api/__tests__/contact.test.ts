import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the email module before importing the route
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  isEmailConfigured: vi.fn().mockReturnValue(true),
}))

// Mock next/server — return objects with a .json() method so tests can read the body
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      json: async () => body,
    }),
  },
}))

const { POST } = await import('../../../app/api/contact/route')
const { sendEmail, isEmailConfigured } = await import('@/lib/email')

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(isEmailConfigured as any).mockReturnValue(true)
  })

  it('returns 400 when name is missing', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.com', subject: 'Hi', message: 'Hello' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('All fields are required')
  })

  it('returns 400 when email is missing', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', subject: 'Hi', message: 'Hello' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when subject is missing', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'a@b.com', message: 'Hello' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when message is missing', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'a@b.com', subject: 'Hi' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when fields are empty strings', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: '  ', email: 'a@b.com', subject: 'Hi', message: 'Hello' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 500 when email is not configured', async () => {
    ;(isEmailConfigured as any).mockReturnValue(false)

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'a@b.com', subject: 'Hi', message: 'Hello' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Email not configured')
  })

  it('calls sendEmail with correct arguments on success', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'John', email: 'john@test.com', subject: 'Question', message: 'Hello there' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(sendEmail).toHaveBeenCalledOnce()
    expect(sendEmail).toHaveBeenCalledWith(
      'contactcvmatchia@gmail.com',
      '[DeltaMatch Contact] Question',
      expect.stringContaining('John'),
    )
  })

  it('returns 500 when sendEmail throws', async () => {
    ;(sendEmail as any).mockRejectedValueOnce(new Error('SMTP failure'))

    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', email: 'a@b.com', subject: 'Hi', message: 'Hello' }),
    })

    const response = await POST(req)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('SMTP failure')
  })
})
