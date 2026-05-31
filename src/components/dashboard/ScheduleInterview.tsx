'use client'

import { useState } from 'react'
import { CalendarClock, Loader2, Send, Trash2, ExternalLink, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDemoMode } from '@/hooks/useDemoGuard'

interface Props {
  candidateId: string
  candidateName: string
  vacancyTitle?: string
  initialInterviewAt?: string | null
  initialDuration?: number | null
  initialLocation?: string | null
}

// Interview scheduler shown at the top of the candidate's Interview tab.
// Persists date/duration/location, optionally emails the candidate an .ics
// invite, and offers an "Add to Google Calendar" link for the recruiter.
export function ScheduleInterview({
  candidateId, candidateName, vacancyTitle,
  initialInterviewAt, initialDuration, initialLocation,
}: Props) {
  const { t } = useLanguage()
  const c = ((t.dashboard as any).calendar) || {}
  const isDemo = useDemoMode()

  // Pre-fill a datetime-local string (yyyy-MM-ddThh:mm) from an ISO value
  const toLocalInput = (iso?: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [when, setWhen] = useState(toLocalInput(initialInterviewAt))
  const [duration, setDuration] = useState(String(initialDuration || 30))
  const [location, setLocation] = useState(initialLocation || '')
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scheduled, setScheduled] = useState(!!initialInterviewAt)

  const googleUrl = () => {
    if (!when) return '#'
    const start = new Date(when)
    const end = new Date(start.getTime() + (Number(duration) || 30) * 60000)
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Interview — ${candidateName}${vacancyTitle ? ` (${vacancyTitle})` : ''}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      location: location || '',
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const save = async () => {
    if (isDemo) { toast({ title: c.demoBlocked || 'Demo mode — cannot schedule', variant: 'destructive' }); return }
    if (!when) { toast({ title: c.pickDate || 'Pick a date and time', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewAt: new Date(when).toISOString(),
          interviewDuration: Number(duration) || 30,
          interviewLocation: location || null,
          notify,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed')
      setScheduled(true)
      toast({
        title: c.scheduled || 'Interview scheduled',
        description: data.emailed ? (c.invitedSent || 'Invitation emailed to the candidate.') : (notify ? (c.emailSkipped || 'Saved (email could not be sent — check SMTP).') : (c.savedNoEmail || 'Saved.')),
      })
    } catch (e: any) {
      toast({ title: c.scheduleFailed || 'Could not schedule', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const cancel = async () => {
    if (isDemo) { toast({ title: c.demoBlocked || 'Demo mode — cannot schedule', variant: 'destructive' }); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/candidates/${candidateId}/schedule`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      setScheduled(false); setWhen('')
      toast({ title: c.canceled || 'Interview unscheduled' })
    } catch {
      toast({ title: c.scheduleFailed || 'Could not update', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border border-gray-200 shadow-sm dark:border-gray-800 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-blue-500" /> {c.scheduleTitle || 'Schedule interview'}
          {scheduled && <span className="text-xs font-normal text-green-600 dark:text-green-400 flex items-center gap-1"><Check size={12} /> {c.set || 'set'}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{c.dateTime || 'Date & time'}</label>
            <Input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="mt-1" disabled={isDemo} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{c.duration || 'Duration (min)'}</label>
            <Input type="number" min={5} step={5} value={duration} onChange={e => setDuration(e.target.value)} className="mt-1" disabled={isDemo} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{c.location || 'Location or video link'}</label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder={c.locationPlaceholder || 'Office address, or https://meet.google.com/...'} className="mt-1" disabled={isDemo} />
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} disabled={isDemo} className="rounded" />
          {c.emailInvite || 'Email the candidate a calendar invitation (.ics)'}
        </label>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={save} disabled={saving || isDemo} size="sm" className="gap-2 gradient-bg">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {scheduled ? (c.update || 'Update') : (c.schedule || 'Schedule')}
          </Button>
          {when && (
            <a href={googleUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              <ExternalLink size={14} /> {c.addToGoogle || 'Add to my Google Calendar'}
            </a>
          )}
          {scheduled && (
            <Button onClick={cancel} disabled={saving || isDemo} size="sm" variant="outline" className="gap-1.5 text-red-600 hover:text-red-700">
              <Trash2 size={13} /> {c.cancelBtn || 'Cancel'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
