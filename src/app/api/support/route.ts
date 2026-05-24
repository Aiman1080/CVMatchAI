import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail, isEmailConfigured } from '@/lib/email'

const ADMIN_EMAIL = 'contactcvmatchia@gmail.com'

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
  const userId = (session.user as any).id
  try {
    const { subject, message, priority } = await req.json()
    if (!subject?.trim() || !message?.trim())
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })

    const ticket = await prisma.supportTicket.create({
      data: { userId, subject: subject.trim(), message: message.trim(), priority: priority || 'normal' },
      include: { user: { select: { name: true, email: true, company: true } } },
    })

    if (isEmailConfigured()) {
      const body = `New support ticket #${ticket.id}\n\n` +
        `From: ${ticket.user.name || 'Unknown'} (${ticket.user.email})\n` +
        `Company: ${ticket.user.company || '-'}\n` +
        `Priority: ${priority || 'normal'}\n\n` +
        `Subject: ${subject}\n\n` +
        `Message:\n${message}`
      sendEmail(ADMIN_EMAIL, `[CVMatch Support] ${subject}`, body).catch(() => {})
    }

    return NextResponse.json(ticket, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 })
  }
}
