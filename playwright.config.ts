import { defineConfig, devices } from '@playwright/test'

// E2E config for DeltaMatch. Run locally against a dev server:
//   npm run dev            (in one terminal — needs a working .env + DB)
//   npm run test:e2e       (in another — or let webServer start it for you)
//
// CI/headless note: these tests need a real database with the seeded demo
// account (demo@cvmatch.ai / recruiter123). Run `npm run db:seed` first.
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Auto-start the app unless E2E_BASE_URL points at an already-running server.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
