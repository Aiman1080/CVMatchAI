import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { SupportClient } from '@/components/support/SupportClient'

export default async function SupportPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header title="Support" description="Get help from our team — we reply within 24 hours" />
        <div className="p-8">
          <SupportClient />
        </div>
      </main>
    </div>
  )
}
