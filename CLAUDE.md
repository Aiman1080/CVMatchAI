# CLAUDE.md — DeltaMatch (repo: `aiman1080/cvmatchai`)

Guidance for AI agents working in this repo. Read this first — it captures the
architecture, conventions, and the non-obvious traps that bite you otherwise.

DeltaMatch (formerly CVMatchAI) is an AI recruitment SaaS: recruiters create
vacancies, ingest CVs (manual upload / IMAP email scan / ATS sync), and Google
Gemini analyses + scores + matches each candidate, then generates interview
questions, candidate emails, and hiring reports. Deployed on **Vercel + Supabase
Postgres**. UI in EN/NL/FR. €55/mo Pro plan via Stripe.

---

## ⚠️ Git workflow & deployment (read before pushing)

- **Develop on the session's assigned feature branch** (currently
  `claude/upbeat-gates-lH2KQ`). Commit + push there freely.
- **`main` = PRODUCTION.** Pushing to `main` triggers an automatic Vercel
  production deploy. **NEVER merge or push to `main` without explicit user
  permission.**
- Merge-to-main command (only on explicit request):
  ```bash
  git checkout main && git merge <dev-branch> --no-ff && git push origin main && git checkout <dev-branch>
  ```
- **Before ANY prod deploy**, confirm the two runtime prerequisites below
  (`db:push` + `NEXTAUTH_SECRET`) — a green build does NOT guarantee a working
  prod runtime.

### Deploy prerequisites (easy to forget, breaks prod silently)
1. **Schema sync via `prisma db push`** — this project uses `db push`, NOT
   versioned migrations. New columns (e.g. the `Candidate` `Bytes` fields) exist
   only in `schema.prisma` until `npm run db:push` is run against the prod
   Supabase DB. Deploying code that reads/writes new columns *before* pushing
   them = runtime crashes (upload / email scan / ATS sync). Bytes fields are
   nullable, so `db push` is additive/safe and can be run before the merge.
2. **`NEXTAUTH_SECRET` must be set on Vercel** (≥32 chars, all environments:
   Production + Preview + Development). Needed at runtime for NextAuth JWT
   signing AND AES-256-GCM encryption of IMAP passwords. Missing → login + email
   scan break. (The build itself no longer requires it — see crypto note below.)
3. `prisma/migrations/manual/001_enable_rls.sql` is applied **by hand** in the
   Supabase SQL editor (RLS hardening; Prisma's superuser connection bypasses
   it, so it does not change app behaviour).

---

## Commands

```bash
npm run dev          # dev server (next dev)
npm run build        # prod build (prisma generate && next build)
npm run db:push      # apply schema.prisma to the DB (prisma db push --accept-data-loss)
npm run db:studio    # Prisma Studio
npm run db:seed      # seed demo data (tsx prisma/seed.ts)
npx vitest run       # tests (249 currently, all passing)
npx tsc --noEmit     # type check (must be 0 errors)
```

**Verification before merge:** `npx tsc --noEmit` + `npx vitest run` + `npm run build`.
⚠️ **Lint is broken** and is NOT a reliable check: `next lint` was removed in
Next.js 16, and the legacy `.eslintrc.json` crashes ESLint 8
(`Converting circular structure to JSON`). Rely on tsc + tests + build instead.
`npm run build` does its own type/compile checks but does NOT run ESLint.

---

## Tech stack

- **Next.js (App Router, Turbopack) + React + TypeScript**, Tailwind + Radix/shadcn,
  framer-motion, recharts, @dnd-kit (kanban).
- **Prisma 5 + Supabase Postgres** (pooler `DATABASE_URL` + `DIRECT_URL`).
- **NextAuth v4** (JWT sessions) + `@auth/prisma-adapter` + bcryptjs; Google +
  Microsoft Azure-AD SSO (auto-enabled when their env vars are set).
