import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { VacanciesClient } from '@/components/dashboard/VacanciesClient'

export default async function VacanciesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const vacancies = await prisma.vacancy.findMany({
    where: isAdmin ? {} : { userId },
    include: { _count: { select: { candidates: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return (
    <div>
      <Header title="Vacancies" description={`${vacancies.length} job posting${vacancies.length !== 1 ? 's' : ''}`} />
      <div className="p-8"><VacanciesClient initialVacancies={vacancies} /></div>
    </div>
  )
}
