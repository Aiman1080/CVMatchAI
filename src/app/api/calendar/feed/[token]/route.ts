// Public iCal subscription feed: /api/calendar/feed/[token]
// No session auth - the unguessable token IS the credential (this is how Google/
// Outlook/Apple poll a private calendar URL). Returns text/calendar with the
// user's interviews + personal events, so the whole DeltaMatch calendar shows
// up in their personal agenda and stays auto-synced (read-only, one-way).
import prisma from '@/lib/prisma'
import { buildICSFeed, type FeedEvent } from '@/lib/ics'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!token || token.length < 16) {
    return new Response('Not found', { status: 404 })
  }

  const user = await prisma.user.findUnique({
    where: { calendarFeedToken: token },
    select: { id: true, name: true },
  }).catch(() => null)
  if (!user) return new Response('Not found', { status: 404 })

  // Pull a wide window: 1 year back to 1 year forward.
  const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  const [interviews, personal] = await Promise.all([
    prisma.candidate.findMany({
      where: { userId: user.id, interviewAt: { gte: from, lte: to } },
      select: { id: true, firstName: true, lastName: true, interviewAt: true, interviewDuration: true, interviewLocation: true, vacancy: { select: { title: true } } },
    }).catch(() => []),
    (prisma as any).calendarEvent.findMany({
      where: { userId: user.id, startAt: { gte: from, lte: to } },
      select: { id: true, title: true, startAt: true, durationMinutes: true, location: true, notes: true },
    }).catch(() => []),
  ])

  const events: FeedEvent[] = [
    ...interviews.map((c: any) => ({
      uid: `interview-${c.id}`,
      start: c.interviewAt as Date,
      durationMinutes: c.interviewDuration || 30,
      summary: `Interview - ${`${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Candidate'}${c.vacancy?.title ? ` (${c.vacancy.title})` : ''}`,
      location: c.interviewLocation || undefined,
    })),
    ...personal.map((e: any) => ({
      uid: `event-${e.id}`,
      start: e.startAt as Date,
      durationMinutes: e.durationMinutes || 30,
      summary: e.title,
      description: e.notes || undefined,
      location: e.location || undefined,
    })),
  ]

  const ics = buildICSFeed(events, `DeltaMatch - ${user.name || 'Calendar'}`)
  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="deltamatch.ics"',
      'Cache-Control': 'no-cache, max-age=0',
    },
  })
}
