// Candidate comparison API — returns full candidate data for 2–3 candidates.
// Used by the comparison page to render side-by-side analysis.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids')
  if (!idsParam) return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })

  const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean)
  if (ids.length < 2 || ids.length > 3) {
    return NextResponse.json({ error: 'Provide 2 or 3 candidate IDs' }, { status: 400 })
  }

  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  try {
    const candidates = await prisma.candidate.findMany({
      where: isAdmin ? { id: { in: ids } } : { id: { in: ids }, userId },
      include: { vacancy: { select: { title: true, company: true } } },
    })

    // Verify all requested candidates were found (ownership check)
    if (candidates.length !== ids.length) {
      return NextResponse.json({ error: 'One or more candidates not found' }, { status: 404 })
    }

    // Return in the same order as requested
    const ordered = ids.map(id => candidates.find(c => c.id === id)!)

    return NextResponse.json({ candidates: ordered })
  } catch {
    return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 })
  }
}
