import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentCandidates } from '@/components/dashboard/RecentCandidates'
import { RecentVacancies } from '@/components/dashboard/RecentVacancies'
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel'
import { UpcomingInterviews } from '@/components/dashboard/UpcomingInterviews'
import { CalendarWidget } from '@/components/dashboard/CalendarWidget'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getEffectiveSubscription } from '@/lib/plans'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'

  if (!userId) redirect('/login')

  // Update lastSeenAt — non-blocking, never throws
  prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } }).catch(() => {})

  const where = isAdmin ? {} : { userId }

  // Wrap every query so a single failure doesn't crash the dashboard
  const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback)

  const [
    dbUser,
    vacancyCount,
    candidateCount,
    shortlistedCount,
    avgScore,
    inboxCount,
    vacanciesThisWeek,
    candidatesThisWeek,
    recentCandidates,
    recentVacancies,
  ] = await Promise.all([
    safe(prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } }), null),
    safe(prisma.vacancy.count({ where }), 0),
    safe(prisma.candidate.count({ where }), 0),
    safe(prisma.candidate.count({ where: { ...where, status: 'shortlisted' } }), 0),
    safe(prisma.candidate.aggregate({ where, _avg: { matchScore: true } }), { _avg: { matchScore: null } } as any),
    safe(prisma.emailInbox.count({ where: isAdmin ? {} : { userId } }), 0),
    safe(prisma.vacancy.count({ where: { ...where, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }), 0),
    safe(prisma.candidate.count({ where: { ...where, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }), 0),
    safe(
      prisma.candidate.findMany({ where, include: { vacancy: { select: { title: true } } }, orderBy: { createdAt: 'desc' }, take: 5 }),
      [] as any[],
    ),
    safe(
      prisma.vacancy.findMany({ where, include: { _count: { select: { candidates: true } } }, orderBy: { createdAt: 'desc' }, take: 4 }),
      [] as any[],
    ),
  ])

  const effectiveSubscription = getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null)

  const stats = {
    vacancies: vacancyCount,
    candidates: candidateCount,
    shortlisted: shortlistedCount,
    avgScore: Math.round((avgScore as any)?._avg?.matchScore || 0),
    vacanciesThisWeek,
    candidatesThisWeek,
  }

  const onboarding = {
    hasVacancy: vacancyCount > 0,
    hasCandidate: candidateCount > 0,
    hasEmail: inboxCount > 0,
  }

  return (
    <div>
      <DashboardGreeting firstName={session?.user?.name?.split(' ')[0] || ''} />
      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <DashboardClient onboarding={onboarding} subscription={effectiveSubscription} />
        <CalendarWidget />
        <DashboardStats stats={stats} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <div className="xl:col-span-2"><RecentCandidates candidates={recentCandidates} /></div>
          <div className="space-y-4 sm:space-y-6">
            <UpcomingInterviews />
            <AIInsightsPanel candidates={recentCandidates.map((c: any) => ({ name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), matchScore: c.matchScore || 0, vacancyTitle: c.vacancy?.title || '' }))} totalCandidates={candidateCount} avgScore={stats.avgScore} />
          </div>
        </div>
        <RecentVacancies vacancies={recentVacancies} />
      </div>
    </div>
  )
}
