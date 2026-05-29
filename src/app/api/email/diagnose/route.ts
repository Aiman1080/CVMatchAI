// Email scan DIAGNOSTIC endpoint — given a sender email (or subject hint),
// fetches the most recent matching messages and reports EVERY step:
// MIME structure, attachment download, magic bytes, parse attempts, AI verdict.
// Use this to debug why a real application isn't being detected by the regular scan.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseDocument } from '@/lib/pdf-parser'
import { classifyRecruitmentEmail } from '@/lib/ai'
import { decrypt } from '@/lib/crypto'
import { isDemoAccount } from '@/lib/demo-guard'

export const maxDuration = 120

interface DiagPart {
  path: string
  type: string
  subtype: string
  name: string
  parameters?: any
  disposition?: string
  size?: number
  download?: {
    bytes: number
    headHex: string
    headUtf8: string
    headBase64Decoded?: string
    isPDF: boolean
    isZIP: boolean
    pdfMagicAt?: number
    zipMagicAt?: number
    parsePDF?: { ok: boolean; chars?: number; error?: string }
    parseDOCX?: { ok: boolean; chars?: number; error?: string }
  } | string
}

interface DiagReport {
  msgUid: number
  subject: string
  from: string
  date: string
  mimeTree: string
  parts: DiagPart[]
  body: {
    textPlain?: { found: boolean; chars?: number; preview?: string }
    textHtml?: { found: boolean; chars?: number; previewStripped?: string }
  }
  ai: {
    input: { subject: string; bodyLen: number; attachmentNames: string[] }
    output: any
  } | { error: string }
  finalVerdict: string
  reasonsForRejection: string[]
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot run diagnostic' }, { status: 403 })
  }
  const userId = (session.user as any).id

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { inboxId, senderEmail, subjectContains } = body
  if (!inboxId) return NextResponse.json({ error: 'inboxId required' }, { status: 400 })
  if (!senderEmail && !subjectContains) return NextResponse.json({ error: 'Provide senderEmail or subjectContains' }, { status: 400 })

  const inbox = await prisma.emailInbox.findFirst({ where: { id: inboxId, userId } })
  if (!inbox) return NextResponse.json({ error: 'Inbox not found' }, { status: 404 })

  const { ImapFlow } = await import('imapflow')
  const client = new ImapFlow({
    host: inbox.host,
    port: inbox.port,
    secure: true,
    auth: { user: inbox.username, pass: decrypt(inbox.password) },
    logger: false,
  })

  const reports: DiagReport[] = []
  const meta: any = { inboxEmail: inbox.email, host: inbox.host }

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')

    try {
      // Search last 30 days
      const since = new Date()
      since.setDate(since.getDate() - 30)

      // Collect candidate messages by filter
      const allMatches: any[] = []
      for await (const msg of client.fetch(
        { since },
        { uid: true, envelope: true, bodyStructure: true },
      )) {
        const sender = (msg.envelope?.from?.[0]?.address || '').toLowerCase()
        const subject = msg.envelope?.subject || ''
        const matchesSender = !senderEmail || sender.includes(senderEmail.toLowerCase()) || senderEmail.toLowerCase().includes(sender)
        const matchesSubject = !subjectContains || subject.toLowerCase().includes(subjectContains.toLowerCase())
        if (matchesSender && matchesSubject) {
          allMatches.push(msg)
        }
      }

      meta.totalMatches = allMatches.length
      // Process up to 3 most recent matches
      const recent = allMatches.slice(-3).reverse()

      for (const msg of recent) {
        const subject = msg.envelope?.subject || ''
        const from = msg.envelope?.from?.[0]?.address || ''
        const date = (msg.envelope?.date || new Date()).toISOString()

        // Build MIME tree string
        const mimeLines: string[] = []
        const parts: DiagPart[] = []
        const walk = (p: any, path: string = '1', depth: number = 0) => {
          if (!p) return
          const indent = '  '.repeat(depth)
          const name = p.parameters?.name || p.dispositionParameters?.filename || ''
          const size = p.size
          const mimePath = p.part || path
          mimeLines.push(`${indent}- ${p.type}/${p.subtype}${name ? ` "${name}"` : ''}${size ? ` (${size}b)` : ''} [${mimePath}]`)
          if (p.type !== 'multipart') {
            parts.push({
              path: mimePath,
              type: (p.type || '').toLowerCase(),
              subtype: (p.subtype || '').toLowerCase(),
              name,
              parameters: p.parameters,
              disposition: p.disposition,
              size,
            })
          }
          if (p.childNodes) {
            p.childNodes.forEach((c: any, i: number) => walk(c, `${path}.${i + 1}`, depth + 1))
          }
        }
        walk(msg.bodyStructure)

        // Try to download body text (plain preferred, html fallback)
        const bodyResult: any = { textPlain: { found: false }, textHtml: { found: false } }
        const textPlainPart = parts.find(p => p.type === 'text' && p.subtype === 'plain')
        const textHtmlPart = parts.find(p => p.type === 'text' && p.subtype === 'html')

        let bodyForAI = ''
        if (textPlainPart) {
          try {
            const dl = await client.download(msg.uid.toString(), textPlainPart.path, { uid: true }) as any
            if (dl?.content) {
              const chunks: Buffer[] = []
              for await (const c of dl.content) chunks.push(c)
              const text = Buffer.concat(chunks).toString('utf-8')
              bodyResult.textPlain = { found: true, chars: text.length, preview: text.slice(0, 500) }
              bodyForAI = text.slice(0, 5000)
            }
          } catch (e: any) {
            bodyResult.textPlain = { found: false, error: e?.message }
          }
        }
        if (textHtmlPart) {
          try {
            const dl = await client.download(msg.uid.toString(), textHtmlPart.path, { uid: true }) as any
            if (dl?.content) {
              const chunks: Buffer[] = []
              for await (const c of dl.content) chunks.push(c)
              const html = Buffer.concat(chunks).toString('utf-8')
              const stripped = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
              bodyResult.textHtml = { found: true, chars: html.length, previewStripped: stripped.slice(0, 500) }
              if (!bodyForAI) bodyForAI = stripped.slice(0, 5000)
            }
          } catch (e: any) {
            bodyResult.textHtml = { found: false, error: e?.message }
          }
        }

        // For each non-text part, attempt download + magic byte + parse
        for (const p of parts) {
          if (p.type === 'text') continue
          try {
            const dl = await client.download(msg.uid.toString(), p.path, { uid: true }) as any
            if (!dl?.content) {
              p.download = 'no content returned'
              continue
            }
            const chunks: Buffer[] = []
            for await (const c of dl.content) chunks.push(c)
            const buffer = Buffer.concat(chunks)
            const head = buffer.slice(0, 100)
            const headHex = head.toString('hex')
            const headUtf8 = head.toString('utf-8').replace(/[^\x20-\x7E]/g, '·').slice(0, 100)

            // Try to find PDF magic anywhere in first 4KB (in case it's prefixed by something)
            const pdfMagicAt = buffer.slice(0, 4096).indexOf(Buffer.from('%PDF'))
            const zipMagicAt = buffer.slice(0, 4096).indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]))

            // Maybe it's base64-encoded — try to decode the head and look for PDF magic
            let headBase64Decoded: string | undefined
            try {
              const decoded = Buffer.from(head.toString('utf-8'), 'base64')
              if (decoded.length > 4) {
                headBase64Decoded = decoded.slice(0, 20).toString('hex')
              }
            } catch {}

            const isPDF = pdfMagicAt === 0
            const isZIP = zipMagicAt === 0

            // Try parse PDF
            let parsePDF: any = { ok: false }
            try {
              const text = await parseDocument(buffer, 'application/pdf')
              parsePDF = { ok: true, chars: text.length }
            } catch (e: any) {
              parsePDF = { ok: false, error: e?.message?.slice(0, 200) }
            }
            // Try parse DOCX
            let parseDOCX: any = { ok: false }
            try {
              const text = await parseDocument(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
              parseDOCX = { ok: true, chars: text.length }
            } catch (e: any) {
              parseDOCX = { ok: false, error: e?.message?.slice(0, 200) }
            }

            p.download = {
              bytes: buffer.length,
              headHex,
              headUtf8,
              headBase64Decoded,
              isPDF,
              isZIP,
              pdfMagicAt: pdfMagicAt >= 0 ? pdfMagicAt : undefined,
              zipMagicAt: zipMagicAt >= 0 ? zipMagicAt : undefined,
              parsePDF,
              parseDOCX,
            }
          } catch (e: any) {
            p.download = `download error: ${e?.message?.slice(0, 200)}`
          }
        }

        // AI classify
        const attachmentNames = parts.filter(p => p.type !== 'text' && p.name).map(p => p.name)
        let aiInfo: any
        try {
          const out = await classifyRecruitmentEmail(subject, bodyForAI, attachmentNames)
          aiInfo = {
            input: { subject, bodyLen: bodyForAI.length, attachmentNames },
            output: out,
          }
        } catch (e: any) {
          aiInfo = { error: e?.message?.slice(0, 200) }
        }

        // Final verdict
        const reasons: string[] = []
        if (!aiInfo?.output?.isRelevant) reasons.push(`AI classified as NOT relevant (confidence=${aiInfo?.output?.confidence}, intent="${aiInfo?.output?.intent}")`)
        const hasFiles = parts.some(p => p.type !== 'text')
        if (!hasFiles) reasons.push('No non-text parts found — no file attached')

        const cvLikeParts = parts.filter(p => p.type !== 'text' && typeof p.download === 'object' && (p.download as any).parsePDF?.ok)
        const docxLikeParts = parts.filter(p => p.type !== 'text' && typeof p.download === 'object' && (p.download as any).parseDOCX?.ok)
        const totalParseableCV = cvLikeParts.length + docxLikeParts.length
        if (hasFiles && totalParseableCV === 0) reasons.push('No attachment could be parsed as PDF or DOCX')

        let verdict = 'WOULD CREATE CANDIDATE ✓'
        if (reasons.length > 0) verdict = 'WOULD SKIP ✗'

        reports.push({
          msgUid: msg.uid,
          subject,
          from,
          date,
          mimeTree: mimeLines.join('\n'),
          parts,
          body: bodyResult,
          ai: aiInfo,
          finalVerdict: verdict,
          reasonsForRejection: reasons,
        })
      }
    } finally {
      lock.release()
    }

    await client.logout()
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Diagnostic failed' }, { status: 500 })
  }

  return NextResponse.json({ meta, reports })
}
