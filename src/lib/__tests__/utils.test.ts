import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatRelativeTime, getStatusColor, escapeHtml, parseJsonSafe, truncate } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold')
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    const result = formatDate(new Date('2024-06-15'))
    expect(result).toContain('2024')
    expect(result).toContain('15')
  })

  it('formats a date string', () => {
    const result = formatDate('2024-01-01')
    expect(result).toContain('2024')
  })
})

describe('formatRelativeTime', () => {
  it('returns "Just now" for very recent dates', () => {
    const result = formatRelativeTime(new Date())
    expect(result).toBe('Just now')
  })

  it('returns hours ago for recent dates', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000)
    const result = formatRelativeTime(twoHoursAgo)
    expect(result).toBe('2h ago')
  })

  it('returns days ago for dates within a week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000)
    const result = formatRelativeTime(threeDaysAgo)
    expect(result).toBe('3d ago')
  })

  it('falls back to formatDate after 7 days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000)
    const result = formatRelativeTime(tenDaysAgo)
    // Should not contain "ago", should be a formatted date
    expect(result).not.toContain('ago')
    expect(result).not.toBe('Just now')
  })
})

describe('getStatusColor', () => {
  it('returns blue classes for "new"', () => {
    expect(getStatusColor('new')).toContain('bg-blue-100')
    expect(getStatusColor('new')).toContain('text-blue-700')
  })

  it('returns yellow classes for "reviewing"', () => {
    expect(getStatusColor('reviewing')).toContain('bg-yellow-100')
    expect(getStatusColor('reviewing')).toContain('text-yellow-700')
  })

  it('returns green classes for "shortlisted"', () => {
    expect(getStatusColor('shortlisted')).toContain('bg-green-100')
    expect(getStatusColor('shortlisted')).toContain('text-green-700')
  })

  it('returns red classes for "rejected"', () => {
    expect(getStatusColor('rejected')).toContain('bg-red-100')
    expect(getStatusColor('rejected')).toContain('text-red-700')
  })

  it('returns purple classes for "hired"', () => {
    expect(getStatusColor('hired')).toContain('bg-purple-100')
    expect(getStatusColor('hired')).toContain('text-purple-700')
  })

  it('returns green classes for "active"', () => {
    expect(getStatusColor('active')).toContain('bg-green-100')
  })

  it('returns orange classes for "paused"', () => {
    expect(getStatusColor('paused')).toContain('bg-orange-100')
  })

  it('returns grey classes for "closed"', () => {
    expect(getStatusColor('closed')).toContain('bg-gray-100')
  })

  it('returns grey classes for unknown status', () => {
    expect(getStatusColor('unknown_status')).toContain('bg-gray-100')
    expect(getStatusColor('unknown_status')).toContain('text-gray-700')
  })
})

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s')
  })

  it('escapes all special characters together', () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('parseJsonSafe', () => {
  it('parses valid JSON', () => {
    expect(parseJsonSafe('{"a":1}', {})).toEqual({ a: 1 })
  })

  it('returns fallback for invalid JSON', () => {
    expect(parseJsonSafe('not json', { fallback: true })).toEqual({ fallback: true })
  })

  it('returns fallback for null input', () => {
    expect(parseJsonSafe(null, [])).toEqual([])
  })

  it('returns fallback for undefined input', () => {
    expect(parseJsonSafe(undefined, 'default')).toBe('default')
  })

  it('returns fallback for empty string', () => {
    expect(parseJsonSafe('', 42)).toBe(42)
  })

  it('parses arrays', () => {
    expect(parseJsonSafe('[1,2,3]', [])).toEqual([1, 2, 3])
  })
})

describe('truncate', () => {
  it('returns the string unchanged if within length', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and adds ellipsis when too long', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })

  it('returns exact length string unchanged', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})
