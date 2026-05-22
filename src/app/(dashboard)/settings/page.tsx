import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from '@/components/dashboard/SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  return (
    <div>
      <Header title="Settings" description="Manage your account and preferences" />
      <div className="p-8">
        <SettingsClient
          user={{ name: user?.name, email: user?.email, company: user?.company, subscription: user?.subscription }}
        />
      </div>
    </div>
  )
}
