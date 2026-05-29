import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { VacancyDetailClient } from '@/components/dashboard/VacancyDetailClient'
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'

export default async function VacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const { id } = await params
  const vacancy = await prisma.vacancy.findFirst({
    where: { id, userId },
    include: { candidates: { orderBy: { matchScore: 'desc' }, include: { vacancy: { select: { title: true } } } } },
  })
  if (!vacancy) notFound()
  // Export is a Pro-only feature — compute server-side so the client can't just
  // render the buttons (the export helpers run entirely client-side otherwise).
  const isAdmin = (session.user as any).role === 'admin'
  const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
  const canExport = isAdmin || getPlanLimits(getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null)).export
  return (
    <div>
      <Header title={vacancy.title} description={`${vacancy.company} · ${vacancy.location || 'Remote'} · ${vacancy.candidates.length} candidates`} />
      <div className="p-4 sm:p-8"><VacancyDetailClient vacancy={vacancy} canExport={canExport} /></div>
    </div>
  )
}
