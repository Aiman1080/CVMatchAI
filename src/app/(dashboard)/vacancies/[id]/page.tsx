import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { VacancyDetailClient } from '@/components/dashboard/VacancyDetailClient'

export default async function VacancyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const { id } = await params
  const vacancy = await prisma.vacancy.findUnique({
    where: { id },
    include: { candidates: { orderBy: { matchScore: 'desc' }, include: { vacancy: { select: { title: true } } } } },
  })
  if (!vacancy) notFound()
  return (
    <div>
      <Header title={vacancy.title} description={`${vacancy.company} · ${vacancy.location || 'Remote'} · ${vacancy.candidates.length} candidates`} />
      <div className="p-8"><VacancyDetailClient vacancy={vacancy} /></div>
    </div>
  )
}
