import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logAiUsage } from '@/lib/ai-usage'

const isDemoMode = () =>
  !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === ''

const LOCALE_LANGUAGE: Record<string, string> = {
  en: 'English',
  nl: 'Dutch',
  fr: 'French',
  de: 'German',
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const { vacancyId, recipientEmail, locale } = await req.json()
  if (!vacancyId || !recipientEmail)
    return NextResponse.json({ error: 'vacancyId and recipientEmail are required' }, { status: 400 })

  const vacancy = await prisma.vacancy.findFirst({
    where: { id: vacancyId, userId },
  })
  if (!vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 })

  const shortlisted = await prisma.candidate.findMany({
    where: { vacancyId, userId, status: 'shortlisted' },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      matchScore: true,
      strengths: true,
      summary: true,
      recommendation: true,
    },
    orderBy: { matchScore: 'desc' },
  })

  if (shortlisted.length === 0)
    return NextResponse.json({ error: 'No shortlisted candidates' }, { status: 400 })

  const language = LOCALE_LANGUAGE[locale || vacancy.language] || 'English'
  let emailBody: string

  if (!isDemoMode()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { temperature: 0.3 },
      })

      const candidateList = shortlisted.map((c, i) =>
        `${i + 1}. ${c.firstName} ${c.lastName} — Match score: ${c.matchScore?.toFixed(0) || 'N/A'}%\n   Summary: ${c.summary?.slice(0, 200) || 'N/A'}\n   Strengths: ${c.strengths?.slice(0, 200) || 'N/A'}\n   Recommendation: ${c.recommendation || 'N/A'}`
      ).join('\n\n')

      const prompt = `Generate a professional email summarizing ${shortlisted.length} shortlisted candidates for the ${vacancy.title} position. For each candidate include: name, match score, key strengths, recommendation. End with a clear recommendation on who to interview first. Write in ${language}.

CANDIDATES:
${candidateList}

Write only the email body (no subject line). Use a professional, concise tone suitable for a hiring manager.`

      const result = await model.generateContent(prompt)
      const usage = result.response.usageMetadata
      logAiUsage(userId, 'summary_email', usage?.promptTokenCount || 0, usage?.candidatesTokenCount || 0).catch(() => {})
      emailBody = result.response.text()
    } catch (error) {
      console.error('[AI] Summary email generation error:', error)
      emailBody = generateTemplateSummary(shortlisted, vacancy.title, language)
    }
  } else {
    emailBody = generateTemplateSummary(shortlisted, vacancy.title, language)
  }

  try {
    const subject = `Candidate Summary — ${vacancy.title}`
    await sendEmail(recipientEmail, subject, emailBody)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Email] Summary send error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
  }
}

function generateTemplateSummary(
  candidates: Array<{ firstName: string; lastName: string; matchScore: number | null; strengths: string | null; recommendation: string | null }>,
  vacancyTitle: string,
  language: string,
): string {
  const recLabel = (r: string | null) => {
    if (r === 'strong_yes') return 'Strongly Recommended'
    if (r === 'yes') return 'Recommended'
    if (r === 'maybe') return 'Consider with Reservations'
    return 'Not Recommended'
  }

  const header = `Dear Hiring Manager,\n\nPlease find below a summary of the ${candidates.length} shortlisted candidate(s) for the ${vacancyTitle} position.\n`

  const lines = candidates.map((c, i) => {
    const strengths = c.strengths
      ? JSON.parse(c.strengths).slice(0, 3).map((s: string) => `  - ${s}`).join('\n')
      : '  - See full profile for details'
    return `${i + 1}. ${c.firstName} ${c.lastName}\n   Match Score: ${c.matchScore?.toFixed(0) || 'N/A'}%\n   Recommendation: ${recLabel(c.recommendation)}\n   Key Strengths:\n${strengths}`
  })

  const topCandidate = candidates[0]
  const footer = `\nBased on the analysis, we recommend prioritizing ${topCandidate.firstName} ${topCandidate.lastName} (${topCandidate.matchScore?.toFixed(0) || 'N/A'}% match) for the first interview round.\n\nBest regards,\nCVMatch AI`

  return `${header}\n${lines.join('\n\n')}\n${footer}`
}
