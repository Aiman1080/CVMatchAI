'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (vacancy: any) => void
}

export function CreateVacancyDialog({ open, onClose, onCreated }: Props) {
  const { t } = useLanguage()
  const cv = t.dashboard.createVacancy
  // Validation strings; fallback in case translations are not loaded yet (during tests)
  const vmsg = (cv as any).validation || {
    titleRequired: 'Job title is required',
    companyRequired: 'Company name is required',
    descriptionRequired: 'Please add a job description',
    descriptionTooShort: 'Description should be at least 30 characters',
    requirementsRequired: 'Please list the requirements',
  }
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({
    title: '', company: '', department: '', location: '',
    type: 'full-time', description: '', requirements: '',
    niceToHave: '', salary: '', language: 'en',
  })

  // Pure validator — returns the full error map for a given form
  const validate = (f: typeof form): Record<string, string> => {
    const next: Record<string, string> = {}
    if (!f.title.trim()) next.title = vmsg.titleRequired
    if (!f.company.trim()) next.company = vmsg.companyRequired
    if (!f.description.trim()) next.description = vmsg.descriptionRequired
    else if (f.description.trim().length < 30) next.description = vmsg.descriptionTooShort
    if (!f.requirements.trim()) next.requirements = vmsg.requirementsRequired
    return next
  }

  // Re-validate just the fields the user has interacted with — avoids shouting errors at first paint
  const validateOnChange = (next: typeof form) => {
    const allErrors = validate(next)
    setErrors(prev => {
      const filtered: Record<string, string> = {}
      Object.keys(allErrors).forEach(k => { if (touched[k]) filtered[k] = allErrors[k] })
      // Preserve fields that are still invalid even if not yet touched on submit
      Object.keys(prev).forEach(k => { if (allErrors[k]) filtered[k] = allErrors[k] })
      return filtered
    })
  }

  const setField = (key: keyof typeof form, value: any) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (touched[key]) validateOnChange(next)
  }

  const markTouched = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const allErrors = validate(form)
    if (allErrors[key]) setErrors(prev => ({ ...prev, [key]: allErrors[key] }))
    else setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Mark every required field as touched so the user sees all errors at once
    setTouched({ title: true, company: true, description: true, requirements: true })
    const allErrors = validate(form)
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      toast({ title: 'Please fix the highlighted fields', description: 'Some required fields are missing or invalid.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 403 && data.upgrade) {
          toast({
            title: cv.limitReached || 'Limit reached',
            description: t.dashboard.upgrade.vacancyLimitDesc,
            variant: 'destructive',
          })
        } else {
          toast({
            title: cv.createError,
            description: data.error || 'Could not create the vacancy. Please check the fields and try again.',
            variant: 'destructive',
          })
        }
        return
      }
      const vacancy = await res.json()
      onCreated(vacancy)
      toast({ title: cv.created, description: `"${vacancy.title}" ${cv.isNowLive}`, variant: 'default' })
      setForm({ title: '', company: '', department: '', location: '', type: 'full-time', description: '', requirements: '', niceToHave: '', salary: '', language: 'en' })
      setErrors({})
      setTouched({})
    } catch {
      toast({ title: cv.createError, description: 'Network error. Please check your connection and try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="break-words">{cv.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{cv.jobTitle} <span className="text-red-500">*</span></Label>
              <Input
                placeholder={cv.jobTitlePlaceholder}
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                onBlur={() => markTouched('title')}
                aria-invalid={!!errors.title}
                className={errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.title && <p className="text-xs text-red-500" role="alert">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{cv.company} <span className="text-red-500">*</span></Label>
              <Input
                placeholder={cv.companyPlaceholder}
                value={form.company}
                onChange={e => setField('company', e.target.value)}
                onBlur={() => markTouched('company')}
                aria-invalid={!!errors.company}
                className={errors.company ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.company && <p className="text-xs text-red-500" role="alert">{errors.company}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{cv.department}</Label>
              <Input placeholder={cv.departmentPlaceholder} value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{cv.location}</Label>
              <Input placeholder={cv.locationPlaceholder} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>{cv.type}</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">{cv.contractTypes['full-time']}</SelectItem>
                  <SelectItem value="part-time">{cv.contractTypes['part-time']}</SelectItem>
                  <SelectItem value="contract">{cv.contractTypes.contract}</SelectItem>
                  <SelectItem value="internship">{cv.contractTypes.internship}</SelectItem>
                  <SelectItem value="remote">{cv.contractTypes.remote}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{cv.language}</Label>
              <Select value={form.language} onValueChange={v => setForm(p => ({ ...p, language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{cv.languages.en}</SelectItem>
                  <SelectItem value="nl">{cv.languages.nl}</SelectItem>
                  <SelectItem value="fr">{cv.languages.fr}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{cv.salary}</Label>
              <Input placeholder={cv.salaryPlaceholder} value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={generating || !form.title.trim()}
            onClick={async () => {
              setGenerating(true)
              try {
                const res = await fetch('/api/vacancies/generate-description', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: form.title, keywords: form.department, language: form.language, company: form.company }),
                })
                const data = await res.json()
                if (res.ok) {
                  setForm(p => ({ ...p, description: data.description, requirements: data.requirements, niceToHave: data.niceToHave }))
                  toast({ title: cv.descGenerated })
                }
              } catch { toast({ title: cv.genFailed, variant: 'destructive' }) }
              finally { setGenerating(false) }
            }}
            className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 h-auto py-2 whitespace-normal text-center leading-tight"
          >
            {generating ? <Loader2 size={14} className="animate-spin shrink-0" /> : <Sparkles size={14} className="shrink-0" />}
            {generating ? cv.generatingAIBtn : cv.generateAIBtn}
          </Button>
          <div className="space-y-1.5">
            <Label>{cv.description} <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder={cv.descriptionPlaceholder}
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              onBlur={() => markTouched('description')}
              aria-invalid={!!errors.description}
              rows={4}
              className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            <div className="flex items-center justify-between">
              {errors.description ? (
                <p className="text-xs text-red-500" role="alert">{errors.description}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-400 text-right">{form.description.length} characters</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{cv.requirements} <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder={cv.requirementsPlaceholder}
              value={form.requirements}
              onChange={e => setField('requirements', e.target.value)}
              onBlur={() => markTouched('requirements')}
              aria-invalid={!!errors.requirements}
              rows={3}
              className={errors.requirements ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            <div className="flex items-center justify-between">
              {errors.requirements ? (
                <p className="text-xs text-red-500" role="alert">{errors.requirements}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-400 text-right">{form.requirements.length} characters</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{cv.niceToHave}</Label>
            <Textarea
              placeholder={cv.niceToHavePlaceholder}
              value={form.niceToHave}
              onChange={e => setForm(p => ({ ...p, niceToHave: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-auto py-2 whitespace-normal text-center leading-tight">{cv.cancel}</Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-bg h-auto py-2 whitespace-normal text-center leading-tight">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" />}
              {loading ? cv.creating : cv.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
