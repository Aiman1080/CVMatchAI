import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { SupportClient } from '@/components/support/SupportClient'

export default async function SupportPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  return (
    <div>
      <Header title="Support" description="Get help from our team — we reply within 24 hours" />
      <div className="p-8">
        <SupportClient />
      </div>
    </div>
  )
}
