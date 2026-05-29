import { NextResponse, type NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Rate limiter — Upstash Redis when configured, in-memory fallback otherwise
//
// Why two backends:
// - **Upstash** (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set): the
//   limit is shared across every Vercel instance, every edge region, every
//   cold start. This is the only correct behaviour in production once Vercel
//   scales to >1 instance — without it your "5/h" becomes "5×N/h".
// - **In-memory**: per-instance Map<string, {count, resetAt}>. Fine for local
//   dev and for tiny single-instance deployments. Falls back automatically
//   when the Upstash env vars aren't set so we don't break dev.
//
// Edge runtime constraint: this middleware runs at the edge, so we use the
// REST-based Upstash SDK (no TCP). That's what @upstash/ratelimit expects.

const ONE_HOUR_SEC = 3600
const ONE_MIN_SEC = 60

type RuleKey =
  | 'auth_register' | 'auth_forgot' | 'contact'
  | 'upload' | 'analyze' | 'interview_questions' | 'hiring_report'
  | 'generate_email' | 'generate_description' | 'ranking' | 'email_scan'

const RATE_LIMIT_RULES: Record<RuleKey, { path: string; maxRequests: number; windowSec: number }> = {
  auth_register:        { path: '/api/auth/register',                  maxRequests: 5,  windowSec: ONE_MIN_SEC },
  auth_forgot:          { path: '/api/auth/forgot-password',           maxRequests: 3,  windowSec: ONE_MIN_SEC },
  contact:              { path: '/api/contact',                        maxRequests: 5,  windowSec: ONE_MIN_SEC },
  upload:               { path: '/api/upload',                         maxRequests: 10, windowSec: ONE_HOUR_SEC },
  analyze:              { path: '/api/analyze',                        maxRequests: 10, windowSec: ONE_HOUR_SEC },
  interview_questions:  { path: '/api/candidates/interview-questions', maxRequests: 10, windowSec: ONE_HOUR_SEC },
  hiring_report:        { path: '/api/candidates/hiring-report',       maxRequests: 10, windowSec: ONE_HOUR_SEC },
  generate_email:       { path: '/api/candidates/generate-email',      maxRequests: 10, windowSec: ONE_HOUR_SEC },
  generate_description: { path: '/api/vacancies/generate-description', maxRequests: 10, windowSec: ONE_HOUR_SEC },
  ranking:              { path: '/api/vacancies/ranking',              maxRequests: 10, windowSec: ONE_HOUR_SEC },
  email_scan:           { path: '/api/email/scan',                     maxRequests: 5,  windowSec: ONE_HOUR_SEC },
}

// ── Upstash backend ────────────────────────────────────────────────────
const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = upstashConfigured ? Redis.fromEnv() : null

// Lazy-init one limiter per rule. Sliding window matches the previous semantics
// (cap of N requests within the trailing window).
const limiters = new Map<RuleKey, Ratelimit>()
function getLimiter(key: RuleKey): Ratelimit | null {
  if (!redis) return null
  const cached = limiters.get(key)
  if (cached) return cached
  const rule = RATE_LIMIT_RULES[key]
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rule.maxRequests, `${rule.windowSec} s`),
    prefix: `rl:${key}`,
    analytics: false,
  })
  limiters.set(key, limiter)
  return limiter
}

// ── In-memory fallback (per-instance) ──────────────────────────────────
interface MemEntry { count: number; resetAt: number }
const memStore = new Map<string, MemEntry>()
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()
function cleanupMem() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [k, v] of memStore) if (now > v.resetAt) memStore.delete(k)
}
function checkMem(key: string, max: number, windowSec: number): boolean {
  cleanupMem()
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return true
  }
  entry.count++
  return entry.count <= max
}

// ── IP extraction ──────────────────────────────────────────────────────
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    (req as any).ip ||
    'unknown'
  )
}

// ── Middleware ─────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  for (const [ruleKey, rule] of Object.entries(RATE_LIMIT_RULES) as [RuleKey, typeof RATE_LIMIT_RULES[RuleKey]][]) {
    if (!pathname.startsWith(rule.path)) continue
    const ip = getClientIP(req)
    let allowed = true

    const limiter = getLimiter(ruleKey)
    if (limiter) {
      try {
        const result = await limiter.limit(ip)
        allowed = result.success
      } catch {
        // Upstash unreachable — fail open to in-memory rather than block users.
        // This is the right trade-off: a transient Redis outage shouldn't
        // cause a hard 429 to every request.
        allowed = checkMem(`${ruleKey}:${ip}`, rule.maxRequests, rule.windowSec)
      }
    } else {
      allowed = checkMem(`${ruleKey}:${ip}`, rule.maxRequests, rule.windowSec)
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
    }
    break
  }

  return NextResponse.next()
}

// Only run middleware on API routes that need rate limiting
export const config = {
  matcher: [
    '/api/auth/register/:path*',
    '/api/auth/forgot-password/:path*',
    '/api/contact/:path*',
    '/api/upload/:path*',
    '/api/analyze/:path*',
    '/api/candidates/interview-questions/:path*',
    '/api/candidates/hiring-report/:path*',
    '/api/candidates/generate-email/:path*',
    '/api/vacancies/generate-description/:path*',
    '/api/vacancies/ranking/:path*',
    '/api/email/scan/:path*',
  ],
}
