import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [users, vacancies, candidates] = await Promise.all([
    prisma.user.count(), prisma.vacancy.count(), prisma.candidate.count(),
  ])
  const subscriptions = await prisma.user.groupBy({ by: ['subscription'], _count: true })
  return NextResponse.json({ users, vacancies, candidates, subscriptions })
}
