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
  const adminPassword = await bcrypt.hash('Wachtwoord_2201', 12)
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
  let di = 0
  for (const c of demoCandidates) {
    const { vacancyIndex, strengths, weaknesses, skills, ...rest } = c
    const vacancyId = demoVacancyIds[vacancyIndex]
    const vacancyTitle = demoVacancies[vacancyIndex].title
    // Schedule an interview for ~every 3rd demo candidate so the dashboard
    // calendar shows data on the read-only demo account too.
    let interviewAt: Date | null = null
    let interviewDuration: number | null = null
    let interviewLocation: string | null = null
    if (di % 3 === 1) {
      const base = new Date()
      base.setDate(base.getDate() + 1 + (di % 14))
      base.setHours(10 + (di % 6), (di % 2) * 30, 0, 0)
      interviewAt = base
      interviewDuration = [30, 45, 60][di % 3]
      interviewLocation = di % 2 === 0 ? 'https://meet.google.com/demo-interview' : 'Office — Meeting room B'
    }
    di++
    await prisma.candidate.create({
      data: {
        ...rest,
        vacancyId,
        userId: recruiter.id,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        skills: JSON.stringify(skills),
        matchScore: hashScore(rest.cvContent, vacancyTitle),
        interviewAt,
        interviewDuration,
        interviewLocation,
        analyzedAt: new Date(),
        gdprConsent: true,
        gdprConsentDate: new Date(),
      },
    })
  }

  // ── Demo Pro: rich impression — looks like an active recruitment agency ────

  // 6 vacancies across different industries (Tech, Marketing, Finance, etc.)
  const proVacancies = VACANCIES.slice(3, 9)
  const proVacancyIds: string[] = []
  for (let i = 0; i < proVacancies.length; i++) {
    const v = proVacancies[i]
    // Spread creation dates over the last 60 days
    const daysAgo = [5, 12, 20, 28, 40, 55][i] || 30
    const vacancy = await prisma.vacancy.create({
      data: {
        ...v,
        userId: proUser.id,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.floor(daysAgo / 2) * 24 * 60 * 60 * 1000),
      },
    })
    proVacancyIds.push(vacancy.id)
  }

  // Realistic status distribution — like a real agency in action
  const STATUS_DISTRIBUTION = [
    'new', 'new', 'new', 'new', 'new',                          // 5 new
    'reviewing', 'reviewing', 'reviewing', 'reviewing', 'reviewing', 'reviewing', 'reviewing', 'reviewing', // 8 reviewing
    'shortlisted', 'shortlisted', 'shortlisted', 'shortlisted', 'shortlisted', 'shortlisted', // 6 shortlisted
    'interviewing', 'interviewing', 'interviewing', 'interviewing', // 4 interviewing
    'hired', 'hired', 'hired',                                   // 3 hired
    'rejected', 'rejected', 'rejected', 'rejected',              // 4 rejected
  ]

  // Realistic notes used by recruiters
  const NOTES_POOL = [
    'Strong candidate — schedule technical interview next week.',
    'Excellent communication skills. Good cultural fit.',
    'Lacking required experience in React, but eager learner.',
    'Top profile, fast-track to final round.',
    'Asked about salary expectations — within range.',
    'Recommend to hiring manager for second interview.',
    'Available immediately. References checked, all positive.',
    'Not a match for this role — consider for senior position later.',
    'Strong technical background but weak in soft skills.',
    'Outstanding portfolio. Move to offer stage.',
    null, null, null,  // some candidates have no notes
  ]

  const RECOMMENDATIONS = ['strong_yes', 'strong_yes', 'yes', 'yes', 'yes', 'maybe', 'maybe', 'no']

  // Build 30 candidates from the seed pool (cycle through if not enough)
  const proCandidatesSource = ALL_CANDIDATES.filter(c => c.vacancyIndex >= 3 && c.vacancyIndex < 9)
  const targetCount = 30

  let realCandidatesCount = 0
  for (let i = 0; i < targetCount; i++) {
    const sourceIdx = i % proCandidatesSource.length
    const c = proCandidatesSource[sourceIdx]
    if (!c) continue
    const { vacancyIndex, strengths, weaknesses, skills, ...rest } = c
    const proIndex = vacancyIndex - 3
    const vacancyId = proVacancyIds[proIndex]
    if (!vacancyId) continue
    const vacancyTitle = proVacancies[proIndex].title

    const status = STATUS_DISTRIBUTION[i % STATUS_DISTRIBUTION.length]
    const note = NOTES_POOL[i % NOTES_POOL.length]
    const recommendation = RECOMMENDATIONS[i % RECOMMENDATIONS.length]

    // Mix of scores: extremes are more interesting than always 60-95
    let matchScore: number
    if (status === 'hired' || status === 'shortlisted') matchScore = 80 + Math.floor(Math.random() * 18) // 80-97
    else if (status === 'rejected') matchScore = 25 + Math.floor(Math.random() * 25) // 25-50
    else if (status === 'interviewing') matchScore = 75 + Math.floor(Math.random() * 15) // 75-90
    else matchScore = hashScore(rest.cvContent + i, vacancyTitle) // pseudo-random for new/reviewing

    // Spread createdAt over last 45 days
    const daysAgo = Math.floor(Math.random() * 45)
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    // Make some candidates "liked" or "priority"
    const liked = Math.random() < 0.25
    const priority = (status === 'shortlisted' || status === 'interviewing') && Math.random() < 0.4
    const savedToPool = Math.random() < 0.15

    // Vary the source to look diverse
    const sources = ['upload', 'upload', 'email_scan', 'ats', 'ats', 'manual']
    const source = sources[i % sources.length]

    // Give some shortlisted/interviewing candidates a SCHEDULED interview so the
    // dashboard calendar has visible data on the demo accounts. Spread the dates
    // across the next ~3 weeks at business hours (09:00–16:00).
    let interviewAt: Date | null = null
    let interviewDuration: number | null = null
    let interviewLocation: string | null = null
    if ((status === 'shortlisted' || status === 'interviewing') && i % 3 === 0) {
      const base = new Date()
      base.setDate(base.getDate() + 1 + (i % 18)) // tomorrow .. +18 days
      base.setHours(9 + (i % 8), (i % 2) * 30, 0, 0) // 09:00–16:30, on the hour/half-hour
      interviewAt = base
      interviewDuration = [30, 45, 60][i % 3]
      interviewLocation = i % 2 === 0 ? 'https://meet.google.com/demo-interview' : 'Office — Meeting room A'
    }

    const candidate = await prisma.candidate.create({
      data: {
        ...rest,
        // Append index to avoid email collisions when cycling through pool
        email: rest.email ? rest.email.replace('@', `+pro${i}@`) : null,
        vacancyId,
        userId: proUser.id,
        strengths: JSON.stringify(strengths),
        weaknesses: JSON.stringify(weaknesses),
        skills: JSON.stringify(skills),
        matchScore,
        status,
        recommendation,
        notes: note,
        liked,
        priority,
        savedToPool,
        source,
        interviewAt,
        interviewDuration,
        interviewLocation,
        analyzedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
        gdprConsent: true,
        gdprConsentDate: createdAt,
      },
    })
    realCandidatesCount++

    // Create activity timeline for active candidates
    if (status !== 'new') {
      await prisma.candidateActivity.create({
        data: {
          candidateId: candidate.id,
          type: 'created',
          description: 'Candidate created via CV upload',
          createdAt,
        },
      })
      if (status === 'reviewing' || status === 'shortlisted' || status === 'interviewing' || status === 'hired') {
        await prisma.candidateActivity.create({
          data: {
            candidateId: candidate.id,
            type: 'status_change',
            description: `Status changed: new → ${status === 'reviewing' ? 'reviewing' : 'shortlisted'}`,
            createdAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
          },
        })
      }
      if (note) {
        await prisma.candidateActivity.create({
          data: {
            candidateId: candidate.id,
            type: 'note_added',
            description: 'Note added by recruiter',
            createdAt: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
          },
        })
      }
      if (status === 'interviewing' || status === 'hired') {
        await prisma.candidateActivity.create({
          data: {
            candidateId: candidate.id,
            type: 'email_sent',
            description: 'Interview invitation sent',
            createdAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
          },
        })
      }
      if (status === 'hired') {
        await prisma.candidateActivity.create({
          data: {
            candidateId: candidate.id,
            type: 'status_change',
            description: 'Status changed: interviewing → hired',
            createdAt: new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000),
          },
        })
      }
    }
  }

  // Create a fake-connected ATS integration (Teamtailor) for the Pro demo
  await prisma.integration.create({
    data: {
      userId: proUser.id,
      platform: 'teamtailor',
      apiKey: 'demo_tt_key_encrypted_xxxx',
      status: 'active',
      lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      syncCount: 18,
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    },
  })

  // Create a few notifications for the Pro demo
  const notifications = [
    { type: 'cv_analyzed', title: 'New candidate analyzed', message: 'Sophie Martin scored 94% for Senior Backend Developer', daysAgo: 0 },
    { type: 'cv_analyzed', title: 'New candidate analyzed', message: 'Lucas Bernard scored 87% for Product Manager', daysAgo: 0 },
    { type: 'ats_sync', title: 'ATS sync complete', message: 'Teamtailor imported 5 new candidates', daysAgo: 0 },
    { type: 'email_scan', title: 'Email scan complete', message: '3 CVs detected in inbox', daysAgo: 1 },
    { type: 'cv_analyzed', title: 'New candidate analyzed', message: 'Anna Dubois scored 91% for Marketing Manager', daysAgo: 1 },
  ]
  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        userId: proUser.id,
        type: n.type,
        title: n.title,
        message: n.message,
        read: false,
        createdAt: new Date(Date.now() - n.daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 6 * 60 * 60 * 1000),
      },
    })
  }

  console.log('✅ Database seeded successfully')
  console.log('👤 Admin:       admin@cvmatch.ai / Wachtwoord_2201 (pro)')
  console.log('👤 Demo Free:   demo@cvmatch.ai / recruiter123')
  console.log('👤 Demo Pro:    pro@cvmatch.ai / pro123')
  console.log(`📋 Demo Free: 3 vacancies, ${demoCandidates.length} candidates`)
  console.log(`📋 Demo Pro:  6 vacancies, ${realCandidatesCount} candidates, 1 ATS connected, ${notifications.length} notifications`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
