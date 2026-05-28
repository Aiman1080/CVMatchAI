import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { CompareClient } from '@/components/dashboard/CompareClient'

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const { ids: idsParam } = await searchParams
  if (!idsParam) redirect('/candidates')

  const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
  if (ids.length < 2 || ids.length > 3) redirect('/candidates')

  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  const candidates = await prisma.candidate.findMany({
    where: isAdmin ? { id: { in: ids } } : { id: { in: ids }, userId },
    include: { vacancy: { select: { title: true, company: true } } },
  })

  // If not all candidates found, redirect back
  if (candidates.length !== ids.length) redirect('/candidates')

  // Preserve requested order
  const ordered = ids.map(id => candidates.find(c => c.id === id)).filter(Boolean) as typeof candidates

  return (
    <div>
      <Header
        title="Compare Candidates"
        description={`Side-by-side comparison of ${ordered.length} candidates`}
      />
      <div className="p-4 sm:p-8">
        <CompareClient candidates={ordered} />
      </div>
    </div>
  )
}
