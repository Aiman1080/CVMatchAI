/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', '@anthropic-ai/sdk'],
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig
