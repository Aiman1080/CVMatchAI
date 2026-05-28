import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { VacanciesClient } from '@/components/dashboard/VacanciesClient'
import { isDemoAccount } from '@/lib/demo-guard'

// Cap the initial server-rendered list — without this, a user with thousands
// of vacancies would crash the page. The client component handles paging beyond
// this initial batch.
const PAGE_SIZE = 50

export default async function VacanciesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const where = isAdmin ? {} : { userId }
  const [vacancies, totalVacancies] = await Promise.all([
    prisma.vacancy.findMany({
      where,
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    }),
    prisma.vacancy.count({ where }),
  ])

  const cookieStore = await cookies()
  const locale = (cookieStore.get('deltamatch-locale')?.value || 'en') as 'en' | 'nl' | 'fr'
  const translations = {
    en: {
      title: 'Vacancies',
      description: (n: number) => `${n} job posting${n !== 1 ? 's' : ''}`,
    },
    nl: {
      title: 'Vacatures',
      description: (n: number) => `${n} vacature${n !== 1 ? 's' : ''}`,
    },
    fr: {
      title: 'Offres d\'emploi',
      description: (n: number) => `${n} offre${n !== 1 ? 's' : ''} d'emploi`,
    },
  }
  const t = translations[locale] || translations.en

  return (
    <div>
      <Header title={t.title} description={t.description(totalVacancies)} />
      <div className="p-4 sm:p-8"><VacanciesClient initialVacancies={vacancies} isDemo={isDemoAccount(session?.user?.email)} /></div>
    </div>
  )
}
