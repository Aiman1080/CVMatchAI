import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const inboxes = await prisma.emailInbox.findMany({
    where: { userId },
    select: { id: true, email: true, provider: true, active: true, lastScan: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(inboxes)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { email, provider, host, port, username, password } = await req.json()

  if (!email || !host || !username || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify connection before saving
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

  const inbox = await prisma.emailInbox.create({
    data: { email, provider, host, port: Number(port) || 993, username, password, userId },
  })

  return NextResponse.json({
    id: inbox.id,
    email: inbox.email,
    provider: inbox.provider,
    active: inbox.active,
    lastScan: inbox.lastScan,
    createdAt: inbox.createdAt,
  })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { id } = await req.json()

  await prisma.emailInbox.deleteMany({ where: { id, userId } })
  return NextResponse.json({ success: true })
}
