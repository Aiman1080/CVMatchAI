'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, Star, Flag, Archive, Mail, GripVertical } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { parseJsonSafe } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'

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

const COLUMN_STYLES: { topBar: string; dot: string; ring: string; headerBg: string }[] = [
  { topBar: 'bg-gray-400',   dot: 'bg-gray-400',   ring: 'ring-gray-400/50',   headerBg: 'bg-gray-50 dark:bg-gray-700/50' },
  { topBar: 'bg-blue-500',   dot: 'bg-blue-500',   ring: 'ring-blue-400/60',   headerBg: 'bg-blue-50 dark:bg-blue-900/30' },
  { topBar: 'bg-purple-500', dot: 'bg-purple-500', ring: 'ring-purple-400/60', headerBg: 'bg-purple-50 dark:bg-purple-900/30' },
  { topBar: 'bg-green-500',  dot: 'bg-green-500',  ring: 'ring-green-400/60',  headerBg: 'bg-green-50 dark:bg-green-900/30' },
  { topBar: 'bg-red-500',    dot: 'bg-red-500',    ring: 'ring-red-400/60',    headerBg: 'bg-red-50 dark:bg-red-900/30' },
  { topBar: 'bg-amber-500',  dot: 'bg-amber-500',  ring: 'ring-amber-400/60',  headerBg: 'bg-amber-50 dark:bg-amber-900/30' },
]

interface Props {
  candidates: Candidate[]
  onCandidatesChange: (updated: Candidate[]) => void
  orientation?: 'horizontal' | 'vertical'
}

