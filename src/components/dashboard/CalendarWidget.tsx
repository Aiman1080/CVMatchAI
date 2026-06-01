'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Video, ChevronRight as ArrowRight, Plus, Trash2, Link2, Loader2, X, Check, Copy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDemoMode } from '@/hooks/useDemoGuard'

interface CalEvent {
  kind?: 'interview' | 'personal'
  candidateId?: string
  eventId?: string
  name: string
  vacancyTitle: string | null
  interviewAt: string
  durationMinutes: number
  location: string | null
  notes?: string | null
  status: string
}

// Interactive monthly calendar at the top of the dashboard. Days with events are
// dotted; clicking a day shows that day's interviews + personal events. Lets the
// user add personal events and subscribe to a private iCal feed (Google/Outlook).
export function CalendarWidget() {
  const { t, locale } = useLanguage()
  const c = ((t.dashboard as any).calendar) || {}
  const isDemo = useDemoMode()

  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) })

  // Add-event form
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', time: '09:00', duration: '30', location: '' })
  const [saving, setSaving] = useState(false)

  // iCal feed subscription
  const [showFeed, setShowFeed] = useState(false)
  const [feedUrl, setFeedUrl] = useState('')

  const loadEvents = () => {
    const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    return fetch(`/api/calendar?from=${from}&to=${to}`)
      .then(r => (r.ok ? r.json() : { events: [] }))
      .then(d => setEvents(Array.isArray(d.events) ? d.events : []))
      .catch(() => {})
  }

  useEffect(() => { loadEvents().finally(() => setLoading(false)) }, [])

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const countByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const ev of events) {
      const d = new Date(ev.interviewAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      m.set(key, (m.get(key) || 0) + 1)
    }
    return m
  }, [events])

  const weeks = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    while (cells.length % 7 !== 0) cells.push(null)
    const rows: (Date | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
    return rows
  }, [cursor])

  const today = new Date()
  const dayEvents = useMemo(
    () => events
      .filter(ev => sameDay(new Date(ev.interviewAt), selected))
      .sort((a, b) => new Date(a.interviewAt).getTime() - new Date(b.interviewAt).getTime()),
    [events, selected],
  )

  const monthLabel = cursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1)
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(locale, { weekday: 'short' }))
  }, [locale])

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const isVideo = (loc: string | null) => !!loc && /https?:\/\//.test(loc)
  const goMonth = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))

  const addEvent = async () => {
    if (isDemo) { toast({ title: c.demoBlocked || 'Demo mode - cannot add', variant: 'destructive' }); return }
    if (!form.title.trim()) { toast({ title: c.titleRequired || 'Enter a title', variant: 'destructive' }); return }
    // Combine the selected day + the chosen time into a local datetime
    const [h, m] = form.time.split(':').map(Number)
    const start = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), h || 0, m || 0)
    setSaving(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, startAt: start.toISOString(), durationMinutes: Number(form.duration) || 30, location: form.location || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed')
      await loadEvents()
      setShowAdd(false)
      setForm({ title: '', time: '09:00', duration: '30', location: '' })
      toast({ title: c.eventAdded || 'Event added' })
    } catch (e: any) {
      toast({ title: e.message || (c.addFailed || 'Could not add event'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (isDemo) return
    setEvents(prev => prev.filter(e => e.eventId !== eventId))
    try { await fetch(`/api/calendar/${eventId}`, { method: 'DELETE' }) } catch {}
  }

  const openFeed = async () => {
    setShowFeed(true)
    if (feedUrl) return
    try {
      const res = await fetch('/api/calendar/feed-token')
      const data = await res.json().catch(() => ({}))
      if (data.url) setFeedUrl(data.url)
    } catch {}
  }

  return (
    <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            {c.calendarTitle || 'Interview calendar'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={openFeed} className="gap-1.5 h-7 text-xs">
              <Link2 size={12} /> {c.subscribe || 'Sync to my calendar'}
            </Button>
            <div className="flex items-center gap-1">
              <button onClick={() => goMonth(-1)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Previous month"><ChevronLeft size={16} /></button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize min-w-[110px] text-center">{monthLabel}</span>
              <button onClick={() => goMonth(1)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Next month"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* iCal subscription panel */}
        {showFeed && (
          <div className="mb-4 p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{c.subscribeTitle || 'Add this calendar to Google / Outlook / Apple'}</p>
              <button onClick={() => setShowFeed(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{c.subscribeHelp || 'Copy this private link and add it as a calendar subscription (Google Calendar → Other calendars → From URL). Your interviews and personal events will appear in your own calendar and stay in sync.'}</p>
            <div className="flex items-center gap-2">
              <Input readOnly value={feedUrl} className="text-xs font-mono" onFocus={e => e.currentTarget.select()} />
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(feedUrl).then(() => toast({ title: c.copied || 'Copied' })).catch(() => {}) }} className="gap-1.5 shrink-0"><Copy size={13} /> {c.copy || 'Copy'}</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Month grid */}
          <div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekdayLabels.map((w, i) => (
                <div key={i} className="text-center text-[11px] font-medium text-gray-400 uppercase py-1">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((day, i) => {
                if (!day) return <div key={i} />
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
                const count = countByDay.get(key) || 0
                const isToday = sameDay(day, today)
                const isSel = sameDay(day, selected)
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(day)}
                    className={`relative aspect-square rounded-lg text-sm flex items-center justify-center transition-colors
                      ${isSel ? 'bg-blue-500 text-white font-semibold'
                        : isToday ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                  >
                    {day.getDate()}
                    {count > 0 && (
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-blue-500'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day's events */}
          <div className="lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {selected.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {!isDemo && (
                <Button size="sm" variant="outline" onClick={() => setShowAdd(v => !v)} className="gap-1 h-7 text-xs">
                  <Plus size={13} /> {c.addEvent || 'Add event'}
                </Button>
              )}
            </div>

            {/* Inline add-event form */}
            {showAdd && (
              <div className="mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                <Input placeholder={c.eventTitle || 'Event title'} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="text-sm" />
                <div className="flex gap-2">
                  <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="text-sm" />
                  <Input type="number" min={5} step={5} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="text-sm w-20" title={c.duration || 'Duration (min)'} />
                </div>
                <Input placeholder={c.location || 'Location or link (optional)'} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addEvent} disabled={saving} className="gap-1.5 gradient-bg flex-1">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {c.save || 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>{c.cancelBtn || 'Cancel'}</Button>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-xs text-gray-400 py-4">{c.loading || 'Loading…'}</p>
            ) : dayEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-6">{c.noneThisDay || 'No events on this day.'}</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((ev, idx) => {
                  const isPersonal = ev.kind === 'personal'
                  const inner = (
                    <>
                      <div className="shrink-0 text-center">
                        <div className={`text-sm font-bold leading-none ${isPersonal ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>{fmtTime(ev.interviewAt)}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{ev.durationMinutes}m</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {isPersonal && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300">{c.personalLabel || 'Personal'}</span>}
                          {ev.location && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              {isVideo(ev.location) ? <Video className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0" />}
                              <span className="truncate">{isVideo(ev.location) ? (c.video || 'Video call') : ev.location}</span>
                            </span>
                          )}
                        </div>
                        {ev.vacancyTitle && <p className="text-[11px] text-gray-400 truncate">{ev.vacancyTitle}</p>}
                      </div>
                    </>
                  )
                  if (isPersonal) {
                    return (
                      <div key={`p${ev.eventId}${idx}`} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 group">
                        {inner}
                        {!isDemo && (
                          <button onClick={() => ev.eventId && deleteEvent(ev.eventId)} className="text-gray-300 hover:text-red-500 shrink-0" aria-label="Delete"><Trash2 size={14} /></button>
                        )}
                      </div>
                    )
                  }
                  return (
                    <Link key={`i${ev.candidateId}${idx}`} href={`/candidates/${ev.candidateId}`} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      {inner}
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
