'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useTheme } from 'next-themes'
import { TrendingUp } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  candidates: Array<{ matchScore: number | null; status: string; source: string; createdAt: Date; language: string }>
  vacancies: Array<{ title: string; createdAt: Date; _count: { candidates: number } }>
  candidatesOverTime: Array<{ date: string; count: number }>
}

export function AnalyticsClient({ candidates, vacancies, candidatesOverTime }: Props) {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const ta = t.dashboard.analytics
  const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb'
  const todayDate = new Date().toISOString().slice(0, 10)

  const statusData = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'].map(s => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: candidates.filter(c => c.status === s).length })).filter(d => d.value > 0)
  const scoreDistribution = [
    { range: '0-40', count: candidates.filter(c => (c.matchScore || 0) <= 40).length },
    { range: '41-60', count: candidates.filter(c => { const s = c.matchScore || 0; return s > 40 && s <= 60 }).length },
    { range: '61-75', count: candidates.filter(c => { const s = c.matchScore || 0; return s > 60 && s <= 75 }).length },
    { range: '76-90', count: candidates.filter(c => { const s = c.matchScore || 0; return s > 75 && s <= 90 }).length },
    { range: '91-100', count: candidates.filter(c => (c.matchScore || 0) > 90).length },
  ]
  const vacancyData = vacancies.map(v => ({ name: v.title.slice(0, 20) + (v.title.length > 20 ? '…' : ''), candidates: v._count.candidates }))
  const avgScore = candidates.length ? candidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / candidates.length : 0
  const shortlistRate = candidates.length ? (candidates.filter(c => c.status === 'shortlisted').length / candidates.length) * 100 : 0

  // Sources data
  const sourceCounts: Record<string, number> = {}
  for (const c of candidates) {
    const src = c.source || 'manual'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  }
  const sourcesData = Object.entries(sourceCounts)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
    .filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: ta.totalCandidates, value: candidates.length, suffix: '', decimals: 0, color: 'text-blue-600' },
          { label: ta.avgMatchScore, value: avgScore, suffix: '%', decimals: 1, color: 'text-green-600' },
          { label: ta.shortlistRate, value: shortlistRate, suffix: '%', decimals: 1, color: 'text-purple-600' },
          { label: ta.activeVacancies, value: vacancies.length, suffix: '', decimals: 0, color: 'text-amber-600' },
        ].map(kpi => (
          <Card key={kpi.label} className="border border-gray-200 shadow-sm dark:border-gray-800">
            <CardContent className="p-3 sm:p-5 text-center min-w-0">
              <div className={`text-2xl sm:text-3xl font-bold break-words ${kpi.color}`}>
                <AnimatedCounter target={kpi.value} suffix={kpi.suffix} decimals={kpi.decimals} />
              </div>
              <div className="text-xs text-gray-500 mt-1 break-words">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time-series area chart — full width, most prominent */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 min-w-0">
            <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" /> <span className="break-words min-w-0">{ta.over30days}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={candidatesOverTime}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <ReferenceLine
                x={todayDate}
                stroke={theme === 'dark' ? '#94a3b8' : '#1e293b'}
                strokeWidth={2}
                strokeDasharray="4 3"
                label={{ value: ta.today, position: 'top', fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#1e293b' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCount)" name={ta.candidatesLabel} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score distribution + pipeline status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
          <CardHeader className="pb-3"><CardTitle className="text-base">{ta.scoreDistribution}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
          <CardHeader className="pb-3"><CardTitle className="text-base">{ta.pipeline}</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
          </CardContent>
        </Card>
      </div>

      {/* Candidates per vacancy + sources pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
          <CardHeader className="pb-3"><CardTitle className="text-base">{ta.byVacancy}</CardTitle></CardHeader>
          <CardContent>
            {vacancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vacancyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                  <Tooltip />
                  <Bar dataKey="candidates" fill="#6366f1" radius={[0, 4, 4, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
          <CardHeader className="pb-3"><CardTitle className="text-base">{ta.sources}</CardTitle></CardHeader>
          <CardContent>
            {sourcesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourcesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {sourcesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
