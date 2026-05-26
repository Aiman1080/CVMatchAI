import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentCandidates } from '@/components/dashboard/RecentCandidates'
import { RecentVacancies } from '@/components/dashboard/RecentVacancies'
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'

  // If no userId, the session JWT is stale — update lastSeenAt for valid users
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {})
  }

  const where = userId ? (isAdmin ? {} : { userId }) : {}

  const [vacancyCount, candidateCount, shortlistedCount, avgScore, inboxCount, vacanciesThisWeek, candidatesThisWeek] = await Promise.all([
    prisma.vacancy.count({ where }),
    prisma.candidate.count({ where }),
    prisma.candidate.count({ where: { ...where, status: 'shortlisted' } }),
    prisma.candidate.aggregate({ where, _avg: { matchScore: true } }),
    prisma.emailInbox.count({ where: isAdmin ? {} : { userId } }),
    prisma.vacancy.count({ where: { ...where, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    prisma.candidate.count({ where: { ...where, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ])

  const recentCandidates = await prisma.candidate.findMany({
    where, include: { vacancy: { select: { title: true } } },
    orderBy: { createdAt: 'desc' }, take: 5,
  })

  const recentVacancies = await prisma.vacancy.findMany({
    where, include: { _count: { select: { candidates: true } } },
    orderBy: { createdAt: 'desc' }, take: 4,
  })

  const stats = {
    vacancies: vacancyCount, candidates: candidateCount,
    shortlisted: shortlistedCount, avgScore: Math.round(avgScore._avg.matchScore || 0),
    vacanciesThisWeek, candidatesThisWeek,
  }

  const onboarding = {
    hasVacancy: vacancyCount > 0,
    hasCandidate: candidateCount > 0,
    hasEmail: inboxCount > 0,
  }

  return (
    <div>
      <DashboardGreeting firstName={session?.user?.name?.split(' ')[0] || ''} />
      <div className="p-8 space-y-8">
        <DashboardClient onboarding={onboarding} subscription={(session?.user as any)?.subscription || 'free'} />
        <DashboardStats stats={stats} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><RecentCandidates candidates={recentCandidates} /></div>
          <div><AIInsightsPanel candidates={recentCandidates.map(c => ({ name: `${c.firstName} ${c.lastName}`, matchScore: c.matchScore || 0, vacancyTitle: c.vacancy?.title || '' }))} totalCandidates={candidateCount} avgScore={stats.avgScore} /></div>
        </div>
        <RecentVacancies vacancies={recentVacancies} />
      </div>
    </div>
  )
}
