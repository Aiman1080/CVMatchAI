import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { IntegrationsClient } from '@/components/dashboard/IntegrationsClient'

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  const userId = user?.id

  const integrations = userId
    ? await prisma.integration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, platform: true, apiKey: false, companySlug: true, status: true, lastSyncAt: true, syncCount: true },
      }).then(rows => rows.map(r => ({ ...r, apiKey: '••••••••', lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : null })))
    : []

  return (
    <div>
      <Header
        title="Intégrations ATS"
        description="Connectez vos plateformes ATS et synchronisez vos candidats automatiquement"
      />
      <div className="p-8">
        <IntegrationsClient initialIntegrations={integrations} />
      </div>
    </div>
  )
}
