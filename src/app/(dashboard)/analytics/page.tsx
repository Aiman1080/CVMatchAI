import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { AnalyticsClient } from '@/components/dashboard/AnalyticsClient'
import { UpgradePrompt } from '@/components/dashboard/UpgradePrompt'
import { getPlanLimits } from '@/lib/plans'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true } })
    : null
  const limits = getPlanLimits(dbUser?.subscription || 'free')

  if (!limits.analytics) {
    return (
      <div>
        <Header title="Analytics" description="Recruitment performance overview" />
        <div className="p-8">
          <UpgradePrompt
            feature="Analytics — Fonctionnalité Pro"
            description="Visualisez vos performances de recrutement, suivez vos scores de match, analysez vos sources de candidats et optimisez votre processus. Disponible à partir du plan Pro."
          />
        </div>
      </div>
    )
  }

  const where = isAdmin ? {} : { userId }
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [candidates, vacancies, recentCandidates] = await Promise.all([
    prisma.candidate.findMany({ where, select: { matchScore: true, status: true, source: true, createdAt: true, language: true }, orderBy: { createdAt: 'asc' } }),
    prisma.vacancy.findMany({ where, select: { title: true, createdAt: true, _count: { select: { candidates: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.candidate.findMany({
      where: { ...where, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, matchScore: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
  const candidatesOverTime = last30Days.map(day => ({
    date: day.slice(5), // MM-DD
    count: recentCandidates.filter(c => c.createdAt.toISOString().startsWith(day)).length,
  }))

  return (
    <div>
      <Header title="Analytics" description="Recruitment performance overview" />
      <div className="p-8"><AnalyticsClient candidates={candidates} vacancies={vacancies} candidatesOverTime={candidatesOverTime} /></div>
    </div>
  )
}
