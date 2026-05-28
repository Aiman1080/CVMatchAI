import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { isDemoAccount } from '@/lib/demo-guard'

const ADMIN_EMAIL = process.env.CONTACT_EMAIL || 'contactcvmatchia@gmail.com'

// Limits to prevent abusive payloads
const MAX_SUBJECT_LENGTH = 200
const MAX_MESSAGE_LENGTH = 5000
const ALLOWED_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tickets)
  } catch {
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }
  const userId = (session.user as any).id
  try {
    const { subject, message, priority } = await req.json()
    if (!subject?.trim() || !message?.trim())
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })

    if (subject.length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json({ error: `Subject must be ${MAX_SUBJECT_LENGTH} characters or fewer` }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 })
    }
    const normalizedPriority = (priority || 'normal') as string
    if (!ALLOWED_PRIORITIES.includes(normalizedPriority as typeof ALLOWED_PRIORITIES[number])) {
      return NextResponse.json({ error: `Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}` }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: { userId, subject: subject.trim(), message: message.trim(), priority: normalizedPriority },
      include: { user: { select: { name: true, email: true, company: true } } },
    })

    if (isEmailConfigured()) {
      const body = `New support ticket #${ticket.id}\n\n` +
        `From: ${ticket.user.name || 'Unknown'} (${ticket.user.email})\n` +
        `Company: ${ticket.user.company || '-'}\n` +
        `Priority: ${normalizedPriority}\n\n` +
        `Subject: ${subject}\n\n` +
        `Message:\n${message}`
      sendEmail(ADMIN_EMAIL, `[DeltaMatch Support] ${subject}`, body).catch(() => {})
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 })
  }
}
