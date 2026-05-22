/** @type {import('next').NextConfig} */
const nextConfig = {
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
  webpack(config, { isServer }) {
    if (!isServer) {
      // bcryptjs references 'crypto' which is only available server-side
      config.resolve.fallback = { ...config.resolve.fallback, crypto: false }
    }
    return config
  },
}

module.exports = nextConfig
