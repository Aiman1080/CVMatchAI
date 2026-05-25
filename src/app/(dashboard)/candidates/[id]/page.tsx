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
  const { id } = await params
  const candidate = await prisma.candidate.findFirst({ where: { id, userId }, include: { vacancy: true, emailSource: true } })
  if (!candidate) notFound()
  return (
    <div>
      <Header title={`${candidate.firstName} ${candidate.lastName}`} description={candidate.vacancy?.title || 'Candidate Profile'} />
      <div className="p-8"><CandidateDetailClient candidate={candidate} /></div>
    </div>
  )
}
