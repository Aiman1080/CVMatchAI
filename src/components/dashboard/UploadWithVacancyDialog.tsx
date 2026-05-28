'use client'

import { useState, useEffect } from 'react'
import { Upload, Loader2, Briefcase } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UploadCVDialog } from './UploadCVDialog'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  open: boolean
  onClose: () => void
  onUploaded: (candidate: any) => void
}

export function UploadWithVacancyDialog({ open, onClose, onUploaded }: Props) {
  const { t } = useLanguage()
  const [vacancies, setVacancies] = useState<Array<{ id: string; title: string; company: string }>>([])
  const [loading, setLoading] = useState(false)
  const [selectedVacancy, setSelectedVacancy] = useState<string>('')
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      fetch('/api/vacancies')
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data) ? data : data.vacancies || []
          setVacancies(list.filter((v: any) => v.status === 'active'))
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open])

  const handleClose = () => {
    setSelectedVacancy('')
    setShowUpload(false)
    onClose()
  }

  const selected = vacancies.find(v => v.id === selectedVacancy)

  if (showUpload && selected) {
    return (
      <UploadCVDialog
        open={true}
        onClose={handleClose}
        vacancyId={selected.id}
        vacancyTitle={selected.title}
        onUploaded={(candidate) => {
          onUploaded(candidate)
        }}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-500" />
            {t.dashboard.upload.uploadCvTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.dashboard.upload.selectVacancyLabel} <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 p-3 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> {t.dashboard.upload.loadingVacancies}
              </div>
            ) : vacancies.length === 0 ? (
              <div className="p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t.dashboard.vacancies.createFirst}</p>
              </div>
            ) : (
              <Select value={selectedVacancy} onValueChange={setSelectedVacancy}>
                <SelectTrigger>
                  <SelectValue placeholder={t.dashboard.upload.choosePlaceholder} />
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

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t.dashboard.createVacancy.cancel}
            </Button>
            <Button
              onClick={() => setShowUpload(true)}
              disabled={!selectedVacancy}
              className="flex-1 gradient-bg"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.dashboard.upload.continueBtn}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
