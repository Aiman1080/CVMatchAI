import { NextResponse, type NextRequest } from 'next/server'

// ── In-memory rate limiter ──────────────────────────────────────────
// Simple per-IP counter with automatic expiry. Works for single-server
// deployments; for multi-server, replace with Redis or a shared store.

interface RateEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateEntry>()

// Periodically clean expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000 // 1 minute
let lastCleanup = Date.now()

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  cleanupExpiredEntries()

  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count++
  if (entry.count > maxRequests) {
    return false
  }

  return true
}

// ── Rate limit rules ────────────────────────────────────────────────
// Each rule maps a path prefix to its limit configuration.

const RATE_LIMIT_RULES: {
  path: string
  maxRequests: number
  windowMs: number
}[] = [
  { path: '/api/auth/register', maxRequests: 5, windowMs: 60_000 },
  { path: '/api/auth/forgot-password', maxRequests: 3, windowMs: 60_000 },
  { path: '/api/contact', maxRequests: 5, windowMs: 60_000 },
]

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    (req as any).ip ||
    'unknown'
  )
}

// ── Middleware ───────────────────────────────────────────────────────

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  for (const rule of RATE_LIMIT_RULES) {
    if (pathname.startsWith(rule.path)) {
      const ip = getClientIP(req)
      const key = `${rule.path}:${ip}`
      const allowed = checkRateLimit(key, rule.maxRequests, rule.windowMs)

      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        )
      }
      break
    }
  }

  return NextResponse.next()
}

// Only run middleware on API routes that need rate limiting
export const config = {
  matcher: [
    '/api/auth/register/:path*',
    '/api/auth/forgot-password/:path*',
    '/api/contact/:path*',
  ],
}