export function KanbanView({ candidates, onCandidatesChange, orientation = 'horizontal' }: Props) {
  const { t } = useLanguage()
  const tk = t.dashboard.kanban
  const [activeId, setActiveId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // A small activation distance lets clicks on the card's links/buttons work
  // normally - a drag only starts once the pointer actually moves a few px.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  )

  const COLUMNS = [
    { id: 'new',         label: tk.new,         ...COLUMN_STYLES[0] },
    { id: 'reviewing',   label: tk.reviewing,   ...COLUMN_STYLES[1] },
    { id: 'shortlisted', label: tk.shortlisted, ...COLUMN_STYLES[2] },
    { id: 'hired',       label: tk.hired,       ...COLUMN_STYLES[3] },
    { id: 'rejected',    label: tk.rejected,    ...COLUMN_STYLES[4] },
    { id: 'pool',        label: tk.pool,        ...COLUMN_STYLES[5] },
  ]

  const getColumnCandidates = (colId: string) =>
    colId === 'pool'
      ? candidates.filter(c => c.savedToPool)
      : candidates.filter(c => c.status === colId && !c.savedToPool)

  const updateCandidate = async (id: string, patch: Partial<Candidate>) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const updated = await res.json()
        onCandidatesChange(candidates.map(c => (c.id === id ? { ...c, ...updated } : c)))
      } else {
        onCandidatesChange([...candidates]) // revert optimistic move
        toast({ title: tk.updateFailed, variant: 'destructive' })
      }
    } catch {
      onCandidatesChange([...candidates])
      toast({ title: tk.updateFailed, variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const candidateId = String(active.id)
    const targetColId = String(over.id)
    const candidate = candidates.find(c => c.id === candidateId)
    if (!candidate) return

    // No-op if dropped on the column it already belongs to
    if (targetColId === 'pool' && candidate.savedToPool) return
    if (targetColId !== 'pool' && candidate.status === targetColId && !candidate.savedToPool) return

    const patch: Partial<Candidate> = targetColId === 'pool'
      ? { savedToPool: true }
      : { status: targetColId, savedToPool: false }

    // Optimistic move, then persist
    onCandidatesChange(candidates.map(c => (c.id === candidateId ? { ...c, ...patch } : c)))
    const targetLabel = COLUMNS.find(col => col.id === targetColId)?.label ?? targetColId
    toast({ title: `${candidate.firstName} ${candidate.lastName}`, description: tk.movedTo.replace('{status}', targetLabel) })
    updateCandidate(candidateId, patch)
  }

  const activeCandidate = activeId ? candidates.find(c => c.id === activeId) ?? null : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={orientation === 'vertical' ? 'flex flex-col gap-3 pb-4' : 'flex gap-3 overflow-x-auto pb-4 min-h-[600px] scrollbar-thin'}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            cards={getColumnCandidates(col.id)}
            isDraggingAny={activeId !== null}
            updatingId={updatingId}
            labels={tk}
            orientation={orientation}
            onToggleLiked={(id, liked) => updateCandidate(id, { liked })}
            onTogglePriority={(id, priority) => updateCandidate(id, { priority })}
            onTogglePool={(id, savedToPool) => updateCandidate(id, { savedToPool })}
          />
        ))}
      </div>

      {/* Floating card that follows the cursor while dragging */}
      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeCandidate ? <KanbanCard candidate={activeCandidate} labels={tk} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  col, cards, isDraggingAny, updatingId, labels, orientation, onToggleLiked, onTogglePriority, onTogglePool,
}: {
  col: { id: string; label: string; topBar: string; dot: string; ring: string; headerBg: string }
  cards: Candidate[]
  isDraggingAny: boolean
  updatingId: string | null
  labels: any
  orientation: 'horizontal' | 'vertical'
  onToggleLiked: (id: string, liked: boolean) => void
  onTogglePriority: (id: string, priority: boolean) => void
  onTogglePool: (id: string, savedToPool: boolean) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })
  const vertical = orientation === 'vertical'

  return (
    <div className={`${vertical ? 'w-full' : 'flex-shrink-0 w-72'} flex flex-col rounded-2xl bg-gray-50 dark:bg-gray-800/50 overflow-hidden`}>
      {/* Top accent bar */}
      <div className={`h-1 ${col.topBar}`} />

      {/* Header */}
      <div className={`px-3 py-2.5 flex items-center justify-between gap-2 ${col.headerBg}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot} ${isOver ? 'animate-pulse' : ''}`} />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">{col.label}</span>
        </div>
        <span className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded-full font-bold tabular-nums shrink-0">
          {cards.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`px-2.5 pb-2.5 pt-2 flex-1 transition-all duration-200 rounded-b-2xl ${
          vertical
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-h-[110px]'
            : 'space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] min-h-[180px]'
        } ${isOver ? `ring-2 ring-inset ${col.ring} bg-blue-50/40 dark:bg-blue-950/20` : ''}`}
      >
        {cards.map(c => (
          <DraggableCard key={c.id} candidate={c} isUpdating={updatingId === c.id} labels={labels}
            onToggleLiked={() => onToggleLiked(c.id, !c.liked)}
            onTogglePriority={() => onTogglePriority(c.id, !c.priority)}
            onTogglePool={() => onTogglePool(c.id, !c.savedToPool)}
          />
        ))}

        {cards.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-xl transition-colors ${vertical ? 'col-span-full' : ''} ${
            isOver ? 'border-blue-400 bg-blue-50/60 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <Users size={18} className={`mb-1 ${isOver ? 'text-blue-400' : 'text-gray-300 dark:text-gray-600'}`} />
            {isDraggingAny && (
              <p className={`text-xs ${isOver ? 'text-blue-500 font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                {labels.dragHere}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableCard({ candidate, isUpdating, labels, onToggleLiked, onTogglePriority, onTogglePool }: {
  candidate: Candidate
  isUpdating: boolean
  labels: any
  onToggleLiked: () => void
  onTogglePriority: () => void
  onTogglePool: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: candidate.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? 'opacity-40' : ''}`}
    >
      <KanbanCard candidate={candidate} isUpdating={isUpdating} labels={labels}
        onToggleLiked={onToggleLiked} onTogglePriority={onTogglePriority} onTogglePool={onTogglePool} />
    </div>
  )
}

function KanbanCard({ candidate: c, isUpdating, labels, overlay, onToggleLiked, onTogglePriority, onTogglePool }: {
  candidate: Candidate
  isUpdating?: boolean
  labels: any
  overlay?: boolean
  onToggleLiked?: () => void
  onTogglePriority?: () => void
  onTogglePool?: () => void
}) {
  const initials = `${c.firstName?.[0] ?? '?'}${c.lastName?.[0] ?? ''}`.toUpperCase()
  const score = c.matchScore || 0
  const skills = parseJsonSafe<string[]>(c.skills, []).slice(0, 3)

  return (
    <div
      className={`group relative bg-white dark:bg-gray-800 rounded-xl border p-3 select-none transition-shadow ${
        overlay
          ? 'shadow-2xl ring-2 ring-blue-400 border-blue-300 dark:border-blue-600 rotate-2 cursor-grabbing'
          : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing'
      } ${isUpdating ? 'animate-pulse' : ''}`}
    >
      <div className="absolute top-1/2 -translate-y-1/2 -left-0.5 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical size={12} className="text-gray-400" />
      </div>

      <div className="flex items-start gap-2 mb-2">
        <Avatar className="w-7 h-7 shrink-0">
          <AvatarFallback className="text-xs gradient-bg text-white font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link href={`/candidates/${c.id}`} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 transition-colors">{c.firstName} {c.lastName}</p>
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

      {!overlay && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
          <div className="flex items-center gap-1">
            <button
              onClick={e => { e.stopPropagation(); onToggleLiked?.() }}
              onPointerDown={e => e.stopPropagation()}
              className={`p-1 rounded transition-colors ${c.liked ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
              title={c.liked ? labels.removeFavorite : labels.addFavorite}
            >
              <Star size={13} fill={c.liked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onTogglePriority?.() }}
              onPointerDown={e => e.stopPropagation()}
              className={`p-1 rounded transition-colors ${c.priority ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
              title={c.priority ? labels.removePriority : labels.markPriority}
            >
              <Flag size={13} />
            </button>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onTogglePool?.() }}
            onPointerDown={e => e.stopPropagation()}
            className={`p-1 rounded text-xs transition-colors flex items-center gap-0.5 ${c.savedToPool ? 'text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
            title={c.savedToPool ? labels.removeFromPool : labels.addToPool}
          >
            <Archive size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
