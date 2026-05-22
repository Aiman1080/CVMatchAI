import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { AdminClient } from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    users, tickets, subscriptions, counts,
    aiAnalysesCount, integrationsCount, emailInboxesCount,
    candidateStatusDist, latestVacancies,
    newUsersThisWeek, candidatesThisWeek, candidatesToday,
    integrationsByPlatform, candidatesBySource,
    activeVacanciesCount,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, role: true, subscription: true, subscriptionEnd: true,
        suspended: true, createdAt: true,
        _count: { select: { vacancies: true, candidates: true, supportTickets: true } },
      },
    }),
    prisma.supportTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { subscription: true } } },
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
  ])

  return (
    <div>
      <Header title="Admin Panel" description="Platform management & monitoring" />
      <div className="p-8">
        <AdminClient
          users={users as any}
          tickets={tickets as any}
          subscriptions={subscriptions}
          counts={counts}
          hasAiKey={!!process.env.ANTHROPIC_API_KEY}
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
        />
      </div>
    </div>
  )
}
