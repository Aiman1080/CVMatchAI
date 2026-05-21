import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Returns the current user's stats and subscription tier — used by the dashboard header
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const [vacancyCount, candidateCount] = await Promise.all([
    prisma.vacancy.count({ where: { userId } }),
    prisma.candidate.count({ where: { userId } }),
  ])
  return NextResponse.json({ vacancyCount, candidateCount, subscription: (session.user as any).subscription })
}

// Only `name` and `company` can be updated — email and role changes require admin
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const body = await req.json()
  const allowed = ['name', 'company']
  const data: any = {}
  for (const key of allowed) { if (body[key] !== undefined) data[key] = body[key] }
  const user = await prisma.user.update({ where: { id: userId }, data, select: { id: true, name: true, email: true, company: true, role: true, subscription: true, createdAt: true } })
  return NextResponse.json(user)
}
