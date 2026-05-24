'use client'

// Vacancy detail page — shows vacancy info, candidate rankings, and allows editing
// the vacancy inline. The Pencil button opens an edit dialog that saves via PATCH.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin, Briefcase, DollarSign, Users, Upload, Star, ChevronRight, ChevronLeft,
  Pencil, Trash2, CheckCircle, XCircle, Clock, Loader2, Save, X, Sparkles, Trophy, Download, Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UploadCVDialog } from './UploadCVDialog'
import { getStatusColor, formatDate, parseJsonSafe } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
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
  strengths: string | null
  skills: string | null
  createdAt: Date
}

interface Vacancy {
  id: string
  title: string
  company: string
  department: string | null
  location: string | null
  type: string
  description: string
  requirements: string
  niceToHave: string | null
  salary: string | null
  status: string
  language: string
  createdAt: Date
  candidates: Candidate[]
}

export function VacancyDetailClient({ vacancy: initial }: { vacancy: Vacancy }) {
  const router = useRouter()
  const { t } = useLanguage()
  const vd = t.dashboard.vacancyDetail
  const cv = t.dashboard.createVacancy
  const [vacancy, setVacancy] = useState(initial)
  const [duplicating, setDuplicating] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    title: initial.title,
    company: initial.company,
    department: initial.department ?? '',
    location: initial.location ?? '',
    type: initial.type,
    description: initial.description,
    requirements: initial.requirements,
    niceToHave: initial.niceToHave ?? '',
    salary: initial.salary ?? '',
    status: initial.status,
  })

  const handleCandidateAdded = (candidate: any) => {
    setVacancy(prev => ({
      ...prev,
      candidates: [candidate, ...prev.candidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)),
    }))
    setShowUpload(false)
  }

  const handleStatusChange = async (candidateId: string, status: string) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        toast({ title: vd.updateFailed, variant: 'destructive' })
        return
      }
      setVacancy(prev => ({
        ...prev,
        candidates: prev.candidates.map(c => c.id === candidateId ? { ...c, status } : c),
      }))
      toast({ title: vd.statusUpdated, description: `${vd.statusChangedTo} ${vd.statusLabels[status as keyof typeof vd.statusLabels] || status}` })
    } catch {
      toast({ title: vd.updateFailed, variant: 'destructive' })
    }
  }

  const handleSaveVacancy = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          department: editForm.department || null,
          location: editForm.location || null,
          niceToHave: editForm.niceToHave || null,
          salary: editForm.salary || null,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const updated = await res.json()
      setVacancy(prev => ({ ...prev, ...updated }))
      setShowEdit(false)
      toast({ title: vd.vacancyUpdated, description: vd.changesSaved })
    } catch {
      toast({ title: vd.saveFailed, description: vd.saveFailedDesc, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast({ title: vd.duplicated, description: `"${data.title}" ${vd.duplicatedDesc}` })
        router.push(`/vacancies/${data.id}`)
      } else {
        if (data.upgrade) {
          toast({ title: vd.upgradeRequired, description: data.error, variant: 'destructive' })
        } else {
          toast({ title: data.error || vd.duplicateFailed, variant: 'destructive' })
        }
      }
    } catch {
      toast({ title: vd.duplicateFailed, variant: 'destructive' })
    } finally {
      setDuplicating(false)
    }
  }

  const [ranking, setRanking] = useState<Array<{ candidateId: string; rank: number; reasoning: string; standoutFactor: string }> | null>(null)
  const [rankingLoading, setRankingLoading] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const handleAIRanking = async () => {
    setRankingLoading(true)
    try {
      const res = await fetch('/api/vacancies/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId: vacancy.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setRanking(data.ranking)
        toast({ title: vd.aiRankingGenerated })
      } else {
        toast({ title: data.error || vd.rankingFailed, variant: 'destructive' })
      }
    } catch {
      toast({ title: vd.rankingFailed, variant: 'destructive' })
    } finally {
      setRankingLoading(false)
    }
  }

  const VACANCY_PAGE_SIZE = 30
  const sortedCandidates = [...vacancy.candidates].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
  const [candidatePage, setCandidatePage] = useState(1)
  const candidateTotalPages = Math.ceil(sortedCandidates.length / VACANCY_PAGE_SIZE)
  const paginatedCandidates = candidateTotalPages > 1
    ? sortedCandidates.slice((candidatePage - 1) * VACANCY_PAGE_SIZE, candidatePage * VACANCY_PAGE_SIZE)
    : sortedCandidates

  return (
    <div className="space-y-6">
      {/* Vacancy Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{vacancy.title}</h2>
                  <p className="text-gray-500 dark:text-gray-400">{vacancy.company} · {vacancy.department}</p>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(vacancy.status)}`}>{vacancy.status}</span>
                <button
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={vd.duplicateTooltip}
                >
                  {duplicating ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={() => {
                    setEditForm({
                      title: vacancy.title,
                      company: vacancy.company,
                      department: vacancy.department ?? '',
                      location: vacancy.location ?? '',
                      type: vacancy.type,
                      description: vacancy.description,
                      requirements: vacancy.requirements,
                      niceToHave: vacancy.niceToHave ?? '',
                      salary: vacancy.salary ?? '',
                      status: vacancy.status,
                    })
                    setShowEdit(true)
                  }}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={vd.editTooltip}
                >
                  <Pencil size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              {vacancy.location && <span className="flex items-center gap-1.5"><MapPin size={14} />{vacancy.location}</span>}
              <span className="flex items-center gap-1.5"><Briefcase size={14} />{vacancy.type}</span>
              {vacancy.salary && <span className="flex items-center gap-1.5"><DollarSign size={14} />{vacancy.salary}</span>}
              <span className="flex items-center gap-1.5"><Clock size={14} />{vd.posted} {formatDate(vacancy.createdAt)}</span>
            </div>

            <Tabs defaultValue="description">
              <TabsList className="mb-4">
                <TabsTrigger value="description">{vd.descriptionTab}</TabsTrigger>
                <TabsTrigger value="requirements">{vd.requirementsTab}</TabsTrigger>
              </TabsList>
              <TabsContent value="description">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{vacancy.description}</p>
              </TabsContent>
              <TabsContent value="requirements">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{vacancy.requirements}</p>
                {vacancy.niceToHave && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{vd.niceToHaveLabel}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{vacancy.niceToHave}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
            <CardContent className="p-5">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{vacancy.candidates.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{vd.totalCandidates}</div>
              </div>
              <div className="space-y-2 text-sm">
                {['new', 'reviewing', 'shortlisted', 'rejected'].map(s => {
                  const count = vacancy.candidates.filter(c => c.status === s).length
                  return (
                    <div key={s} className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(s)}`}>{vd.statusLabels[s as keyof typeof vd.statusLabels] || s}</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setShowUpload(true)} className="w-full gradient-bg gap-2">
            <Upload size={16} /> {vd.uploadCV}
          </Button>
        </div>
      </div>

      {/* Candidate Rankings */}
      <Card className="border border-gray-200 shadow-sm dark:border-gray-800">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            {vd.candidateRankings}
          </CardTitle>
          <div className="flex gap-2">
            {sortedCandidates.length >= 2 && (
              <Button size="sm" variant="outline" onClick={handleAIRanking} disabled={rankingLoading} className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400">
                {rankingLoading ? <Loader2 size={13} className="animate-spin" /> : <Trophy size={13} />}
                {rankingLoading ? vd.rankingInProgress : vd.aiRanking}
              </Button>
            )}
            {sortedCandidates.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={exportingExcel}
                  onClick={async () => {
                    setExportingExcel(true)
                    try {
                      await exportCandidatesToExcel(sortedCandidates, vacancy.title)
                      toast({ title: vd.excelExportDone })
                    } catch { toast({ title: vd.exportFailed, variant: 'destructive' }) }
                    finally { setExportingExcel(false) }
                  }}
                  className="gap-1.5"
                >
                  <Download size={13} /> {exportingExcel ? vd.exportingInProgress : vd.exportExcel}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={exportingPdf}
                  onClick={async () => {
                    setExportingPdf(true)
                    try {
                      await exportCandidatesToPDF(sortedCandidates, vacancy.title)
                      toast({ title: vd.pdfExportDone })
                    } catch { toast({ title: vd.exportFailed, variant: 'destructive' }) }
                    finally { setExportingPdf(false) }
                  }}
                  className="gap-1.5"
                >
                  <Download size={13} /> {exportingPdf ? vd.exportingInProgress : vd.exportPdf}
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowUpload(true)} className="gap-1">
              <Upload size={13} /> {vd.addCandidate}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ranking && ranking.length > 0 && (
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300">{vd.aiRankingAnalysis}</h4>
              </div>
              <div className="space-y-3">
                {ranking.map(r => {
                  const c = vacancy.candidates.find(c => c.id === r.candidateId)
                  if (!c) return null
                  return (
                    <div key={r.candidateId} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                      <span className={`text-lg font-bold shrink-0 w-7 ${r.rank === 1 ? 'text-amber-500' : r.rank === 2 ? 'text-gray-400' : r.rank === 3 ? 'text-orange-500' : 'text-gray-300'}`}>#{r.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.firstName} {c.lastName} <span className="text-xs text-gray-400 font-normal ml-1">{c.matchScore?.toFixed(0)}%</span></p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{r.reasoning}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">{r.standoutFactor}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {sortedCandidates.length === 0 ? (
            <div className="text-center py-10">
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">{vd.noCandidatesYet}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedCandidates.map((c, i) => {
                const globalIndex = (candidatePage - 1) * VACANCY_PAGE_SIZE + i
                const initials = `${c.firstName?.[0] ?? '?'}${c.lastName?.[0] ?? ''}`.toUpperCase()
                const score = c.matchScore || 0
                const skills = parseJsonSafe<string[]>(c.skills, [])

                return (
                  <div key={c.id} className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                    <div className="flex items-center gap-1 shrink-0 w-6 text-center">
                      <span className={`text-sm font-bold ${globalIndex === 0 ? 'text-amber-500' : globalIndex === 1 ? 'text-gray-400' : globalIndex === 2 ? 'text-orange-500' : 'text-gray-300'}`}>
                        #{globalIndex + 1}
                      </span>
                    </div>
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarFallback className="text-xs gradient-bg text-white font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/candidates/${c.id}`} className="font-semibold text-gray-900 dark:text-white text-sm hover:text-blue-600">
                          {c.firstName} {c.lastName}
                        </Link>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(c.status)}`}>{vd.statusLabels[c.status as keyof typeof vd.statusLabels] || c.status}</span>
                        {c.source === 'email' && <span className="text-xs text-blue-500 font-medium">via email</span>}
                      </div>
                      {c.email && <p className="text-xs text-gray-400 mb-1.5">{c.email}</p>}
                      {skills.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {skills.slice(0, 4).map((s, j) => (
                            <span key={j} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                          {score.toFixed(0)}%
                        </div>
                        <Progress value={score} className="w-16 h-1.5 mt-1" />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatusChange(c.id, 'shortlisted')}
                          className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-gray-400 hover:text-green-600"
                          title={vd.shortlistTooltip}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusChange(c.id, 'rejected')}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                          title={vd.rejectTooltip}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                      <Link href={`/candidates/${c.id}`} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {/* Pagination controls for candidate list */}
          {candidateTotalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {vd.showingCandidates} {(candidatePage - 1) * VACANCY_PAGE_SIZE + 1}&ndash;{Math.min(candidatePage * VACANCY_PAGE_SIZE, sortedCandidates.length)} {vd.ofCandidates} {sortedCandidates.length} {vd.candidatesLabel}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCandidatePage(p => Math.max(1, p - 1))}
                  disabled={candidatePage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft size={16} />
                </Button>
                {(() => {
                  const pages: (number | 'ellipsis')[] = []
                  if (candidateTotalPages <= 7) {
                    for (let i = 1; i <= candidateTotalPages; i++) pages.push(i)
                  } else {
                    pages.push(1)
                    if (candidatePage > 3) pages.push('ellipsis')
                    for (let i = Math.max(2, candidatePage - 1); i <= Math.min(candidateTotalPages - 1, candidatePage + 1); i++) {
                      pages.push(i)
                    }
                    if (candidatePage < candidateTotalPages - 2) pages.push('ellipsis')
                    pages.push(candidateTotalPages)
                  }
                  return pages.map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === candidatePage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCandidatePage(p)}
                        className={`h-8 w-8 p-0 text-sm ${p === candidatePage ? 'gradient-bg text-white' : ''}`}
                      >
                        {p}
                      </Button>
                    )
                  )
                })()}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCandidatePage(p => Math.min(candidateTotalPages, p + 1))}
                  disabled={candidatePage >= candidateTotalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Vacancy Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{vd.editTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{vd.editJobTitle}</Label>
                <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder={cv.jobTitlePlaceholder} />
              </div>
              <div className="space-y-1.5">
                <Label>{vd.editCompany}</Label>
                <Input value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} placeholder={cv.companyPlaceholder} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{vd.editDepartment}</Label>
                <Input value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} placeholder={cv.departmentPlaceholder} />
              </div>
              <div className="space-y-1.5">
                <Label>{vd.editLocation}</Label>
                <Input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} placeholder={cv.locationPlaceholder} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{vd.editContractType}</Label>
                <Select value={editForm.type} onValueChange={v => setEditForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['full-time', 'part-time', 'contract', 'internship', 'remote'] as const).map(ct => (
                      <SelectItem key={ct} value={ct}>{vd.contractTypes[ct]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{vd.editStatus}</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{vd.statusActive}</SelectItem>
                    <SelectItem value="paused">{vd.statusPaused}</SelectItem>
                    <SelectItem value="closed">{vd.statusClosed}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{vd.editSalaryRange}</Label>
              <Input value={editForm.salary} onChange={e => setEditForm(p => ({ ...p, salary: e.target.value }))} placeholder={cv.salaryPlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label>{vd.editDescription}</Label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={editForm.description}
                onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                placeholder={cv.descriptionPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{vd.editRequirements}</Label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                value={editForm.requirements}
                onChange={e => setEditForm(p => ({ ...p, requirements: e.target.value }))}
                placeholder={cv.requirementsPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{vd.editNiceToHave}</Label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={editForm.niceToHave}
                onChange={e => setEditForm(p => ({ ...p, niceToHave: e.target.value }))}
                placeholder={cv.niceToHavePlaceholder}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowEdit(false)} className="flex-1 gap-1.5">
                <X size={14} /> {vd.editCancel}
              </Button>
              <Button
                onClick={handleSaveVacancy}
                disabled={saving || !editForm.title.trim() || !editForm.company.trim()}
                className="flex-1 gradient-bg gap-1.5"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> {vd.editSaving}</> : <><Save size={14} /> {vd.editSave}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UploadCVDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        vacancyId={vacancy.id}
        vacancyTitle={vacancy.title}
        onUploaded={handleCandidateAdded}
      />
    </div>
  )
}
