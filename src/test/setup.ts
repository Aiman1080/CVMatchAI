// crypto.ts / NextAuth throw at runtime if NEXTAUTH_SECRET is missing or short.
// Tests don't load .env automatically — provide a long-enough dummy here so any
// test that encrypts/decrypts or exercises auth has a valid secret.
process.env.NEXTAUTH_SECRET ??= 'test-secret-deltamatch-vitest-only-do-not-use-in-production-1234567890'

import '@testing-library/jest-dom'
