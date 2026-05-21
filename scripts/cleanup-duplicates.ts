/**
 * Removes duplicate Candidate rows that share the same (email, vacancyId) pair.
 * Run this BEFORE "npx prisma db push" when upgrading from a schema without the
 * @@unique([email, vacancyId]) constraint.
 *
 * Usage:  npx tsx scripts/cleanup-duplicates.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Load all candidates ordered by createdAt desc so the first one we see is the newest
  const all = await prisma.candidate.findMany({ orderBy: { createdAt: 'desc' } })

  const seen = new Set<string>()
  const toDelete: string[] = []

  for (const c of all) {
    const key = `${c.email ?? ''}__${c.vacancyId}`
    if (seen.has(key)) {
      toDelete.push(c.id)
    } else {
      seen.add(key)
    }
  }

  if (toDelete.length === 0) {
    console.log('✅ No duplicates found — database is clean.')
    return
  }

  console.log(`🧹 Found ${toDelete.length} duplicate candidate(s). Deleting older duplicates...`)

  // Must delete EmailScan records first (FK constraint)
  await prisma.emailScan.deleteMany({ where: { candidateId: { in: toDelete } } })
  await prisma.candidate.deleteMany({ where: { id: { in: toDelete } } })

  console.log(`✅ Deleted ${toDelete.length} duplicates. Safe to run "npx prisma db push" now.`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
