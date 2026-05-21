// Re-analysis endpoint — re-runs the full AI scoring on an existing candidate.
// Called from the candidate detail page when the recruiter wants a fresh assessment
// after editing the vacancy requirements or uploading additional documents.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeCVAgainstVacancy } from '@/lib/ai'

// Re-runs AI analysis on an existing candidate — useful after editing vacancy requirements
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { candidateId } = await req.json()

  // Include vacancy so we have the title/description/requirements for the AI prompt
  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }, include: { vacancy: true } })
  if (!candidate || !candidate.cvContent) return NextResponse.json({ error: 'Candidate or CV not found' }, { status: 404 })

  const analysis = await analyzeCVAgainstVacancy(
    candidate.cvContent,
    candidate.vacancy.title,
    candidate.vacancy.description,
    candidate.vacancy.requirements,
    candidate.motivationText || undefined,
  )

  // Persist all analysis fields — strengths/weaknesses/skills stored as JSON strings due to SQLite
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
