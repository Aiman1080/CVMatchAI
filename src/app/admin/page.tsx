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

  const [users, tickets, subscriptions, counts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, company: true,
        role: true, subscription: true, subscriptionEnd: true,
        suspended: true, createdAt: true,
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
  ])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header title="Admin Panel" description="Platform management & monitoring" />
        <div className="p-8">
          <AdminClient users={users as any} tickets={tickets as any} subscriptions={subscriptions} counts={counts} hasAiKey={!!process.env.ANTHROPIC_API_KEY} />
        </div>
      </main>
    </div>
  )
}
