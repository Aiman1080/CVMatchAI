import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { CandidateDetailClient } from '@/components/dashboard/CandidateDetailClient'

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  if (!userId) redirect('/login')

  const { id } = await params

  // Admins can see all candidates; recruiters only their own.
  const candidate = await prisma.candidate.findFirst({
    where: isAdmin ? { id } : { id, userId },
    include: { vacancy: true, emailSource: true },
  }).catch(() => null)

  if (!candidate) notFound()

  const fullName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || 'Candidate'
  return (
    <div>
      <Header title={fullName} description={candidate.vacancy?.title || 'Candidate Profile'} />
      <div className="p-4 sm:p-8"><CandidateDetailClient candidate={candidate} /></div>
    </div>
  )
}
