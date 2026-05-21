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
      location: 'Brussels, Belgium (Hybrid)',
      type: 'full-time',
      description: `We are looking for an experienced Senior Full-Stack Developer to join our growing product engineering team in Brussels. You will work closely with our CTO and lead architect to design, build, and scale our core SaaS platform used by thousands of businesses across Europe.

Your responsibilities will include:
- Architect and develop new features for our React/Next.js frontend and Node.js/TypeScript backend
- Design and optimize PostgreSQL schemas and write efficient queries
- Lead code reviews and set engineering best practices
- Mentor junior developers and participate in technical hiring interviews
- Collaborate with product designers to deliver pixel-perfect, accessible UIs
- Maintain CI/CD pipelines and cloud infrastructure on AWS

We offer a competitive package, flexible remote work (3 days/week from our Brussels HQ), 30 days vacation, and meaningful equity.`,
      requirements: `- Minimum 5 years of professional full-stack development experience
- Expert knowledge of React (hooks, context, performance optimization) and TypeScript
- Strong Node.js/Express or NestJS backend experience
- Solid understanding of PostgreSQL, query optimization, and database design
- Experience with REST APIs and ideally GraphQL
- Comfortable with Docker, CI/CD pipelines, and cloud deployments (AWS or GCP)
- Proven ability to work in Agile/Scrum teams
- Fluent in English; Dutch or French is a plus`,
      niceToHave: 'Next.js App Router, AWS CDK or Terraform, Redis, WebSockets, Storybook, GraphQL federation',
      salary: '€70,000 – €90,000 gross/year + equity + benefits',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  const vacancy2 = await prisma.vacancy.create({
    data: {
      title: 'UX/UI Designer',
      company: 'Acme Corp',
      department: 'Product Design',
      location: 'Remote (Belgium/Netherlands/France)',
      type: 'full-time',
      description: `Join our small but mighty design team to shape the future of our B2B SaaS platform. As UX/UI Designer you will own end-to-end design for new product features — from user research and wireframing to polished Figma prototypes and design system components.

Key responsibilities:
- Conduct user interviews and usability tests to validate hypotheses
- Create wireframes, user flows, and high-fidelity prototypes in Figma
- Maintain and extend our design system (color tokens, typography, component library)
- Work closely with engineers to ensure pixel-perfect implementation
- Define accessibility (WCAG 2.1 AA) guidelines and champion inclusive design
- Present design decisions with clear rationale to stakeholders

We are a design-led company — your work will be seen by thousands of users every day.`,
      requirements: `- 3+ years of professional UX/UI design experience for digital products
- Mastery of Figma including components, variants, auto-layout, and prototyping
- Experience running user research sessions and synthesizing findings
- Solid grasp of design systems and component libraries
- Understanding of front-end constraints (HTML/CSS basics are a big plus)
- Strong visual design sense — typography, spacing, hierarchy, color
- Portfolio demonstrating real shipped products (B2B SaaS preferred)`,
      niceToHave: 'Motion design (After Effects / Lottie), basic React/Storybook, Framer, Maze or UserTesting experience',
      salary: '€55,000 – €75,000 gross/year + benefits',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  const vacancy3 = await prisma.vacancy.create({
    data: {
      title: 'Data Engineer',
      company: 'Acme Corp',
      department: 'Data & Analytics',
      location: 'Ghent, Belgium (On-site)',
      type: 'full-time',
      description: `We are building out our data platform and need a skilled Data Engineer to design and maintain our data pipelines, warehousing, and analytics infrastructure. You will work alongside our data scientists and BI analysts to turn raw event streams into reliable, queryable datasets that drive business decisions.

Responsibilities:
- Design, build, and maintain ELT pipelines using dbt and Airflow
- Manage our data warehouse (BigQuery / Redshift) including schema design and partitioning
- Implement data quality checks and monitoring with Great Expectations
- Collaborate with backend engineers to ensure reliable event tracking via Segment/Kafka
- Build and document reusable data models for BI consumption
- Participate in on-call rotation for pipeline incidents`,
      requirements: `- 3+ years of data engineering experience in a production environment
- Strong SQL skills (window functions, CTEs, performance tuning)
- Hands-on experience with dbt (models, tests, macros)
- Python proficiency for data pipeline scripting
- Experience with a cloud data warehouse (BigQuery, Snowflake, or Redshift)
- Familiarity with orchestration tools (Airflow, Prefect, or Dagster)
- Understanding of data modeling (star schema, dimensional modeling)`,
      niceToHave: 'Kafka or Kinesis, Spark/PySpark, Terraform, dbt Cloud, Looker or Metabase',
      salary: '€60,000 – €80,000 gross/year',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  const candidates = [
    {
      firstName: 'Sophie', lastName: 'De Groote',
      email: 'sophie.degroote@email.com', phone: '+32 476 123 456',
      cvContent: `Sophie De Groote
sophie.degroote@email.com | +32 476 123 456 | Brussels, Belgium

EXPERIENCE
Senior Full-Stack Developer — TechStart Brussels (2020–present)
- Led frontend rebuild from Angular to React/TypeScript, reducing bundle size 40%
- Designed REST + GraphQL API layer with Node.js and PostgreSQL
- Introduced Docker + GitHub Actions CI/CD, cutting deploy time from 2h to 15min
- Mentored 3 junior developers; conducted bi-weekly architecture reviews

Full-Stack Developer — Deinze Digital Agency (2017–2020)
- Built 15+ client websites and web apps using React, Vue.js, and PHP/Laravel
- Integrated payment gateways (Stripe, Mollie) and CRM systems (Salesforce, HubSpot)

EDUCATION
Master Computer Science — KU Leuven (2017)
Bachelor Applied Informatics — HoGent (2015)

SKILLS
React, Next.js, TypeScript, Node.js, Express, PostgreSQL, Docker, AWS (EC2, RDS, S3), GraphQL, Redis, Git, Agile/Scrum

LANGUAGES
Dutch (native), English (fluent), French (conversational)`,
      matchScore: 92.5,
      summary: 'Highly qualified senior developer with 7+ years of hands-on full-stack experience. Exceptional match for the role — covers React, TypeScript, Node.js, PostgreSQL, Docker and AWS. Her leadership experience mentoring junior developers aligns perfectly with the senior-level expectation.',
      strengths: JSON.stringify([
        '7 years full-stack experience — exceeds 5-year requirement',
        'Expert React + TypeScript + Node.js — exact tech stack match',
        'AWS and Docker experience — cloud-ready immediately',
        'Team leadership and mentoring track record',
        'GraphQL experience — covers the nice-to-have',
      ]),
      weaknesses: JSON.stringify([
        'No explicit AWS certification mentioned',
        'Next.js not listed (Vue and React listed, Next.js not confirmed)',
      ]),
      skills: JSON.stringify(['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Redis']),
      experience: '7 years professional experience: Senior FS Dev at TechStart Brussels (4y) and FS Dev at Deinze Digital Agency (3y). Delivered production systems with measurable impact.',
      education: 'Master Computer Science, KU Leuven (2017). Bachelor Applied Informatics, HoGent (2015).',
      recommendation: 'strong_yes',
      language: 'en',
      status: 'shortlisted', source: 'upload', vacancyId: vacancy1.id, userId: recruiter.id,
      analyzedAt: new Date(),
    },
    {
      firstName: 'Thomas', lastName: 'Vermeersch',
      email: 'thomas.v@email.com', phone: '+32 499 654 321',
      cvContent: `Thomas Vermeersch
thomas.v@email.com | +32 499 654 321 | Ghent, Belgium

EXPERIENCE
Full-Stack Developer — Ghent Web Solutions (2021–present)
- Built React SPAs and REST APIs using Python/FastAPI
- Managed PostgreSQL databases and wrote complex SQL queries
- Some TypeScript experience on frontend projects

Junior Developer — Freelance (2020–2021)
- Built WordPress and WooCommerce sites for local SMBs
- Developed custom PHP plugins

EDUCATION
Bachelor Web Development — HoGent (2020)

SKILLS
React, JavaScript, TypeScript (intermediate), Python, FastAPI, PostgreSQL, MySQL, Git, Linux

LANGUAGES
Dutch (native), English (good)`,
      matchScore: 74.0,
      summary: 'Solid developer with 4 years experience and good fundamentals. Falls slightly short of the 5-year requirement, and TypeScript proficiency is intermediate rather than expert level. Python background is not directly relevant but shows adaptability. Worth interviewing if senior candidates are scarce.',
      strengths: JSON.stringify([
        'React proficiency — frontend stack aligns',
        'PostgreSQL and SQL experience — relevant',
        'Fast learner — picked up TypeScript and Python independently',
        'Full-stack exposure across frontend and backend',
      ]),
      weaknesses: JSON.stringify([
        'Only 4 years experience (requirement: 5+)',
        'TypeScript described as "intermediate" — not expert level',
        'No AWS/cloud or Docker experience mentioned',
        'No team leadership or mentoring experience',
      ]),
      skills: JSON.stringify(['React', 'JavaScript', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'MySQL']),
      experience: '4 years: FS Developer at Ghent Web Solutions (3y) and freelance junior work (1y). Primarily frontend-focused with some backend API work.',
      education: 'Bachelor Web Development, HoGent (2020).',
      recommendation: 'maybe',
      language: 'en',
      status: 'reviewing', source: 'email', vacancyId: vacancy1.id, userId: recruiter.id,
      analyzedAt: new Date(),
    },
    {
      firstName: 'Lena', lastName: 'Braun',
      email: 'lena.braun@email.com', phone: '+49 176 543 210',
      cvContent: `Lena Braun
lena.braun@email.com | +49 176 543 210 | Berlin, Germany (open to remote)

EXPERIENCE
Senior UX/UI Designer — SaaS Startup Berlin (2021–present)
- Owned design for 3 core product areas serving 20,000+ B2B users
- Built and maintained Figma design system with 200+ components
- Ran 50+ user interviews and usability tests; reduced onboarding drop-off 35%
- Collaborated daily with React engineers to ensure implementation fidelity

UX Designer — Design Agency Hamburg (2019–2021)
- Delivered UX/UI for mobile and web clients in fintech and e-commerce
- Created wireframes, prototypes, and handoff specs for development teams

EDUCATION
Bachelor Communication Design — HTW Berlin (2019)

SKILLS
Figma (advanced), Adobe XD, Sketch, InVision, Maze, Principle
User research, usability testing, accessibility (WCAG 2.1 AA)
HTML/CSS basics, Storybook

AWARDS
UX Design Award 2023 — German Design Council`,
      matchScore: 88.0,
      summary: 'Excellent designer with 5 years of experience and a strong B2B SaaS portfolio. Deep Figma expertise, proven design system experience, and data-driven UX approach make her an outstanding fit. The award and measurable impact metrics (35% onboarding improvement) set her apart.',
      strengths: JSON.stringify([
        'Figma mastery — 200+ component design system built from scratch',
        '5 years experience including senior B2B SaaS role',
        'Strong user research — 50+ interviews, quantified impact',
        'Accessibility expertise (WCAG 2.1 AA) — nice-to-have covered',
        'HTML/CSS basics + Storybook — understands engineering constraints',
        'UX Design Award 2023 — peer-validated excellence',
      ]),
      weaknesses: JSON.stringify([
        'Based in Berlin — may need relocation or remote arrangement',
        'No explicit motion design experience listed',
      ]),
      skills: JSON.stringify(['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Maze', 'User Research', 'WCAG 2.1', 'Storybook', 'HTML/CSS']),
      experience: '5 years: Senior UX/UI at B2B SaaS startup Berlin (3y) and UX Designer at Hamburg agency (2y). Delivered measurable UX improvements for high-traffic products.',
      education: 'Bachelor Communication Design, HTW Berlin (2019).',
      recommendation: 'strong_yes',
      language: 'en',
      status: 'shortlisted', source: 'upload', vacancyId: vacancy2.id, userId: recruiter.id,
      analyzedAt: new Date(),
    },
    {
      firstName: 'Julien', lastName: 'Moreau',
      email: 'julien.moreau@email.fr', phone: '+33 6 12 34 56 78',
      cvContent: `Julien Moreau
julien.moreau@email.fr | +33 6 12 34 56 78 | Lille, France

EXPÉRIENCE
Data Engineer — Fintech Paris (2022–present)
- Conception et maintenance de pipelines ELT avec dbt et Apache Airflow
- Migration data warehouse vers BigQuery — réduction des coûts de 30%
- Développement de modèles dbt pour rapports BI (Looker)
- Mise en place de tests qualité données avec Great Expectations

Analyste Data — Agence Conseil Lyon (2020–2022)
- Développement de dashboards Tableau et Power BI
- Écriture de requêtes SQL complexes sur PostgreSQL et Redshift
- Automatisation de rapports Excel avec Python/pandas

FORMATION
Master Data Science — Université de Lille (2020)
Licence Mathématiques & Informatique — Université de Bordeaux (2018)

COMPÉTENCES
Python, SQL (avancé), dbt, Apache Airflow, BigQuery, Redshift, PostgreSQL
Great Expectations, Kafka (notions), Segment, Looker, Tableau, Power BI
Git, Docker, Terraform (bases)

LANGUES
Français (natif), Anglais (courant), Néerlandais (notions)`,
      matchScore: 85.0,
      summary: 'Strong data engineer with 4 years of experience, excellent dbt and Airflow expertise, and proven BigQuery migration success. His Python/SQL foundation and quality-first mindset match the role requirements well. French-speaking background is a bonus for the team.',
      strengths: JSON.stringify([
        'dbt + Airflow expertise — core stack match',
        'BigQuery production experience with cost optimization',
        'Great Expectations data quality — directly required',
        'Strong SQL (advanced) + Python proficiency',
        'Looker experience — BI tool alignment',
      ]),
      weaknesses: JSON.stringify([
        'Only 4 years experience (requirement: 3+ years — meets it)',
        'Kafka listed as "notions" — limited streaming experience',
        'Based in Lille — may need relocation to Ghent',
      ]),
      skills: JSON.stringify(['Python', 'SQL', 'dbt', 'Apache Airflow', 'BigQuery', 'Redshift', 'PostgreSQL', 'Great Expectations', 'Kafka', 'Looker', 'Tableau']),
      experience: '4 years: Data Engineer at Fintech Paris (2y) and Data Analyst at Lyon agency (2y). Hands-on ELT pipeline and BI delivery experience.',
      education: 'Master Data Science, Université de Lille (2020). Bachelor Maths & CS, Université de Bordeaux (2018).',
      recommendation: 'yes',
      language: 'fr',
      status: 'reviewing', source: 'email', vacancyId: vacancy3.id, userId: recruiter.id,
      analyzedAt: new Date(),
    },
    {
      firstName: 'Emma', lastName: 'Van den Berg',
      email: 'emma.vdberg@gmail.com', phone: '+32 479 876 543',
      cvContent: `Emma Van den Berg
emma.vdberg@gmail.com | +32 479 876 543 | Antwerp, Belgium

EXPERIENCE
UX Designer — E-commerce Startup Antwerp (2022–present)
- Designed mobile-first checkout flow — increased conversion 22%
- Created component library in Figma for handoff to React team
- Conducted A/B tests and user interviews to validate design decisions

Junior UX Designer — Digital Agency Brussels (2020–2022)
- Wireframing and prototyping for 10+ web and mobile projects
- Worked in cross-functional teams with developers and copywriters

EDUCATION
Bachelor Graphic Design — Artesis Plantijn Hogeschool Antwerp (2020)

SKILLS
Figma, Adobe XD, Illustrator, Photoshop
User interviews, A/B testing, wireframing, prototyping
Notion, Jira, Confluence

LANGUAGES
Dutch (native), English (fluent), French (basic)`,
      matchScore: 71.0,
      summary: 'Promising UX designer with 4 years of experience. Strong conversion-focused design mindset and Figma skills, but limited design system depth and no formal accessibility expertise. Good candidate for a mid-level UX role; may need further development for a senior position.',
      strengths: JSON.stringify([
        'Figma proficiency and component library experience',
        'Data-driven design — A/B tests and user interviews',
        'Measurable impact — 22% checkout conversion improvement',
        'Belgium-based — no relocation needed',
      ]),
      weaknesses: JSON.stringify([
        'Component library less mature than required design system scope',
        'No WCAG / accessibility experience mentioned',
        'Junior-to-mid level — 4 years total, less B2B SaaS depth',
        'No motion design or advanced prototyping tools',
      ]),
      skills: JSON.stringify(['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'User Research', 'A/B Testing', 'Prototyping']),
      experience: '4 years: UX Designer at e-commerce startup Antwerp (2y) and Junior UX at Brussels agency (2y). Consumer e-commerce background rather than B2B SaaS.',
      education: 'Bachelor Graphic Design, Artesis Plantijn Hogeschool Antwerp (2020).',
      recommendation: 'maybe',
      language: 'nl',
      status: 'new', source: 'upload', vacancyId: vacancy2.id, userId: recruiter.id,
      analyzedAt: new Date(),
    },
  ]

  for (const candidate of candidates) {
    await prisma.candidate.create({ data: candidate })
  }

  console.log('✅ Database seeded successfully')
  console.log('👤 Admin: admin@cvmatch.ai / admin123')
  console.log('👤 Demo Recruiter: demo@cvmatch.ai / recruiter123')
  console.log(`📋 Created ${candidates.length} demo candidates across 3 vacancies`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
