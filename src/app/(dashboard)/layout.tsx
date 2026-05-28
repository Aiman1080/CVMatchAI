import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { EmailVerificationBanner } from '@/components/dashboard/EmailVerificationBanner'
import { TabGuide } from '@/components/dashboard/TabGuide'
import { FeedbackButton } from '@/components/FeedbackButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if ((session.user as any)?.role === 'admin') redirect('/admin')
  const userId = (session.user as any)?.id
  const email = (session.user as any)?.email || ''
  // Always check DB for suspension AND emailVerified (JWT data is stale).
  // A suspended user must be kicked out immediately even with a valid session.
  const dbUser = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, suspended: true } }).catch(() => null)
    : null
  if (dbUser?.suspended) redirect('/api/auth/signout?callbackUrl=/login?suspended=1')
  const emailVerified = dbUser?.emailVerified ?? (session.user as any)?.emailVerified
  const isDemoAccount = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'free@cvmatch.ai'].includes(email)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        {!emailVerified && !isDemoAccount && <EmailVerificationBanner />}
        <TabGuide />
        {children}
      </main>
      <FeedbackButton />
    </div>
  )
}