- **Google Gemini 2.5 Flash** via `@google/generative-ai` (function calling, mode ANY).
- **imapflow** (IMAP scan), **nodemailer** (SMTP send), **pdf-parse** + **mammoth** (parsing).
- **Stripe** (checkout + portal + webhook), **@sentry/nextjs**, **@upstash/ratelimit** + redis,
  **jspdf** (PDF export), **zod**, **zustand**.

~33k LOC · 58 API routes · ~23 pages · ~70 components · 11 test files.

---

## Project structure

```
src/app/(auth)/        login, register, forgot/reset-password, verify-email
src/app/(dashboard)/   dashboard, vacancies, candidates(+/[id]+/compare), email,
                       integrations, analytics, settings, support, upgrade
src/app/admin/         admin panel (role === 'admin' only)
src/app/{page,contact,privacy,terms,error,not-found}.tsx
src/app/api/           58 route handlers (see "API routes" below)
src/components/         layout/, dashboard/, admin/, support/, ui/ (shadcn)
src/lib/                ai.ts, ai-usage.ts, auth.ts, plans.ts, demo-guard.ts,
                        crypto.ts, logger.ts, email.ts, pdf-parser.ts, prisma.ts,
                        activity.ts, notifications.ts, export.ts, i18n(.ts + /en|nl|fr)
src/lib/integrations/   sync.ts + 14 ATS adapters
src/middleware.ts       rate limiting
prisma/schema.prisma    14 models
```

---

## Data model (`prisma/schema.prisma`, 14 models)

Core: **User** (`role` default `recruiter`; `subscription` default `free`;
`subscriptionEnd`, `suspended`, `company`, `emailSignature`), **Vacancy**,
**Candidate**, **EmailInbox** (encrypted `password`), **EmailScan**,
**Integration** (`@@unique([platform,userId])`), **CandidateActivity**,
**SupportTicket**, **Notification**, **AiUsageLog**, NextAuth
(**Account**/**Session**/**VerificationToken**).

**Candidate** is the big one: parsed `cvContent` (text) + raw `cvFile`/`cvMimeType`
+ `motivationFile`/`motivationMimeType` (Postgres **`Bytes`**), AI fields
(`matchScore`, `summary`, `strengths`, `weaknesses`, `skills`, `experience`,
`education`, `recommendation`), `status`, `source`, `interviewAnswers` (JSON
string — recruiter answers only; questions are regenerated on demand, NOT
stored), `liked`/`priority`/`savedToPool`, `gdprConsent`(+Date), `externalId`/
`externalSource`.

Dedup constraints: `@@unique([email, vacancyId])` and
`@@unique([externalId, externalSource, userId])`. `EmailScan.candidateId` unique.

---

## Auth & sessions (`src/lib/auth.ts`)

- JWT session strategy. Credentials (bcrypt, lowercased email, rejects
  `suspended`) + Google + Microsoft (each auto-enabled iff its `*_CLIENT_ID/SECRET`
  set; tenant defaults to `common`).
- **JWT/session callbacks re-read `role`/`subscription`/`company` from the DB on
  refresh** → plan upgrades (Stripe) and role changes take effect immediately,
  no stale-token wait.
- Pages: signIn `/login`, signOut `/`, error `/login`.

---

## Plans & access control

`src/lib/plans.ts`: `getPlanLimits(sub)` + `getEffectiveSubscription(sub, end)`
(downgrades expired `pro` → `free`).

| Feature | free | pro | demo | demo_pro |
|---|---|---|---|---|
| maxVacancies | 3 | ∞ | 3 | 8 |
| candidates/mo | 20 | ∞ | 20 | 50 |
| aiAnalysis | ✓ | ✓ | ✓ | ✓ |
| emailInbox / atsIntegrations / analytics / interviewQuestions / hiringReport / candidateRanking / csvImport / export | ✗ | ✓ | ✗ | ✓ |

**Demo guard** (`src/lib/demo-guard.ts`): `demo@`, `pro@`, `free@cvmatch.ai` are
read-only — backend returns 403 on writes, frontend disables inputs (double
layer). **`admin@cvmatch.ai` is a REAL admin (role-based), not a demo account.**

