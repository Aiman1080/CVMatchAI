import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { CandidateDetailClient } from '@/components/dashboard/CandidateDetailClient'

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await getServerSession(authOptions)
  const { id } = await params
  const candidate = await prisma.candidate.findUnique({ where: { id }, include: { vacancy: true } })
  if (!candidate) notFound()
  return (
    <div>
      <Header title={`${candidate.firstName} ${candidate.lastName}`} description={candidate.vacancy?.title || 'Candidate Profile'} />
      <div className="p-8"><CandidateDetailClient candidate={candidate} /></div>
    </div>
  )
}
