// Merge an ATS-imported vacancy INTO the current vacancy.
// Moves all candidates from the target (ATS) vacancy, copies externalId/externalSource,
// then deletes the now-empty target vacancy.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  try {
    const body = await req.json()
    const { targetVacancyId } = body
    if (!targetVacancyId) {
      return NextResponse.json({ error: 'targetVacancyId is required' }, { status: 400 })
    }

    // Load the current vacancy (the one we are merging INTO)
    const current = await prisma.vacancy.findFirst({
      where: isAdmin ? { id } : { id, userId },
    })
    if (!current) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 })

    // Load the target vacancy (ATS-imported, will be deleted after merge)
    const target = await prisma.vacancy.findFirst({
      where: isAdmin ? { id: targetVacancyId } : { id: targetVacancyId, userId },
    })
    if (!target) return NextResponse.json({ error: 'Target vacancy not found' }, { status: 404 })

    if (!target.externalId) {
      return NextResponse.json({ error: 'Target vacancy has no ATS link' }, { status: 400 })
    }

    // Move all candidates from target to current
    await prisma.candidate.updateMany({
      where: { vacancyId: targetVacancyId },
      data: { vacancyId: id },
    })

    // Copy the externalId/externalSource from the target to the current vacancy
    await prisma.vacancy.update({
      where: { id },
      data: {
        externalId: target.externalId,
        externalSource: target.externalSource,
      },
    })

    // Delete the now-empty target vacancy
    await prisma.vacancy.delete({
      where: { id: targetVacancyId },
    })

    // Return the updated vacancy with candidates
    const updated = await prisma.vacancy.findUnique({
      where: { id },
      include: { candidates: { orderBy: { matchScore: 'desc' } } },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed to merge vacancies' }, { status: 500 })
  }
}
