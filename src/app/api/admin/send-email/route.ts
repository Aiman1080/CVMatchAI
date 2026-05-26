import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail, isEmailConfigured } from '@/lib/email'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 })
  }

  const { userIds, subject, body } = await req.json()
  if (!subject?.trim() || !body?.trim() || !Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'Subject, body, and userIds required' }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  })

  let sent = 0
  const errors: string[] = []

  for (const user of users) {
    if (!user.email) continue
    try {
      await sendEmail(user.email, subject, body)
      sent++
    } catch (err: any) {
      errors.push(`${user.email}: ${err.message}`)
    }
  }

  return NextResponse.json({ sent, total: users.length, errors })
}
