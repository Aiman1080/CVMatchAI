'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Video, ChevronRight as ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'

interface CalEvent {
  candidateId: string
  name: string
  vacancyTitle: string | null
  interviewAt: string
  durationMinutes: number
  location: string | null
  status: string
}

// Interactive monthly calendar at the top of the dashboard. Days with interviews
// are dotted; clicking a day shows that day's interviews with their times.
export function CalendarWidget() {
  const { t, locale } = useLanguage()
  const c = ((t.dashboard as any).calendar) || {}

  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  // The month currently displayed (first day of month)
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  // The selected day (defaults to today)
  const [selected, setSelected] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()) })

  useEffect(() => {
    // Fetch a wide window (±1 year) once so month navigation needs no refetch
    const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    const to = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then(r => (r.ok ? r.json() : { events: [] }))
      .then(d => setEvents(Array.isArray(d.events) ? d.events : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  // Map "YYYY-M-D" -> count, to dot the days that have interviews
  const countByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const ev of events) {
      const d = new Date(ev.interviewAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      m.set(key, (m.get(key) || 0) + 1)
    }
    return m
  }, [events])

  // Build the calendar grid (weeks of 7, Monday-first)
  const weeks = useMemo(() => {
    const year = cursor.getFullYear(), month = cursor.getMonth()
    const first = new Date(year, month, 1)
    // JS: 0=Sun..6=Sat → convert to Monday-first offset
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
    // Monday-first short weekday names in the active locale
    const base = new Date(2024, 0, 1) // a Monday
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(locale, { weekday: 'short' }))
  }, [locale])

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const isVideo = (loc: string | null) => !!loc && /https?:\/\//.test(loc)

  const goMonth = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))

  return (
    <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-500" />
            {c.calendarTitle || 'Interview calendar'}
          </CardTitle>
          <div className="flex items-center gap-1">
            <button onClick={() => goMonth(-1)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Previous month"><ChevronLeft size={16} /></button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize min-w-[120px] text-center">{monthLabel}</span>
            <button onClick={() => goMonth(1)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* The month grid */}
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

          {/* Selected day's interviews */}
          <div className="lg:border-l lg:border-gray-100 lg:dark:border-gray-800 lg:pl-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
              {selected.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {loading ? (
              <p className="text-xs text-gray-400 py-4">{c.loading || 'Loading…'}</p>
            ) : dayEvents.length === 0 ? (
              <p className="text-xs text-gray-400 py-6">{c.noneThisDay || 'No interviews on this day.'}</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map(ev => (
                  <Link
                    key={ev.candidateId + ev.interviewAt}
                    href={`/candidates/${ev.candidateId}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    <div className="shrink-0 text-center">
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none">{fmtTime(ev.interviewAt)}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{ev.durationMinutes}m</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        {ev.location && (
                          <span className="flex items-center gap-1 truncate max-w-[160px]">
                            {isVideo(ev.location) ? <Video className="w-3 h-3 shrink-0" /> : <MapPin className="w-3 h-3 shrink-0" />}
                            <span className="truncate">{isVideo(ev.location) ? (c.video || 'Video call') : ev.location}</span>
                          </span>
                        )}
                      </div>
                      {ev.vacancyTitle && <p className="text-[11px] text-gray-400 truncate">{ev.vacancyTitle}</p>}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
