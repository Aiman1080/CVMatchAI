'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Clock, MapPin, Video, ChevronRight } from 'lucide-react'
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

// Dashboard widget: the recruiter's upcoming interviews, grouped by day, fetched
// from /api/calendar. Read-only summary with deep links to each candidate.
export function UpcomingInterviews() {
  const { t, locale } = useLanguage()
  const c = ((t.dashboard as any).calendar) || {}
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => (r.ok ? r.json() : { events: [] }))
      .then(d => setEvents(Array.isArray(d.events) ? d.events : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

  const isVideo = (loc: string | null) => !!loc && /https?:\/\//.test(loc)

  return (
    <Card className="border border-gray-200 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          {c.upcomingTitle || 'Upcoming interviews'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-xs text-gray-400 py-4 text-center">{c.loading || 'Loading…'}</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">
            {c.empty || 'No interviews scheduled. Schedule one from a candidate’s Interview tab.'}
          </p>
        ) : (
          events.slice(0, 6).map(ev => (
            <Link
              key={ev.candidateId + ev.interviewAt}
              href={`/candidates/${ev.candidateId}`}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
            >
              <div className="shrink-0 w-11 text-center">
                <div className="text-[10px] uppercase font-semibold text-blue-500">{fmtDay(ev.interviewAt).split(' ')[0]}</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">{new Date(ev.interviewAt).getDate()}</div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmtTime(ev.interviewAt)} · {ev.durationMinutes}m</span>
                  {ev.location && (
                    <span className="flex items-center gap-1 truncate max-w-[140px]">
                      {isVideo(ev.location) ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      <span className="truncate">{isVideo(ev.location) ? (c.video || 'Video call') : ev.location}</span>
                    </span>
                  )}
                </div>
                {ev.vacancyTitle && <p className="text-[11px] text-gray-400 truncate">{ev.vacancyTitle}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  )
}
