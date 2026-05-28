import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { IntegrationsClient } from '@/components/dashboard/IntegrationsClient'
import { UpgradePrompt } from '@/components/dashboard/UpgradePrompt'
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'
import { isDemoAccount } from '@/lib/demo-guard'

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  const userId = user?.id

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
    : null
  const effectiveSubscription = getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null)
  const limits = getPlanLimits(effectiveSubscription)

  const integrations = userId && limits.atsIntegrations
    ? await prisma.integration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, platform: true, apiKey: false, companySlug: true, status: true, lastSyncAt: true, syncCount: true },
      }).then(rows => rows.map(r => ({ ...r, apiKey: '••••••••', lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : null })))
    : []

  const cookieStore = await cookies()
  const locale = (cookieStore.get('deltamatch-locale')?.value || 'en') as 'en' | 'nl' | 'fr'
  const translations = {
    en: {
      title: 'ATS Integrations',
      description: 'Connect your ATS platforms and automatically sync your candidates',
    },
    nl: {
      title: 'ATS Integraties',
      description: 'Verbind je ATS-platforms en synchroniseer je kandidaten automatisch',
    },
    fr: {
      title: 'Intégrations ATS',
      description: 'Connectez vos plateformes ATS et synchronisez automatiquement vos candidats',
    },
  }
  const t = translations[locale] || translations.en

  return (
    <div>
      <Header
        title={t.title}
        description={t.description}
      />
      <div className="p-4 sm:p-8">
        {limits.atsIntegrations ? (
          <IntegrationsClient initialIntegrations={integrations} isDemo={isDemoAccount(user?.email)} />
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
