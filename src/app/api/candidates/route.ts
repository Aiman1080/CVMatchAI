// Candidates list — returns the current user's candidates sorted by AI match score.
// Supports optional ?vacancyId, ?status, ?search, ?scoreFilter, ?sortBy, ?page, and ?limit query filters.
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
  const search = searchParams.get('search')?.trim() || ''
  const scoreFilter = searchParams.get('scoreFilter') || 'all'
  const sortBy = searchParams.get('sortBy') || 'score'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '30', 10)))
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  // Admins can query across all users; regular users scoped to their own data
  const where: any = isAdmin ? {} : { userId }
  if (vacancyId) where.vacancyId = vacancyId

  // Map UI status filter values into DB conditions (some are flag-based, not status-based)
  if (status && status !== 'all') {
    if (status === 'liked') where.liked = true
    else if (status === 'priority') where.priority = true
    else if (status === 'pool') where.savedToPool = true
    else where.status = status
  }

  // Free-text search across name/email/vacancy title — case-insensitive via lowercased contains
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { vacancy: { is: { title: { contains: search } } } },
    ]
  }

  // Score range filter — 75+, 50-74, 0-49
  if (scoreFilter === 'high') where.matchScore = { gte: 75 }
  else if (scoreFilter === 'medium') where.matchScore = { gte: 50, lt: 75 }
  else if (scoreFilter === 'low') where.matchScore = { gte: 0, lt: 50 }

  // Sort order — score desc default, supports name and creation date
  let orderBy: any
  if (sortBy === 'name') orderBy = [{ firstName: 'asc' }, { lastName: 'asc' }]
  else if (sortBy === 'date') orderBy = { createdAt: 'desc' }
  else if (sortBy === 'date_oldest') orderBy = { createdAt: 'asc' }
  else orderBy = [{ matchScore: 'desc' }, { createdAt: 'desc' }]

  try {
    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: { vacancy: { select: { title: true, company: true } } },
        orderBy,
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
