// Admin broadcast — send a notification to all users (or a filtered subset).
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (isDemoAccount(session.user?.email))
    return NextResponse.json({ error: 'Demo accounts cannot perform this action' }, { status: 403 })

  try {
    const { title, message } = await req.json()
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: { suspended: false },
      select: { id: true },
    })

    if (users.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        type: 'broadcast',
        title: title.trim(),
        message: message.trim(),
      })),
    })

    return NextResponse.json({ sent: users.length })
  } catch {
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 })
  }
}
