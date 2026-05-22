/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable instrumentation.ts (auto-seed on first start)
  experimental: { instrumentationHook: true },
  // Node-only packages that cannot be bundled for the browser — loaded at runtime on the server
  serverExternalPackages: ['pdf-parse', 'mammoth', '@anthropic-ai/sdk', 'imapflow'],
  images: {
    // `remotePatterns` replaces the deprecated `domains` array in Next.js 15
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

module.exports = nextConfig
