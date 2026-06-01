// Assess the recruiter-recorded interview answers for a candidate: returns a
// short AI verdict (how well they answered) without persisting anything.
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeInterviewAnswers } from '@/lib/ai'
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }
  const { id } = await params
  const userId = (session.user as any).id

  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
  const limits = getPlanLimits(getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null))
  if (!limits.interviewQuestions) {
    return NextResponse.json({ error: 'Interview features require a Pro plan', upgrade: true }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  // qa: [{ question, expectedAnswer?, answer }]
  const qa = Array.isArray(body?.qa) ? body.qa : []
  if (qa.length === 0) return NextResponse.json({ error: 'No questions/answers provided' }, { status: 400 })

  // Ownership check
  const candidate = await prisma.candidate.findFirst({
    where: { id, userId },
    select: { vacancy: { select: { title: true } } },
  })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const cookieLocale = (await cookies()).get('deltamatch-locale')?.value
  const outputLocale = ['en', 'nl', 'fr', 'de'].includes(cookieLocale || '') ? cookieLocale : 'fr'

  const assessment = await analyzeInterviewAnswers(
    qa.map((x: any) => ({ question: String(x.question || ''), expectedAnswer: x.expectedAnswer ? String(x.expectedAnswer) : undefined, answer: String(x.answer || '') })),
    candidate.vacancy?.title || 'the position',
    outputLocale,
  )
  return NextResponse.json(assessment)
}
