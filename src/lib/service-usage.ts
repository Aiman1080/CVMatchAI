// Live usage probes for external services, surfaced in the Admin System tab so
// the operator can see how close they are to each free-tier ceiling.
//
// Every probe is best-effort: short timeout, never throws. A failed/absent probe
// yields `available: false` and the UI falls back to static free-tier info.
import { createLogger } from './logger'

const log = createLogger('service-usage')

async function fetchWithTimeout(url: string, init: RequestInit, ms = 4000): Promise<Response | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export interface UpstashUsage {
  configured: boolean
  available: boolean
  keys: number | null
}

// Rate-limit data lives in Redis as a handful of short-lived keys. We read the
// key count (DBSIZE) via the REST API — the per-month command quota that drives
// the free-tier ceiling isn't exposed here, so we surface keys + link to console.
export async function getUpstashUsage(): Promise<UpstashUsage> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, '')
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return { configured: false, available: false, keys: null }
  const res = await fetchWithTimeout(`${url}/dbsize`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res || !res.ok) {
    log.warn('Upstash dbsize probe failed', { status: res?.status })
    return { configured: true, available: false, keys: null }
  }
  try {
    const json = (await res.json()) as { result?: number }
    return { configured: true, available: typeof json.result === 'number', keys: json.result ?? null }
  } catch {
    return { configured: true, available: false, keys: null }
  }
}

export interface SentryUsage {
  configured: boolean
  available: boolean
  errors30d: number | null
}

// Best-effort: needs SENTRY_AUTH_TOKEN + SENTRY_ORG (read scope) to hit the stats
// API. Without them the card just shows "configured" + a dashboard link.
export async function getSentryUsage(): Promise<SentryUsage> {
  const configured = !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
  const token = process.env.SENTRY_AUTH_TOKEN
  const org = process.env.SENTRY_ORG
  if (!configured) return { configured: false, available: false, errors30d: null }
  if (!token || !org) return { configured: true, available: false, errors30d: null }
  const url = `https://sentry.io/api/0/organizations/${org}/stats_v2/?field=sum(quantity)&category=error&statsPeriod=30d&interval=1d`
  const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res || !res.ok) {
    log.warn('Sentry stats probe failed', { status: res?.status })
    return { configured: true, available: false, errors30d: null }
  }
  try {
    const json: any = await res.json()
    const total = Array.isArray(json?.groups)
      ? json.groups.reduce((sum: number, g: any) => sum + (g?.totals?.['sum(quantity)'] || 0), 0)
      : null
    return { configured: true, available: total !== null, errors30d: total }
  } catch {
    return { configured: true, available: false, errors30d: null }
  }
}
