import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateHiringReport } from '@/lib/ai'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { candidateId } = await req.json()
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId },
    include: { vacancy: true },
  })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  if (!candidate.vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 })

  const result = await generateHiringReport(
    {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email || undefined,
      phone: candidate.phone || undefined,
      matchScore: candidate.matchScore || 0,
      summary: candidate.summary || '',
      strengths: candidate.strengths || '',
      weaknesses: candidate.weaknesses || '',
      skills: candidate.skills || '',
      experience: candidate.experience || '',
      education: candidate.education || '',
      recommendation: candidate.recommendation || 'maybe',
    },
    candidate.vacancy.title,
    candidate.vacancy.description,
    candidate.language || 'en',
  )

  return NextResponse.json(result)
}
