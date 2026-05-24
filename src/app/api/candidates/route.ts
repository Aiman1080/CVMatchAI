// Candidates list — returns the current user's candidates sorted by AI match score.
// Supports optional ?vacancyId, ?status, ?page, and ?limit query filters.
// Admins can query across all users by omitting the userId scope.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Returns candidates with pagination. Default limit=30.
// Response: { candidates, total, page, totalPages }
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const vacancyId = searchParams.get('vacancyId')
  const status = searchParams.get('status')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '30', 10)))
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  // Admins can query across all users; regular users scoped to their own data
  const where: any = isAdmin ? {} : { userId }
  if (vacancyId) where.vacancyId = vacancyId
  if (status) where.status = status
  try {
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: { vacancy: { select: { title: true, company: true } } },
        orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.candidate.count({ where }),
    ])
    const totalPages = Math.ceil(total / limit)
    return NextResponse.json({ candidates, total, page, totalPages })
  } catch {
    return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 })
  }
}
