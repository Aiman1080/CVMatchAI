// Sentry browser config — only enabled when NEXT_PUBLIC_SENTRY_DSN is set,
// so we don't ship the Sentry runtime to clients in dev or in deployments
// without a configured DSN.
import * as Sentry from '@sentry/nextjs'

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      const msg = event.message || event.exception?.values?.[0]?.value || ''
      if (/ResizeObserver|AbortError|cancelled|NotAllowedError/i.test(msg)) return null
      return event
    },
  })
}
