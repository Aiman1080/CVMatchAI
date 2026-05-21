// Removes duplicate Candidate rows for the current user.
// A duplicate is any row that shares the same sender email with an older row.
// Keeps the newest record, deletes the rest.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  // Fetch all candidates for this user ordered newest first
  const all = await prisma.candidate.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true },
  })

  const seenEmails = new Set<string>()
  const toDelete: string[] = []

  for (const c of all) {
    if (!c.email) continue
    if (seenEmails.has(c.email)) {
      toDelete.push(c.id)
    } else {
      seenEmails.add(c.email)
    }
  }

  if (toDelete.length === 0) return NextResponse.json({ deleted: 0 })

  await prisma.emailScan.deleteMany({ where: { candidateId: { in: toDelete } } })
  await prisma.candidate.deleteMany({ where: { id: { in: toDelete } } })

  return NextResponse.json({ deleted: toDelete.length })
}
