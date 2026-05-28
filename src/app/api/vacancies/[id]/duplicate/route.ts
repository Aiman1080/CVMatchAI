// Duplicate a vacancy — creates a copy with "Copy of " prefix, active status,
// and no candidates. Respects plan limits.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getPlanLimits } from '@/lib/plans'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'

  try {
    // Ownership check
    const original = await prisma.vacancy.findFirst({
      where: isAdmin ? { id } : { id, userId },
    })
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Plan limit check
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true } })
    const limits = getPlanLimits(dbUser?.subscription || 'free')
    if (limits.maxVacancies !== Infinity) {
      const count = await prisma.vacancy.count({ where: { userId } })
      if (count >= limits.maxVacancies) {
        return NextResponse.json(
          { error: `Free plan limited to ${limits.maxVacancies} vacancies. Upgrade to Pro for unlimited.`, upgrade: true },
          { status: 403 },
        )
      }
    }

    const duplicate = await prisma.vacancy.create({
      data: {
        title: `Copy of ${original.title}`,
        company: original.company,
        department: original.department,
        location: original.location,
        type: original.type,
        description: original.description,
        requirements: original.requirements,
        niceToHave: original.niceToHave,
        salary: original.salary,
        language: original.language,
        status: 'active',
        userId,
      },
    })

    return NextResponse.json(duplicate, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to duplicate vacancy' }, { status: 500 })
  }
}
