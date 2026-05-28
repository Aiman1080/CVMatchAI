import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { SupportClient } from '@/components/support/SupportClient'

export default async function SupportPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const cookieStore = await cookies()
  const locale = (cookieStore.get('deltamatch-locale')?.value || 'en') as 'en' | 'nl' | 'fr'
  const translations = {
    en: {
      title: 'Support',
      description: 'Get help from our team — we reply within 24 hours',
    },
    nl: {
      title: 'Ondersteuning',
      description: 'Krijg hulp van ons team — we reageren binnen 24 uur',
    },
    fr: {
      title: 'Support',
      description: 'Obtenez de l\'aide de notre équipe — nous répondons sous 24 heures',
    },
  }
  const t = translations[locale] || translations.en

  return (
    <div>
      <Header title={t.title} description={t.description} />
      <div className="p-4 sm:p-8">
        <SupportClient />
      </div>
    </div>
  )
}
