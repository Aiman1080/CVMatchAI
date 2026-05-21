// Admin ticket reply — updates ticket status and/or saves an admin reply text.
// Sets repliedAt so the UI can show when the response was sent.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status, adminReply } = await req.json()

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(adminReply !== undefined && { adminReply, repliedAt: new Date() }),
    },
    include: { user: { select: { name: true, email: true } } },
  })
  return NextResponse.json(ticket)
}
