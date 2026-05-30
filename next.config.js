/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // The candidate CV/motivation file route is embedded in an <iframe> on
        // the candidate detail page (same origin). A global X-Frame-Options:DENY
        // makes the browser refuse to render it ("Refused to display ... in a
        // frame"). Override to SAMEORIGIN for this route only so our own viewer
        // works while still blocking third-party framing.
        source: '/api/candidates/:id/file',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  serverExternalPackages: ['pdf-parse', 'mammoth', '@anthropic-ai/sdk', 'imapflow', 'bcryptjs'],
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        crypto: false,
      }
    }
    return config
  },
}

// Sentry — only wrap when SENTRY_DSN is configured so dev/CI without Sentry
// don't pay the source-map upload step or the runtime overhead. When unset,
// we export the bare Next config.
let exportedConfig = nextConfig
if (process.env.SENTRY_DSN) {
  try {
    const { withSentryConfig } = require('@sentry/nextjs')
    exportedConfig = withSentryConfig(nextConfig, {
      silent: !process.env.SENTRY_DEBUG,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  } catch (e) {
    console.warn('[next.config] Sentry wrapper skipped:', (e && e.message) || e)
  }
}

module.exports = exportedConfig
