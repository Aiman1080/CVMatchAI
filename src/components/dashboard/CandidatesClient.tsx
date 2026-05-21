'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Users, ChevronRight, Mail, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { getStatusColor, formatRelativeTime, parseJsonSafe } from '@/lib/utils'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string | null
  matchScore: number | null
  status: string
  source: string
  skills: string | null
  createdAt: Date
  vacancy?: { title: string; company: string } | null
}

// Client component: filters and sorts the candidate list entirely in-memory (no API calls per filter change)
export function CandidatesClient({ initialCandidates }: { initialCandidates: Candidate[] }) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id))
        toast({ title: 'Candidate deleted', description: `${name} has been removed.` })
      } else {
        toast({ title: 'Delete failed', variant: 'destructive' })
      }
    } finally { setDeleting(null) }
  }

  const filtered = candidates
    .filter(c => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase()
      const matchSearch = name.includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.vacancy?.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.matchScore || 0) - (a.matchScore || 0)
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Match Score</SelectItem>
            <SelectItem value="date">Date Added</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No candidates found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => {
            const initials = `${c.firstName?.[0] ?? '?'}${c.lastName?.[0] ?? ''}`.toUpperCase()
            const score = c.matchScore || 0
            // skills is stored as a JSON string in the DB — parse safely to avoid crashes on bad data
            const skills = parseJsonSafe<string[]>(c.skills, [])

            return (
              <Link key={c.id} href={`/candidates/${c.id}`}>
                <Card className="border-0 shadow-sm card-hover cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-gray-300 w-6 text-center">#{i + 1}</div>
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="text-sm gradient-bg text-white font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-gray-900">{c.firstName} {c.lastName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                          {c.source === 'email' && <span className="text-xs text-blue-500 flex items-center gap-0.5"><Mail size={10} /> email</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                          {c.email && <span>{c.email}</span>}
                          {c.vacancy && <span className="text-blue-600">{c.vacancy.title}</span>}
                          <span>{formatRelativeTime(c.createdAt)}</span>
                        </div>
                        {skills.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {skills.slice(0, 5).map((s, j) => (
                              <span key={j} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className={`text-xl font-bold ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {score > 0 ? `${score.toFixed(0)}%` : '—'}
                          </div>
                          {score > 0 && <Progress value={score} className="w-20 h-1.5 mt-1" />}
                        </div>
                        <button
                          onClick={e => handleDelete(e, c.id, `${c.firstName} ${c.lastName}`)}
                          disabled={deleting === c.id}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete candidate"
                        >
                          <Trash2 size={15} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
