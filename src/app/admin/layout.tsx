import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')
  // Block suspended admin too
  const userId = (session.user as any)?.id
  if (userId) {
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { suspended: true } }).catch(() => null)
    if (dbUser?.suspended) redirect('/api/auth/signout?callbackUrl=/login?suspended=1')
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 min-h-screen">{children}</main>
    </div>
  )
}
