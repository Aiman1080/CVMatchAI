import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getPlanLimits } from '@/lib/plans'
import { isDemoAccount } from '@/lib/demo-guard'
import { teamtailorTestConnection } from '@/lib/integrations/teamtailor'
import { recruiteeTestConnection } from '@/lib/integrations/recruitee'
import { smartrecruitersTestConnection } from '@/lib/integrations/smartrecruiters'
import { greenhouseTestConnection } from '@/lib/integrations/greenhouse'
import { leverTestConnection } from '@/lib/integrations/lever'
import { bullhornTestConnection } from '@/lib/integrations/bullhorn'
import { workableTestConnection } from '@/lib/integrations/workable'
import { flatchrTestConnection } from '@/lib/integrations/flatchr'
import { ashbyTestConnection } from '@/lib/integrations/ashby'
import { breezyTestConnection } from '@/lib/integrations/breezyhr'
import { homerunTestConnection } from '@/lib/integrations/homerun'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(integrations.map(i => ({ ...i, apiKey: '••••••••' })))
  } catch {
    return NextResponse.json({ error: 'Failed to load integrations' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (isDemoAccount(session.user?.email)) {
    return NextResponse.json({ error: 'Demo accounts cannot modify data', demo: true }, { status: 403 })
  }
  const userId = (session.user as any).id

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true } })
  const limits = getPlanLimits(user?.subscription || 'free')
  if (!limits.atsIntegrations) {
    return NextResponse.json({ error: 'ATS integrations require a Pro plan', upgrade: true }, { status: 403 })
  }

  const body = await req.json()
  const { platform, apiKey, companySlug } = body
  if (!platform || !apiKey) return NextResponse.json({ error: 'Missing platform or apiKey' }, { status: 400 })

  const allowed = ['teamtailor', 'recruitee', 'smartrecruiters', 'greenhouse', 'lever', 'bullhorn', 'workable', 'flatchr', 'ashby', 'breezyhr', 'homerun']
  if (!allowed.includes(platform)) return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })

  if (platform === 'recruitee' && !companySlug) {
    return NextResponse.json({ error: 'Company slug required for Recruitee' }, { status: 400 })
  }
  if (platform === 'bullhorn' && !companySlug) {
    return NextResponse.json({ error: 'REST URL required for Bullhorn' }, { status: 400 })
  }
  if (platform === 'workable' && !companySlug) {
    return NextResponse.json({ error: 'Subdomain required for Workable' }, { status: 400 })
  }
  if (platform === 'breezyhr' && !companySlug) {
    return NextResponse.json({ error: 'Company ID required for Breezy HR' }, { status: 400 })
  }

  // Test the connection before saving
  let testResult: { ok: boolean; company?: string; error?: string }
  if (platform === 'teamtailor') testResult = await teamtailorTestConnection(apiKey)
  else if (platform === 'recruitee') testResult = await recruiteeTestConnection(apiKey, companySlug)
  else if (platform === 'smartrecruiters') testResult = await smartrecruitersTestConnection(apiKey)
  else if (platform === 'greenhouse') testResult = await greenhouseTestConnection(apiKey)
  else if (platform === 'lever') testResult = await leverTestConnection(apiKey)
  else if (platform === 'bullhorn') testResult = await bullhornTestConnection(apiKey, companySlug)
  else if (platform === 'workable') testResult = await workableTestConnection(apiKey, companySlug)
  else if (platform === 'flatchr') testResult = await flatchrTestConnection(apiKey)
  else if (platform === 'ashby') testResult = await ashbyTestConnection(apiKey)
  else if (platform === 'breezyhr') testResult = await breezyTestConnection(apiKey)
  else if (platform === 'homerun') testResult = await homerunTestConnection(apiKey)
  else testResult = { ok: false, error: 'Unknown platform' }

  if (!testResult.ok) {
    return NextResponse.json({ error: `Connection failed: ${testResult.error}` }, { status: 400 })
  }

  try {
    const integration = await prisma.integration.upsert({
      where: { platform_userId: { platform, userId } },
      create: { platform, apiKey, companySlug: companySlug || null, userId, status: 'active' },
      update: { apiKey, companySlug: companySlug || null, status: 'active' },
    })
    return NextResponse.json({ ...integration, apiKey: '••••••••', company: testResult.company })
  } catch {
    return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 })
  }
}
