// Single candidate CRUD — GET loads the full profile for the detail page,
// PATCH updates mutable fields (typically status changes),
// DELETE removes the candidate and relies on Prisma cascade for linked emailScan.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { logActivity } from '@/lib/activity'
import { isDemoAccount } from '@/lib/demo-guard'

// Fetches a single candidate with full vacancy details for the detail page
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  try {
    // Ownership scoping — admins can view any candidate
    const candidate = await prisma.candidate.findFirst({
      where: isAdmin ? { id } : { id, userId },
      include: { vacancy: true, emailSource: true },
    })
    if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Mark as viewed on first open
    if (!candidate.viewedAt) {
      await prisma.candidate.update({ where: { id }, data: { viewedAt: new Date() } })
      return NextResponse.json({ ...candidate, viewedAt: new Date() })
    }
    return NextResponse.json(candidate)
  } catch {
    return NextResponse.json({ error: 'Failed to load candidate' }, { status: 500 })
  }
}

// Used to update status (new/reviewing/shortlisted/rejected/hired) from the UI
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const userId = (session.user as any).id
  const isAdmin = (session.user as any).role === 'admin'
  try {
    // Ownership check before update
    const existing = await prisma.candidate.findFirst({ where: isAdmin ? { id } : { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const allowed = ['status', 'firstName', 'lastName', 'email', 'phone', 'summary', 'notes', 'liked', 'priority', 'savedToPool', 'viewedAt']
    const data: any = {}
    for (const key of allowed) { if (body[key] !== undefined) data[key] = body[key] }
    const validStatuses = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired']
    if (data.status && !validStatuses.includes(data.status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
    }
    const candidate = await prisma.candidate.update({ where: { id }, data })

    // Log status changes
    if (data.status && data.status !== existing.status) {
      await logActivity(id, 'status_change', `Status changed from ${existing.status} to ${data.status}`, { from: existing.status, to: data.status })
    }
    // Log note updates
    if (data.notes !== undefined && data.notes !== existing.notes) {
      await logActivity(id, 'note_added', 'Notes updated')
    }

    return NextResponse.json(candidate)
  } catch {
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 })
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
    const existing = await prisma.candidate.findFirst({ where: isAdmin ? { id } : { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.candidate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 })
  }
}
