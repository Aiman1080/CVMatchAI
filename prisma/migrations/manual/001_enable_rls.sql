-- ════════════════════════════════════════════════════════════════════════
-- RLS hardening — apply once via Supabase SQL editor (or psql to DIRECT_URL)
-- ════════════════════════════════════════════════════════════════════════
--
-- WHY THIS IS LIMITED DEFENSE-IN-DEPTH, NOT BULLETPROOF:
-- Prisma connects with the `postgres` superuser role (your DATABASE_URL).
-- Superusers BYPASS RLS by default. So these policies do NOT protect
-- against app-level bugs (e.g. a route handler that forgets `where: { userId }`).
-- Those bugs are still caught only by the in-code ownership checks.
--
-- WHAT THESE POLICIES *DO* PROTECT AGAINST:
--   1. Direct queries via the Supabase JS client using the `anon` key
--      (no key in your client bundle today, but if you ever add one)
--   2. Anyone who finds a Supabase auth JWT — `authenticated` role can
--      only see their own rows
--   3. A leaked database REST URL exposing the PostgREST API
--
-- To make these policies bite for Prisma queries too, you'd need to:
--   - Switch the Prisma connection to a non-superuser role
--   - Forward auth context per request via SET LOCAL or supabase-js session
-- That is a bigger refactor. Treat this migration as a starting point.
--
-- HOW TO APPLY:
--   1. Supabase Dashboard → SQL Editor → New query → paste this file → Run
--   2. Verify: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';
--      every listed table should show rowsecurity = true.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Enable RLS on every user-scoped table ─────────────────────────────
ALTER TABLE "User"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vacancy"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Candidate"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailInbox"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailScan"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportTicket"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiUsageLog"        ENABLE ROW LEVEL SECURITY;

-- ─── service_role bypass ───────────────────────────────────────────────
-- Lets the Prisma connection (which uses service_role / postgres) pass through
-- without restriction. Drop this clause if you want to force per-row checks
-- on Prisma queries too — see header for the bigger architectural change.
CREATE POLICY "service_role_all" ON "User"              FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Account"           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Session"           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "VerificationToken" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Vacancy"           FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Candidate"         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "CandidateActivity" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "EmailInbox"        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "EmailScan"         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Integration"       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "SupportTicket"     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "Notification"      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON "AiUsageLog"        FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── authenticated: own-row only ───────────────────────────────────────
-- For tables that have a userId column, a Supabase-authenticated client
-- can only touch its own rows. Without a policy explicitly granting access,
-- RLS denies by default.
CREATE POLICY "auth_own_user"    ON "User"        FOR ALL TO authenticated USING (auth.uid()::text = id)     WITH CHECK (auth.uid()::text = id);
CREATE POLICY "auth_own_vac"     ON "Vacancy"     FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "auth_own_cand"    ON "Candidate"   FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "auth_own_inbox"   ON "EmailInbox"  FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "auth_own_integ"   ON "Integration" FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "auth_own_ticket"  ON "SupportTicket" FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "auth_own_notif"   ON "Notification" FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
CREATE POLICY "auth_own_aiusage" ON "AiUsageLog"  FOR ALL TO authenticated USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");

-- CandidateActivity / EmailScan / Account / Session / VerificationToken don't
-- carry userId directly — they reference it via FK. Default = deny for
-- `authenticated`; if the app ever queries them via supabase-js, write
-- explicit join-based policies.

-- ─── anon: deny everything ─────────────────────────────────────────────
-- No CREATE POLICY for `anon` means RLS denies by default. Just being explicit
-- here for documentation — there's nothing to grant.
COMMENT ON SCHEMA public IS
  'RLS enabled on all user-scoped tables. service_role bypasses; authenticated sees own rows only; anon is denied by default. See prisma/migrations/manual/001_enable_rls.sql for the full rationale.';
