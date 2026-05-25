import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const isDemoMode = () => !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === ''

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
        interview: {
          subject: `Interview Invitation — ${vacancyTitle}`,
          body: `Dear ${candidate.firstName},\n\nThank you for applying for the ${vacancyTitle} position at ${company}. We were impressed by your application and would be delighted to invite you for an interview.\n\nPlease let us know your availability over the coming days so we can schedule a time that works for you.\n\nWe look forward to meeting you.\n\nKind regards,\n${recruiterName}\n${company}`,
        },
        rejection: {
          subject: `Your Application — ${vacancyTitle}`,
          body: `Dear ${candidate.firstName},\n\nThank you for your interest in the ${vacancyTitle} position at ${company} and for the time you invested in your application.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time. This was a difficult decision given the high calibre of candidates we received.\n\nWe wish you every success in your job search.\n\nKind regards,\n${recruiterName}\n${company}`,
        },
        followup: {
          subject: `Update on Your Application — ${vacancyTitle}`,
          body: `Dear ${candidate.firstName},\n\nWe wanted to reach out regarding your application for the ${vacancyTitle} position at ${company}. Your application is currently under review and we appreciate your patience.\n\nWe will be in touch shortly with a final decision.\n\nKind regards,\n${recruiterName}\n${company}`,
        },
      },
      nl: {
        interview: {
          subject: `Uitnodiging voor een gesprek — ${vacancyTitle}`,
          body: `Beste ${candidate.firstName},\n\nBedankt voor uw sollicitatie naar de functie van ${vacancyTitle} bij ${company}. Uw kandidatuur heeft onze aandacht gewekt en wij nodigen u graag uit voor een gesprek.\n\nGelieve uw beschikbaarheid de komende dagen door te geven, zodat wij een gepast moment kunnen inplannen.\n\nWij kijken ernaar uit u te ontmoeten.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}`,
        },
        rejection: {
          subject: `Uw sollicitatie — ${vacancyTitle}`,
          body: `Beste ${candidate.firstName},\n\nBedankt voor uw interesse in de functie van ${vacancyTitle} bij ${company} en voor de tijd die u in uw sollicitatie heeft geïnvesteerd.\n\nNa zorgvuldige overweging moeten wij u helaas meedelen dat wij uw kandidatuur niet zullen weerhouden. Deze beslissing was moeilijk gezien het hoge niveau van de kandidaten.\n\nWij wensen u veel succes bij uw verdere zoektocht.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}`,
        },
        followup: {
          subject: `Stand van zaken — ${vacancyTitle}`,
          body: `Beste ${candidate.firstName},\n\nWij contacteren u in verband met uw sollicitatie voor de functie van ${vacancyTitle} bij ${company}. Uw dossier wordt momenteel nog beoordeeld en wij danken u voor uw geduld.\n\nWij nemen binnenkort contact met u op met een definitief antwoord.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}`,
        },
      },
      fr: {
        interview: {
          subject: `Invitation à un entretien — ${vacancyTitle}`,
          body: `Bonjour ${candidate.firstName},\n\nNous avons bien pris connaissance de votre candidature pour le poste de ${vacancyTitle} chez ${company} et nous sommes ravis de vous informer qu'elle a retenu toute notre attention.\n\nNous souhaiterions vous inviter à un entretien afin d'échanger plus en détail sur votre parcours et sur cette opportunité. Merci de nous faire part de vos disponibilités dans les prochains jours.\n\nCordialement,\n${recruiterName}\n${company}`,
        },
        rejection: {
          subject: `Suite de votre candidature — ${vacancyTitle}`,
          body: `Bonjour ${candidate.firstName},\n\nNous vous remercions de l'intérêt que vous portez à notre offre et du temps que vous avez consacré à votre candidature pour le poste de ${vacancyTitle} chez ${company}.\n\nAprès examen attentif de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue. Nous vous souhaitons plein succès dans vos recherches.\n\nCordialement,\n${recruiterName}\n${company}`,
        },
        followup: {
          subject: `Suivi de votre candidature — ${vacancyTitle}`,
          body: `Bonjour ${candidate.firstName},\n\nNous souhaitons vous informer que votre candidature pour le poste de ${vacancyTitle} chez ${company} est actuellement en cours d'examen.\n\nNous reviendrons vers vous dans les meilleurs délais. Nous vous remercions de votre patience.\n\nCordialement,\n${recruiterName}\n${company}`,
        },
      },
    }
    const localeKey = ['en', 'nl', 'fr'].includes(locale) ? locale : 'fr'
    return NextResponse.json((demos[localeKey][type] || demos[localeKey].interview))
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompts: Record<string, string> = {
    interview: `Write a warm, professional recruitment email in ${langName} inviting ${candidate.firstName} ${candidate.lastName} to an interview for the position of "${vacancyTitle}" at ${company}.

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Be warm and enthusiastic but professional
2. Invite them to an interview and ask for their availability
3. Be 120-160 words max
4. Do NOT mention any score, rating, ranking, or percentage
5. Do NOT mention specific strengths, weaknesses, or skills
6. Write entirely in ${langName}

Return JSON: {"subject": "...", "body": "..."}`,
    rejection: `Write a professional, empathetic rejection email in ${langName} to ${candidate.firstName} ${candidate.lastName} who applied for "${vacancyTitle}" at ${company}.

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Thank them sincerely for their time and interest
2. Inform them politely that their application was not selected
3. Wish them success in their search
4. Be 120-160 words max, empathetic tone
5. Do NOT mention any score, rating, ranking, or percentage
6. Write entirely in ${langName}

Return JSON: {"subject": "...", "body": "..."}`,
    followup: `Write a professional follow-up email in ${langName} to ${candidate.firstName} ${candidate.lastName} who applied for "${vacancyTitle}" at ${company}, informing them their application is still under review.

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Acknowledge their application is being reviewed
2. Thank them for their patience
3. Give a positive, encouraging tone
4. Be 80-120 words max
5. Write entirely in ${langName}

Return JSON: {"subject": "...", "body": "..."}`,
  }
  const prompt = prompts[type] || prompts.interview

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content.find(b => b.type === 'text')?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
      }
    }
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
