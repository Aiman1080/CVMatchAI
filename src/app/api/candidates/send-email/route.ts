import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let reqBody: any
  try { reqBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { candidateId, type, subject, body, teamsLink } = reqBody
  if (!candidateId || !type || !subject || !body) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const userId = (session.user as any).id
  let candidate: any
  try {
    candidate = await prisma.candidate.findFirst({ where: { id: candidateId, userId }, include: { vacancy: true } })
  } catch {
    return NextResponse.json({ error: 'Failed to load candidate' }, { status: 500 })
  }
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  if (!candidate.email) return NextResponse.json({ error: 'Candidate has no email address' }, { status: 400 })

  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  if (!smtpHost || !smtpUser || !smtpPass) {
    return NextResponse.json({ error: 'Email not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to your environment.' }, { status: 400 })
  }

  const finalBody = teamsLink
    ? `${body}\n\n📅 Join the interview via Teams:\n${teamsLink}`
    : body

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass },
    })
    await transporter.sendMail({
      from: `${session.user.name || 'CVMatch AI'} <${smtpUser}>`,
      to: candidate.email,
      replyTo: smtpUser,
      subject,
      text: finalBody,
      html: finalBody.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>'),
    })

    // Update candidate status based on email type
    const statusMap: Record<string, string> = { rejection: 'rejected', interview: 'shortlisted' }
    if (statusMap[type]) {
      await prisma.candidate.update({ where: { id: candidateId }, data: { status: statusMap[type] } })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to send email: ${err.message}` }, { status: 500 })
  }
}
