import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { IntegrationsClient } from '@/components/dashboard/IntegrationsClient'
import { UpgradePrompt } from '@/components/dashboard/UpgradePrompt'
import { getPlanLimits } from '@/lib/plans'

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  const userId = user?.id

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true } })
    : null
  const limits = getPlanLimits(dbUser?.subscription || 'free')

  const integrations = userId && limits.atsIntegrations
    ? await prisma.integration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, platform: true, apiKey: false, companySlug: true, status: true, lastSyncAt: true, syncCount: true },
      }).then(rows => rows.map(r => ({ ...r, apiKey: '••••••••', lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : null })))
    : []

  return (
    <div>
      <Header
        title="ATS Integrations"
        description="Connect your ATS platforms and automatically sync your candidates"
      />
      <div className="p-8">
        {limits.atsIntegrations ? (
          <IntegrationsClient initialIntegrations={integrations} />
        ) : (
          <UpgradePrompt
            feature="ATS Integrations — Pro Feature"
            description="Automatically sync candidates from Teamtailor, Recruitee, SmartRecruiters and other ATS platforms. Available from the Pro plan."
          />
        )}
      </div>
    </div>
  )
}
