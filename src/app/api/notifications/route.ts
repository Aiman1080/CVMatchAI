import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'

// Fetch recent notifications for the current user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id
  if (!userId) return NextResponse.json({ notifications: [], unreadCount: 0 })

  // Stale-JWT guard
  const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }).catch(() => null)
  if (!userExists) return NextResponse.json({ notifications: [], unreadCount: 0 })

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (e: any) {
    console.error('[API /api/notifications GET] Failed:', e?.message || e)
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }
}

// Mark notifications as read
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }

  const userId = (session.user as any).id

  try {
    const { ids, action } = await req.json()

    if (action === 'delete' && Array.isArray(ids)) {
      await prisma.notification.deleteMany({
        where: { id: { in: ids }, userId },
      })
      return NextResponse.json({ success: true })
    }

    if (ids === 'all') {
      // Mark all unread notifications as read
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
    } else if (Array.isArray(ids) && ids.length > 0) {
      // Mark specific notifications as read (only if they belong to this user)
      await prisma.notification.updateMany({
        where: { id: { in: ids }, userId },
        data: { read: true },
      })
    } else {
      return NextResponse.json({ error: 'Provide { ids: "all" } or { ids: ["id1", ...] }' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
