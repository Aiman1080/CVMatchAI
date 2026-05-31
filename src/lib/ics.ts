// Generates RFC 5545 iCalendar (.ics) invitations for interviews. No external
// dependency — the format is simple and we control every field. The resulting
// string is attached to the interview email (Google/Outlook/Apple all parse it)
// and also offered as a download in the app.

export interface InterviewEvent {
  uid: string            // stable unique id (use the candidate id so updates replace)
  start: Date            // interview start
  durationMinutes: number
  summary: string        // event title, e.g. "Interview — Jane Doe (Frontend Dev)"
  description?: string
  location?: string      // room or video link
  organizerName?: string
  organizerEmail?: string
  attendeeName?: string
  attendeeEmail?: string
}

// Escape per RFC 5545 §3.3.11: backslash, semicolon, comma, newline.
function esc(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// UTC timestamp in iCal basic format: YYYYMMDDTHHMMSSZ
function toICalUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Fold lines to <=75 octets per RFC 5545 §3.1 (continuation lines start with a space).
function fold(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  let rest = line
  chunks.push(rest.slice(0, 75))
  rest = rest.slice(75)
  while (rest.length > 0) {
    chunks.push(' ' + rest.slice(0, 74))
    rest = rest.slice(74)
  }
  return chunks.join('\r\n')
}

export function buildICS(ev: InterviewEvent): string {
  const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000)
  const now = new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DeltaMatch//Interview//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${esc(ev.uid)}@deltamatch`,
    `DTSTAMP:${toICalUtc(now)}`,
    `DTSTART:${toICalUtc(ev.start)}`,
    `DTEND:${toICalUtc(end)}`,
    `SUMMARY:${esc(ev.summary)}`,
    ev.description ? `DESCRIPTION:${esc(ev.description)}` : '',
    ev.location ? `LOCATION:${esc(ev.location)}` : '',
    ev.organizerEmail ? `ORGANIZER;CN=${esc(ev.organizerName || ev.organizerEmail)}:mailto:${ev.organizerEmail}` : '',
    ev.attendeeEmail ? `ATTENDEE;CN=${esc(ev.attendeeName || ev.attendeeEmail)};RSVP=TRUE:mailto:${ev.attendeeEmail}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean) as string[]

  return lines.map(fold).join('\r\n')
}

// Convenience: a "Add to Google Calendar" URL (no OAuth needed — opens a
// prefilled event the user just saves). Handy as an in-app button for the recruiter.
export function googleCalendarUrl(ev: InterviewEvent): string {
  const end = new Date(ev.start.getTime() + ev.durationMinutes * 60_000)
  const fmt = (d: Date) => toICalUtc(d)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.summary,
    dates: `${fmt(ev.start)}/${fmt(end)}`,
    details: ev.description || '',
    location: ev.location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
