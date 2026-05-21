// Admin support queue — returns ALL tickets across all users, ordered open-first
// then newest-first, with the submitting user's name, email and subscription tier included.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { user: { select: { name: true, email: true, company: true, subscription: true } } },
  })
  return NextResponse.json(tickets)
}
