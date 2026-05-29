// Sentry server config — only initializes if SENTRY_DSN is set, so
// dev/CI without Sentry don't get noisy logs or fake events.
import * as Sentry from '@sentry/nextjs'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Strip PII automatically — emails, passwords, etc. The structured logger
    // already redacts but this is defense-in-depth for stack-trace attachments.
    sendDefaultPii: false,
    beforeSend(event) {
      // Drop expected client-cancelled requests so they don't pollute the dashboard
      const msg = event.message || event.exception?.values?.[0]?.value || ''
      if (/AbortError|AbortSignal|cancelled/i.test(msg)) return null
      return event
    },
  })
}
