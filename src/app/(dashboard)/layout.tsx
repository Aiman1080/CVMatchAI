import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { EmailVerificationBanner } from '@/components/dashboard/EmailVerificationBanner'
import { TabGuide } from '@/components/dashboard/TabGuide'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if ((session.user as any)?.role === 'admin') redirect('/admin')
  const emailVerified = (session.user as any)?.emailVerified
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">
        {!emailVerified && <EmailVerificationBanner />}
        <TabGuide />
        {children}
      </main>
    </div>
  )
}
