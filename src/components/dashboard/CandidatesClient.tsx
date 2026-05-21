'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Users, Mail, Trash2, LayoutGrid, Columns, Star, Flag, Download, Send, FileText, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { KanbanView } from './KanbanView'
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
  liked: boolean
  priority: boolean
  savedToPool: boolean
  viewedAt: Date | null
  createdAt: Date
  vacancy?: { title: string; company: string } | null
}

// Client component: compact grid + kanban toggle, like/priority/pool, export CSV
export function CandidatesClient({ initialCandidates }: { initialCandidates: Candidate[] }) {
  const [candidates, setCandidates] = useState(initialCandidates)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [view, setView] = useState<'grid' | 'kanban'>('grid')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [exportEmail, setExportEmail] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Supprimer ${name} ? Cette action est irréversible.`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id))
        toast({ title: 'Candidat supprimé', description: `${name} a été retiré.` })
      } else {
        toast({ title: 'Erreur de suppression', variant: 'destructive' })
      }
    } finally { setDeleting(null) }
  }

  const updateCandidate = async (id: string, patch: Partial<Candidate>) => {
    setUpdating(id)
    const res = await fetch(`/api/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const updated = await res.json()
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
    } else {
      toast({ title: 'Mise à jour échouée', variant: 'destructive' })
    }
    setUpdating(null)
  }

  const handleExport = async (sendEmail: boolean) => {
    setExporting(true)
    try {
      if (sendEmail && exportEmail) {
        const res = await fetch(`/api/candidates/export?email=${encodeURIComponent(exportEmail)}`)
        const data = await res.json()
        if (res.ok) {
          toast({ title: 'Email envoyé !', description: `Export envoyé à ${exportEmail}` })
          setShowExport(false)
        } else {
          toast({ title: data.error || 'Erreur', variant: 'destructive' })
        }
      } else if (sendEmail === false) {
        // CSV download
        const res = await fetch('/api/candidates/export')
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `candidates-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        toast({ title: 'Export CSV téléchargé !' })
        setShowExport(false)
      } else {
        // PDF — open in new tab for print/save
        window.open('/api/candidates/pdf', '_blank')
        toast({ title: 'Rapport PDF ouvert', description: 'Utilisez Ctrl+P pour sauvegarder en PDF.' })
        setShowExport(false)
      }
    } finally { setExporting(false) }
  }

  const filtered = candidates
    .filter(c => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase()
      const matchSearch = name.includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.vacancy?.title.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter ||
        (statusFilter === 'liked' && c.liked) ||
        (statusFilter === 'priority' && c.priority) ||
        (statusFilter === 'pool' && c.savedToPool)
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.matchScore || 0) - (a.matchScore || 0)
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    })

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="reviewing">En révision</SelectItem>
            <SelectItem value="shortlisted">Shortlisté</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
            <SelectItem value="hired">Embauché</SelectItem>
            <SelectItem value="liked">⭐ Favoris</SelectItem>
            <SelectItem value="priority">🚩 Priorité</SelectItem>
            <SelectItem value="pool">🗂 Vivier</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Score</SelectItem>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`} title="Vue grille">
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`} title="Vue kanban">
            <Columns size={16} />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="gap-1.5 h-9">
          <Download size={15} /> Export CSV
        </Button>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <KanbanView candidates={filtered} onCandidatesChange={setCandidates} />
      )}

      {/* Grid view */}
      {view === 'grid' && (
        filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Aucun candidat trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((c, i) => {
              const initials = `${c.firstName?.[0] ?? '?'}${c.lastName?.[0] ?? ''}`.toUpperCase()
              const score = c.matchScore || 0
              const skills = parseJsonSafe<string[]>(c.skills, [])
              const isUpdating = updating === c.id
              const isUnread = !c.viewedAt

              return (
                <Link key={c.id} href={`/candidates/${c.id}`} onClick={() => setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, viewedAt: new Date() } : x))}>
                  <Card className={`border-0 shadow-sm card-hover cursor-pointer h-full dark:bg-gray-900 ${c.priority ? 'ring-1 ring-red-200 dark:ring-red-900' : ''} ${c.liked && !c.priority ? 'ring-1 ring-amber-200 dark:ring-amber-900' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="shrink-0 text-center relative">
                          <div className="text-xs font-bold text-gray-200 dark:text-gray-700 mb-0.5">#{i + 1}</div>
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs gradient-bg text-white font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            {isUnread && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-gray-900 rounded-full" title="Non consulté" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap mb-0.5">
                            <span className={`font-semibold text-sm truncate ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{c.firstName} {c.lastName}</span>
                            {isUnread && <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 rounded font-semibold">Nouveau</span>}
                            {c.liked && <Star size={10} className="text-amber-500 shrink-0" fill="currentColor" />}
                            {c.priority && <Flag size={10} className="text-red-500 shrink-0" />}
                            {c.savedToPool && <span className="text-xs bg-amber-50 text-amber-600 px-1 rounded font-medium">vivier</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                            {c.vacancy && <span className="text-xs text-blue-600 truncate max-w-24">{c.vacancy.title}</span>}
                            {c.source === 'email' && <Mail size={9} className="text-blue-400 shrink-0" />}
                          </div>
                          {skills.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {skills.slice(0, 3).map((s, j) => (
                                <span key={j} className="text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className={`text-base font-bold leading-none ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : score > 0 ? 'text-red-500' : 'text-gray-300'}`}>
                            {score > 0 ? `${score.toFixed(0)}%` : '—'}
                          </div>
                          {score > 0 && <Progress value={score} className="w-12 h-1" />}
                          <div className="flex items-center gap-0 mt-1">
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); updateCandidate(c.id, { liked: !c.liked }) }}
                              disabled={isUpdating}
                              className={`p-1 rounded transition-colors ${c.liked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
                              title="Favori"
                            >
                              <Star size={11} fill={c.liked ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); updateCandidate(c.id, { priority: !c.priority }) }}
                              disabled={isUpdating}
                              className={`p-1 rounded transition-colors ${c.priority ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                              title="Priorité"
                            >
                              <Flag size={11} />
                            </button>
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(e, c.id, `${c.firstName} ${c.lastName}`) }}
                              disabled={deleting === c.id}
                              className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )
      )}

      {/* Export dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Exporter les candidats</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-500">{filtered.length} candidat(s) inclus dans l'export.</p>
            <Button onClick={() => handleExport(null as any)} disabled={exporting} className="w-full gap-2" variant="outline">
              <FileText size={16} /> Rapport PDF brandé CVMatch AI
            </Button>
            <Button onClick={() => handleExport(false)} disabled={exporting} className="w-full gap-2" variant="outline">
              <Download size={16} /> Télécharger en CSV
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
              <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-2 text-xs text-gray-400 uppercase">ou envoyer le CSV par email</span></div>
            </div>
            <Input type="email" placeholder="destinataire@email.com" value={exportEmail} onChange={e => setExportEmail(e.target.value)} />
            <Button onClick={() => handleExport(true)} disabled={exporting || !exportEmail} className="w-full gap-2 gradient-bg">
              <Send size={16} /> Envoyer par email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
