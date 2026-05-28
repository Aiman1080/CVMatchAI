import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Merges Tailwind class names while resolving conflicts (e.g. p-2 vs p-4 keeps p-4)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Resolves a BCP-47 locale from the deltamatch-locale cookie (client-side) or falls back to 'en-GB'
function detectLocale(): string {
  const LOCALE_MAP: Record<string, string> = { fr: 'fr-FR', nl: 'nl-NL', en: 'en-GB' }
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)deltamatch-locale=(\w+)/)
    if (match) return LOCALE_MAP[match[1]] || 'en-GB'
  }
  return 'en-GB'
}

// Formats a date using the user's locale (from cookie) or the explicit locale param
export function formatDate(date: Date | string, locale?: string): string {
  const resolvedLocale = locale || detectLocale()
  return new Date(date).toLocaleDateString(resolvedLocale, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Shows human-readable relative time for recent events, falls back to formatDate after 7 days
export function formatRelativeTime(date: Date | string, locale?: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date, locale)
}

// Returns Tailwind color classes for status badges — unknown statuses get neutral grey
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    reviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
    shortlisted: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    hired: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    paused: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }
  return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Safe JSON parse that returns a typed fallback instead of throwing on malformed input
export function parseJsonSafe<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback
  try { return JSON.parse(str) as T } catch { return fallback }
}

// Truncates at word boundaries is not required here — just hard-cut with ellipsis
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
