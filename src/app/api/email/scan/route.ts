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

      // ════════════════════════════════════════════════════════════════
      // PASS 1: AI reads every email's content and decides which look like
      // real applications with a CV. Selected ones go to a "shortlist".
      // ════════════════════════════════════════════════════════════════
      type Shortlisted = {
        msg: any
        subject: string
        sender: string
        receivedAt: Date
        bodyText: string
        allParts: Array<{ path: string; type: string; subtype: string; name: string }>
        classification: any
      }
      const shortlist: Shortlisted[] = []

      // Strip HTML to readable text for AI context
      const stripHtml = (html: string): string =>
        html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim()

      // IMPORTANT: imapflow returns part.type as the FULL mime type ("text/plain"),
      // not separate type/subtype. So checking p.type === 'text' never matches —
      // we must use startsWith('text/').
      const isTextPart = (p: { type: string }) => p.type.startsWith('text/')

      // Cap at 30 messages per scan to keep classification quick.
      for (const msg of messages.slice(0, 30)) {
        try {
          const subject = msg.envelope?.subject || ''
          const sender = msg.envelope?.from?.[0]?.address || ''
          const receivedAt = msg.envelope?.date || new Date()

          // Walk MIME tree once and collect all leaf parts with their paths
          const allParts: Array<{ path: string; type: string; subtype: string; name: string }> = []
          const collectAllParts = (part: any, path: string = '1') => {
            if (!part) return
            const filename = part.parameters?.name || part.dispositionParameters?.filename || ''
            const subtype = (part.subtype || '').toLowerCase()
            const type = (part.type || '').toLowerCase()
            if (type !== 'multipart') {
              allParts.push({ path: part.part || path, type, subtype, name: filename })
            }
            if (part.childNodes) {
              part.childNodes.forEach((child: any, idx: number) => collectAllParts(child, `${path}.${idx + 1}`))
            }
          }
          collectAllParts(msg.bodyStructure)

          // Download body — prefer text/plain, fallback to text/html stripped
          // (imapflow stores the full mime in `type`, not split into type/subtype)
          let bodyText = ''
          const textPart = allParts.find(p => p.type === 'text/plain')
            || allParts.find(p => p.type === 'text/html')
            || allParts.find(p => isTextPart(p))
          if (textPart) {
            try {
              const dl = await client.download(msg.uid.toString(), textPart.path, { uid: true }) as any
              if (dl?.content) {
                const chunks: Buffer[] = []
                for await (const chunk of dl.content) chunks.push(chunk)
                let raw = Buffer.concat(chunks).toString('utf-8')
                if (textPart.type === 'text/html') raw = stripHtml(raw)
                bodyText = raw.slice(0, 5000)
              }
            } catch {}
          }

          // List the attachment-looking parts (skip text bodies)
          const namedAttachments = allParts.filter(p => !isTextPart(p) && p.name).map(a => a.name)

          console.log(`[email/scan] PASS1 msg ${msg.uid} from ${sender} | subject="${subject.slice(0, 80)}" | bodyLen=${bodyText.length} | attachments=[${namedAttachments.join(', ')}]`)

          // Send to Gemini for understanding the email content
          const classification = await classifyRecruitmentEmail(subject, bodyText, namedAttachments)
          console.log(`[email/scan] PASS1 msg ${msg.uid} → AI: relevant=${classification.isRelevant} confidence=${classification.confidence} intent="${classification.intent || ''}" candidate="${classification.candidateName || ''}" cvFile="${classification.cvAttachmentName || ''}"`)

          // Dedup: only skip if we PREVIOUSLY succeeded in creating a candidate from
          // this exact email. If the previous scan attempt failed (no candidate created),
          // we re-try. This avoids the silent "already scanned but never imported" bug.
          const uidTag = msg.uid ? `::uid=${msg.uid}` : ''
          const previousScan = await prisma.emailScan.findFirst({
            where: { inboxId: inbox.id, sender, receivedAt: new Date(receivedAt), subject: uidTag ? { contains: uidTag } : subject },
          })
          if (previousScan && previousScan.candidateId) {
            console.log(`[email/scan] PASS1 msg ${msg.uid}: already imported as candidate ${previousScan.candidateId}, skipping`)
            continue
          }
          // Clean up any previous failed scan attempt so we don't accumulate duplicates
          if (previousScan) {
            await prisma.emailScan.delete({ where: { id: previousScan.id } }).catch(() => {})
          }

          // Record the new scan attempt
          await prisma.emailScan.create({
            data: {
              subject: subject + uidTag,
              sender,
              receivedAt: new Date(receivedAt),
              processed: false,
              relevant: classification.isRelevant,
              attachments: JSON.stringify(namedAttachments),
              inboxId: inbox.id,
            },
          })

          // Only shortlist if AI marked it as a real application AND there's at least
          // one non-text MIME part (i.e. a potential CV file)
          if (!classification.isRelevant) continue
          const hasFiles = allParts.some(p => !isTextPart(p))
          if (!hasFiles) {
            console.log(`[email/scan] PASS1 msg ${msg.uid}: AI said application but no files — skipping`)
            continue
          }

          shortlist.push({ msg, subject, sender, receivedAt: new Date(receivedAt), bodyText, allParts, classification })
        } catch (e: any) {
          console.error(`[email/scan] PASS1 msg ${msg.uid} failed:`, e?.message)
        }
      }

      console.log(`[email/scan] PASS1 complete: ${shortlist.length} application(s) shortlisted out of ${messages.length} messages`)
      results.relevant = shortlist.length

      // ════════════════════════════════════════════════════════════════
      // PASS 2: For each shortlisted email, download attachments, parse,
      // run full CV analysis, and create candidate records.
      // ════════════════════════════════════════════════════════════════
      const tryParseBuffer = async (buffer: Buffer, hint: string): Promise<{ text: string; docType: string }> => {
        if (buffer.length < 500) return { text: '', docType: 'unknown' }
        const head4 = buffer.slice(0, 4)
        const isPDF = head4.toString('utf-8') === '%PDF'
        const isZIP = head4.toString('hex').toLowerCase().startsWith('504b0304')
        if (!isPDF && !isZIP) return { text: '', docType: 'unknown' }
        const mime = isPDF
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        try {
          const text = await parseDocument(buffer, mime)
          if (text.length < 100) return { text: '', docType: 'unknown' }
          const docType = await detectDocumentType(text)
          console.log(`[email/scan] ${hint}: parsed ${text.length} chars as ${mime}, detected as ${docType}`)
          return { text, docType }
        } catch (e: any) {
          console.log(`[email/scan] ${hint}: parse failed (${e?.message?.slice(0, 60)})`)
          return { text: '', docType: 'unknown' }
        }
      }

      for (const item of shortlist) {
        const { msg, subject, sender, receivedAt, allParts, classification } = item
        try {
          console.log(`[email/scan] PASS2 msg ${msg.uid}: analyzing for candidate creation`)

          // Try Gemini's hinted CV attachment first, then any non-text part
          const cvHint = classification.cvAttachmentName?.toLowerCase().trim()
          const motivHint = classification.motivationAttachmentName?.toLowerCase().trim()
          const matchByName = (name: string, hint: string) =>
            !!hint && (name.toLowerCase().includes(hint) || hint.includes(name.toLowerCase()))

          const orderedParts = [...allParts.filter(p => !isTextPart(p))].sort((a, b) => {
            const aIsCv = matchByName(a.name, cvHint || '') ? 1 : 0
            const bIsCv = matchByName(b.name, cvHint || '') ? 1 : 0
            return bIsCv - aIsCv
          })

          let cvText = ''
          let motivationText = ''
          for (const p of orderedParts) {
            if (cvText && motivationText) break
            try {
              const dl = await client.download(msg.uid.toString(), p.path, { uid: true }) as any
              if (!dl?.content) continue
              const chunks: Buffer[] = []
              for await (const chunk of dl.content) chunks.push(chunk)
              const buffer = Buffer.concat(chunks)
              const { text, docType } = await tryParseBuffer(buffer, `msg ${msg.uid} path ${p.path} ${p.name || p.subtype}`)
              if (!text) continue

              const looksLikeCV = matchByName(p.name, cvHint || '') || docType === 'cv'
              const looksLikeMotivation = matchByName(p.name, motivHint || '') || docType === 'motivation'
              if (looksLikeCV && !cvText) cvText = text
              else if (looksLikeMotivation && !motivationText) motivationText = text
              else if (!cvText) cvText = text
              else if (!motivationText) motivationText = text
            } catch (e: any) {
              console.log(`[email/scan] PASS2 msg ${msg.uid} path ${p.path}: download failed (${e?.message?.slice(0, 60)})`)
            }
          }

          if (!cvText || cvText.length < 200) {
            console.log(`[email/scan] PASS2 msg ${msg.uid}: no real CV (cvText len=${cvText.length}), skipping`)
            const scan = await prisma.emailScan.findFirst({ where: { inboxId: inbox.id, sender, subject: { contains: `::uid=${msg.uid}` } } })
            if (scan) await prisma.emailScan.update({ where: { id: scan.id }, data: { processed: true } })
            results.relevant--
            continue
          }
          const scan = await prisma.emailScan.findFirst({ where: { inboxId: inbox.id, sender, subject: { contains: `::uid=${msg.uid}` } } })
          if (!scan) continue

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
