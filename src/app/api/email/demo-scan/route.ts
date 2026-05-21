// Simulated email scan for demo purposes — no real IMAP connection needed.
// Creates realistic demo candidates from fake recruitment emails so users can
// see the full AI email-scanning flow without providing real credentials.
// Uses upsert (email + vacancyId unique key) so running it multiple times is safe.
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { analyzeCVAgainstVacancy } from '@/lib/ai'

// 4 demo emails × ~30-60s per Opus analysis = up to 4 min — allow the full run
export const maxDuration = 300

const DEMO_EMAILS = [
  {
    subject: 'Application: Senior Developer Position',
    sender: 'alex.johnson@gmail.com',
    // Keywords that help match this CV to a full-stack / developer vacancy
    domainKeywords: ['react', 'typescript', 'node', 'javascript', 'frontend', 'backend', 'fullstack', 'full-stack', 'developer', 'engineer', 'software', 'aws', 'docker'],
    cvText: `Alex Johnson
alex.johnson@gmail.com | +32 471 555 001 | Leuven, Belgium

EXPERIENCE
Senior Software Engineer — FinTech Brussels (2019–present)
- Built React/TypeScript frontend for banking dashboard serving 150,000 users
- Designed Node.js microservices communicating via REST and gRPC
- Managed PostgreSQL databases with 10M+ records; optimized slow queries 60%
- Set up Docker + Kubernetes deployment on AWS EKS

Software Engineer — Consulting Firm Bruges (2016–2019)
- Developed custom ERP modules in Vue.js and PHP/Laravel
- Integrated third-party APIs (payment, logistics, CRM)

EDUCATION
Master Software Engineering — KU Leuven (2016)

SKILLS
React, TypeScript, Node.js, PostgreSQL, Docker, Kubernetes, AWS, gRPC, Redis, Vue.js`,
    motivationText: `Dear Hiring Manager,

I am writing to apply for the Senior Full-Stack Developer position at Acme Corp. With 7+ years of professional software development experience and a strong track record in React and Node.js, I am confident I would be a strong fit for your team.

At FinTech Brussels I led the complete rebuild of our customer dashboard, improving performance by 40% and reducing bug reports by 60%. I thrive in fast-paced environments and enjoy mentoring junior developers.

I look forward to discussing this opportunity.

Best regards,
Alex Johnson`,
  },
  {
    subject: 'CV Attached - UX Designer Application',
    sender: 'maya.patel@outlook.com',
    domainKeywords: ['ux', 'ui', 'design', 'figma', 'user research', 'usability', 'prototype', 'wireframe', 'designer', 'product design', 'accessibility'],
    cvText: `Maya Patel
maya.patel@outlook.com | +44 7911 234 567 | London, UK (open to remote)

EXPERIENCE
Lead UX Designer — EdTech Startup London (2020–present)
- Redesigned core learning platform — user retention improved 45%
- Built Figma design system with 180+ components used across 5 products
- Led weekly design critique sessions and mentored 2 junior designers
- Conducted quarterly usability studies with 20+ participants

UX/UI Designer — Digital Product Agency (2018–2020)
- End-to-end design for iOS and Android apps in health and finance sectors
- Created accessible designs meeting WCAG 2.1 AA standards

EDUCATION
BA Design — Central Saint Martins, London (2018)

SKILLS
Figma, Principle, Framer, Adobe CC, Maze, UserTesting
User research, usability testing, design systems, accessibility (WCAG 2.1 AA)
HTML/CSS, basic React

AWARDS
Design Week Award for Digital Innovation 2022`,
    motivationText: `To the Design Team at Acme Corp,

I'm excited to apply for your UX/UI Designer role. I've spent 6 years designing digital products that people actually enjoy using — from complex EdTech platforms to consumer mobile apps.

What excites me most about this role is the opportunity to shape a B2B product from the ground up. I believe great design in B2B is underrated, and I want to be part of a team that disagrees.

My portfolio (available on request) showcases the Figma design system I built at my current company, including our token library and accessibility guidelines.

Warm regards,
Maya Patel`,
  },
  {
    subject: 'Sollicitatie Data Engineer - Julien Bernard',
    sender: 'julien.bernard@free.fr',
    domainKeywords: ['data', 'dbt', 'airflow', 'bigquery', 'snowflake', 'pipeline', 'etl', 'sql', 'analytics', 'warehouse', 'kafka', 'spark', 'python'],
    cvText: `Julien Bernard
julien.bernard@free.fr | +33 6 88 77 66 55 | Paris, France

EXPÉRIENCE
Data Engineer Senior — Startup SaaS Paris (2021–present)
- Architecture et maintenance de pipelines dbt + Airflow en production
- Migration data warehouse Oracle → BigQuery — réduction coûts 35%
- Implémentation monitoring qualité données (Great Expectations, dbt tests)
- Développement API Python/FastAPI pour exposition des données BI

Data Analyst — Société de Conseil Lyon (2018–2021)
- Développement tableaux de bord Looker, Power BI, Tableau
- Automatisation rapports Python/pandas, SQL avancé

FORMATION
Master Data Science & IA — Université Paris-Saclay (2018)
Licence Mathématiques — Université de Bordeaux (2016)

COMPÉTENCES
Python, SQL (expert), dbt Core, Apache Airflow, BigQuery, Snowflake, PostgreSQL
Great Expectations, dbt Cloud, Kafka, Segment, Looker, Tableau, Power BI
Docker, Terraform, Git, CI/CD`,
    motivationText: `Bonjour,

Je me permets de vous adresser ma candidature pour le poste de Data Engineer. Fort de 5 ans d'expérience en ingénierie des données, je maîtrise parfaitement la stack dbt/Airflow/BigQuery que vous utilisez.

Ma migration réussie vers BigQuery avec une réduction des coûts de 35% illustre ma capacité à apporter de la valeur immédiatement. Je suis disponible pour un entretien à votre convenance.

Cordialement,
Julien Bernard`,
  },
  {
    subject: 'Application for Full-Stack Developer Role',
    sender: 'nina.schmidt@web.de',
    domainKeywords: ['react', 'next.js', 'typescript', 'node', 'javascript', 'frontend', 'fullstack', 'full-stack', 'developer', 'rest', 'api', 'postgresql'],
    cvText: `Nina Schmidt
nina.schmidt@web.de | +49 176 999 888 | Berlin, Germany

EXPERIENCE
Full-Stack Developer — Berlin SaaS Company (2022–present)
- React/Next.js frontend development with TypeScript
- Node.js REST API development and PostgreSQL database management
- Deployed applications on AWS using Docker containers

Junior Developer — Web Agency Hamburg (2020–2022)
- Built responsive websites using React and Vue.js
- WordPress theme development and plugin customization

EDUCATION
Bachelor Computer Science — TU Berlin (2020)

SKILLS
React, Next.js, TypeScript, JavaScript, Node.js, PostgreSQL, MySQL
Docker, AWS EC2, Git, Agile`,
    motivationText: '',
  },
]

