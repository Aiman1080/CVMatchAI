import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  const recruiterPassword = await bcrypt.hash('recruiter123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cvmatch.ai' },
    update: {},
    create: {
      email: 'admin@cvmatch.ai',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
      company: 'CVMatch AI',
      subscription: 'enterprise',
    },
  })

  const recruiter = await prisma.user.upsert({
    where: { email: 'demo@cvmatch.ai' },
    update: {},
    create: {
      email: 'demo@cvmatch.ai',
      name: 'Demo Recruiter',
      password: recruiterPassword,
      role: 'recruiter',
      company: 'Acme Corp',
      subscription: 'pro',
    },
  })

  const vacancy1 = await prisma.vacancy.create({
    data: {
      title: 'Senior Full-Stack Developer',
      company: 'Acme Corp',
      department: 'Engineering',
      location: 'Brussels, Belgium',
      type: 'full-time',
      description: 'We are looking for an experienced Full-Stack Developer to join our growing team. You will be responsible for developing and maintaining our web applications.',
      requirements: 'React, Node.js, TypeScript, 5+ years experience, REST APIs, databases',
      niceToHave: 'Next.js, AWS, Docker, GraphQL',
      salary: '€70,000 - €90,000',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  const vacancy2 = await prisma.vacancy.create({
    data: {
      title: 'UX/UI Designer',
      company: 'Acme Corp',
      department: 'Design',
      location: 'Remote',
      type: 'full-time',
      description: 'Join our design team to create beautiful, user-centered digital experiences for millions of users.',
      requirements: 'Figma, 3+ years experience, User research, Prototyping, Design systems',
      niceToHave: 'Motion design, React basics, Storybook',
      salary: '€55,000 - €75,000',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  const candidates = [
    {
      firstName: 'Sophie', lastName: 'De Groote',
      email: 'sophie.degroote@email.com', phone: '+32 476 123 456',
      cvContent: 'Experienced Full-Stack Developer with 7 years building React and Node.js applications. Strong TypeScript skills. Led teams at multiple startups.',
      matchScore: 92.5,
      summary: 'Highly qualified candidate with extensive full-stack experience matching the role requirements.',
      strengths: JSON.stringify(['7 years experience', 'TypeScript expert', 'Team leadership', 'React/Node.js']),
      weaknesses: JSON.stringify(['No AWS certification', 'Limited GraphQL']),
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker']),
      status: 'shortlisted', source: 'upload', vacancyId: vacancy1.id, userId: recruiter.id,
    },
    {
      firstName: 'Thomas', lastName: 'Vermeersch',
      email: 'thomas.v@email.com', phone: '+32 499 654 321',
      cvContent: 'Full-Stack Developer with 4 years experience in React and Python. Some TypeScript experience.',
      matchScore: 74.0,
      summary: 'Good candidate but slightly below required experience level. Strong potential.',
      strengths: JSON.stringify(['React proficient', 'Fast learner', 'Python skills']),
      weaknesses: JSON.stringify(['Only 4 years exp (req. 5+)', 'Limited TypeScript']),
      skills: JSON.stringify(['React', 'Python', 'JavaScript', 'MySQL']),
      status: 'reviewing', source: 'email', vacancyId: vacancy1.id, userId: recruiter.id,
    },
    {
      firstName: 'Lena', lastName: 'Braun',
      email: 'lena.braun@email.com',
      cvContent: 'Award-winning UX/UI designer with 5 years experience in Figma. Strong user research and design systems background.',
      matchScore: 88.0,
      summary: 'Excellent designer with strong portfolio and relevant skills for the role.',
      strengths: JSON.stringify(['Figma expert', 'Design systems', 'User research', '5 years exp']),
      weaknesses: JSON.stringify(['No motion design experience']),
      skills: JSON.stringify(['Figma', 'Adobe XD', 'Sketch', 'InVision', 'User Research']),
      status: 'shortlisted', source: 'upload', vacancyId: vacancy2.id, userId: recruiter.id,
    },
  ]

  for (const candidate of candidates) {
    await prisma.candidate.create({ data: candidate })
  }

  console.log('✅ Database seeded successfully')
  console.log('👤 Admin: admin@cvmatch.ai / admin123')
  console.log('👤 Demo Recruiter: demo@cvmatch.ai / recruiter123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
