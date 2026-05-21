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
      positive: {
        subject: `Invitation à un entretien — ${candidate.vacancy?.title || 'Poste'}`,
        body: `Bonjour ${candidate.firstName},\n\nNous avons examiné votre candidature pour le poste de ${candidate.vacancy?.title} chez ${company} et nous sommes ravis de vous informer qu'elle a retenu toute notre attention.\n\nVotre profil présente des atouts remarquables, notamment : ${strengths || 'une expérience solide et des compétences techniques pertinentes'}. Votre score de correspondance de ${candidate.matchScore ? Math.round(candidate.matchScore) : '—'}% confirme votre adéquation avec nos besoins.\n\nNous souhaiterions vous inviter à un entretien pour approfondir votre candidature. Merci de nous faire part de vos disponibilités dans les prochains jours.\n\nCordialement,\n${recruiterName}\n${company}`,
      },
      negative: {
        subject: `Suite de votre candidature — ${candidate.vacancy?.title || 'Poste'}`,
        body: `Bonjour ${candidate.firstName},\n\nNous vous remercions de l'intérêt que vous portez à notre offre de ${candidate.vacancy?.title} chez ${company} et du temps que vous avez consacré à votre candidature.\n\nAprès examen attentif de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue. Ce choix difficile résulte d'une forte compétition et de profils correspondant plus précisément à nos besoins actuels, notamment en ce qui concerne ${weaknesses || 'certaines compétences spécifiques requises'}.\n\nVotre parcours et vos compétences en ${skills || 'votre domaine'} sont néanmoins appréciables, et nous ne manquerons pas de garder votre candidature à l'esprit pour de futures opportunités.\n\nNous vous souhaitons plein succès dans vos recherches.\n\nCordialement,\n${recruiterName}\n${company}`,
      },
    }
    return NextResponse.json(demos[type] || demos.positive)
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = type === 'positive'
    ? `Write a warm, professional recruitment email in French inviting ${candidate.firstName} ${candidate.lastName} to an interview for the position of "${candidate.vacancy?.title}" at ${company}.

Candidate details:
- Match score: ${candidate.matchScore ? Math.round(candidate.matchScore) + '%' : 'N/A'}
- Key strengths: ${strengths || 'strong profile'}
- Skills: ${skills || 'various'}
- Summary: ${candidate.summary || ''}

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Be warm and enthusiastic but professional
2. Specifically mention 2-3 of their actual strengths from the data above
3. Mention their match score if above 70%
4. Ask for their availability for an interview
5. Be 150-200 words max

Return JSON: {"subject": "...", "body": "..."}`
    : `Write a professional, empathetic rejection email in French to ${candidate.firstName} ${candidate.lastName} who applied for "${candidate.vacancy?.title}" at ${company}.

Candidate details:
- Match score: ${candidate.matchScore ? Math.round(candidate.matchScore) + '%' : 'N/A'}
- Skills they had: ${skills || 'various'}
- Summary: ${candidate.summary || ''}
- Gap/weaknesses: ${weaknesses || 'profile mismatch'}

Recruiter name: ${recruiterName}
Company: ${company}

The email should:
1. Thank them genuinely for their time and interest
2. Gently explain the decision was competitive (without being harsh)
3. Mention something positive about their profile (use their actual skills)
4. Leave the door open for future opportunities
5. Be 150-200 words max, empathetic tone

Return JSON: {"subject": "...", "body": "..."}`

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
