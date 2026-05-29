'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Users, Mail, Trash2, LayoutGrid, Columns, Star, Flag, Download, Send, FileText, Eye, EyeOff, ChevronLeft, ChevronRight, Loader2, CheckSquare, Square, CheckCheck, X, GitCompareArrows, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { KanbanView } from './KanbanView'
import { ImportCSVDialog } from './ImportCSVDialog'
import { UploadWithVacancyDialog } from './UploadWithVacancyDialog'
import { getStatusColor, formatRelativeTime, parseJsonSafe } from '@/lib/utils'
import { exportCandidatesToExcel, exportCandidatesToPDF } from '@/lib/export'
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

const PAGE_SIZE = 30

// Client component: compact grid + kanban toggle, like/priority/pool, export CSV
export function CandidatesClient({ initialCandidates, initialTotal, isPro = false }: { initialCandidates: Candidate[]; initialTotal: number; isPro?: boolean }) {
  const router = useRouter()
  const { t } = useLanguage()
  const tc = t.dashboard.candidates
  const [candidates, setCandidates] = useState(initialCandidates)
  const [search, setSearch] = useState('')
  const [vacancyFilter, setVacancyFilter] = useState('all')
  const [vacancies, setVacancies] = useState<Array<{ id: string; title: string; company: string }>>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')

  useEffect(() => {
    fetch('/api/vacancies').then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : data.vacancies || []
      setVacancies(list)
    }).catch(() => {})
  }, [])

  const handleVacancyFilterChange = (vacancyId: string) => {
    setVacancyFilter(vacancyId)
    setPage(1)
    setSelectedIds(new Set())
    fetchPage(1, { vacancyId })
  }
  const [view, setView] = useState<'grid' | 'kanban'>('grid')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [exportEmail, setExportEmail] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [showImportCSV, setShowImportCSV] = useState(false)
  const [showUploadCV, setShowUploadCV] = useState(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmText: string
    variant: 'destructive' | 'default'
    onConfirm: () => void
  }>({ open: false, title: '', description: '', confirmText: 'Delete', variant: 'destructive', onConfirm: () => {} })

  // Pagination state
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialTotal)
  const [loadingPage, setLoadingPage] = useState(false)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  type FetchOverrides = {
    vacancyId?: string
    search?: string
    status?: string
    scoreFilter?: string
    sortBy?: string
  }

  const fetchPage = useCallback(async (targetPage: number, overrides: FetchOverrides = {}) => {
    setLoadingPage(true)
    setSelectedIds(new Set())
    try {
      const params = new URLSearchParams()
      params.set('page', String(targetPage))
      params.set('limit', String(PAGE_SIZE))
      const v = overrides.vacancyId ?? vacancyFilter
      if (v && v !== 'all') params.set('vacancyId', v)
      const s = overrides.search ?? search
      if (s.trim()) params.set('search', s.trim())
      const st = overrides.status ?? statusFilter
      if (st && st !== 'all') params.set('status', st)
      const sc = overrides.scoreFilter ?? scoreFilter
      if (sc && sc !== 'all') params.set('scoreFilter', sc)
      const so = overrides.sortBy ?? sortBy
      if (so) params.set('sortBy', so)

      const res = await fetch(`/api/candidates?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCandidates(data.candidates)
        setTotal(data.total)
        setPage(data.page)
      }
    } finally {
      setLoadingPage(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacancyFilter, search, statusFilter, scoreFilter, sortBy])

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page || loadingPage) return
    fetchPage(targetPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset to page 1 and clear selection when any filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
    setSelectedIds(new Set())
    fetchPage(1, { status: value })
  }
  const handleScoreFilterChange = (value: string) => {
    setScoreFilter(value)
    setPage(1)
    setSelectedIds(new Set())
    fetchPage(1, { scoreFilter: value })
  }
  const handleSortChange = (value: string) => {
    setSortBy(value)
    setPage(1)
    setSelectedIds(new Set())
    fetchPage(1, { sortBy: value })
  }

  // Debounced search — avoid hitting the API on every keystroke
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setSelectedIds(new Set())
  }
  const isFirstSearchRender = useRef(true)
  useEffect(() => {
    // Skip the initial render — initial data already came from the server
    if (isFirstSearchRender.current) { isFirstSearchRender.current = false; return }
    const handle = setTimeout(() => {
      setPage(1)
      fetchPage(1, { search })
    }, 300)
    return () => clearTimeout(handle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openConfirm = (opts: Omit<typeof confirmDialog, 'open'>) => {
    setConfirmDialog({ ...opts, open: true })
  }
  const closeConfirm = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }))
  }

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    openConfirm({
      title: 'Delete candidate',
      description: `Delete ${name}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        closeConfirm()
        setDeleting(id)
        try {
          const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' })
          if (res.ok) {
            setCandidates(prev => prev.filter(c => c.id !== id))
            setTotal(prev => prev - 1)
            setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
            if (candidates.length === 1 && page > 1) {
              fetchPage(page - 1)
            }
            toast({ title: tc.deleted, description: ((tc as any).removedDesc || '{name} has been removed.').replace('{name}', name) })
          } else {
            toast({ title: tc.deleteError, variant: 'destructive' })
          }
        } finally { setDeleting(null) }
      },
    })
  }

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0 || bulkUpdating) return
    setBulkUpdating(true)
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.allSettled(
        ids.map(id =>
          fetch(`/api/candidates/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          }).then(r => r.ok ? r.json() : Promise.reject())
        )
      )
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failureCount = results.length - successCount
      setCandidates(prev =>
        prev.map(c => selectedIds.has(c.id) ? { ...c, status: newStatus } : c)
      )
      setSelectedIds(new Set())
      if (failureCount > 0) {
        toast({
          title: ((tc as any).bulkUpdatedPartial || '{success} of {total} candidates updated').replace('{success}', String(successCount)).replace('{total}', String(results.length)),
          description: ((tc as any).bulkUpdatedPartialDesc || '{failed} could not be updated. Please retry those candidates individually.').replace('{failed}', String(failureCount)),
          variant: 'destructive',
        })
      } else {
        toast({ title: ((tc as any).bulkUpdatedAll || '{count} candidate(s) updated to "{status}"').replace('{count}', String(successCount)).replace('{status}', newStatus) })
      }
    } catch {
      toast({ title: (tc as any).bulkUpdateError || tc.updateError, variant: 'destructive' })
    } finally {
      setBulkUpdating(false)
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    const count = String(selectedIds.size)
    openConfirm({
      title: (tc as any).bulkDeleteConfirmTitle || 'Delete selected candidates',
      description: ((tc as any).bulkDeleteConfirmDesc || 'Delete {count} selected candidate(s)? This action cannot be undone.').replace('{count}', count),
      confirmText: ((tc as any).bulkDeleteConfirmBtn || 'Delete {count}').replace('{count}', count),
      variant: 'destructive',
      onConfirm: async () => {
        closeConfirm()
        setBulkUpdating(true)
        try {
          const ids = Array.from(selectedIds)
          const results = await Promise.allSettled(
            ids.map(id =>
              fetch(`/api/candidates/${id}`, { method: 'DELETE' }).then(r =>
                r.ok ? id : Promise.reject()
              )
            )
          )
          const deletedIds = new Set(
            results
              .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
              .map(r => r.value)
          )
          setCandidates(prev => prev.filter(c => !deletedIds.has(c.id)))
          setTotal(prev => prev - deletedIds.size)
          setSelectedIds(new Set())
          const failed = ids.length - deletedIds.size
          if (failed > 0) {
            toast({
              title: ((tc as any).bulkDeletedPartial || '{success} of {total} deleted').replace('{success}', String(deletedIds.size)).replace('{total}', String(ids.length)),
              description: ((tc as any).bulkDeletedPartialDesc || '{failed} could not be deleted. Please retry those candidates individually.').replace('{failed}', String(failed)),
              variant: 'destructive',
            })
          } else {
            toast({ title: ((tc as any).bulkDeletedAll || '{count} candidate(s) deleted').replace('{count}', String(deletedIds.size)) })
          }
          if (candidates.length === deletedIds.size && page > 1) {
            fetchPage(page - 1)
          }
        } catch {
          toast({ title: (tc as any).bulkDeleteError || tc.deleteError, variant: 'destructive' })
        } finally {
          setBulkUpdating(false)
        }
      },
    })
  }

  const handleBulkExportExcel = async () => {
    if (selectedIds.size === 0) return
    setExportingExcel(true)
    try {
      const selected = filtered.filter(c => selectedIds.has(c.id))
      await exportCandidatesToExcel(selected)
      toast({ title: ((tc as any).excelDownloaded || 'Excel export of {count} candidate(s) downloaded!').replace('{count}', String(selected.length)) })
    } catch {
      toast({ title: (tc as any).exportFailedTitle || 'Export failed', description: (tc as any).excelFailedDesc || 'Could not generate the Excel file. Please try again.', variant: 'destructive' })
    } finally {
      setExportingExcel(false)
    }
  }

  const handleBulkExportPdf = async () => {
    if (selectedIds.size === 0) return
    setExportingPdf(true)
    try {
      const selected = filtered.filter(c => selectedIds.has(c.id))
      await exportCandidatesToPDF(selected)
      toast({ title: ((tc as any).pdfDownloaded || 'PDF export of {count} candidate(s) downloaded!').replace('{count}', String(selected.length)) })
    } catch {
      toast({ title: (tc as any).exportFailedTitle || 'Export failed', description: (tc as any).pdfFailedDesc || 'Could not generate the PDF file. Please try again.', variant: 'destructive' })
    } finally {
      setExportingPdf(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (filteredCandidates: Candidate[]) => {
    const allFilteredIds = filteredCandidates.map(c => c.id)
    const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
    }
  }

  const updateCandidate = async (id: string, patch: Partial<Candidate>) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        const updated = await res.json()
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
      } else {
        toast({ title: tc.updateError, variant: 'destructive' })
      }
    } catch {
      toast({ title: tc.updateError, variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  const handleExport = async (sendEmail: boolean | null) => {
    setExporting(true)
    try {
      if (sendEmail && exportEmail) {
        const res = await fetch(`/api/candidates/export?email=${encodeURIComponent(exportEmail)}`)
        const data = await res.json()
        if (res.ok) {
          toast({ title: (tc as any).emailSent || 'Email sent!', description: ((tc as any).emailSentDesc || 'Export sent to {email}').replace('{email}', exportEmail) })
          setShowExport(false)
        } else {
          toast({ title: (tc as any).emailFailed || 'Email could not be sent', description: data.error || (tc as any).emailFailedDesc || 'Please check the email address and try again.', variant: 'destructive' })
        }
      } else if (sendEmail === false) {
        // CSV download
        const res = await fetch('/api/candidates/export')
        if (!res.ok) {
          toast({ title: (tc as any).exportFailedTitle || 'Export failed', description: (tc as any).csvFailedDesc || 'Could not generate the CSV. Please try again.', variant: 'destructive' })
          return
        }
        const blob = await res.blob()
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `candidates-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        toast({ title: (tc as any).csvDownloaded || 'CSV export downloaded!' })
        setShowExport(false)
      } else {
        // PDF — open in new tab for print/save
        window.open('/api/candidates/pdf', '_blank')
        toast({ title: (tc as any).pdfOpened || 'PDF report opened', description: (tc as any).pdfOpenedDesc || 'Use Ctrl+P to save as PDF.' })
        setShowExport(false)
      }
    } catch {
      toast({ title: (tc as any).exportFailedTitle || 'Export failed', description: (tc as any).connectionRetry || 'Please check your connection and try again.', variant: 'destructive' })
    } finally { setExporting(false) }
  }

  // Filtering and sorting now happen server-side via fetchPage — the candidates
  // array already reflects the current search/filter/sort state for this page.
  const filtered = candidates

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-0 sm:min-w-40 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder={tc.search} value={search} onChange={e => handleSearchChange(e.target.value)} className="pl-9" />
        </div>
        {vacancies.length > 0 && (
          <Select value={vacancyFilter} onValueChange={handleVacancyFilterChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All vacancies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vacancies</SelectItem>
              {vacancies.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.title} — {v.company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="grid grid-cols-3 gap-2 sm:contents">
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={tc.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc.all}</SelectItem>
              <SelectItem value="new">{tc.new}</SelectItem>
              <SelectItem value="reviewing">{tc.reviewing}</SelectItem>
              <SelectItem value="shortlisted">{tc.shortlisted}</SelectItem>
              <SelectItem value="rejected">{tc.rejected}</SelectItem>
              <SelectItem value="hired">{tc.hired}</SelectItem>
              <SelectItem value="liked">{tc.liked}</SelectItem>
              <SelectItem value="priority">{tc.priority}</SelectItem>
              <SelectItem value="pool">{tc.pool}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scoreFilter} onValueChange={handleScoreFilterChange}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc.all}</SelectItem>
              <SelectItem value="high">75+ Strong</SelectItem>
              <SelectItem value="medium">50-74 Medium</SelectItem>
              <SelectItem value="low">0-49 Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder={tc.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">{tc.score} (desc)</SelectItem>
              <SelectItem value="name">{tc.name} (A-Z)</SelectItem>
              <SelectItem value="date">{tc.date} (newest)</SelectItem>
              <SelectItem value="date_oldest">{tc.date} (oldest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 self-start sm:self-auto">
          <button onClick={() => setView('grid')} className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`} title="Grid view">
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`} title="Kanban view">
            <Columns size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:contents">
          <Button size="sm" onClick={() => setShowUploadCV(true)} className="gap-1.5 h-auto py-2 gradient-bg whitespace-normal text-center leading-tight">
            <Upload size={15} className="shrink-0" /> Upload CV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportCSV(true)} className="gap-1.5 h-auto py-2 whitespace-normal text-center leading-tight">
            <FileText size={15} className="shrink-0" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExport(true)} className="gap-1.5 h-auto py-2 whitespace-normal text-center leading-tight">
            <Download size={15} className="shrink-0" /> {tc.exportCsv}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exportingExcel || !isPro}
            title={!isPro ? 'Pro feature' : undefined}
            onClick={async () => {
              setExportingExcel(true)
              try {
                await exportCandidatesToExcel(filtered)
                toast({ title: (tc as any).excelDownloadedSimple || 'Excel export downloaded!' })
              } catch { toast({ title: (tc as any).exportFailedTitle || 'Export failed', description: (tc as any).excelFailedDesc || 'Could not generate the Excel file. Please try again.', variant: 'destructive' }) }
              finally { setExportingExcel(false) }
            }}
            className="gap-1.5 h-auto py-2 whitespace-normal text-center leading-tight"
          >
            <Download size={15} className="shrink-0" /> {exportingExcel ? 'Exporting...' : 'Export Excel'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exportingPdf || !isPro}
            title={!isPro ? 'Pro feature' : undefined}
            onClick={async () => {
              setExportingPdf(true)
              try {
                await exportCandidatesToPDF(filtered)
                toast({ title: (tc as any).pdfDownloadedSimple || 'PDF export downloaded!' })
              } catch { toast({ title: (tc as any).exportFailedTitle || 'Export failed', description: (tc as any).pdfFailedDesc || 'Could not generate the PDF file. Please try again.', variant: 'destructive' }) }
              finally { setExportingPdf(false) }
            }}
            className="gap-1.5 h-auto py-2 whitespace-normal text-center leading-tight"
          >
            <Download size={15} className="shrink-0" /> {exportingPdf ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && view === 'grid' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CheckCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-500" title="Clear selection">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select onValueChange={handleBulkStatusChange} value="">
              <SelectTrigger className="w-full sm:w-44 h-8 text-xs">
                <SelectValue placeholder="Change status to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{tc.new}</SelectItem>
                <SelectItem value="reviewing">{tc.reviewing}</SelectItem>
                <SelectItem value="shortlisted">{tc.shortlisted}</SelectItem>
                <SelectItem value="rejected">{tc.rejected}</SelectItem>
                <SelectItem value="hired">{tc.hired}</SelectItem>
              </SelectContent>
            </Select>
            {selectedIds.size >= 2 && selectedIds.size <= 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const ids = Array.from(selectedIds).join(',')
                  router.push(`/candidates/compare?ids=${ids}`)
                }}
                className="gap-1 h-auto py-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950 whitespace-normal text-center leading-tight"
              >
                <GitCompareArrows size={13} className="shrink-0" /> Compare ({selectedIds.size})
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={exportingExcel || bulkUpdating} onClick={handleBulkExportExcel} className="gap-1 h-auto py-1.5 text-xs whitespace-normal text-center leading-tight">
              <Download size={13} className="shrink-0" /> Excel
            </Button>
            <Button variant="outline" size="sm" disabled={exportingPdf || bulkUpdating} onClick={handleBulkExportPdf} className="gap-1 h-auto py-1.5 text-xs whitespace-normal text-center leading-tight">
              <Download size={13} className="shrink-0" /> PDF
            </Button>
            <Button variant="destructive" size="sm" disabled={bulkUpdating} onClick={handleBulkDelete} className="gap-1 h-auto py-1.5 text-xs whitespace-normal text-center leading-tight">
              <Trash2 size={13} className="shrink-0" /> Delete
            </Button>
          </div>
          {bulkUpdating && <Loader2 size={14} className="animate-spin text-blue-500" />}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <KanbanView candidates={filtered} onCandidatesChange={setCandidates} />
      )}

      {/* Grid view */}
      {view === 'grid' && (
        filtered.length === 0 ? (() => {
          const hasActiveFilters = !!search.trim() || vacancyFilter !== 'all' || statusFilter !== 'all' || scoreFilter !== 'all'
          return (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
                {hasActiveFilters ? (tc as any).noCandidatesFiltered : tc.noCandidates}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-5 break-words">
                {hasActiveFilters ? (tc as any).noCandidatesFilteredDesc : (tc as any).noCandidatesDesc}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
                {hasActiveFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setVacancyFilter('all')
                      setStatusFilter('all')
                      setScoreFilter('all')
                      setPage(1)
                      setSelectedIds(new Set())
                      fetchPage(1, { vacancyId: 'all', search: '', status: 'all', scoreFilter: 'all' })
                    }}
                    className="gap-1.5"
                  >
                    <X size={14} /> {(tc as any).clearFilters}
                  </Button>
                ) : (
                  <>
                    <Button size="sm" onClick={() => setShowUploadCV(true)} className="gap-1.5 gradient-bg">
                      <Upload size={14} /> {(tc as any).uploadFirstCv}
                    </Button>
                    <Link href="/integrations">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <FileText size={14} /> {t.dashboard.nav.integrations}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
              {!hasActiveFilters && (
                <p className="text-gray-400 dark:text-gray-500 text-xs max-w-md mx-auto break-words">
                  {tc.atsHint}
                </p>
              )}
            </div>
          )
        })() : (
          <>
          {/* Select all header */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <button
              onClick={() => toggleSelectAll(filtered)}
              className="p-0.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              title={allFilteredSelected ? 'Deselect all' : 'Select all'}
            >
              {allFilteredSelected ? (
                <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />
              ) : (
                <Square size={16} className="text-gray-400" />
              )}
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filtered.length})
            </span>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 transition-opacity ${loadingPage ? 'opacity-50 pointer-events-none' : ''}`}>
            {filtered.map((c, i) => {
              const firstInitial = c.firstName?.trim()?.[0] ?? '?'
              const lastInitial = c.lastName?.trim()?.[0] ?? ''
              const initials = `${firstInitial}${lastInitial}`.toUpperCase()
              const score = c.matchScore || 0
              const skills = parseJsonSafe<string[]>(c.skills, [])
              const isUpdating = updating === c.id
              const isUnread = !c.viewedAt
              const isSelected = selectedIds.has(c.id)

              return (
                <Link key={c.id} href={`/candidates/${c.id}`} onClick={() => setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, viewedAt: new Date() } : x))}>
                  <Card className={`border-0 shadow-sm card-hover cursor-pointer h-full dark:bg-gray-900 ${isSelected ? 'ring-2 ring-blue-400 dark:ring-blue-600' : ''} ${c.priority && !isSelected ? 'ring-1 ring-red-200 dark:ring-red-900' : ''} ${c.liked && !c.priority && !isSelected ? 'ring-1 ring-amber-200 dark:ring-amber-900' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2.5">
                        <div className="shrink-0 text-center relative">
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSelect(c.id) }}
                            className="p-0.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 mb-0.5"
                            title={isSelected ? 'Deselect' : 'Select'}
                          >
                            {isSelected ? (
                              <CheckSquare size={14} className="text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Square size={14} className="text-gray-300 dark:text-gray-600" />
                            )}
                          </button>
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs gradient-bg text-white font-semibold">{initials}</AvatarFallback>
                            </Avatar>
                            {isUnread && (
                              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" title={tc.unread} />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap mb-0.5">
                            <span className={`font-semibold text-sm truncate ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{c.firstName} {c.lastName}</span>
                            {isUnread && <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 rounded font-semibold animate-pulse">{tc.unread}</span>}
                            {c.liked && <Star size={10} className="text-amber-500 shrink-0" fill="currentColor" />}
                            {c.priority && <Flag size={10} className="text-red-500 shrink-0" />}
                            {c.savedToPool && <span className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-1 rounded font-medium">{tc.pool_badge}</span>}
                          </div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{c.status}</span>
                            {c.vacancy && <span className="text-xs text-blue-600 truncate max-w-24">{c.vacancy.title}</span>}
                            {c.source === 'email' && <Mail size={9} className="text-blue-400 shrink-0" />}
                          </div>
                          {skills.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {skills.slice(0, 3).map((s, j) => (
                                <span key={j} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1 py-0.5 rounded">{s}</span>
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
                              title={tc.liked}
                            >
                              <Star size={11} fill={c.liked ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); updateCandidate(c.id, { priority: !c.priority }) }}
                              disabled={isUpdating}
                              className={`p-1 rounded transition-colors ${c.priority ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                              title={tc.priority}
                            >
                              <Flag size={11} />
                            </button>
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(e, c.id, `${c.firstName} ${c.lastName}`) }}
                              disabled={deleting === c.id}
                              className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                              title="Delete"
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
          </>
        )
      )}

      {/* Pagination controls */}
      {totalPages > 1 && view === 'grid' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}&ndash;{Math.min(page * PAGE_SIZE, total)} of {total} candidates
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1 || loadingPage}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={16} />
            </Button>
            {(() => {
              const pages: (number | 'ellipsis')[] = []
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i)
              } else {
                pages.push(1)
                if (page > 3) pages.push('ellipsis')
                for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                  pages.push(i)
                }
                if (page < totalPages - 2) pages.push('ellipsis')
                pages.push(totalPages)
              }
              return pages.map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => goToPage(p)}
                    disabled={loadingPage}
                    className={`h-8 w-8 p-0 text-sm ${p === page ? 'gradient-bg text-white' : ''}`}
                  >
                    {p}
                  </Button>
                )
              )
            })()}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages || loadingPage}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
            {loadingPage && <Loader2 size={16} className="animate-spin text-gray-400 ml-2" />}
          </div>
        </div>
      )}

      {/* Export dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tc.exportCsv}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} candidate(s) included in export.</p>
            <Button onClick={() => handleExport(null)} disabled={exporting} className="w-full gap-2" variant="outline">
              <FileText size={16} /> DeltaMatch branded PDF report
            </Button>
            <Button onClick={() => handleExport(false)} disabled={exporting} className="w-full gap-2" variant="outline">
              <Download size={16} /> Download as CSV
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
              <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-2 text-xs text-gray-400 uppercase">or send CSV by email</span></div>
            </div>
            <Input type="email" placeholder="recipient@email.com" value={exportEmail} onChange={e => setExportEmail(e.target.value)} />
            <Button onClick={() => handleExport(true)} disabled={exporting || !exportEmail} className="w-full gap-2 gradient-bg">
              <Send size={16} /> Send by email
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload CV dialog */}
      <UploadWithVacancyDialog
        open={showUploadCV}
        onClose={() => setShowUploadCV(false)}
        onUploaded={() => fetchPage(page)}
      />

      {/* Import CSV dialog */}
      <ImportCSVDialog
        open={showImportCSV}
        onOpenChange={setShowImportCSV}
        onImportComplete={() => fetchPage(page)}
      />

      {/* Confirmation dialog for destructive actions */}
      <ConfirmDialog
        open={confirmDialog.open}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </>
  )
}
