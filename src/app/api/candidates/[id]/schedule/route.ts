// Schedules (or reschedules) an interview for a candidate: persists the date/
// duration/location, then emails the candidate an .ics calendar invite they can
// add to Google/Outlook/Apple in one click. The recruiter sees it in the
// dashboard calendar widget.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'
import { logActivity } from '@/lib/activity'
import { buildICS } from '@/lib/ics'
import { escapeHtml } from '@/lib/utils'
import nodemailer from 'nodemailer'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const { id } = await params
  const userId = (session.user as any).id

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }
  const { interviewAt, interviewDuration, interviewLocation, notify } = body

  if (!interviewAt) return NextResponse.json({ error: 'interviewAt is required' }, { status: 400 })
  const start = new Date(interviewAt)
  if (isNaN(start.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  const duration = Number(interviewDuration) > 0 ? Number(interviewDuration) : 30

  // Ownership check
  const candidate = await prisma.candidate.findFirst({
    where: { id, userId },
    include: { vacancy: { select: { title: true } } },
  })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Persist the schedule
  const updated = await prisma.candidate.update({
    where: { id },
    data: {
      interviewAt: start,
      interviewDuration: duration,
      interviewLocation: interviewLocation || null,
      // Scheduling implies the candidate is at least shortlisted
      status: candidate.status === 'new' || candidate.status === 'reviewing' ? 'shortlisted' : candidate.status,
    },
  })

  await logActivity(id, 'status_change', `Interview scheduled for ${start.toISOString()}`, {
    interviewAt: start.toISOString(), duration, location: interviewLocation || null,
  })

  // Optionally email the candidate an .ics invite
  let emailed = false
  if (notify && candidate.email) {
    const smtpHost = process.env.SMTP_HOST, smtpUser = process.env.SMTP_USER, smtpPass = process.env.SMTP_PASS
    if (smtpHost && smtpUser && smtpPass) {
      const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate'
      const role = candidate.vacancy?.title || 'the position'
      const ics = buildICS({
        uid: candidate.id,
        start,
        durationMinutes: duration,
        summary: `Interview — ${fullName} (${role})`,
        description: `Interview for ${role}.${interviewLocation ? ` Location: ${interviewLocation}` : ''}`,
        location: interviewLocation || undefined,
        organizerName: session.user.name || 'DeltaMatch',
        organizerEmail: smtpUser,
        attendeeName: fullName,
        attendeeEmail: candidate.email,
      })

      const when = start.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })
      const bodyText = `Hello ${candidate.firstName || ''},\n\nWe would like to invite you to an interview for ${role}.\n\nWhen: ${when}\nDuration: ${duration} minutes${interviewLocation ? `\nWhere: ${interviewLocation}` : ''}\n\nThe calendar invitation is attached — add it to your calendar in one click.\n\nBest regards`
      const bodyHtml = escapeHtml(bodyText).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>')

      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost, port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', auth: { user: smtpUser, pass: smtpPass },
        })
        await transporter.sendMail({
          from: `${session.user.name || 'DeltaMatch'} <${smtpUser}>`,
          to: candidate.email,
          replyTo: smtpUser,
          subject: `Interview invitation — ${role}`,
          text: bodyText,
          html: bodyHtml,
          icalEvent: { method: 'REQUEST', content: ics, filename: 'interview.ics' },
          attachments: [{ filename: 'interview.ics', content: ics, contentType: 'text/calendar; method=REQUEST' }],
        })
        emailed = true
        await logActivity(id, 'email_sent', 'Interview invitation sent', { to: candidate.email })
      } catch (e: any) {
        // Scheduling still succeeded even if the email failed — report it.
        return NextResponse.json({ success: true, emailed: false, emailError: e?.message, candidate: { id: updated.id, interviewAt: updated.interviewAt, interviewDuration: updated.interviewDuration, interviewLocation: updated.interviewLocation, status: updated.status } })
      }
    }
  }

  return NextResponse.json({
    success: true,
    emailed,
    candidate: { id: updated.id, interviewAt: updated.interviewAt, interviewDuration: updated.interviewDuration, interviewLocation: updated.interviewLocation, status: updated.status },
  })
}

// Cancel a scheduled interview
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const { id } = await params
  const userId = (session.user as any).id
  const existing = await prisma.candidate.findFirst({ where: { id, userId }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.candidate.update({
    where: { id },
    data: { interviewAt: null, interviewLocation: null, interviewDuration: 30 },
  })
  await logActivity(id, 'status_change', 'Interview unscheduled')
  return NextResponse.json({ success: true })
}