Pro-only API routes call `getEffectiveSubscription` → `getPlanLimits` → 403 with
`{upgrade:true}`. Non-admin routes scope every query by `userId` (anti-IDOR).
Admins see all users' data.

---

## AI layer (`src/lib/ai.ts`, ~991 lines)

All use **gemini-2.5-flash + function calling (mode ANY)** and **fall back
gracefully** (no API key / API error → demo data or Jaccard keyword scoring; the
app never hard-crashes on AI failure). Exported:
`analyzeCVAgainstVacancy`, `classifyRecruitmentEmail`, `detectDocumentType`,
`selectBestVacancyForCV` (Jaccard fallback), `generateInterviewQuestions`,
`generateJobDescription`, `rankCandidates`, `generateHiringReport`,
`generateRecruiterInsights`. Output language follows the vacancy/locale (nl/fr/de/en).

**Demo mode** = `GEMINI_API_KEY` unset/empty/`'demo'`.
**Cost tracking** (`ai-usage.ts` → `AiUsageLog`): gemini-2.5-flash = **$0.15/1M
input, $0.60/1M output**; aggregates total / last-30d / per-operation / per-month.

---

## Documents, CV storage & viewer

- `pdf-parser.ts`: `parseDocument(buffer, mime)` → pdf-parse (PDF) / mammoth
  (DOCX) / utf-8 (txt). **No OCR** — image-only/scanned PDFs yield little/no text.
- **No files on disk** (Vercel FS is read-only). Raw CV bytes live in Postgres
  `Candidate.cvFile` (bytea); parsed text in `cvContent`.
- **SSR binary stripping:** `candidates/[id]/page.tsx` removes the bytea fields
  from the SSR payload (avoids base64 bloat), passes `hasCvFile`/`hasMotivationFile`
  booleans; the client lazy-fetches via `/api/candidates/[id]/file?type=cv|motivation`.
- Viewer in `CandidateDetailClient.tsx` (~1160 lines): PDF/DOCX viewer + download;
  falls back to text with an amber notice for older candidates that have no binary.

---

## Email scan (`src/app/api/email/scan/route.ts`, Pro-only, maxDuration 300s)

IMAP via imapflow; inbox password decrypted with `crypto.ts`. **2-pass:**
Pass 1 = fetch recent messages (most-recent-first, capped ~20-25 — see route
header), AI-classify each (`classifyRecruitmentEmail`), shortlist real
applications, dedup via `EmailScan` (UID + (sender, receivedAt, subject)).
Pass 2 = download attachments, `parseDocument`, `detectDocumentType`,
`selectBestVacancyForCV`, `analyzeCVAgainstVacancy`, create `Candidate`
(dedup on `(email, vacancyId)`). Logs under the `[email/scan]` namespace —
check **Vercel Runtime Logs** to debug a scan; the final
`scanned=X relevant=Y processed=Z errors=N` line summarises a run.
`email/demo-scan` fabricates 4 realistic applications for demo accounts.

---

## ATS integrations (`src/lib/integrations/`, Pro-only)

`sync.ts` orchestrates **14 adapters**: teamtailor, recruitee, smartrecruiters,
greenhouse, lever, bullhorn, workable, flatchr, ashby, breezyhr, homerun,
personio, icims, softgarden. Per platform: fetch jobs → candidates → CV binary
(MIME sniffed by extension then magic bytes `%PDF` / `504b0304`) → AI analysis →
upsert. Dedup by `(externalId, externalSource, userId)`; manual-vacancy
duplicate detection by Jaccard similarity > 0.7 (`upsertVacancy`). Status strings
mapped (multilingual) → `new|reviewing|shortlisted|rejected|hired`.
Note: lever/bullhorn/workable/ashby do NOT return CV binaries.

---

## Rate limiting (`src/middleware.ts`)

Upstash Redis sliding window **+ in-memory fallback**, **fail-open** (transient
Upstash errors never block users). IP from `x-forwarded-for`→`x-real-ip`→`req.ip`.
Limits: register 5/min, forgot-password 3/min, contact 5/min; upload/analyze and
each AI route (interview, hiring-report, generate-email, generate-description,
ranking) 10/h; email/scan 5/h.

