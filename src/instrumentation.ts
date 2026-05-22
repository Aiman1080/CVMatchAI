// Runs once when the Next.js server starts (Node.js runtime only).
// In DEVELOPMENT: seeds demo accounts if the database is empty.
// In PRODUCTION: does nothing — client data is managed by the deployment pipeline.
export async function register() {
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
            company: 'CVMatch AI',
            subscription: 'enterprise',
          },
          {
            email: 'demo@cvmatch.ai',
            name: 'Demo Recruiter',
            password: await bcrypt.hash('recruiter123', 12),
            role: 'recruiter',
            company: 'Acme Corp',
            subscription: 'pro',
          },
        ],
      })
      console.log('✅ CVMatch AI: demo accounts created — admin@cvmatch.ai / admin123 | demo@cvmatch.ai / recruiter123')
    }
  } catch {
    // Tables not created yet — run: npx prisma db push
  }
}
