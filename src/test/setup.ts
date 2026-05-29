// crypto.ts now throws at module-load if NEXTAUTH_SECRET is missing.
// Tests don't load .env automatically — provide a long-enough dummy here
// so test runs don't crash on import.
process.env.NEXTAUTH_SECRET ??= 'test-secret-deltamatch-vitest-only-do-not-use-in-production-1234567890'

import '@testing-library/jest-dom'
