import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const integration = await prisma.integration.findFirst({ where: { id: params.id, userId } })
  if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.integration.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
