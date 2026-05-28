'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Loader2, CheckCircle, X } from 'lucide-react'
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

// Handles multi-file CV/motivation letter uploads with per-file progress and GDPR consent gate
export function UploadCVDialog({ open, onClose, vacancyId, vacancyTitle, onUploaded }: Props) {
  const { t } = useLanguage()
  const u = t.dashboard.upload
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [gdprConsent, setGdprConsent] = useState(false)
  const [results, setResults] = useState<any[]>([])

  // Cap at 10 files per session to avoid overwhelming the AI analysis queue
  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [...prev, ...accepted].slice(0, 10))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const handleUpload = async () => {
    if (!gdprConsent) {
      toast({ title: u.gdprRequired, description: u.gdprRequiredDesc, variant: 'destructive' })
      return
    }
    setUploading(true)
    const uploaded: any[] = []

    // Upload files sequentially — parallel uploads could saturate the AI analysis API
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress(Math.round(((i) / files.length) * 100))

      const formData = new FormData()
      formData.append('file', file)
      formData.append('vacancyId', vacancyId)
      formData.append('gdprConsent', 'true')

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok && data.success) {
          uploaded.push({ file: file.name, success: true, candidate: data.candidate, score: data.candidate.matchScore })
          onUploaded(data.candidate)
        } else {
          // Use server-provided detailed error if available, else a clear instruction
          const fallback = `Could not upload ${file.name}. Make sure it is a valid PDF/DOCX under 10MB.`
          uploaded.push({ file: file.name, success: false, error: data.error || fallback })
        }
      } catch {
        uploaded.push({ file: file.name, success: false, error: `Network error uploading ${file.name}. Please check your connection and try again.` })
      }
    }

    setProgress(100)
    setResults(uploaded)
    setUploading(false)

    const successes = uploaded.filter(r => r.success).length
    toast({
      title: u.filesProcessed.replace('{success}', String(successes)).replace('{total}', String(files.length)),
      description: u.aiAnalysisComplete.replace('{count}', String(successes)),
    })
  }

  // Reset all state on close so the dialog is fresh when reopened
  const handleClose = () => {
    setFiles([])
    setResults([])
    setProgress(0)
    setGdprConsent(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{u.dialogTitle}</DialogTitle>
          <DialogDescription>{u.forVacancy} <strong>{vacancyTitle}</strong></DialogDescription>
        </DialogHeader>

        {results.length > 0 ? (() => {
          const successCount = results.filter(r => r.success).length
          const failedCount = results.length - successCount
          return (
            <div className="space-y-3">
              {/* Prominent success summary */}
              {successCount > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                        {successCount} candidate{successCount === 1 ? '' : 's'} added successfully
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        AI analysis complete — view scores and details in the candidates list.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {failedCount > 0 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 flex items-start gap-2.5">
                  <X className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-700 dark:text-red-400">
                    {failedCount} file{failedCount === 1 ? '' : 's'} could not be processed. See details below.
                  </div>
                </div>
              )}
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{u.analysisComplete}</p>
              {results.map((r, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${r.success ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                  {r.success ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0" /> : <X className="w-4 h-4 text-red-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.file}</p>
                    {r.success && r.score && (
                      <p className="text-xs text-gray-500">{u.matchScore} <strong>{r.score.toFixed(0)}%</strong></p>
                    )}
                    {!r.success && <p className="text-xs text-red-600">{r.error}</p>}
                  </div>
                </div>
              ))}
              <Button onClick={handleClose} className="w-full gradient-bg">{u.done}</Button>
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
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? u.dropFiles : u.dragDrop}
              </p>
              <p className="text-xs text-gray-400 mt-1">{u.fileFormats}</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{u.processingAI}</span>
                  <span>{progress}%</span>
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
                className="mt-0.5 rounded"
              />
              <label htmlFor="gdpr" className="text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                {u.gdprConsent}
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">{u.cancelBtn}</Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading || !gdprConsent}
                className="flex-1 gradient-bg"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {u.analyzing}</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> {u.uploadAnalyze}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
