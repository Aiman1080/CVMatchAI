import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Same hash as in ai.ts so seed scores are identical to what re-analyze produces
function hashScore(cv: string, title: string): number {
  const s = (cv + title).slice(0, 600)
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return 60 + (Math.abs(h) % 35)
}

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 12)
  const recruiterPassword = await bcrypt.hash('recruiter123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@cvmatch.ai' },
    update: {},
    create: { email: 'admin@cvmatch.ai', name: 'Admin User', password: adminPassword, role: 'admin', company: 'CVMatch AI', subscription: 'enterprise' },
  })

  const recruiter = await prisma.user.upsert({
    where: { email: 'demo@cvmatch.ai' },
    update: {},
    create: { email: 'demo@cvmatch.ai', name: 'Demo Recruiter', password: recruiterPassword, role: 'recruiter', company: 'Acme Corp', subscription: 'pro' },
  })

  // ── Vacancies ──────────────────────────────────────────────────────────────

  const v1 = await prisma.vacancy.create({
    data: {
      title: 'Senior Full-Stack Developer',
      company: 'Acme Corp',
      department: 'Engineering',
      location: 'Brussels, Belgium (Hybrid 3d/week)',
      type: 'full-time',
      description: `We are looking for an experienced Senior Full-Stack Developer to join our core product team in Brussels. You will work directly with our CTO and product leads to design, build, and scale our SaaS platform — currently serving 12,000 businesses across Europe.

Your day-to-day responsibilities:
• Architect and ship new product features end-to-end (React frontend + Node.js backend)
• Design PostgreSQL schemas, write complex queries, and optimise slow endpoints
• Lead code reviews, set engineering standards, and mentor junior developers
• Build and maintain CI/CD pipelines on GitHub Actions + AWS
• Collaborate with UX designers to implement pixel-perfect, accessible interfaces
• Participate in on-call rotation (1 week/month)

We ship every Friday and move fast. Our stack is modern and well-tested. You will own your features from design through production.`,
      requirements: `• 5+ years professional full-stack development (not counting internships)
• Expert-level React with TypeScript — hooks, context, performance optimisation, testing (Vitest/RTL)
• Strong Node.js/Express or NestJS backend experience
• Deep PostgreSQL knowledge: schema design, indexing, query optimisation
• REST API design and ideally some GraphQL experience
• Docker, CI/CD (GitHub Actions or similar), cloud deployments (AWS preferred)
• Proven track record in Agile/Scrum teams shipping to production
• English fluency required; Dutch or French is a plus`,
      niceToHave: 'Next.js App Router, AWS CDK/Terraform, Redis, WebSockets/SSE, GraphQL, Storybook, Playwright E2E tests',
      salary: '€70,000 – €90,000 gross/year + stock options + 30 days PTO',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  const v2 = await prisma.vacancy.create({
    data: {
      title: 'UX/UI Designer',
      company: 'Acme Corp',
      department: 'Product Design',
      location: 'Remote (Belgium / Netherlands / France)',
      type: 'full-time',
      description: `Join our growing design team to shape the experience of a B2B SaaS platform used daily by HR teams, recruiters, and managers across Europe. As UX/UI Designer you will own end-to-end design for entire product areas — from early user research through shipped components.

What you will do:
• Run user interviews, usability tests, and Jobs-to-be-Done sessions to identify problems worth solving
• Produce wireframes, user flows, and high-fidelity Figma prototypes
• Maintain and extend our Figma design system (tokens, component variants, documentation)
• Work directly with engineers to ensure pixel-perfect implementation
• Define and enforce WCAG 2.1 AA accessibility across all new features
• Present design decisions with clear rationale to product and leadership stakeholders
• Review shipped features against your designs and report divergence

We are design-led. Your work ships to real users within 2 weeks of handoff.`,
      requirements: `• 3+ years professional UX/UI design for digital products (SaaS preferred)
• Figma mastery: components, variants, auto-layout, prototyping, and team library management
• Experience conducting user research (interviews, usability tests, surveys) and synthesising findings into actionable insights
• Solid understanding of front-end constraints — HTML/CSS basics at minimum
• Strong visual design sensibility: typography, spacing, colour, hierarchy
• Accessibility knowledge (WCAG 2.1 AA) in practice
• Portfolio demonstrating shipped B2B or consumer products (mandatory — no portfolio = no interview)`,
      niceToHave: 'Motion design (After Effects / Lottie / Framer), basic React for reviewing Storybook, Maze or UserTesting platform experience, Notion/Linear workflow',
      salary: '€55,000 – €75,000 gross/year + benefits',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  const v3 = await prisma.vacancy.create({
    data: {
      title: 'Data Engineer',
      company: 'Acme Corp',
      department: 'Data & Analytics',
      location: 'Ghent, Belgium (On-site)',
      type: 'full-time',
      description: `We are building out our data platform from scratch and need a skilled Data Engineer to design the architecture and own the pipelines that power our product analytics, customer reporting, and ML features. You will be the first dedicated data hire and will have significant autonomy to choose tools and shape the stack.

Responsibilities:
• Design and implement ELT pipelines using dbt + Apache Airflow (we are also open to Prefect)
• Manage our data warehouse (BigQuery) including schema design, partitioning, and cost optimisation
• Implement data quality checks using Great Expectations and dbt tests
• Instrument product events via Segment, Kafka, or direct API, and model them for analytics consumption
• Build reusable dbt models and document them in the dbt Docs portal
• Create dashboards in Looker for the product and CS teams
• Participate in on-call rotation for pipeline incidents (1 week/6 weeks)`,
      requirements: `• 3+ years of data engineering in production (not data analyst work)
• SQL expertise: window functions, CTEs, performance tuning, partitioning strategies
• dbt hands-on (not just "know what dbt is" — production dbt models, macros, tests)
• Python proficiency for pipeline scripting and data transformations
• Experience with at least one cloud data warehouse (BigQuery, Snowflake, or Redshift)
• Orchestration tool experience: Airflow, Prefect, or Dagster
• Understanding of data modelling (star schema, OBT, dimensional modelling)`,
      niceToHave: 'Kafka or Kinesis real-time streaming, Spark/PySpark, Terraform infra-as-code, dbt Cloud, Looker or Metabase, ELT tool experience (Fivetran/Airbyte)',
      salary: '€60,000 – €80,000 gross/year',
      status: 'active',
      language: 'en',
      userId: recruiter.id,
    },
  })

  // ── Candidates ─────────────────────────────────────────────────────────────

  const cvSophie = `Sophie De Groote
sophie.degroote@email.com | +32 476 123 456 | Brussels, Belgium | linkedin.com/in/sophiedegroote

PROFESSIONAL SUMMARY
Senior Full-Stack Engineer with 7 years of experience building production-grade React/TypeScript frontends and Node.js backends. Expert in PostgreSQL, Docker, and AWS. Led engineering teams at two Brussels startups, shipped 30+ features, and reduced infrastructure costs by 40% through architecture redesigns. Passionate about clean code, test coverage, and developer experience.

EXPERIENCE
Senior Full-Stack Developer — TechStart Brussels (March 2020 – present)
• Led rebuild of customer-facing dashboard from Angular.js to React/TypeScript; reduced bundle size 40% and improved LCP from 4.2s to 1.1s
• Designed REST + GraphQL API layer in Node.js/Express serving 150,000 daily active users
• Introduced Docker + GitHub Actions CI/CD, cutting deploy time from 2h to 15min and reducing deployment incidents 60%
• Designed PostgreSQL schemas handling 50M rows with optimised GIN/BRIN indexes
• Mentored 3 junior developers: weekly 1:1s, code review sessions, pair programming
• Implemented automated E2E test suite (Playwright) covering 85% of critical user paths

Full-Stack Developer — Deinze Digital Agency (July 2017 – February 2020)
• Built 15+ web applications for clients in retail, logistics, and finance using React and Vue.js
• Developed custom CRM integration layer connecting Salesforce, HubSpot, and bespoke ERPs
• Integrated Stripe and Mollie payment gateways for three e-commerce platforms (€2M+ monthly GMV)
• Introduced automated unit testing (Jest) — increased coverage from 0% to 70% in 6 months

EDUCATION
Master of Science in Computer Science — KU Leuven (2015 – 2017)
Specialisation: Software Engineering & Distributed Systems | Thesis: Optimising React render trees for large-scale dashboards (grade: 17/20)

Bachelor of Applied Informatics — HoGent (2012 – 2015) | Graduated with distinction

TECHNICAL SKILLS
Languages: TypeScript (expert), JavaScript (expert), Python (intermediate), SQL (expert)
Frontend: React, Next.js, Vue.js, Tailwind CSS, Radix UI, Playwright, Vitest
Backend: Node.js, Express, NestJS, GraphQL (Apollo), REST, WebSockets
Databases: PostgreSQL, Redis, MongoDB, Elasticsearch
DevOps: Docker, Kubernetes, AWS (EC2, RDS, S3, Lambda, CloudFront), GitHub Actions, Terraform
Tools: Figma (handoff), Linear, Notion, DataDog, Sentry

LANGUAGES
Dutch (native), English (fluent/C2), French (conversational/B1)`

  const motSophie = `Dear Hiring Manager at Acme Corp,

I am excited to apply for the Senior Full-Stack Developer role. After 7 years building and scaling SaaS products at Brussels tech companies, I am ready to bring that experience to a product that is already at meaningful scale.

What draws me to Acme Corp specifically is the combination of technical ambition (the stack is exactly where I thrive) and the culture of shipping fast. At TechStart I led our move to a fully containerised, CI/CD-first workflow — we went from weekly deploys with 2-hour windows to 10+ deploys per day with zero-downtime. I would love to bring that same rigour to your engineering team.

My strongest area is probably the frontend-backend boundary: I care deeply about API design, type safety end-to-end, and building React UIs that perform well at scale. I have also spent significant time mentoring junior developers, and I genuinely enjoy that part of the job.

I am available for a technical interview at any time and happy to complete a take-home exercise. Portfolio and references available on request.

Warm regards,
Sophie De Groote`

  const cvThomas = `Thomas Vermeersch
thomas.v@email.com | +32 499 654 321 | Ghent, Belgium

PROFESSIONAL SUMMARY
Full-Stack Developer with 4 years of professional experience, primarily in React/JavaScript and Python/FastAPI. Comfortable across the full stack but strongest on the frontend. Currently learning TypeScript and improving SQL skills. Looking for a senior environment where I can grow faster.

EXPERIENCE
Full-Stack Developer — Ghent Web Solutions (January 2021 – present)
• Built and maintained 6 React SPAs for B2B clients in manufacturing and logistics
• Developed REST APIs using Python/FastAPI connected to PostgreSQL
• Migrated 3 legacy jQuery applications to modern React functional components
• Wrote unit tests with pytest (backend) and Jest (frontend); increased test coverage from 15% to 55%
• Collaborated with a small team of 4 using Scrum (2-week sprints, Jira)
• Some TypeScript experience on two projects (intermediate level)

Junior Developer — Freelance (June 2020 – December 2020)
• Built WordPress sites and custom WooCommerce plugins for 8 local SMBs
• Developed a custom PHP booking system integrated with Google Calendar API

EDUCATION
Bachelor in Web Development — HoGent (2017 – 2020)
Final project: Real-time dashboard using React, WebSockets, and Node.js (grade: 15/20)

TECHNICAL SKILLS
Languages: JavaScript (strong), TypeScript (intermediate), Python (good), PHP (basic), SQL (good)
Frontend: React, HTML5, CSS3, Tailwind CSS, jQuery (legacy), Jest
Backend: Python/FastAPI, Node.js/Express (basic), PHP/Laravel (basic), REST APIs
Databases: PostgreSQL, MySQL, SQLite
Tools: Git, Docker (basic), Linux, VSCode, Jira

LANGUAGES
Dutch (native), English (good/B2), French (basic/A2)`

  const cvLena = `Lena Braun
lena.braun@email.com | +49 176 543 210 | Berlin, Germany (open to fully remote)
Portfolio: lenabraun.design

PROFESSIONAL SUMMARY
Senior UX/UI Designer with 5 years of experience designing B2B SaaS products for international markets. Built a 200+ component design system from scratch at a Berlin startup. Expert in Figma, user research, and accessibility (WCAG 2.1 AA). Won the UX Design Award 2023 (German Design Council). Known for bridging the gap between design and engineering.

EXPERIENCE
Senior UX/UI Designer — CloudOps GmbH, Berlin (April 2021 – present)
• Own UX/UI design for 3 core product areas serving 25,000+ B2B users across EU markets
• Built and maintain Figma design system with 240+ components, token library (light/dark themes), and Storybook integration
• Reduced onboarding drop-off by 38% through a complete redesign of the first-run experience (validated via Maze A/B testing, n=800)
• Ran 60+ user interview and usability test sessions; synthesised findings into product roadmap recommendations adopted by CPO
• Contributed to WCAG 2.1 AA audit: remediated 47 accessibility issues across 3 product areas
• Mentored 1 junior designer: weekly design critiques, portfolio reviews, career guidance

UX Designer — Design Studio HAM, Hamburg (September 2019 – March 2021)
• Delivered UX/UI design for 8 client projects in fintech, e-commerce, and healthcare (iOS, Android, web)
• Created high-fidelity Figma prototypes for client presentations and engineering handoff
• Conducted user research and synthesised into actionable product recommendations

EDUCATION
Bachelor of Communication Design — HTW Berlin (2016 – 2019) | GPA: 1.4/5.0 (German scale, equivalent to ~A)
Thesis: Designing for Trust in Financial Applications (published in UX Collective)

SKILLS
Design tools: Figma (advanced — components, variables, auto-layout, Figma AI), Adobe CC (Ps/Ai/Ae), Sketch, InVision, Principle, Framer
Research: Maze, UserTesting, Dovetail, Hotjar, Google Analytics
Accessibility: WCAG 2.1 AA audits, screen reader testing (NVDA, VoiceOver)
Dev adjacent: HTML/CSS (solid), basic React (can review Storybook), basic Lottie animation
PM tools: Linear, Notion, Miro, FigJam

LANGUAGES
German (native), English (fluent/C1), French (basic/A2)

AWARDS
UX Design Award 2023 — German Design Council (Enterprise Software category)
Figma Community: 3,200 followers, 15 published community files`

  const motLena = `To the Design Team,

I'm applying for the UX/UI Designer role because the product challenge you're describing — making complex B2B workflows genuinely pleasant to use — is exactly the problem I've spent the last 5 years working on.

At CloudOps I inherited a product with no design system, inconsistent components, and a Net Promoter Score of 12. Three years later we have a unified design language, a living Storybook, a NPS of 41, and a 38% reduction in onboarding drop-off. That improvement didn't come from making things prettier — it came from understanding where users were confused, running rapid experiments, and iterating quickly with the engineering team.

What I can bring to Acme Corp: a proven ability to go from "users are complaining about X" to shipped, validated solution in under 4 weeks. I work best in teams that move fast and don't separate "design" from "product thinking."

Portfolio (full case studies): lenabraun.design — I'd particularly point you to the onboarding redesign and the design system documentation case studies.

Happy to share my Figma workspace access for a live walkthrough.

Lena Braun`

  const cvJulien = `Julien Moreau
julien.moreau@email.fr | +33 6 12 34 56 78 | Lille, France (open to Ghent/remote)
linkedin.com/in/julienmoreau-data

PROFESSIONAL SUMMARY
Data Engineer with 4 years of production experience specialising in dbt, Apache Airflow, and Google BigQuery. Built and maintained ELT pipelines processing 500M+ events/month at a Paris fintech. Reduced data warehouse costs by 30% via migration from Oracle to BigQuery. Strong Python and advanced SQL skills. Bilingual French-English.

EXPERIENCE
Data Engineer — PayFlex SAS, Paris (March 2022 – present)
• Architected and maintain 12 Airflow DAGs processing 15M events/day from payment APIs, Salesforce, and Segment
• Led migration from Oracle data warehouse to BigQuery: reduced monthly cost from €18k to €12k (33% savings) and query time from avg. 8s to 1.2s
• Built 85 dbt models (staging, intermediate, mart layers) powering Looker dashboards used by 120 internal users
• Implemented data quality framework using Great Expectations + dbt tests: reduced P1 data incidents from 4/month to 0.3/month
• Onboarded 2 junior data analysts to dbt and SQL best practices

Data Analyst — Conseil & Données, Lyon (September 2020 – February 2022)
• Developed Power BI and Tableau dashboards for 15 enterprise clients (insurance, logistics, retail)
• Wrote complex PostgreSQL and Redshift queries for ad-hoc analysis and automated reports
• Built Python/pandas ETL scripts replacing 8 manual Excel processes

EDUCATION
Master of Science in Data Science — Université de Lille (2018 – 2020) | Ranked top 10% of cohort
Licence Mathématiques & Informatique — Université de Bordeaux (2015 – 2018)

TECHNICAL SKILLS
Languages: Python (expert), SQL (expert), Bash (intermediate)
Data tools: dbt Core & Cloud, Apache Airflow 2.x, Great Expectations, Pandas, NumPy, Polars
Warehouses: Google BigQuery, Amazon Redshift, PostgreSQL, Oracle (legacy)
Orchestration: Apache Airflow, Prefect (evaluated), Dagster (evaluated)
Streaming: Kafka (consumer/producer basics), Segment (CDP, event tracking)
Visualisation: Looker, Tableau, Power BI, Metabase
DevOps: Docker, Terraform (intermediate), GitHub Actions, GCP (BigQuery, Cloud Storage, Cloud Run)

LANGUAGES
French (native), English (fluent/C1), Dutch (basic/A1 — willing to take classes)`

  const motJulien = `Bonjour / Dear Hiring Team,

Je me permets de vous soumettre ma candidature pour le poste de Data Engineer — et je le fais en anglais par souci de clarté.

Your job description reads like a blueprint of what I built at PayFlex over the past two years: dbt + Airflow pipelines, BigQuery, Great Expectations data quality, Looker for BI. I have already proven I can own this stack in production, reduce costs, and improve reliability simultaneously.

What would be different at Acme Corp is the scale and the autonomy. Being the first data hire is genuinely exciting to me — I want to design the architecture, not just maintain someone else's decisions. I have strong opinions about data modelling (I prefer wide tables over complex joins for BI workloads) and I would welcome the chance to debate these with your team.

Regarding relocation to Ghent: I have Belgian family in Kortrijk and have already visited Ghent twice. I would happily relocate within 2 months.

Best regards,
Julien Moreau`

  const cvEmma = `Emma Van den Berg
emma.vdberg@gmail.com | +32 479 876 543 | Antwerp, Belgium

PROFESSIONAL SUMMARY
UX Designer with 4 years of experience in e-commerce and consumer mobile apps. Strong in conversion-focused design, A/B testing, and Figma prototyping. Built a component library for a React team. Looking to transition into B2B SaaS where I can focus more on complex workflows and less on marketing pages.

EXPERIENCE
UX Designer — ShopEasy (e-commerce startup), Antwerp (February 2022 – present)
• Redesigned the mobile checkout flow (iOS + Android): conversion rate improved from 68% to 83% (+22%)
• Created a Figma component library (110 components) enabling the React Native team to ship features 30% faster
• Ran monthly A/B tests using Optimizely; shipped 14 winning variants in 18 months
• Conducted 30+ user interviews and 15 moderated usability tests; maintained research repository in Dovetail
• Collaborated with a cross-functional team of 12 (product, engineering, growth, CS)

Junior UX Designer — Digital Agency Brussels (August 2020 – January 2022)
• Delivered UX/UI for 12 web and mobile projects for clients in healthcare, retail, and NGO sectors
• Created wireframes, prototypes, and developer handoff specs in Figma and Adobe XD
• Worked in cross-functional teams alongside developers, copywriters, and account managers

EDUCATION
Bachelor of Graphic Design — Artesis Plantijn Hogeschool, Antwerp (2017 – 2020) | Graduated with great distinction

SKILLS
Design: Figma (advanced), Adobe XD, Illustrator, Photoshop, InVision
Research: User interviews, A/B testing (Optimizely), usability testing, Dovetail, Hotjar
Prototyping: High-fidelity Figma prototypes, basic Principle animations
PM tools: Notion, Jira, Confluence, Miro

LANGUAGES
Dutch (native), English (fluent/C1), French (basic/A2)`

  const cvNicolas = `Nicolas Dubois
nicolas.dubois@gmail.com | +33 6 88 44 22 11 | Paris, France (open to Brussels/remote)
github.com/nicolasdubois-dev

PROFESSIONAL SUMMARY
Full-Stack Developer with 6 years of experience, 4 of which in TypeScript/React + Node.js production environments. Strong in API design, performance optimisation, and testing. Previously led a team of 5 developers at a Paris SaaS company. Seeking a senior position in a product-driven engineering team.

EXPERIENCE
Lead Full-Stack Developer — Rekruto SaaS, Paris (May 2020 – present)
• Technical lead for a team of 5 engineers building a recruitment automation platform (similar to your product)
• Designed microservices architecture on AWS using Node.js/NestJS + PostgreSQL + Redis
• Led migration from REST to a hybrid REST+GraphQL API — reduced mobile data transfer 55%
• Built real-time features using WebSockets (Socket.io): live candidate matching, notifications
• Introduced Playwright E2E test suite covering 90% of critical paths; reduced production incidents 70%
• Managed AWS infrastructure (ECS, RDS, ElastiCache, CloudFront) using Terraform
• Conducted technical interviews and hired 3 engineers

Full-Stack Developer — Agence Web XYZ, Lyon (June 2018 – April 2020)
• Built 10+ custom web applications in React/Node.js for SME and enterprise clients
• Developed RESTful APIs integrating with Salesforce, SAP, and HubSpot
• Established ESLint/Prettier standards and CI/CD pipeline using GitHub Actions

EDUCATION
Master of Computer Science — INSA Lyon (2013 – 2018)
Specialisation: Software Architecture & Distributed Systems

TECHNICAL SKILLS
Languages: TypeScript (expert), JavaScript (expert), Python (intermediate), SQL (expert)
Frontend: React, Next.js, Tailwind CSS, Radix UI, Tanstack Query, Playwright
Backend: Node.js, NestJS, Express, GraphQL (Apollo Server), WebSockets
Databases: PostgreSQL, Redis, MongoDB, Elasticsearch
DevOps: Docker, AWS (ECS, RDS, ElastiCache, CloudFront, Lambda), Terraform, GitHub Actions, k8s (basic)

LANGUAGES
French (native), English (fluent/C1), Spanish (intermediate/B1)`

  const motNicolas = `Dear Engineering Team at Acme Corp,

I'm applying for the Senior Full-Stack Developer position after following your product's growth for the past year. I currently work at a competing recruitment SaaS (Rekruto) — which means I understand your domain deeply and can contribute immediately with zero ramp-up time.

I have led a team of 5 engineers for the past 3 years, shipped a GraphQL migration that cut mobile data usage in half, and built the real-time matching engine that is now one of our product's core differentiators. But what I want in my next role is less management and more hands-on architecture and engineering.

I'm particularly drawn to the scale challenge at Acme Corp. 12,000 businesses is a different class of problem than where we are today, and I want to work on systems at that level.

One note: I am aware that applying from a competitor might raise eyebrows. I have no intention of sharing any proprietary information — I simply want to join a better engineering team.

Nicolas Dubois`

  const cvAnna = `Anna Kowalski
anna.kowalski@gmail.com | +48 600 123 456 | Warsaw, Poland (fully remote preferred)
linkedin.com/in/annakowalski-data

PROFESSIONAL SUMMARY
Senior Data Engineer with 5 years of experience building large-scale data platforms at a Warsaw-based e-commerce unicorn. Expert in Apache Spark, Kafka, dbt, and Databricks. Migrated a 10TB data warehouse from on-premise Hadoop to Google BigQuery, reducing costs by 45% and query latency by 80%. Strong Python and Scala skills. Seeking a new challenge in a fast-growing B2B SaaS.

EXPERIENCE
Senior Data Engineer — Allegro Group, Warsaw (September 2021 – present)
• Tech lead for the analytics data platform team (5 engineers + 3 analysts)
• Owns Kafka streaming pipelines processing 2B events/day from 30+ microservices
• Led BigQuery migration: moved 85 TB of historical data, redesigned 400+ dbt models for partitioned tables
• Implemented real-time feature store in Redis for ML model serving (latency <20ms p99)
• Built dbt + Great Expectations data quality framework: 99.7% SLA on 200 critical datasets
• Mentored 3 junior data engineers; delivered internal dbt training course to 25 analysts

Data Engineer — Edrone, Kraków (July 2019 – August 2021)
• Built ELT pipelines from 15 e-commerce platforms (Shopify, WooCommerce, Magento) using Airflow
• Designed Redshift data warehouse serving BI dashboards (Looker) for 500+ clients
• Developed Python libraries for data transformations used by the entire data team

EDUCATION
Master of Science in Computer Science — AGH University Kraków (2014 – 2019)
Specialisation: Big Data & Machine Learning | Thesis: Optimising Spark join strategies for skewed data (grade: 5.0/5.0)

TECHNICAL SKILLS
Languages: Python (expert), Scala (proficient), SQL (expert), Bash
Data: Apache Spark, Kafka, dbt Core + Cloud, Apache Airflow, Flink (basics), Databricks
Warehouses: Google BigQuery, Amazon Redshift, Snowflake, Apache Hive
ML Ops: MLflow, Feature Store (Redis/Feast), model serving
DevOps: Kubernetes, Terraform, GCP, AWS, GitHub Actions, Docker
BI: Looker (LookML), Tableau, Metabase

LANGUAGES
Polish (native), English (fluent/C2), German (basic/A2)`

  const motAnna = `Dear Hiring Team,

I'm reaching out about the Data Engineer role at Acme Corp. I found the position through a colleague who knows your CTO, and the scope of the role — building a data platform from scratch, owning the architecture — is exactly what I've been looking for.

My current role at Allegro is rewarding but the platform is mature and I spend more time maintaining than building. I want to return to a greenfield environment where technical decisions matter and my output is visible.

I bring senior-level experience with the exact stack you describe (dbt, Airflow, BigQuery, Great Expectations) plus real-time streaming experience that could open up product use cases you haven't yet considered. For example, at Allegro we built a real-time candidate ranking signal using Kafka + Redis that reduced time-to-match by 40% — something directly applicable to your core product.

I am based in Warsaw but work fully remotely and am available in CET business hours. I am open to occasional travel to Ghent for team events.

Anna Kowalski`

  const cvMartijn = `Martijn De Smedt
martijn.desmedt@outlook.com | +32 475 321 654 | Leuven, Belgium
github.com/martijn-ds

PROFESSIONAL SUMMARY
Full-Stack Developer with 5 years of experience building React/TypeScript frontend applications and Spring Boot/Node.js backends. Strong in performance optimisation, accessibility, and testing. Currently transitioning from enterprise Java to a more modern TypeScript-first stack.

EXPERIENCE
Full-Stack Developer — KBC Group (banking), Brussels (March 2021 – present)
• Frontend developer for KBC's internal HR portal (60,000 users)
• Migrated 3 legacy JSP dashboards to React/TypeScript — improved TTI from 12s to 2.8s
• Developed REST APIs in Spring Boot (Java) for HR data aggregation
• Wrote Jest + RTL unit/integration tests achieving 80% frontend coverage
• Collaborated in a team of 8 using SAFe Agile (PI planning, sprint ceremonies)
• Led accessibility audit for 4 key user journeys: remediated to WCAG 2.1 AA

Junior Developer — Cegeka, Hasselt (July 2019 – February 2021)
• Enterprise Java/Spring Boot developer for government portal projects
• Built Angular and later React components for back-office data management tools
• Integrated with government REST APIs (eHealth, CBSS, eBox)

EDUCATION
Bachelor Applied Computer Science — KU Leuven (2016 – 2019) | Graduated with distinction

TECHNICAL SKILLS
Languages: TypeScript (strong), JavaScript (expert), Java (good), SQL (good)
Frontend: React, Angular (legacy), Jest, React Testing Library, Tailwind CSS, accessibility
Backend: Node.js/Express (recent), Spring Boot (Java, 3 years), REST APIs
Databases: PostgreSQL, Oracle (legacy), MySQL
DevOps: Jenkins, GitHub Actions, Docker (basics), Azure DevOps
Enterprise: SAFe Agile, JIRA, Confluence, Azure

LANGUAGES
Dutch (native), English (fluent/C1), French (good/B2)`

  const cvFatima = `Fatima El Khatib
fatima.elkhatib@gmail.com | +32 478 654 321 | Brussels, Belgium
Portfolio: fatima-ux.be

PROFESSIONAL SUMMARY
UX/UI Designer with 4 years of experience in B2B SaaS and government digital services. Specialises in information architecture, user research, and designing for multilingual/multicultural audiences. Fluent in Arabic, French, Dutch, and English. Skilled at navigating complex stakeholder landscapes in regulated industries.

EXPERIENCE
UX Designer — Smals (government IT), Brussels (January 2023 – present)
• UX lead for Belgium's national social security portal redesign (2M+ annual users)
• Designed information architecture for a portal with 450+ content pages in 3 languages (NL/FR/DE)
• Ran 40+ user research sessions including accessibility testing with screen readers and low-vision users
• Produced design specifications in Figma; worked with 6 development teams in an SAFe Agile context
• Reduced call centre volume by 18% through a redesigned FAQ and search experience

UX/UI Designer — Adneom (IT consulting), Brussels (March 2021 – December 2022)
• Designed user interfaces for 5 B2B SaaS client projects in HR, finance, and logistics
• Created Figma prototypes and conducted usability tests; presented findings to C-level stakeholders
• Built reusable component sets in Figma for handoff to React development teams

EDUCATION
Master of Science in Human-Computer Interaction — VUB Brussels (2018 – 2020)
Bachelor Communication Sciences — ULB Brussels (2015 – 2018)

SKILLS
Design: Figma (advanced), Adobe XD, Axure RP (for complex interactions), InVision
Research: User interviews, usability testing, card sorting, tree testing (Optimal Workshop)
Accessibility: WCAG 2.1 AA/AAA, screen reader testing (NVDA, JAWS, VoiceOver), keyboard navigation
Localisation: Experience designing for multilingual (NL/FR/DE/AR) interfaces
PM: SAFe Agile, JIRA, Confluence, Miro

LANGUAGES
Arabic (native), French (native), Dutch (fluent/C1), English (fluent/C1)`

  const motFatima = `Dear Acme Corp Design Team,

I am writing to apply for the UX/UI Designer role. What makes your position interesting to me is the combination of B2B complexity and the international user base — designing for HR teams across Belgium, the Netherlands, and France is exactly the type of challenge I thrive in.

My current work at Smals involves designing government services used by 2 million people annually, across 3 official Belgian languages. That experience — navigating regulatory constraints, complex user needs, and multiple stakeholder groups — translates directly to B2B SaaS where enterprise buyers and end users often have conflicting needs.

I'm particularly experienced in accessibility and multilingual design, areas that are often afterthoughts in SaaS products but that significantly impact enterprise sales and retention. I would be happy to share my accessibility testing methodology and how I integrate it from wireframe stage rather than as a post-hoc audit.

My portfolio is at fatima-ux.be — the government portal case study is most relevant to the scale of work you are describing.

Fatima El Khatib`

  const cvLars = `Lars Nielsen
lars.nielsen@gmail.com | +45 50 123 456 | Copenhagen, Denmark (fully remote)
github.com/lars-data-eng

PROFESSIONAL SUMMARY
Principal Data Engineer with 7 years of experience architecting data platforms for scale-ups and unicorns in Copenhagen and Amsterdam. Built the data infrastructure at two companies from 0 to IPO-ready. Expert in dbt, Airflow, Snowflake, Kafka, and Spark. Strong communicator who bridges data engineering and data science.

EXPERIENCE
Principal Data Engineer — Pleo (fintech), Copenhagen (August 2022 – present)
• Technical lead for the data platform team (7 engineers)
• Designed multi-region Snowflake architecture processing 800M financial transactions/year
• Built real-time fraud detection pipeline using Kafka + Flink: reduced fraud losses 22%
• Implemented dbt project with 600+ models serving 30 dashboards and 5 ML pipelines
• Established MLOps practices using MLflow and Databricks Feature Store
• Contributed to €150M Series C fundraising deck: built all data infrastructure slides with live metrics

Senior Data Engineer — Veo Technologies, Copenhagen (January 2020 – July 2022)
• Built data platform from scratch: Airflow + dbt + BigQuery, 0 to 200M events/month in 18 months
• Designed customer data model serving churn prediction ML model (reduced churn by 15%)
• Implemented Segment CDP integration and first-party data pipeline
• Created Looker LookML model and trained 8 analysts

EDUCATION
Master of Science in Statistics and Data Science — Copenhagen Business School (2015 – 2017)
Bachelor of Mathematics — University of Copenhagen (2012 – 2015) | Top 5% of class

TECHNICAL SKILLS
Languages: Python (expert), SQL (expert), Scala (proficient), R (proficient)
Data: dbt (expert, 600+ models in prod), Apache Airflow, Kafka, Flink, Spark, Great Expectations
Warehouses: Snowflake (certified), Google BigQuery, Amazon Redshift
ML: Databricks, MLflow, Feast Feature Store, scikit-learn, XGBoost
DevOps: Kubernetes, Terraform, AWS, GCP, GitHub Actions, DataDog, Monte Carlo (data observability)
BI: Looker (LookML author), Tableau, Metabase

LANGUAGES
Danish (native), English (fluent/C2 — lived in London 2 years), German (intermediate/B2)`

  const motLars = `Hi,

I'm Lars, a Principal Data Engineer based in Copenhagen. I saw the Data Engineer role at Acme Corp and it's one of the most compelling JDs I've read this year — building a platform from scratch with real autonomy is exactly what I want to do next.

A quick snapshot of why I think I'm a strong fit:
• I've built two data platforms from zero: one at Veo (grew to 200M events/month in 18 months) and the current one at Pleo (800M financial transactions/year). I know what "from scratch" means and I know the mistakes to avoid.
• I live in dbt. I currently maintain 600+ models in production. I can talk about data modelling trade-offs for hours.
• I have experience with the full stack you describe — dbt, Airflow, BigQuery, Great Expectations — plus real-time experience with Kafka/Flink that could add value as your product grows.
• I'm a strong communicator. I've presented data architecture to investors and C-suite, not just engineers.

The only caveat: I'm fully remote from Copenhagen (CET+1). I'm open to flying to Ghent once a month.

Let's talk.
Lars`

  // ── Build candidate records ────────────────────────────────────────────────

  type CandidateInput = {
    firstName: string; lastName: string; email: string; phone?: string
    cvContent: string; motivationText?: string
    summary: string; strengths: string[]; weaknesses: string[]; skills: string[]
    experience: string; education: string
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no'
    language: string; status: string; source: string
    vacancyId: string; userId: string
  }

  const candidates: CandidateInput[] = [
    {
      firstName: 'Sophie', lastName: 'De Groote', email: 'sophie.degroote@email.com', phone: '+32 476 123 456',
      cvContent: cvSophie, motivationText: motSophie,
      summary: 'Exceptional senior developer with 7 years of hands-on full-stack experience. Covers every technical requirement: React, TypeScript, Node.js, PostgreSQL, Docker, AWS, and GraphQL. Her leadership track record (mentoring 3 devs, CI/CD overhaul) and measurable performance wins (40% bundle reduction, 60% fewer incidents) make her a standout hire.',
      strengths: ['7 years full-stack XP — exceeds 5-year requirement', 'Expert TypeScript + React + Node.js — exact stack', 'AWS + Docker + CI/CD production experience', 'Engineering leadership: mentored 3 devs, led architecture', 'Measurable impact: 40% bundle reduction, 60% fewer incidents'],
      weaknesses: ['Salary expectations may be at top of range', 'No explicit GraphQL production experience listed (uses Apollo)'],
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Next.js', 'Redis', 'NestJS', 'Playwright'],
      experience: '7 years: Senior FS Dev at TechStart Brussels (4y) — led architecture, CI/CD, mentoring. FS Dev at Deinze Digital Agency (3y) — 15+ client apps, payments, CRM integrations.',
      education: 'MSc Computer Science, KU Leuven (2017). BSc Applied Informatics, HoGent (2015).',
      recommendation: 'strong_yes', language: 'en', status: 'shortlisted', source: 'upload',
      vacancyId: v1.id, userId: recruiter.id,
    },
    {
      firstName: 'Thomas', lastName: 'Vermeersch', email: 'thomas.v@email.com', phone: '+32 499 654 321',
      cvContent: cvThomas,
      summary: 'Solid developer with 4 years of experience and good React fundamentals. Falls slightly below the 5-year requirement and TypeScript is self-described as "intermediate." No cloud or containerisation experience. Worth interviewing if senior candidates with exact experience are scarce — he shows growth trajectory.',
      strengths: ['React fundamentals solid', 'PostgreSQL + SQL experience', 'Fast learner — picked up Python independently', 'Good test culture (15% → 55% coverage)'],
      weaknesses: ['4 years experience vs. 5+ required', 'TypeScript only intermediate level', 'No Docker, AWS, or CI/CD experience', 'No team leadership or mentoring history'],
      skills: ['React', 'JavaScript', 'TypeScript', 'Python', 'FastAPI', 'PostgreSQL', 'MySQL', 'Jest'],
      experience: '4 years: FS Dev at Ghent Web Solutions (3y) — 6 React SPAs, Python APIs. Freelance junior dev (1y) — WordPress, PHP.',
      education: 'BSc Web Development, HoGent (2020).',
      recommendation: 'maybe', language: 'en', status: 'reviewing', source: 'email',
      vacancyId: v1.id, userId: recruiter.id,
    },
    {
      firstName: 'Nicolas', lastName: 'Dubois', email: 'nicolas.dubois@gmail.com', phone: '+33 6 88 44 22 11',
      cvContent: cvNicolas, motivationText: motNicolas,
      summary: 'Strong senior full-stack developer with 6 years of experience and a very relevant background — he currently leads engineering at a direct competitor (recruitment SaaS). Covers all technical requirements plus has leadership, WebSockets/real-time, and Terraform infrastructure experience. The competitor context adds domain knowledge that is immediately valuable.',
      strengths: ['6 years XP, 3 as tech lead — strong seniority', 'Recruitment SaaS domain knowledge from current role', 'WebSockets / real-time features in production', 'Terraform infrastructure-as-code experience', 'GraphQL migration delivered (55% data reduction)'],
      weaknesses: ['Competitor background requires confidentiality discussion', 'Based in Paris — relocation or remote arrangement needed', 'Salary expectations may be senior+'],
      skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'GraphQL', 'WebSockets', 'Docker', 'AWS', 'Terraform', 'Playwright'],
      experience: '6 years: Lead FS Dev at Rekruto SaaS Paris (4y) — tech lead of 5, microservices, GraphQL, WebSockets, Terraform. FS Dev at Agence Web XYZ Lyon (2y) — 10+ client apps.',
      education: 'MSc Computer Science, INSA Lyon (2018).',
      recommendation: 'strong_yes', language: 'en', status: 'shortlisted', source: 'email',
      vacancyId: v1.id, userId: recruiter.id,
    },
    {
      firstName: 'Martijn', lastName: 'De Smedt', email: 'martijn.desmedt@outlook.com', phone: '+32 475 321 654',
      cvContent: cvMartijn,
      summary: 'Belgian developer with 5 years of experience — meets the seniority bar. Strong React/TypeScript skills and excellent testing culture (80% coverage). The main concern is an enterprise Java background: he is transitioning from Spring Boot to Node.js. AWS and Docker experience is minimal. Good accessibility skills are a differentiator.',
      strengths: ['5 years XP — meets requirement', 'Strong React/TypeScript + testing rigour', 'WCAG 2.1 AA accessibility expertise', 'Belgium-based — no relocation needed', 'Large-scale enterprise experience (60k users)'],
      weaknesses: ['Node.js is recent — primarily Spring Boot Java background', 'Very limited Docker/cloud experience', 'No GraphQL or real-time experience', 'Enterprise context may not translate to startup pace'],
      skills: ['TypeScript', 'React', 'JavaScript', 'Java', 'Spring Boot', 'Node.js', 'PostgreSQL', 'Jest', 'React Testing Library', 'Azure'],
      experience: '5 years: FS Dev at KBC Group Brussels (3y) — 60k-user HR portal, React/Java. Junior Dev at Cegeka Hasselt (2y) — enterprise Java, government APIs.',
      education: 'BSc Applied Computer Science, KU Leuven (2019).',
      recommendation: 'yes', language: 'nl', status: 'reviewing', source: 'upload',
      vacancyId: v1.id, userId: recruiter.id,
    },
    {
      firstName: 'Lena', lastName: 'Braun', email: 'lena.braun@email.com', phone: '+49 176 543 210',
      cvContent: cvLena, motivationText: motLena,
      summary: 'Outstanding UX/UI designer with 5 years of experience and an exceptional B2B SaaS portfolio. Built a 240-component design system, reduced onboarding drop-off 38%, and won a prestigious design award. Deep Figma expertise, strong user research skills, and hands-on accessibility experience. Small concern: Germany-based, remote work needed.',
      strengths: ['5 years B2B SaaS UX/UI — direct domain match', '240-component Figma design system built from scratch', 'Quantified impact: 38% onboarding improvement', 'WCAG 2.1 AA accessibility expert with audit experience', 'UX Design Award 2023 — industry-validated excellence'],
      weaknesses: ['Based in Berlin — fully remote required', 'No explicit motion design experience listed'],
      skills: ['Figma', 'Adobe CC', 'Framer', 'Maze', 'UserTesting', 'Storybook', 'WCAG 2.1', 'User Research', 'Dovetail', 'HTML/CSS'],
      experience: '5 years: Senior UX/UI Designer at CloudOps Berlin (3y) — B2B SaaS, 25k users, design system, 60+ research sessions. UX Designer at Design Studio Hamburg (2y) — 8 client projects.',
      education: 'BA Communication Design, HTW Berlin (2019). GPA 1.4/5.0 (equiv. A).',
      recommendation: 'strong_yes', language: 'en', status: 'shortlisted', source: 'upload',
      vacancyId: v2.id, userId: recruiter.id,
    },
    {
      firstName: 'Emma', lastName: 'Van den Berg', email: 'emma.vdberg@gmail.com', phone: '+32 479 876 543',
      cvContent: cvEmma,
      summary: 'Good UX designer with 4 years of experience and strong conversion-optimisation mindset. Built a component library and has solid A/B testing track record. The gap is B2B SaaS experience — her background is e-commerce consumer apps. Accessibility and multilingual design experience are also limited.',
      strengths: ['Figma component library experience (110 components)', 'Data-driven: 22% checkout conversion improvement', '14 A/B test wins in 18 months', 'Belgium-based — no relocation needed'],
      weaknesses: ['E-commerce/consumer background vs. required B2B SaaS', 'No WCAG accessibility experience listed', 'No complex enterprise UX work', 'Component library smaller than expected design system scope'],
      skills: ['Figma', 'Adobe XD', 'Illustrator', 'Optimizely', 'User Research', 'A/B Testing', 'Dovetail', 'Hotjar'],
      experience: '4 years: UX Designer at ShopEasy Antwerp (2y) — mobile e-commerce, component library. Junior UX at Digital Agency Brussels (2y) — 12 mixed projects.',
      education: 'BA Graphic Design, Artesis Plantijn Antwerp (2020). Graduated with great distinction.',
      recommendation: 'maybe', language: 'nl', status: 'new', source: 'upload',
      vacancyId: v2.id, userId: recruiter.id,
    },
    {
      firstName: 'Fatima', lastName: 'El Khatib', email: 'fatima.elkhatib@gmail.com', phone: '+32 478 654 321',
      cvContent: cvFatima, motivationText: motFatima,
      summary: 'Highly skilled UX designer with a Masters in HCI and specialist expertise in accessibility (WCAG AA/AAA) and multilingual interface design. Government portal experience at scale (2M users) demonstrates complex information architecture skills. Belgian-based with excellent language diversity. The main gap is limited commercial SaaS experience vs. mostly public sector.',
      strengths: ['MSc Human-Computer Interaction — formal UX education', 'WCAG AA/AAA accessibility expert (screen readers, keyboard nav)', '4-language multilingual design experience (NL/FR/DE/AR)', 'Large-scale information architecture: 450+ page portal', '40+ user research sessions including accessibility testing'],
      weaknesses: ['Primarily public sector background — limited commercial SaaS speed', 'Less visual design portfolio vs. interaction design focus', 'No A/B testing or data-driven experimentation experience'],
      skills: ['Figma', 'Axure RP', 'Adobe XD', 'WCAG 2.1 AA/AAA', 'Screen readers', 'Optimal Workshop', 'User Research', 'SAFe Agile'],
      experience: '4 years: UX Designer at Smals Brussels (1.5y) — Belgian government portal, 2M users, 3 languages. UX/UI Designer at Adneom Brussels (1.5y) — B2B SaaS consulting, 5 projects.',
      education: 'MSc Human-Computer Interaction, VUB Brussels (2020). BA Communication Sciences, ULB Brussels (2018).',
      recommendation: 'yes', language: 'fr', status: 'reviewing', source: 'email',
      vacancyId: v2.id, userId: recruiter.id,
    },
    {
      firstName: 'Julien', lastName: 'Moreau', email: 'julien.moreau@email.fr', phone: '+33 6 12 34 56 78',
      cvContent: cvJulien, motivationText: motJulien,
      summary: 'Excellent data engineer with 4 years of production experience and direct expertise in the exact stack required: dbt, Airflow, BigQuery, Great Expectations. Delivered a 33% cost reduction and 80% query latency improvement via warehouse migration. Strong Python and SQL skills. French-based — relocation to Ghent needed.',
      strengths: ['dbt + Airflow production expert — core stack match', 'BigQuery architecture and cost optimisation (33% saving)', 'Great Expectations implementation in prod (P1 incidents: 4→0.3/month)', 'Strong SQL + Python combination', 'Looker experience — BI alignment'],
      weaknesses: ['4 years experience — at lower end of "3+" requirement', 'Based in Lille — relocation to Ghent required', 'Kafka listed as basics only', 'No real-time/streaming experience in depth'],
      skills: ['Python', 'SQL', 'dbt', 'Apache Airflow', 'BigQuery', 'Redshift', 'PostgreSQL', 'Great Expectations', 'Kafka', 'Looker', 'Tableau', 'Terraform'],
      experience: '4 years: Data Engineer at PayFlex Paris (2y) — 12 Airflow DAGs, BigQuery migration, 85 dbt models. Data Analyst at Conseil & Données Lyon (2y) — BI dashboards, ETL scripts.',
      education: 'MSc Data Science, Université de Lille (2020). Licence Maths & CS, Bordeaux (2018).',
      recommendation: 'yes', language: 'fr', status: 'reviewing', source: 'email',
      vacancyId: v3.id, userId: recruiter.id,
    },
    {
      firstName: 'Anna', lastName: 'Kowalski', email: 'anna.kowalski@gmail.com', phone: '+48 600 123 456',
      cvContent: cvAnna, motivationText: motAnna,
      summary: 'Senior data engineer with 5 years of experience at unicorn scale (Allegro, 2B events/day). Brings deep dbt, Kafka, Spark, and BigQuery expertise plus real-time ML feature store experience that directly applies to candidate matching. The strongest technical profile in the data engineering pipeline. Main concern: fully remote from Warsaw.',
      strengths: ['5 years production XP at massive scale (2B events/day)', 'dbt expert (85 TB migration, 400+ model redesign)', 'Kafka + real-time streaming production experience', 'Redis ML feature store — directly applicable to ranking features', 'Engineering leadership: tech lead for team of 5'],
      weaknesses: ['Fully remote from Warsaw (CET+1 — minimal timezone impact)', 'Senior seniority may bring higher salary expectations', 'More big-data/unicorn scale vs. startup greenfield building'],
      skills: ['Python', 'SQL', 'Scala', 'dbt', 'Apache Airflow', 'Kafka', 'Spark', 'Flink', 'BigQuery', 'Redshift', 'Snowflake', 'Great Expectations', 'Kubernetes', 'Terraform', 'Looker', 'MLflow'],
      experience: '5 years: Senior DE at Allegro Warsaw (3y) — tech lead, Kafka 2B events/day, BigQuery migration 85TB, ML feature store. DE at Edrone Kraków (2y) — Airflow + Redshift, 15 e-commerce integrations.',
      education: 'MSc Computer Science (Big Data & ML), AGH University Kraków (2019). Grade 5.0/5.0.',
      recommendation: 'strong_yes', language: 'en', status: 'shortlisted', source: 'email',
      vacancyId: v3.id, userId: recruiter.id,
    },
    {
      firstName: 'Lars', lastName: 'Nielsen', email: 'lars.nielsen@gmail.com', phone: '+45 50 123 456',
      cvContent: cvLars, motivationText: motLars,
      summary: 'Principal data engineer with 7 years of experience and two greenfield data platform builds to IPO-ready scale. Expert in dbt (600+ production models), Snowflake, Kafka + Flink, and ML Ops. The most senior profile in the pipeline. Brings financial domain experience (fraud detection) and executive communication skills. Fully remote from Copenhagen.',
      strengths: ['7 years XP including two 0-to-scale platform builds', '600+ dbt models in production — industry-leading depth', 'Kafka + Flink real-time fraud pipeline — advanced streaming XP', 'Snowflake Certified + multi-warehouse expertise', 'Investor-facing experience — bridges data and business'],
      weaknesses: ['Principal seniority likely brings top-of-band salary expectations', 'Fully remote from Copenhagen (travel to Ghent monthly)', 'Snowflake-first background vs. BigQuery required — migration context'],
      skills: ['Python', 'SQL', 'Scala', 'R', 'dbt', 'Apache Airflow', 'Kafka', 'Flink', 'Spark', 'Snowflake', 'BigQuery', 'Redshift', 'Databricks', 'MLflow', 'Kubernetes', 'Terraform', 'Looker', 'Monte Carlo'],
      experience: '7 years: Principal DE at Pleo Copenhagen (3y) — tech lead of 7, Snowflake 800M transactions/year, real-time fraud pipeline. Senior DE at Veo Copenhagen (2y) — 0-to-scale BigQuery/Airflow/dbt platform. Earlier roles in Copenhagen.',
      education: 'MSc Statistics & Data Science, Copenhagen Business School (2017). BSc Mathematics, University of Copenhagen (2015). Top 5% of class.',
      recommendation: 'strong_yes', language: 'en', status: 'shortlisted', source: 'email',
      vacancyId: v3.id, userId: recruiter.id,
    },
  ]

  // Insert candidates with hash-computed scores that match what re-analyze produces
  for (const c of candidates) {
    const vacancyTitle = c.vacancyId === v1.id ? 'Senior Full-Stack Developer' : c.vacancyId === v2.id ? 'UX/UI Designer' : 'Data Engineer'
    await prisma.candidate.create({
      data: {
        ...c,
        strengths: JSON.stringify(c.strengths),
        weaknesses: JSON.stringify(c.weaknesses),
        skills: JSON.stringify(c.skills),
        matchScore: hashScore(c.cvContent, vacancyTitle),
        analyzedAt: new Date(),
      },
    })
  }

  console.log('✅ Database seeded successfully')
  console.log('👤 Admin: admin@cvmatch.ai / admin123')
  console.log('👤 Demo Recruiter: demo@cvmatch.ai / recruiter123')
  console.log(`📋 3 vacancies, ${candidates.length} candidates (scores are hash-deterministic)`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
