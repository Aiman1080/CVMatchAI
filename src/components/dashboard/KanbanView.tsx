'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Star, Flag, Archive, Mail } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { getStatusColor, parseJsonSafe } from '@/lib/utils'

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

const COLUMNS: { id: string; label: string; color: string; dot: string }[] = [
  { id: 'new',         label: 'Nouveau',       color: 'border-t-gray-400',   dot: 'bg-gray-400' },
  { id: 'reviewing',   label: 'En révision',   color: 'border-t-blue-500',   dot: 'bg-blue-500' },
  { id: 'shortlisted', label: 'Shortlisté',    color: 'border-t-purple-500', dot: 'bg-purple-500' },
  { id: 'hired',       label: 'Embauché',      color: 'border-t-green-500',  dot: 'bg-green-500' },
  { id: 'pool',        label: 'Vivier Talent', color: 'border-t-amber-500',  dot: 'bg-amber-500' },
]

interface Props {
  candidates: Candidate[]
  onCandidatesChange: (updated: Candidate[]) => void
}

export function KanbanView({ candidates, onCandidatesChange }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const getColumnCandidates = (colId: string) => {
    if (colId === 'pool') return candidates.filter(c => c.savedToPool)
    return candidates.filter(c => c.status === colId && !c.savedToPool)
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
      onCandidatesChange(candidates.map(c => c.id === id ? { ...c, ...updated } : c))
    } else {
      toast({ title: 'Update failed', variant: 'destructive' })
    }
    setUpdating(null)
  }

  const handleDrop = (colId: string) => {
    if (!dragging || dragging === colId) return
    const candidate = candidates.find(c => c.id === dragging)
    if (!candidate) return
    if (colId === 'pool') {
      updateCandidate(dragging, { savedToPool: true })
    } else {
      updateCandidate(dragging, { status: colId, savedToPool: false })
    }
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
      {COLUMNS.map(col => {
        const cards = getColumnCandidates(col.id)
        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-64 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-t-4 ${col.color} ${dragOver === col.id ? 'ring-2 ring-blue-300' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id) }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col.id)}
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
                  isDragging={dragging === c.id}
                  isUpdating={updating === c.id}
                  onDragStart={() => setDragging(c.id)}
                  onDragEnd={() => { setDragging(null); setDragOver(null) }}
                  onToggleLiked={() => updateCandidate(c.id, { liked: !c.liked })}
                  onTogglePriority={() => updateCandidate(c.id, { priority: !c.priority })}
                  onSaveToPool={() => updateCandidate(c.id, { savedToPool: !c.savedToPool })}
                />
              ))}
              {cards.length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-xs text-gray-400 dark:text-gray-600">Glisser ici</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ candidate: c, isDragging, isUpdating, onDragStart, onDragEnd, onToggleLiked, onTogglePriority, onSaveToPool }: {
  candidate: Candidate
  isDragging: boolean
  isUpdating: boolean
  onDragStart: () => void
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
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-3 cursor-grab active:cursor-grabbing transition-opacity select-none ${isDragging ? 'opacity-40' : 'opacity-100'} ${isUpdating ? 'animate-pulse' : ''}`}
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
            onClick={onToggleLiked}
            className={`p-1 rounded transition-colors ${c.liked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
            title={c.liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star size={13} fill={c.liked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={onTogglePriority}
            className={`p-1 rounded transition-colors ${c.priority ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
            title={c.priority ? 'Retirer priorité' : 'Marquer prioritaire'}
          >
            <Flag size={13} />
          </button>
        </div>
        <button
          onClick={onSaveToPool}
          className={`p-1 rounded text-xs transition-colors flex items-center gap-0.5 ${c.savedToPool ? 'text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
          title={c.savedToPool ? 'Retirer du vivier' : 'Sauver dans le vivier talent'}
        >
          <Archive size={12} />
        </button>
      </div>
    </div>
  )
}
