import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { VACANCIES, ALL_CANDIDATES } from './seed-data'

const prisma = new PrismaClient()

function hashScore(cv: string, title: string): number {
  const s = (cv + title).slice(0, 600)
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return 60 + (Math.abs(h) % 35)
}

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  const recruiterPassword = await bcrypt.hash('recruiter123', 12)
  const proPassword = await bcrypt.hash('pro123', 12)
  const freePassword = await bcrypt.hash('free123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@cvmatch.ai' },
    update: { password: adminPassword, role: 'admin', subscription: 'enterprise' },
    create: {
      email: 'admin@cvmatch.ai', name: 'Admin User',
      password: adminPassword, role: 'admin',
      company: 'CVMatch AI', subscription: 'enterprise',
    },
  })

  const recruiter = await prisma.user.upsert({
    where: { email: 'demo@cvmatch.ai' },
    update: { password: recruiterPassword, subscription: 'free' },
    create: {
      email: 'demo@cvmatch.ai', name: 'Demo Recruiter',
      password: recruiterPassword, role: 'recruiter',
      company: 'Acme Corp', subscription: 'free',
    },
  })

  const proUser = await prisma.user.upsert({
    where: { email: 'pro@cvmatch.ai' },
    update: { password: proPassword, subscription: 'pro' },
    create: {
      email: 'pro@cvmatch.ai', name: 'Demo Pro',
      password: proPassword, role: 'recruiter',
      company: 'Pro Agency', subscription: 'pro',
    },
  })

  await prisma.user.upsert({
    where: { email: 'free@cvmatch.ai' },
    update: { password: freePassword, subscription: 'free' },
    create: {
      email: 'free@cvmatch.ai', name: 'Demo Gratuit',
      password: freePassword, role: 'recruiter',
      company: 'Startup Demo', subscription: 'free',
    },
  })

  // Create extra demo companies for the admin panel to look populated
  await prisma.user.upsert({
    where: { email: 'hr@techwave.be' },
    update: {},
    create: {
      email: 'hr@techwave.be', name: 'Marie Dubois',
      password: await bcrypt.hash('demo123', 12), role: 'recruiter',
      company: 'TechWave Belgium', subscription: 'pro',
    },
  })

  await prisma.user.upsert({
    where: { email: 'recruiter@valoris.be' },
    update: {},
    create: {
      email: 'recruiter@valoris.be', name: 'Peter Van Acker',
      password: await bcrypt.hash('demo123', 12), role: 'recruiter',
      company: 'Valoris Consulting', subscription: 'enterprise',
    },
  })

  await prisma.user.upsert({
    where: { email: 'talent@startupgent.be' },
    update: {},
    create: {
      email: 'talent@startupgent.be', name: 'Sarah De Backer',
      password: await bcrypt.hash('demo123', 12), role: 'recruiter',
      company: 'StartupGent', subscription: 'free',
    },
  })

  // ── Vacancies ──────────────────────────────────────────────────────────────

  const vacancyIds: string[] = []
  for (const v of VACANCIES) {
    const vacancy = await prisma.vacancy.create({
      data: { ...v, userId: recruiter.id },
    })
    vacancyIds.push(vacancy.id)
  }

  // ── Candidates ─────────────────────────────────────────────────────────────

  for (const c of ALL_CANDIDATES) {
    const { vacancyIndex, strengths, weaknesses, skills, ...rest } = c
    const vacancyId = vacancyIds[vacancyIndex]
    const vacancyTitle = VACANCIES[vacancyIndex].title
    await prisma.candidate.create({
      data: {
        ...rest,
        vacancyId,
        userId: recruiter.id,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        skills: JSON.stringify(skills),
        matchScore: hashScore(rest.cvContent, vacancyTitle),
        analyzedAt: new Date(),
        gdprConsent: true,
        gdprConsentDate: new Date(),
      },
    })
  }

  // ── Pro user vacancies & candidates (sample data for demo) ─────────────────

  const proVacancyData = VACANCIES.slice(0, 4)
  const proVacancyIds: string[] = []
  for (const v of proVacancyData) {
    const vacancy = await prisma.vacancy.create({
      data: { ...v, userId: proUser.id },
    })
    proVacancyIds.push(vacancy.id)
  }

  const proCandidates = ALL_CANDIDATES.filter(c => c.vacancyIndex < 4).slice(0, 12)
  for (const c of proCandidates) {
    const { vacancyIndex, strengths, weaknesses, skills, ...rest } = c
    const vacancyId = proVacancyIds[vacancyIndex]
    const vacancyTitle = proVacancyData[vacancyIndex].title
    await prisma.candidate.create({
      data: {
        ...rest,
        vacancyId,
        userId: proUser.id,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        skills: JSON.stringify(skills),
        matchScore: hashScore(rest.cvContent, vacancyTitle),
        analyzedAt: new Date(),
        gdprConsent: true,
        gdprConsentDate: new Date(),
      },
    })
  }

  console.log('✅ Database seeded successfully')
  console.log('👤 Admin:         admin@cvmatch.ai / admin123')
  console.log('👤 Demo (free):   demo@cvmatch.ai / recruiter123')
  console.log('👤 Demo Pro:      pro@cvmatch.ai / pro123')
  console.log('👤 Demo Gratuit:  free@cvmatch.ai / free123')
  console.log(`📋 ${VACANCIES.length} vacancies, ${ALL_CANDIDATES.length} candidates (demo user)`)
  console.log(`📋 ${proVacancyIds.length} vacancies, ${proCandidates.length} candidates (pro user)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
