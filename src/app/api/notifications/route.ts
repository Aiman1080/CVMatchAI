import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  // Get candidates added in the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  try {
    const recentCandidates = await prisma.candidate.findMany({
      where: {
        ...(isAdmin ? {} : { userId }),
        createdAt: { gte: since },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        matchScore: true,
        createdAt: true,
        source: true,
        vacancy: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      notifications: recentCandidates.map(c => ({
        id: c.id,
        type: 'new_candidate',
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.vacancy?.title || 'No vacancy',
        score: c.matchScore,
        source: c.source,
        createdAt: c.createdAt,
        href: `/candidates/${c.id}`,
      })),
      count: recentCandidates.length,
    })
  } catch {
    return NextResponse.json({ notifications: [], count: 0 }, { status: 500 })
  }
}
