'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Briefcase, MapPin, Users, Clock, Search, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { CreateVacancyDialog } from './CreateVacancyDialog'
import { toast } from '@/components/ui/use-toast'
import { getStatusColor, formatRelativeTime } from '@/lib/utils'

interface Vacancy {
  id: string
  title: string
  company: string
  location: string | null
  type: string
  status: string
  createdAt: Date
  _count: { candidates: number }
}

// Client component: manages optimistic vacancy list — new vacancies are prepended without a page reload
export function VacanciesClient({ initialVacancies }: { initialVacancies: Vacancy[] }) {
  const [vacancies, setVacancies] = useState(initialVacancies)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = vacancies.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.company.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreated = (newVacancy: any) => {
    setVacancies(prev => [{ ...newVacancy, _count: { candidates: 0 } }, ...prev])
    setShowCreate(false)
  }

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${title}"? All ${vacancies.find(v => v.id === id)?._count.candidates ?? 0} candidates in this vacancy will also be deleted. This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/vacancies/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setVacancies(prev => prev.filter(v => v.id !== id))
        toast({ title: 'Vacancy deleted', description: `"${title}" and all its candidates have been removed.` })
      } else {
        toast({ title: 'Delete failed', variant: 'destructive' })
      }
    } finally { setDeleting(null) }
  }

  const typeColors: Record<string, string> = {
    'full-time': 'bg-blue-50 text-blue-700',
    'part-time': 'bg-purple-50 text-purple-700',
    'contract': 'bg-orange-50 text-orange-700',
    'internship': 'bg-green-50 text-green-700',
    'remote': 'bg-teal-50 text-teal-700',
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search vacancies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 gradient-bg">
          <Plus size={16} /> New Vacancy
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {search ? 'No vacancies found' : 'Create your first vacancy'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {search ? 'Try a different search term' : 'Post a job and start receiving AI-analyzed candidates'}
          </p>
          {!search && (
            <Button onClick={() => setShowCreate(true)} className="gradient-bg gap-2">
              <Plus size={16} /> Create Vacancy
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <Link key={v.id} href={`/vacancies/${v.id}`}>
              <Card className="border-0 shadow-sm card-hover cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(v.status)}`}>
                      {v.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{v.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{v.company}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[v.type] || 'bg-gray-50 text-gray-600'}`}>
                      {v.type}
                    </span>
                    {v.location && (
                      <span className="text-xs flex items-center gap-1 text-gray-400">
                        <MapPin size={10} /> {v.location}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-50">
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {v._count.candidates} candidates
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatRelativeTime(v.createdAt)}
                      </span>
                      <button
                        onClick={e => handleDelete(e, v.id, v.title)}
                        disabled={deleting === v.id}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete vacancy"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateVacancyDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </>
  )
}
