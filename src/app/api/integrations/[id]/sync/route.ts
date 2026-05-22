import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { syncTeamtailor, syncRecruitee, syncSmartRecruiters } from '@/lib/integrations/sync'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  let integration: any
  try {
    integration = await prisma.integration.findFirst({ where: { id: params.id, userId } })
  } catch {
    return NextResponse.json({ error: 'Failed to load integration' }, { status: 500 })
  }
  if (!integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const since = integration.lastSyncAt || undefined

  let result
  try {
    if (integration.platform === 'teamtailor') {
      result = await syncTeamtailor(userId, integration.apiKey, since)
    } else if (integration.platform === 'recruitee') {
      if (!integration.companySlug) return NextResponse.json({ error: 'Company slug missing' }, { status: 400 })
      result = await syncRecruitee(userId, integration.apiKey, integration.companySlug, since)
    } else if (integration.platform === 'smartrecruiters') {
      result = await syncSmartRecruiters(userId, integration.apiKey, since)
    } else {
      return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        syncCount: { increment: result.imported },
        status: result.errors.length > 0 && result.imported === 0 ? 'error' : 'active',
      },
    })

    return NextResponse.json({ success: true, ...result })
  } catch (e: any) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
