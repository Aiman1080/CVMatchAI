import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const candidates = await prisma.candidate.findMany({
      where: { userId },
      select: { id: true },
    })
    const ids = candidates.map(c => c.id)

    if (ids.length === 0) return NextResponse.json({ deleted: 0 })

    await prisma.$transaction([
      prisma.emailScan.deleteMany({ where: { candidateId: { in: ids } } }),
      prisma.candidate.deleteMany({ where: { userId } }),
    ])

    return NextResponse.json({ deleted: ids.length })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
