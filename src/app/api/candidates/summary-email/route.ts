import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { logAiUsage } from '@/lib/ai-usage'
import { isDemoAccount } from '@/lib/demo-guard'

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
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }

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

      const prompt = `Generate a comprehensive, professional email summarizing ${shortlisted.length} shortlisted candidates for the ${vacancy.title} position. This email will be sent to the hiring manager, so make it thorough and actionable.

For EACH candidate include all of the following:
- Full name, email address, and phone number (if available)
- Match score with interpretation (use: 80%+ = Excellent, 65-79% = Good, 50-64% = Moderate, below 50% = Low)
- Top 3 strengths (as bullet points with brief explanation)
- Top 2 areas of concern (as bullet points with brief explanation)
- Key skills relevant to the role
- Recruiter notes / interview feedback (if available) — these may contain interview observations like "answered well on X" or "struggled with Y"
- Individual recommendation for this candidate

At the END of the email, include:
1. **Overall Comparison Summary** — a brief comparison table-style summary showing all candidates side by side (name, score, recommendation)
2. **Clear Recommendation** — who should be interviewed first and a clear explanation of why
3. **Suggested Interview Order** — rank all candidates in the order they should be interviewed, with brief justification
4. **Red Flags to Discuss** — any concerns or gaps across candidates that the hiring team should discuss before proceeding

Write in ${language}. Use a professional, thorough tone suitable for a hiring manager making final interview decisions. Aim for a complete, detailed report — do not cut corners.

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
  candidates: Array<{ firstName: string; lastName: string; email: string | null; matchScore: number | null; strengths: string | null; weaknesses?: string | null | undefined; notes?: string | null | undefined; skills?: string | null | undefined; recommendation: string | null }>,
  vacancyTitle: string,
  language: string,
): string {
  const recLabel = (r: string | null) => {
    if (r === 'strong_yes') return 'Strongly Recommended'
    if (r === 'yes') return 'Recommended'
    if (r === 'maybe') return 'Consider with Reservations'
    return 'Not Recommended'
  }

  const scoreInterpretation = (score: number | null) => {
    if (!score) return 'N/A'
    if (score >= 80) return 'Excellent'
    if (score >= 65) return 'Good'
    if (score >= 50) return 'Moderate'
    return 'Low'
  }

  const parseJson = (s: string | null) => {
    if (!s) return []
    try { return JSON.parse(s) } catch { return [] }
  }

  const header = `Dear Hiring Manager,\n\nPlease find below a comprehensive summary of the ${candidates.length} shortlisted candidate(s) for the ${vacancyTitle} position. This report includes individual assessments and an overall recommendation to assist you in making interview decisions.\n`

  const lines = candidates.map((c, i) => {
    const strengths = parseJson(c.strengths).slice(0, 3).map((s: string) => `  + ${s}`).join('\n') || '  See full profile'
    const weaknesses = parseJson(c.weaknesses || null).slice(0, 2).map((s: string) => `  - ${s}`).join('\n')
    const skillsList = c.skills ? `\n   Key Skills: ${c.skills.slice(0, 200)}` : ''
    const contactInfo = c.email ? `\n   Email: ${c.email}` : ''
    let entry = `${i + 1}. ${c.firstName} ${c.lastName}${contactInfo}\n   Match Score: ${c.matchScore?.toFixed(0) || 'N/A'}% (${scoreInterpretation(c.matchScore)})\n   Recommendation: ${recLabel(c.recommendation)}${skillsList}\n\n   Top Strengths:\n${strengths}`
    if (weaknesses) entry += `\n\n   Areas of Concern:\n${weaknesses}`
    if (c.notes) entry += `\n\n   Recruiter Notes / Interview Feedback:\n   ${c.notes.slice(0, 300)}`
    entry += `\n\n   Individual Recommendation: ${recLabel(c.recommendation)} — ${c.matchScore && c.matchScore >= 70 ? 'Strong candidate for interview round.' : c.matchScore && c.matchScore >= 50 ? 'Worth considering; explore gaps during interview.' : 'Review carefully before proceeding.'}`
    return entry
  })

  // Overall comparison summary
  const comparisonHeader = `\n${'='.repeat(60)}\nOVERALL COMPARISON SUMMARY\n${'='.repeat(60)}\n`
  const comparisonLines = candidates.map((c, i) =>
    `  ${i + 1}. ${c.firstName} ${c.lastName} — ${c.matchScore?.toFixed(0) || 'N/A'}% (${scoreInterpretation(c.matchScore)}) — ${recLabel(c.recommendation)}`
  ).join('\n')

  // Interview order
  const sorted = [...candidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  const interviewOrder = `\nSUGGESTED INTERVIEW ORDER:\n` + sorted.map((c, i) =>
    `  ${i + 1}. ${c.firstName} ${c.lastName} (${c.matchScore?.toFixed(0) || 'N/A'}%) — ${i === 0 ? 'Highest match; prioritize first.' : `Strong profile; schedule after top candidate${i > 1 ? 's' : ''}.`}`
  ).join('\n')

  // Red flags
  const lowScoreCandidates = candidates.filter(c => c.matchScore && c.matchScore < 50)
  const redFlags = lowScoreCandidates.length > 0
    ? `\nRED FLAGS TO DISCUSS:\n${lowScoreCandidates.map(c => `  ! ${c.firstName} ${c.lastName} scored below 50% — review whether their profile warrants an interview given the gap.`).join('\n')}`
    : `\nRED FLAGS TO DISCUSS:\n  No major red flags identified among shortlisted candidates.`

  const topCandidate = sorted[0]
  const recommendation = `\nCLEAR RECOMMENDATION:\nWe recommend prioritizing ${topCandidate.firstName} ${topCandidate.lastName} (${topCandidate.matchScore?.toFixed(0) || 'N/A'}% match — ${scoreInterpretation(topCandidate.matchScore)}) for the first interview. ${sorted.length > 1 ? `${sorted[1].firstName} ${sorted[1].lastName} should be scheduled as the second interview.` : ''} This ordering is based on overall match score, strengths alignment, and fewer areas of concern.`

  const footer = `\n\nBest regards,\nDeltaMatch`

  return `${header}\n${lines.join('\n\n---\n\n')}\n${comparisonHeader}${comparisonLines}\n${recommendation}\n${interviewOrder}\n${redFlags}\n${footer}`
}
