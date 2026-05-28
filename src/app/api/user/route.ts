import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { isDemoAccount } from '@/lib/demo-guard'

const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)

// Returns the current user's stats and subscription tier — used by the dashboard header
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  try {
    const [vacancyCount, candidateCount] = await Promise.all([
      prisma.vacancy.count({ where: { userId } }),
      prisma.candidate.count({ where: { userId } }),
    ])
    return NextResponse.json({ vacancyCount, candidateCount, subscription: (session.user as any).subscription })
  } catch {
    return NextResponse.json({ error: 'Failed to load user stats' }, { status: 500 })
  }
}

// Only `name` and `company` can be updated — email and role changes require admin.
// Password change requires verifying the current password first.
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const userId = (session.user as any).id
  try {
    const body = await req.json()

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.company !== undefined) data.company = body.company
    if (body.image !== undefined) data.image = body.image || null
    if (body.emailSignature !== undefined) data.emailSignature = body.emailSignature || null

    if (body.newPassword) {
      if (!body.currentPassword) return NextResponse.json({ error: 'Current password required' }, { status: 400 })
      try {
        passwordSchema.parse(body.newPassword)
      } catch (e) {
        if (e instanceof z.ZodError) {
          return NextResponse.json({ error: 'Password must be at least 8 characters and contain an uppercase letter, a number, and a special character' }, { status: 400 })
        }
      }
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
      const valid = dbUser?.password && await bcrypt.compare(body.currentPassword, dbUser.password)
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
      data.password = await bcrypt.hash(body.newPassword, 12)
    }

    const user = await prisma.user.update({ where: { id: userId }, data, select: { id: true, name: true, email: true, company: true, role: true, subscription: true, createdAt: true } })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
