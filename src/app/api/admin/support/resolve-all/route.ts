// Admin: mark every open/in_progress support ticket as resolved in one call.
// Used by the "Mark all resolved" button in the admin Support tab so the alerts
// counter drops back to zero without the admin having to update each ticket.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await prisma.supportTicket.updateMany({
      where: { status: { in: ['open', 'in_progress'] } },
      data: { status: 'resolved', repliedAt: new Date() },
    })
    return NextResponse.json({ resolved: result.count })
  } catch {
    return NextResponse.json({ error: 'Failed to resolve tickets' }, { status: 500 })
  }
}
