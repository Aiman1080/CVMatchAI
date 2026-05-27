import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from '@/components/dashboard/SettingsClient'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  return (
    <div>
      <Header title={user?.name ? `${user.name}` : 'Settings'} description={user?.email || ''} />
      <div className="p-8">
        <SettingsClient
          user={{ name: user?.name, email: user?.email, company: user?.company, subscription: user?.subscription, image: user?.image, emailSignature: user?.emailSignature }}
        />
      </div>
    </div>
  )
}
