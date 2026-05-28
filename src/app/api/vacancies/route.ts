// Vacancy CRUD list endpoint — GET returns the user's vacancies with candidate counts,
// POST creates a new vacancy after Zod validation.
// The vacancy title + description + requirements drive the AI match scoring.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'
import { isDemoAccount } from '@/lib/demo-guard'

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  company: z.string().min(1, 'Company is required'),
  department: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']).default('full-time'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
  niceToHave: z.string().optional(),
  salary: z.string().optional(),
  language: z.string().default('nl'),
})

// Admins can see all vacancies across all users; recruiters only see their own
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  if (!userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  // Stale-JWT guard: if the user record was deleted, return 401 so the client can re-auth
  if (!isAdmin) {
    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }).catch(() => null)
    if (!userExists) return NextResponse.json({ error: 'Session invalid — please sign in again' }, { status: 401 })
  }

  try {
    const vacancies = await prisma.vacancy.findMany({
      where: isAdmin ? {} : { userId },
      include: { _count: { select: { candidates: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vacancies)
  } catch (e: any) {
    console.error('[API /api/vacancies GET] Failed:', e?.message || e)
    return NextResponse.json({ error: 'Failed to load vacancies' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  try {
    const body = await req.json()
    const data = schema.parse(body)
    const userId = (session.user as any).id
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
    const effectiveSubscription = getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null)
    const limits = getPlanLimits(effectiveSubscription)
    if (limits.maxVacancies !== Infinity) {
      const count = await prisma.vacancy.count({ where: { userId } })
      if (count >= limits.maxVacancies) {
        return NextResponse.json({ error: `Free plan limited to ${limits.maxVacancies} vacancies. Upgrade to Pro for unlimited.`, upgrade: true }, { status: 403 })
      }
    }
    const vacancy = await prisma.vacancy.create({ data: { ...data, userId } })
    return NextResponse.json(vacancy, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create vacancy' }, { status: 500 })
  }
}
