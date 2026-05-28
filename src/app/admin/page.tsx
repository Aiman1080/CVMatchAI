import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { AdminClient } from '@/components/admin/AdminClient'
import { getAiUsageStats } from '@/lib/ai-usage'

const safe = async <T,>(p: Promise<T>, fallback: T, label: string): Promise<T> => {
  try {
    return await p
  } catch (e: any) {
    console.error(`[AdminPage] ${label} failed:`, e?.message || e)
    return fallback
  }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const weekBoundaries = Array.from({ length: 4 }, (_, i) => {
    const end = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { start, end, label: `W-${i}` }
  }).reverse()

  // Each query individually wrapped — a single Prisma error no longer crashes the whole admin page
  const users = await safe(
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, company: true, role: true,
        subscription: true, subscriptionEnd: true,
        suspended: true, createdAt: true, lastSeenAt: true,
        _count: { select: { vacancies: true, candidates: true, supportTickets: true } },
      },
    }),
    [] as any[],
    'users'
  )

  const tickets = await safe(
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true, company: true, subscription: true } } },
    }),
    [] as any[],
    'tickets'
  )

  const subscriptions = await safe(
    prisma.user.groupBy({ by: ['subscription'], _count: true }),
    [] as any[],
    'subscriptions'
  )

  const counts = await safe(
    Promise.all([
      prisma.user.count(),
      prisma.vacancy.count(),
      prisma.candidate.count(),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    ]).then(([u, v, c, t]) => ({ users: u, vacancies: v, candidates: c, openTickets: t })),
    { users: 0, vacancies: 0, candidates: 0, openTickets: 0 },
    'counts'
  )

  const aiAnalysesCount = await safe(prisma.candidate.count({ where: { analyzedAt: { not: null } } }), 0, 'aiAnalysesCount')
  const integrationsCount = await safe(prisma.integration.count(), 0, 'integrationsCount')
  const emailInboxesCount = await safe(prisma.emailInbox.count(), 0, 'emailInboxesCount')
  const candidateStatusDist = await safe(prisma.candidate.groupBy({ by: ['status'], _count: true }), [] as any[], 'candidateStatusDist')
  const latestVacancies = await safe(
    prisma.vacancy.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, createdAt: true, _count: { select: { candidates: true } } },
    }),
    [] as any[],
    'latestVacancies'
  )
  const newUsersThisWeek = await safe(prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }), 0, 'newUsersThisWeek')
  const candidatesThisWeek = await safe(prisma.candidate.count({ where: { createdAt: { gte: oneWeekAgo } } }), 0, 'candidatesThisWeek')
  const candidatesToday = await safe(prisma.candidate.count({ where: { createdAt: { gte: oneDayAgo } } }), 0, 'candidatesToday')
  const integrationsByPlatform = await safe(prisma.integration.groupBy({ by: ['platform'], _count: true }), [] as any[], 'integrationsByPlatform')
  const candidatesBySource = await safe(prisma.candidate.groupBy({ by: ['source'], _count: true }), [] as any[], 'candidatesBySource')
  const activeVacanciesCount = await safe(prisma.vacancy.count({ where: { status: 'active' } }), 0, 'activeVacanciesCount')
  const activeToday = await safe(prisma.user.count({ where: { lastSeenAt: { gte: oneDayAgo } } }), 0, 'activeToday')

  const weeklySignups = await safe(
    Promise.all(
      weekBoundaries.map(w =>
        prisma.user.count({ where: { createdAt: { gte: w.start, lt: w.end } } })
          .then(count => ({ label: w.label, start: w.start.toISOString(), end: w.end.toISOString(), count }))
      )
    ),
    [] as any[],
    'weeklySignups'
  )

  const recentActivity = await safe(
    Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }).then(rows => rows.map(r => ({
        type: 'new_user' as const,
        description: `${r.name || r.email || 'Unknown'} signed up`,
        createdAt: r.createdAt.toISOString(),
      }))),
      prisma.vacancy.findMany({
        orderBy: { createdAt: 'desc' }, take: 5,
        select: { title: true, createdAt: true, user: { select: { name: true, email: true } } },
      }).then(rows => rows.map(r => ({
        type: 'new_vacancy' as const,
        description: `${r.user.name || r.user.email || 'Unknown'} created vacancy "${r.title}"`,
        createdAt: r.createdAt.toISOString(),
      }))),
      prisma.candidate.findMany({
        orderBy: { analyzedAt: 'desc' }, take: 5,
        where: { analyzedAt: { not: null } },
        select: { firstName: true, lastName: true, analyzedAt: true, vacancy: { select: { title: true } } },
      }).then(rows => rows.map(r => ({
        type: 'analysis' as const,
        description: `CV analyzed: ${r.firstName} ${r.lastName} for "${r.vacancy?.title || 'Unknown'}"`,
        createdAt: (r.analyzedAt ?? new Date()).toISOString(),
      }))),
    ]).then(([u, v, a]) =>
      [...u, ...v, ...a].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
    ),
    [] as any[],
    'recentActivity'
  )

  const aiUsageStats = await getAiUsageStats().catch((e: any) => {
    console.error('[AdminPage] aiUsageStats failed:', e?.message || e)
    return null
  })

  const aiLogCount = await safe((prisma as any).aiUsageLog.count(), 0, 'aiLogCount')
  const notifCount = await safe(prisma.notification.count(), 0, 'notifCount')
  const activityCount = await safe(prisma.candidateActivity.count(), 0, 'activityCount')
  const scanCount = await safe(prisma.emailScan.count(), 0, 'scanCount')

  const dbStats = {
    users: counts.users,
    vacancies: counts.vacancies,
    candidates: counts.candidates,
    notifications: notifCount,
    activities: activityCount,
    emailScans: scanCount,
    aiLogs: aiLogCount,
  }
  const totalRows = Object.values(dbStats).reduce((a, b) => a + b, 0)

  return (
    <div>
      <Header title="Admin Panel" description="Platform management & monitoring" />
      <div className="p-4 sm:p-8">
        <AdminClient
          users={users as any}
          tickets={tickets as any}
          subscriptions={subscriptions}
          counts={counts}
          hasAiKey={!!process.env.GEMINI_API_KEY}
          hasSmtp={!!(process.env.SMTP_HOST && process.env.SMTP_USER)}
          aiAnalysesCount={aiAnalysesCount}
          integrationsCount={integrationsCount}
          emailInboxesCount={emailInboxesCount}
          candidateStatusDist={candidateStatusDist}
          latestVacancies={latestVacancies as any}
          newUsersThisWeek={newUsersThisWeek}
          candidatesThisWeek={candidatesThisWeek}
          candidatesToday={candidatesToday}
          integrationsByPlatform={integrationsByPlatform as any}
          candidatesBySource={candidatesBySource as any}
          activeVacanciesCount={activeVacanciesCount}
          activeToday={activeToday}
          weeklySignups={weeklySignups}
          recentActivity={recentActivity}
          aiUsageStats={aiUsageStats}
          dbStats={{ ...dbStats, totalRows }}
        />
      </div>
    </div>
  )
}
