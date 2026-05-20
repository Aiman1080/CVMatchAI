'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (vacancy: any) => void
}

export function CreateVacancyDialog({ open, onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false)
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
      if (!res.ok) throw new Error('Failed to create')
      const vacancy = await res.json()
      onCreated(vacancy)
      toast({ title: 'Vacancy created!', description: `"${vacancy.title}" is now live.`, variant: 'default' })
      setForm({ title: '', company: '', department: '', location: '', type: 'full-time', description: '', requirements: '', niceToHave: '', salary: '', language: 'en' })
    } catch {
      toast({ title: 'Error', description: 'Failed to create vacancy', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Vacancy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Job Title *</Label>
              <Input placeholder="e.g. Senior Developer" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Company *</Label>
              <Input placeholder="Company name" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input placeholder="e.g. Engineering" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="e.g. Brussels, Remote" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select value={form.language} onValueChange={v => setForm(p => ({ ...p, language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Salary</Label>
              <Input placeholder="e.g. €50k–€70k" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Job Description *</Label>
            <Textarea
              placeholder="Describe the role, responsibilities and company culture..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Requirements *</Label>
            <Textarea
              placeholder="List required skills, experience and qualifications..."
              value={form.requirements}
              onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))}
              rows={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nice to Have</Label>
            <Textarea
              placeholder="Optional bonus skills or experience..."
              value={form.niceToHave}
              onChange={e => setForm(p => ({ ...p, niceToHave: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1 gradient-bg">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Vacancy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
