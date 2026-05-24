import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Returns the activity timeline for a candidate, newest first, capped at 50 entries
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  try {
    // Ownership check — admins can view any candidate's activity
    const candidate = await prisma.candidate.findFirst({
      where: isAdmin ? { id } : { id, userId },
      select: { id: true },
    })
    if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const activities = await prisma.candidateActivity.findMany({
      where: { candidateId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(activities)
  } catch {
    return NextResponse.json({ error: 'Failed to load activities' }, { status: 500 })
  }
}
