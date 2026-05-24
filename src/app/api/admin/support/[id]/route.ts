// Admin ticket management — GET a single ticket, PATCH to reply/update status.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Failed to load ticket' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    const { status, adminReply } = await req.json()
    const allowedStatuses = ['open', 'in_progress', 'resolved', 'closed']
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminReply !== undefined && { adminReply, repliedAt: new Date() }),
      },
      include: { user: { select: { name: true, email: true } } },
    })
    // Notify the ticket owner when an admin replies
    if (adminReply) {
      await createNotification(
        ticket.userId,
        'ticket_reply',
        `Reply on: ${ticket.subject}`,
        `An admin replied to your support ticket "${ticket.subject}"`
      )
    }

    return NextResponse.json(ticket)
  } catch {
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
