import Link from 'next/link'
import { ArrowRight, MapPin, Users, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getStatusColor, formatRelativeTime } from '@/lib/utils'

interface Vacancy { id: string; title: string; company: string; location: string | null; type: string; status: string; createdAt: Date; _count: { candidates: number } }

export function RecentVacancies({ vacancies }: { vacancies: Vacancy[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Active Vacancies</CardTitle>
        <Link href="/vacancies" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">Manage <ArrowRight size={14} /></Link>
      </CardHeader>
      <CardContent>
        {vacancies.length === 0 ? (
          <div className="text-center py-8 text-gray-400"><p className="text-sm">No vacancies yet.</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vacancies.map(v => (
              <Link key={v.id} href={`/vacancies/${v.id}`}>
                <div className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div><h3 className="font-semibold text-gray-900 text-sm">{v.title}</h3><p className="text-xs text-gray-500">{v.company}</p></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(v.status)}`}>{v.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {v.location && <span className="flex items-center gap-1"><MapPin size={11} />{v.location}</span>}
                    <span className="flex items-center gap-1"><Users size={11} />{v._count.candidates}</span>
                    <span className="flex items-center gap-1"><Clock size={11} />{formatRelativeTime(v.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
