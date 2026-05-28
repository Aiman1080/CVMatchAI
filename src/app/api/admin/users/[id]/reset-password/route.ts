import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (isDemoAccount(session.user?.email))
    return NextResponse.json({ error: 'Demo accounts cannot perform this action' }, { status: 403 })

  const { id } = await params
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
  const tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const hash = await bcrypt.hash(tempPassword, 12)

  try {
    const user = await prisma.user.update({ where: { id }, data: { password: hash }, select: { email: true } })
    return NextResponse.json({ tempPassword, email: user.email })
  } catch {
    return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 })
  }
}
