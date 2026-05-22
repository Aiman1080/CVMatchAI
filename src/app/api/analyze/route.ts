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
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { candidateId } = body
  if (!candidateId) return NextResponse.json({ error: 'candidateId required' }, { status: 400 })
  const userId = (session.user as any).id

  // findFirst with userId scoping prevents IDOR — users can only re-analyze their own candidates
  const candidate = await prisma.candidate.findFirst({ where: { id: candidateId, userId }, include: { vacancy: true } })
  if (!candidate || !candidate.cvContent) return NextResponse.json({ error: 'Candidate or CV not found' }, { status: 404 })

  const analysis = await analyzeCVAgainstVacancy(
    candidate.cvContent,
    candidate.vacancy?.title ?? 'Open position',
    candidate.vacancy?.description ?? '',
    candidate.vacancy?.requirements ?? '',
    candidate.motivationText || undefined,
  )

  // Persist all analysis fields — strengths/weaknesses/skills stored as JSON strings due to SQLite
  // Also update contact fields extracted from the CV (only overwrite if currently unknown/empty)
  const contactPatch: any = {}
  if (analysis.firstName && candidate.firstName === 'Unknown') contactPatch.firstName = analysis.firstName
  if (analysis.lastName && candidate.lastName === 'Candidate') contactPatch.lastName = analysis.lastName
  if (analysis.email && !candidate.email) contactPatch.email = analysis.email
  if (analysis.phone && !candidate.phone) contactPatch.phone = analysis.phone
  if (analysis.language) contactPatch.language = analysis.language

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      matchScore: analysis.matchScore, summary: analysis.summary,
      strengths: JSON.stringify(analysis.strengths), weaknesses: JSON.stringify(analysis.weaknesses),
      skills: JSON.stringify(analysis.skills), experience: analysis.experience,
      education: analysis.education, recommendation: analysis.recommendation, analyzedAt: new Date(),
      ...contactPatch,
    },
  })
  return NextResponse.json({ success: true, candidate: updated, analysis })
}
