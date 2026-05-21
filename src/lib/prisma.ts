import { PrismaClient } from '@prisma/client'

// Attach the client to the global object in development to survive hot-reload
// Without this, each module reload creates a new connection pool and exhausts DB connections
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Only log errors in both environments — query logging would be too noisy
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
