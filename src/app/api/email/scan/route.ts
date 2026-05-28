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
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'
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

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
  const effectiveSubscription = getEffectiveSubscription(user?.subscription || 'free', user?.subscriptionEnd || null)
  const limits = getPlanLimits(effectiveSubscription)
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
      // Only look at emails from the last 15 days to keep scans focused and fast.
      // Include BOTH read and unread emails — recruiters often open emails
      // before scanning.
      const since = new Date()
      since.setDate(since.getDate() - 15)

      const messages: any[] = []
      for await (const msg of client.fetch(
        { since },
        { uid: true, envelope: true, bodyStructure: true, source: true },
      )) {
        messages.push(msg)
      }
      console.log(`[email/scan] Inbox ${inbox.id}: fetched ${messages.length} messages from last 30 days`)

      results.scanned = messages.length

      // Cap at 20 messages per scan to avoid timeouts on busy inboxes
      for (const msg of messages.slice(0, 20)) {
        try {
          const subject = msg.envelope?.subject || ''
          const sender = msg.envelope?.from?.[0]?.address || ''
          const receivedAt = msg.envelope?.date || new Date()

          // Walk the MIME tree and collect EVERY non-text attachment. We are
          // intentionally permissive — recruitment emails from many web platforms
          // (LinkedIn, Indeed, careers portals) wrap CVs in unusual MIME types.
          // Better to attempt to parse and skip if no text comes out than to
          // pre-filter and miss real applications.
          const attachments: Array<{ name: string; mimeType: string; path: string }> = []
          const bodyStructure = msg.bodyStructure

          const collectParts = (part: any, path: string = '1') => {
            if (!part) return
            const subtype = (part.subtype || '').toLowerCase()
            const type = (part.type || '').toLowerCase()
            const filename = part.parameters?.name || part.dispositionParameters?.filename || ''
            const disposition = (part.disposition || '').toLowerCase()

            // Accept: any explicit attachment, any non-text/multipart part with a filename,
            // any PDF/DOCX/Word regardless of disposition
            const isText = type === 'text' && !filename
            const isMultipart = type === 'multipart'
            const isExplicitAttachment = disposition === 'attachment'
            const isLikelyDoc = subtype.includes('pdf') ||
              subtype.includes('msword') ||
              subtype.includes('wordprocessingml') ||
              subtype.includes('officedocument') ||
              filename.toLowerCase().match(/\.(pdf|docx?|odt|rtf|txt)$/)

            if (!isText && !isMultipart && (isExplicitAttachment || filename || isLikelyDoc)) {
              attachments.push({
                name: filename || `attachment.${subtype || 'bin'}`,
                mimeType: `${type}/${subtype}`,
                path: part.part || path,
              })
            }
            if (part.childNodes) {
              part.childNodes.forEach((child: any, idx: number) => collectParts(child, `${path}.${idx + 1}`))
            }
          }
          collectParts(bodyStructure)
          if (attachments.length === 0 && bodyStructure) {
            // Log the MIME structure so we can debug why no attachments were detected
            const summarize = (p: any, depth = 0): string => {
              if (!p) return ''
              const prefix = '  '.repeat(depth)
              const name = p.parameters?.name || p.dispositionParameters?.filename || ''
              const line = `${prefix}- ${p.type}/${p.subtype}${name ? ` "${name}"` : ''}${p.part ? ` [${p.part}]` : ''}`
              const children = (p.childNodes || []).map((c: any) => summarize(c, depth + 1)).join('\n')
              return children ? `${line}\n${children}` : line
            }
            console.log(`[email/scan] msg ${msg.uid}: NO ATTACHMENTS detected. MIME tree:\n${summarize(bodyStructure)}`)
          }

          // Download just the text body part (part 1) for classification preview
          let bodyText = ''
          try {
            const textPart = await client.download(msg.uid.toString(), '1', { uid: true }) as any
            if (textPart?.content) {
              const chunks: Buffer[] = []
              for await (const chunk of textPart.content) chunks.push(chunk)
              bodyText = Buffer.concat(chunks).toString('utf-8').slice(0, 2000)
            }
          } catch { /* no text part — attachment-only emails are still classified via filename */ }

          // Log every email being analyzed — makes debugging easy from Vercel logs
          console.log(`[email/scan] msg ${msg.uid} from ${sender} | subject="${subject.slice(0, 80)}" | attachments=[${attachments.map(a => a.name).join(', ')}] | bodyLen=${bodyText.length}`)

          const classification = await classifyRecruitmentEmail(
            subject,
            bodyText,
            attachments.map(a => a.name),
          )
          console.log(`[email/scan] msg ${msg.uid} → AI classified: relevant=${classification.isRelevant} confidence=${classification.confidence}`)

          // Skip emails already recorded to prevent duplicate candidates on re-scan
          const uidTag = msg.uid ? `::uid=${msg.uid}` : ''
          const alreadyScanned = await prisma.emailScan.findFirst({
            where: {
              inboxId: inbox.id,
              sender,
              receivedAt: new Date(receivedAt),
              subject: uidTag ? { contains: uidTag } : subject,
            },
          })
          if (alreadyScanned) continue

          // Always record the scan attempt for audit purposes
          const scan = await prisma.emailScan.create({
            data: {
              subject: subject + uidTag,
              sender,
              receivedAt: new Date(receivedAt),
              processed: false,
              relevant: classification.isRelevant,
              attachments: JSON.stringify(attachments.map(a => a.name)),
              inboxId: inbox.id,
            },
          })

          // Be VERY permissive: process any email where we suspect there's CV content.
          // Recruiters were losing real applications because the AI judges by language
          // patterns that don't match all applications (e.g. CVs sent via web forms,
          // automated tracking emails from career portals, multi-language applications).
          const hasAttachment = attachments.length > 0
          const haystack = `${subject} ${bodyText}`.toLowerCase()
          const applicationKeywords = [
            'cv', 'resume', 'résumé', 'curriculum',
            'application', 'candidature', 'sollicit',
            'apply', 'postul', 'kandidaat', 'bewerb',
            'job', 'position', 'role', 'fonction', 'poste',
            'motivat', 'cover letter', 'lettre',
            'experience', 'opportunit',
          ]
          const hasApplicationKeyword = applicationKeywords.some(k => haystack.includes(k))

          const skip = !classification.isRelevant && !hasAttachment && !hasApplicationKeyword
          if (skip) {
            console.log(`[email/scan] msg ${msg.uid}: SKIPPED (no attachments, no keywords, AI says not relevant)`)
            continue
          }
          console.log(`[email/scan] msg ${msg.uid}: PROCESSING (attachments=${attachments.length}, keywords=${hasApplicationKeyword}, AI=${classification.isRelevant})`)
          results.relevant++

          let cvText = ''
          let motivationText = ''

          // Helper: try to parse a downloaded buffer as a CV/motivation document.
          // Returns the parsed text and detected type, or empty strings on failure.
          const tryParseBuffer = async (buffer: Buffer, hint: string): Promise<{ text: string; docType: string }> => {
            if (buffer.length < 100) return { text: '', docType: 'unknown' }
            // Try PDF first, then DOCX, then plain text
            for (const mime of ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']) {
              try {
                const text = await parseDocument(buffer, mime)
                if (text.length >= 100) {
                  const docType = await detectDocumentType(text)
                  console.log(`[email/scan] ${hint}: parsed ${text.length} chars as ${mime}, detected as ${docType}`)
                  return { text, docType }
                }
              } catch {}
            }
            return { text: '', docType: 'unknown' }
          }

          // Download each attachment using its ACTUAL MIME part path
          for (const att of attachments) {
            try {
              const dl = await client.download(msg.uid.toString(), att.path, { uid: true }) as any
              if (!dl?.content) continue
              const chunks: Buffer[] = []
              for await (const chunk of dl.content) chunks.push(chunk)
              const buffer = Buffer.concat(chunks)
              const { text, docType } = await tryParseBuffer(buffer, `msg ${msg.uid} att ${att.name}`)
              if (!text) continue
              if (docType === 'cv' && !cvText) cvText = text
              else if (docType === 'motivation' && !motivationText) motivationText = text
              else if (!cvText) cvText = text
            } catch (e: any) {
              console.error(`[email/scan] msg ${msg.uid}: failed to download attachment ${att.name} at path ${att.path}:`, e?.message)
            }
          }

          // BRUTE-FORCE FALLBACK: if no CV found yet, try downloading every plausible
          // MIME part path. Webmail providers sometimes hide attachments under unusual
          // paths that our bodyStructure walk misses. We try a depth-2 grid of paths.
          if (!cvText) {
            console.log(`[email/scan] msg ${msg.uid}: no CV found via bodyStructure, attempting brute-force part download`)
            const candidatePaths = ['1', '2', '3', '4', '5', '1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '3.1', '3.2']
            for (const path of candidatePaths) {
              if (cvText) break
              try {
                const dl = await client.download(msg.uid.toString(), path, { uid: true }) as any
                if (!dl?.content) continue
                const chunks: Buffer[] = []
                for await (const chunk of dl.content) chunks.push(chunk)
                const buffer = Buffer.concat(chunks)
                if (buffer.length < 500) continue  // probably not a CV
                const { text, docType } = await tryParseBuffer(buffer, `msg ${msg.uid} brute-path ${path}`)
                if (!text) continue
                if (docType === 'motivation' && !motivationText) motivationText = text
                if (!cvText && text.length > 200) cvText = text
              } catch { /* path doesn't exist, try next */ }
            }
          }

          // Fallback: treat the email body itself as a CV if no attachments were parsed
          if (!cvText && bodyText.length > 200) {
            console.log(`[email/scan] msg ${msg.uid}: using email body as CV (${bodyText.length} chars)`)
            cvText = bodyText
          }
          if (cvText.length < 50) {
            console.log(`[email/scan] msg ${msg.uid}: no usable CV content found`)
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
    console.log(`[email/scan] Inbox ${inbox.id}: scanned=${results.scanned} relevant=${results.relevant} processed=${results.processed} errors=${results.errors.length}`)
  } catch (error: any) {
    console.error(`[email/scan] FAILED for inbox ${inbox.id}:`, error?.message, error?.code)
    // Surface a useful hint to the user
    let hint = ''
    if (error?.code === 'ETIMEOUT' || error?.message?.includes('timeout')) {
      hint = ' — The IMAP server took too long to respond. Check your host/port settings or try a smaller scan window.'
    } else if (error?.code === 'EAUTH' || error?.message?.includes('AUTHENTICATIONFAILED')) {
      hint = ' — Authentication failed. For Gmail, you need an App Password (not your regular password).'
    } else if (error?.code === 'ECONNREFUSED' || error?.message?.includes('connect')) {
      hint = ' — Could not reach the IMAP server. Check your host and port are correct.'
    }
    return NextResponse.json({ error: `Scan failed: ${error.message}${hint}` }, { status: 500 })
  }

  // Add a diagnostic message so the recruiter knows why nothing was added
  let diagnostic = ''
  if (results.scanned === 0) {
    diagnostic = 'No emails found in the last 30 days. Make sure your inbox has recent messages.'
  } else if (results.relevant === 0) {
    diagnostic = `Found ${results.scanned} email(s), but AI determined none are job applications. Recruiters typically receive CVs as PDF/DOCX attachments — check that your applicants are sending attachments.`
  } else if (results.processed === 0) {
    diagnostic = `Found ${results.relevant} relevant email(s), but couldn't extract CV text. The attachments may be empty, image-only PDFs, or already-imported messages.`
  } else {
    diagnostic = `Successfully imported ${results.processed} new candidate(s).`
  }

  return NextResponse.json({ ...results, diagnostic })
}
