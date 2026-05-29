// Structured logger — replaces ad-hoc console.log/console.error scattered
// across the codebase.
//
// Why:
// - Adds a level so we can silence debug noise in production
// - Adds a namespace so logs are grep-able by feature
// - Provides one chokepoint where we can later wire Pino, Datadog, Sentry,
//   etc. without touching the call sites
// - Filters sensitive fields (passwords, emails, tokens) by default so
//   accidental logging doesn't leak PII to Vercel / log aggregators

type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 }

const ACTIVE_LEVEL: Level =
  (process.env.LOG_LEVEL as Level) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const SENSITIVE_KEYS = new Set([
  'password', 'currentPassword', 'newPassword',
  'token', 'accessToken', 'refreshToken', 'apiKey', 'api_key',
  'secret', 'authorization', 'cookie',
])

function redact(obj: any, depth = 0): any {
  if (depth > 4 || obj == null) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(v => redact(v, depth + 1))
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) out[k] = '[REDACTED]'
    else if (k === 'email' && typeof v === 'string') out[k] = v.replace(/(.{2}).+(@.+)/, '$1***$2')
    else out[k] = redact(v, depth + 1)
  }
  return out
}

function emit(level: Level, namespace: string, message: string, data?: unknown) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[ACTIVE_LEVEL]) return
  const payload = data === undefined ? '' : ' ' + JSON.stringify(redact(data))
  const line = `[${level}][${namespace}] ${message}${payload}`
  // Use the matching console method so Vercel groups them correctly in the UI
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export function createLogger(namespace: string) {
  return {
    debug: (msg: string, data?: unknown) => emit('debug', namespace, msg, data),
    info: (msg: string, data?: unknown) => emit('info', namespace, msg, data),
    warn: (msg: string, data?: unknown) => emit('warn', namespace, msg, data),
    error: (msg: string, data?: unknown) => emit('error', namespace, msg, data),
  }
}

export type Logger = ReturnType<typeof createLogger>
