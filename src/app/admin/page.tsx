import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { AdminClient } from '@/components/admin/AdminClient'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')

  const [users, tickets, subscriptions, counts, aiAnalysesCount, integrationsCount, emailInboxesCount, candidateStatusDist, latestVacancies, onlineCount, activeTodayCount, recentActivity] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, company: true,
        role: true, subscription: true, subscriptionEnd: true,
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
      select: { title: true, company: true, createdAt: true, _count: { select: { candidates: true } } },
    }),
    prisma.user.count({ where: { lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.candidate.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, createdAt: true, analyzedAt: true, status: true,
        user: { select: { name: true, company: true } },
        vacancy: { select: { title: true } },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64">
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
            onlineCount={onlineCount}
            activeTodayCount={activeTodayCount}
            recentActivity={recentActivity as any}
          />
        </div>
      </main>
    </div>
  )
}
