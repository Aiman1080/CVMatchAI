import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Admin-only endpoint — any non-admin request is rejected with 401
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  let users = 0, vacancies = 0, candidates = 0, subscriptions: any = []
  try {
    ;[users, vacancies, candidates] = await Promise.all([
      prisma.user.count(), prisma.vacancy.count(), prisma.candidate.count(),
    ])
    // groupBy returns the count per subscription tier for the admin dashboard pie chart
    subscriptions = await prisma.user.groupBy({ by: ['subscription'], _count: true })
  } catch {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
  return NextResponse.json({ users, vacancies, candidates, subscriptions })
}
