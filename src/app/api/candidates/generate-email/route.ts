import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const isDemoMode = () => !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === ''

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { candidateId, type, locale = 'fr' } = body
  if (!candidateId || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const userId = (session.user as any).id
  let candidate: any
  try {
    candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, userId },
      include: { vacancy: true },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load candidate' }, { status: 500 })
  }
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const LANG_NAMES: Record<string, string> = { en: 'English', nl: 'Dutch', fr: 'French' }
  const langName = LANG_NAMES[locale] || 'French'

  const recruiterName = session.user.name || (locale === 'nl' ? 'De recruiter' : locale === 'en' ? 'The recruiter' : 'Le recruteur')
  const company = (session.user as any).company || candidate.vacancy?.company || (locale === 'nl' ? 'ons bedrijf' : locale === 'en' ? 'our company' : 'notre entreprise')
  const vacancyTitle = candidate.vacancy?.title || (locale === 'nl' ? 'de functie' : locale === 'en' ? 'the position' : 'le poste')

  if (isDemoMode()) {
    const demos: Record<string, Record<string, { subject: string; body: string }>> = {
      en: {
        interview: { subject: `Interview Invitation — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nThank you for applying for the ${vacancyTitle} position at ${company}. We were impressed by your application and would be delighted to invite you for an interview.\n\nPlease let us know your availability.\n\nKind regards,\n${recruiterName}\n${company}` },
        rejection: { subject: `Your Application — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nThank you for your interest in the ${vacancyTitle} position at ${company}.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe wish you every success.\n\nKind regards,\n${recruiterName}\n${company}` },
        followup: { subject: `Update — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nYour application for ${vacancyTitle} at ${company} is currently under review. We will be in touch shortly.\n\nKind regards,\n${recruiterName}\n${company}` },
      },
      nl: {
        interview: { subject: `Uitnodiging gesprek — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nBedankt voor uw sollicitatie voor ${vacancyTitle} bij ${company}. Wij nodigen u graag uit voor een gesprek.\n\nGelieve uw beschikbaarheid door te geven.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}` },
        rejection: { subject: `Uw sollicitatie — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nBedankt voor uw interesse in ${vacancyTitle} bij ${company}.\n\nHelaas moeten wij u meedelen dat uw kandidatuur niet weerhouden werd.\n\nVeel succes verder.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}` },
        followup: { subject: `Stand van zaken — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nUw sollicitatie voor ${vacancyTitle} bij ${company} wordt nog beoordeeld. Wij nemen binnenkort contact op.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}` },
      },
      fr: {
        interview: { subject: `Invitation entretien — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nNous avons pris connaissance de votre candidature pour le poste de ${vacancyTitle} chez ${company} et souhaitons vous inviter à un entretien.\n\nMerci de nous indiquer vos disponibilités.\n\nCordialement,\n${recruiterName}\n${company}` },
        rejection: { subject: `Suite candidature — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nNous vous remercions pour votre candidature au poste de ${vacancyTitle} chez ${company}.\n\nAprès examen, nous avons le regret de vous informer que votre candidature n'a pas été retenue.\n\nNous vous souhaitons plein succès.\n\nCordialement,\n${recruiterName}\n${company}` },
        followup: { subject: `Suivi candidature — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nVotre candidature pour ${vacancyTitle} chez ${company} est en cours d'examen. Nous reviendrons vers vous prochainement.\n\nCordialement,\n${recruiterName}\n${company}` },
      },
    }
    const localeKey = ['en', 'nl', 'fr'].includes(locale) ? locale : 'fr'
    return NextResponse.json((demos[localeKey][type] || demos[localeKey].interview))
  }

  const prompt = `Write a professional recruitment email in ${langName} for ${candidate.firstName} ${candidate.lastName} regarding "${vacancyTitle}" at ${company}. Type: ${type}. Recruiter: ${recruiterName}. 120-160 words max. Return JSON: {"subject":"...","body":"..."}`

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.3 } })
    const result = await model.generateContent(prompt)
    const text = result.response.text() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return NextResponse.json(JSON.parse(jsonMatch[0]))
      } catch {
        return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
      }
    }
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
  } catch (err: any) {
    console.error('[AI] Generate email error:', err.message)
    const localeKey = ['en', 'nl', 'fr'].includes(locale) ? locale : 'fr'
    const demos: Record<string, { subject: string; body: string }> = {
      en: { subject: `${type === 'interview' ? 'Interview Invitation' : type === 'rejection' ? 'Application Update' : 'Follow-up'} — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nThank you for your application for ${vacancyTitle} at ${company}.\n\nKind regards,\n${recruiterName}` },
      nl: { subject: `${type === 'interview' ? 'Uitnodiging' : type === 'rejection' ? 'Sollicitatie update' : 'Opvolging'} — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nBedankt voor uw sollicitatie voor ${vacancyTitle} bij ${company}.\n\nMet vriendelijke groeten,\n${recruiterName}` },
      fr: { subject: `${type === 'interview' ? 'Invitation entretien' : type === 'rejection' ? 'Suite candidature' : 'Suivi'} — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nMerci pour votre candidature pour ${vacancyTitle} chez ${company}.\n\nCordialement,\n${recruiterName}` },
    }
    return NextResponse.json(demos[localeKey])
  }
}
