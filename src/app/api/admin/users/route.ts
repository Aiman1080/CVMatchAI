// Admin user list — returns all registered accounts with counts of their vacancies,
// candidates, inboxes and tickets. Password hashes are never included in the select.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, company: true,
      role: true, subscription: true, subscriptionEnd: true,
      suspended: true, createdAt: true,
      _count: { select: { vacancies: true, candidates: true, emailInboxes: true, supportTickets: true } },
    },
  })
  return NextResponse.json(users)
}
