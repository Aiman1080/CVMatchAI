-- Migration: add all columns/tables added after initial DB setup
-- Safe to run multiple times (uses IF NOT EXISTS)

-- User: add suspended and lastSeenAt
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

-- Vacancy: add externalId / externalSource
ALTER TABLE "Vacancy" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Vacancy" ADD COLUMN IF NOT EXISTS "externalSource" TEXT;

-- Candidate: add all columns missing from initial schema
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "cvUrl" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "motivationUrl" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "externalSource" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "liked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "priority" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "savedToPool" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Candidate" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);

-- Candidate unique constraints (idempotent via DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Candidate_email_vacancyId_key'
  ) THEN
    ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_email_vacancyId_key" UNIQUE ("email", "vacancyId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Candidate_externalId_externalSource_userId_key'
  ) THEN
    ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_externalId_externalSource_userId_key" UNIQUE ("externalId", "externalSource", "userId");
  END IF;
END $$;

-- SupportTicket table
CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"         TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "subject"    TEXT NOT NULL,
  "message"    TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'open',
  "priority"   TEXT NOT NULL DEFAULT 'normal',
  "adminReply" TEXT,
  "repliedAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Integration table
CREATE TABLE IF NOT EXISTS "Integration" (
  "id"          TEXT NOT NULL,
  "platform"    TEXT NOT NULL,
  "apiKey"      TEXT NOT NULL,
  "companySlug" TEXT,
  "status"      TEXT NOT NULL DEFAULT 'active',
  "lastSyncAt"  TIMESTAMP(3),
  "syncCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"      TEXT NOT NULL,
  CONSTRAINT "Integration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Integration_platform_userId_key'
  ) THEN
    ALTER TABLE "Integration" ADD CONSTRAINT "Integration_platform_userId_key" UNIQUE ("platform", "userId");
  END IF;
END $$;
