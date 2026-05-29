import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'
import { deleteDocuments } from '@/lib/storage'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const userId = (session.user as any).id

  try {
    const candidates = await prisma.candidate.findMany({
      where: { userId },
      select: { id: true, cvStoragePath: true, motivationStoragePath: true },
    })
    const ids = candidates.map(c => c.id)

    if (ids.length === 0) return NextResponse.json({ deleted: 0 })

    await prisma.$transaction([
      prisma.emailScan.deleteMany({ where: { candidateId: { in: ids } } }),
      prisma.candidate.deleteMany({ where: { userId } }),
    ])

    // Best-effort: remove their binaries from Supabase Storage.
    await deleteDocuments(candidates.flatMap(c => [c.cvStoragePath, c.motivationStoragePath]))

    return NextResponse.json({ deleted: ids.length })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
