import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { CandidatesClient } from '@/components/dashboard/CandidatesClient'
import { getEffectiveSubscription } from '@/lib/plans'

const PAGE_SIZE = 30

export default async function CandidatesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
    : null
  const effectiveSubscription = getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null)
  const isPro = effectiveSubscription === 'pro' || effectiveSubscription === 'demo_pro' || isAdmin
  const where = isAdmin ? {} : { userId }
  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: { vacancy: { select: { title: true, company: true } } },
      orderBy: [{ priority: 'desc' }, { liked: 'desc' }, { matchScore: 'desc' }, { createdAt: 'desc' }],
      take: PAGE_SIZE,
    }),
    prisma.candidate.count({ where }),
  ])

  const cookieStore = await cookies()
  const locale = (cookieStore.get('deltamatch-locale')?.value || 'en') as 'en' | 'nl' | 'fr'
  const translations = {
    en: {
      title: 'Candidates',
      description: (n: number) => `${n} candidate${n !== 1 ? 's' : ''} in your pipeline`,
    },
    nl: {
      title: 'Kandidaten',
      description: (n: number) => `${n} kandida${n !== 1 ? 'ten' : 'at'} in je pijplijn`,
    },
    fr: {
      title: 'Candidats',
      description: (n: number) => `${n} candidat${n !== 1 ? 's' : ''} dans votre pipeline`,
    },
  }
  const t = translations[locale] || translations.en

  return (
    <div>
      <Header title={t.title} description={t.description(total)} />
      <div className="p-4 sm:p-8"><CandidatesClient initialCandidates={candidates} initialTotal={total} isPro={isPro} /></div>
    </div>
  )
}
