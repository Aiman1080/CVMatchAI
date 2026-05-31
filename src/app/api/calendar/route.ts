// Returns the recruiter's scheduled interviews for the dashboard calendar widget.
// Optional ?from / ?to ISO bounds; defaults to from now to +60 days. Admins see all.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  const url = new URL(req.url)
  const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : new Date()
  const to = url.searchParams.get('to')
    ? new Date(url.searchParams.get('to')!)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

  try {
    const candidates = await prisma.candidate.findMany({
      where: {
        ...(isAdmin ? {} : { userId }),
        interviewAt: { gte: from, lte: to },
      },
      orderBy: { interviewAt: 'asc' },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        interviewAt: true, interviewDuration: true, interviewLocation: true,
        status: true, vacancy: { select: { title: true } },
      },
    })

    const events = candidates.map(c => ({
      candidateId: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Candidate',
      email: c.email,
      vacancyTitle: c.vacancy?.title || null,
      interviewAt: c.interviewAt,
      durationMinutes: c.interviewDuration || 30,
      location: c.interviewLocation,
      status: c.status,
    }))

    return NextResponse.json({ events })
  } catch (e: any) {
    console.error('[calendar] failed:', e?.message || e)
    return NextResponse.json({ events: [] })
  }
}
