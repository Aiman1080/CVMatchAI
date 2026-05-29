// One-off migration: move existing CV / motivation binaries from Postgres bytea
// (Candidate.cvFile / motivationFile) into Supabase Storage, then null the bytea
// columns to reclaim DB space. Idempotent and safe to re-run (skips rows already
// migrated). Requires the prod env loaded (DATABASE_URL + SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY). Run with:  npm run db:migrate-cv
import prisma from '../src/lib/prisma'
import { uploadDocument, isStorageConfigured } from '../src/lib/storage'

async function main() {
  if (!isStorageConfigured()) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — aborting.')
    process.exit(1)
  }

  let migrated = 0
  let failed = 0

  for (;;) {
    const rows = await prisma.candidate.findMany({
      where: {
        OR: [
          { cvFile: { not: null }, cvStoragePath: null },
          { motivationFile: { not: null }, motivationStoragePath: null },
        ],
      },
      select: {
        id: true,
        cvFile: true, cvMimeType: true, cvStoragePath: true,
        motivationFile: true, motivationMimeType: true, motivationStoragePath: true,
      },
      take: 25,
    })
    if (rows.length === 0) break

    const before = migrated
    for (const r of rows) {
      const data: any = {}
      if (r.cvFile && !r.cvStoragePath) {
        const path = await uploadDocument(Buffer.from(r.cvFile), r.cvMimeType || 'application/pdf', 'cv')
        if (path) { data.cvStoragePath = path; data.cvFile = null } else { failed++ }
      }
      if (r.motivationFile && !r.motivationStoragePath) {
        const path = await uploadDocument(Buffer.from(r.motivationFile), r.motivationMimeType || 'application/pdf', 'motivation')
        if (path) { data.motivationStoragePath = path; data.motivationFile = null } else { failed++ }
      }
      if (Object.keys(data).length > 0) {
        await prisma.candidate.update({ where: { id: r.id }, data })
        migrated++
      }
    }
    console.log(`...migrated ${migrated} candidate(s) so far (failed uploads: ${failed})`)

    // No progress this batch = every remaining row's upload is failing; stop to
    // avoid an infinite loop.
    if (migrated === before) {
      console.error('No progress this batch — stopping. Check the Storage credentials / bucket.')
      break
    }
  }

  console.log(`Done. Migrated ${migrated} candidate(s). Failed uploads: ${failed}.`)
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
