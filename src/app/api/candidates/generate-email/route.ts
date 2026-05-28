import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'

const isDemoMode = () => !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === ''

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }

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
        interview: { subject: `Interview Invitation — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nThank you sincerely for submitting your application for the ${vacancyTitle} position at ${company}. We truly appreciate the time and effort you invested in presenting your qualifications to us.\n\nAfter carefully reviewing your profile, we were particularly impressed by your professional background and the relevant experience you bring to this role. Your skills and career trajectory align well with what we are looking for, and we would love the opportunity to learn more about you in person.\n\nWe are delighted to invite you for an interview to discuss your experience, aspirations, and how you could contribute to our team. Could you please share your availability over the coming week so that we can schedule a convenient time? The interview will last approximately 45-60 minutes and can be conducted either at our office or via video call, whichever you prefer.\n\nAt ${company}, we pride ourselves on fostering a collaborative and innovative work environment where every team member has the opportunity to grow and make a meaningful impact. We believe you could be a great addition to our team.\n\nWe look forward to meeting you and exploring this opportunity together.\n\nWarm regards,\n${recruiterName}\n${company}` },
        rejection: { subject: `Your Application — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nThank you sincerely for your interest in the ${vacancyTitle} position at ${company} and for the time you dedicated to your application. We genuinely appreciate the effort you put into presenting your background and qualifications.\n\nWe were impressed by several aspects of your profile, particularly your professional experience and the skills you have developed throughout your career. Your application stood out among many that we received, which made our decision all the more difficult.\n\nAfter thorough deliberation, we have decided to move forward with a candidate whose profile more closely matches the very specific technical requirements for this particular role. Please know that this decision does not diminish the value of your experience and accomplishments.\n\nWe sincerely encourage you to keep an eye on our future openings, as we would welcome the opportunity to consider your profile for other positions that may be an even better fit. Our team is growing, and new opportunities arise regularly.\n\nWe wish you every success in your career journey and have no doubt that you will find an excellent opportunity that matches your talent.\n\nWith kind regards,\n${recruiterName}\n${company}` },
        followup: { subject: `Update — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nI wanted to reach out with a quick update regarding your application for the ${vacancyTitle} position at ${company}. Thank you again for your continued interest and patience throughout our selection process.\n\nYour application is currently under active review by our hiring team. We anticipate completing this stage within the next 5-7 business days, after which we will be in touch with a definitive update on the next steps.\n\nPlease rest assured that your profile remains under careful consideration. Should you have any questions in the meantime, do not hesitate to contact us directly at this email address.\n\nThank you for your patience, and we will be in touch soon.\n\nKind regards,\n${recruiterName}\n${company}` },
      },
      nl: {
        interview: { subject: `Uitnodiging gesprek — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nHartelijk dank voor uw sollicitatie voor de functie ${vacancyTitle} bij ${company}. Wij waarderen de tijd en moeite die u in uw kandidatuur hebt gestoken enorm.\n\nNa zorgvuldige beoordeling van uw profiel waren wij bijzonder onder de indruk van uw professionele achtergrond en de relevante ervaring die u meebrengt. Uw vaardigheden sluiten goed aan bij wat wij zoeken, en wij zouden u graag beter leren kennen.\n\nWij nodigen u daarom van harte uit voor een sollicitatiegesprek om uw ervaring, ambities en mogelijke bijdrage aan ons team te bespreken. Kunt u ons uw beschikbaarheid voor de komende week laten weten? Het gesprek duurt ongeveer 45-60 minuten en kan op kantoor of via videocall plaatsvinden.\n\nBij ${company} hechten wij veel waarde aan een samenwerkingsgericht en innovatief werkklimaat waar ieder teamlid de kans krijgt om te groeien en impact te maken.\n\nWij kijken ernaar uit u te ontmoeten.\n\nMet hartelijke groeten,\n${recruiterName}\n${company}` },
        rejection: { subject: `Uw sollicitatie — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nHartelijk dank voor uw interesse in de functie ${vacancyTitle} bij ${company} en voor de tijd die u aan uw sollicitatie hebt besteed. Wij waarderen oprecht de moeite die u in uw kandidatuur hebt gestoken.\n\nMeerdere aspecten van uw profiel hebben indruk op ons gemaakt, met name uw professionele ervaring en de vaardigheden die u in uw loopbaan hebt opgebouwd. Uw sollicitatie viel positief op tussen de vele die wij hebben ontvangen.\n\nNa zorgvuldige afweging hebben wij besloten verder te gaan met een kandidaat wiens profiel nauwer aansluit bij de specifieke technische vereisten voor deze functie. Weet dat dit niets afdoet aan de waarde van uw ervaring.\n\nWij moedigen u aan om onze toekomstige vacatures in de gaten te houden. Ons team groeit en er ontstaan regelmatig nieuwe kansen.\n\nWij wensen u veel succes in uw verdere loopbaan.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}` },
        followup: { subject: `Stand van zaken — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nGraag informeer ik u over de voortgang van uw sollicitatie voor de functie ${vacancyTitle} bij ${company}. Nogmaals dank voor uw geduld gedurende ons selectieproces.\n\nUw kandidatuur wordt momenteel actief beoordeeld door ons team. Wij verwachten deze fase binnen 5-7 werkdagen af te ronden, waarna wij u een definitieve update zullen geven over de vervolgstappen.\n\nUw profiel wordt met zorg bekeken. Mocht u in de tussentijd vragen hebben, aarzel dan niet om contact met ons op te nemen via dit e-mailadres.\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}` },
      },
      fr: {
        interview: { subject: `Invitation entretien — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nNous vous remercions chaleureusement pour votre candidature au poste de ${vacancyTitle} chez ${company}. Nous apprécions sincèrement le temps et les efforts que vous avez consacrés à la présentation de votre parcours.\n\nAprès examen attentif de votre profil, nous avons été particulièrement impressionnés par votre expérience professionnelle et les compétences pertinentes que vous apportez. Votre parcours correspond bien à ce que nous recherchons, et nous aimerions avoir l'opportunité de mieux vous connaître.\n\nNous avons le plaisir de vous inviter à un entretien afin de discuter de votre expérience, de vos aspirations et de votre contribution potentielle à notre équipe. Pourriez-vous nous communiquer vos disponibilités pour la semaine à venir ? L'entretien durera environ 45-60 minutes et pourra se tenir dans nos locaux ou par visioconférence.\n\nChez ${company}, nous cultivons un environnement de travail collaboratif et innovant où chaque membre de l'équipe a l'opportunité de s'épanouir.\n\nNous nous réjouissons de vous rencontrer.\n\nCordialement,\n${recruiterName}\n${company}` },
        rejection: { subject: `Suite candidature — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nNous vous remercions sincèrement pour l'intérêt que vous avez porté au poste de ${vacancyTitle} chez ${company} et pour le temps consacré à votre candidature. Nous apprécions véritablement les efforts que vous avez investis.\n\nPlusieurs aspects de votre profil nous ont impressionnés, notamment votre expérience professionnelle et les compétences que vous avez développées au cours de votre parcours. Votre candidature s'est distinguée parmi les nombreuses que nous avons reçues.\n\nAprès mûre réflexion, nous avons décidé de poursuivre avec un candidat dont le profil correspond plus étroitement aux exigences techniques spécifiques de ce poste. Sachez que cette décision ne diminue en rien la valeur de votre expérience.\n\nNous vous encourageons vivement à suivre nos futures offres d'emploi. Notre équipe est en croissance et de nouvelles opportunités se présentent régulièrement.\n\nNous vous souhaitons beaucoup de succès dans votre parcours professionnel.\n\nCordialement,\n${recruiterName}\n${company}` },
        followup: { subject: `Suivi candidature — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nJe souhaitais vous informer de l'avancement de votre candidature pour le poste de ${vacancyTitle} chez ${company}. Merci encore pour votre patience tout au long de notre processus de sélection.\n\nVotre candidature est actuellement en cours d'examen actif par notre équipe de recrutement. Nous prévoyons de finaliser cette étape dans les 5 à 7 jours ouvrables à venir, après quoi nous vous contacterons avec une mise à jour définitive.\n\nSoyez assuré(e) que votre profil fait l'objet d'une attention particulière. N'hésitez pas à nous contacter directement si vous avez des questions.\n\nCordialement,\n${recruiterName}\n${company}` },
      },
    }
    const localeKey = ['en', 'nl', 'fr'].includes(locale) ? locale : 'fr'
    return NextResponse.json((demos[localeKey][type] || demos[localeKey].interview))
  }

  const wordCounts: Record<string, string> = {
    interview: '200-250 words',
    rejection: '180-220 words',
    followup: '150-180 words',
  }
  const wordCount = wordCounts[type] || '200-250 words'

  const typeInstructions: Record<string, string> = {
    interview: 'Include: a warm greeting, sincere appreciation for their application, a specific mention of what impressed you based on their CV/profile, a request for availability with interview logistics (duration, format options), a brief teaser about company culture, and a warm encouraging closing.',
    rejection: 'Include: sincere thanks for applying, acknowledge specific strengths you noticed in their profile, an honest but kind explanation for the decision, strong encouragement to apply for future roles at the company, and a genuine wish for success in their career.',
    followup: 'Include: a clear status update on where their application stands, a realistic timeline estimate for the next steps, reassurance that their profile is being carefully considered, and your contact information for any questions.',
  }
  const typeInstruction = typeInstructions[type] || typeInstructions.interview

  const prompt = `Write a professional, detailed recruitment email in ${langName} for ${candidate.firstName} ${candidate.lastName} regarding "${vacancyTitle}" at ${company}. Type: ${type}. Recruiter: ${recruiterName}. ${wordCount}. ${typeInstruction} Return JSON: {"subject":"...","body":"..."}`

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
      en: { subject: `${type === 'interview' ? 'Interview Invitation' : type === 'rejection' ? 'Application Update' : 'Follow-up'} — ${vacancyTitle}`, body: `Dear ${candidate.firstName},\n\nThank you for your application for the ${vacancyTitle} position at ${company}. We appreciate the time you invested in presenting your qualifications to us.\n\n${type === 'interview' ? `After reviewing your profile, we were impressed by your background and would like to invite you for an interview. Please let us know your availability for the coming week.\n\nWe look forward to meeting you.` : type === 'rejection' ? `After careful review, we have decided to proceed with another candidate whose profile more closely matches the specific requirements. We were impressed by your experience and encourage you to apply for future openings.\n\nWe wish you every success in your career.` : `Your application is currently under active review. We expect to provide you with an update within the next 5-7 business days. Please do not hesitate to reach out if you have any questions.`}\n\nKind regards,\n${recruiterName}\n${company}` },
      nl: { subject: `${type === 'interview' ? 'Uitnodiging' : type === 'rejection' ? 'Sollicitatie update' : 'Opvolging'} — ${vacancyTitle}`, body: `Beste ${candidate.firstName},\n\nHartelijk dank voor uw sollicitatie voor de functie ${vacancyTitle} bij ${company}. Wij waarderen de moeite die u in uw kandidatuur hebt gestoken.\n\n${type === 'interview' ? `Na beoordeling van uw profiel waren wij onder de indruk van uw achtergrond en nodigen u graag uit voor een gesprek. Gelieve ons uw beschikbaarheid voor de komende week mee te delen.\n\nWij kijken ernaar uit u te ontmoeten.` : type === 'rejection' ? `Na zorgvuldige afweging hebben wij besloten verder te gaan met een andere kandidaat. Uw ervaring heeft indruk op ons gemaakt en wij moedigen u aan om toekomstige vacatures te volgen.\n\nWij wensen u veel succes.` : `Uw kandidatuur wordt momenteel actief beoordeeld. Wij verwachten u binnen 5-7 werkdagen een update te kunnen geven. Aarzel niet om contact op te nemen bij vragen.`}\n\nMet vriendelijke groeten,\n${recruiterName}\n${company}` },
      fr: { subject: `${type === 'interview' ? 'Invitation entretien' : type === 'rejection' ? 'Suite candidature' : 'Suivi'} — ${vacancyTitle}`, body: `Bonjour ${candidate.firstName},\n\nMerci pour votre candidature au poste de ${vacancyTitle} chez ${company}. Nous apprécions le temps que vous avez consacré à votre dossier.\n\n${type === 'interview' ? `Après examen de votre profil, nous avons été impressionnés par votre parcours et souhaitons vous inviter à un entretien. Pourriez-vous nous communiquer vos disponibilités pour la semaine prochaine ?\n\nNous nous réjouissons de vous rencontrer.` : type === 'rejection' ? `Après mûre réflexion, nous avons décidé de poursuivre avec un autre candidat. Votre expérience nous a impressionnés et nous vous encourageons à postuler à nos futures offres.\n\nNous vous souhaitons beaucoup de succès.` : `Votre candidature est en cours d'examen actif. Nous prévoyons de vous donner une mise à jour dans les 5 à 7 jours ouvrables. N'hésitez pas à nous contacter pour toute question.`}\n\nCordialement,\n${recruiterName}\n${company}` },
    }
    return NextResponse.json(demos[localeKey])
  }
}