---

## External services & costs (also surfaced in Admin → System tab)

Today everything sits on free tiers (€0 fixed). Usage-based: Gemini (cents,
tracked) + Stripe (~1.5% +€0.25/EU charge). **Two real cost traps:**
1. **Vercel Hobby is non-commercial** → a paid SaaS technically needs Pro ($20/mo).
2. **Supabase 500MB free fills fast** because CVs are stored in Postgres bytea
   (~2-4k CVs) → Supabase Pro ($25/mo) or migrate CV binaries to Supabase Storage.

The Admin System tab detects each service via env vars (●=configured, ○=inactive)
and links to its billing page.

---

## Environment variables (31)

- **Required:** `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET` (≥32 chars).
- **Strongly recommended:** `NEXTAUTH_URL`, `APP_URL`, `GEMINI_API_KEY`
  (else AI demo mode), SMTP (`SMTP_HOST/PORT/USER/PASS/SECURE`) for outbound email.
- **Optional / feature-gated:** `GOOGLE_CLIENT_ID/SECRET`,
  `MICROSOFT_CLIENT_ID/SECRET/TENANT_ID` (+ derived `NEXT_PUBLIC_HAS_GOOGLE_SSO`/
  `_MICROSOFT_SSO` show the buttons), `STRIPE_SECRET_KEY`/`STRIPE_PRO_PRICE_ID`/
  `STRIPE_WEBHOOK_SECRET`/`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `UPSTASH_REDIS_REST_URL`/`_TOKEN`, `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`
  (+ `SENTRY_ORG/PROJECT/AUTH_TOKEN`), `NEXT_PUBLIC_GA_ID`, `CONTACT_EMAIL`,
  `MAX_FILE_SIZE` (default 10MB), `LOG_LEVEL`.

---

## Observability

- `logger.ts`: namespaced structured logger (`[level][namespace] msg`), level via
  `LOG_LEVEL` (prod default `info`), auto-redacts PII (passwords/tokens/emails).
  Caught errors → console → **Vercel Runtime Logs** (NOT auto-forwarded to Sentry).
- Sentry (`sentry.*.config.ts` + `instrumentation.ts`): no-op unless `SENTRY_DSN`
  set; prod tracesSampleRate 0.1, `sendDefaultPii:false`, captures unhandled
  errors via `onRequestError`.

---

## Known issues / gotchas (save yourself time)

- **Lint toolchain broken** (Next 16 removed `next lint`; `.eslintrc.json` crashes
  ESLint 8). Use tsc + tests + build.
- **`crypto.ts` validates `NEXTAUTH_SECRET` lazily** (in `getKey()` on first
  encrypt/decrypt), NOT at module load — an earlier top-level `throw` crashed
  `next build` ("Failed to collect page data"). Keep it lazy.
- **Schema changes need `db:push` against prod before deploying dependent code**
  (no versioned migrations). The `Bytes` CV fields are the live example.
- **Dead/stale code:** the `Subscription` Prisma model is unused (plans are
  hardcoded in `plans.ts`); `next.config.js` still lists `@anthropic-ai/sdk` in
  `serverExternalPackages` (left over from the pre-Gemini era; not a dependency).
- **`/api/admin/cleanup` is NOT admin-only** despite the path (any user can clean
  their own duplicate candidates).
- `src/test/setup.ts` injects a dummy `NEXTAUTH_SECRET` so tests can import
  crypto/auth.
- Default locale is **`fr`** (cookie `deltamatch-locale`). Admin/System-tab UI is
  largely hardcoded English; admin i18n is only partially translated.

---

## Conventions

- TypeScript strict, `@/*` → `src/*`. Match surrounding style (the existing files
  are the spec). Server pages wrap DB queries defensively (`safe()` + timeouts in
  admin/dashboard pages). Demo-guard + ownership checks belong on every mutating
  route. Keep PII out of logs. Commit messages: clear and descriptive.
