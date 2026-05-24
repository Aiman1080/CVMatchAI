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
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({
    title: '', company: '', department: '', location: '',
    type: 'full-time', description: '', requirements: '',
    niceToHave: '', salary: '', language: 'en',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          toast({ title: cv.createError, variant: 'destructive' })
        }
        return
      }
      const vacancy = await res.json()
      onCreated(vacancy)
      toast({ title: cv.created, description: `"${vacancy.title}" ${cv.isNowLive}`, variant: 'default' })
      setForm({ title: '', company: '', department: '', location: '', type: 'full-time', description: '', requirements: '', niceToHave: '', salary: '', language: 'en' })
    } catch {
      toast({ title: cv.createError, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cv.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{cv.jobTitle} <span className="text-red-500">*</span></Label>
              <Input placeholder={cv.jobTitlePlaceholder} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>{cv.company} <span className="text-red-500">*</span></Label>
              <Input placeholder={cv.companyPlaceholder} value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{cv.department}</Label>
              <Input placeholder={cv.departmentPlaceholder} value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{cv.location}</Label>
              <Input placeholder={cv.locationPlaceholder} value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
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
                  <SelectItem value="de">{cv.languages.de}</SelectItem>
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
            className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? cv.generatingAIBtn : cv.generateAIBtn}
          </Button>
          <div className="space-y-1.5">
            <Label>{cv.description} <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder={cv.descriptionPlaceholder}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>{cv.requirements} <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder={cv.requirementsPlaceholder}
              value={form.requirements}
              onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              rows={3}
              required
            />
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">{cv.cancel}</Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-bg">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? cv.creating : cv.create}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
