// Runs once when the Next.js server starts (Node.js runtime only).
// In DEVELOPMENT: seeds demo accounts if the database is empty.
// In PRODUCTION: initializes Sentry for the server runtime; otherwise no-op.
export async function register() {
  // Load Sentry early so it captures errors thrown during the rest of init.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }

  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NODE_ENV !== 'development') return

  try {
    const { default: prisma } = await import('@/lib/prisma')
    const count = await prisma.user.count()
    if (count === 0) {
      const bcrypt = await import('bcryptjs')
      await prisma.user.createMany({
        data: [
          {
            email: 'admin@cvmatch.ai',
            name: 'Admin User',
            password: await bcrypt.hash('admin123', 12),
            role: 'admin',
            company: 'DeltaMatch',
            subscription: 'enterprise',
          },
          {
            email: 'pro@cvmatch.ai',
            name: 'Pro Recruiter',
            password: await bcrypt.hash('pro123', 12),
            role: 'recruiter',
            company: 'TechStartup NV',
            subscription: 'pro',
          },
          {
            email: 'demo@cvmatch.ai',
            name: 'Demo Recruiter',
            password: await bcrypt.hash('recruiter123', 12),
            role: 'recruiter',
            company: 'Acme Corp',
            subscription: 'free',
          },
        ],
      })
      console.log(
        '✅ DeltaMatch: demo accounts created\n' +
        '  admin:   admin@cvmatch.ai  / admin123\n' +
        '  pro:     pro@cvmatch.ai    / pro123\n' +
        '  free:    demo@cvmatch.ai   / recruiter123'
      )
    }
  } catch {
    // Tables not created yet — run: npx prisma db push
  }
}

// Forward server-side request errors (route handlers, server components) into
// Sentry when configured. Without this hook, Next.js eats the error silently
// from Sentry's perspective.
export async function onRequestError(...args: any[]) {
  if (!process.env.SENTRY_DSN) return
  const Sentry = await import('@sentry/nextjs')
  ;(Sentry as any).captureRequestError?.(...args)
}