// Scores a vacancy for a given CV using overlap between the CV text and the full
// vacancy text (title + description + requirements). Returns 0-100.
function scoreVacancyForCV(
  cvLower: string,
  domainKeywords: string[],
  vacancy: { title: string; description: string; requirements: string },
): number {
  const vacancyText = `${vacancy.title} ${vacancy.description} ${vacancy.requirements}`.toLowerCase()

  // Domain keyword hits — direct match between CV profile and vacancy text
  const domainHits = domainKeywords.filter(k => vacancyText.includes(k) || cvLower.includes(k)).length

  // Word overlap — count meaningful vacancy words that appear in the CV
  const vacancyWords = [...new Set((vacancyText.match(/\b[a-z]{4,}\b/g) || []))]
  const wordHits = vacancyWords.filter(w => cvLower.includes(w)).length
  const wordScore = vacancyWords.length > 0 ? wordHits / vacancyWords.length : 0

  return domainHits * 10 + wordScore * 50
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const vacancies = await prisma.vacancy.findMany({
    where: { userId, status: 'active' },
    select: { id: true, title: true, description: true, requirements: true },
  })

  if (vacancies.length === 0) {
    return NextResponse.json({ error: 'Create at least one active vacancy before running a demo scan.' }, { status: 400 })
  }

  let processed = 0

  // Reuse or create the demo inbox record — this is just a placeholder for the email source relation
  let demoInbox = await prisma.emailInbox.findFirst({ where: { userId, provider: 'demo' } })
  if (!demoInbox) {
    demoInbox = await prisma.emailInbox.create({
      data: { email: 'demo@cvmatch.ai', provider: 'demo', host: 'demo', port: 993, username: 'demo@cvmatch.ai', password: 'demo', userId },
    })
  }

  for (const email of DEMO_EMAILS) {
    // Select the vacancy whose full text best matches this CV's domain keywords.
    // Falls back to the first active vacancy when nothing scores above 0.
    const cvLower = email.cvText.toLowerCase()
    const scored = vacancies.map(v => ({ v, score: scoreVacancyForCV(cvLower, email.domainKeywords, v) }))
    scored.sort((a, b) => b.score - a.score)
    const vacancy = scored[0].v

    const analysis = await analyzeCVAgainstVacancy(
      email.cvText,
      vacancy.title,
      vacancy.description,
      vacancy.requirements,
      email.motivationText || undefined,
    )

    // Always use email.sender as the stored email — this is the dedup key.
    // Using analysis.email could differ from sender and break the unique constraint check.
    const candidateEmail = email.sender

    // upsert: if this email+vacancy combination already exists, skip (update: {}).
    // This is safe under concurrent requests because the DB unique constraint
    // guarantees exactly one row even if two requests race.
    const result = await prisma.candidate.upsert({
      where: { email_vacancyId: { email: candidateEmail, vacancyId: vacancy.id } },
      update: {},
      create: {
        firstName: analysis.firstName || email.sender.split('@')[0].split('.')[0],
        lastName: analysis.lastName || email.sender.split('@')[0].split('.').slice(1).join(' ') || 'Demo',
        email: candidateEmail,
        phone: analysis.phone,
        cvContent: email.cvText,
        motivationText: email.motivationText || null,
        matchScore: analysis.matchScore,
        summary: analysis.summary,
        strengths: JSON.stringify(analysis.strengths),
        weaknesses: JSON.stringify(analysis.weaknesses),
        skills: JSON.stringify(analysis.skills),
        experience: analysis.experience,
        education: analysis.education,
        recommendation: analysis.recommendation,
        language: analysis.language,
        status: 'new',
        source: 'email',
        vacancyId: vacancy.id,
        userId,
        analyzedAt: new Date(),
        emailSource: {
          create: {
            subject: email.subject,
            sender: email.sender,
            receivedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            processed: true,
            relevant: true,
            attachments: JSON.stringify(['CV.pdf']),
            inboxId: demoInbox.id,
          },
        },
      },
    })

    // upsert returns the record whether created or updated — track only new inserts
    if (result.analyzedAt && Date.now() - result.analyzedAt.getTime() < 60_000) processed++
  }

  return NextResponse.json({ scanned: DEMO_EMAILS.length, relevant: DEMO_EMAILS.length, processed })
}
