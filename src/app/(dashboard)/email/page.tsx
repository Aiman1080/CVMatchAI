import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { EmailClient } from '@/components/dashboard/EmailClient'
import { UpgradePrompt } from '@/components/dashboard/UpgradePrompt'
import { getPlanLimits, getEffectiveSubscription } from '@/lib/plans'

export default async function EmailPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true, subscriptionEnd: true } })
    : null
  const effectiveSubscription = getEffectiveSubscription(dbUser?.subscription || 'free', dbUser?.subscriptionEnd || null)
  const limits = getPlanLimits(effectiveSubscription)

  const cookieStore = await cookies()
  const locale = (cookieStore.get('deltamatch-locale')?.value || 'en') as 'en' | 'nl' | 'fr'
  const translations = {
    en: {
      title: 'Email Inbox',
      description: 'Connect and scan recruitment email inboxes',
    },
    nl: {
      title: 'E-mail Inbox',
      description: 'Verbind en scan recruitment e-mail inboxen',
    },
    fr: {
      title: 'Boîte de réception',
      description: 'Connectez et scannez les boîtes de réception de recrutement',
    },
  }
  const t = translations[locale] || translations.en

  return (
    <div>
      <Header title={t.title} description={t.description} />
      <div className="p-4 sm:p-8">
        {limits.emailInbox ? (
          <EmailClient />
        ) : (
          <UpgradePrompt
            feature="Email Inbox — Pro Feature"
            description="Connect your recruitment inboxes, automatically scan applications and centralize all your communication. Available from the Pro plan."
          />
        )}
      </div>
    </div>
  )
}
