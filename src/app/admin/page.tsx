import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { AdminClient } from '@/components/admin/AdminClient'
import { getAiUsageStats } from '@/lib/ai-usage'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // Weekly signup counts for growth chart (last 4 weeks)
  const weekBoundaries = Array.from({ length: 4 }, (_, i) => {
    const end = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { start, end, label: `W-${i}` }
  }).reverse()

  const [
    users, tickets, subscriptions, counts,
    aiAnalysesCount, integrationsCount, emailInboxesCount,
    candidateStatusDist, latestVacancies,
    newUsersThisWeek, candidatesThisWeek, candidatesToday,
    integrationsByPlatform, candidatesBySource,
    activeVacanciesCount,
    activeToday,
    weeklySignups,
    recentActivity,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, company: true, role: true,
        subscription: true, subscriptionEnd: true,
        suspended: true, createdAt: true, lastSeenAt: true,
        _count: { select: { vacancies: true, candidates: true, supportTickets: true } },
      },
    }),
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, email: true, company: true, subscription: true } } },
    }),
    prisma.user.groupBy({ by: ['subscription'], _count: true }),
    Promise.all([
      prisma.user.count(),
      prisma.vacancy.count(),
      prisma.candidate.count(),
      prisma.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
    ]).then(([u, v, c, t]) => ({ users: u, vacancies: v, candidates: c, openTickets: t })),
    prisma.candidate.count({ where: { analyzedAt: { not: null } } }),
    prisma.integration.count(),
    prisma.emailInbox.count(),
    prisma.candidate.groupBy({ by: ['status'], _count: true }),
    prisma.vacancy.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, createdAt: true, _count: { select: { candidates: true } } },
    }),
    prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.candidate.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.candidate.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.integration.groupBy({ by: ['platform'], _count: true }),
    prisma.candidate.groupBy({ by: ['source'], _count: true }),
    prisma.vacancy.count({ where: { status: 'active' } }),
    // Active today: users seen in last 24h
    prisma.user.count({ where: { lastSeenAt: { gte: oneDayAgo } } }),
    // Weekly signups for growth chart
    Promise.all(
      weekBoundaries.map(w =>
        prisma.user.count({ where: { createdAt: { gte: w.start, lt: w.end } } })
          .then(count => ({ label: w.label, start: w.start.toISOString(), end: w.end.toISOString(), count }))
      )
    ),
    // Recent activity: last 10 events across new users, new vacancies, and new analyses
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
  ])

  const aiUsageStats = await getAiUsageStats().catch(() => null)

  // Database size estimation (row counts)
  let aiLogCount = 0
  try { aiLogCount = await (prisma as any).aiUsageLog.count() } catch {}

  const dbStats = {
    users: counts.users,
    vacancies: counts.vacancies,
    candidates: counts.candidates,
    notifications: await prisma.notification.count().catch(() => 0),
    activities: await prisma.candidateActivity.count().catch(() => 0),
    emailScans: await prisma.emailScan.count().catch(() => 0),
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
