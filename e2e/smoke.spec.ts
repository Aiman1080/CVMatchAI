import { test, expect, type Page } from '@playwright/test'

// End-to-end smoke tests for the critical DeltaMatch journeys.
//
// Requirements to run (these hit a real app + DB):
//   1. A dev/preview server reachable at E2E_BASE_URL (default localhost:3000)
//   2. The seed applied (npm run db:seed) so demo@cvmatch.ai / recruiter123 exists
//   3. NEXTAUTH_SECRET + DATABASE_URL set in the server's environment
//
// These are intentionally resilient (content-based, generous waits) rather than
// pixel-perfect, so they verify "the journey works" without breaking on copy
// tweaks.

const DEMO_EMAIL = 'demo@cvmatch.ai'
const DEMO_PASSWORD = 'recruiter123'

async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.locator('input[type="email"], input[name="email"]').first().fill(email)
  await page.locator('input[type="password"], input[name="password"]').first().fill(password)
  await page.getByRole('button', { name: /sign in|se connecter|inloggen|log in|connexion/i }).first().click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
}

test.describe('Public pages', () => {
  test('landing page loads with primary CTAs', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBeLessThan(400)
    // At least one call-to-action / login entry point is visible
    await expect(page.getByRole('link', { name: /login|sign in|connexion|start|commencer|gratuit|free/i }).first()).toBeVisible()
  })

  test('privacy and terms pages render real content', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('body')).toContainText(/privacy|confidentialit|privacybeleid/i)
    // The strengthened security section we added
    await expect(page.locator('body')).toContainText(/bcrypt|AES-256|Supabase/i)

    await page.goto('/terms')
    await expect(page.locator('body')).toContainText(/terms|conditions|voorwaarden/i)
    // The strengthened liability / refund language
    await expect(page.locator('body')).toContainText(/liability|responsabilit|aansprakelijk|refund|rembours|terugbetal/i)
  })

  test('contact page has a form', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
    await expect(page.locator('textarea').first()).toBeVisible()
  })
})

test.describe('Authenticated demo journey', () => {
  test('can log in and reach the dashboard', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    expect(page.url()).not.toContain('/login')
    // Sidebar navigation should be present
    await expect(page.getByRole('link', { name: /candidates|candidats|kandidaten/i }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('can navigate core dashboard pages without error', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    for (const path of ['/dashboard', '/vacancies', '/candidates', '/settings']) {
      const res = await page.goto(path)
      expect(res?.status(), `GET ${path}`).toBeLessThan(400)
      // No Next.js error boundary
      await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error|Unhandled Runtime Error/i)
    }
  })

  test('Pro-only pages show an upgrade prompt for the free demo account', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    // demo@ is on the free plan → email/integrations/analytics are Pro-gated
    await page.goto('/analytics')
    await expect(page.locator('body')).toContainText(/upgrade|pro|passez|améliorer|upgraden/i)
  })

  test('demo account write is blocked (read-only guard)', async ({ page }) => {
    await login(page, DEMO_EMAIL, DEMO_PASSWORD)
    // The demo guard should prevent creating data; the API returns 403.
    const resp = await page.request.post('/api/vacancies', {
      data: { title: 'E2E test role', company: 'X', location: 'Remote', description: 'x'.repeat(30), requirements: 'y'.repeat(15) },
    })
    expect([401, 403]).toContain(resp.status())
  })
})
