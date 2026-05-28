import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { isDemoAccount } from '@/lib/demo-guard'
import {
  syncTeamtailor, syncRecruitee, syncSmartRecruiters,
  syncGreenhouse, syncLever, syncBullhorn, syncWorkable, syncFlatchr,
  syncAshby, syncBreezy, syncHomerun, syncPersonio, syncIcims, syncSoftgarden,
} from '@/lib/integrations/sync'

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot perform this action', demo: true }, { status: 403 })
  }
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
    } else if (integration.platform === 'greenhouse') {
      result = await syncGreenhouse(integration.apiKey, userId, since)
    } else if (integration.platform === 'lever') {
      result = await syncLever(integration.apiKey, userId, since)
    } else if (integration.platform === 'bullhorn') {
      if (!integration.companySlug) return NextResponse.json({ error: 'REST URL missing' }, { status: 400 })
      result = await syncBullhorn(integration.apiKey, integration.companySlug, userId, since)
    } else if (integration.platform === 'workable') {
      if (!integration.companySlug) return NextResponse.json({ error: 'Subdomain missing' }, { status: 400 })
      result = await syncWorkable(integration.apiKey, integration.companySlug, userId, since)
    } else if (integration.platform === 'flatchr') {
      result = await syncFlatchr(integration.apiKey, userId, since)
    } else if (integration.platform === 'ashby') {
      result = await syncAshby(integration.apiKey, userId, since)
    } else if (integration.platform === 'breezyhr') {
      if (!integration.companySlug) return NextResponse.json({ error: 'Company ID missing' }, { status: 400 })
      result = await syncBreezy(integration.apiKey, integration.companySlug, userId, since)
    } else if (integration.platform === 'homerun') {
      result = await syncHomerun(integration.apiKey, userId, since)
    } else if (integration.platform === 'personio') {
      result = await syncPersonio(integration.apiKey, userId, since)
    } else if (integration.platform === 'icims') {
      if (!integration.companySlug) return NextResponse.json({ error: 'Customer ID missing' }, { status: 400 })
      result = await syncIcims(integration.apiKey, integration.companySlug, userId, since)
    } else if (integration.platform === 'softgarden') {
      result = await syncSoftgarden(integration.apiKey, userId, since)
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
    const errorMessage = e.message || 'Sync failed'
    const isAuthError = errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized') || errorMessage.includes('Forbidden') || errorMessage.includes('invalid') || errorMessage.includes('expired')

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    })

    if (isAuthError) {
      return NextResponse.json({
        error: `API key expired or invalid for ${integration.platform}. Please disconnect and reconnect with a new API key.`,
        apiKeyExpired: true,
      }, { status: 401 })
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
