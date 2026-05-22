import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 })
  const userId = (session.user as any).id
  try {
    await prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
  } catch {}
  return NextResponse.json({ ok: true })
}
