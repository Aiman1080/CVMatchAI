import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tickets)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { subject, message, priority } = await req.json()
  if (!subject?.trim() || !message?.trim())
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })

  const ticket = await prisma.supportTicket.create({
    data: { userId, subject: subject.trim(), message: message.trim(), priority: priority || 'normal' },
  })
  return NextResponse.json(ticket, { status: 201 })
}
