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
  const userId = (session.user as any)?.id
  // Verify the user actually still exists — but be lenient: only log out if the
  // DB explicitly returns null (not on errors, which could be transient). This
  // prevents users being kicked out on every DB hiccup.
  if (userId) {
    let userCheck: { id: string } | null | undefined
    try {
      userCheck = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    } catch {
      userCheck = undefined // treat DB error as "unknown" — don't log out
    }
    if (userCheck === null) redirect('/api/auth/signout?callbackUrl=/login')
  }
  if ((session.user as any)?.role === 'admin') redirect('/admin')
  const emailVerified = (session.user as any)?.emailVerified
  const email = (session.user as any)?.email || ''
  const isDemoAccount = ['demo@cvmatch.ai', 'pro@cvmatch.ai', 'admin@cvmatch.ai', 'free@cvmatch.ai'].includes(email)
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
