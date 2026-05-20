import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { AnalyticsClient } from '@/components/dashboard/AnalyticsClient'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const where = isAdmin ? {} : { userId }
  const [candidates, vacancies] = await Promise.all([
    prisma.candidate.findMany({ where, select: { matchScore: true, status: true, source: true, createdAt: true, language: true }, orderBy: { createdAt: 'asc' } }),
    prisma.vacancy.findMany({ where, select: { title: true, createdAt: true, _count: { select: { candidates: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ])
  return (
    <div>
      <Header title="Analytics" description="Recruitment performance overview" />
      <div className="p-8"><AnalyticsClient candidates={candidates} vacancies={vacancies} /></div>
    </div>
  )
}
