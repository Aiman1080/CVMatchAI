import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'
import { isDemoAccount } from '@/lib/demo-guard'
import { encrypt } from '@/lib/crypto'

// Returns connected inboxes without exposing stored passwords
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const inboxes = await prisma.emailInbox.findMany({
    where: { userId },
    // Explicitly exclude password from the selected fields
    select: { id: true, email: true, provider: true, active: true, lastScan: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(inboxes)
}

// Verifies IMAP connection before saving — avoids storing credentials that don't work
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }

  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
  const effectiveSubscription = getEffectiveSubscription(user?.subscription || 'free', user?.subscriptionEnd || null)
  const limits = getPlanLimits(effectiveSubscription)
  if (!limits.emailInbox) {
    return NextResponse.json({ error: 'Email scanning requires a Pro plan', upgrade: true }, { status: 403 })
  }

  const { email, provider, host, port, username, password } = await req.json()

  if (!email || !host || !username || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Test the connection live — fail fast with a clear error rather than storing bad credentials
  try {
    const { ImapFlow } = await import('imapflow')
    const client = new ImapFlow({
      host,
      port: Number(port) || 993,
      secure: true,
      auth: { user: username, pass: password },
      logger: false,
    })
    await client.connect()
    await client.logout()
  } catch (error: any) {
    return NextResponse.json(
      { error: `Connection failed: ${error.message || 'Invalid credentials or host'}` },
      { status: 400 },
    )
  }

  try {
    const inbox = await prisma.emailInbox.create({
      data: { email, provider, host, port: Number(port) || 993, username, password: encrypt(password), userId },
    })

    // Return only safe fields — never echo the password back to the client
    return NextResponse.json({
      id: inbox.id,
      email: inbox.email,
      provider: inbox.provider,
      active: inbox.active,
      lastScan: inbox.lastScan,
      createdAt: inbox.createdAt,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to save inbox configuration' }, { status: 500 })
  }
}

// deleteMany with userId constraint prevents deleting another user's inbox
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }

  const userId = (session.user as any).id
  try {
    const { id } = await req.json()
    if (!id || typeof id !== 'string') return NextResponse.json({ error: 'Missing inbox id' }, { status: 400 })
    await prisma.emailInbox.deleteMany({ where: { id, userId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to disconnect inbox' }, { status: 500 })
  }
}
