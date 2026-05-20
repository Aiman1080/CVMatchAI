import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentCandidates } from '@/components/dashboard/RecentCandidates'
import { RecentVacancies } from '@/components/dashboard/RecentVacancies'
import { AIInsightsPanel } from '@/components/dashboard/AIInsightsPanel'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const where = isAdmin ? {} : { userId }

  const [vacancyCount, candidateCount, shortlistedCount, avgScore] = await Promise.all([
    prisma.vacancy.count({ where }),
    prisma.candidate.count({ where }),
    prisma.candidate.count({ where: { ...where, status: 'shortlisted' } }),
    prisma.candidate.aggregate({ where, _avg: { matchScore: true } }),
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
  }

  return (
    <div>
      <Header title={`Welcome back, ${session?.user?.name?.split(' ')[0] || 'Recruiter'}`} description="Here's what's happening with your recruitment pipeline" />
      <div className="p-8 space-y-8">
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
