import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')
  const userId = (session.user as any)?.id
  // Verify the admin still exists (handles stale JWT after DB reset)
  if (userId) {
    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }).catch(() => null)
    if (!userExists) redirect('/api/auth/signout?callbackUrl=/login')
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">{children}</main>
    </div>
  )
}
