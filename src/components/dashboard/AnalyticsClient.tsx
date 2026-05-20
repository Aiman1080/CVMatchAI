'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

interface Props {
  candidates: Array<{ matchScore: number | null; status: string; source: string; createdAt: Date; language: string }>
  vacancies: Array<{ title: string; createdAt: Date; _count: { candidates: number } }>
}

export function AnalyticsClient({ candidates, vacancies }: Props) {
  const statusData = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'].map(s => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: candidates.filter(c => c.status === s).length })).filter(d => d.value > 0)
  const scoreDistribution = [
    { range: '0-40', count: candidates.filter(c => (c.matchScore || 0) <= 40).length },
    { range: '41-60', count: candidates.filter(c => { const s = c.matchScore || 0; return s > 40 && s <= 60 }).length },
    { range: '61-75', count: candidates.filter(c => { const s = c.matchScore || 0; return s > 60 && s <= 75 }).length },
    { range: '76-90', count: candidates.filter(c => { const s = c.matchScore || 0; return s > 75 && s <= 90 }).length },
    { range: '91-100', count: candidates.filter(c => (c.matchScore || 0) > 90).length },
  ]
  const vacancyData = vacancies.map(v => ({ name: v.title.slice(0, 20) + (v.title.length > 20 ? '…' : ''), candidates: v._count.candidates }))
  const avgScore = candidates.length ? (candidates.reduce((sum, c) => sum + (c.matchScore || 0), 0) / candidates.length).toFixed(1) : 0
  const shortlistRate = candidates.length ? ((candidates.filter(c => c.status === 'shortlisted').length / candidates.length) * 100).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: candidates.length, color: 'text-blue-600' },
          { label: 'Avg. Match Score', value: `${avgScore}%`, color: 'text-green-600' },
          { label: 'Shortlist Rate', value: `${shortlistRate}%`, color: 'text-purple-600' },
          { label: 'Active Vacancies', value: vacancies.length, color: 'text-amber-600' },
        ].map(kpi => (
          <Card key={kpi.label} className="border-0 shadow-sm">
            <CardContent className="p-5 text-center">
              <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Score Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base">Pipeline Status</CardTitle></CardHeader>
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
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Candidates per Vacancy</CardTitle></CardHeader>
        <CardContent>
          {vacancyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vacancyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={150} />
                <Tooltip />
                <Bar dataKey="candidates" fill="#6366f1" radius={[0, 4, 4, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
        </CardContent>
      </Card>
    </div>
  )
}
