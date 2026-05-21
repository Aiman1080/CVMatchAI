import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Next.js 15 requires params to be awaited — it's a Promise in the App Router
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  const vacancy = await prisma.vacancy.findFirst({
    where: isAdmin ? { id } : { id, userId },
    // Include candidates sorted by score descending for instant ranking display
    include: { candidates: { orderBy: { matchScore: 'desc' } }, _count: { select: { candidates: true } } },
  })
  if (!vacancy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(vacancy)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  // Ownership check: only the owner or admin can modify
  const existing = await prisma.vacancy.findFirst({ where: isAdmin ? { id } : { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const vacancy = await prisma.vacancy.update({ where: { id }, data: body })
  return NextResponse.json(vacancy)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  // Ownership check before delete
  const existing = await prisma.vacancy.findFirst({ where: isAdmin ? { id } : { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Cascading deletes for candidates are handled by Prisma schema onDelete rules
  await prisma.vacancy.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
