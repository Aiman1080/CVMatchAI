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

  // ── 3 accounts only ───────────────────────────────────────────────────────

  await prisma.user.upsert({
    where: { email: 'admin@cvmatch.ai' },
    update: { password: adminPassword, role: 'admin', subscription: 'pro' },
    create: {
      email: 'admin@cvmatch.ai', name: 'Admin User',
      password: adminPassword, role: 'admin',
      company: 'DeltaMatch', subscription: 'pro',
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

  // ── Demo Recruiter: 3 vacancies, 15 candidates ───────────────────────────

  const demoVacancies = VACANCIES.slice(0, 3)
  const demoVacancyIds: string[] = []
  for (const v of demoVacancies) {
    const vacancy = await prisma.vacancy.create({
      data: { ...v, userId: recruiter.id },
    })
    demoVacancyIds.push(vacancy.id)
  }

  const demoCandidates = ALL_CANDIDATES.filter(c => c.vacancyIndex < 3).slice(0, 12)
  for (const c of demoCandidates) {
    const { vacancyIndex, strengths, weaknesses, skills, ...rest } = c
    const vacancyId = demoVacancyIds[vacancyIndex]
    const vacancyTitle = demoVacancies[vacancyIndex].title
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

  // ── Demo Pro: 3 vacancies, 10 candidates ─────────────────────────────────

  const proVacancies = VACANCIES.slice(0, 3)
  const proVacancyIds: string[] = []
  for (const v of proVacancies) {
    const vacancy = await prisma.vacancy.create({
      data: { ...v, userId: proUser.id },
    })
    proVacancyIds.push(vacancy.id)
  }

  const proCandidates = ALL_CANDIDATES.filter(c => c.vacancyIndex < 3).slice(0, 10)
  for (const c of proCandidates) {
    const { vacancyIndex, strengths, weaknesses, skills, ...rest } = c
    const vacancyId = proVacancyIds[vacancyIndex]
    const vacancyTitle = proVacancies[vacancyIndex].title
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
  console.log('👤 Admin:       admin@cvmatch.ai / admin123 (pro)')
  console.log('👤 Demo Free:   demo@cvmatch.ai / recruiter123')
  console.log('👤 Demo Pro:    pro@cvmatch.ai / pro123')
  console.log(`📋 Demo: 3 vacancies, ${demoCandidates.length} candidates`)
  console.log(`📋 Pro:  3 vacancies, ${proCandidates.length} candidates`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
