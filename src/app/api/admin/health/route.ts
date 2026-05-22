// Admin health-check endpoint — pings the DB, reports latency, AI key presence,
// and live entity counts. Used by the admin dashboard status panel.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const start = Date.now()
  let dbStatus = 'ok'
  let dbLatencyMs = 0
  try {
    await prisma.$queryRaw`SELECT 1`
    dbLatencyMs = Date.now() - start
  } catch {
    dbStatus = 'error'
  }

  let userCount = 0, vacancyCount = 0, candidateCount = 0, openTickets = 0
  if (dbStatus === 'ok') {
    try {
      ;[userCount, vacancyCount, candidateCount, openTickets] = await Promise.all([
        prisma.user.count(),
        prisma.vacancy.count(),
        prisma.candidate.count(),
        prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      ])
    } catch {
      dbStatus = 'error'
    }
  }

  return NextResponse.json({
    status: dbStatus === 'ok' ? 'healthy' : 'degraded',
    db: { status: dbStatus, latencyMs: dbLatencyMs },
    ai: { status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'demo_mode' },
    counts: { users: userCount, vacancies: vacancyCount, candidates: candidateCount, openTickets },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}
