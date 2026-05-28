// Admin user management — GET/PATCH/DELETE a single user.
// Only fields in the allowlist can be changed via PATCH.
// Password is never returned in any response.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'

const USER_SELECT = {
  id: true, name: true, email: true, role: true,
  subscription: true, subscriptionEnd: true, suspended: true,
  company: true, createdAt: true,
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (isDemoAccount(session.user?.email))
    return NextResponse.json({ error: 'Demo accounts cannot perform this action' }, { status: 403 })

  const { id } = await params
  try {
    const body = await req.json()
    const allowed = ['subscription', 'role', 'suspended', 'name', 'company', 'subscriptionEnd']
    const data: Record<string, any> = {}
    for (const key of allowed) if (key in body) data[key] = body[key]

    if ('subscriptionEnd' in body) {
      data.subscriptionEnd = body.subscriptionEnd ? new Date(body.subscriptionEnd) : null
    }

    const user = await prisma.user.update({ where: { id }, data, select: USER_SELECT })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (isDemoAccount(session.user?.email))
    return NextResponse.json({ error: 'Demo accounts cannot perform this action' }, { status: 403 })

  const { id } = await params
  const adminId = (session.user as any).id
  if (id === adminId) return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
