import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInterviewQuestions } from '@/lib/ai'
import { getPlanLimits } from '@/lib/plans'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = (session.user as any)?.subscription || 'free'
  const limits = getPlanLimits(subscription)
  if (!limits.interviewQuestions) {
    return NextResponse.json({ error: 'Interview questions require Pro plan' }, { status: 403 })
  }

  const userId = (session.user as any).id
  const { candidateId } = await req.json()
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId },
    include: { vacancy: true },
  })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  if (!candidate.cvContent) return NextResponse.json({ error: 'No CV content available' }, { status: 400 })
  if (!candidate.vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 })

  const result = await generateInterviewQuestions(
    candidate.cvContent,
    candidate.vacancy.title,
    candidate.vacancy.description,
    candidate.vacancy.requirements,
    candidate.language || 'en',
  )

  return NextResponse.json(result)
}
