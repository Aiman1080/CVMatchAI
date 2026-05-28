// Real IMAP email scan — connects to the recruiter's inbox via ImapFlow,
// fetches unseen emails from the last 30 days (capped at 20), uses AI to classify
// each email, downloads and parses PDF/DOCX attachments, detects whether each
// document is a CV or motivation letter, then runs AI CV analysis and creates
// a Candidate record linked to the best matching active vacancy.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseDocument } from '@/lib/pdf-parser'
import { analyzeCVAgainstVacancy, classifyRecruitmentEmail, detectDocumentType } from '@/lib/ai'
import { getPlanLimits } from '@/lib/plans'
import { decrypt } from '@/lib/crypto'
import { isDemoAccount } from '@/lib/demo-guard'

// Allow up to 5 minutes — IMAP + multiple AI calls can easily take 2–3 min
export const maxDuration = 300

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }

  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true } })
  const limits = getPlanLimits(user?.subscription || 'free')
  if (!limits.emailInbox) {
    return NextResponse.json({ error: 'Email scanning requires a Pro plan', upgrade: true }, { status: 403 })
  }

  let inboxId: string
  try { inboxId = (await req.json()).inboxId } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  let inbox: any, vacancies: any[]
  try {
    // Ownership check — users can only scan their own inboxes
    inbox = await prisma.emailInbox.findFirst({ where: { id: inboxId, userId } })
    if (!inbox) return NextResponse.json({ error: 'Inbox not found' }, { status: 404 })

    // Require at least one active vacancy to match against before scanning
    vacancies = await prisma.vacancy.findMany({
      where: { userId, status: 'active' },
      select: { id: true, title: true, description: true, requirements: true },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load inbox or vacancies' }, { status: 500 })
  }

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
      auth: { user: inbox.username, pass: decrypt(inbox.password) },
      logger: false,
    })

    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      // Only look at emails from the last 30 days to keep scans fast
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

      // Cap at 20 messages per scan to avoid timeouts on busy inboxes
      for (const msg of messages.slice(0, 20)) {
        try {
          const subject = msg.envelope?.subject || ''
          const sender = msg.envelope?.from?.[0]?.address || ''
          const receivedAt = msg.envelope?.date || new Date()

          // Walk the MIME tree to find PDF/DOCX attachment names for classification
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

          // Download just the text body part (part 1) for classification preview
          let bodyText = ''
          try {
            const textPart = await client.download(msg.uid.toString(), '1', { uid: true }) as any
            if (textPart?.content) {
              const chunks: Buffer[] = []
              for await (const chunk of textPart.content) chunks.push(chunk)
              bodyText = Buffer.concat(chunks).toString('utf-8').slice(0, 1000)
            }
          } catch { /* no text part — attachment-only emails are still classified via filename */ }

          const classification = await classifyRecruitmentEmail(
            subject,
            bodyText,
            attachmentBuffers.map(a => a.name),
          )

          // Skip emails already recorded to prevent duplicate candidates on re-scan
          const alreadyScanned = await prisma.emailScan.findFirst({
            where: { inboxId: inbox.id, subject, sender },
          })
          if (alreadyScanned) continue

          // Always record the scan attempt for audit purposes
          const scan = await prisma.emailScan.create({
            data: {
              subject,
              sender,
              receivedAt: new Date(receivedAt),
              processed: false,
              relevant: classification.isRelevant,
              attachments: JSON.stringify(attachmentBuffers.map(a => a.name)),
              inboxId: inbox.id,
            },
          })

          // Skip low-confidence or irrelevant emails
          if (!classification.isRelevant || classification.confidence < 50) continue
          results.relevant++

          let cvText = ''
          let motivationText = ''

          // Try downloading MIME parts 1–10 to find actual document content
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

          // Fallback: treat the email body itself as a CV if no attachments were parsed
          if (!cvText && bodyText.length > 200) cvText = bodyText
          if (cvText.length < 50) {
            await prisma.emailScan.update({ where: { id: scan.id }, data: { processed: true } })
            continue
          }

          // Smart vacancy matching: score each vacancy and pick the best match
          const cvLower = cvText.toLowerCase()
          let bestVacancy = vacancies[0]
          let bestScore = 0
          for (const v of vacancies) {
            const vacText = `${v.title} ${v.description} ${v.requirements}`.toLowerCase()
            const words = [...new Set(vacText.match(/\b[a-z]{4,}\b/g) || [])]
            const hits = words.filter(w => cvLower.includes(w)).length
            const score = words.length > 0 ? hits / words.length : 0
            if (score > bestScore) { bestScore = score; bestVacancy = v }
          }
          const vacancy = bestVacancy

          const analysis = await analyzeCVAgainstVacancy(
            cvText, vacancy.title, vacancy.description, vacancy.requirements, motivationText || undefined, (vacancy as any).language,
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

          // Link the scan record to the created candidate for audit trail
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
      // Always release the mailbox lock to avoid hanging IMAP sessions
      lock.release()
    }

    await client.logout()
    await prisma.emailInbox.update({ where: { id: inbox.id }, data: { lastScan: new Date() } })
  } catch (error: any) {
    return NextResponse.json({ error: `Scan failed: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json(results)
}
