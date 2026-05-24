'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Users, Star, Flag, Archive, Mail } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { getStatusColor, parseJsonSafe } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

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

const COLUMN_STYLES: { color: string; dot: string; dropHighlight: string }[] = [
  { color: 'border-t-gray-400',   dot: 'bg-gray-400',   dropHighlight: 'border-gray-400' },
  { color: 'border-t-blue-500',   dot: 'bg-blue-500',   dropHighlight: 'border-blue-500' },
  { color: 'border-t-purple-500', dot: 'bg-purple-500', dropHighlight: 'border-purple-500' },
  { color: 'border-t-green-500',  dot: 'bg-green-500',  dropHighlight: 'border-green-500' },
  { color: 'border-t-red-500',    dot: 'bg-red-500',    dropHighlight: 'border-red-500' },
  { color: 'border-t-amber-500',  dot: 'bg-amber-500',  dropHighlight: 'border-amber-500' },
]

interface Props {
  candidates: Candidate[]
  onCandidatesChange: (updated: Candidate[]) => void
}

export function KanbanView({ candidates, onCandidatesChange }: Props) {
  const { t } = useLanguage()
  const tk = t.dashboard.kanban
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const dragCounters = useRef<Record<string, number>>({})

  const COLUMNS = [
    { id: 'new',         label: tk.new,         ...COLUMN_STYLES[0] },
    { id: 'reviewing',   label: tk.reviewing,   ...COLUMN_STYLES[1] },
    { id: 'shortlisted', label: tk.shortlisted, ...COLUMN_STYLES[2] },
    { id: 'hired',       label: tk.hired,       ...COLUMN_STYLES[3] },
    { id: 'rejected',    label: tk.rejected,    ...COLUMN_STYLES[4] },
    { id: 'pool',        label: tk.pool,        ...COLUMN_STYLES[5] },
  ]

  const getColumnCandidates = (colId: string) => {
    if (colId === 'pool') return candidates.filter(c => c.savedToPool)
    return candidates.filter(c => c.status === colId && !c.savedToPool)
  }

  const updateCandidate = useCallback(async (id: string, patch: Partial<Candidate>) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const updated = await res.json()
        onCandidatesChange(candidates.map(c => c.id === id ? { ...c, ...updated } : c))
      } else {
        // Revert optimistic update on failure
        onCandidatesChange([...candidates])
        toast({ title: 'Update failed', variant: 'destructive' })
      }
    } catch {
      onCandidatesChange([...candidates])
      toast({ title: 'Update failed', variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }, [candidates, onCandidatesChange])

  const handleDragStart = useCallback((e: React.DragEvent, candidateId: string, currentStatus: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ candidateId, currentStatus }))
    e.dataTransfer.effectAllowed = 'move'
    // Need a tiny delay so the browser captures the drag image before we change opacity
    requestAnimationFrame(() => {
      setDraggingId(candidateId)
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
    setDragOver(null)
    dragCounters.current = {}
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent, colId: string) => {
    e.preventDefault()
    dragCounters.current[colId] = (dragCounters.current[colId] || 0) + 1
    setDragOver(colId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDragLeave = useCallback((colId: string) => {
    dragCounters.current[colId] = (dragCounters.current[colId] || 0) - 1
    if (dragCounters.current[colId] <= 0) {
      dragCounters.current[colId] = 0
      setDragOver(prev => prev === colId ? null : prev)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetColId: string) => {
    e.preventDefault()
    setDragOver(null)
    setDraggingId(null)
    dragCounters.current = {}

    let data: { candidateId: string; currentStatus: string }
    try {
      data = JSON.parse(e.dataTransfer.getData('text/plain'))
    } catch {
      return
    }

    const { candidateId, currentStatus } = data
    const candidate = candidates.find(c => c.id === candidateId)
    if (!candidate) return

    // Skip if dropped on the same column
    if (targetColId === 'pool' && candidate.savedToPool) return
    if (targetColId !== 'pool' && currentStatus === targetColId && !candidate.savedToPool) return

    // Optimistic update: move card immediately in the UI
    const patch: Partial<Candidate> = targetColId === 'pool'
      ? { savedToPool: true }
      : { status: targetColId, savedToPool: false }

    onCandidatesChange(candidates.map(c => c.id === candidateId ? { ...c, ...patch } : c))

    // Then persist to server
    updateCandidate(candidateId, patch)
  }, [candidates, onCandidatesChange, updateCandidate])

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {COLUMNS.map(col => {
        const cards = getColumnCandidates(col.id)
        const isDropTarget = dragOver === col.id
        return (
          <div
            key={col.id}
            className={`
              flex-shrink-0 w-64 rounded-xl border-t-4 transition-all duration-200
              bg-gray-50 dark:bg-gray-800/50
              ${col.color}
              ${isDropTarget
                ? `ring-2 ring-offset-2 ring-blue-400 dark:ring-blue-500 border-2 border-dashed ${col.dropHighlight} bg-blue-50/50 dark:bg-blue-950/20`
                : 'border-2 border-transparent'
              }
            `}
            onDragEnter={e => handleDragEnter(e, col.id)}
            onDragOver={handleDragOver}
            onDragLeave={() => handleDragLeave(col.id)}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
              </div>
              <span className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {cards.length}
              </span>
            </div>

            <div className="px-3 pb-3 space-y-2 min-h-[200px]">
              {cards.map(c => (
                <KanbanCard
                  key={c.id}
                  candidate={c}
                  isDragging={draggingId === c.id}
                  isUpdating={updating === c.id}
                  labels={tk}
                  onDragStart={e => handleDragStart(e, c.id, c.savedToPool ? 'pool' : c.status)}
                  onDragEnd={handleDragEnd}
                  onToggleLiked={() => updateCandidate(c.id, { liked: !c.liked })}
                  onTogglePriority={() => updateCandidate(c.id, { priority: !c.priority })}
                  onSaveToPool={() => updateCandidate(c.id, { savedToPool: !c.savedToPool })}
                />
              ))}
              {cards.length === 0 && (
                <div className={`flex items-center justify-center h-24 border-2 border-dashed rounded-lg transition-colors duration-200 ${
                  isDropTarget
                    ? 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <p className="text-xs text-gray-400 dark:text-gray-600">{tk.dragHere}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ candidate: c, isDragging, isUpdating, labels, onDragStart, onDragEnd, onToggleLiked, onTogglePriority, onSaveToPool }: {
  candidate: Candidate
  isDragging: boolean
  isUpdating: boolean
  labels: { addFavorite: string; removeFavorite: string; markPriority: string; removePriority: string; addToPool: string; removeFromPool: string }
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onToggleLiked: () => void
  onTogglePriority: () => void
  onSaveToPool: () => void
}) {
  const initials = `${c.firstName?.[0] ?? '?'}${c.lastName?.[0] ?? ''}`.toUpperCase()
  const score = c.matchScore || 0
  const skills = parseJsonSafe<string[]>(c.skills, []).slice(0, 3)

  return (
    <div
      draggable="true"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700
        shadow-sm p-3 cursor-grab active:cursor-grabbing select-none
        transition-all duration-200 ease-in-out
        ${isDragging ? 'opacity-40 scale-95 shadow-lg ring-2 ring-blue-300 dark:ring-blue-600' : 'opacity-100 scale-100 hover:shadow-md'}
        ${isUpdating ? 'animate-pulse pointer-events-none' : ''}
      `}
    >
      <div className="flex items-start gap-2 mb-2">
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarFallback className="text-xs gradient-bg text-white font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link href={`/candidates/${c.id}`} onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-blue-600">{c.firstName} {c.lastName}</p>
          </Link>
          {c.vacancy && <p className="text-xs text-gray-400 truncate">{c.vacancy.title}</p>}
        </div>
        {c.priority && <Flag size={12} className="text-red-500 shrink-0 mt-0.5" />}
      </div>

      {score > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <Progress value={score} className="h-1 flex-1" />
          <span className={`text-xs font-bold shrink-0 ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
            {score.toFixed(0)}%
          </span>
        </div>
      )}

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {skills.map((s, i) => <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{s}</span>)}
        </div>
      )}

      {c.email && (
        <p className="text-xs text-gray-400 truncate flex items-center gap-1 mb-2">
          <Mail size={10} /> {c.email}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); onToggleLiked() }}
            className={`p-1 rounded transition-colors ${c.liked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
            title={c.liked ? labels.removeFavorite : labels.addFavorite}
          >
            <Star size={13} fill={c.liked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onTogglePriority() }}
            className={`p-1 rounded transition-colors ${c.priority ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
            title={c.priority ? labels.removePriority : labels.markPriority}
          >
            <Flag size={13} />
          </button>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSaveToPool() }}
          className={`p-1 rounded text-xs transition-colors flex items-center gap-0.5 ${c.savedToPool ? 'text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
          title={c.savedToPool ? labels.removeFromPool : labels.addToPool}
        >
          <Archive size={12} />
        </button>
      </div>
    </div>
  )
}
