import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const isDemoMode = () => !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.trim() === ''

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { candidateId, type } = await req.json()
  if (!candidateId || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const userId = (session.user as any).id
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId },
    include: { vacancy: true },
  })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const recruiterName = session.user.name || 'Le recruteur'
  const company = (session.user as any).company || candidate.vacancy?.company || 'notre entreprise'
  const skills = (() => { try { return JSON.parse(candidate.skills || '[]').slice(0, 5).join(', ') } catch { return '' } })()
  const strengths = (() => { try { return JSON.parse(candidate.strengths || '[]').slice(0, 3).join('. ') } catch { return '' } })()
  const weaknesses = (() => { try { return JSON.parse(candidate.weaknesses || '[]').slice(0, 2).join('. ') } catch { return '' } })()

  if (isDemoMode()) {
    const demos: Record<string, { subject: string; body: string }> = {
      interview: {
        subject: `Invitation à un entretien — ${candidate.vacancy?.title || 'Poste'}`,
        body: `Bonjour ${candidate.firstName},\n\nNous avons bien pris connaissance de votre candidature pour le poste de ${candidate.vacancy?.title || 'le poste'} chez ${company} et nous sommes ravis de vous informer qu'elle a retenu toute notre attention.\n\nNous souhaiterions vous inviter à un entretien afin d'échanger plus en détail sur votre parcours et sur cette opportunité. Merci de nous faire part de vos disponibilités dans les prochains jours.\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\n${recruiterName}\n${company}`,
      },
      rejection: {
        subject: `Suite de votre candidature — ${candidate.vacancy?.title || 'Poste'}`,
        body: `Bonjour ${candidate.firstName},\n\nNous vous remercions de l'intérêt que vous portez à notre offre et du temps que vous avez consacré à votre candidature pour le poste de ${candidate.vacancy?.title || 'le poste'} chez ${company}.\n\nAprès examen attentif de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue pour la suite du processus. Ce choix difficile résulte d'une forte compétition entre des profils de qualité.\n\nNous vous souhaitons plein succès dans vos recherches et espérons avoir l'occasion de nous recroiser lors de futures opportunités.\n\nCordialement,\n${recruiterName}\n${company}`,
      },
      followup: {
        subject: `Suivi de votre candidature — ${candidate.vacancy?.title || 'Poste'}`,
        body: `Bonjour ${candidate.firstName},\n\nNous souhaitons vous informer que votre candidature pour le poste de ${candidate.vacancy?.title || 'le poste'} chez ${company} est actuellement en cours d'examen.\n\nNous reviendrons vers vous dans les meilleurs délais avec une réponse définitive. Nous vous remercions de votre patience.\n\nCordialement,\n${recruiterName}\n${company}`,
      },
    }
    return NextResponse.json(demos[type] || demos.interview)
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompts: Record<string, string> = {
    interview: `Write a warm, professional recruitment email in French inviting ${candidate.firstName} ${candidate.lastName} to an interview for the position of "${candidate.vacancy?.title || 'le poste'}" at ${company}.

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Be warm and enthusiastic but professional
2. Invite them to an interview and ask for their availability
3. Be 120-160 words max
4. Do NOT mention any score, rating, ranking, or percentage
5. Do NOT mention specific strengths, weaknesses, or skills

Return JSON: {"subject": "...", "body": "..."}`,
    rejection: `Write a professional, empathetic rejection email in French to ${candidate.firstName} ${candidate.lastName} who applied for "${candidate.vacancy?.title || 'le poste'}" at ${company}.

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Thank them sincerely for their time and interest
2. Inform them politely that their application was not selected
3. Wish them success in their search
4. Be 120-160 words max, empathetic tone
5. Do NOT mention any score, rating, ranking, or percentage
6. Do NOT mention specific strengths, weaknesses, or skills

Return JSON: {"subject": "...", "body": "..."}`,
    followup: `Write a professional follow-up email in French to ${candidate.firstName} ${candidate.lastName} who applied for "${candidate.vacancy?.title || 'le poste'}" at ${company}, informing them their application is still under review.

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Acknowledge their application is being reviewed
2. Thank them for their patience
3. Give a positive, encouraging tone
4. Be 80-120 words max
5. Do NOT mention any score, rating, ranking, or percentage

Return JSON: {"subject": "...", "body": "..."}`,
  }
  const prompt = prompts[type] || prompts.interview

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content.find(b => b.type === 'text')?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json(parsed)
    }
    return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
