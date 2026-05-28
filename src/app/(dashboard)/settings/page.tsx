import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { SettingsClient } from '@/components/dashboard/SettingsClient'
import { isDemoAccount } from '@/lib/demo-guard'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  const cookieStore = await cookies()
  const locale = (cookieStore.get('deltamatch-locale')?.value || 'en') as 'en' | 'nl' | 'fr'
  const translations = {
    en: { title: 'Settings' },
    nl: { title: 'Instellingen' },
    fr: { title: 'Paramètres' },
  }
  const t = translations[locale] || translations.en

  return (
    <div>
      <Header title={user?.name ? `${user.name}` : t.title} description={user?.email || ''} />
      <div className="p-8">
        <SettingsClient
          user={{ name: user?.name, email: user?.email, company: user?.company, subscription: user?.subscription, image: user?.image, emailSignature: user?.emailSignature }}
          isDemo={isDemoAccount(user?.email)}
        />
      </div>
    </div>
  )
}
