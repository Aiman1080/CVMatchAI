# CVMatch AI

AI-powered recruitment SaaS platform built with Next.js 16, Prisma, and Claude AI.

## Quick Start

### 1. Create a Supabase database (2 minutes, free)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **New Project** — choose a name and region (EU West recommended)
3. Set a **database password** (save it!)
4. Once created, go to **Project Settings > Database**
5. Scroll to **Connection string** and switch to **URI** tab
6. Copy the **Transaction** URI (port 6543) → this is your `DATABASE_URL`
7. Copy the **Session** URI (port 5432) → this is your `DIRECT_URL`
8. In both URIs, replace `[YOUR-PASSWORD]` with your database password

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase connection strings.

### 3. Install and run

```bash
npm install --legacy-peer-deps
npx prisma db push
npm run dev
```

The app will auto-create demo accounts on first start (dev mode):

- **Recruiter:** demo@cvmatch.ai / recruiter123
- **Pro:** pro@cvmatch.ai / pro123
- **Admin:** admin@cvmatch.ai / admin123

### 4. (Optional) Add AI analysis

The app works without an API key (demo mode). For real AI CV analysis:

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Add it to `.env`: `ANTHROPIC_API_KEY="sk-ant-..."`

## Deploy to Production

```bash
npm run build
npm start
```

Set `NEXTAUTH_URL` to your production URL and generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS + Radix UI
- Prisma + PostgreSQL (Supabase)
- NextAuth.js (JWT sessions)
- Anthropic Claude API (Opus for CV analysis, Sonnet for emails)
- Recharts for analytics
