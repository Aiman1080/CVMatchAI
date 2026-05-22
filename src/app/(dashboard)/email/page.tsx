import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { EmailClient } from '@/components/dashboard/EmailClient'
import { UpgradePrompt } from '@/components/dashboard/UpgradePrompt'
import { getPlanLimits } from '@/lib/plans'

export default async function EmailPage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id
  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { subscription: true } })
    : null
  const limits = getPlanLimits(dbUser?.subscription || 'free')

  return (
    <div>
      <Header title="Email Inbox" description="Connect and scan recruitment email inboxes" />
      <div className="p-8">
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
