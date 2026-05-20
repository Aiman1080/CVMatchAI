import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { CandidatesClient } from '@/components/dashboard/CandidatesClient'

export default async function CandidatesPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const isAdmin = (session?.user as any)?.role === 'admin'
  const candidates = await prisma.candidate.findMany({
    where: isAdmin ? {} : { userId },
    include: { vacancy: { select: { title: true, company: true } } },
    orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
  })
  return (
    <div>
      <Header title="Candidates" description={`${candidates.length} candidate${candidates.length !== 1 ? 's' : ''} in your pipeline`} />
      <div className="p-8"><CandidatesClient initialCandidates={candidates} /></div>
    </div>
  )
}
