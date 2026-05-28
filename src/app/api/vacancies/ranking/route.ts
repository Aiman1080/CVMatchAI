import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { rankCandidates } from '@/lib/ai'
import { getPlanLimits } from '@/lib/plans'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }

  const subscription = (session.user as any)?.subscription || 'free'
  const limits = getPlanLimits(subscription)
  if (!limits.candidateRanking) {
    return NextResponse.json({ error: 'Candidate ranking requires Pro plan' }, { status: 403 })
  }

  const userId = (session.user as any).id
  const { vacancyId } = await req.json()
  if (!vacancyId) return NextResponse.json({ error: 'vacancyId required' }, { status: 400 })

  const vacancy = await prisma.vacancy.findFirst({
    where: { id: vacancyId, userId },
  })
  if (!vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 })

  const candidates = await prisma.candidate.findMany({
    where: { vacancyId, userId },
    select: {
      id: true, firstName: true, lastName: true, matchScore: true,
      summary: true, strengths: true, weaknesses: true, skills: true, experience: true,
    },
  })

  if (candidates.length < 2) return NextResponse.json({ error: 'Need at least 2 candidates to rank' }, { status: 400 })

  const result = await rankCandidates(
    candidates.map(c => ({
      ...c,
      matchScore: c.matchScore || 0,
      summary: c.summary || '',
      strengths: c.strengths || '',
      weaknesses: c.weaknesses || '',
      skills: c.skills || '',
      experience: c.experience || '',
    })),
    vacancy.title,
    vacancy.description,
    vacancy.requirements,
  )

  return NextResponse.json(result)
}
