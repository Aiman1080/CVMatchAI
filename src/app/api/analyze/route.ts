import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeCVAgainstVacancy } from '@/lib/ai'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { candidateId } = await req.json()
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { vacancy: true } })
  if (!candidate || !candidate.cvContent) return NextResponse.json({ error: 'Candidate or CV not found' }, { status: 404 })
  const analysis = await analyzeCVAgainstVacancy(candidate.cvContent, candidate.vacancy.title, candidate.vacancy.description, candidate.vacancy.requirements, candidate.motivationText || undefined)
  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      matchScore: analysis.matchScore, summary: analysis.summary,
      strengths: JSON.stringify(analysis.strengths), weaknesses: JSON.stringify(analysis.weaknesses),
      skills: JSON.stringify(analysis.skills), experience: analysis.experience,
      education: analysis.education, recommendation: analysis.recommendation, analyzedAt: new Date(),
    },
  })
  return NextResponse.json({ success: true, candidate: updated, analysis })
}
