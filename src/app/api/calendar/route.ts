// Calendar API for the dashboard widget.
// GET: interviews + personal events in a window (?from/?to). Admins see all interviews.
// POST: create a personal calendar event for the current user.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  const url = new URL(req.url)
  // Validate query dates - an invalid string would otherwise become an Invalid
  // Date and make Prisma throw. Fall back to the defaults (now → +60 days).
  const parseDate = (raw: string | null, fallback: Date): Date => {
    if (!raw) return fallback
    const d = new Date(raw)
    return isNaN(d.getTime()) ? fallback : d
  }
  const from = parseDate(url.searchParams.get('from'), new Date())
  const to = parseDate(url.searchParams.get('to'), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000))

  try {
    const [candidates, personal] = await Promise.all([
      prisma.candidate.findMany({
        where: { ...(isAdmin ? {} : { userId }), interviewAt: { gte: from, lte: to } },
        orderBy: { interviewAt: 'asc' },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          interviewAt: true, interviewDuration: true, interviewLocation: true,
          status: true, vacancy: { select: { title: true } },
        },
      }),
      (prisma as any).calendarEvent.findMany({
        where: { userId, startAt: { gte: from, lte: to } },
        orderBy: { startAt: 'asc' },
      }).catch(() => []),
    ])

    const events = [
      ...candidates.map(c => ({
        kind: 'interview' as const,
        candidateId: c.id,
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Candidate',
        email: c.email,
        vacancyTitle: c.vacancy?.title || null,
        interviewAt: c.interviewAt,
        durationMinutes: c.interviewDuration || 30,
        location: c.interviewLocation,
        status: c.status,
      })),
      ...personal.map((e: any) => ({
        kind: 'personal' as const,
        eventId: e.id,
        name: e.title,
        vacancyTitle: null,
        interviewAt: e.startAt,
        durationMinutes: e.durationMinutes || 30,
        location: e.location,
        notes: e.notes,
        status: 'personal',
      })),
    ].sort((a, b) => new Date(a.interviewAt as any).getTime() - new Date(b.interviewAt as any).getTime())

    return NextResponse.json({ events })
  } catch (e: any) {
    console.error('[calendar] failed:', e?.message || e)
    return NextResponse.json({ events: [] })
  }
}

// Create a personal calendar event (not tied to a candidate).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const userId = (session.user as any).id
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const { title, startAt, durationMinutes, location, notes } = body
  if (!title || !startAt) return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  const start = new Date(startAt)
  if (isNaN(start.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

  try {
    const ev = await (prisma as any).calendarEvent.create({
      data: {
        title: String(title).slice(0, 200),
        startAt: start,
        // Clamp to a sane 5min-24h range so a crafted huge/float value can't
        // overflow Postgres int4 and 500 the request.
        durationMinutes: Math.min(Math.max(Math.round(Number(durationMinutes)) || 30, 5), 1440),
        location: location ? String(location).slice(0, 300) : null,
        notes: notes ? String(notes).slice(0, 1000) : null,
        userId,
      },
    })
    return NextResponse.json({ success: true, event: ev })
  } catch (e: any) {
    console.error('[calendar] create failed:', e?.message || e)
    return NextResponse.json({ error: 'Could not create event' }, { status: 500 })
  }
}
