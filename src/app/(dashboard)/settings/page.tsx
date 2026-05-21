import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from '@/components/dashboard/SettingsClient'
import prisma from '@/lib/prisma'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any
  const userId = user?.id

  const integrations = userId
    ? await prisma.integration.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, platform: true, apiKey: false, companySlug: true, status: true, lastSyncAt: true, syncCount: true },
      }).then(rows => rows.map(r => ({ ...r, apiKey: '••••••••' })))
    : []

  return (
    <div>
      <Header title="Settings" description="Manage your account and preferences" />
      <div className="p-8">
        <SettingsClient
          user={{ name: user?.name, email: user?.email, company: user?.company, subscription: user?.subscription }}
          integrations={integrations}
        />
      </div>
    </div>
  )
}
