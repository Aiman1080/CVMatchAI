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
      weaknesses: true,
      summary: true,
      recommendation: true,
      notes: true,
      skills: true,
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

      const candidateList = shortlisted.map((c, i) => {
        let info = `${i + 1}. ${c.firstName} ${c.lastName} — Match score: ${c.matchScore?.toFixed(0) || 'N/A'}%`
        info += `\n   Summary: ${c.summary?.slice(0, 200) || 'N/A'}`
        info += `\n   Strengths: ${c.strengths?.slice(0, 200) || 'N/A'}`
        info += `\n   Weaknesses: ${c.weaknesses?.slice(0, 200) || 'N/A'}`
        info += `\n   Skills: ${c.skills?.slice(0, 150) || 'N/A'}`
        info += `\n   Recommendation: ${c.recommendation || 'N/A'}`
        if (c.notes) info += `\n   Recruiter notes: ${c.notes.slice(0, 300)}`
        return info
      }).join('\n\n')

      const prompt = `Generate a professional email summarizing ${shortlisted.length} shortlisted candidates for the ${vacancy.title} position.

For each candidate include:
- Name and match score
- Key strengths and weaknesses
- Skills overview
- Recruiter's notes (if available) — these may contain interview feedback like "answered well on X" or "struggled with Y"
- Final recommendation

At the end, provide a clear overall recommendation on who to interview first and why.

Write in ${language}. Use a professional, concise tone suitable for a hiring manager.

CANDIDATES:
${candidateList}

Write only the email body (no subject line).`

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
  candidates: Array<{ firstName: string; lastName: string; matchScore: number | null; strengths: string | null; weaknesses?: string | null | undefined; notes?: string | null | undefined; skills?: string | null | undefined; recommendation: string | null }>,
  vacancyTitle: string,
  language: string,
): string {
  const recLabel = (r: string | null) => {
    if (r === 'strong_yes') return 'Strongly Recommended'
    if (r === 'yes') return 'Recommended'
    if (r === 'maybe') return 'Consider with Reservations'
    return 'Not Recommended'
  }

  const parseJson = (s: string | null) => {
    if (!s) return []
    try { return JSON.parse(s) } catch { return [] }
  }

  const header = `Dear Hiring Manager,\n\nPlease find below a summary of the ${candidates.length} shortlisted candidate(s) for the ${vacancyTitle} position.\n`

  const lines = candidates.map((c, i) => {
    const strengths = parseJson(c.strengths).slice(0, 3).map((s: string) => `  + ${s}`).join('\n') || '  See full profile'
    const weaknesses = parseJson(c.weaknesses || null).slice(0, 2).map((s: string) => `  - ${s}`).join('\n')
    let entry = `${i + 1}. ${c.firstName} ${c.lastName}\n   Match Score: ${c.matchScore?.toFixed(0) || 'N/A'}%\n   Recommendation: ${recLabel(c.recommendation)}\n   Strengths:\n${strengths}`
    if (weaknesses) entry += `\n   Areas of concern:\n${weaknesses}`
    if (c.notes) entry += `\n   Recruiter notes: ${c.notes.slice(0, 200)}`
    return entry
  })

  const topCandidate = candidates[0]
  const footer = `\nBased on the analysis, we recommend prioritizing ${topCandidate.firstName} ${topCandidate.lastName} (${topCandidate.matchScore?.toFixed(0) || 'N/A'}% match) for the first interview round.\n\nBest regards,\nCVMatch AI`

  return `${header}\n${lines.join('\n\n')}\n${footer}`
}
