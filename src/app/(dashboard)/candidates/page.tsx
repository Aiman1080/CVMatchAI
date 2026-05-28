import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { CandidatesClient } from '@/components/dashboard/CandidatesClient'

const PAGE_SIZE = 30

export default async function CandidatesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const subscription = (session?.user as any)?.subscription || 'free'
  const isPro = subscription === 'pro' || subscription === 'demo_pro' || isAdmin
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
  return (
    <div>
      <Header title="Candidates" description={`${total} candidate${total !== 1 ? 's' : ''} in your pipeline`} />
      <div className="p-8"><CandidatesClient initialCandidates={candidates} initialTotal={total} isPro={isPro} /></div>
    </div>
  )
}
