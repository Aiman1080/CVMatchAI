// Single vacancy CRUD — GET loads the vacancy with all its ranked candidates,
// PATCH updates the vacancy fields, DELETE removes it with cascade to candidates.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'
import { deleteDocuments } from '@/lib/storage'

// Next.js 15 requires params to be awaited — it's a Promise in the App Router
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  try {
    const vacancy = await prisma.vacancy.findFirst({
      where: isAdmin ? { id } : { id, userId },
      // Include candidates sorted by score descending for instant ranking display
      include: { candidates: { orderBy: { matchScore: 'desc' } }, _count: { select: { candidates: true } } },
    })
    if (!vacancy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(vacancy)
  } catch {
    return NextResponse.json({ error: 'Failed to load vacancy' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  try {
    // Ownership check: only the owner or admin can modify
    const existing = await prisma.vacancy.findFirst({ where: isAdmin ? { id } : { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json()
    if (body.description !== undefined && !body.description.trim()) {
      return NextResponse.json({ error: 'Description cannot be empty' }, { status: 400 })
    }
    if (body.requirements !== undefined && !body.requirements.trim()) {
      return NextResponse.json({ error: 'Requirements cannot be empty' }, { status: 400 })
    }
    const allowed = ['title', 'company', 'department', 'location', 'type', 'description', 'requirements', 'niceToHave', 'salary', 'language', 'status']
    const data: any = {}
    for (const key of allowed) { if (body[key] !== undefined) data[key] = body[key] }
    const validTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote']
    if (data.type && !validTypes.includes(data.type)) {
      return NextResponse.json({ error: 'Invalid type value' }, { status: 400 })
    }
    const validStatuses = ['active', 'archived', 'filled', 'on_hold']
    if (data.status && !validStatuses.includes(data.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const vacancy = await prisma.vacancy.update({ where: { id }, data })
    return NextResponse.json(vacancy)
  } catch {
    return NextResponse.json({ error: 'Failed to update vacancy' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  try {
    // Ownership check before delete
    const existing = await prisma.vacancy.findFirst({ where: isAdmin ? { id } : { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Candidates cascade-delete at the DB level (which won't run app code), so
    // collect their Storage paths first to clean the binaries afterwards.
    const candidates = await prisma.candidate.findMany({
      where: { vacancyId: id },
      select: { cvStoragePath: true, motivationStoragePath: true },
    })
    await prisma.vacancy.delete({ where: { id } })
    await deleteDocuments(candidates.flatMap(c => [c.cvStoragePath, c.motivationStoragePath]))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete vacancy' }, { status: 500 })
  }
}
