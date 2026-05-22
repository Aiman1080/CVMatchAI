// Runs once when the Next.js server starts (Node.js runtime only).
// Pushes the Prisma schema and seeds demo accounts if the database is empty.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { execSync } = await import('child_process')
  const { default: prisma } = await import('@/lib/prisma')

  // Push schema (creates tables if they don't exist, safe to re-run)
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      stdio: 'pipe',
      cwd: process.cwd(),
    })
  } catch {
    // Already up to date or non-fatal error
  }

  // Seed demo accounts if database is empty
  try {
    const count = await prisma.user.count()
    if (count === 0) {
      const { default: bcrypt } = await import('bcryptjs')
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
      console.log('✅ CVMatch AI: database seeded — admin@cvmatch.ai / admin123 | demo@cvmatch.ai / recruiter123')
    }
  } catch {
    // DB not ready yet — will retry on next request
  }
}
