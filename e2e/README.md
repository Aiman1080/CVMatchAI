# End-to-end tests (Playwright)

These tests exercise the real app + database (login, navigation, plan gating,
demo read-only guard, public/legal pages). They are **not** run by `vitest`
(which only covers `src/**`); run them separately.

## Prerequisites
1. A `.env` with a working `DATABASE_URL`, `DIRECT_URL` and `NEXTAUTH_SECRET`.
2. Seed the demo accounts: `npm run db:seed`
   (creates `demo@cvmatch.ai` / `recruiter123`, `pro@cvmatch.ai`, `admin@cvmatch.ai`).
3. Install the browser once: `npx playwright install chromium`

## Run
```bash
# Option A — let Playwright start the dev server for you
npm run test:e2e

# Option B — against an already-running server (dev or a Vercel preview URL)
E2E_BASE_URL=https://your-preview.vercel.app npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui
```

## What's covered (e2e/smoke.spec.ts)
- Landing page loads with a primary CTA
- Privacy & Terms render the strengthened security/liability content
- Contact page exposes a form
- Demo account can log in and reach the dashboard
- Core dashboard pages load without an error boundary
- Pro-only pages show an upgrade prompt for the free demo account
- Demo account writes are blocked (403) — the read-only guard holds

## Notes
- Selectors are intentionally content-based and multilingual (EN/NL/FR) so copy
  tweaks don't break them.
- Against a Vercel preview, the demo account must exist in that environment's DB.
