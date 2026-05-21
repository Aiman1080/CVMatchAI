import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseDocument } from '@/lib/pdf-parser'
import { analyzeCVAgainstVacancy, classifyRecruitmentEmail, detectDocumentType } from '@/lib/ai'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  const { inboxId } = await req.json()

  const inbox = await prisma.emailInbox.findFirst({ where: { id: inboxId, userId } })
  if (!inbox) return NextResponse.json({ error: 'Inbox not found' }, { status: 404 })

  const vacancies = await prisma.vacancy.findMany({
    where: { userId, status: 'active' },
    select: { id: true, title: true, description: true, requirements: true },
  })

  if (vacancies.length === 0) {
    return NextResponse.json({ error: 'No active vacancies to match against' }, { status: 400 })
  }

  const results = { scanned: 0, relevant: 0, processed: 0, errors: [] as string[] }

  try {
    const { ImapFlow } = await import('imapflow')
    const client = new ImapFlow({
      host: inbox.host,
      port: inbox.port,
      secure: true,
      auth: { user: inbox.username, pass: inbox.password },
      logger: false,
    })

    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      const since = new Date()
      since.setDate(since.getDate() - 30)

      const messages: any[] = []
      for await (const msg of client.fetch(
        { seen: false, since },
        { uid: true, envelope: true, bodyStructure: true, source: true },
      )) {
        messages.push(msg)
      }

      results.scanned = messages.length

      for (const msg of messages.slice(0, 20)) {
        try {
          const subject = msg.envelope?.subject || ''
          const sender = msg.envelope?.from?.[0]?.address || ''
          const receivedAt = msg.envelope?.date || new Date()

          const attachmentBuffers: Array<{ name: string; buffer: Buffer; mimeType: string }> = []
          const bodyStructure = msg.bodyStructure

          const collectParts = (part: any) => {
            if (!part) return
            if (['pdf', 'msword', 'vnd.openxmlformats-officedocument.wordprocessingml.document',
              'octet-stream'].some(t => part.subtype?.includes(t))) {
              attachmentBuffers.push({
                name: part.parameters?.name || part.dispositionParameters?.filename || `attachment.${part.subtype}`,
                buffer: Buffer.alloc(0),
                mimeType: `${part.type}/${part.subtype}`,
              })
            }
            if (part.childNodes) {
              part.childNodes.forEach((child: any) => collectParts(child))
            }
          }
          collectParts(bodyStructure)

          let bodyText = ''
          try {
            const textPart = await client.download(msg.uid.toString(), '1', { uid: true }) as any
            if (textPart?.content) {
              const chunks: Buffer[] = []
              for await (const chunk of textPart.content) chunks.push(chunk)
              bodyText = Buffer.concat(chunks).toString('utf-8').slice(0, 1000)
            }
          } catch { /* no text part */ }

          const classification = await classifyRecruitmentEmail(
            subject,
            bodyText,
            attachmentBuffers.map(a => a.name),
          )

          const alreadyScanned = await prisma.emailScan.findFirst({
            where: { inboxId: inbox.id, subject, sender },
          })
          if (alreadyScanned) continue

          const scan = await prisma.emailScan.create({
            data: {
              subject,
              sender,
              receivedAt: new Date(receivedAt),
              processed: false,
              relevant: classification.isRelevant,
              attachments: attachmentBuffers.map(a => a.name).join(', '),
              inboxId: inbox.id,
            },
          })

          if (!classification.isRelevant || classification.confidence < 50) continue
          results.relevant++

          let cvText = ''
          let motivationText = ''

          for (let partIndex = 1; partIndex <= 10; partIndex++) {
            try {
              const dl = await client.download(msg.uid.toString(), String(partIndex), { uid: true }) as any
              if (!dl?.content) break
              const chunks: Buffer[] = []
              for await (const chunk of dl.content) chunks.push(chunk)
              const buffer = Buffer.concat(chunks)
              if (buffer.length < 100) continue
              const mimeType = dl.response?.headers?.get?.('content-type') || 'application/octet-stream'
              const text = await parseDocument(buffer, mimeType)
              if (text.length < 100) continue
              const docType = await detectDocumentType(text)
              if (docType === 'cv') cvText = text
              else if (docType === 'motivation') motivationText = text
            } catch { break }
          }

          if (!cvText && bodyText.length > 200) cvText = bodyText
          if (cvText.length < 50) {
            await prisma.emailScan.update({ where: { id: scan.id }, data: { processed: true } })
            continue
          }

          const vacancy = vacancies[0]
          const analysis = await analyzeCVAgainstVacancy(
            cvText, vacancy.title, vacancy.description, vacancy.requirements, motivationText || undefined,
          )

          const candidate = await prisma.candidate.create({
            data: {
              firstName: analysis.firstName || classification.candidateName?.split(' ')[0] || 'Unknown',
              lastName: analysis.lastName || classification.candidateName?.split(' ').slice(1).join(' ') || 'Candidate',
              email: analysis.email || sender,
              cvContent: cvText,
              motivationText: motivationText || undefined,
              matchScore: analysis.matchScore,
              summary: analysis.summary,
              strengths: JSON.stringify(analysis.strengths),
              weaknesses: JSON.stringify(analysis.weaknesses),
              skills: JSON.stringify(analysis.skills),
              experience: analysis.experience,
              education: analysis.education,
              recommendation: analysis.recommendation,
              language: analysis.language,
              status: 'new',
              source: 'email',
              gdprConsent: true,
              gdprConsentDate: new Date(),
              analyzedAt: new Date(),
              vacancyId: vacancy.id,
              userId,
            },
          })

          await prisma.emailScan.update({
            where: { id: scan.id },
            data: { processed: true, candidateId: candidate.id },
          })
          results.processed++
        } catch (msgError: any) {
          results.errors.push(msgError.message)
        }
      }
    } finally {
      lock.release()
    }

    await client.logout()
    await prisma.emailInbox.update({ where: { id: inbox.id }, data: { lastScan: new Date() } })
  } catch (error: any) {
    return NextResponse.json({ error: `Scan failed: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(results)
}
