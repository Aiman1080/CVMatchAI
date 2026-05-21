import { Briefcase, Users, Star, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Stats { vacancies: number; candidates: number; shortlisted: number; avgScore: number }

// Four KPI cards shown at the top of the dashboard
export function DashboardStats({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Active Vacancies', value: stats.vacancies, icon: Briefcase, color: 'bg-blue-500', bg: 'bg-blue-50', change: '+2 this week' },
    { label: 'Total Candidates', value: stats.candidates, icon: Users, color: 'bg-indigo-500', bg: 'bg-indigo-50', change: '+12 this week' },
    { label: 'Shortlisted', value: stats.shortlisted, icon: Star, color: 'bg-green-500', bg: 'bg-green-50', change: `${stats.candidates > 0 ? Math.round((stats.shortlisted / stats.candidates) * 100) : 0}% rate` },
    { label: 'Avg. Match Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'bg-amber-500', bg: 'bg-amber-50', change: 'AI-powered' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map(item => (
        <Card key={item.label} className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{item.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.change}</p>
              </div>
              {/* Convert bg- class to text- class for the icon color */}
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
