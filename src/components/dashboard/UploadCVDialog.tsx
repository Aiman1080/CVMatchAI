'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle, X, Plus, Paperclip } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  open: boolean
  onClose: () => void
  vacancyId: string
  vacancyTitle: string
  onUploaded: (candidate: any) => void
}

// One row = one CV + an OPTIONAL motivation letter that get paired into a single candidate.
interface CvRow {
  id: string
  cv: File
  motivation: File | null
}

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'text/plain': ['.txt'],
}

// Multi-CV upload: drop several CVs, attach an optional motivation letter to each,
// pick GDPR consent, then upload sequentially (one candidate per CV row).
export function UploadCVDialog({ open, onClose, vacancyId, vacancyTitle, onUploaded }: Props) {
  const { t } = useLanguage()
  const u = t.dashboard.upload
  const [rows, setRows] = useState<CvRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [gdprConsent, setGdprConsent] = useState(false)
  const [results, setResults] = useState<any[]>([])

  // Each dropped file becomes its own CV row (cap at 10 to protect the AI queue)
  const onDrop = useCallback((accepted: File[]) => {
    setRows(prev => [
      ...prev,
      ...accepted.map(f => ({ id: crypto.randomUUID(), cv: f, motivation: null as File | null })),
    ].slice(0, 10))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: 10 * 1024 * 1024,
  })

  const setRowMotivation = (id: string, file: File | null) =>
    setRows(prev => prev.map(r => (r.id === id ? { ...r, motivation: file } : r)))
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id))

  const handleUpload = async () => {
    if (!gdprConsent) {
      toast({ title: u.gdprRequired, description: u.gdprRequiredDesc, variant: 'destructive' })
      return
    }
    setUploading(true)
    const uploaded: any[] = []

    // Upload rows sequentially - parallel uploads could saturate the AI analysis API
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      setProgress(Math.round((i / rows.length) * 100))

      const formData = new FormData()
      formData.append('file', row.cv)
      if (row.motivation) formData.append('motivation', row.motivation)
      formData.append('vacancyId', vacancyId)
      formData.append('gdprConsent', 'true')

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok && data.success) {
          uploaded.push({ file: row.cv.name, success: true, candidate: data.candidate, score: data.candidate.matchScore })
          onUploaded(data.candidate)
        } else {
          const fallback = ((u as any).uploadErrorFallback || 'Could not upload {name}. Make sure it is a valid PDF/DOCX under 10MB.').replace('{name}', row.cv.name)
          uploaded.push({ file: row.cv.name, success: false, error: data.error || fallback })
        }
      } catch {
        uploaded.push({ file: row.cv.name, success: false, error: ((u as any).uploadNetworkError || 'Network error uploading {name}. Please check your connection and try again.').replace('{name}', row.cv.name) })
      }
    }

    setProgress(100)
    setResults(uploaded)
    setUploading(false)

    const successes = uploaded.filter(r => r.success).length
    toast({
      title: u.filesProcessed.replace('{success}', String(successes)).replace('{total}', String(rows.length)),
      description: u.aiAnalysisComplete.replace('{count}', String(successes)),
    })
  }

  // Reset all state on close so the dialog is fresh when reopened
  const handleClose = () => {
    setRows([])
    setResults([])
    setProgress(0)
    setGdprConsent(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="break-words">{u.dialogTitle}</DialogTitle>
          <DialogDescription className="break-words">{u.forVacancy} <strong>{vacancyTitle}</strong></DialogDescription>
        </DialogHeader>

        {results.length > 0 ? (() => {
          const successCount = results.filter(r => r.success).length
          const failedCount = results.length - successCount
          return (
            <div className="space-y-3">
              {successCount > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300 break-words">
                        {(successCount === 1
                          ? ((u as any).candidatesAdded || '{count} candidate added successfully')
                          : ((u as any).candidatesAddedPlural || '{count} candidates added successfully')
                        ).replace('{count}', String(successCount))}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400 break-words">
                        {(u as any).analysisCompleteHelp || 'AI analysis complete - view scores and details in the candidates list.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {failedCount > 0 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 flex items-start gap-2.5">
                  <X className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-700 dark:text-red-400 break-words min-w-0">
                    {(failedCount === 1
                      ? ((u as any).filesFailed || '{count} file could not be processed. See details below.')
                      : ((u as any).filesFailedPlural || '{count} files could not be processed. See details below.')
                    ).replace('{count}', String(failedCount))}
                  </div>
                </div>
              )}
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 break-words">{u.analysisComplete}</p>
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${r.success ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                  {r.success ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <X className="w-4 h-4 text-red-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.file}</p>
                    {r.success && r.score && (
                      <p className="text-xs text-gray-500 break-words">{u.matchScore} <strong>{r.score.toFixed(0)}%</strong></p>
                    )}
                    {!r.success && <p className="text-xs text-red-600 break-words">{r.error}</p>}
                  </div>
                </div>
              ))}
              <Button onClick={handleClose} className="w-full gradient-bg h-auto py-2 whitespace-normal text-center leading-tight">{u.done}</Button>
            </div>
          )
        })() : (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <input {...getInputProps()} />
              <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-sm font-medium text-gray-700 break-words">
                {isDragActive ? u.dropFiles : (rows.length > 0 ? ((u as any).addMoreCvs || u.dragDrop) : u.dragDrop)}
              </p>
              <p className="text-xs text-gray-400 mt-1 break-words">{u.fileFormats}</p>
            </div>

            {rows.length > 0 && (
              <>
                {/* Column hint: CV on the left, optional motivation on the right */}
                <div className="flex items-center justify-between px-1 text-[11px] font-medium text-gray-400">
                  <span>{(u as any).cvLabel || 'CV'}</span>
                  <span>{(u as any).motivationOptional || 'Motivation letter (optional)'}</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {rows.map(row => (
                    <div key={row.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2.5">
                      <div className="flex items-center gap-2">
                        {/* CV (left) */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{row.cv.name}</p>
                            <p className="text-[10px] text-gray-400">{(row.cv.size / 1024).toFixed(0)}KB</p>
                          </div>
                        </div>

                        {/* Motivation (right) */}
                        <div className="shrink-0">
                          {row.motivation ? (
                            <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-md px-2 py-1">
                              <Paperclip className="w-3 h-3 text-purple-500 shrink-0" />
                              <span className="text-[11px] text-purple-700 dark:text-purple-300 max-w-[100px] truncate">{row.motivation.name}</span>
                              <button onClick={() => setRowMotivation(row.id, null)} className="text-purple-400 hover:text-red-500 shrink-0" title={(u as any).removeMotivation || 'Remove'}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 border border-dashed border-purple-300 dark:border-purple-700 rounded-md px-2 py-1 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors">
                              <input
                                type="file"
                                accept=".pdf,.docx,.doc,.txt"
                                className="hidden"
                                onChange={e => setRowMotivation(row.id, e.target.files?.[0] || null)}
                              />
                              <Plus size={12} /> {(u as any).addMotivation || 'Add letter'}
                            </label>
                          )}
                        </div>

                        {/* Remove row */}
                        <button onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-500 shrink-0" title="✕">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between gap-2 text-xs text-gray-500">
                  <span className="min-w-0 break-words">{u.processingAI}</span>
                  <span className="shrink-0">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* EU GDPR regulation requires explicit consent before processing personal data */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <input
                type="checkbox"
                id="gdpr"
                checked={gdprConsent}
                onChange={e => setGdprConsent(e.target.checked)}
                className="mt-0.5 rounded shrink-0"
              />
              <label htmlFor="gdpr" className="text-xs text-gray-600 dark:text-gray-300 cursor-pointer break-words min-w-0">
                {u.gdprConsent}
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1 h-auto py-2 whitespace-normal text-center leading-tight">{u.cancelBtn}</Button>
              <Button
                onClick={handleUpload}
                disabled={rows.length === 0 || uploading || !gdprConsent}
                className="flex-1 gradient-bg h-auto py-2 whitespace-normal text-center leading-tight"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> {u.analyzing}</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2 shrink-0" /> {u.uploadAnalyze}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
