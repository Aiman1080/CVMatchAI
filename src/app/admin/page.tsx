import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Briefcase, UserCheck, Database } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'admin') redirect('/dashboard')

  const [userCount, vacancyCount, candidateCount, recentUsers] = await Promise.all([
    prisma.user.count(), prisma.vacancy.count(), prisma.candidate.count(),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
  ])
  const subscriptions = await prisma.user.groupBy({ by: ['subscription'], _count: true })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header title="Admin Panel" description="Platform overview and management" />
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: userCount, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
              { label: 'Total Vacancies', value: vacancyCount, icon: Briefcase, bg: 'bg-indigo-50', color: 'text-indigo-600' },
              { label: 'Total Candidates', value: candidateCount, icon: UserCheck, bg: 'bg-green-50', color: 'text-green-600' },
              { label: 'Database Records', value: userCount + vacancyCount + candidateCount, icon: Database, bg: 'bg-purple-50', color: 'text-purple-600' },
            ].map(s => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                  <div><div className="text-2xl font-bold text-gray-900">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Subscriptions</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subscriptions.map(s => (
                    <div key={s.subscription} className="flex items-center justify-between">
                      <span className="capitalize text-sm text-gray-700 font-medium">{s.subscription}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 rounded-full h-2">
                          <div className="gradient-bg h-2 rounded-full" style={{ width: `${(s._count / userCount) * 100}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-6 text-right">{s._count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Recent Users</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{u.name || u.email}</p>
                        <p className="text-xs text-gray-400">{u.email} · {u.company}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs capitalize bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{u.subscription}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
