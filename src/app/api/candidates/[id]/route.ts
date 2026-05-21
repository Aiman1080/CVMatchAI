// Single candidate CRUD — GET loads the full profile for the detail page,
// PATCH updates mutable fields (typically status changes),
// DELETE removes the candidate and relies on Prisma cascade for linked emailScan.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Fetches a single candidate with full vacancy details for the detail page
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  // Ownership scoping — admins can view any candidate
  const candidate = await prisma.candidate.findFirst({
    where: isAdmin ? { id } : { id, userId },
    include: { vacancy: true, emailSource: true },
  })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Mark as viewed on first open
  if (!candidate.viewedAt) {
    await prisma.candidate.update({ where: { id }, data: { viewedAt: new Date() } })
  }
  return NextResponse.json({ ...candidate, viewedAt: candidate.viewedAt ?? new Date() })
}

// Used to update status (new/reviewing/shortlisted/rejected/hired) from the UI
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  // Ownership check before update
  const existing = await prisma.candidate.findFirst({ where: isAdmin ? { id } : { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const allowed = ['status', 'firstName', 'lastName', 'email', 'phone', 'summary', 'notes', 'liked', 'priority', 'savedToPool', 'viewedAt']
  const data: any = {}
  for (const key of allowed) { if (body[key] !== undefined) data[key] = body[key] }
  const candidate = await prisma.candidate.update({ where: { id }, data })
  return NextResponse.json(candidate)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  // Ownership check before delete
  const existing = await prisma.candidate.findFirst({ where: isAdmin ? { id } : { id, userId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.candidate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
