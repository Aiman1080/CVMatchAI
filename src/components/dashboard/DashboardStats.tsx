'use client'

import { Briefcase, Users, Star, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useLanguage } from '@/contexts/LanguageContext'

interface Stats {
  vacancies: number
  candidates: number
  shortlisted: number
  avgScore: number
  vacanciesThisWeek?: number
  candidatesThisWeek?: number
}

export function DashboardStats({ stats }: { stats: Stats }) {
  const { t } = useLanguage()
  const s = t.dashboard.stats
  const items = [
    { label: s.activeVacancies, value: stats.vacancies, suffix: '', icon: Briefcase, color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', change: `+${stats.vacanciesThisWeek || 0} ${s.thisWeek}` },
    { label: s.totalCandidates, value: stats.candidates, suffix: '', icon: Users, color: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950', change: `+${stats.candidatesThisWeek || 0} ${s.thisWeek}` },
    { label: s.shortlisted, value: stats.shortlisted, suffix: '', icon: Star, color: 'bg-green-500', bg: 'bg-green-50 dark:bg-green-950', change: `${stats.candidates > 0 ? Math.round((stats.shortlisted / stats.candidates) * 100) : 0}% ${s.rate}` },
    { label: s.avgMatchScore, value: stats.avgScore, suffix: '%', icon: TrendingUp, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950', change: s.aiPowered },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map(item => (
        <Card key={item.label} className="card-hover border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{item.label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  <AnimatedCounter target={item.value} suffix={item.suffix} />
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.change}</p>
              </div>
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
