'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'

interface Vacancy {
  id: string
  title: string
  company: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export function ImportCSVDialog({
  open,
  onOpenChange,
  onImportComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [selectedVacancy, setSelectedVacancy] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loadingVacancies, setLoadingVacancies] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFile(null)
      setResult(null)
      setSelectedVacancy('')
      setLoadingVacancies(true)
      fetch('/api/vacancies')
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : data.vacancies || []
          setVacancies(list)
        })
        .catch(() => toast({ title: 'Failed to load vacancies', variant: 'destructive' }))
        .finally(() => setLoadingVacancies(false))
    }
  }, [open])

  const downloadTemplate = () => {
    const csv = 'firstName,lastName,email,phone,linkedIn,status\nJohn,Doe,john@example.com,+1234567890,https://linkedin.com/in/johndoe,new\nJane,Smith,jane@example.com,,https://linkedin.com/in/janesmith,reviewing\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'candidates-template.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleUpload = async () => {
    if (!file || !selectedVacancy) return
    setUploading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vacancyId', selectedVacancy)
      const res = await fetch('/api/candidates/import', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error || 'Import failed', variant: 'destructive' })
        return
      }
      setResult(data)
      if (data.imported > 0) {
        toast({ title: `${data.imported} candidate(s) imported successfully` })
        onImportComplete?.()
      }
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload size={18} /> Import Candidates from CSV
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {/* Vacancy selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              Select vacancy
            </label>
            {loadingVacancies ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Loading vacancies...
              </div>
            ) : vacancies.length === 0 ? (
              <p className="text-sm text-gray-500">No vacancies found. Create a vacancy first.</p>
            ) : (
              <Select value={selectedVacancy} onValueChange={setSelectedVacancy}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vacancy..." />
                </SelectTrigger>
                <SelectContent>
                  {vacancies.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.title} — {v.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* File input */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
              CSV file
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => {
                  setFile(e.target.files?.[0] || null)
                  setResult(null)
                }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FileText size={16} className="text-blue-500" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <Upload size={20} className="mx-auto mb-1 text-gray-400" />
                  Click to select a CSV file
                </div>
              )}
            </div>
          </div>

          {/* Download template */}
          <button
            onClick={downloadTemplate}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Download size={14} /> Download CSV template
          </button>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!file || !selectedVacancy || uploading}
            className="w-full gap-2 gradient-bg"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Upload size={16} /> Import candidates
              </>
            )}
          </Button>

          {/* Results summary */}
          {result && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-medium">{result.imported} imported</span>
                {result.skipped > 0 && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <AlertCircle size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{result.skipped} skipped</span>
                  </>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-gray-500 dark:text-gray-400">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
