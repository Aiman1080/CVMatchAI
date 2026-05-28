import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const [user, candidates, vacancies] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, company: true, role: true, subscription: true, createdAt: true },
      }),
      prisma.candidate.findMany({
        where: { userId },
        include: { vacancy: { select: { title: true, company: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vacancy.findMany({
        where: { userId },
        select: { id: true, title: true, company: true, location: true, type: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      account: user,
      vacancies,
      candidates: candidates.map(c => ({
        ...c,
        cvContent: c.cvContent ? '[CV text — omitted for file size]' : null,
        motivationText: c.motivationText ? '[Motivation text — omitted for file size]' : null,
      })),
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="deltamatch-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
