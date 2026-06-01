// Removes duplicate Candidate rows for the current user.
// A duplicate = same email within the SAME vacancy. Among duplicates we keep the
// one with the BEST matchScore (ties → the most recent) and delete the rest.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'
import { deleteDocuments } from '@/lib/storage'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Note: no admin role check - cleanup is scoped to the calling user's own duplicates
  if (isDemoAccount(session.user?.email))
    return NextResponse.json({ error: 'Demo accounts cannot perform this action' }, { status: 403 })
  const userId = (session.user as any).id

  try {
    const all = await prisma.candidate.findMany({
      where: { userId },
      select: { id: true, email: true, vacancyId: true, matchScore: true, createdAt: true, cvStoragePath: true, motivationStoragePath: true },
    })

    // Group by (email + vacancyId) - duplicates only count within the same vacancy.
    const groups = new Map<string, typeof all>()
    for (const c of all) {
      if (!c.email) continue
      const key = `${c.email.toLowerCase()}::${c.vacancyId}`
      const g = groups.get(key)
      if (g) g.push(c); else groups.set(key, [c])
    }

    const toDelete: string[] = []
    const pathsToDelete: Array<string | null> = []
    for (const group of groups.values()) {
      if (group.length < 2) continue
      // Keep the best: highest matchScore, then most recent on ties.
      const keep = group.reduce((best, c) => {
        const bs = best.matchScore ?? -1, cs = c.matchScore ?? -1
        if (cs > bs) return c
        if (cs === bs && c.createdAt > best.createdAt) return c
        return best
      })
      for (const c of group) {
        if (c.id === keep.id) continue
        toDelete.push(c.id)
        pathsToDelete.push(c.cvStoragePath, c.motivationStoragePath)
      }
    }

    if (toDelete.length === 0) return NextResponse.json({ deleted: 0 })

    await prisma.$transaction([
      prisma.emailScan.deleteMany({ where: { candidateId: { in: toDelete } } }),
      prisma.candidate.deleteMany({ where: { id: { in: toDelete } } }),
    ])

    // Best-effort: remove the duplicates' binaries from Supabase Storage.
    await deleteDocuments(pathsToDelete)

    return NextResponse.json({ deleted: toDelete.length })
  } catch {
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
