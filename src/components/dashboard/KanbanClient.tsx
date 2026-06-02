'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Columns, Rows3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KanbanView } from './KanbanView'
import { parseJsonSafe } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

// Full-page Kanban with the same search/filter bar as the Candidates list, plus a
// horizontal/vertical layout toggle. Holds candidates locally; KanbanView persists
// each drag via PATCH, so a move is shared with the Candidates list (same database).
export function KanbanClient({ initialCandidates }: { initialCandidates: any[] }) {
  const { t } = useLanguage()
  const tc = t.dashboard.candidates
  const tcp = t.dashboard.candidatesPage
  const [candidates, setCandidates] = useState(initialCandidates)
  const [search, setSearch] = useState('')
  const [vacancyFilter, setVacancyFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [vacancies, setVacancies] = useState<Array<{ id: string; title: string; company: string }>>([])

  useEffect(() => {
    fetch('/api/vacancies')
      .then(r => r.json())
      .then(d => setVacancies(Array.isArray(d) ? d : d.vacancies || []))
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return candidates.filter((c: any) => {
      if (vacancyFilter !== 'all' && c.vacancyId !== vacancyFilter) return false
      const score = c.matchScore || 0
      if (scoreFilter === 'high' && score < 75) return false
      if (scoreFilter === 'medium' && (score < 50 || score >= 75)) return false
      if (scoreFilter === 'low' && score >= 50) return false
      if (q) {
        const hay = `${c.firstName} ${c.lastName} ${c.email || ''} ${parseJsonSafe<string[]>(c.skills, []).join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [candidates, search, vacancyFilter, scoreFilter])

  const toggleBtn = (active: boolean) =>
    `p-1.5 rounded-md transition-colors ${active ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Horizontal / vertical layout toggle - kept on the LEFT so it stays
            visible without horizontal scrolling */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 shrink-0 self-start">
          <button onClick={() => setOrientation('horizontal')} className={toggleBtn(orientation === 'horizontal')} title="Horizontal" aria-label="Horizontal">
            <Columns size={16} />
          </button>
          <button onClick={() => setOrientation('vertical')} className={toggleBtn(orientation === 'vertical')} title="Vertical" aria-label="Vertical">
            <Rows3 size={16} />
          </button>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder={tc.search} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {vacancies.length > 0 && (
          <Select value={vacancyFilter} onValueChange={setVacancyFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder={tcp.allVacancies} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tcp.allVacancies}</SelectItem>
              {vacancies.map(v => <SelectItem key={v.id} value={v.id}>{v.title} - {v.company}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder={tc.score} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc.all}</SelectItem>
            <SelectItem value="high">{tcp.scoreHigh}</SelectItem>
            <SelectItem value="medium">{tcp.scoreMedium}</SelectItem>
            <SelectItem value="low">{tcp.scoreLow}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <KanbanView candidates={filtered} onCandidatesChange={setCandidates} orientation={orientation} />
    </div>
  )
}
