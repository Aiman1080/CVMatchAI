// ─────────────────────────────────────────────────────────────────────────────
// seed-data.ts  –  10 vacancies + 60 candidates for DeltaMatch demo seed
// ─────────────────────────────────────────────────────────────────────────────

export type VacancyData = {
  title: string
  company: string
  department: string
  location: string
  type: string
  description: string
  requirements: string
  niceToHave: string
  salary: string
  status: string
  language: string
  userId: string
}

export type CandidateData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  cvContent: string
  motivationText?: string
  summary: string
  strengths: string[]
  weaknesses: string[]
  skills: string[]
  experience: string
  education: string
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no'
  language: string
  status: string
  source: string
  vacancyIndex: number
}

// ─────────────────────────────────────────────────────────────────────────────
// VACANCIES
// ─────────────────────────────────────────────────────────────────────────────

export const VACANCIES: VacancyData[] = [
  // 0 ─ Campaign Manager – Nationale Loterij (NL)
  {
    title: 'Campaign Manager',
    company: 'Nationale Loterij',
    department: 'Marketing & Communicatie',
    location: 'Brussel, België (hybride 2d/week)',
    type: 'full-time',
    description: `Als Campaign Manager bedenk en installeer je creatieve below-the-line campagnes voor onze verkooppunten (POS) om hun omzet én die van de Nationale Loterij een boost te geven.\n\nAl meer dan 90 jaar zorgt de Nationale Loterij voor veilig en verantwoord speelplezier voor alle meerderjarige Belgen. Dankzij het vertrouwen van al haar spelers boekte de Nationale Loterij in 2025 een omzet van 1,666 miljard euro. Meer dan 1 miljard daarvan ging naar winnaars. Daarnaast zorgen de vele kleine inzetten van alle spelers ervoor dat de Nationale Loterij 385 miljoen euro kan laten terugvloeien naar de Belgische samenleving.\n\nJouw verantwoordelijkheden:\n- Je realiseert BTL-reclamecampagnes voor de POS in lijn met de uitgestippelde strategie\n- Je werkt nauw samen met reclamebureaus en bewaakt kwaliteit, timing en oplevering\n- Je volgt de productie en levering van campagnemateriaal end-to-end op\n- Je coordineert activaties bij POS en Key Accounts van definitie tot implementatie\n- Je vertaalt markt- en spelerstrends naar innovatieve tools en verbeterde POS-visibiliteit`,
    requirements: `• Bachelor of Master in Marketing, Communicatie of een gerelateerd domein\n• Minimaal 3 jaar relevante ervaring in campagnebeheer, bij voorkeur in een BTL- of trade marketingomgeving\n• Sterke projectmanagementvaardigheden: je houdt timings, budgetten en kwaliteit tegelijk in de gaten\n• Ervaring met samenwerking met externe reclamebureaus en drukkerijen\n• Analytisch vermogen: je leest markttrends en vertaalt ze naar concrete acties\n• Vloeiend Nederlands; goede kennis van het Frans is een pluspunt\n• Hands-on mentaliteit gecombineerd met strategisch inzicht`,
    niceToHave: `Ervaring in de loterij-, retail- of FMCG-sector; kennis van retail activatietechnieken; ervaring met POS-materiaalproductie; basiskennis van Adobe Creative Suite; affiniteit met data-gedreven marketing`,
    salary: '€48.000 – €62.000 bruto/jaar + maaltijdcheques + hospitalisatieverzekering + bedrijfswagen',
    status: 'active',
    language: 'nl',
    userId: 'RECRUITER_ID',
  },

  // 1 ─ Product Manager – Belgian fintech startup (EN)
  {
    title: 'Product Manager',
    company: 'Credix Financial Technologies',
    department: 'Product',
    location: 'Antwerp, Belgium (hybrid 3d/week)',
    type: 'full-time',
    description: `Credix is a fast-growing Belgian fintech building embedded lending infrastructure for European SMEs. We process over €200M in loan originations annually and are expanding into three new markets in 2026. We are looking for a Product Manager to own our core lending workflow product — from underwriting UX through merchant-facing dashboards.

What you will own:
• End-to-end product ownership of the merchant lending flow: application, underwriting, approval, repayment, and dashboard
• Define and prioritise the product roadmap in close collaboration with the CEO, CTO, and commercial team
• Run structured discovery: user interviews, competitor analysis, data analysis (Mixpanel/Amplitude)
• Write detailed PRDs and acceptance criteria; own the backlog in Linear
• Work closely with a squad of 4 engineers and 1 designer in two-week sprints
• Define and track product KPIs: conversion funnels, activation rates, NPS, retention
• Represent the product externally: demos for key merchant prospects and investor updates

We ship every two weeks. You will have direct access to the CEO and full autonomy over product decisions within your domain.`,
    requirements: `• 4+ years of product management experience at a B2B SaaS or fintech company\n• Demonstrated track record of owning a product area from discovery to shipped features with measurable outcomes\n• Strong data literacy: comfortable running SQL queries, reading dashboards, and making decisions from data\n• Experience with Agile/Scrum: backlog management, sprint planning, stakeholder communication\n• Excellent written and verbal communication in English\n• Understanding of financial products, lending workflows, or payments is a strong plus\n• Ability to work independently in a fast-moving startup environment`,
    niceToHave: `Experience with embedded finance or open banking APIs; knowledge of Belgian/EU financial regulation (PSD2, AML); Mixpanel or Amplitude analytics; Linear or Notion workflow; basic SQL for data queries; previous startup experience (Series A/B environment)`,
    salary: '€65.000 – €85.000 gross/year + equity (0.1–0.3%) + full benefits package',
    status: 'active',
    language: 'en',
    userId: 'RECRUITER_ID',
  },

  // 2 ─ Data Scientist – Proximus (NL)
  {
    title: 'Data Scientist – Klantinzichten & Churnpreventie',
    company: 'Proximus',
    department: 'Data & AI Centre of Excellence',
    location: 'Brussel, België (hybride)',
    type: 'full-time',
    description: `Als Data Scientist binnen het Data & AI Centre of Excellence van Proximus werk je aan modellen die rechtstreeks impact hebben op onze 5,4 miljoen klanten. Je focust op klantgedragsanalyse, churnpreventie en next-best-offer modellen die door onze commerciële teams en digitale kanalen worden ingezet.

Jouw taken:
• Je ontwikkelt, traint en valideert machine-learning modellen (churn, CLV, upsell-propensiteit) op grote klantendata sets
• Je werkt samen met business stakeholders om problemen te vertalen naar data science projecten met meetbare ROI
• Je analyseert klantreizen via telecom-, netwerk- en gebruiksdata en identificeert patronen en kansen
• Je bouwt en onderhoudt feature pipelines in Python/Spark op ons Azure-gebaseerd data platform
• Je presenteert bevindingen en modelresultaten aan niet-technische publieke (marketing, sales, C-level)
• Je draagt bij aan MLOps-practices: model monitoring, retraining pipelines, A/B testing van modellen
• Je begeleidt junior data scientists en neemt deel aan interne kennisdelingssessies`,
    requirements: `• Master of PhD in Informatica, Statistiek, Wiskunde, Ingenieurswetenschappen of een aanverwant domein\n• Minimaal 3 jaar hands-on data science ervaring in een productieomgeving (niet alleen academisch)\n• Expert Python: pandas, scikit-learn, XGBoost/LightGBM, Optuna, MLflow\n• Sterke SQL-vaardigheden en ervaring met grote datasets (100M+ rijen)\n• Ervaring met cloud ML platforms (Azure ML, AWS SageMaker of GCP Vertex AI)\n• Kennis van A/B testing methodologie en causal inference\n• Communicatief sterk: je kunt complexe modellen uitleggen aan niet-technische stakeholders\n• Vloeiend Nederlands of Frans; goede kennis van het Engels is vereist`,
    niceToHave: `Ervaring in telecom of een andere industrie met grote klantenbestanden; kennis van survival analyse voor churnmodellering; Spark/PySpark voor grote datasets; kennis van CausalML of uplift modelling; ervaring met real-time feature stores; publicaties of bijdragen aan open-source ML projecten`,
    salary: '€58.000 – €78.000 bruto/jaar + jaarlijkse bonus + uitgebreid voordelenpakket',
    status: 'active',
    language: 'nl',
    userId: 'RECRUITER_ID',
  },

  // 3 ─ Financial Controller – UCB (EN)
  {
    title: 'Financial Controller – R&D Operations',
    company: 'UCB',
    department: 'Finance – R&D & Operations',
    location: 'Brussels, Belgium (on-site / hybrid)',
    type: 'full-time',
    description: `UCB is a global biopharmaceutical company headquartered in Brussels, focused on neurology and immunology. We are looking for a Financial Controller to support our R&D and Operations divisions, partnering directly with senior scientists, programme directors, and the CFO office.

Your responsibilities:
• Serve as the primary finance business partner for 3 R&D therapeutic area heads and Operations leadership
• Own the monthly close process for R&D and Operations: accruals, provisions, variance analysis, and management reporting
• Build and maintain the annual budget (€180M+ R&D spend) and quarterly forecast models in SAP and Anaplan
• Prepare and present financial performance reports to the R&D leadership team and Group Finance
• Lead process improvement projects to reduce close cycle time and improve forecast accuracy
• Ensure compliance with IFRS accounting standards and UCB's internal control framework
• Support programme investment decisions with ad-hoc financial modelling and scenario analysis
• Coordinate with external auditors during half-year and year-end audit processes`,
    requirements: `• Master's degree in Finance, Accounting, or Business Administration\n• 5+ years of financial controlling or FP&A experience, preferably in pharma, biotech, or a regulated multinational\n• CPA, ACCA, or equivalent professional qualification is a strong asset\n• Expert-level Excel and financial modelling skills; advanced SAP experience (CO/FI modules)\n• Anaplan or equivalent planning tool experience\n• Strong IFRS knowledge, particularly around R&D cost capitalisation and provisions\n• Excellent communication skills in English; French or Dutch is a plus\n• Ability to influence senior stakeholders without direct authority`,
    niceToHave: `Experience with pharmaceutical R&D finance (clinical trial accruals, milestone payments); Power BI or Tableau for management reporting; project accounting (CAPEX vs OPEX distinction in R&D); experience with Big 4 audit (external or internal)`,
    salary: '€75.000 – €95.000 gross/year + annual bonus (10–20%) + UCB benefits (pension, health, company car)',
    status: 'active',
    language: 'en',
    userId: 'RECRUITER_ID',
  },

  // 4 ─ Digital Marketing Manager – Colruyt Group (NL)
  {
    title: 'Digital Marketing Manager – E-commerce & Loyaliteit',
    company: 'Colruyt Group',
    department: 'Marketing – Colruyt Laagste Prijzen',
    location: 'Halle, België (hybride 3d/week)',
    type: 'full-time',
    description: `Als Digital Marketing Manager bij Colruyt Group stuur je de digitale marketingstrategie voor de Colruyt-keten aan — van SEA en display tot e-mailmarketing, loyaliteitsprogramma en app-activaties. Je werkt in een team van 8 marketingspecialisten en rapporteert aan de Head of Digital Marketing.

Jouw verantwoordelijkheden:
• Je definieert en implementeert de digitale marketingstrategie voor Colruyt Laagste Prijzen over alle digitale kanalen heen (SEA, SEO, display, sociale media, e-mail, push)
• Je beheert een jaarlijks digitaal mediabudget van €4M+ en optimaliseert continu op ROI
• Je stuurt campagneprestaties bij op basis van data: CTR, ROAS, CLV, retentie en app-activatie
• Je werkt nauw samen met het CRM-team om het Xtra-loyaliteitsprogramma te activeren via gepersonaliseerde digitale touchpoints
• Je coördineert externe mediapartners (Google, Meta, DPG Media) en interne creatieve teams
• Je volgt digitale trends op en vertaalt deze naar concrete experimenten en A/B-tests
• Je rapporteert maandelijks aan het management over digitale KPI's en ROI`,
    requirements: `• Master in Marketing, Communicatie, Bedrijfskunde of een gerelateerd domein\n• Minimaal 5 jaar ervaring in digitale marketing, waarvan minstens 2 jaar in een leidinggevende of senior rol\n• Bewezen track record in het beheren van grote digitale mediabudgetten (€1M+) met aantoonbare ROI\n• Diepgaande kennis van Google Ads, Meta Ads, e-mailmarketing (Salesforce Marketing Cloud of gelijkaardig) en SEO\n• Sterke data-analyse vaardigheden: Google Analytics 4, Looker of PowerBI\n• Ervaring met A/B-testen en gestructureerde campagne-optimalisatie\n• Vloeiend Nederlands; kennis van het Frans is een pluspunt\n• Hands-on én strategisch: je kunt zelf campagnes bouwen én een team inspireren`,
    niceToHave: `Ervaring in retail of FMCG; kennis van loyaliteitsprogramma's en CRM-integraties; app-marketingervaring (push notifications, in-app campagnes); kennis van cookieless targeting en first-party data strategieën; ervaring met Salesforce of Adobe Experience Cloud`,
    salary: '€60.000 – €80.000 bruto/jaar + variabele bonus + bedrijfswagen + Colruyt-voordelen',
    status: 'active',
    language: 'nl',
    userId: 'RECRUITER_ID',
  },

  // 5 ─ DevOps/Platform Engineer – BNP Paribas Fortis (EN)
  {
    title: 'Senior DevOps / Platform Engineer',
    company: 'BNP Paribas Fortis',
    department: 'Group IT – Cloud Platform Engineering',
    location: 'Brussels, Belgium (hybrid 3d/week)',
    type: 'full-time',
    description: `BNP Paribas Fortis is Belgium's largest bank, serving over 3 million customers. Our Cloud Platform Engineering team is responsible for the internal developer platform that 1,200+ engineers use daily to build, test, and deploy banking applications. We are growing the team and looking for a Senior DevOps / Platform Engineer who will help us evolve our Kubernetes-based platform and improve developer experience across the group.

Your responsibilities:
• Design, build, and operate internal developer platform components: CI/CD pipelines, Kubernetes clusters, service mesh, secrets management, and observability stack
• Own and improve the GitOps workflow (ArgoCD) used by 60+ engineering squads
• Maintain and evolve Terraform modules used to provision infrastructure on AWS and Azure
• Improve platform reliability and SLOs: currently targeting 99.95% availability across critical shared services
• Build self-service capabilities so product teams can deploy autonomously without platform team intervention
• Drive security-by-default practices: container scanning, SAST/DAST integration, secrets rotation
• Mentor mid-level engineers (2–3 reports) and represent the platform team in architecture forums
• Work within a regulated banking context: change management processes, audit trails, compliance requirements`,
    requirements: `• 6+ years of DevOps/platform/infrastructure engineering experience in production environments\n• Expert Kubernetes: cluster administration, networking (CNI), RBAC, Helm, custom operators\n• Terraform at advanced level: modules, state management, workspace strategies, provider development\n• CI/CD pipeline expertise: Jenkins, GitLab CI, or GitHub Actions in enterprise environments\n• ArgoCD or Flux GitOps experience\n• AWS or Azure (or both) at associate/professional certification level\n• Security tooling: Vault (HashiCorp), Trivy/Snyk, SAST integration in pipelines\n• Strong scripting: Python or Go for platform tooling\n• English fluency required; French or Dutch is a plus`,
    niceToHave: `Go programming for operator/controller development; service mesh (Istio or Linkerd); platform engineering frameworks (Backstage); FinOps experience; EBIOS or ISO 27001 familiarity for banking compliance; experience at another financial institution`,
    salary: '€80.000 – €105.000 gross/year + banking bonus + comprehensive benefits (pension, health, mobility budget)',
    status: 'active',
    language: 'en',
    userId: 'RECRUITER_ID',
  },

  // 6 ─ HR Business Partner – Delhaize Belgium (FR)
  {
    title: 'HR Business Partner – Retail Operations',
    company: 'Delhaize Belgique',
    department: 'Ressources Humaines',
    location: 'Forest, Bruxelles (hybride)',
    type: 'full-time',
    description: `Delhaize Belgique est l'un des plus grands employeurs de Belgique, avec plus de 9 000 collaborateurs répartis dans 800 supermarchés. En tant que HR Business Partner pour la région Bruxelles-Wallonie, vous êtes le partenaire stratégique des directeurs de magasin et des responsables régionaux pour tous les sujets RH.

Vos responsabilités :
• Accompagner et conseiller une population de 35 directeurs de magasin et 2 directeurs régionaux sur les sujets RH du quotidien (gestion de la performance, relations sociales, développement des talents)
• Piloter les processus RH annuels dans votre périmètre : évaluation des performances, révisions salariales, plans de succession et cartographie des talents
• Gérer les cas disciplinaires et les procédures de licenciement en collaboration avec le département juridique
• Assurer la liaison avec les représentants syndicaux (CNE, CSC, FGTB) dans le cadre des concertations sociales locales
• Déployer les projets RH transverses du groupe (transformation digitale RH, nouveau SIRH, programme bien-être)
• Analyser les indicateurs RH de votre région (absentéisme, turnover, headcount) et proposer des plans d'action\n• Recruter les profils de cadres dans votre périmètre en partenariat avec le Centre d'Expertise Talent Acquisition`,
    requirements: `• Master en GRH, Psychologie du travail, Droit social ou Gestion d'entreprise\n• Minimum 5 ans d'expérience en tant que HRBP, de préférence dans un environnement retail ou multi-sites\n• Excellente maîtrise du droit social belge (CCT, licenciements, temps de travail dans le secteur du commerce)\n• Expérience dans la gestion des relations syndicales en Belgique\n• Solides compétences en communication et en influence : vous savez convaincre sans autorité hiérarchique\n• Maîtrise parfaite du français ; bonne connaissance du néerlandais (environnement bilingue)\n• Disponibilité pour des déplacements réguliers dans les magasins de la région (permis B)`,
    niceToHave: `Expérience avec SAP SuccessFactors ou Workday ; connaissance du secteur alimentaire et de ses contraintes spécifiques (horaires décalés, travail du dimanche) ; certification en coaching ou médiation ; expérience dans la conduite du changement à grande échelle`,
    salary: '€55.000 – €72.000 brut/an + voiture de société + avantages groupe (assurance, chèques-repas, réduction collaborateur)',
    status: 'active',
    language: 'fr',
    userId: 'RECRUITER_ID',
  },

  // 7 ─ Customer Success Manager – B2B SaaS Brussels (EN)
  {
    title: 'Customer Success Manager – Enterprise',
    company: 'Teamleader (Visma)',
    department: 'Customer Success',
    location: 'Ghent / Brussels, Belgium (hybrid)',
    type: 'full-time',
    description: `Teamleader, part of the Visma Group, is a leading Belgian B2B SaaS company providing CRM, invoicing, and project management software to 15,000+ SMEs and mid-market companies across Europe. We are looking for a Customer Success Manager to own a portfolio of our largest Enterprise accounts (€50K–€200K ARR) and drive expansion, retention, and advocacy.

Your responsibilities:
• Own and manage a portfolio of 40–60 Enterprise accounts totalling €4M+ ARR
• Build deep relationships with economic buyers, champions, and end-users across your accounts
• Drive successful onboarding for new enterprise customers: project plan, data migration, training, and go-live
• Run regular business reviews (monthly for strategic accounts, quarterly for standard) aligned to customer ROI
• Identify expansion opportunities (additional seats, modules, integrations) and collaborate with Account Executives to close upsells
• Own Net Revenue Retention (NRR) for your portfolio: target >115%
• Forecast churn risk early and execute proactive intervention plans
• Represent customer voice internally: channel structured feedback to Product and Engineering`,
    requirements: `• 3+ years of B2B SaaS Customer Success experience managing Enterprise or mid-market accounts\n• Demonstrated track record of achieving NRR >110% on a named account portfolio\n• Strong commercial acumen: ability to identify expansion opportunities and drive revenue conversations\n• Excellent relationship-building skills: you build trust with economic buyers, not just end-users\n• Data-driven: comfortable using Gainsight, Salesforce, or similar tools to manage health scores and forecast\n• Project management skills for complex enterprise onboardings\n• English fluency required; Dutch or French is a strong plus\n• Willingness to travel occasionally to customer sites in Belgium and the Netherlands`,
    niceToHave: `Experience with CRM or ERP product category; Gainsight administration experience; knowledge of SME/mid-market business processes (invoicing, project management); German language skills for DACH expansion; experience at a company that went through a PE/acquisition`,
    salary: '€50.000 – €68.000 gross/year + variable (OTE 15–25%) + Visma benefits',
    status: 'active',
    language: 'en',
    userId: 'RECRUITER_ID',
  },

  // 8 ─ Business Development Manager – Belgian scale-up (FR)
  {
    title: 'Business Development Manager – Grands Comptes',
    company: 'Silverfin',
    department: 'Ventes & Développement Commercial',
    location: 'Gand / Bruxelles, Belgique (hybride)',
    type: 'full-time',
    description: `Silverfin est une scale-up belge en forte croissance qui révolutionne la comptabilité pour les cabinets d'expertise comptable en Europe. Notre plateforme cloud est utilisée par plus de 1 200 cabinets comptables dans 15 pays. Nous recrutons un Business Development Manager Grands Comptes pour développer notre portefeuille en France et en Belgique francophone.

Vos responsabilités :
• Identifier, prospecter et convertir des grands cabinets comptables (100+ collaborateurs) en France et en Belgique francophone
• Gérer un pipeline complet de A à Z : qualification, découverte, démo produit, proposition commerciale, négociation et closing
• Atteindre et dépasser un quota annuel de nouveau ARR de €600K+
• Construire et entretenir des relations durables avec les associés, directeurs et partners des cabinets cibles
• Collaborer étroitement avec le marketing pour les campagnes de génération de leads et les événements sectoriels (SIC, Congrès OEC)
• Nourrir votre pipeline via les réseaux professionnels (LinkedIn, associations comptables, recommandations)
• Participer aux salons et conférences du secteur comptable en France et en Belgique\n• Remonter les insights marché au Product Management pour alimenter la roadmap`,
    requirements: `• Minimum 4 ans d'expérience en vente B2B complexe (cycle long, multi-interlocuteurs), idéalement en SaaS ou fintech\n• Expérience prouvée dans la vente aux cabinets comptables, cabinets d'audit ou ESN est un fort avantage\n• Maîtrise parfaite du français (niveau natif ou bilingue) ; le néerlandais est un atout\n• Track record démontrable : atteinte ou dépassement de quota sur au moins 3 exercices consécutifs\n• À l'aise avec les cycles de vente de 3 à 9 mois et la gestion de multiples parties prenantes\n• Connaissance des processus comptables et de l'écosystème logiciel de l'expertise comptable\n• Autonome, résilient et orienté résultat dans un environnement scale-up`,
    niceToHave: `Réseau établi dans le milieu de l'expertise comptable française ou belge ; expérience avec Salesforce CRM ; connaissance des enjeux de transformation digitale des cabinets (dématérialisation, IA, facturation électronique) ; expérience en SaaS vertical (industrie spécifique)`,
    salary: '€55.000 – €70.000 brut fixe + variable déplafonné (OTE €100K+) + voiture de fonction',
    status: 'active',
    language: 'fr',
    userId: 'RECRUITER_ID',
  },

  // 9 ─ Software Architect – SNCB/Infrabel digital (EN)
  {
    title: 'Software Architect – Digital Rail Platform',
    company: 'Infrabel',
    department: 'Digital & IT – Platform Architecture',
    location: 'Brussels, Belgium (hybrid)',
    type: 'full-time',
    description: `Infrabel manages Belgium's 3,600 km railway network and is undergoing a major digital transformation: real-time train tracking, predictive maintenance, capacity planning algorithms, and passenger information systems all depend on the software platform you will help architect.

We are looking for a Software Architect to provide technical leadership across our portfolio of 15+ critical digital systems, working alongside domain architects, engineering squads, and the CTO office.

Your responsibilities:
• Define and govern the target architecture for Infrabel's digital rail platform — APIs, event-driven integration layer, data flows, and domain service boundaries
• Lead architecture reviews for new projects and major system changes; produce Architecture Decision Records (ADRs)
• Drive the migration from legacy monolithic systems (COBOL, Oracle Forms) to modern microservices and event-driven architecture
• Define API standards, integration patterns, and data exchange contracts across 15+ systems (real-time train data, asset management, capacity planning)
• Work with cloud engineers to design the Azure-based infrastructure strategy and migration plan
• Evaluate build-vs-buy decisions for critical platform components
• Mentor senior engineers (10+ in your sphere of influence) and run architecture guild sessions
• Engage with external vendors, EU railway standardisation bodies (TAF-TSI, TAP-TSI), and Belgian regulatory authorities`,
    requirements: `• 10+ years of software engineering experience, including 3+ years in an explicit architecture role\n• Deep expertise in distributed systems: microservices, event-driven architecture (Kafka or Azure Service Bus), API gateway patterns\n• Strong cloud architecture skills on Azure: AKS, Service Bus, API Management, Azure Data Factory\n• Experience with legacy modernisation: strangler fig pattern, anti-corruption layers, incremental migration\n• Knowledge of enterprise integration patterns and domain-driven design (DDD)\n• Experience producing formal architecture artefacts: ADRs, C4 diagrams, sequence diagrams\n• Comfortable with regulated/safety-critical IT environments (change management, audit trails)\n• English fluency; French or Dutch is a strong asset\n• Ability to communicate complex technical concepts to non-technical stakeholders`,
    niceToHave: `Railway or transport industry experience (ETCS, ERTMS standards); knowledge of TAF-TSI/TAP-TSI data exchange standards; real-time systems and low-latency event processing; TOGAF or ArchiMate certification; experience with GIS/mapping systems; digital twin concepts`,
    salary: '€95.000 – €120.000 gross/year + public sector pension plan + comprehensive benefits',
    status: 'active',
    language: 'en',
    userId: 'RECRUITER_ID',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATES  (6 per vacancy, vacancyIndex 0–9)
// ─────────────────────────────────────────────────────────────────────────────

export const CANDIDATES: CandidateData[] = [
  // ── Vacancy 0: Campaign Manager – Nationale Loterij ────────────────────────

  {
    firstName: 'Axelle',
    lastName: 'Dupont',
    email: 'axelle.dupont@gmail.com',
    phone: '+32 477 112 233',
    cvContent: `AXELLE DUPONT
axelle.dupont@gmail.com | +32 477 112 233 | Bruxelles, Belgique | linkedin.com/in/axelledupont

PROFIL PROFESSIONNEL
Campaign Manager BTL & Trade Marketing avec 6 ans d'expérience dans la grande distribution et les FMCG. Spécialiste de l'activation en points de vente, du pilotage d'agences créatives et de la gestion de campagnes multicanales. Expérience directe dans la gestion de budgets campagnes >€1M et la coordination de productions POS à l'échelle nationale.

EXPÉRIENCE PROFESSIONNELLE

Campaign Manager BTL — Delhaize Belgique, Bruxelles (mars 2021 – présent)
• Conception et déploiement de 12 campagnes BTL annuelles pour 800 points de vente (PLV, stop-rayons, têtes de gondole, vitrophanies)
• Gestion d'un budget campagne annuel de €1,4M ; négociation avec imprimeurs et agences créatives
• Coordination de l'agence Publicis pour la production de matériel POS : briefings créatifs, suivi de production, validation BAT
• Déploiement de campagnes promotionnelles saisonnières (Noël, Pâques, rentrée) avec timing de livraison J-3 semaines
• Analyse des performances POS via données sell-out Nielsen et reporting mensuel à la direction marketing
• Réduction des délais de livraison de matériel de 5 semaines à 3,5 semaines grâce à une refonte du processus de validation
• Activation de 18 Key Accounts (Cora, Carrefour, Okay) : animation promotionnelle, matériel exclusif, events en magasin

Trade Marketing Coordinator — Coca-Cola Europacific Partners, Bruxelles (septembre 2019 – février 2021)
• Développement d'outils de trade marketing pour la force de vente (catalogues promotionnels, matériel POS, kit d'activation)
• Coordination avec l'équipe européenne pour adapter les campagnes globales au marché belge
• Gestion de 6 agences fournisseurs (créatif, imprimerie, logistique POS)
• Support aux équipes terrain lors de l'implémentation des activations en GMS

Junior Marketing Assistant — Nestlé Belgique, Bruxelles (septembre 2018 – août 2019)
• Assistance à la préparation des plans marketing annuels pour les marques Nescafé et KitKat
• Coordination administrative des productions publicitaires et du matériel POS
• Reporting des ventes et analyse de la performance promotionnelle

FORMATION
Master en Marketing — Solvay Brussels School of Economics & Management, ULB (2016 – 2018)
Mémoire : L'efficacité des promotions en GMS : analyse comparative PLV vs activation digitale (mention très bien)
Bachelor en Communication — IHECS Bruxelles (2013 – 2016) | Grande distinction

COMPÉTENCES
Campagnes BTL : conception, briefing créatif, suivi production, validation, déploiement POS
Gestion de projets : MS Project, Asana, coordination multi-agences
Data & analyse : Nielsen, IRI, Excel avancé (TCD, macros), PowerPoint
Logiciels créatifs : Adobe Acrobat (révision PDF), notions Photoshop
Langues : Français (natif), Néerlandais (B2 — cours en cours), Anglais (C1)

CERTIFICATIONS
Google Analytics Individual Qualification (2023)
Formation Trade Marketing — Institut du Marketing (2022)`,
    motivationText: `Madame, Monsieur,

Je vous adresse ma candidature pour le poste de Campaign Manager à la Nationale Loterij. Après 6 ans passés à concevoir et déployer des campagnes BTL pour Delhaize et Coca-Cola, je suis convaincue que mon profil correspond précisément à ce que vous recherchez.

Ce qui me motive particulièrement chez la Nationale Loterij, c'est la dimension à la fois créative et opérationnelle du rôle. Concevoir des campagnes qui stimulent les ventes en point de vente tout en respectant des impératifs de jeu responsable est un défi que je trouve profondément stimulant. J'ai une vraie sensibilité pour la mécanique promotionnelle en GMS et je sais naviguer entre l'ambition créative des agences et les contraintes logistiques du terrain.

Chez Delhaize, j'ai réduit les délais de livraison du matériel POS de 5 à 3,5 semaines en restructurant le processus de validation créative — un exemple concret de la façon dont j'aborde mes responsabilités : avec rigueur et un regard toujours tourné vers l'amélioration continue.

Je serais ravie de vous rencontrer pour vous présenter mes réalisations en détail.

Cordialement,
Axelle Dupont`,
    summary: `Campaign Manager BTL expérimentée avec 6 ans chez Delhaize et Coca-Cola. Maîtrise complète du cycle POS (briefing → production → déploiement) et gestion de budgets €1,4M. Profil très aligné avec les responsabilités de la Nationale Loterij.`,
    strengths: ['6 ans d\'expérience BTL/trade marketing — profil senior', 'Gestion de campagnes POS à grande échelle (800 PDV)', 'Expérience multi-agences (Publicis, imprimeurs, logistique)', 'Réduction mesurable des délais de production', 'Connaissance GMS et activation Key Accounts'],
    weaknesses: ['Pas d\'expérience spécifique dans le secteur loterie/gambling', 'Niveau néerlandais encore en cours (B2) — contexte bilingue NL'],
    skills: ['BTL campaigns', 'POS activation', 'Trade marketing', 'Budget management', 'Agency coordination', 'Nielsen analytics', 'MS Project', 'Asana', 'Adobe Acrobat'],
    experience: '6 ans: Campaign Manager BTL chez Delhaize Belgique (4 ans) — 12 campagnes/an, €1,4M budget, 800 PDV. Trade Marketing Coordinator chez CCEP (1,5 an). Junior Marketing chez Nestlé (1 an).',
    education: 'Master Marketing, Solvay Brussels School (ULB), 2018. Bachelor Communication, IHECS Bruxelles, 2016.',
    recommendation: 'strong_yes',
    language: 'fr',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 0,
  },

  {
    firstName: 'Pieter',
    lastName: 'Van Acker',
    email: 'pieter.vanacker@hotmail.com',
    phone: '+32 494 334 455',
    cvContent: `PIETER VAN ACKER
pieter.vanacker@hotmail.com | +32 494 334 455 | Gent, België

PROFESSIONELE SAMENVATTING
Marketing Professional met 4 jaar ervaring in campagnebeheer voor retail en FMCG. Sterk in projectcoördinatie, leveranciersbeheer en het opvolgen van POS-materiaal. Zoek naar een nieuwe uitdaging bij een groot Belgisch bedrijf waar ik mijn BTL-expertise verder kan uitbouwen.

WERKERVARING

Marketing Coordinator — Colruyt Group, Halle (januari 2022 – heden)
• Coördineer de productie van wekelijkse reclamefolders en POS-materiaal voor 250 Colruyt-winkels
• Beheer relaties met 4 drukkerijen en 2 creatieve bureaus
• Volg deadlines op en communiceer proactief over vertragingen aan interne stakeholders
• Ondersteun campagnemanagers bij de planning van seizoenscampagnes (zomer, kerst, solden)
• Basisanalyse van campagneprestaties via interne rapporteringstool

Junior Campaign Executive — Gamma België, Mechelen (augustus 2020 – december 2021)
• Assistentie bij de coördinatie van BTL-campagnes voor 60 bouwmarkten
• Opvolging van leveringen van POS-materiaal (displays, banners, vloerstickers)
• Ondersteuning van de Trade Marketing Manager bij activaties in flagship stores

OPLEIDING
Bachelor Communicatiemanagement — Hogeschool Gent (2017 – 2020) | Onderscheiding
Stage: Marketing Assistant bij Carrefour Belgium (3 maanden, 2020)

VAARDIGHEDEN
Campagnebeheer: coördinatie, opvolging, leveranciersbeheer
Tools: MS Office (Excel, PowerPoint), Trello, Basecamp
Creatief: basiskennis Adobe Acrobat
Talen: Nederlands (moedertaal), Frans (B1), Engels (B2)`,
    motivationText: `Geachte,

Ik solliciteer graag naar de functie van Campaign Manager bij de Nationale Loterij. Na 4 jaar in campagnecoördinatie bij Colruyt Group en Gamma voel ik me klaar voor een stap naar meer verantwoordelijkheid als Campaign Manager.

Wat me aanspreekt bij de Nationale Loterij is de combinatie van creatief campagnewerk en de maatschappelijke missie van het bedrijf. Het idee om campagnes te bedenken die de omzet van verkooppunten stimuleren én de zichtbaarheid van Nationale Loterij-producten versterken, spreekt me enorm aan.

Ik ben gemotiveerd, erg georganiseerd en gewend om meerdere projecten tegelijk op te volgen. Ik kijk ernaar uit mijn profiel verder toe te lichten in een gesprek.

Met vriendelijke groet,
Pieter Van Acker`,
    summary: `Georganiseerde marketingcoördinator met 4 jaar ervaring in POS-coördinatie bij Colruyt en Gamma. Solide basis in projectopvolging en leveranciersbeheer, maar mist de senior BTL-expertise en budgetbeheer op het gevraagde niveau.`,
    strengths: ['Goede coördinatieskills — gewend aan meerdere projecten', 'Directe Colruyt-ervaring (vergelijkbaar retailprofiel)', 'Proactieve communicatie', 'Belg — geen verhuizing nodig'],
    weaknesses: ['4 jaar ervaring — junior profiel voor een Manager rol', 'Geen eigenstandig campagneontwerp of bureausturing', 'Geen budgetbeheer op betekenisvolle schaal', 'Beperkt Frans (B1) in tweetalige context'],
    skills: ['Campaign coordination', 'POS material', 'Vendor management', 'MS Office', 'Trello', 'Basecamp'],
    experience: '4 jaar: Marketing Coordinator bij Colruyt Group (2 jaar). Junior Campaign Executive bij Gamma België (1,5 jaar). Stage bij Carrefour Belgium (3 maanden).',
    education: 'Bachelor Communicatiemanagement, Hogeschool Gent, 2020.',
    recommendation: 'maybe',
    language: 'nl',
    status: 'reviewing',
    source: 'upload',
    vacancyIndex: 0,
  },

  {
    firstName: 'Charlotte',
    lastName: 'Lecomte',
    email: 'charlotte.lecomte@outlook.be',
    phone: '+32 471 556 677',
    cvContent: `CHARLOTTE LECOMTE
charlotte.lecomte@outlook.be | +32 471 556 677 | Liège, Belgique
linkedin.com/in/charlottelecomte-mktg

PROFIL
Campaign Manager avec 7 ans d'expérience dans les secteurs du retail, du jeu et du divertissement. Spécialiste des campagnes below-the-line et de l'activation en réseau de distribution. Ancienne expérience chez Unibet Belgium — connaissance directe des contraintes réglementaires du secteur des jeux de hasard en Belgique.

EXPÉRIENCE

Senior Campaign Manager — Kinepolis Group, Bruxelles (avril 2020 – présent)
• Pilotage de 20 campagnes BTL annuelles pour 18 cinémas belges : PLV, affichage in-cinema, activations partenaires
• Gestion d'un budget campagne de €900K/an
• Coordination de 3 agences créatives et 2 fournisseurs d'impression grand format
• Développement et déploiement du kit de visibilité partenaires (co-branding cinéma × marques)
• Analyse des données de fréquentation et corrélation avec les pics de campagne POS
• Mise en place d'un processus de validation numérique des BAT — réduction des erreurs de 40%

Campaign Manager — Unibet Belgium (Kindred Group), Bruxelles (juin 2018 – mars 2020)
• Gestion des campagnes d'activation pour le réseau de points de vente partenaires (tabacs, cafés)
• Création de matériel POS conforme aux réglementations de la Commission des Jeux de Hasard belge
• Coordination avec les équipes juridique et compliance pour validation des messages promotionnels
• Déploiement de 3 campagnes saisonnières (Coupe du monde, Championnat d'Europe, GP F1)

Chargée de Marketing — Liège Airport, Liège (juillet 2016 – mai 2018)
• Communication institutionnelle et campagnes B2C pour les liaisons charter
• Gestion des relations presse et production de supports print

FORMATION
Master en Marketing & Communication — HEC Liège (2014 – 2016)
Bachelor en Commerce extérieur — Haute École de la Province de Liège (2011 – 2014)

COMPÉTENCES
BTL / Trade : POS design brief, coordination production, gestion fournisseurs, activation réseau
Secteur jeux : conformité CGJ belge, communication responsable
Outils : Monday.com, Adobe Creative Suite (Illustrator, InDesign — niveau intermédiaire), Excel avancé
Langues : Français (natif), Néerlandais (B2), Anglais (C1)`,
    summary: `Profil senior très pertinent avec 7 ans d'expérience BTL et une expérience directe dans le secteur des jeux (Unibet) incluant la conformité réglementaire belge. Connaissance des contraintes spécifiques au jeu responsable — atout majeur pour la Nationale Loterij.`,
    strengths: ['7 ans BTL — profil senior confirmé', 'Expérience directe dans le secteur jeux de hasard belge (Unibet)', 'Connaissance de la réglementation CGJ — jeu responsable', 'Maîtrise Adobe Creative Suite (InDesign, Illustrator)', 'Gestion budget €900K et réduction erreurs production 40%'],
    weaknesses: ['Basée à Liège — déplacement vers Bruxelles à confirmer', 'Expérience POS principalement cinéma/entertainment vs. grande distribution'],
    skills: ['BTL campaigns', 'POS activation', 'Gambling regulation', 'Adobe InDesign', 'Adobe Illustrator', 'Monday.com', 'Budget management', 'Agency coordination', 'Responsible gaming'],
    experience: '7 ans: Senior Campaign Manager chez Kinepolis (4 ans) — 20 campagnes/an, €900K budget. Campaign Manager chez Unibet Belgium (2 ans) — jeux, conformité CGJ. Chargée Marketing chez Liège Airport (2 ans).',
    education: 'Master Marketing & Communication, HEC Liège, 2016. Bachelor Commerce extérieur, 2014.',
    recommendation: 'strong_yes',
    language: 'fr',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 0,
  },

  {
    firstName: 'Wouter',
    lastName: 'Claes',
    email: 'wouter.claes@gmail.com',
    phone: '+32 486 778 899',
    cvContent: `WOUTER CLAES
wouter.claes@gmail.com | +32 486 778 899 | Leuven, België

PROFESSIONELE SAMENVATTING
Digitaal marketeer met 5 jaar ervaring in online campagnebeheer (SEA, SEO, sociale media). Wil overstappen naar een BTL/offline campagnerol. Sterk analytisch profiel, gewend aan het werken met grote datasets en campagnerapportages. Geen directe POS-ervaring, maar snel lerend en gemotiveerd.

WERKERVARING

Digital Marketing Specialist — ING België, Brussel (februari 2021 – heden)
• Beheer van Google Ads-campagnes met een maandelijks budget van €200K
• Coördinatie van display- en retargetingcampagnes via DV360
• Rapportage van campagneprestaties aan de Head of Digital Marketing
• Samenwerking met externe bureaus (Wunderman Thompson) voor ATL-campagnes
• Introductie van geautomatiseerde rapportering via Looker Studio — tijdsbesparing 4u/week

SEA Consultant — iProspect (Dentsu), Brussel (januari 2019 – januari 2021)
• Beheer van Google en Bing Ads-campagnes voor 8 klanten (retail, finance, automotive)
• Keyword research, A/B-testen van advertentieteksten, bidstrategie-optimalisatie
• Maandelijkse prestatierapportages en presentaties aan klanten

OPLEIDING
Master Communicatiewetenschappen — KU Leuven (2016 – 2018)
Bachelor Communicatie & Multimedia Design — KU Leuven (2013 – 2016)

VAARDIGHEDEN
Digitaal: Google Ads (gecertificeerd), Meta Ads, DV360, Google Analytics 4, Looker Studio
Data: Excel gevorderd, PowerBI basiskennis
Projectbeheer: Asana, Slack
Talen: Nederlands (moedertaal), Engels (C1), Frans (B1)`,
    summary: `Digitale marketeer die de overstap naar BTL wil maken. Sterke analytische vaardigheden en mediadiscipLine, maar mist concrete POS- en BTL-ervaring. Het profiel is eerder een groeikandidaat dan een directe match voor een Campaign Manager rol.`,
    strengths: ['Sterke data-analyse en rapportagevaardigheden', 'Groot mediabudgetbeheer (€200K/maand)', 'Samenwerking met externe bureaus', 'Analytisch profiel — kan campagneprestaties meten'],
    weaknesses: ['Geen BTL of POS-ervaring', 'Puur digitale achtergrond vs. gevraagd offline campagneprofiel', 'Geen leveranciersbeheer voor drukwerk of POS-productie', 'Motivatie voor switch naar BTL nog weinig onderbouwd'],
    skills: ['Google Ads', 'Meta Ads', 'DV360', 'Google Analytics 4', 'Looker Studio', 'PowerBI', 'Asana'],
    experience: '5 jaar: Digital Marketing Specialist bij ING België (3 jaar) — SEA, display, bureaucoördinatie. SEA Consultant bij iProspect/Dentsu (2 jaar) — 8 klanten, Google/Bing Ads.',
    education: 'Master Communicatiewetenschappen, KU Leuven, 2018. Bachelor Communicatie & Multimedia Design, KU Leuven, 2016.',
    recommendation: 'no',
    language: 'nl',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 0,
  },

  {
    firstName: 'Laure',
    lastName: 'Fontaine',
    email: 'laure.fontaine@yahoo.fr',
    phone: '+32 479 221 334',
    cvContent: `LAURE FONTAINE
laure.fontaine@yahoo.fr | +32 479 221 334 | Namur, Belgique

PROFIL
Responsable Marketing avec 8 ans d'expérience dans le secteur de la grande distribution alimentaire. Large expérience en gestion de campagnes promotionnelles, management d'équipes marketing et pilotage de budgets importants. Cherche un poste de Campaign Manager avec une composante créative forte.

EXPÉRIENCE

Responsable Marketing Promotionnel — Lidl Belgique, Bruxelles (mars 2018 – présent)
• Direction d'une équipe de 4 personnes (2 coordinateurs campagne, 1 chef de projet print, 1 studio graphique interne)
• Pilotage de la stratégie promotionnelle annuelle pour 300 magasins belges
• Gestion du budget promotionnel annuel de €5M (catalogues, PLV, radio, digital)
• Coordination avec le siège européen Lidl (Neckarsulm) pour l'adaptation belge des campagnes pan-européennes
• Réduction du coût de production par catalogue de €0,18 à €0,11 via renégociation des contrats d'impression
• Lancement de 6 nouvelles gammes avec campagnes POS dédiées (dont Bio et Premium)

Chef de Projet Marketing — Intermarché Belgique (Groupement Les Mousquetaires), Namur (août 2015 – février 2018)
• Développement et déploiement de campagnes promotionnelles régionales pour 45 magasins
• Gestion des relations avec les adhérents pour la mise en place des actions promotionnelles locales
• Coordination print (catalogues hebdomadaires, affichages vitrine, stop-rayons)

Junior Marketing — Carrefour Belgium, Evere (septembre 2013 – juillet 2015)
• Support à la préparation des plans promotionnels saisonniers
• Coordination logistique du matériel PLV

FORMATION
Master en Sciences de Gestion — Université de Namur (2011 – 2013)
Bachelor en Marketing — Université Catholique de Louvain (2008 – 2011)

COMPÉTENCES
Management : direction d'équipe, coaching, objectifs, évaluation
Campagnes BTL : stratégie promotionnelle, coordination production, gestion multi-agences
Budgets : pilotage P&L promotionnel, renégociation contrats
Langues : Français (natif), Néerlandais (B1), Anglais (B2)`,
    motivationText: `Madame, Monsieur,

Forte de 8 ans d'expérience dans le marketing promotionnel de la grande distribution, dont 6 ans en tant que Responsable Marketing chez Lidl Belgique, je souhaite rejoindre la Nationale Loterij comme Campaign Manager.

Ce qui me motive ? Le défi de travailler sur un réseau de distribution unique — les points de vente de la Nationale Loterij combinent des enjeux de visibilité, de jeu responsable et de stimulation des ventes qui sont très différents du retail alimentaire classique. Je suis prête à mettre mon expérience en gestion de campagnes nationales et en pilotage d'agences au service de cette mission.

Mon profil est peut-être plus axé "management" que "création" pure, mais je suis convaincue qu'une bonne Campaign Manager doit avant tout être une excellente chef de projet avec un sens créatif développé — et c'est exactement ce que j'apporte.

Cordialement, Laure Fontaine`,
    summary: `Profil senior avec 8 ans en marketing promotionnel grande distribution et management d'équipe de 4 personnes. Très forte en gestion budgétaire et coordination opérationnelle. Niveau BTL/POS solide, mais moins fort sur la dimension créative et la génération d'idées campagnes.`,
    strengths: ['8 ans expérience marketing promotionnel retail', 'Management d\'équipe confirmé (4 personnes)', 'Gestion de budget €5M — très supérieur au périmètre du poste', 'Réduction coûts production mesurable (-39%)', 'Coordination siège européen — travail dans contexte multilingue'],
    weaknesses: ['Profil davantage "responsable opérationnel" que "Campaign Manager créatif"', 'Niveau néerlandais faible (B1) pour un poste à la Nationale Loterij', 'Principalement FMCG/alimentaire — secteur jeux très différent'],
    skills: ['Campaign management', 'BTL promotions', 'Team management', 'Budget P&L', 'Print production', 'Vendor negotiation', 'MS Office', 'SAP Marketing'],
    experience: '8 ans: Responsable Marketing Promotionnel chez Lidl Belgique (6 ans) — équipe 4 personnes, €5M budget, 300 magasins. Chef de Projet Marketing chez Intermarché (2,5 ans). Junior Marketing chez Carrefour (2 ans).',
    education: 'Master Sciences de Gestion, Université de Namur, 2013. Bachelor Marketing, UCLouvain, 2011.',
    recommendation: 'yes',
    language: 'fr',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 0,
  },

  {
    firstName: 'Bram',
    lastName: 'Hendrickx',
    email: 'bram.hendrickx@student.kuleuven.be',
    phone: '+32 468 990 112',
    cvContent: `BRAM HENDRICKX
bram.hendrickx@student.kuleuven.be | +32 468 990 112 | Leuven, België

OPLEIDING
Master Marketing Management — KU Leuven (2023 – 2025, afstuderen juni 2025)
Masterproef: Effectiviteit van POS-displays in supermarkten: een A/B-testanalyse bij Aldi België (score: 16/20)
Bachelor Handelswetenschappen — KU Leuven (2020 – 2023) | Cum laude

STAGE-ERVARING
Marketing Intern — Procter & Gamble België, Brussel (februari – augustus 2024)
• Ondersteuning van het BTL-team bij de coördinatie van Gillette en Head & Shoulders POS-campagnes
• Opmaak van campagnebriefings voor het creatieve bureau
• Opvolging van POS-materiaal leveringen in Benelux
• Marktonderzoek: analyse van competitor POS-materiaal in 20 supermarkten (mystery shopping)

Marketingassistent (studentenjob) — lokaal evenementenbureau Leuven (zomers 2022, 2023)
• Promotie van zomerfestivals via flyers, displays en sociale media
• Opbouw en afbraak van promotiestands

PROJECTEN (academisch)
BTL-campagneconcept voor Aldi België (groepsproject, 2024)
• Ontwikkeling van een volledig BTL-campagneconcept voor de lancering van een nieuw Aldi-huismerk
• Creatief concept, POS-materiaal mock-ups, mediaplanning en budgetraming
• Presentatie aan Aldi marketing team — geselecteerd als beste groepsproject

VAARDIGHEDEN
Marketing: campagneconcepten, briefing schrijven, basiskennis trade marketing
Tools: MS Office, Canva, basiskennis Adobe Illustrator
Talen: Nederlands (moedertaal), Frans (B2), Engels (C1)

INTERESSES
Retailmarketing, shopper marketing, merkontwikkeling, sport (voetbal, tennis)`,
    summary: `Recente masterstudent met relevante stage bij P&G BTL-team en academisch project over POS-effectiviteit. Geen professionele Campaign Manager ervaring — te junior voor de gevraagde rol. Interessant profiel voor een junior/coordinator positie maar niet geschikt voor een volwaardige Campaign Manager functie.`,
    strengths: ['Stage bij P&G BTL-team — directe sector exposure', 'Masterproef over POS-effectiviteit — theoretische kennis', 'Enthousiasme voor BTL en trade marketing', 'Goede taalcombo NL/FR/EN'],
    weaknesses: ['Geen professionele Campaign Manager ervaring', 'Te junior voor de functie (junior/coordinator niveau)', 'Geen budgetbeheer of bureausturing', 'Pas afgestudeerd — leerperiode vereist'],
    skills: ['Trade marketing basics', 'BTL campaign concepts', 'MS Office', 'Canva', 'Adobe Illustrator basics', 'Market research'],
    experience: 'Stage P&G BTL-team (6 maanden, 2024). Studentenjob evenementenbureau (2 zomers).',
    education: 'Master Marketing Management, KU Leuven, 2025 (afstudeerder). Bachelor Handelswetenschappen, KU Leuven, 2023, cum laude.',
    recommendation: 'no',
    language: 'nl',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 0,
  },

  // ── Vacancy 1: Product Manager – Credix Financial Technologies ─────────────

  {
    firstName: 'Sven',
    lastName: 'Dewaele',
    email: 'sven.dewaele@gmail.com',
    phone: '+32 476 445 667',
    cvContent: `SVEN DEWAELE
sven.dewaele@gmail.com | +32 476 445 667 | Antwerp, Belgium | linkedin.com/in/svendewaele-pm

PROFESSIONAL SUMMARY
Product Manager with 6 years of experience at B2B SaaS and fintech companies. Proven track record of owning full product domains from discovery to growth, with measurable business outcomes. Delivered a core lending product that grew from 0 to €120M ARR at a Brussels-based fintech. Strong data literacy, structured thinker, collaborative with engineers and designers.

EXPERIENCE

Senior Product Manager — Lending & Underwriting — Silverfin (Visma), Ghent (March 2022 – present)
• Own the product roadmap for Silverfin's accounting workflow module (used by 1,200+ accounting firms)
• Ran 80+ user interviews and 12 Jobs-to-be-Done research sprints to identify the top 5 workflow bottlenecks
• Shipped 14 major features in 18 months, increasing daily active usage by 34% and reducing time-on-task by 22%
• Defined product KPIs in Amplitude: funnel conversion, feature adoption, NPS by persona
• Led the API integration programme: partnered with 3 external ERP vendors (Exact, Unit4, Sage) to build native integrations, adding €800K ARR in the first year
• Managed stakeholder communication across product, engineering (8-person squad), sales, and CS teams

Product Manager — SME Lending — FinFrontier (fintech startup), Brussels (April 2019 – February 2022)
• First PM hire at a Series A fintech; built the SME lending product from 0 to €120M ARR
• Designed the end-to-end underwriting UX: application flow, scoring display, decisioning dashboard
• Partnered with engineers to implement Open Banking API connections (Isabel 6, Ponto) for automated income verification
• Collaborated with Chief Risk Officer to translate credit policy rules into UI logic and guardrails
• Launched merchant-facing repayment dashboard reducing inbound support requests by 45%
• Defined and tracked product SLA metrics; maintained 99.7% uptime across loan origination flow

Associate Product Manager — Teamleader, Ghent (September 2017 – March 2019)
• Contributed to CRM module feature development under senior PM guidance
• Ran usability tests with 200+ users; synthesised findings into actionable backlog items
• Wrote PRDs and user stories for a calendar sync feature adopted by 12,000 users at launch

EDUCATION
MSc Business Engineering — KU Leuven (2015 – 2017) | Thesis: Credit scoring for SMEs using alternative data (grade 17/20)
BSc Business Economics — University of Antwerp (2012 – 2015) | Cum laude

SKILLS
Frameworks: Jobs-to-be-Done, OKRs, Opportunity Solution Trees
Tools: Linear, Notion, Figma (wireframing), Amplitude, Mixpanel, Salesforce, SQL (intermediate)
Technical: Open Banking APIs, REST API concepts, basic Python for data queries
Domains: SME lending, underwriting, credit risk, accounting workflows

LANGUAGES
Dutch (native), English (fluent/C2), French (good/B2)`,
    motivationText: `Hi Credix team,

I'm applying for the Product Manager role because the overlap with my background is about as close as it gets: I built an SME lending product from scratch at FinFrontier, grew it to €120M ARR, and then moved to Silverfin to own a product used by 1,200+ accounting firms. Both experiences are directly relevant to what you're building.

What excites me about Credix specifically: €200M in loan originations with three new markets in 2026 means you're at exactly the stage where product decisions have outsized impact. The underwriting UX, the merchant dashboard, the repayment experience — these are problems I've solved before and can solve faster because I've made the mistakes already.

I'm particularly strong in the fintech regulatory and API dimension: I've worked closely with compliance teams on AML/KYC flows, integrated Open Banking APIs in Belgium, and translated risk policies into product logic. I know that the hard part of a lending product isn't the UI — it's the edge cases.

I'd love to walk you through the FinFrontier product in detail.

Sven`,
    summary: `Exceptional PM candidate with exactly the right background: built an SME lending product from scratch to €120M ARR, deep fintech and Open Banking expertise, strong data skills, and experience in the Belgian market. Closest possible profile match for this role.`,
    strengths: ['Built SME lending product 0 → €120M ARR at Series A fintech', 'Deep Open Banking API and Belgian fintech regulatory knowledge', 'Strong quantitative background (Business Engineering, credit scoring thesis)', 'Amplitude/Mixpanel analytics and SQL data skills', 'Previous APM experience at Teamleader — knows the Belgian B2B SaaS context'],
    weaknesses: ['May expect senior PM title/compensation reflecting his track record', 'Accounting workflows background may be a stretch from pure lending focus'],
    skills: ['Product roadmap', 'Jobs-to-be-Done', 'OKRs', 'Linear', 'Amplitude', 'Mixpanel', 'SQL', 'Open Banking APIs', 'Figma wireframing', 'SME lending', 'Underwriting UX', 'Salesforce'],
    experience: '6 ans: Senior PM chez Silverfin/Visma (2 ans). PM chez FinFrontier Brussels (3 ans) — 0 à €120M ARR, produit lending. APM chez Teamleader (2 ans).',
    education: 'MSc Business Engineering, KU Leuven, 2017 (17/20). BSc Business Economics, UAntwerpen, 2015.',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 1,
  },

  {
    firstName: 'Amina',
    lastName: 'Boukhari',
    email: 'amina.boukhari@pm.me',
    phone: '+33 6 71 23 45 67',
    cvContent: `AMINA BOUKHARI
amina.boukhari@pm.me | +33 6 71 23 45 67 | Paris, France (open to Antwerp/Brussels)
linkedin.com/in/aminaboukhari-product

PROFESSIONAL SUMMARY
Product Manager with 5 years at B2B SaaS companies in Paris and London. Specialised in payments and financial workflows. Built and scaled a B2B invoicing product from MVP to €15M ARR. Structured product thinker with strong data analysis and stakeholder management skills. Looking to join an ambitious fintech at growth stage.

EXPERIENCE

Product Manager — Payments & Invoicing — Pennylane, Paris (January 2022 – present)
• Own the payments and bank reconciliation product for 20,000+ French SME customers
• Led complete redesign of the invoice payment flow: reduced payment failure rate from 8.2% to 2.1% (saving €400K/month in failed payment costs)
• Shipped SEPA Direct Debit automation reducing manual AP processing time for customers by 70%
• Defined and tracked OKRs: payment success rate, days-to-pay, reconciliation accuracy
• Ran 50+ customer interviews; built and maintained a Jobs-to-be-Done opportunity solution tree
• Collaborated with a squad of 6 engineers + 1 designer in 2-week sprints (Linear)
• Led PSD2 SCA compliance implementation — worked closely with legal and engineering

Product Manager — B2B Marketplace Payments — Payplug (Natixis), Paris (March 2019 – December 2021)
• Built marketplace payment splitting feature from 0 to €15M ARR in 14 months
• Designed onboarding and KYC flow for marketplace sellers (integrated Mangopay)
• Defined pricing model with commercial team for new payment product
• Delivered REST API documentation for 200+ developer customers

EDUCATION
MSc Management — ESSEC Business School, Paris (2017 – 2019) | Exchange semester at LSE
BA Economics — Université Paris Dauphine (2014 – 2017)

SKILLS
Frameworks: OKRs, JTBD, Opportunity Solution Trees, Kano model
Tools: Linear, Notion, Figma (intermediate), Mixpanel, Amplitude, SQL (proficient), dbt (basic)
Technical: REST APIs, PSD2/SCA, SEPA, IBAN validation, payment rails
Domains: B2B payments, invoicing, bank reconciliation, KYC/AML, marketplace payments

LANGUAGES
French (native), English (fluent/C1), Arabic (conversational/B1), Dutch (basic/A2 — learning)`,
    motivationText: `Dear Credix team,

Pennylane just raised Series C and I've spent 3 years building the payments backbone of a French fintech. I want to bring that experience to Credix — a more focused lending play in a market (Belgian/European SME) I find genuinely underserved.

My key experiences relevant to your role: I've shipped PSD2/SCA compliance from scratch, built a payment flow that reduced failure rates by 75%, and delivered a marketplace product to €15M ARR. The overlap with embedded lending infrastructure is strong — both are about removing friction from financial transactions for SMEs.

One honest gap: I don't have direct lending/underwriting experience. I know payments deeply but the credit risk side would be new. That said, I learn fast and I have the financial regulation and API background that's harder to acquire.

On the relocation: I'm open to Antwerp/Brussels — I have Belgian friends and have visited multiple times. Ready to move within 8 weeks.

Amina`,
    summary: `Strong fintech PM with 5 years in B2B payments and PSD2 compliance at Pennylane and Payplug. Deep knowledge of European payment rails and SME financial workflows. Gap is the lending/credit risk side — payments expert but not a lending domain expert yet.`,
    strengths: ['5 years fintech PM in B2B payments — adjacent domain', 'PSD2/SCA compliance experience — EU regulatory knowledge', 'Payment flow optimisation with measurable results (-75% failure rate)', 'Marketplace payment product built 0→€15M ARR', 'Strong SQL and data skills'],
    weaknesses: ['No lending or underwriting experience — domain gap', 'Currently in Paris — relocation needed', 'Dutch only A2 (learning) — potential barrier in Belgian market', 'Less familiar with credit risk and scoring concepts'],
    skills: ['Product management', 'OKRs', 'Linear', 'Amplitude', 'SQL', 'REST APIs', 'PSD2/SCA', 'SEPA', 'KYC/AML', 'Figma', 'Mixpanel'],
    experience: '5 ans: PM Payments & Invoicing chez Pennylane Paris (3 ans). PM B2B Marketplace Payments chez Payplug/Natixis (2,5 ans).',
    education: 'MSc Management, ESSEC Business School, 2019. BA Economics, Paris Dauphine, 2017.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 1,
  },

  {
    firstName: 'Jonas',
    lastName: 'Müller',
    email: 'jonas.mueller@web.de',
    phone: '+49 151 234 56789',
    cvContent: `JONAS MÜLLER
jonas.mueller@web.de | +49 151 234 56789 | Berlin, Germany (open to relocation Belgium)
linkedin.com/in/jonasmueller-product

PROFESSIONAL SUMMARY
Senior Product Manager with 8 years of experience at Berlin and Munich fintechs. Led product teams of up to 4 PMs. Deep expertise in consumer lending, credit scoring, and digital banking. Managed products serving 800,000+ consumers. Now seeking a focused individual-contributor PM role in a high-growth environment.

EXPERIENCE

Principal Product Manager — Consumer Credit — N26, Berlin (January 2020 – present)
• Own N26's consumer credit product (Overdraft, Installment Loans): 800,000 active borrowers, €1.4B portfolio
• Led team of 3 PMs; managed product strategy, roadmap, and quarterly OKR planning
• Shipped personalised credit limit engine (ML-based): increased credit offer acceptance rate by 31%
• Redesigned the credit application flow: reduced drop-off from 62% to 38% (24pp improvement)
• Led regulatory compliance project for EU Consumer Credit Directive (CCD II) across 5 markets
• Defined credit risk guardrails with the Chief Risk Officer; maintained default rate below 2.8%

Senior Product Manager — SME Lending — Spotcap (now Funding Circle DE), Berlin (April 2016 – December 2019)
• Built SME credit application product from beta to 15,000+ loans originated
• Designed automated underwriting decision engine integrating Schufa, bureau data, and bank statement analysis
• Led Open Banking integration (FinAPI) for automated income and cash flow verification
• Collaborated with credit risk, legal, and compliance teams on AML/KYC implementation

EDUCATION
MSc Finance — WHU – Otto Beisheim School of Management (2014 – 2016)
BSc Business Administration — University of Mannheim (2011 – 2014) | GPA 1.6/5.0

SKILLS
Frameworks: OKRs, JTBD, Dual-track Agile, North Star Metric
Tools: Jira, Productboard, Figma (strong wireframing), Looker, SQL (advanced), Segment
Technical: Open Banking APIs, credit bureau APIs (Schufa, Creditsafe), AML/KYC flows
Domains: Consumer lending, SME credit, overdraft, credit scoring, EU CCD compliance

LANGUAGES
German (native), English (fluent/C2), French (basic/A2)`,
    summary: `Very strong candidate with deep consumer and SME lending expertise from N26 and Spotcap. 8 years of experience including team leadership. The profile matches the domain perfectly. Key concern: moving from managing 3 PMs at N26 to an IC role, and Belgium/Dutch language gap.`,
    strengths: ['8 years fintech PM with direct lending and credit scoring expertise', 'N26 scale experience (800K borrowers, €1.4B portfolio)', 'ML-based credit engine and automated underwriting experience', 'EU CCD II regulatory compliance expertise', 'Strong SQL and data skills'],
    weaknesses: ['Principal PM managing team of 3 — may be overqualified for IC role', 'No Belgian market experience', 'French only A2 — limited in Belgian bilingual context', 'May expect VP/Director title commensurate with N26 background'],
    skills: ['Product strategy', 'OKRs', 'SQL', 'Looker', 'Figma', 'Open Banking APIs', 'Credit scoring', 'AML/KYC', 'Segment', 'Productboard'],
    experience: '8 ans: Principal PM chez N26 Berlin (4 ans) — consumer credit, €1.4B portfolio, team of 3 PMs. Senior PM chez Spotcap/Funding Circle (3,5 ans) — SME lending, automated underwriting. ',
    education: 'MSc Finance, WHU Otto Beisheim, 2016. BSc Business Admin, University of Mannheim, 2014.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'upload',
    vacancyIndex: 1,
  },

  {
    firstName: 'Elena',
    lastName: 'Vasquez',
    email: 'elena.vasquez@gmail.com',
    phone: '+34 612 345 678',
    cvContent: `ELENA VASQUEZ
elena.vasquez@gmail.com | +34 612 345 678 | Madrid, Spain (open to Brussels)
linkedin.com/in/elenavasquez-pm

PROFESSIONAL SUMMARY
Product Manager with 4 years of experience in B2B SaaS and e-commerce. Strong in user research, data-driven product decisions, and cross-functional collaboration. Background in growth and funnel optimisation. Looking to break into fintech/financial products with a growth-stage company.

EXPERIENCE

Product Manager — Growth & Onboarding — Cabify (mobility SaaS), Madrid (February 2021 – present)
• Own driver onboarding product: reduced onboarding completion time from 14 days to 5 days
• Shipped automated document verification flow using AI OCR — reduced manual review work 80%
• Led A/B test programme: 20+ experiments on onboarding funnel, improved activation rate 18%
• Collaborated with data team to build Looker dashboards for funnel KPIs
• Managed sprint planning for a squad of 5 engineers + 1 designer

Junior Product Manager — E-commerce Features — Glovo, Barcelona (September 2019 – January 2021)
• Built product features for restaurant partners portal (menu management, promotions)
• Ran user interviews with 30+ restaurant operators to identify workflow pain points
• Shipped bulk menu edit feature: reduced support tickets from restaurant partners by 35%

EDUCATION
MSc Digital Innovation & Entrepreneurship — IE Business School, Madrid (2018 – 2019)
BA Business Administration — Universidad Complutense Madrid (2014 – 2018) | Notable (distinction)

SKILLS
Frameworks: OKRs, Lean UX, JTBD (basic), A/B testing
Tools: Jira, Notion, Figma (intermediate), Amplitude, Looker, SQL (intermediate)
Domains: driver onboarding, marketplace operations, growth funnels, e-commerce
Languages: Spanish (native), English (fluent/C1), French (B1), Catalan (native)`,
    summary: `Motivated PM with 4 years of solid experience in growth and onboarding products at Cabify and Glovo. No fintech or lending experience — significant domain gap for this role. Strong in funnel optimisation and data, but the financial product and regulatory complexity is largely unexplored territory.`,
    strengths: ['Onboarding flow optimisation with measurable results', 'A/B testing and growth experimentation experience', 'Amplitude and Looker data skills', 'IE Business School digital innovation education'],
    weaknesses: ['Zero fintech or lending experience — major domain gap', 'No financial regulation or compliance background', 'Junior-to-mid level — 4 years vs. 4+ required', 'Based in Madrid — relocation required', 'No Open Banking or payments API experience'],
    skills: ['OKRs', 'A/B testing', 'Amplitude', 'Looker', 'SQL', 'Figma', 'Jira', 'Notion', 'Funnel optimisation'],
    experience: '4 ans: PM Growth & Onboarding chez Cabify Madrid (3 ans). Junior PM chez Glovo Barcelona (1,5 an).',
    education: 'MSc Digital Innovation, IE Business School Madrid, 2019. BA Business Admin, UCM Madrid, 2018.',
    recommendation: 'maybe',
    language: 'en',
    status: 'new',
    source: 'email',
    vacancyIndex: 1,
  },

  {
    firstName: 'Stef',
    lastName: 'Lemmens',
    email: 'stef.lemmens@proximus.be',
    phone: '+32 489 667 788',
    cvContent: `STEF LEMMENS
stef.lemmens@proximus.be | +32 489 667 788 | Mechelen, België

PROFESSIONELE SAMENVATTING
Business Analyst / Junior Product Owner met 3 jaar ervaring in een grote Belgische telecomorganisatie. Ervaring met het schrijven van user stories, het leiden van sprint ceremonies en het werken met technische teams. Wil overstappen naar een Product Manager rol in een fintech scale-up.

WERKERVARING

Business Analyst / Product Owner — Proximus, Brussel (september 2021 – heden)
• Product Owner voor interne HR-tool (150 gebruikers)
• Schrijven van user stories, acceptatiecriteria en technische specificaties
• Leiden van refinement, sprint planning en retrospectives
• Samenwerking met een team van 4 ontwikkelaars (offshore India + lokaal)
• Beheer van de backlog in Jira; prioritering op basis van businesswaarde
• Coördinatie met HR-directie voor stakeholdervalidatie

IT Project Coordinator — Cegeka, Hasselt (augustus 2019 – augustus 2021)
• Coördinatie van IT-projecten voor overheidsklanten
• Schrijven van functionele analyses en testscenario's
• Ondersteuning van projectmanager bij planning en rapportage

OPLEIDING
Master in de Toegepaste Economische Wetenschappen — KU Leuven (2017 – 2019)
Bachelor Informatica — Thomas More Mechelen (2014 – 2017)

VAARDIGHEDEN
Product: user stories, backlogs, sprint ceremonies, stakeholder management
Tools: Jira, Confluence, MS Office, basiskennis SQL
Talen: Nederlands (moedertaal), Engels (B2), Frans (A2)`,
    summary: `Business Analyst / junior PO met goede basisvaardigheden maar onvoldoende senioriteitsniveau voor een Product Manager rol in een fintech scale-up. Geen productervaring in B2B SaaS of financiële producten, geen data-analytics skills, geen track record van eigen productlanceringen.`,
    strengths: ['Structureel sterk in user stories en sprint ceremonies', 'Technische achtergrond (informatica) helpt met engineer communicatie', 'Belgische kandidaat — geen verhuizing nodig'],
    weaknesses: ['3 jaar BA/PO ervaring — te junior voor een PM-rol in fintech scale-up', 'Geen fintech, financiële producten of lending ervaring', 'Geen product analytics tools (Amplitude, Mixpanel)', 'Interne tool van 150 gebruikers vs. consumentenschaal product', 'Frans enkel A2 in een Belgische bedrijfscontext'],
    skills: ['User stories', 'Backlog management', 'Jira', 'Confluence', 'Sprint ceremonies', 'SQL basics', 'Stakeholder management'],
    experience: '3 jaar: BA/PO bij Proximus Brussel (3 jaar) — interne HR-tool. IT Project Coordinator bij Cegeka Hasselt (2 jaar).',
    education: 'Master TEW, KU Leuven, 2019. Bachelor Informatica, Thomas More Mechelen, 2017.',
    recommendation: 'no',
    language: 'nl',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 1,
  },

  {
    firstName: 'Nathalie',
    lastName: 'Goossens',
    email: 'nathalie.goossens@outlook.com',
    phone: '+32 473 889 001',
    cvContent: `NATHALIE GOOSSENS
nathalie.goossens@outlook.com | +32 473 889 001 | Brussels, Belgium
linkedin.com/in/nathaliegoossens-product

PROFESSIONAL SUMMARY
Product Manager with 5 years of experience at Belgian and Dutch B2B SaaS companies. Track record of successfully shipping revenue-generating features and managing enterprise customer relationships during product rollouts. Interested in transitioning from HR tech to fintech. Analytically strong with solid SQL and data skills.

EXPERIENCE

Product Manager — Compensation & Payroll — Officient (HR SaaS), Ghent (June 2020 – present)
• Own the payroll integration product connecting Officient to 8 Belgian payroll providers (SD Worx, Securex, Partena, Attentia)
• Shipped automated payroll data export reducing HR admin time by 6 hours/month per customer
• Led integration with Belcotax-on-Web for automated fiscal fiches — adopted by 1,800 customers in 3 months
• Defined and tracked product health metrics in Mixpanel; maintained 4.3/5.0 feature satisfaction score
• Collaborated with enterprise CS team to collect structured feedback for roadmap prioritisation
• Managed partner API relationships with SD Worx, Securex technical teams

Product Manager — Onboarding — Teamleader, Ghent (March 2018 – May 2020)
• Owned new customer onboarding product for SME and mid-market segment
• Led complete redesign of onboarding wizard: reduced time-to-value from 21 days to 9 days
• Built self-service data import tool adopted by 4,000+ customers in first 6 months
• Ran 40+ customer interviews and synthesised findings into the 2019 onboarding roadmap

EDUCATION
MSc Business Administration — Ghent University (2015 – 2017) | Thesis: API economy strategies for Belgian SaaS companies (grade 15/20)
BSc Applied Economics — University of Antwerp (2012 – 2015)

SKILLS
Frameworks: OKRs, JTBD, Dual-track Agile
Tools: Linear, Notion, Figma (wireframing), Mixpanel, Amplitude, SQL (proficient), Salesforce
Domains: HR tech, payroll integrations, Belgian social legislation basics, B2B SaaS onboarding
Technical: REST API integration management, Belgian payroll data formats (DMFA, Belcotax)

LANGUAGES
Dutch (native), English (fluent/C1), French (good/B2)`,
    motivationText: `Hi Credix team,

I'm a PM with 5 years at Officient and Teamleader — both Belgian B2B SaaS companies you probably know well. I'm looking to make my next move into fintech, and Credix is the most interesting company on my list.

Why the switch: payroll integrations and financial workflows are adjacent to lending in more ways than people think. I spend my days managing complex API relationships with financial institutions (SD Worx, Securex), understanding Belgian regulatory requirements (DMFA, social security), and shipping products that touch sensitive financial data. The mental model transfers.

What I bring: I'm Belgian, I know the SME market deeply (1,800+ Officient customers are SMEs), I have strong SQL and Mixpanel skills, and I can move fast without needing a lot of management overhead. I'm an individual contributor who likes to own things end-to-end.

The honest caveat: I haven't worked on lending specifically. But I'm a fast domain learner and I'd appreciate 30 minutes to show you why the payroll → lending transition is less of a leap than it looks.

Nathalie`,
    summary: `Solid Belgian B2B SaaS PM with 5 years at Officient and Teamleader, strong API integration experience with Belgian financial institutions, and good data skills. The domain gap (HR tech vs. lending) is real but manageable given the adjacent financial context. Strong cultural fit for a Belgian scale-up.`,
    strengths: ['5 years Belgian B2B SaaS PM — knows the market well', 'API integration experience with Belgian financial institutions (SD Worx, Securex)', 'Belgian regulatory knowledge (DMFA, social security) — adjacent to fintech compliance', 'Strong SQL + Mixpanel data skills', 'Native Dutch + good French — ideal for Belgian bilingual environment'],
    weaknesses: ['HR tech background — lending domain is a new area', 'No credit risk, underwriting, or loan origination experience', 'No Open Banking API experience specifically'],
    skills: ['Product management', 'OKRs', 'Linear', 'Mixpanel', 'Amplitude', 'SQL', 'Figma', 'Salesforce', 'REST API management', 'Belcotax', 'Belgian payroll formats'],
    experience: '5 ans: PM Compensation & Payroll chez Officient Ghent (4 ans). PM Onboarding chez Teamleader Ghent (2 ans).',
    education: 'MSc Business Administration, Ghent University, 2017. BSc Applied Economics, UAntwerpen, 2015.',
    recommendation: 'yes',
    language: 'en',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 1,
  },

  // ── Vacancy 2: Data Scientist – Proximus ───────────────────────────────────

  {
    firstName: 'Roos',
    lastName: 'Vermeulen',
    email: 'roos.vermeulen@gmail.com',
    phone: '+32 478 112 334',
    cvContent: `ROOS VERMEULEN
roos.vermeulen@gmail.com | +32 478 112 334 | Leuven, België
linkedin.com/in/roosvermeulen-datascience

PROFESSIONELE SAMENVATTING
Data Scientist met 5 jaar ervaring in churnpreventie, klantgedragsmodellering en MLOps bij een grote Belgische verzekeraar. Expert in Python, scikit-learn, XGBoost en Azure ML. Leverde een churnmodel dat €2,8M klantomzet heeft behouden bij Ethias. Sterke communicator die complexe modellen vertaalt naar businessbeslissingen.

WERKERVARING

Senior Data Scientist — Klantbehoud & CLV — Ethias, Luik (januari 2021 – heden)
• Ontwikkeling en productie-implementatie van churnpreventiemodel voor 1,2M verzekeringsklanten
• Model: gradient boosted trees (LightGBM) op gedragsdata, schadeclaims en contacthistoriek — AUC 0,87
• Bewezen businessimpact: €2,8M behouden klantomzet in eerste 12 maanden post-implementatie
• Gebouwd en onderhouden van feature pipeline in Azure ML (Python/PySpark) op dataset van 8 jaar klanthistorie
• MLOps: automatische maandelijkse hertraining, concept drift monitoring met Evidently AI, alert systeem
• Samenwerking met marketing en actuariaatsteam voor next-best-offer modellen (cross-sell propensiteit)
• Presentaties aan CMO en Raad van Bestuur: quarterly model performance rapporten
• Begeleiding van 2 junior data scientists

Data Scientist — ING België, Brussel (september 2019 – december 2020)
• Ontwikkeling van transactieanomaliedetectie model voor fraudedetectie (Isolation Forest + LSTM)
• Feature engineering op betalingstransactiedata (50M+ rijen/maand)
• Samenwerking met data engineers voor pipeline-opbouw in Databricks
• Rapportering van modelresultaten aan het Fraud Operations team

OPLEIDING
Master of Science in Statistiek en Data Science — KU Leuven (2017 – 2019) | Grootste onderscheiding
Thesis: Survival analysis voor klantverloop in de Belgische verzekeringsmarkt (score: 18/20)
Bachelor Wiskunde — KU Leuven (2014 – 2017) | Onderscheiding

TECHNISCHE VAARDIGHEDEN
Python: pandas, NumPy, scikit-learn, LightGBM, XGBoost, Optuna, MLflow, SHAP, Evidently AI
ML modellen: gradient boosting, random forest, LSTM, Isolation Forest, survival analysis (lifelines)
Cloud: Azure ML Studio, Azure Databricks, Azure Data Lake, Azure DevOps pipelines
Data: PySpark, SQL (gevorderd), BigQuery (basis)
MLOps: MLflow experiment tracking, model registry, retraining pipelines, drift monitoring
Visualisatie: Matplotlib, Seaborn, Plotly, Power BI (basis)

TALEN
Nederlands (moedertaal), Frans (B2), Engels (C1)`,
    motivationText: `Geachte,

Ik solliciteer voor de functie van Data Scientist bij Proximus. Na vijf jaar churnmodellering bij Ethias voor de Belgische verzekeringsmarkt, geloof ik dat mijn profiel nauw aansluit bij wat jullie zoeken — en dat de stap naar telecom een logische evolutie is.

Wat me aanspreekt bij Proximus is de schaal van het klantenbestand (5,4 miljoen) en de rijkdom van de beschikbare data: netwerk- en gebruiksdata bieden dimensies die in de verzekeringssector niet beschikbaar zijn. Ik ben overtuigd dat mijn ervaring met survival analysis en churnmodellering direct overdraagbaar is, terwijl de nieuwe datasignaturen voor mij een intellectueel stimulerende uitdaging vormen.

Mijn model bij Ethias heeft in het eerste jaar €2,8M klantomzet behouden. Ik zou graag een gelijkaardig verhaal kunnen schrijven bij Proximus.

Met vriendelijke groet,
Roos Vermeulen`,
    summary: `Uitstekende data scientist met 5 jaar churnpreventie-ervaring in een vergelijkbare context (grote Belgische klantenbasis). Bewezen AUC 0.87 churnmodel met €2,8M businessimpact. Exacte technische stack match (Python, LightGBM, Azure ML, MLops). Sterkste kandidaat voor deze rol.`,
    strengths: ['5 jaar churnmodellering — directe domein match', 'Bewezen businessimpact: €2,8M behouden omzet', 'MLOps expertise (retraining pipelines, drift monitoring)', 'Azure ML — exacte cloud-platform match', 'KU Leuven MSc Statistiek & Data Science met grootste onderscheiding'],
    weaknesses: ['Achtergrond in verzekering vs. telecom — datasignaturen iets anders', 'Power BI slechts basiskennis (Proximus gebruikt mogelijk Looker/Tableau)'],
    skills: ['Python', 'LightGBM', 'XGBoost', 'scikit-learn', 'Azure ML', 'MLflow', 'PySpark', 'SQL', 'SHAP', 'Evidently AI', 'Survival analysis', 'Optuna'],
    experience: '5 jaar: Senior Data Scientist bij Ethias Luik (3 jaar) — churnmodel 1,2M klanten, MLOps. Data Scientist bij ING België (1,5 jaar) — fraudedetectie, transactiedata.',
    education: 'MSc Statistiek & Data Science, KU Leuven, 2019, grootste onderscheiding. BSc Wiskunde, KU Leuven, 2017.',
    recommendation: 'strong_yes',
    language: 'nl',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 2,
  },

  {
    firstName: 'Matteo',
    lastName: 'Rossi',
    email: 'matteo.rossi@datascience.it',
    phone: '+39 347 123 4567',
    cvContent: `MATTEO ROSSI
matteo.rossi@datascience.it | +39 347 123 4567 | Milan, Italy (open to Brussels/remote)
github.com/matteorossi-ds | kaggle.com/matteorossids

PROFESSIONAL SUMMARY
Data Scientist with 4 years of experience in telecoms and digital media. Developed churn prediction and customer lifetime value models for Vodafone Italy serving 30M customers. Expert in Python, XGBoost, and feature engineering on large-scale telecoms data. Kaggle Competition Master (top 1% ranking). PhD in Applied Mathematics from Politecnico di Milano.

EXPERIENCE

Data Scientist — Churn & Retention — Vodafone Italy, Milan (March 2021 – present)
• Developed and maintained churn prediction model for 30M prepaid and postpaid customers
• Model stack: LightGBM ensemble on 300+ telecom features (usage, network, device, billing) — AUC 0.91
• Reduced model inference time by 65% via feature selection (SHAP-based) enabling daily scoring vs. weekly
• Built customer lifetime value model used by retention call centre for priority queuing
• Delivered A/B testing framework for retention offer experiments; ran 15+ tests in 18 months
• Collaborated with BI team to productionise models via Azure ML Pipelines
• Presented model findings to VP Customer Base Management quarterly

Junior Data Scientist — Mediaset (broadcasting), Milan (September 2019 – February 2021)
• Recommendation system for content personalisation (collaborative filtering + content-based)
• Audience segmentation using k-means and DBSCAN on viewing behaviour data
• Python/pandas pipeline for processing 2B daily viewing events from streaming platform

EDUCATION
PhD Applied Mathematics — Politecnico di Milano (2016 – 2019) | Thesis: Stochastic methods for customer churn prediction in large-scale telecoms networks
MSc Mathematical Engineering — Politecnico di Milano (2013 – 2016) | 110/110 with honours

SKILLS
Languages: Python (expert), R (proficient), SQL (advanced), Scala (basic)
ML: LightGBM, XGBoost, scikit-learn, PyTorch (basics), Optuna, SHAP, CausalML
MLOps: Azure ML, MLflow, Docker, GitHub Actions, Great Expectations
Big Data: PySpark, Azure Databricks, Kafka (consumer basics)
BI: Tableau, Power BI, Plotly Dash

LANGUAGES
Italian (native), English (fluent/C2), French (basic/A2)`,
    summary: `PhD data scientist with directly relevant telecoms churn experience at Vodafone Italy (30M customers, AUC 0.91). Technical skills are a precise match. The main concern is the Italy-to-Belgium relocation and the very limited French (A2) in a bilingual company context.`,
    strengths: ['PhD Applied Mathematics — deep statistical foundation', 'Direct Vodafone telecoms churn experience — exact domain match', 'AUC 0.91 churn model on 30M customers — world-class performance', 'A/B testing framework for retention experiments', 'Kaggle Competition Master — proven modelling skills'],
    weaknesses: ['Based in Milan — relocation to Brussels required', 'French only A2 — significant barrier at Proximus (NL/FR company)', 'Limited Dutch (none mentioned) — mandatory for NL-language environment'],
    skills: ['Python', 'LightGBM', 'XGBoost', 'scikit-learn', 'Azure ML', 'MLflow', 'PySpark', 'SQL', 'SHAP', 'CausalML', 'PyTorch', 'Optuna', 'Tableau'],
    experience: '4 ans: Data Scientist chez Vodafone Italy (3 ans) — churn 30M klanten, AUC 0.91. Junior DS chez Mediaset (1,5 an) — recommandatiesysteem, publieksegmentatie.',
    education: 'PhD Applied Mathematics, Politecnico di Milano, 2019. MSc Mathematical Engineering, Politecnico di Milano, 2016, 110/110 cum laude.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 2,
  },

  {
    firstName: 'Jana',
    lastName: 'Kovářová',
    email: 'jana.kovarova@seznam.cz',
    phone: '+420 775 234 567',
    cvContent: `JANA KOVÁŘOVÁ
jana.kovarova@seznam.cz | +420 775 234 567 | Prague, Czech Republic (open to remote/Brussels)
linkedin.com/in/janakovarova-ds

PROFESSIONAL SUMMARY
Senior Data Scientist with 6 years of experience in customer analytics, churn modelling, and machine learning. Led data science team of 3 at T-Mobile Czech Republic. Strong expertise in causal inference and uplift modelling for retention campaigns. Open to relocation within Europe.

EXPERIENCE

Lead Data Scientist — Customer Analytics — T-Mobile Czech Republic, Prague (February 2020 – present)
• Lead a team of 3 data scientists focused on churn prediction, retention propensity, and campaign targeting
• Built uplift model (causal forest) for retention campaigns: improved campaign ROI by 42% vs. standard propensity model
• Deployed churn model using Azure ML + Databricks — scoring 5M customers weekly
• Implemented A/B testing infrastructure integrated with campaign management system (Adobe Campaign)
• Presented model results and strategic recommendations to CCO and customer base management director

Senior Data Scientist — Home Credit, Prague (March 2017 – January 2020)
• Credit risk and behavioural scoring models for consumer lending portfolio
• PD (Probability of Default) and LGD models using logistic regression, decision trees, gradient boosting
• Basel III/IV compliant model documentation and regulatory validation

EDUCATION
MSc Statistics — Charles University Prague (2015 – 2017) | Summa cum laude
BSc Computer Science — Czech Technical University Prague (2012 – 2015)

SKILLS
Python: scikit-learn, LightGBM, XGBoost, CausalML, EconML, lifelines, MLflow, SHAP
Platforms: Azure ML, Azure Databricks, Google BigQuery
SQL, PySpark, R (proficient)
Causal inference: uplift modelling, DID, propensity score matching

LANGUAGES
Czech (native), Slovak (native), English (fluent/C2), German (B2), French (A2)`,
    summary: `Lead data scientist at T-Mobile Czech with exact telecoms churn domain match and advanced uplift/causal inference skills that go beyond the role requirements. Strong team leadership experience. Prague-to-Brussels relocation required; French is very basic.`,
    strengths: ['Direct telecoms churn experience (T-Mobile, 5M customers)', 'Uplift modelling and causal inference — above-and-beyond skill', '42% campaign ROI improvement — exceptional measurable impact', 'Team leadership (3 data scientists)', 'Credit risk modelling background at Home Credit — financial domain too'],
    weaknesses: ['Prague-to-Brussels relocation required', 'French A2 in a NL/FR company — potential barrier', 'German B2 more useful than French for Belgium if NL is absent'],
    skills: ['Python', 'LightGBM', 'XGBoost', 'CausalML', 'EconML', 'lifelines', 'MLflow', 'SHAP', 'Azure ML', 'Databricks', 'SQL', 'PySpark', 'Uplift modelling'],
    experience: '6 ans: Lead Data Scientist chez T-Mobile CZ (4 ans) — team van 3, churn 5M klanten. Senior DS chez Home Credit Prague (3 jaar) — credit risk, PD/LGD modellen.',
    education: 'MSc Statistics, Charles University Prague, 2017, summa cum laude. BSc Computer Science, Czech Technical University, 2015.',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 2,
  },

  {
    firstName: 'Kevin',
    lastName: 'Desmet',
    email: 'kevin.desmet@hotmail.com',
    phone: '+32 492 556 778',
    cvContent: `KEVIN DESMET
kevin.desmet@hotmail.com | +32 492 556 778 | Gent, België

PROFIEL
Data Analyst met 4 jaar ervaring in business intelligence en rapportage. Basiskennis van machine learning via zelfstudie en online cursussen. Wil overstappen naar een data science rol. Geen productie-ML-ervaring maar sterk in SQL, Excel en dashboardbouw.

WERKERVARING

Senior Data Analyst — Bpost, Brussel (februari 2021 – heden)
• Bouw en onderhoud van Power BI-dashboards voor operationeel management (sorteerprestaties, leveringstijden)
• SQL-queries schrijven op Oracle-datawarehouse voor ad-hoc analyses
• Maandelijkse rapportage aan directie over KPI's
• Basisanalyse van klantklachtendata

Data Analyst — Ghent University Hospital, Gent (augustus 2019 – januari 2021)
• Analyse van patiëntstroomdata in Excel en Power BI
• Opstellen van wekelijkse bezettingsrapporten
• Dataopschoning van medische datasets in Python/pandas

OPLEIDING
Bachelor Toegepaste Informatica — Hogeschool Gent (2016 – 2019) | Onderscheiding

ZELFSTUDIE / CURSUSSEN
Google Machine Learning Crash Course (2023)
Coursera: Machine Learning Specialization (Andrew Ng) — in uitvoering
DataCamp: Python for Data Science (2022)

VAARDIGHEDEN
Sterke vaardigheden: SQL, Power BI, Excel (gevorderd), Python/pandas (basis)
ML (zelfstudie): scikit-learn basiskennis, lineaire regressie, beslissingsbomen
Talen: Nederlands (moedertaal), Engels (B2), Frans (B1)`,
    summary: `Data analyst met BI-achtergrond en zelfstudiekennis van ML. Ruim onvoldoende voor een senior Data Scientist rol bij Proximus die een master/PhD en productioncML-ervaring vereist. Interessant profiel voor een junior data analyst positie maar niet voor deze vacature.`,
    strengths: ['Sterke SQL en Power BI vaardigheden', 'Gemotiveerd voor bijscholing (cursussen Coursera, Google)', 'Belgische kandidaat'],
    weaknesses: ['Geen master of PhD — minimumvereiste niet gehaald', 'Geen productie ML-ervaring — enkel zelfstudie', 'Geen churnmodellering, Azure ML of geavanceerde Python ML-bibliotheken', 'Bachelor-niveau vs. master/PhD vereist', 'Geen XGBoost, LightGBM of MLOps ervaring'],
    skills: ['SQL', 'Power BI', 'Excel', 'Python/pandas basics', 'scikit-learn basics', 'Oracle'],
    experience: '4 jaar: Senior Data Analyst bij Bpost (3 jaar) — BI, Power BI, SQL. Data Analyst bij UZ Gent (1,5 jaar) — patiëntstroomdata.',
    education: 'Bachelor Toegepaste Informatica, Hogeschool Gent, 2019.',
    recommendation: 'no',
    language: 'nl',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 2,
  },

  {
    firstName: 'Hilde',
    lastName: 'Raes',
    email: 'hilde.raes@ugent.be',
    phone: '+32 475 223 446',
    cvContent: `HILDE RAES
hilde.raes@ugent.be | +32 475 223 446 | Gent, België
linkedin.com/in/hilderaes-datascience | researchgate.net/profile/Hilde-Raes

PROFIEL
Postdoctoraal onderzoeker en data scientist met 7 jaar ervaring in statistisch modelleren en machine learning, waarvan 3 jaar in industriële context. Expert in survival analysis, Bayesiaanse methoden en interpreteerbare ML. Wil de stap zetten van academisch onderzoek naar applied data science in een zakelijke omgeving.

ERVARING

Postdoctoraal Onderzoeker / Data Scientist (deeltijds) — UGent & Telenet Research (2022 – heden)
• Samenwerkingsproject UGent × Telenet: churn- en opzeggingspredictie voor Telenet-klanten
• Ontwikkeling van Bayesiaans hierarchisch model voor klantsegmentspecifieke churndrempels
• Bewezen voordeel t.o.v. standaard gradient boosting: +5% AUC op dunne datasegmenten
• Publicatie in Journal of Marketing Analytics (2024): "Hierarchical Bayesian Churn Models in Telecoms"
• Python-implementatie: PyMC, arviz, lifelines, scikit-learn

PhD Datawetenschappen — UGent (2018 – 2022)
Thesis: Bayesian survival models for customer lifetime value in subscription services
• 4 peer-reviewed publicaties; keynote op RecSys 2021

OPLEIDING
PhD Datawetenschappen — UGent (2018 – 2022) | Cum laude
Master Statistiek — UGent (2016 – 2018) | Grootste onderscheiding

TECHNISCHE VAARDIGHEDEN
Python: PyMC, lifelines, scikit-learn, LightGBM, pandas, NumPy, SHAP
Platforms: Azure ML (recent — Telenet-project), Jupyter, VS Code
Methodes: Bayesiaanse statistiek, survival analysis, uplift modelling, mixed-effects models
Talen: Nederlands (moedertaal), Engels (vloeiend/C2), Frans (B1)`,
    motivationText: `Geachte,

Na 7 jaar statistisch onderzoek — waaronder een 2-jaar durend samenwerkingsproject met Telenet over churnmodellering — ben ik klaar voor de definitieve stap naar de industrie. De vacature bij Proximus is de perfecte brug.

Mijn profiel is enigszins atypisch: ik kom uit de academische wereld maar heb de afgelopen 2 jaar al in een industrieel project gewerkt aan exact het probleem dat jullie beschrijven — churnpreventie in telecom. Mijn aanpak is methodologisch strenger dan de gemiddelde data scientist, wat zowel een sterkste als een uitdaging kan zijn (ik besteed meer tijd aan onzekerheidskarakterisering dan de meeste teams).

Ik geloof dat de combinatie van Bayesiaanse methoden en standaard gradient boosting die ik bij Telenet heb gevalideerd, waardevol zou zijn voor Proximus.

Met vriendelijke groet,
Hilde Raes`,
    summary: `Uitzonderlijk methodologisch profiel: PhD datawetenschappen, postdoc bij UGent met actief Telenet-churnproject, publicatie in Journal of Marketing Analytics. Academische achtergrond vraagt aanpassingsperiode naar business tempo maar de technische diepgang is zeldzaam.`,
    strengths: ['PhD + postdoc met directe telecom churnervaring (Telenet)', 'Bayesiaanse methoden — zeldzame diepgang voor business data science', 'Peer-reviewed publicaties inclusief telecom churn paper', 'Azure ML recente ervaring via Telenet-project', 'Survival analysis expert — exact de gevraagde methodologie'],
    weaknesses: ['Academische achtergrond — aanpassing aan business tempo vereist', 'Nog nooit voltijds in industriële omgeving gewerkt', 'Beperkte MLOps en productie-engineering ervaring', 'Frans slechts B1 in Proximus bilingue context'],
    skills: ['Python', 'PyMC', 'lifelines', 'LightGBM', 'scikit-learn', 'SHAP', 'Azure ML', 'Bayesian statistics', 'Survival analysis', 'Uplift modelling'],
    experience: '3 jaar industrieel (deeltijds): Postdoc & Data Scientist UGent × Telenet (2 jaar) — Bayesiaans churnmodel telecom. PhD UGent (4 jaar) — 4 publicaties, survival models CLV.',
    education: 'PhD Datawetenschappen, UGent, 2022, cum laude. Master Statistiek, UGent, 2018, grootste onderscheiding.',
    recommendation: 'yes',
    language: 'nl',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 2,
  },

  {
    firstName: 'Diego',
    lastName: 'Fernández',
    email: 'diego.fernandez.ds@gmail.com',
    phone: '+34 655 789 012',
    cvContent: `DIEGO FERNÁNDEZ
diego.fernandez.ds@gmail.com | +34 655 789 012 | Barcelona, Spain
linkedin.com/in/diegofernandez-machinelearning

PROFIEL
Machine Learning Engineer / Data Scientist met 3 jaar ervaring in aanbevelingssystemen en NLP. Werkt bij Telefónica Tech maar is nog niet in een churn- of retention-modelleringsrol geweest. Sterke Python en deep learning vaardigheden.

WERKERVARING

Machine Learning Engineer — Telefónica Tech, Barcelona (september 2021 – heden)
• Ontwikkeling en implementatie van NLP-modellen voor klantenserviceautomatisering (intent classification, slot filling)
• BERT-gebaseerde modellen getraind op Spaanse en Engelse klantinteracties
• Deployment op Azure ML + Kubernetes; model serving via FastAPI
• Monitoring van modelkwaliteit (concept drift, data drift) via Azure Monitor

Junior Data Scientist — Glovo, Barcelona (juni 2020 – augustus 2021)
• Aanbevelingssysteem voor restaurants: collaborative filtering + content-based hybride model
• A/B-testen van aanbevelingsalgoritmen
• Feature engineering op order-, locatie- en gedragsdata

OPLEIDING
Master of Science in Artificial Intelligence — Universitat Politècnica de Catalunya (2018 – 2020) | Cum laude
Bachelor Informatica — Universitat Autònoma de Barcelona (2014 – 2018)

VAARDIGHEDEN
Python: PyTorch, Transformers (HuggingFace), scikit-learn, pandas, FastAPI
MLOps: Azure ML, Kubernetes, Docker, MLflow, GitHub Actions
NLP: BERT, GPT-based models, NER, intent classification
Klassieke ML: basiskennis churn modellen (zelfstudie)
Talen: Spaans (moedertaal), Engels (C1), Katalaans (moedertaal), Nederlands (A1)`,
    summary: `ML Engineer met sterke deep learning en NLP-vaardigheden maar zonder churnmodellering of klantgedragsanalyse-ervaring. Het profiel past eerder bij een NLP/ML engineer rol dan bij een customer analytics data scientist positie. Relocatie Barcelona → Brussel + geen Nederlands zijn bijkomende drempels.`,
    strengths: ['Sterke Azure ML + MLOps productie-ervaring', 'NLP en deep learning expertise (BERT, Transformers)', 'MSc Artificial Intelligence cum laude', 'Telefónica-verbinding — telecomsector exposure'],
    weaknesses: ['Geen churn, CLV of klantgedragsmodellering ervaring', 'NLP/deep learning focus vs. gevraagde gradient boosting tabular data skills', 'Geen survival analysis of causal inference kennis', 'Gebaseerd in Barcelona — relocatie vereist', 'Nederlands enkel A1'],
    skills: ['Python', 'PyTorch', 'Transformers', 'HuggingFace', 'scikit-learn', 'Azure ML', 'Kubernetes', 'Docker', 'MLflow', 'FastAPI', 'NLP', 'BERT'],
    experience: '3 jaar: ML Engineer bij Telefónica Tech Barcelona (3 jaar) — NLP-modellen, productie deployment. Junior DS bij Glovo (1 jaar) — aanbevelingssysteem.',
    education: 'MSc Artificial Intelligence, UPC Barcelona, 2020, cum laude. BSc Informatica, UAB, 2018.',
    recommendation: 'maybe',
    language: 'en',
    status: 'new',
    source: 'upload',
    vacancyIndex: 2,
  },

  // ── Vacancy 3: Financial Controller – UCB ─────────────────────────────────

  {
    firstName: 'Catherine',
    lastName: 'Wilmots',
    email: 'catherine.wilmots@gmail.com',
    phone: '+32 476 334 556',
    cvContent: `CATHERINE WILMOTS
catherine.wilmots@gmail.com | +32 476 334 556 | Brussels, Belgium
linkedin.com/in/catherinewilmots-finance

PROFESSIONAL SUMMARY
Financial Controller and FP&A professional with 9 years of experience in pharmaceutical and biotech companies, including 5 years at UCB. Expert in R&D cost accounting, clinical trial accruals, SAP CO/FI, and Anaplan financial modelling. ACCA qualified. Bilingual English/French with strong Dutch.

EXPERIENCE

Senior Financial Controller — R&D Immunology — UCB, Brussels (March 2019 – present)
• Business finance partner for 2 immunology therapeutic area heads and R&D Operations (total budget: €240M)
• Own monthly close for R&D Immunology: accruals (clinical CRO contracts €80M+), provisions, intercompany, variance analysis
• Built Anaplan planning model for R&D Immunology budget — reduced quarterly forecast cycle from 6 weeks to 3 weeks
• Prepared and presented monthly management accounts to R&D Leadership team and Group Finance
• Led IFRS 16 implementation for R&D facilities; coordinated with external KPMG audit team
• Managed process improvement initiative: standardised accrual methodology across 4 R&D business units (savings: 2 FTE equivalent)
• Mentored 2 junior controllers; conducted quarterly performance reviews

Financial Controller — FP&A — Janssen Pharmaceutica (J&J), Beerse (January 2015 – February 2019)
• Financial controller for Manufacturing Finance: €180M COGS budget across 3 Beerse production sites
• Monthly variance analysis vs. budget; root cause analysis presented to VP Manufacturing Finance
• Led standard cost setting process (annual, 3-month cycle): coordination across 8 product families
• SAP CO module administration: cost centre hierarchies, activity type maintenance, settlement rules
• Supported external J&J Corporate Finance audit and SOX compliance reviews

Audit Associate — PricewaterhouseCoopers, Brussels (September 2012 – December 2014)
• Statutory audit for pharma, industrial, and financial services clients (2–3 clients simultaneously)
• IFRS technical file preparation (IAS 36 impairment, IAS 37 provisions, IFRS 15 revenue recognition)
• Team of 4–6 per engagement; reported to Senior Manager

EDUCATION
Master of Commercial Engineering — KU Leuven (2010 – 2012) | Cum laude
Bachelor Applied Economics — KU Leuven (2007 – 2010) | Distinction

PROFESSIONAL QUALIFICATIONS
ACCA Qualified (2016) | Member of the Institute of Chartered Accountants (ICAEW affiliate)
SAP CO/FI Advanced Certification (2018)
Anaplan Level 2 Certified Planner (2021)

SKILLS
Systems: SAP CO/FI (expert), Anaplan (Level 2), Oracle EPM (basic), Hyperion (basic), Power BI
IFRS: IAS 36, IAS 37, IFRS 15, IFRS 16, R&D capitalisation (IAS 38)
Processes: monthly close, accruals, provisions, budget, rolling forecast, variance analysis, SOX

LANGUAGES
French (native), English (fluent/C2), Dutch (good/B2), German (basic/A2)`,
    motivationText: `Dear UCB Hiring Team,

I am applying for the Financial Controller – R&D Operations role, and I should mention upfront: I currently hold the Senior Financial Controller position for R&D Immunology at UCB. I am applying for the R&D Operations role because it offers broader scope (Operations as well as R&D) and would deepen my experience in the manufacturing-adjacent finance domain — which is where I started my career at Janssen.

My current role has given me deep familiarity with UCB's systems (SAP, Anaplan), processes, and stakeholders. I can contribute immediately without a ramp-up period. The R&D Immunology programme's clinical accruals work (€80M+ in CRO contracts) is directly analogous to the R&D Operations scope.

I have already spoken informally with my manager about this internal move, and they are supportive of my development.

Best regards,
Catherine Wilmots`,
    summary: `Exceptional internal UCB candidate with 5 years in R&D Immunology Controller role at UCB + prior Janssen pharma finance experience. ACCA qualified, SAP and Anaplan expert, deep IFRS R&D accounting knowledge. Internal move — zero ramp-up required. Strongest profile in the pipeline.`,
    strengths: ['Currently at UCB — zero ramp-up, knows systems/processes/people', '9 years pharma finance (UCB + Janssen) — direct domain match', 'ACCA + SAP CO/FI + Anaplan Level 2 — full qualifications match', 'Clinical trial accruals expertise (CRO contracts €80M+)', 'Management accounts presentation to R&D leadership — exact experience'],
    weaknesses: ['Internal transfer may require HR process coordination', 'Salary expectations may be at top of range given seniority'],
    skills: ['SAP CO/FI', 'Anaplan', 'IFRS', 'R&D accruals', 'FP&A', 'Variance analysis', 'Monthly close', 'Power BI', 'ACCA', 'SOX compliance', 'Clinical trial accounting'],
    experience: '9 ans: Senior Financial Controller R&D chez UCB Brussels (5 ans) — €240M budget, Anaplan, KPMG coordination. Financial Controller chez Janssen/J&J Beerse (4 ans) — Manufacturing Finance €180M. Audit Associate chez PwC Brussels (2,5 ans).',
    education: 'Master Commercial Engineering, KU Leuven, 2012, cum laude. BSc Applied Economics, KU Leuven, 2010. ACCA (2016).',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 3,
  },

  {
    firstName: 'Bart',
    lastName: 'Claessens',
    email: 'bart.claessens@outlook.be',
    phone: '+32 474 445 668',
    cvContent: `BART CLAESSENS
bart.claessens@outlook.be | +32 474 445 668 | Mechelen, België
linkedin.com/in/bartclaessens-finance

PROFIEL
Financial Controller met 6 jaar ervaring, waarvan 4 jaar in de farmasector. Sterk in maandafsluiting, budgetbeheer en rapportering. SAP FI/CO gebruiker. CIMA-student (lopend). Zoekt een senior controlling rol bij een groot farmaceutisch bedrijf.

WERKERVARING

Financial Controller — Commercial Finance — AstraZeneca België, Brussel (januari 2021 – heden)
• Maandelijkse afsluiting voor de Belgische commerciële entiteit (omzet €380M)
• Budgetopvolging en kwartaalforecast voor commercieel team (marketing, sales, market access)
• Rapportage aan Country Finance Director en Europese FP&A-hub in Cambridge
• Coördinatie met externe auditors (Deloitte) bij halfjaarlijkse en jaarlijkse auditcyclus
• Beheer van commerciële accruals en provisions conform IFRS 15

Financial Analyst — General Ledger — Pfizer Belgium, Brussel (maart 2018 – december 2020)
• Boekingen van aankopen, voorzieningen en herwaarderingen in SAP FI
• Opstelling van maandelijkse balans- en resultatenrekening-analyses
• Ondersteuning bij SOX-testprocedures

OPLEIDING
Master Bedrijfskunde — Universiteit Antwerpen (2015 – 2017) | Onderscheiding
Bachelor Accountancy en Fiscaliteit — Hogeschool PXL Hasselt (2012 – 2015) | Grote onderscheiding

PROFESSIONELE KWALIFICATIES
CIMA (Chartered Institute of Management Accountants) — in opleiding, verwacht certificaat 2026
SAP FI/CO — gebruikersniveau

VAARDIGHEDEN
Systemen: SAP FI/CO (gebruiker), Excel gevorderd, Power BI basiskennis
IFRS: IFRS 15 (ervaring), IAS 37 (basiskennis), overige IFRS normen in studie
Processen: maandafsluiting, budgetopvolging, forecast, rapportage, audit ondersteuning
Talen: Nederlands (moedertaal), Engels (C1), Frans (B2)`,
    summary: `Solide farmacontroller met 6 jaar ervaring bij AstraZeneca en Pfizer. Goede basis in maandafsluiting, accruals en farmarapportage. Mist echter de R&D-specifieke ervaring (klinische studies, CRO-accruals), Anaplan-kennis en de senior business partner kwaliteiten die UCB zoekt. CIMA nog niet afgerond.`,
    strengths: ['6 jaar farma finance (AstraZeneca + Pfizer) — sectorrelevant', 'IFRS 15 accruals ervaring', 'Coördinatie met Big 4 auditors (Deloitte)', 'Belgische kandidaat — geen verhuis nodig'],
    weaknesses: ['Commercieel finance vs. gevraagd R&D finance — ander domein', 'Geen Anaplan — gevraagd planning tool', 'Geen R&D-accruals of klinische studie-boekhoudervaring', 'CIMA nog niet afgerond — professional qualification onvolledig', 'Business partner skills niet aangetoond — meer rapporterende dan adviserende rol'],
    skills: ['SAP FI/CO', 'IFRS 15', 'IAS 37', 'Monthly close', 'Budget tracking', 'Forecast', 'Excel advanced', 'Power BI basics', 'SOX'],
    experience: '6 jaar: Financial Controller bij AstraZeneca België (3 jaar) — commercieel finance €380M. Financial Analyst bij Pfizer Belgium (2,5 jaar) — GL, SAP FI. ',
    education: 'Master Bedrijfskunde, UAntwerpen, 2017. Bachelor Accountancy & Fiscaliteit, PXL Hasselt, 2015. CIMA in opleiding.',
    recommendation: 'maybe',
    language: 'nl',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 3,
  },

  {
    firstName: 'Isabelle',
    lastName: 'Marchand',
    email: 'isabelle.marchand@finance.be',
    phone: '+32 477 667 889',
    cvContent: `ISABELLE MARCHAND
isabelle.marchand@finance.be | +32 477 667 889 | Braine-l'Alleud, Belgique
linkedin.com/in/isabellemarchand-cfo

PROFIL PROFESSIONNEL
Finance Director et contrôleur de gestion senior avec 15 ans d'expérience dans l'industrie pharmaceutique et les dispositifs médicaux. Expertise approfondie en IFRS, modélisation financière et business partnering. CPA belge et ACCA qualifiée. Cherche à revenir à un rôle de contributeur individuel senior après une période de direction d'équipe.

EXPÉRIENCE

Finance Director — R&D & Medical Affairs — GSK Vaccines (Pfizer), Wavre (janvier 2018 – présent)
• Direction d'une équipe de 5 contrôleurs financiers pour les divisions R&D Vaccins et Medical Affairs
• Responsable du budget R&D Vaccins Belgique: €420M (essais cliniques, manufacturing R&D, regulatory)
• Business partner du Chief Scientific Officer et du SVP Medical Affairs
• Présentation mensuelle au Board Finance de GSK EMEA
• Implémentation d'Oracle EPM Planning pour le processus budgétaire R&D — réduction du cycle de 9 à 5 semaines

Senior Financial Controller — R&D — UCB, Bruxelles (mars 2013 – décembre 2017)
• Contrôleur R&D Neurologie et Immunologie: budget €180M
• Accruals d'essais cliniques (CRO), provisions IAS 37, capitalisation R&D IAS 38
• Partenariat avec les équipes scientifiques pour le suivi financier des programmes de développement

Contrôleur de Gestion — Baxter International, Lessines (2010 – 2013)
Senior Auditor — Ernst & Young, Bruxelles (2007 – 2010)

FORMATION
Master en Sciences Économiques — UCLouvain (2005 – 2007) | Grande distinction
Licence en Comptabilité — EPHEC Bruxelles (2002 – 2005)

QUALIFICATIONS
ACCA Qualified (2012) | CPA Belge (IRE, 2011)
Oracle EPM Planning (certifiée)
SAP CO/FI (expert)

LANGUES
Français (natif), Anglais (C2), Néerlandais (B1)`,
    summary: `Très expérimentée — 15 ans dont ancienne UCB R&D Controller et actuelle Finance Director GSK. Surqualifiée pour un poste de Financial Controller: elle manage une équipe de 5 et un budget €420M. Intéressant si UCB cherche à upgrader le rôle, mais risque de départ rapide si le poste est trop opérationnel.`,
    strengths: ['15 ans pharma finance incluant ancienne UCB R&D Controller (connaissance de la culture)', 'ACCA + CPA Belge + Oracle EPM + SAP CO/FI — qualifications complètes', 'Business partner C-suite (CSO, SVP) — senior stakeholder influence', 'Clinical trial accruals et IAS 38 capitalisation expertise', 'Véritable expertise €420M R&D budget management'],
    weaknesses: ['Potentiellement surqualifiée — Finance Director niveau vs. Controller role', 'Néerlandais seulement B1 dans un contexte NL/FR', 'Risque de départ rapide si le poste ne correspond pas au niveau de responsabilité attendu', 'Anaplan non mentionné — UCB utilise Anaplan'],
    skills: ['SAP CO/FI', 'Oracle EPM Planning', 'ACCA', 'IFRS', 'R&D accruals', 'Clinical trial accounting', 'IAS 38', 'Budget management', 'FP&A', 'Team management'],
    experience: '15 ans: Finance Director R&D chez GSK Vaccines Wavre (6 ans) — équipe 5 contrôleurs, €420M budget. Senior Financial Controller R&D chez UCB Bruxelles (5 ans). Contrôleur chez Baxter (3 ans). Senior Auditor chez EY (3 ans).',
    education: 'Master Sciences Économiques, UCLouvain, 2007, grande distinction. ACCA (2012). CPA Belge (2011).',
    recommendation: 'yes',
    language: 'fr',
    status: 'reviewing',
    source: 'upload',
    vacancyIndex: 3,
  },

  {
    firstName: 'Tim',
    lastName: 'Baert',
    email: 'tim.baert@student.ugent.be',
    phone: '+32 469 001 223',
    cvContent: `TIM BAERT
tim.baert@student.ugent.be | +32 469 001 223 | Gent, België

OPLEIDING
Master Handelswetenschappen (specialisatie Accountancy & Finance) — UGent (2022 – 2024, afstuderen september 2024)
Thesis: IFRS 15 en omzetherkenning in de farmaceutische sector: een casestudie van UCB (score: 16/20)
Bachelor Handelswetenschappen — UGent (2019 – 2022) | Onderscheiding

STAGE-ERVARING
Finance Intern — GSK Consumer Healthcare, Brussel (februari – augustus 2024)
• Assistentie bij maandafsluiting: journaalboekingen in SAP FI, reconciliaties
• Opstelling van management reporting templates in Excel
• Begeleiding bij interne audit procedures (SOX narratieven)
• Basiskennis SAP FI opgedaan via OJT

Student-job — Accountantskantoor Van Den Berghe, Gent (zomers 2022, 2023)
• Boekhouding voor KMO-klanten, BTW-aangiften, jaarrekeningen

VAARDIGHEDEN
Financieel: IFRS basis (via opleiding), SAP FI (stage niveau), Excel gevorderd
Talen: Nederlands (moedertaal), Engels (B2), Frans (B1)

EXTRACURRICAIRE ACTIVITEITEN
Penningmeester Studentenraad UGent Handelswetenschappen (2022 – 2023)`,
    summary: `Recente masterstudent met een interessante thesis over UCB en IFRS 15, maar zonder de vereiste 5+ jaar ervaring. Geschikt voor een junior/stagiair financieel profiel maar duidelijk niet voor een senior Financial Controller rol bij UCB.`,
    strengths: ['UCB-gerelateerde thesis — toont interesse in het bedrijf', 'SAP FI basiskennis via stage', 'GSK stage — farmasector exposure'],
    weaknesses: ['Net afgestudeerd — 5+ jaar ervaring niet gehaald', 'Geen business partnering of senior stakeholder ervaring', 'Geen Anaplan, geen managementrapportage ervaring op seniorniveau', 'Geen ACCA of professionele kwalificatie'],
    skills: ['SAP FI basics', 'Excel advanced', 'IFRS basics', 'SOX basics', 'Journal entries'],
    experience: 'Stage GSK Consumer Healthcare (6 maanden, 2024). Studentenjob accountantskantoor (2 zomers).',
    education: 'Master Handelswetenschappen (Accountancy & Finance), UGent, 2024. Bachelor Handelswetenschappen, UGent, 2022.',
    recommendation: 'no',
    language: 'nl',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 3,
  },

  {
    firstName: 'Luca',
    lastName: 'Bianchi',
    email: 'luca.bianchi.cfo@gmail.com',
    phone: '+39 339 876 5432',
    cvContent: `LUCA BIANCHI
luca.bianchi.cfo@gmail.com | +39 339 876 5432 | Milan, Italy (open to Brussels)
linkedin.com/in/lucabianchi-pharmafinance

PROFESSIONAL SUMMARY
Financial Controller with 7 years of pharmaceutical finance experience at multinational companies. Specialised in R&D controlling, clinical programme finance, and IFRS compliance. Currently at Novartis Milan. Open to international relocation — worked in Italy, Switzerland, and completed an 18-month secondment in Basel.

EXPERIENCE

Senior Financial Controller — Oncology R&D — Novartis, Milan / Basel (April 2019 – present)
• Business finance partner for Oncology R&D leadership: €320M clinical development budget
• Monthly close: clinical trial accruals (CRO payments, site fees, investigator costs), milestone provisions, intercompany
• Built Anaplan planning model for Oncology R&D forecasting — adopted group-wide by 3 other therapy areas
• Led IFRS 16 lease accounting implementation for Novartis Italy research facilities (€28M right-of-use assets)
• External audit interface: EY Italy and EY Basel teams; SOX 404 compliance
• 18-month secondment to Novartis Basel Group Finance (2021 – 2022)

Financial Controller — Manufacturing Finance — Roche Diagnostics, Milan (February 2015 – March 2019)
• Standard cost setting for 45 diagnostic product families; annual cycle coordination
• Monthly COGS variance analysis and capacity utilisation reporting
• SAP CO/PP module for production order settlements

EDUCATION
MSc Finance & Accounting — Università Bocconi, Milan (2013 – 2015) | 110/110 with honours
BSc Business Administration — Università degli Studi di Milano (2010 – 2013)

PROFESSIONAL QUALIFICATIONS
ACCA Qualified (2018) | Dottore Commercialista (Italian CPA equivalent, 2017)
Anaplan Level 3 Certified Model Builder (2022) — highest Anaplan certification level
SAP CO/FI (expert), Oracle Hyperion (intermediate)

SKILLS
Systems: SAP CO/FI (expert), Anaplan (Level 3 — highest), Oracle Hyperion, Power BI (intermediate)
IFRS: IAS 38, IAS 37, IFRS 16, IFRS 15, group consolidation
Domains: R&D controlling, clinical trial accruals, CRO contract finance, manufacturing cost accounting

LANGUAGES
Italian (native), English (fluent/C2), French (good/B2), German (good/B2)`,
    motivationText: `Dear UCB Finance Team,

I am applying for the Financial Controller – R&D Operations role at UCB from my current position at Novartis Milan, where I have spent the last 5 years as the finance business partner for Oncology R&D.

The alignment with your requirements is strong: I have hands-on Anaplan model building experience (Level 3 certified — the highest certification), extensive clinical trial accruals expertise (CRO contracts, investigator payments, milestone provisions), and I have worked directly with KPMG/EY audit teams on IFRS-compliant R&D cost accounting.

UCB specifically interests me because of its focused therapeutic area strategy (neurology and immunology) — very similar to the Novartis portfolio I currently support. I also have Brussels connections (my partner is Belgian) and would relocate without hesitation.

I am available for a first conversation at your convenience.

Best regards,
Luca Bianchi`,
    summary: `Strong R&D Financial Controller from Novartis Oncology with direct clinical trial accruals experience, Anaplan Level 3 certification, ACCA qualification, and excellent language profile (EN/FR/DE). Very close match to requirements; relocation from Milan is the only practical consideration.`,
    strengths: ['7 years pharma R&D finance — Novartis Oncology clinical budget €320M', 'Anaplan Level 3 (highest certification) — built models adopted group-wide', 'ACCA + Italian CPA — dual professional qualification', 'Clinical trial accruals expert (CRO, site fees, investigator costs)', 'French B2 + German B2 — excellent language profile for Belgium'],
    weaknesses: ['Based in Milan — relocation required (motivated: partner is Belgian)', 'No direct UCB systems experience (UCB-specific SAP configuration)'],
    skills: ['SAP CO/FI', 'Anaplan Level 3', 'Oracle Hyperion', 'ACCA', 'IFRS', 'R&D accruals', 'Clinical trial finance', 'IAS 38', 'IFRS 16', 'Power BI', 'SOX 404'],
    experience: '7 ans: Senior Financial Controller R&D chez Novartis Milan/Basel (5 ans) — Oncology R&D €320M, Anaplan. Financial Controller Manufacturing chez Roche Diagnostics (4 ans) — cost accounting.',
    education: 'MSc Finance & Accounting, Bocconi Milan, 2015, 110/110 cum laude. ACCA (2018). Anaplan Level 3 (2022).',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 3,
  },

  // ── Vacancy 4: Digital Marketing Manager – Colruyt Group ──────────────────

  {
    firstName: 'Elien',
    lastName: 'Verschueren',
    email: 'elien.verschueren@gmail.com',
    phone: '+32 475 778 990',
    cvContent: `ELIEN VERSCHUEREN
elien.verschueren@gmail.com | +32 475 778 990 | Aalst, België
linkedin.com/in/elienverschueren-digital

PROFESSIONELE SAMENVATTING
Digital Marketing Manager met 7 jaar ervaring in e-commerce en digitale marketing voor Belgische retailketens. Expert in Google Ads, Meta Ads, e-mailmarketing en loyaliteitsprogramma's. Beheerde een mediabudget van €6,5M bij Carrefour België. Sterk data-gedreven en vertrouwd met GA4, Salesforce Marketing Cloud en Power BI.

WERKERVARING

Digital Marketing Manager — Carrefour Belgium, Evere (februari 2020 – heden)
• Leiding over een team van 4 digitale marketeers voor alle online kanalen (SEA, SEO, e-mail, sociale media, display, app)
• Beheer van een jaarlijks digitaal mediabudget van €6,5M
• ROAS verbeterd van 3,2 naar 5,1 (+59%) door herstructurering van Google Shopping-campagnes en biedstrategieën
• Lancering van de Carrefour-app (NL/FR) marketingstrategie: 450.000 downloads in jaar 1
• Personalisatiestrategie via Salesforce Marketing Cloud: gepersonaliseerde e-mailflows voor 2,1M actieve klanten
• Coördinatie van My Carrefour loyaliteitsprogramma-activaties (cashback, punten, VIP-segmenten) via digitale kanalen
• A/B-testen van e-mailonderwerpen, landingspagina's en displaycreatives; >30 significante tests/jaar
• Rapportage aan CMO via maandelijks digital performance dashboard (Power BI)

Senior Digital Marketing Specialist — Brico, Brussel (januari 2017 – januari 2020)
• Beheer van Google Ads (Search, Shopping, Display) voor 130 Brico-winkels — budget €1,2M
• Introductie van lokale campagnestructuur (campaign per regio) — ROAS +34%
• Implementatie van e-mailautomatisering (Mailchimp → ActiveCampaign migratie)
• SEO-audit en implementatie voor brico.be: organisch verkeer +67% in 18 maanden

OPLEIDING
Master in de Toegepaste Economische Wetenschappen — UGent (2012 – 2014) | Onderscheiding
Bachelor Communicatiemanagement — KHLim Hasselt (2009 – 2012) | Grote onderscheiding

VAARDIGHEDEN
Kanalen: Google Ads (Shopping, Search, Display, PMAX), Meta Ads (Facebook, Instagram), DV360, Criteo
E-mail & CRM: Salesforce Marketing Cloud (Journey Builder, AMPscript), ActiveCampaign, Mailchimp
Analytics: Google Analytics 4, Looker Studio, Power BI, Adobe Analytics (basis)
SEO: technische SEO, contentoptimalisatie, Google Search Console, Semrush
Loyaliteit: ervaring met loyalty-programma's, gepersonaliseerde segmentering, first-party data
Talen: Nederlands (moedertaal), Frans (B2), Engels (C1)`,
    motivationText: `Geachte,

Ik solliciteer naar de functie van Digital Marketing Manager bij Colruyt Group. Na 7 jaar in digitale retail marketing voor Carrefour en Brico, denk ik dat mijn achtergrond een sterke match is met de Colruyt-context.

Wat me aanspreekt bij Colruyt Group is de combinatie van een groot mediabudget, het Xtra-loyaliteitsprogramma en de digitale ambitie van een bedrijf dat altijd pragmatisch is geweest. Ik heb bij Carrefour meegewerkt aan de lancering van My Carrefour — een loyaliteitsactivatie via digitale kanalen — en ik geloof dat mijn ervaring met gepersonaliseerde e-mailflows en loyaliteitsactivaties direct overdraagbaar is.

Mijn sterkste asset: ik ben zowel hands-on als strategisch. Ik kan zelf campagnes bouwen in Google Ads en tegelijk een team van 4 aansturen.

Met vriendelijke groet, Elien Verschueren`,
    summary: `Uitzonderlijk profiel: 7 jaar digitale retail marketing, €6,5M mediabudget, loyaliteitsactivatie-ervaring via Salesforce Marketing Cloud, en een bewezen ROAS-verbetering van 59%. Directe match met vrijwel alle vereisten van de Colruyt-vacature.`,
    strengths: ['7 jaar digitale retailmarketing — directe sectorervaring', '€6,5M mediabudgetbeheer — boven het gevraagde niveau', 'Salesforce Marketing Cloud Journey Builder — exacte tool match', 'Loyaliteitsprogramma-activatie ervaring (My Carrefour)', 'ROAS +59% — aantoonbare campagneoptimalisatieresultaten'],
    weaknesses: ['Komt van directe concurrent Carrefour — kan concurrentiegevoeligheidsdiscussie vereisen', 'Leiding team van 4 — Colruyt zoekt eerder individuele contributor/manager van kleinere scope'],
    skills: ['Google Ads', 'Meta Ads', 'DV360', 'Criteo', 'Salesforce Marketing Cloud', 'GA4', 'Power BI', 'SEO', 'Semrush', 'Loyalty programs', 'A/B testing', 'Adobe Analytics'],
    experience: '7 jaar: Digital Marketing Manager bij Carrefour Belgium (4 jaar) — team van 4, €6,5M budget, loyaliteit. Senior Digital Marketing Specialist bij Brico (3 jaar) — Google Ads €1,2M, SEO.',
    education: 'Master TEW, UGent, 2014. Bachelor Communicatiemanagement, KHLim Hasselt, 2012.',
    recommendation: 'strong_yes',
    language: 'nl',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 4,
  },

  {
    firstName: 'Alexandre',
    lastName: 'Peeters',
    email: 'alexandre.peeters@gmail.com',
    phone: '+32 487 123 456',
    cvContent: `ALEXANDRE PEETERS
alexandre.peeters@gmail.com | +32 487 123 456 | Bruxelles, Belgique
linkedin.com/in/alexandrepeeters-marketing

PROFIL
Digital Marketing Manager bilingue NL/FR avec 6 ans d'expérience dans le retail alimentaire et le FMCG. Maîtrise Google Ads, Meta Ads et e-mail marketing. Habitué à travailler dans un environnement bilingue belge. Solide expérience en gestion de budgets digitaux et en pilotage d'agences.

EXPÉRIENCE

Digital Marketing Manager — Delhaize Belgique, Forest (mars 2021 – présent)
• Gestion des canaux digitaux Delhaize : SEA (€2,1M budget), réseaux sociaux, e-mail (1,3M abonnés), application
• Coordination avec l'équipe CRM pour les campagnes de fidélisation via l'application Plus de Delhaize
• Amélioration du taux d'ouverture des e-mails de 18% à 27% via personnalisation et optimisation des objets
• Gestion de l'agence digitale externe (iProspect) : briefings, suivi de performance, révision mensuelle
• Déploiement de campagnes Meta Ads ciblant les 25–45 ans : coût par acquisition réduit de 32%
• Reporting mensuel des KPI digitaux au Head of Digital et au CMO

Digital Marketing Specialist — Unilever Belgique, Bruxelles (juillet 2018 – février 2021)
• Gestion des campagnes Google Ads et Meta Ads pour les marques Knorr, Dove et Ben & Jerry's
• Coordination de la production de contenu digital avec les agences locales
• Analyse des données de performance via Google Analytics et Nielsen Digital

FORMATION
Master en Marketing — Solvay Brussels School (ULB) (2016 – 2018)
Bachelor en Sciences Commerciales — ICHEC Bruxelles (2013 – 2016) | Distinction

COMPÉTENCES
Canaux : Google Ads (Search, Shopping, PMAX), Meta Ads, e-mail marketing, SEO (base)
CRM : Salesforce Marketing Cloud (utilisateur — pas administrateur), Klaviyo
Analytics : Google Analytics 4, Looker Studio, Meta Business Suite
Fidélisation : campagnes app, push notifications, segmentation CRM
Langues : Français (natif), Néerlandais (C1), Anglais (C1)`,
    summary: `Sterke bilingue digitale marketeer met Delhaize/Unilever achtergrond en directe ervaring met Belgische retailmarketing. Budgetbeheer (€2,1M) iets onder het gevraagde niveau; Salesforce Marketing Cloud enkel gebruikersniveau. Goede kandidaat voor de rol, zeker gezien de perfect bilingue NL/FR competentie.`,
    strengths: ['6 jaar retail digitale marketing (Delhaize + Unilever)', 'Perfect bilingue NL/FR — ideaal voor Colruyt-context', 'Loyaliteitsapp-campagne-ervaring (Plus van Delhaize)', 'E-mail personalisatie resultaten (+9pp open rate)', 'Agentuurcoördinatie (iProspect)'],
    weaknesses: ['€2,1M mediabudget vs. €4M+ gevraagd — lager schaalniveau', 'Salesforce Marketing Cloud enkel gebruikersniveau — geen Journey Builder/AMPscript', 'SEO slechts basis — SEO is een component van de rol', 'Geen A/B testing framework of gestructureerde experimentatie'],
    skills: ['Google Ads', 'Meta Ads', 'Salesforce Marketing Cloud', 'GA4', 'Looker Studio', 'Klaviyo', 'Email marketing', 'CRM segmentation', 'iProspect agency management'],
    experience: '6 ans: Digital Marketing Manager chez Delhaize Belgique (3 ans) — €2,1M SEA, CRM, loyaliteitsapp. Digital Marketing Specialist chez Unilever Belgique (2,5 ans) — Google/Meta Ads voor FMCG.',
    education: 'Master Marketing, Solvay Brussels School ULB, 2018. Bachelor Sciences Commerciales, ICHEC Bruxelles, 2016.',
    recommendation: 'yes',
    language: 'fr',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 4,
  },

  {
    firstName: 'Lies',
    lastName: 'Vermeerbergen',
    email: 'lies.vermeerbergen@hotmail.be',
    phone: '+32 468 334 557',
    cvContent: `LIES VERMEERBERGEN
lies.vermeerbergen@hotmail.be | +32 468 334 557 | Kortrijk, België

PROFIEL
Junior Digital Marketer met 2 jaar ervaring als Google Ads-specialist bij een bureau. Wil de stap zetten naar een in-house marketingfunctie bij een groot retailbedrijf. Sterk in SEA en data-analyse, beperkte ervaring met e-mailmarketing en loyaliteitsprogramma's.

WERKERVARING

Google Ads Specialist — iProspect België, Brussel (september 2022 – heden)
• Beheer van Google Ads-campagnes (Search, Shopping, Display) voor 6 retailklanten — totaalbudget €800K
• Maandelijkse rapportage aan klanten over campagneprestaties
• PMAX-campagnes geïmplementeerd voor 3 klanten — gemiddelde ROAS +22%
• Google Analytics 4 implementatie voor 2 klanten

Stagiair Digital Marketing — Dreamland (Colruyt Group), Halle (februari – juni 2022)
• Ondersteuning van het marketingteam bij sociale media en e-mailcampagnes
• Opvolging van campagneprestaties in Google Analytics

OPLEIDING
Bachelor Digitale Marketing — Howest (Hogeschool West-Vlaanderen), Kortrijk (2019 – 2022) | Onderscheiding

VAARDIGHEDEN
Google Ads (gecertificeerd), Google Analytics 4, Looker Studio, Meta Ads (basis), Mailchimp (basis)
Talen: Nederlands (moedertaal), Engels (B2), Frans (A2)`,
    summary: `Junior Google Ads-specialist met slechts 2 jaar bureauervaring. Duidelijk te junior voor een Digital Marketing Manager rol die minimaal 5 jaar senior ervaring vereist. De Dreamland-stage toont interesse in Colruyt Group maar is onvoldoende als differentiator. Frans A2 is ook een probleem in de bilingue Colruyt-context.`,
    strengths: ['Google Ads gecertificeerd', 'Dreamland (Colruyt Group) stage-ervaring — kennis van de organisatie', 'PMAX-implementatie ervaring'],
    weaknesses: ['2 jaar ervaring vs. minimaal 5 jaar vereist', 'Geen e-mailmarketing, CRM of loyaliteitsplatform ervaring', 'Geen mediabudgetbeheer op grote schaal', 'Frans A2 — onvoldoende voor bilingue Colruyt-omgeving', 'Bureau-ervaring enkel — geen in-house strategisch denken bewezen'],
    skills: ['Google Ads', 'GA4', 'Looker Studio', 'Meta Ads basics', 'Mailchimp basics'],
    experience: '2 jaar: Google Ads Specialist bij iProspect België (2 jaar) — €800K klantbudget. Stage bij Dreamland/Colruyt Group (5 maanden).',
    education: 'Bachelor Digitale Marketing, Howest Kortrijk, 2022.',
    recommendation: 'no',
    language: 'nl',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 4,
  },

  {
    firstName: 'Margot',
    lastName: 'Declercq',
    email: 'margot.declercq@outlook.com',
    phone: '+32 471 445 668',
    cvContent: `MARGOT DECLERCQ
margot.declercq@outlook.com | +32 471 445 668 | Gent, België
linkedin.com/in/margotdeclercq-marketing

PROFESSIONELE SAMENVATTING
Digital Marketing & E-commerce Manager met 8 jaar ervaring, waarvan 5 jaar als teamleider bij een grote Belgische e-commerce speler. Sterk in performance marketing, loyaliteitsactivatie, datagedreven besluitvorming en teammanagement. Ervaring met budgetten tot €8M.

WERKERVARING

Head of Digital Marketing — bol.com België, Mechelen (januari 2019 – heden)
• Verantwoordelijke voor alle digitale marketingkanalen in België: SEA, SEO, e-mail, sociale media, affiliates, display
• Budget: €8M/jaar; ROAS gemiddeld 6,2 over 3 jaar
• Team: 6 specialisten (2 SEA, 1 SEO, 1 e-mail, 1 social, 1 analytics)
• Loyaliteitsprogramma bol.com Select: digitale activatiestrategie — 230.000 Belgische leden in 2 jaar
• Introductie van Marketing Mix Modeling (MMM) in samenwerking met Google: budget-optimalisatie over kanalen
• Eerste-partijdata-strategie ontwikkeld in aanloop naar cookieless marketing (server-side tagging, CDPimplementatie met Segment)
• Salesforce Marketing Cloud Journey Builder: volledige migratie van batch-e-mails naar getriggerde journeys

Senior Digital Marketing Manager — Zalando België, Brussel (maart 2015 – december 2018)
• Beheer van Belgische performance marketing (SEA, affiliates, retargeting) — budget €3M
• Lokale aanpassing van pan-Europese Zalando-campagnes voor NL/FR Belgische markt

OPLEIDING
Master Communicatiewetenschappen — VUB (2011 – 2013) | Grote onderscheiding
Bachelor Economische Wetenschappen — Universiteit Gent (2008 – 2011)

VAARDIGHEDEN
Kanalen: Google Ads (expert, Shopping/Search/PMAX), Meta Ads, SEO (gevorderd), DV360, Criteo, affiliates
CRM & e-mail: Salesforce Marketing Cloud (Journey Builder, AMPscript, Data Extensions) — expert
Analytics: GA4, BigQuery (basis SQL), Looker Studio, Power BI, MMM
First-party data: CDP (Segment), server-side tagging (GTM Server-Side), cookieless strategie
Loyaliteit: loyaliteitsprogramma-activatie, gepersonaliseerde segmentering, RFM-analyse
Talen: Nederlands (moedertaal), Frans (B2), Engels (C1)`,
    motivationText: `Geachte,

Na 5 jaar als Head of Digital Marketing bij bol.com België wil ik de overstap maken naar een Belgian-owned retailer. Colruyt Group is al lang mijn referentiepunt voor wat data-gedreven retail kan zijn — de combinatie van Xtra-loyaliteitsdata en de digitale ambitie van Colruyt is voor mij de meest interessante marketinguitdaging in de Belgische markt.

Wat ik meeneem: een €8M budget, een team van 6, de volledige Salesforce Marketing Cloud-implementatie bij bol.com en de introductie van Marketing Mix Modeling. Dat zijn precies de competenties die nodig zijn om het Xtra-programma naar een hoger niveau te tillen.

Ik ben gemotiveerd om in Halle te werken en zie de hybride formule als ideaal.

Met vriendelijke groet, Margot Declercq`,
    summary: `Sterk profiel: 8 jaar digitale marketing inclusief Head of Digital bij bol.com met €8M budget, Salesforce Marketing Cloud expert, loyaliteitsprogramma-activatie en eerste-partijdata-strategie. Boven het gevraagde niveau — zou een sterke toevoeging zijn aan het Colruyt-marketingteam.`,
    strengths: ['8 jaar digitale marketing inclusief Head of Digital bij bol.com (€8M budget)', 'Salesforce Marketing Cloud Journey Builder expert — exacte tool match', 'Marketing Mix Modeling en cookieless strategie — vooruitstrevend profiel', 'Loyaliteitsprogramma-activatie (bol.com Select, 230K leden)', 'CDP/Segment eerste-partijdata-ervaring — toekomstgericht'],
    weaknesses: ['€8M budget en team van 6 — mogelijk boven de scope van de Colruyt-rol', 'E-commerce (bol.com, Zalando) vs. traditionele retail — ander distributiemodel', 'Mogelijk hogere salariaatsverwachtingen'],
    skills: ['Google Ads', 'Meta Ads', 'SEO', 'DV360', 'Criteo', 'Salesforce Marketing Cloud', 'GA4', 'BigQuery', 'Looker Studio', 'Segment CDP', 'MMM', 'RFM analysis'],
    experience: '8 jaar: Head of Digital Marketing bij bol.com België (5 jaar) — €8M budget, team van 6, loyaliteitsactivatie. Senior Digital Marketing Manager bij Zalando België (4 jaar) — performance marketing €3M.',
    education: 'Master Communicatiewetenschappen, VUB, 2013, grote onderscheiding. BSc Economie, UGent, 2011.',
    recommendation: 'strong_yes',
    language: 'nl',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 4,
  },

  {
    firstName: 'Thomas',
    lastName: 'Krause',
    email: 'thomas.krause.mktg@gmail.com',
    phone: '+49 176 654 32109',
    cvContent: `THOMAS KRAUSE
thomas.krause.mktg@gmail.com | +49 176 654 32109 | Hamburg, Germany (open to Belgium)
linkedin.com/in/thomaskrause-digitalmarketing

PROFESSIONELE SAMENVATTING
Digital Marketing Manager met 5 jaar ervaring bij REWE Group (levensmiddelenretail) in Duitsland. Sterk in performance marketing en loyaliteitsactivatie. Beheert €3,5M mediabudget voor de REWE online boodschappen-service. Spreekt vloeiend Duits en Engels; Frans en Nederlands zijn beperkt.

WERKERVARING

Digital Marketing Manager — REWE Online, Keulen (april 2020 – heden)
• Beheer van alle digitale kanalen voor REWE's online boodschappenservice: SEA, e-mail, app-marketing
• Budget: €3,5M/jaar — ROAS van 4,1 gemiddeld over 2 jaar
• REWE Payback-kaart loyaliteitsactivatie via digitale kanalen (8M actieve leden)
• Introductie van geautomatiseerde e-mailopvolging (Salesforce Marketing Cloud) — open rate +31%
• Samenwerking met de REWE-app-afdeling voor gepersonaliseerde push-notificaties

Junior Digital Marketer — Douglas GmbH, Hamburg (augustus 2018 – maart 2020)
• Google Ads en Meta Ads voor Douglas Beauty-webshop — budget €600K
• SEO-contentstrategie voor productpagina's (Sistrix, Semrush)

OPLEIDING
Bachelor Betriebswirtschaftslehre (BWL) — Universität Hamburg (2015 – 2018) | Note: 1,8 (goed)

VAARDIGHEDEN
Google Ads (gecertificeerd), Meta Ads, Salesforce Marketing Cloud (gebruiker), GA4, Looker Studio
Talen: Duits (moedertaal), Engels (C1), Frans (A2), Nederlands (A1 — pas gestart)`,
    summary: `Competente digitale marketeer met FMCG/retail achtergrond en directe loyaliteitsactivatie-ervaring bij REWE. Sterk profiel, maar de taalbarrière (A2 Frans, A1 Nederlands) is een serieuze belemmering voor een functie bij Colruyt Group dat een Nederlandstalige werkomgeving is. Profiel is minder sterk dan de Belgische kandidaten.`,
    strengths: ['5 jaar grocery retail digitale marketing — sectorervaring', 'Salesforce Marketing Cloud ervaring (gebruiker)', 'Loyaliteitsactivatie voor grote loyaliteitsclub (Payback, 8M leden)', 'ROAS van 4,1 — solide resultaten'],
    weaknesses: ['Frans A2 en Nederlands A1 — onvoldoende voor Belgische bilingue retail context', 'Hamburg naar België verhuizen vereist', 'Bachelor-niveau (geen master) vs. omgeving met masters', 'Salesforce Marketing Cloud enkel gebruikersniveau — niet de Journey Builder expertise'],
    skills: ['Google Ads', 'Meta Ads', 'Salesforce Marketing Cloud', 'GA4', 'Looker Studio', 'Sistrix', 'Semrush', 'Push notifications', 'Email automation'],
    experience: '5 jaar: Digital Marketing Manager bij REWE Online Keulen (4 jaar) — €3,5M budget, loyaliteitsactivatie. Junior Digital Marketer bij Douglas Hamburg (2 jaar) — Google/Meta Ads.',
    education: 'Bachelor BWL, Universität Hamburg, 2018.',
    recommendation: 'maybe',
    language: 'en',
    status: 'new',
    source: 'upload',
    vacancyIndex: 4,
  },

  // ── Vacancy 5: DevOps / Platform Engineer – BNP Paribas Fortis ────────────

  {
    firstName: 'Ruben',
    lastName: 'Martens',
    email: 'ruben.martens.devops@gmail.com',
    phone: '+32 476 889 001',
    cvContent: `RUBEN MARTENS
ruben.martens.devops@gmail.com | +32 476 889 001 | Brussels, Belgium
linkedin.com/in/rubenmartens-platform | github.com/rubenmartens-devops

PROFESSIONAL SUMMARY
Senior Platform Engineer with 8 years of experience building and operating Kubernetes-based developer platforms at Belgian and European banks and fintechs. Expert in ArgoCD/GitOps, Terraform, and Vault. AWS Certified Solutions Architect Professional. Delivered an internal developer platform serving 500+ engineers at ING Belgium. Strong security engineering background in regulated banking environments.

EXPERIENCE

Senior Platform Engineer — ING Belgium, Brussels (February 2020 – present)
• Core team member (6 engineers) building the internal developer platform serving 500+ software engineers
• ArgoCD GitOps: migrated 80 squads from Jenkins push-based to ArgoCD pull-based deployments — reduced deployment incidents 75%
• Terraform module library (60+ modules) for AWS provisioning; introduced remote state management with Atlantis
• HashiCorp Vault cluster: dynamic secrets for all applications, PKI, AWS IAM roles — eliminated 100% hardcoded credentials across 300+ workloads
• Kubernetes platform: EKS clusters across 3 AWS accounts; Cilium CNI, Kyverno policies, Falco runtime security
• Designed self-service onboarding portal (Backstage) — reduced new team onboarding from 3 weeks to 2 days
• Change management and audit trail tooling for banking compliance (DORA, EBA guidelines)
• Mentored 3 mid-level engineers

DevOps Engineer — Belfius, Brussels (March 2016 – January 2020)
• Built CI/CD pipelines for 30 application teams using Jenkins → GitLab CI migration
• Kubernetes cluster administration (on-prem, OpenShift) for 120 containerised workloads
• Ansible automation for 400+ server configuration management
• Trivy/Twistlock container image scanning integration in all pipelines

EDUCATION
Master of Science in Computer Science — VUB Brussels (2012 – 2014) | Distinction
Bachelor Applied Informatics — KU Leuven (2009 – 2012)

CERTIFICATIONS
AWS Certified Solutions Architect – Professional (2022)
CKA – Certified Kubernetes Administrator (2021)
HashiCorp Vault Associate (2023)
Terraform Associate (2022)

TECHNICAL SKILLS
Kubernetes: EKS, OpenShift, AKS (evaluated), Helm, Kyverno, Falco, Cilium, custom operators (Go)
GitOps: ArgoCD (expert), Flux (evaluated), Atlantis for Terraform
IaC: Terraform (expert — modules, workspaces, Atlantis), Ansible, Crossplane (evaluated)
CI/CD: GitLab CI (expert), Jenkins (legacy), GitHub Actions (recent projects)
Security: HashiCorp Vault (dynamic secrets, PKI, SSH CA), Trivy, Snyk, SAST/DAST pipeline integration
Observability: Prometheus, Grafana, OpenTelemetry, Loki, Jaeger, Datadog
Cloud: AWS (Professional), Azure (evaluated — AKS, Service Bus)
Scripting: Go (intermediate — operator development), Python (proficient), Bash

LANGUAGES
Dutch (native), English (fluent/C2), French (good/B2)`,
    motivationText: `Hi BNP Paribas Fortis Platform Team,

I'm applying for the Senior DevOps/Platform Engineer role from my current position at ING Belgium, where I've spent 5 years building the internal developer platform serving 500+ engineers.

The overlap with your job description is near-complete: ArgoCD GitOps, Terraform modules, Vault for secrets management, EKS Kubernetes administration, container security — I've shipped all of these in a regulated Belgian banking context. I also understand what "change management in a bank" actually means: audit trails, DORA compliance, approval workflows. These aren't abstractions for me.

What draws me to BNP Paribas Fortis is scale: 1,200+ engineers is a more complex platform problem than where I am today, and I want to work at that level. I'm also genuinely interested in the Go operator development opportunity — I've been writing custom controllers for 18 months and want to go deeper.

I'm happy to share the architecture of the Backstage implementation I built at ING.

Ruben`,
    summary: `Exceptional Belgian platform engineer with 8 years experience including 5 years building the ING Belgium developer platform. Every technical requirement matched: ArgoCD, Terraform, Vault, EKS, CKA certified, AWS Professional, Go operator development, banking compliance. Strongest candidate in the pipeline by a wide margin.`,
    strengths: ['8 years platform engineering in Belgian banking (ING + Belfius)', 'ArgoCD GitOps expert — migrated 80 squads, 75% incident reduction', 'HashiCorp Vault expert — eliminated 100% hardcoded credentials', 'CKA + AWS Professional + Vault + Terraform certified', 'Backstage self-service portal built (onboarding 3 weeks → 2 days)', 'Go custom operator development experience'],
    weaknesses: ['From ING Belgium — competitor, may require confidentiality discussion', 'Azure experience is "evaluated" only — BNP may use Azure more than AWS'],
    skills: ['Kubernetes', 'ArgoCD', 'Terraform', 'HashiCorp Vault', 'AWS', 'GitLab CI', 'Go', 'Python', 'Falco', 'Kyverno', 'Trivy', 'Snyk', 'Prometheus', 'Grafana', 'Backstage', 'Cilium'],
    experience: '8 ans: Senior Platform Engineer bij ING Belgium (5 jaar) — developer platform 500+ engineers, ArgoCD, Vault, Backstage. DevOps Engineer bij Belfius (4 jaar) — CI/CD, Kubernetes, Ansible.',
    education: 'MSc Computer Science, VUB Brussels, 2014. BSc Applied Informatics, KU Leuven, 2012. CKA, AWS Professional, Vault, Terraform certified.',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 5,
  },

  {
    firstName: 'Florian',
    lastName: 'Weber',
    email: 'florian.weber.cloud@gmail.com',
    phone: '+49 170 234 5678',
    cvContent: `FLORIAN WEBER
florian.weber.cloud@gmail.com | +49 170 234 5678 | Frankfurt, Germany (open to Brussels)
linkedin.com/in/florianweber-devops | github.com/fweber-platform

PROFESSIONAL SUMMARY
Senior DevOps Engineer with 7 years of experience at Deutsche Bank and Commerzbank. Expert in Kubernetes, Terraform, and CI/CD pipelines in regulated financial environments. Azure Certified Solutions Architect Expert. Currently leading cloud platform migration from on-prem OpenShift to Azure AKS.

EXPERIENCE

Senior Cloud Platform Engineer — Deutsche Bank, Frankfurt (May 2019 – present)
• Platform team lead (informal — 4 engineers) for cloud migration programme (OpenShift → Azure AKS)
• Terraform modules for Azure provisioning: AKS, Azure Service Bus, API Management, Azure Key Vault
• GitOps implementation with ArgoCD across 45 microservice teams
• Azure DevOps pipelines for 60+ application teams; migrated 20 legacy Jenkins pipelines
• Implemented Azure Key Vault integration for dynamic secrets management (migrating from HashiCorp Vault)
• Security: Defender for Containers, Azure Policy, OPA Gatekeeper for compliance enforcement
• DORA and BaFin regulatory compliance tooling: automated audit logging, change approval workflows

DevOps Engineer — Commerzbank, Frankfurt (August 2015 – April 2019)
• Jenkins CI/CD for 25 application teams
• On-premises Kubernetes (OpenShift) cluster administration
• Ansible playbooks for 200+ server configurations

EDUCATION
BSc Informatik — TU Darmstadt (2012 – 2015) | Sehr Gut (with distinction)

CERTIFICATIONS
Azure Solutions Architect Expert (2022)
CKA – Certified Kubernetes Administrator (2020)
Terraform Associate (2021)

TECHNICAL SKILLS
Kubernetes: AKS, OpenShift, Helm, ArgoCD, OPA Gatekeeper, Azure Policy
IaC: Terraform (expert), Ansible, Pulumi (evaluated)
CI/CD: Azure DevOps (expert), Jenkins, GitHub Actions
Secrets: Azure Key Vault (expert), HashiCorp Vault (intermediate)
Security: Microsoft Defender for Containers, OPA Gatekeeper, SAST (SonarQube), container scanning
Cloud: Azure (Expert certified), AWS (intermediate), GCP (basic)
Scripting: Python (proficient), Bash, PowerShell, Go (learning)

LANGUAGES
German (native), English (fluent/C2), French (basic/A2), Dutch (none)`,
    summary: `Strong Azure-first platform engineer with 7 years in German banking (Deutsche Bank + Commerzbank). Azure-heavy skill set is a good match if BNP Fortis uses Azure primarily. ArgoCD, Terraform, CKA, banking compliance experience all align. Language gap (French A2, no Dutch) is a concern in a Belgian bilingual bank. Relocation from Frankfurt required.`,
    strengths: ['7 years platform engineering at top German banks — regulated context', 'Azure Solutions Architect Expert — strong Azure certification', 'ArgoCD GitOps and Terraform expert in banking context', 'DORA + BaFin regulatory compliance tooling experience', 'CKA certified with AKS and OpenShift production experience'],
    weaknesses: ['French A2, no Dutch — significant barrier in Belgian bilingual bank context', 'Frankfurt to Brussels relocation required', 'AWS experience only intermediate vs. BNP Fortis uses both AWS+Azure', 'HashiCorp Vault only intermediate — BNP uses Vault for secrets management', 'Go only "learning" — Go operator development expected'],
    skills: ['Kubernetes', 'AKS', 'ArgoCD', 'Terraform', 'Azure', 'Azure DevOps', 'Azure Key Vault', 'OPA Gatekeeper', 'CKA', 'Python', 'Jenkins', 'SAST'],
    experience: '7 ans: Senior Cloud Platform Engineer bij Deutsche Bank Frankfurt (5 jaar) — AKS migratie, ArgoCD, Terraform. DevOps Engineer bij Commerzbank (4 jaar) — Jenkins, OpenShift.',
    education: 'BSc Informatik, TU Darmstadt, 2015. Azure Expert, CKA, Terraform certified.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 5,
  },

  {
    firstName: 'Yasmine',
    lastName: 'Hadj',
    email: 'yasmine.hadj.devops@gmail.com',
    phone: '+32 479 003 225',
    cvContent: `YASMINE HADJ
yasmine.hadj.devops@gmail.com | +32 479 003 225 | Liège, Belgium
github.com/yhadj-devops

PROFESSIONAL SUMMARY
DevOps Engineer with 5 years of experience in cloud-native infrastructure and CI/CD at Belgian tech companies. Strong in Docker, Kubernetes, and AWS. Currently transitioning from a product startup to a financial services environment. AWS Certified Developer Associate.

EXPERIENCE

DevOps Engineer — Odoo (ERP), Louvain-la-Neuve (March 2021 – present)
• Maintained 15 Kubernetes namespaces (AWS EKS) for Odoo.sh multi-tenant cloud platform
• Terraform provisioning for AWS: EKS, RDS, S3, CloudFront — managed 200+ resources
• GitHub Actions CI/CD pipelines for 8 development teams
• Implemented Prometheus + Grafana observability stack — reduced MTTD from 45min to 8min
• Container security: Trivy scanning in CI/CD, ECR image policies
• Basic Vault implementation (static secrets management) for 3 services

DevOps Engineer — Cegeka, Hasselt (September 2018 – February 2021)
• AWS infrastructure management for 5 client projects (EC2, RDS, ELB, CloudWatch)
• Jenkins and later GitHub Actions CI/CD pipelines
• Docker containerisation of 12 legacy Java applications
• Linux server administration (Amazon Linux, Ubuntu)

EDUCATION
Master of Science in Computer Science — ULiège (2016 – 2018) | Distinction
Bachelor Informatics — ULiège (2013 – 2016)

CERTIFICATIONS
AWS Certified Developer Associate (2021) — working toward Solutions Architect Professional
CKA exam scheduled Q3 2026

TECHNICAL SKILLS
Kubernetes: EKS, Helm, basic RBAC, Prometheus/Grafana
IaC: Terraform (intermediate — no modules, no workspaces)
CI/CD: GitHub Actions (expert), Jenkins (proficient), GitLab CI (basic)
GitOps: ArgoCD (learning — evaluated for 3 months, not yet in production)
Secrets: HashiCorp Vault (static secrets only — dynamic secrets not yet implemented)
Security: Trivy, basic OPA policies
Cloud: AWS (Associate certified), Azure (basic)
Scripting: Python (proficient), Bash, Go (none)

LANGUAGES
French (native), Arabic (native), English (good/B2), Dutch (basic/A2)`,
    summary: `Competent DevOps engineer with 5 years of experience and a good AWS/Kubernetes foundation. Falls short of the "6+ years" and "expert Kubernetes" requirements: Terraform is intermediate (no modules), ArgoCD is still in learning phase, Vault is static-only, and no Go skills. Shows potential but is not yet at Senior Platform Engineer level for a bank serving 1,200+ engineers.`,
    strengths: ['Belgian candidate — no relocation required', 'AWS EKS Kubernetes experience in production', 'Terraform and GitHub Actions CI/CD proficiency', 'Observability stack (Prometheus/Grafana) with measurable MTTD improvement', 'MSc Computer Science — solid academic foundation'],
    weaknesses: ['5 years vs. 6+ required — borderline seniority', 'Terraform intermediate only (no modules, workspaces)', 'ArgoCD still in learning/evaluation phase — not production-ready', 'HashiCorp Vault static secrets only — dynamic secrets not implemented', 'No Go programming skills — expected for operator development', 'CKA not yet certified (scheduled)', 'No banking compliance experience'],
    skills: ['Kubernetes', 'EKS', 'Helm', 'Terraform', 'GitHub Actions', 'Jenkins', 'Trivy', 'Prometheus', 'Grafana', 'AWS', 'Docker', 'Python'],
    experience: '5 ans: DevOps Engineer bij Odoo Louvain-la-Neuve (3 jaar) — EKS, Terraform, GitHub Actions. DevOps Engineer bij Cegeka Hasselt (2,5 jaar) — AWS, Jenkins, Docker.',
    education: 'MSc Computer Science, ULiège, 2018. BSc Informatics, ULiège, 2016. AWS Developer Associate.',
    recommendation: 'maybe',
    language: 'en',
    status: 'reviewing',
    source: 'upload',
    vacancyIndex: 5,
  },

  {
    firstName: 'Niels',
    lastName: 'Janssen',
    email: 'niels.janssen.cloud@outlook.com',
    phone: '+31 6 12 345 678',
    cvContent: `NIELS JANSSEN
niels.janssen.cloud@outlook.com | +31 6 12 345 678 | Amsterdam, Netherlands (open to Brussels)
github.com/njanssen-platform

PROFESSIONAL SUMMARY
Senior Platform Engineer / SRE with 9 years of experience at ING Netherlands, ASML, and Adyen. Principal engineer for Adyen's internal developer platform. Expert in Kubernetes, ArgoCD, Terraform, and Go operator development. GCP Professional Cloud Architect and AWS Certified Solutions Architect Professional.

EXPERIENCE

Principal Platform Engineer — Adyen, Amsterdam (January 2021 – present)
• Technical lead for internal developer platform team (8 engineers)
• Built developer self-service portal (Backstage-based) adopted by 600+ engineers across 3 offices
• Custom Kubernetes operators in Go: cloud resource provisioner, secret injection controller, GitOps reconciler
• ArgoCD fleet management across 12 Kubernetes clusters (GKE + self-managed) — 1,000+ ArgoCD Applications
• Terraform module registry: 100+ modules, automated versioning and publishing via GitHub Actions
• HashiCorp Vault at scale: 25 Vault clusters, dynamic secrets for all workloads, cross-cluster replication
• GCP + AWS: Kubernetes networking (Cilium/Calico), service mesh (Istio), multi-cloud networking

Senior SRE — ING Netherlands, Amsterdam (March 2016 – December 2020)

EDUCATION
MSc Computer Science — TU Delft (2013 – 2015) | Cum laude
BSc Computer Science — Eindhoven University of Technology (2010 – 2013)

CERTIFICATIONS
GCP Professional Cloud Architect (2022) | AWS Solutions Architect Professional (2021)
CKA + CKAD + CKS — all three Kubernetes certifications (2021)
HashiCorp Vault Professional (2023)

TECHNICAL SKILLS
Kubernetes: GKE, EKS, AKS, self-managed, CKA+CKAD+CKS, Cilium, Istio, custom operators (Go)
GitOps: ArgoCD (expert at fleet scale), Flux
IaC: Terraform (expert — module registry, Atlantis), Pulumi, Crossplane
Secrets: HashiCorp Vault (Professional certified, 25-cluster deployment)
CI/CD: GitHub Actions, GitLab CI, Jenkins
Scripting: Go (proficient — operators, controllers), Python (expert), Bash
Cloud: GCP (Professional), AWS (Professional), Azure (intermediate)

LANGUAGES
Dutch (native), English (fluent/C2), German (good/B1), French (basic/A2)`,
    motivationText: `Hi BNP Paribas Fortis,

I'm a principal platform engineer at Adyen, working on the developer platform serving 600+ engineers. I'm considering a move to Brussels — my partner recently relocated there — and BNP Paribas Fortis is the most interesting platform engineering challenge I've found in Belgium.

Why BNP Paribas Fortis over other options: the scale (1,200+ engineers) and the regulated context (banking compliance, change management, audit trails) are exactly where I want to work. Adyen is excellent but less complex from a regulatory standpoint. I've done 3 years of custom operator development in Go, I've run ArgoCD at fleet scale (1,000+ Applications, 12 clusters), and I've designed a Vault deployment for 25 clusters. I can contribute at principal level from day one.

One note: my French is only A2. I'm committed to learning — my partner is Flemish and speaks French, and I'm already taking classes. But I want to be transparent about the current state.

Niels`,
    summary: `Exceptional principal platform engineer from Adyen with a skills profile that exceeds the role requirements. Go operator development, ArgoCD at fleet scale, Vault Professional certified, three Kubernetes certifications. Moving to Brussels due to personal reasons. French is weak (A2) but engineering skills are world-class. Strongest technical profile in the pipeline.`,
    strengths: ['9 years platform engineering at Adyen (fintech at scale), ING Netherlands', 'CKA + CKAD + CKS — all three Kubernetes certifications', 'Go operator development at production scale (custom controllers)', 'HashiCorp Vault Professional — 25-cluster deployment', 'ArgoCD at fleet scale: 1,000+ Applications, 12 clusters'],
    weaknesses: ['French A2 — committed to learning but currently insufficient for Belgian bilingual bank', 'Amsterdam-to-Brussels move (partner already there — strong motivation to relocate)', 'Principal level may expect top-of-band compensation'],
    skills: ['Kubernetes', 'ArgoCD', 'Terraform', 'Vault', 'Go', 'Python', 'GKE', 'EKS', 'AKS', 'Cilium', 'Istio', 'Backstage', 'GitHub Actions', 'Pulumi', 'Crossplane'],
    experience: '9 ans: Principal Platform Engineer bij Adyen Amsterdam (4 jaar) — developer platform 600+ engineers, Go operators, Vault 25 clusters. Senior SRE bij ING Netherlands (5 jaar).',
    education: 'MSc Computer Science, TU Delft, 2015, cum laude. GCP Professional, AWS Professional, CKA+CKAD+CKS, Vault Professional.',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 5,
  },

  {
    firstName: 'Sébastien',
    lastName: 'Collin',
    email: 'sebastien.collin.dev@gmail.com',
    phone: '+33 6 34 56 78 90',
    cvContent: `SÉBASTIEN COLLIN
sebastien.collin.dev@gmail.com | +33 6 34 56 78 90 | Paris, France (open to Brussels)
github.com/scollin-devops

PROFIL
DevOps Engineer avec 4 ans d'expérience dans le secteur fintech et e-commerce. Bonne maîtrise de Docker, Kubernetes et Terraform. Cherche à rejoindre une grande organisation bancaire pour professionnaliser ses compétences DevOps dans un contexte réglementé.

EXPÉRIENCE

DevOps Engineer — Leetchi (Mangopay), Paris (octobre 2021 – présent)
• Administration d'un cluster Kubernetes (AWS EKS) pour plateforme de paiement
• Pipelines GitLab CI pour 6 équipes de développement
• Terraform pour les ressources AWS (EKS, RDS, S3, ALB)
• Implémentation basique de HashiCorp Vault (secrets statiques pour 5 applications)
• Helm charts pour 20 microservices

DevOps Junior — OVHcloud, Paris (juillet 2019 – septembre 2021)
• Administration des instances cloud et des réseaux privés OVH pour clients enterprise
• Support niveau 2 pour les incidents d'infrastructure
• Scripts Bash et Python pour l'automatisation de tâches

FORMATION
Master Génie Informatique — École Centrale Paris (2017 – 2019) | Mention bien
Bachelor Informatique — Université Paris-Sud (2014 – 2017)

CERTIFICATIONS
AWS Certified Developer Associate (2022)
CKA (échoué une fois, prévu de repasser)

COMPÉTENCES
Kubernetes: EKS, Helm, RBAC de base
IaC: Terraform (intermédiaire), Ansible (base)
CI/CD: GitLab CI, GitHub Actions
Secrets: HashiCorp Vault (secrets statiques)
Cloud: AWS (Associate), Azure (base)
Scripts: Python, Bash, Go (niveau débutant)

LANGUES
Français (natif), Anglais (B2), Néerlandais (A1)`,
    summary: `DevOps engineer with 4 years of experience and a reasonable technical foundation. Significantly below the 6+ year seniority requirement and lacks expert-level skills in Terraform, Vault (only static secrets), and ArgoCD (not mentioned). CKA exam failed once. Too junior for a Senior Platform Engineer role at a bank serving 1,200+ engineers.`,
    strengths: ['Fintech context (Leetchi/Mangopay payments) — regulated environment exposure', 'École Centrale Paris — strong academic background', 'Terraform and EKS Kubernetes experience'],
    weaknesses: ['4 years vs. 6+ required — below seniority threshold', 'No ArgoCD or GitOps experience', 'Vault only static secrets — dynamic secrets not implemented', 'CKA failed once, not yet certified', 'No Go programming beyond beginner', 'No banking compliance experience (DORA, audit trails)', 'Dutch A1 — serious barrier for Belgian bilingual bank'],
    skills: ['Kubernetes', 'EKS', 'Helm', 'Terraform', 'GitLab CI', 'GitHub Actions', 'AWS', 'Docker', 'Python', 'Bash'],
    experience: '4 ans: DevOps Engineer bij Leetchi/Mangopay Paris (3 jaar) — EKS, Terraform, GitLab CI. DevOps Junior bij OVHcloud (2 jaar) — cloud infra support.',
    education: 'Master Génie Informatique, École Centrale Paris, 2019. AWS Developer Associate.',
    recommendation: 'no',
    language: 'fr',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 5,
  },

  // ── Vacancy 6: HR Business Partner – Delhaize Belgique ────────────────────

  {
    firstName: 'Véronique',
    lastName: 'Lambert',
    email: 'veronique.lambert.rh@gmail.com',
    phone: '+32 478 556 779',
    cvContent: `VÉRONIQUE LAMBERT
veronique.lambert.rh@gmail.com | +32 478 556 779 | Waterloo, Belgique
linkedin.com/in/veroniquelambertRH

PROFIL PROFESSIONNEL
HR Business Partner expérimentée avec 10 ans d'expérience dans le retail et la grande distribution belge, dont 6 ans chez Carrefour Belgium. Maîtrise parfaite du droit social belge, expérience étendue en relations syndicales (CNE, CSC, FGTB) et gestion de populations multi-sites. Bilingue FR/NL.

EXPÉRIENCE

HR Business Partner Senior — Carrefour Belgium, Evere (mars 2018 – présent)
• HRBP pour la région Bruxelles-Brabant Wallon : 42 magasins (hypermarché + supermarché), 2 800 collaborateurs
• Accompagnement de 42 directeurs de magasin et 3 directeurs régionaux sur tous les sujets RH
• Gestion des relations sociales locales : liaison avec délégués syndicaux CNE, CSC et FGTB dans 8 CP (CP 201, CP 202)
• Gestion des restructurations : accompagnement de 2 fermetures de magasin (procédure Renault, plan social, outplacement)
• Pilotage des processus annuels : évaluation des performances, révision salariale, cartographie des talents pour 60 cadres
• Absentéisme : réduction de 8,2% à 6,1% via programme bien-être et politique d'absentéisme restructurée
• Déploiement de SAP SuccessFactors pour la population cadres (modules Performance & Goals, Compensation)

HR Business Partner — Lidl Belgique, Bruxelles (janvier 2014 – février 2018)
• HRBP pour les régions Liège et Namur : 65 magasins, 1 200 collaborateurs
• Recrutement des managers de magasin et chefs de rayon (30 recrutements/an)
• Gestion disciplinaire et licenciements (procédure, C4, documentation légale)
• Relations syndicales dans le cadre des CPPT et CE locaux

Conseillère RH — SD Worx, Bruxelles (septembre 2011 – décembre 2013)
• Conseil en droit social pour PME clientes (CCT, licenciements, temps de travail)

FORMATION
Master en Gestion des Ressources Humaines — ICHEC Bruxelles (2009 – 2011) | Distinction
Licence en Psychologie du Travail — ULB (2006 – 2009)

COMPÉTENCES
Droit social belge : CP 201, CP 202, licenciements, CCT, RGPD RH
Relations syndicales : CNE, CSC, FGTB — CE, CPPT, délégations syndicales
SIRH : SAP SuccessFactors (Performance, Compensation, Recruiting)
Outils : MS Office, Workday (notions), SharePoint
Permis B, véhicule personnel

LANGUES
Français (natif), Néerlandais (C1), Anglais (B2)`,
    motivationText: `Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de HR Business Partner – Retail Operations chez Delhaize Belgique. Fort de 10 ans d'expérience en tant que HRBP dans la grande distribution belge (Carrefour et Lidl), je me sens parfaitement préparée à relever les défis RH spécifiques à ce secteur.

Ce qui me distingue : j'ai géré 2 fermetures de magasins avec les procédures Renault complètes, j'ai réduit l'absentéisme de 2,1 points de base chez Carrefour, et j'ai déployé SAP SuccessFactors pour une population de 2.800 collaborateurs. Ces expériences sont directement transposables à l'environnement Delhaize.

Je suis bilingue FR/NL et disponible pour des déplacements réguliers dans les magasins de la région Bruxelles-Wallonie. Je reste disponible pour un entretien à votre convenance.

Véronique Lambert`,
    summary: `Profil idéal pour ce poste: 10 ans d'expérience HRBP dans la grande distribution belge (Carrefour + Lidl), maîtrise du droit social belge CP 201/202, relations syndicales CNE/CSC/FGTB, SAP SuccessFactors. Bilingue FR/NL. La correspondance avec le profil recherché est quasi parfaite.`,
    strengths: ['10 ans HRBP grande distribution belge — correspondance parfaite', 'Gestion de 42 magasins, 2.800 collaborateurs — périmètre comparable', 'Relations syndicales expertes (CNE, CSC, FGTB, CE, CPPT)', 'Procédures Renault et restructurations — expérience rare et précieuse', 'SAP SuccessFactors — SIRH probable chez Delhaize'],
    weaknesses: ['Vient de Carrefour — concurrent direct, possible sensibilité commerciale', 'Workday mentionné uniquement comme "notions" — si Delhaize utilise Workday'],
    skills: ['HRBP', 'Belgian labour law', 'CP 201/202', 'Trade unions (CNE/CSC/FGTB)', 'SAP SuccessFactors', 'Performance management', 'Absenteeism management', 'Restructuring', 'Renault procedure'],
    experience: '10 ans: Senior HRBP chez Carrefour Belgium (6 ans) — 42 magasins, 2.800 collab., restructurations. HRBP chez Lidl Belgique (4 ans) — 65 magasins. Conseillère RH chez SD Worx (2 ans).',
    education: 'Master GRH, ICHEC Bruxelles, 2011. Licence Psychologie du Travail, ULB, 2009.',
    recommendation: 'strong_yes',
    language: 'fr',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 6,
  },

  {
    firstName: 'Koen',
    lastName: 'De Wolf',
    email: 'koen.dewolf.hr@gmail.com',
    phone: '+32 475 667 890',
    cvContent: `KOEN DE WOLF
koen.dewolf.hr@gmail.com | +32 475 667 890 | Gent, België
linkedin.com/in/koendewolf-hrbp

PROFESSIONELE SAMENVATTING
HR Business Partner met 7 jaar ervaring in de industrie en logisticssector. Goede kennis van het Belgisch arbeidsrecht en vakbondsrelaties (ACV, ABVV). Spreekt vloeiend Nederlands en goed Frans. Wil overstappen van industrie naar retail.

WERKERVARING

HR Business Partner — AB InBev België, Leuven (februari 2019 – heden)
• HRBP voor de productie-afdeling Leuven Brewery: 650 arbeiders en bedienden (PC 118, PC 220)
• Begeleiding van 15 afdelingshoofden en de plant director bij alle dagelijkse HR-vragen
• Opvolging van disciplinaire dossiers, waarschuwingen en ontslag (C4, dringende reden)
• Sociaal overleg: CPBW en OR lokaal; liaison met ACV, ABVV en ACLVB
• Implementatie van Workday Performance module voor bedienden
• Beheer van ziekteverzuim: programma opgezet dat verzuim met 1,8% verminderde

Junior HRBP — Katoen Natie, Antwerpen (september 2016 – januari 2019)
• HR-ondersteuning voor logistieke teams (havenarbeiders, heftruckchauffeurs — PC 301)
• Rekrutering van operationeel personeel (30-40 aanwervingen/jaar)
• Opvolging van sociaalrechtelijke dossiers

OPLEIDING
Master Personeelsbeleid en Arbeidsrecht — KU Leuven (2014 – 2016) | Onderscheiding
Bachelor Rechtswetenschappen — Universiteit Gent (2011 – 2014)

VAARDIGHEDEN
Arbeidsrecht: PC 118, PC 220, PC 301, ontslag, CAO's, GDPR HR
Vakbonden: ACV, ABVV, ACLVB — OR, CPBW
HRMS: Workday (Performance module), SAP HR (basisgebruiker)
Talen: Nederlands (moedertaal), Frans (B2), Engels (B2)`,
    summary: `Solide HRBP met 7 jaar industrie/logistiek ervaring en goede kennis van Belgisch arbeidsrecht en vakbondsrelaties. Het profiel ontbreekt echter een retail-achtergrond (multi-site retail management is fundamenteel anders dan industrie) en de gevraagde 5 jaar ervaring in retail. Frans op B2-niveau is ook iets beperkt voor de Waals-Brusselse regio.`,
    strengths: ['7 jaar HRBP ervaring — voldoende senioriteit', 'Belgisch arbeidsrecht expert (meerdere PC\'s)', 'Vakbondsrelaties ervaring (ACV, ABVV, ACLVB)', 'Verzuimbeheer met aantoonbaar resultaat (-1,8%)', 'Workday Performance module ervaring'],
    weaknesses: ['Industrie/logistiek profiel — geen retail of multi-site winkelervaring', 'Frans B2 — mogelijk niet voldoende voor Waalse regio-HRBP', 'PC 201/202 (handel) ervaring ontbreekt — andere sectorcontext', 'Geen ervaring met Renault-procedure of grote herstructureringen in retail'],
    skills: ['Belgian labour law', 'PC 118/220/301', 'Trade unions (ACV/ABVV/ACLVB)', 'Workday', 'SAP HR', 'Performance management', 'Absenteeism management', 'Disciplinary procedures'],
    experience: '7 jaar: HRBP bij AB InBev België Leuven (5 jaar) — 650 medewerkers, PC 118/220, Workday. Junior HRBP bij Katoen Natie Antwerpen (2,5 jaar) — PC 301, logistiek.',
    education: 'Master Personeelsbeleid & Arbeidsrecht, KU Leuven, 2016. Bachelor Rechtswetenschappen, UGent, 2014.',
    recommendation: 'maybe',
    language: 'nl',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 6,
  },

  {
    firstName: 'Marie-Claire',
    lastName: 'Fonteneau',
    email: 'mc.fonteneau@yahoo.fr',
    phone: '+33 6 45 67 89 01',
    cvContent: `MARIE-CLAIRE FONTENEAU
mc.fonteneau@yahoo.fr | +33 6 45 67 89 01 | Lille, France (ouverte à Bruxelles)
linkedin.com/in/mc-fonteneau-rh

PROFIL
HR Business Partner avec 12 ans d'expérience dans la grande distribution française (Auchan, E.Leclerc). Expertise approfondie en droit social français et en management des relations sociales avec les organisations syndicales françaises. Ouverte à une mobilité vers la Belgique mais sans connaissance du droit social belge ni du néerlandais.

EXPÉRIENCE

HR Business Partner Régional — Auchan Retail France, Lille (avril 2015 – présent)
• HRBP pour la région Nord (12 hypermarchés, 4 500 collaborateurs)
• Gestion des IRP (CSE, CSSCT) et négociations avec la CGT, CFDT, FO
• Accompagnement des directeurs de magasin sur la gestion disciplinaire, les licenciements (procédure France)
• Mise en place et pilotage du plan de sauvegarde de l'emploi (PSE) lors de la fermeture d'un hypermarché
• Déploiement de SAP SuccessFactors pour la région

Responsable RH — E.Leclerc Roubaix (janvier 2011 – mars 2015)
• Gestion RH d'un hypermarché Leclerc (220 salariés)
• Recrutement, formation, discipline, paie (Silae), gestion des plannings

FORMATION
Master RH et Droit Social — Université Catholique de Lille (2008 – 2010)
Licence AES — Université de Lille (2005 – 2008)

COMPÉTENCES
Droit social : droit français (expert), droit belge (aucune connaissance)
Relations syndicales : CGT, CFDT, FO — contexte français uniquement
SIRH : SAP SuccessFactors, Silae (paie française)
Langues : Français (natif), Anglais (B1), Néerlandais (aucun)`,
    summary: `Profil senior avec une forte expérience française en grande distribution, mais présente deux lacunes rédhibitoires pour Delhaize Belgique: absence totale de connaissance du droit social belge et aucune maîtrise du néerlandais. Ces deux éléments sont explicitement requis dans la description de poste.`,
    strengths: ['12 ans HRBP grande distribution — expérience sector très pertinente', 'PSE (plan social) géré — compétence rare', 'SAP SuccessFactors experience', 'Grande échelle: 4.500 collaborateurs, 12 hypermarchés'],
    weaknesses: ['Zéro connaissance du droit social belge — lacune fondamentale', 'Aucune connaissance du néerlandais — requis pour Delhaize Belgique', 'Droit français vs. droit belge : systèmes très différents (IRP vs. CE/CPPT, CSE vs. OR)', 'Basée à Lille — déménagement requis'],
    skills: ['HRBP', 'French labour law', 'PSE (plan social)', 'SAP SuccessFactors', 'French trade unions (CGT/CFDT/FO)', 'Recruitment', 'Disciplinary procedures'],
    experience: '12 ans: HRBP Régional chez Auchan France Lille (9 ans) — 4.500 collaborateurs, IRP, PSE. Responsable RH chez E.Leclerc Roubaix (4 ans).',
    education: 'Master RH et Droit Social, UCatholique de Lille, 2010. Licence AES, Université de Lille, 2008.',
    recommendation: 'no',
    language: 'fr',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 6,
  },

  {
    firstName: 'Sophie',
    lastName: 'Gilson',
    email: 'sophie.gilson.hr@gmail.com',
    phone: '+32 474 112 334',
    cvContent: `SOPHIE GILSON
sophie.gilson.hr@gmail.com | +32 474 112 334 | Namur, Belgique

PROFIL PROFESSIONNEL
HR Business Partner avec 6 ans d'expérience dans la distribution et les services belges. Solide connaissance du droit social belge et expérience en relations syndicales dans le secteur commerce. Bilingue FR/NL. Permis B et mobile pour toute la région wallonne et bruxelloise.

EXPÉRIENCE

HR Business Partner — Fnac Belgium, Bruxelles (mars 2020 – présent)
• HRBP pour 12 magasins Fnac Belgique (Bruxelles, Wallonie, Luxembourg): 800 collaborateurs
• Accompagnement de 12 directeurs de magasin sur les sujets disciplinaires, absentéisme et performance
• Relations sociales : délégation syndicale locale (CNE, CGSLB), CE national Fnac Belgique
• Participation aux négociations CCT d'entreprise (temps de travail, indemnités, télétravail)
• Gestion de 15 licenciements/an (C4, documentation, indemnités de préavis)
• Déploiement du module de gestion des performances (Workday) pour les cadres Fnac

Coordinatrice RH — Beobank, Bruxelles (septembre 2017 – février 2020)
• Support RH pour 250 collaborateurs (agences et siège)
• Recrutement de profils bancaires et commerciaux (20 recrutements/an)
• Gestion administrative RH (contrats, avenants, congés, absences)

FORMATION
Master en Gestion des Ressources Humaines — UCLouvain Mons (2015 – 2017) | Distinction
Bachelor en Gestion — Haute École de Namur-Liège-Luxembourg (Henallux) (2012 – 2015) | Grande distinction

COMPÉTENCES
Droit social belge : PC 201, CCT 109, licenciements, temps de travail commerce
Relations syndicales : CNE, CGSLB, délégation syndicale, CE
SIRH : Workday (Performance module, notions Recruiting), SD Worx (paie basique)
Mobile : permis B, déplacements réguliers en Wallonie et Bruxelles
Langues : Français (natif), Néerlandais (B2), Anglais (B1)`,
    motivationText: `Madame, Monsieur,

Je postule au poste de HR Business Partner – Retail Operations chez Delhaize Belgique. Avec 6 ans d'expérience HRBP dans le secteur du commerce belge (Fnac, 12 magasins) et une bonne maîtrise du droit social belge et des relations syndicales (CNE, CGSLB), je pense pouvoir contribuer efficacement à votre équipe RH.

Ce qui m'attire chez Delhaize, c'est l'ampleur du périmètre et la dimension humaine forte d'un des plus grands employeurs de Belgique. Mon expérience chez Fnac m'a appris à gérer des directeurs de magasin très autonomes dans un contexte multisite — une compétence directement transposable.

Je suis mobile dans toute la région Bruxelles-Wallonie et disponible immédiatement.

Sophie Gilson`,
    summary: `Bon profil HRBP retail belge avec 6 ans d'expérience chez Fnac et Beobank, maîtrise du droit social belge PC 201, relations syndicales CNE/CGSLB. Périmètre plus limité (12 magasins vs. 35 attendus) et manque les grands syndicats FGTB/CSC. Candidature sérieuse mais légèrement en dessous du niveau de séniorité idéal.`,
    strengths: ['6 ans HRBP retail belge (Fnac) — secteur directement pertinent', 'Droit social belge PC 201 et CCT 109 — bonne expertise', 'Relations syndicales belges (CNE, CGSLB)', 'Bilingue FR/NL — indispensable pour Delhaize', 'Mobile Bruxelles-Wallonie avec permis B'],
    weaknesses: ['12 magasins vs. 35+ attendus — périmètre plus restreint', 'Pas d\'expérience avec FGTB/CSC — syndicats importants dans l\'alimentaire belge', 'Anglais seulement B1 — limite dans un groupe international', 'Pas de gestion de restructurations ou fermetures de magasins'],
    skills: ['HRBP', 'Belgian labour law', 'PC 201', 'CCT 109', 'Trade unions (CNE/CGSLB)', 'Workday', 'SD Worx', 'Performance management', 'Disciplinary procedures'],
    experience: '6 ans: HRBP chez Fnac Belgium (4 ans) — 12 magasins, 800 collaborateurs, CE national. Coordinatrice RH chez Beobank (2,5 ans).',
    education: 'Master GRH, UCLouvain Mons, 2017. Bachelor Gestion, Henallux Namur, 2015.',
    recommendation: 'yes',
    language: 'fr',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 6,
  },

  {
    firstName: 'Aurélien',
    lastName: 'Piron',
    email: 'aurelien.piron.rh@gmail.com',
    phone: '+32 479 334 557',
    cvContent: `AURÉLIEN PIRON
aurelien.piron.rh@gmail.com | +32 479 334 557 | Liège, Belgique

PROFIL
Jeune professionnel RH avec 2 ans d'expérience comme HR Generalist dans une PME industrielle. Motivé pour rejoindre un grand acteur du retail belge et se spécialiser dans le rôle de HRBP. Bonne connaissance théorique du droit social belge mais expérience limitée.

EXPÉRIENCE

HR Generalist — Prayon (chimie industrielle), Engis (septembre 2022 – présent)
• Gestion RH quotidienne pour 80 ouvriers et employés (PC 116)
• Recrutement de profils opérationnels (10–15/an)
• Gestion des absences, congés, documentation contractuelle
• Participation aux réunions CPPT
• Premiers cas disciplinaires avec support du DRH

Stage RH — Liège Airport (février – juillet 2022)
• Support administratif RH : contrats, paie, documentation Dimona

FORMATION
Master en Gestion des Ressources Humaines — HEC Liège (2020 – 2022) | Distinction
Bachelor en Psychologie — Université de Liège (2017 – 2020)

LANGUES
Français (natif), Anglais (B2), Néerlandais (A2)`,
    summary: `Très junior profil RH avec seulement 2 ans d'expérience en PME industrielle. Absolument pas adapté à un rôle de HRBP senior en retail multi-sites pour Delhaize. Néerlandais A2 est également insuffisant pour le contexte bilingue. Profil junior/généraliste à orienter vers un autre type de poste.`,
    strengths: ['Motivation claire pour le développement en RH', 'Master GRH HEC Liège — bonne formation', 'Premiers contacts syndicaux (CPPT)'],
    weaknesses: ['2 ans d\'expérience — très en dessous des 5 ans requis', 'PME industrielle 80 personnes vs. retail multi-sites — contexte très différent', 'Aucune expérience retail, aucune relation syndicale en commerce', 'Néerlandais A2 — insuffisant pour contexte bilingue Delhaize', 'Aucune expérience en gestion de licenciements complexes ou restructurations'],
    skills: ['HR generalist', 'Belgian labour law basics', 'PC 116', 'CPPT', 'Recruitment', 'Dimona', 'Absenteeism'],
    experience: '2 ans: HR Generalist chez Prayon Engis (2 ans) — 80 medewerkers, PC 116. Stage RH chez Liège Airport (5 maanden).',
    education: 'Master GRH, HEC Liège, 2022. Bachelor Psychologie, ULiège, 2020.',
    recommendation: 'no',
    language: 'fr',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 6,
  },

  // ── Vacancy 7: Customer Success Manager – Teamleader ──────────────────────

  {
    firstName: 'Lieselotte',
    lastName: 'Vandenberghe',
    email: 'lieselotte.vdb@gmail.com',
    phone: '+32 477 223 446',
    cvContent: `LIESELOTTE VANDENBERGHE
lieselotte.vdb@gmail.com | +32 477 223 446 | Ghent, Belgium
linkedin.com/in/lieselottevandenberghe-cs

PROFESSIONAL SUMMARY
Customer Success Manager with 6 years of B2B SaaS experience managing enterprise accounts at Ghent-based software companies. Consistent NRR >120% track record. Expert in Gainsight, Salesforce, and QBR facilitation. Bilingual Dutch/French with strong English. Strong commercial mindset — closed €800K in expansion ARR in the past 12 months.

EXPERIENCE

Senior Customer Success Manager — Enterprise — Showpad, Ghent (April 2020 – present)
• Manage a portfolio of 38 enterprise accounts (€4.2M ARR) primarily in DACH, Benelux, and France
• NRR: 124% average over 3 years; churn rate 2.1% (team average 6.4%)
• Closed €800K in net new expansion ARR in past 12 months (upsell of seats and additional modules)
• Facilitate QBRs with C-level stakeholders (CMO, VP Sales, VP Revenue Enablement) at strategic accounts
• Led complex onboarding projects for 3 enterprise clients (8,000–15,000 users): project plan, data migration, training, go-live
• Built a health score framework in Gainsight adopted by the full enterprise CS team (12 CSMs)
• Contributed to the CS playbook for executive sponsorship and churn intervention

Customer Success Manager — Mid-Market — Teamleader, Ghent (March 2018 – March 2020)
• Managed portfolio of 120 mid-market accounts (€1.8M ARR) in Benelux and France
• NRR: 113% | Churn reduced from 8.2% to 4.7% through structured QBR programme
• Designed and delivered product training for 400+ users across all accounts
• Identified and closed 25 upsell opportunities in collaboration with Account Executives (€220K ARR)
• Onboarded 30 new mid-market accounts in 18 months; average time-to-value: 14 days

EDUCATION
MSc Business Administration — Ghent University (2014 – 2016) | Cum laude
BSc Applied Economics — University of Antwerp (2011 – 2014)

SKILLS
CS platforms: Gainsight (health scores, playbooks, CTAs, Journey Orchestrator — admin level), Salesforce (proficient)
Process: QBR facilitation, executive sponsorship, churn forecasting, expansion selling
Onboarding: enterprise onboarding project management, data migration coordination, user training
Technical: HubSpot (basic), SQL (basic for data pull), Notion, Linear
Domains: Sales enablement SaaS (Showpad), CRM/project management SaaS (Teamleader)

LANGUAGES
Dutch (native), English (fluent/C2), French (fluent/C1), German (basic/A2)`,
    motivationText: `Hi Teamleader CS Team,

This application has an interesting twist: I started my CS career at Teamleader 6 years ago, before moving to Showpad. I'm now interested in coming back, at a more senior level, to work on the Enterprise segment — which didn't exist in the same way when I left.

What I can bring back: 3 years of enterprise CS at Showpad (38 accounts, €4.2M ARR, 124% NRR), deep Gainsight expertise, and a commercial mindset that has generated €800K in expansion ARR in the past year. I know Teamleader's product, culture, and core customer persona intimately — the SME and mid-market business owner who needs CRM + invoicing + project management in one place.

Enterprise CS at Teamleader is exactly the scope I want: large named accounts, C-level relationships, and real expansion potential. I'm also genuinely excited about Visma's European network for cross-border selling.

Lieselotte`,
    summary: `Outstanding CS candidate with a previous Teamleader background and 3 years of senior enterprise CS at Showpad with 124% NRR and €800K expansion ARR. Gainsight admin level, bilingual Dutch/French/English, deep knowledge of Teamleader product. Near-perfect match.`,
    strengths: ['Former Teamleader CSM — knows product, culture, customer persona', '6 years B2B SaaS CS including 3 years enterprise at Showpad', '124% NRR average — well above target of >115%', '€800K expansion ARR closed in 12 months — strong commercial track record', 'Gainsight admin level — can build and improve CS infrastructure'],
    weaknesses: ['Leaving Showpad may raise questions about internal dynamics', 'German only A2 — could be a limitation for DACH expansion plans'],
    skills: ['Gainsight', 'Salesforce', 'QBR facilitation', 'Churn forecasting', 'Expansion selling', 'Enterprise onboarding', 'Health score modelling', 'Notion', 'HubSpot'],
    experience: '6 ans: Senior CSM Enterprise chez Showpad Ghent (4 ans) — 38 accounts, €4,2M ARR, 124% NRR. CSM Mid-Market chez Teamleader (2 ans) — 120 accounts, €1,8M ARR.',
    education: 'MSc Business Administration, Ghent University, 2016, cum laude. BSc Applied Economics, UAntwerpen, 2014.',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 7,
  },

  {
    firstName: 'Marco',
    lastName: 'de Vries',
    email: 'marco.devries.cs@gmail.com',
    phone: '+31 6 87 654 321',
    cvContent: `MARCO DE VRIES
marco.devries.cs@gmail.com | +31 6 87 654 321 | Rotterdam, Netherlands (open to Ghent/Brussels)
linkedin.com/in/marcodevries-customersuccess

PROFESSIONAL SUMMARY
Customer Success Manager with 5 years of B2B SaaS experience at Dutch scale-ups. Managed enterprise accounts at AFAS Software and Exact Software, two of the largest Dutch business software vendors. NRR consistently above 112%. Strong Dutch and English; learning French.

EXPERIENCE

Customer Success Manager — Enterprise — AFAS Software, Leusden (January 2021 – present)
• Manage portfolio of 55 enterprise accounts (€3.1M ARR) — Dutch and Belgian clients
• NRR: 112% over 2 years | Churn: 3.8%
• Closed €410K in expansion ARR through seat expansion and additional modules (HR, payroll)
• Facilitate twice-yearly Executive Business Reviews with HR director and CFO at strategic accounts
• Led onboarding for 4 new enterprise clients (500–2,000 users): kick-off, configuration, go-live
• Implemented Gainsight health score framework for AFAS Enterprise CS team (first deployment)

Customer Success Manager — SME — Exact Software, Rotterdam (February 2018 – December 2020)
• Portfolio: 200 SME accounts (€1.2M ARR) in Netherlands and Belgium
• NRR: 108% | Upsell: 18 deals/year in collaboration with Account Executives
• Delivered product training for 800+ users per year via webinars and on-site sessions

EDUCATION
BSc Business Administration — Erasmus University Rotterdam (2015 – 2018) | Cum laude

SKILLS
CS platforms: Gainsight (health scores, playbooks — first deployment experience), Salesforce (proficient), HubSpot
Process: Executive Business Reviews, onboarding management, upsell identification, churn risk management
Domains: ERP/HRM software, accounting SaaS, CRM/project management (adjacent)

LANGUAGES
Dutch (native), English (fluent/C1), French (B1 — improving), German (B1)`,
    summary: `Solid Dutch CSM with 5 years at AFAS and Exact Software — B2B business software adjacent to Teamleader's domain. NRR 112% meets target. Gainsight implementation experience. Gap: French is only B1, he doesn't know Teamleader's product. Relocation to Belgium required. Good but not exceptional.`,
    strengths: ['5 years B2B software CS in CRM/ERP domain — adjacent product category', 'Gainsight first-deployment experience — useful infrastructure skill', 'Belgian clients in current portfolio — knows Belgian market dynamics', 'Dutch native — core Teamleader market language', 'Expansion ARR track record (€410K at AFAS)'],
    weaknesses: ['French B1 — below required level for French-speaking accounts', 'BSc only (no master) — in a competitive pool', 'NRR 112% vs. target >115% — at but not above target', 'No prior Teamleader product knowledge', 'Rotterdam-to-Belgium relocation required'],
    skills: ['Gainsight', 'Salesforce', 'HubSpot', 'QBR facilitation', 'Churn risk management', 'Onboarding management', 'Enterprise accounts', 'Expansion selling'],
    experience: '5 ans: CSM Enterprise bij AFAS Software (3 jaar) — 55 accounts, €3,1M ARR, Gainsight. CSM SME bij Exact Software (2 jaar) — 200 accounts, product training.',
    education: 'BSc Business Administration, Erasmus University Rotterdam, 2018, cum laude.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 7,
  },

  {
    firstName: 'Fiona',
    lastName: 'McLaughlin',
    email: 'fiona.mclaughlin.cs@gmail.com',
    phone: '+44 7712 345 678',
    cvContent: `FIONA McLAUGHLIN
fiona.mclaughlin.cs@gmail.com | +44 7712 345 678 | London, UK (open to Ghent remote/hybrid)
linkedin.com/in/fionamclaughlin-cs

PROFESSIONAL SUMMARY
Enterprise Customer Success Manager with 7 years at Salesforce and HubSpot London. Deep expertise in complex B2B SaaS implementations, executive stakeholder management, and driving NRR >120% on multi-million ARR portfolios. Seeking a move from London to a more focused, product-centric CS role.

EXPERIENCE

Senior Enterprise CSM — Salesforce, London (March 2019 – present)
• Portfolio: 22 enterprise accounts (£8.2M ARR) across financial services and professional services verticals
• NRR: 128% average over 4 years (top 15% globally)
• Closed £1.4M in net new expansion ARR through strategic platform upsells (Marketing Cloud, Service Cloud add-ons)
• Managed C-suite relationships (CTO, CMO, CRO) at FTSE 250 and Fortune 500 clients
• Led 6 complex Salesforce implementations (3,000–15,000 users) spanning 12–18 months
• Mentored 3 junior CSMs; co-authored EMEA enterprise CS playbook

Customer Success Manager — HubSpot, Dublin (September 2016 – February 2019)
• Portfolio: 80 mid-market accounts (€2.1M ARR) in UK and Ireland
• NRR: 116% | 22 upsell deals in 2.5 years

EDUCATION
BA Business and Marketing — University College Dublin (2013 – 2016) | First Class Honours

SKILLS
CS platforms: Gainsight (expert), Salesforce (expert — CRM admin certified), HubSpot (expert)
Frameworks: MEDDPICC, Challenger methodology, Value Engineering
Technical: Salesforce SOQL queries, report builder, Gainsight Journey Orchestrator
Domains: CRM, marketing automation, sales enablement, financial services SaaS

LANGUAGES
English (native), French (B1), Dutch (none)`,
    summary: `Impressive Salesforce enterprise CSM with 128% NRR and £1.4M expansion ARR. The commercial and stakeholder management skills are world-class. Key concerns: London-based (significant relocation), no Dutch language, and the Salesforce scale/complexity may be very different from Teamleader's SME/mid-market product — risk of finding the work less complex.`,
    strengths: ['7 years enterprise CS at Salesforce and HubSpot — world-class training ground', '128% NRR — top 15% globally at Salesforce', 'Gainsight expert + Salesforce admin certified', 'Executive (CTO/CMO/CRO) relationship management experience', 'MEDDPICC and Challenger methodology expertise'],
    weaknesses: ['No Dutch language — core Teamleader market is Benelux', 'French only B1 — French-speaking CS accounts will be a challenge', 'London-based — significant relocation; may return to London after settling', 'Salesforce enterprise scale is much larger than Teamleader — may find the transition jarring or unchallenging', 'Expected compensation from Salesforce London may exceed Teamleader range'],
    skills: ['Gainsight', 'Salesforce CRM', 'HubSpot', 'MEDDPICC', 'Challenger methodology', 'Value Engineering', 'QBR facilitation', 'Executive stakeholder management', 'Implementation management'],
    experience: '7 ans: Senior Enterprise CSM bij Salesforce London (5 jaar) — 22 accounts, £8,2M ARR, 128% NRR. CSM bij HubSpot Dublin (2,5 jaar) — 80 accounts, €2,1M ARR.',
    education: 'BA Business and Marketing, University College Dublin, 2016, First Class Honours.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 7,
  },

  {
    firstName: 'Brecht',
    lastName: 'Huysmans',
    email: 'brecht.huysmans@outlook.be',
    phone: '+32 493 556 779',
    cvContent: `BRECHT HUYSMANS
brecht.huysmans@outlook.be | +32 493 556 779 | Antwerp, Belgium

PROFESSIONAL SUMMARY
Account Manager and Customer Success professional with 4 years at a Belgian B2B SaaS company. Managed a portfolio of 180 SME accounts. Strong relationship skills and product knowledge. Seeking first enterprise CS role with larger account portfolios.

EXPERIENCE

Customer Success Manager — Teamleader, Antwerp (September 2021 – present)
• Manage 180 SME accounts in NRR portfolio (€900K ARR)
• NRR: 106% | Churn: 5.8%
• Onboarded 40 new SME accounts in 18 months; average time-to-value: 11 days
• Identified and closed 12 upsell opportunities (€85K ARR) with Account Executive support
• Deliver monthly group webinars for new feature releases (avg. 120 attendees)

Account Manager (Retention) — Teamleader, Antwerp (March 2019 – August 2021)
• Managed 300 SME accounts in churn prevention role
• Saved 45 at-risk accounts from churning through structured intervention calls
• Processed contract renewals and basic upsell conversations

EDUCATION
BSc Applied Business Engineering — Artesis Plantijn Hogeschool, Antwerp (2016 – 2019) | Cum laude

SKILLS
CS tools: Salesforce (proficient), HubSpot (basic), Gainsight (none)
Process: account management, renewal management, churn prevention, basic upsell
Product: deep Teamleader CRM/invoicing/project management knowledge

LANGUAGES
Dutch (native), English (good/B2), French (good/B2)`,
    summary: `Current Teamleader CSM with deep product knowledge but managing the SME segment, not enterprise. NRR is 106% — below the 110%+ target. No Gainsight experience. This is an internal promotion candidate who would need significant development to handle €50–200K ARR enterprise accounts. Worth considering as a long-term investment but not the enterprise-ready profile needed now.`,
    strengths: ['Current Teamleader CSM — perfect product knowledge', 'Deep understanding of the SME customer persona', 'Dutch native + French B2 — good for Benelux', 'Internal candidate — cultural fit confirmed', 'Artesis Antwerp background — local Belgian candidate'],
    weaknesses: ['SME background — enterprise accounts are a fundamentally different motion', 'NRR 106% — below enterprise target (>115%)', 'No Gainsight experience', 'No executive-level stakeholder management experience', 'ARR per account too small vs. €50K–200K enterprise range'],
    skills: ['Salesforce', 'HubSpot', 'Teamleader product knowledge', 'Churn prevention', 'Renewal management', 'Account management', 'Webinar delivery'],
    experience: '4 ans: CSM chez Teamleader Antwerpen (3 jaar) — 180 KMO accounts, €900K ARR. Account Manager (Retention) chez Teamleader (2 jaar) — 300 accounts.',
    education: 'BSc Applied Business Engineering, Artesis Plantijn Antwerpen, 2019, cum laude.',
    recommendation: 'maybe',
    language: 'nl',
    status: 'new',
    source: 'upload',
    vacancyIndex: 7,
  },

  {
    firstName: 'Claire',
    lastName: 'Renard',
    email: 'claire.renard.saas@gmail.com',
    phone: '+32 472 667 890',
    cvContent: `CLAIRE RENARD
claire.renard.saas@gmail.com | +32 472 667 890 | Louvain-la-Neuve, Belgique
linkedin.com/in/clairerenard-cs

PROFESSIONAL SUMMARY
Customer Success Manager with 5 years at B2B SaaS companies in Brussels and Louvain-la-Neuve. Managed enterprise and mid-market accounts in HR technology and project management software. NRR: 117% average. Trilingual FR/NL/EN. Experience with Gainsight and Salesforce in enterprise CS motion.

EXPERIENCE

Customer Success Manager — Enterprise — Protime (HR SaaS), Brussels (June 2020 – present)
• Manage portfolio of 45 enterprise accounts (€2.8M ARR) — Belgian and French accounts
• NRR: 117% over 3 years | Churn: 3.2%
• Closed €380K expansion ARR through additional modules (scheduling, absence management)
• Facilitate QBRs for strategic accounts with HR Director and CFO
• Manage large enterprise onboardings (500–3,000 users): workstream planning, data migration, go-live support
• Implemented Gainsight health scoring (customer level, feature adoption) for Protime CS team

Customer Success Manager — Abby (SaaS for freelancers), Louvain-la-Neuve (October 2018 – May 2020)
• Managed 300 SME/freelancer accounts in French-speaking Belgium
• NRR: 108% | Churn prevention through proactive outreach programme

EDUCATION
Master en Sciences Économiques et de Gestion — UCLouvain (2016 – 2018) | Distinction
Bachelor en Sciences de Gestion — UCLouvain (2013 – 2016)

SKILLS
CS: Gainsight (health scores, playbooks, CTAs), Salesforce (proficient), Intercom
Process: QBRs, executive stakeholder management, enterprise onboarding, churn forecasting, expansion selling
Domain: HR tech (scheduling, absence, payroll adjacent), project management, freelancer economy

LANGUAGES
French (native), Dutch (fluent/C1), English (fluent/C1)`,
    motivationText: `Hi Teamleader CS Team,

I'm applying for the Enterprise CSM role because Teamleader is the natural next step from my current role at Protime — similar product category (B2B business workflow SaaS), similar customer size (Belgian SME and mid-market), and similar expansion motion (modules, seats).

My current portfolio at Protime is €2.8M ARR with 117% NRR. I understand the enterprise CS motion: executive relationships, structured QBRs, complex onboardings with data migration, expansion through platform deepening. I've implemented Gainsight from scratch for the Protime CS team.

What excites me about Teamleader specifically: the Visma Group's European reach is a real differentiator. The opportunity to manage cross-border accounts in a platform that serves both Belgian and Dutch companies aligns perfectly with my trilingual profile.

I'm available in Ghent 3 days per week and can start within 4 weeks.

Claire`,
    summary: `Strong enterprise CSM candidate with 5 years at Protime (HR SaaS), 117% NRR, €380K expansion ARR, Gainsight implementation experience. Trilingual FR/NL/EN is a major asset for Teamleader's Benelux + French market. Domain is adjacent (HR SaaS vs. CRM/project management). High potential fit.`,
    strengths: ['5 years enterprise CS in adjacent HR SaaS domain', '117% NRR — above the 115% target', 'Gainsight implementation experience (from scratch)', 'Trilingual FR/NL/EN — perfect for Benelux + France market', 'UCLouvain Master SCG — strong academic background'],
    weaknesses: ['HR SaaS domain (Protime) vs. CRM/project management SaaS — domain switch', 'Portfolio ARR (€2.8M) slightly below the €4M+ range expected', 'No prior Teamleader product knowledge'],
    skills: ['Gainsight', 'Salesforce', 'Intercom', 'QBR facilitation', 'Enterprise onboarding', 'Churn forecasting', 'Expansion selling', 'Data migration management'],
    experience: '5 ans: CSM Enterprise chez Protime Brussels (4 ans) — 45 accounts, €2,8M ARR, 117% NRR, Gainsight. CSM chez Abby Louvain-la-Neuve (2 ans) — 300 KMO accounts.',
    education: 'Master Sciences Éco & Gestion, UCLouvain, 2018. BSc Sciences de Gestion, UCLouvain, 2016.',
    recommendation: 'strong_yes',
    language: 'fr',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 7,
  },

  // ── Vacancy 8: Business Development Manager – Silverfin ───────────────────

  {
    firstName: 'Raphaël',
    lastName: 'Courtois',
    email: 'raphael.courtois.sales@gmail.com',
    phone: '+32 476 889 113',
    cvContent: `RAPHAËL COURTOIS
raphael.courtois.sales@gmail.com | +32 476 889 113 | Paris, France (open to Gand/Bruxelles)
linkedin.com/in/raphaelcourtois-bdm

PROFIL PROFESSIONNEL
Business Development Manager avec 8 ans d'expérience en vente B2B complexe de logiciels SaaS, dont 5 ans spécialisés dans l'écosystème de l'expertise comptable en France. Réseau établi dans les cabinets d'expertise comptable du Top 30 français. Quota atteint ou dépassé pendant 6 exercices consécutifs.

EXPÉRIENCE

Business Development Manager — ACD Groupe (logiciel comptable), Paris (mars 2019 – présent)
• Responsable grands comptes : acquisition de cabinets d'expertise comptable 50–500 collaborateurs en Île-de-France et Grand Est
• Quota annuel : €650K nouveau ARR — atteint à 127% en 2023, 118% en 2022, 109% en 2021
• Portefeuille actif : 28 clients grands comptes (€3,2M ARR géré)
• Cycle de vente moyen : 6 mois | Taille moyenne de deal : €85K ARR
• Développement de partenariats avec 3 groupements de cabinets (Fiducial, Cerfrance, Orus)
• Participation aux congrès OEC Île-de-France et SIC Paris : génération de 35% du pipeline via événements sectoriels

Business Developer — Silge (logiciel GED comptable), Lyon (septembre 2015 – février 2019)
• Vente de solutions GED aux cabinets comptables de 10 à 100 collaborateurs en région Rhône-Alpes
• Quota atteint à 112% en 2017, 104% en 2018
• 150 nouveaux clients signés en 3,5 ans

Junior Account Manager — Cegid, Paris (juillet 2013 – août 2015)
• Vente et renouvellement des licences Cegid Expert auprès de cabinets comptables

FORMATION
Master Commerce et Management International — ESSCA Paris (2011 – 2013)
Bachelor Économie et Gestion — Université Paris X Nanterre (2008 – 2011)

COMPÉTENCES
Vente : cycle long B2B, grands comptes, multi-interlocuteurs, négociation, closing
Secteur : expertise comptable, logiciels comptables (Cegid, ACD, Quadratus), IA comptable
CRM : Salesforce (expert — pipeline, forecast, activity tracking, reports)
Talen : Français (natif), Anglais (B2), Néerlandais (A2 — cours en cours)

RÉSEAUX
Membre OEC Île-de-France (réseau professionnel), CJEC (Compagnie des Jeunes Experts-Comptables)
Réseau LinkedIn : 3.800 connexions dans le milieu de l'expertise comptable française`,
    motivationText: `Bonjour,

Je candidate au poste de Business Development Manager Grands Comptes chez Silverfin. Si je prends le temps de postuler, c'est parce que je connais Silverfin depuis 3 ans — j'ai perdu 2 deals face à vous, et cela m'a poussé à comprendre ce que vous faites différemment.

Ma valeur ajoutée pour Silverfin : je vends des logiciels aux cabinets comptables depuis 8 ans. J'ai un réseau réel dans les Top 30 et les groupements (Fiducial, Cerfrance), je connais les objections par cœur, et je sais comment positionner une solution cloud face à un cabinet qui héberge encore ses données en local.

Mon quota 2023 : €650K, atteint à 127%. Je suis disponible pour une prise de poste rapide.

Raphaël Courtois`,
    summary: `Profil exceptionnel: 8 ans de vente SaaS aux cabinets comptables, réseau établi, quota dépassé pendant 6 exercices consécutifs. Connait les concurrents de Silverfin par l'intérieur. C'est le candidat le plus aligné avec les exigences du poste dans tout le pipeline.`,
    strengths: ['8 ans de vente SaaS aux cabinets comptables — secteur exact', 'Quota dépassé 6 exercices consécutifs (127% en 2023)', 'Réseau établi dans les groupements (Fiducial, Cerfrance, Orus)', 'Connaissance approfondie de l\'écosystème concurrentiel (Cegid, ACD)', 'Membre OEC et CJEC — réseau institutionnel secteur'],
    weaknesses: ['Basé à Paris — relocalisation vers Gand/Bruxelles requise', 'Néerlandais A2 — pourra être limité sur la Belgique néerlandophone', 'Vente en France principalement — marché belge à construire'],
    skills: ['B2B SaaS sales', 'Accounting firm ecosystem', 'Salesforce CRM', 'Pipeline management', 'Quota attainment', 'Multi-stakeholder selling', 'Event-based prospecting', 'Grand compte management'],
    experience: '8 ans: BDM chez ACD Groupe Paris (5 ans) — quota €650K, 127% attainment, 28 grands comptes. Business Developer chez Silge Lyon (3,5 ans) — 150 clients. Junior AM chez Cegid (2 ans).',
    education: 'Master Commerce International, ESSCA Paris, 2013. Bachelor Éco & Gestion, Paris X Nanterre, 2011.',
    recommendation: 'strong_yes',
    language: 'fr',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 8,
  },

  {
    firstName: 'Pauline',
    lastName: 'Berger',
    email: 'pauline.berger.biz@gmail.com',
    phone: '+33 6 78 90 12 34',
    cvContent: `PAULINE BERGER
pauline.berger.biz@gmail.com | +33 6 78 90 12 34 | Lyon, France (mobilité France/Belgique)
linkedin.com/in/paulineberger-bdm

PROFIL
Business Developer SaaS avec 5 ans d'expérience dans la fintech et les legaltech. Vente B2B complexe cycles 3–8 mois. Pas d'expérience directe dans l'expertise comptable mais bonne compréhension des problématiques de conformité et de digitalisation des professions réglementées.

EXPÉRIENCE

Senior Account Executive — LegalPlace (legaltech SaaS), Paris (mai 2021 – présent)
• Vente de solutions juridiques SaaS aux cabinets d'avocats, notaires et experts-comptables (segment moyen)
• Quota annuel : €420K nouveau ARR — atteint à 103% (2023), 97% (2022)
• Cycle de vente : 4–8 mois | Deal size moyen : €35K ARR
• Prospection : outreach LinkedIn, événements sectoriels (Salon du Droit, Village de la Justice)

Business Developer — Spendesk (fintech SaaS), Paris (septembre 2018 – avril 2021)
• Vente de la solution de gestion des dépenses aux mid-market (50–500 ETP) — secteurs variés
• Quota atteint à 108% en 2019, 99% en 2020
• 45 nouveaux clients signés en 2,5 ans

FORMATION
Master Grande École — Grenoble École de Management (2016 – 2018) | Mention bien
Bachelor AES — Université Grenoble Alpes (2013 – 2016)

COMPÉTENCES
Vente SaaS B2B, gestion de pipeline, Salesforce, HubSpot, LinkedIn Sales Navigator
Talen : Français (natif), Anglais (C1), Néerlandais (A1)`,
    summary: `BDM SaaS avec 5 ans d'expérience dans des domaines adjacents (legaltech, fintech). Le quota est autour de 100% (103%, 97%) — dans la norme mais pas exceptionnel. La principale lacune est l'absence d'expérience directe dans le secteur de l'expertise comptable, qui est très spécifique. Deal size également inférieur (€35K vs. €85K+ attendu pour les grands cabinets).`,
    strengths: ['5 ans vente SaaS B2B cycles longs — compétence technique transférable', 'Expérience professions réglementées (avocats, notaires, experts-comptables) chez LegalPlace', 'Grenoble École de Management — formation commerciale solide'],
    weaknesses: ['Pas d\'expérience directe expertise comptable pure — secteur très spécifique', 'Quota atteint à ~100% — pas de dépassement significatif', 'Deal size €35K vs. grands comptes €85K+ chez Silverfin', 'Néerlandais A1 — limite sévère pour la Belgique', 'Pas de réseau établi dans les cabinets comptables belges ou français top 30'],
    skills: ['B2B SaaS sales', 'Salesforce', 'HubSpot', 'LinkedIn Sales Navigator', 'Pipeline management', 'Legal SaaS', 'Fintech SaaS'],
    experience: '5 ans: Senior AE chez LegalPlace Paris (3 ans) — legaltech, quota €420K. Business Developer chez Spendesk (2,5 ans) — fintech, 45 clients.',
    education: 'Master Grande École, Grenoble École de Management, 2018. BSc AES, UGA, 2016.',
    recommendation: 'maybe',
    language: 'fr',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 8,
  },

  {
    firstName: 'Guillaume',
    lastName: 'Marceau',
    email: 'guillaume.marceau@me.com',
    phone: '+32 477 001 224',
    cvContent: `GUILLAUME MARCEAU
guillaume.marceau@me.com | +32 477 001 224 | Bruxelles, Belgique
linkedin.com/in/guillaumemarceau-sales

PROFIL PROFESSIONNEL
Business Development Manager avec 6 ans d'expérience en vente B2B SaaS et conseil en transformation digitale auprès de PME belges et françaises. Réseau belge établi. Expérience dans la vente aux cabinets comptables belges et aux fiduciaires. Bilingue FR/NL.

EXPÉRIENCE

Business Development Manager — Yuki (logiciel comptable cloud), Bruxelles (janvier 2021 – présent)
• Développement commercial en Belgique francophone et auprès des fiduciaires belges
• Quota : €280K nouveau ARR — atteint à 115% (2023), 108% (2022)
• 35 nouveaux cabinets comptables signés en 3 ans (taille moyenne: 8–25 collaborateurs)
• Partenariats avec l'IPCF (Institut Professionnel des Comptables et Fiscalistes agréés)
• Participation aux salons Accountancy Expo et Fednot Digital

Account Executive — Odoo (ERP cloud), Louvain-la-Neuve (mars 2018 – décembre 2020)
• Vente d'Odoo aux PME belges 10–200 ETP (industrie, distribution, services)
• Quota : €200K — atteint à 122% (2019), 110% (2020)
• 60 nouvelles entreprises signées en 2,5 ans

FORMATION
Master en Gestion — Solvay Brussels School (ULB) (2015 – 2017) | Distinction
Bachelor Sciences Commerciales — ICHEC Bruxelles (2012 – 2015)

COMPÉTENCES
Vente B2B SaaS, cycle long, multi-interlocuteurs, closing
Secteur : expertise comptable belge, fiduciaires, PME belges
CRM : HubSpot (expert), Salesforce (bon utilisateur)
Talen : Français (natif), Néerlandais (C1), Anglais (C1)

RÉSEAUX
Membre IPCF (réseau professionnel comptable belge)
Réseau LinkedIn : 2.100 connexions, majoritairement milieu comptable et PME belge`,
    motivationText: `Bonjour,

Je candidate au poste de BDM Grands Comptes chez Silverfin. Depuis 3 ans, je vends des logiciels comptables cloud aux cabinets belges chez Yuki, et Silverfin est le positionnement auquel j'aspire : grands comptes, cycle plus complexe, ROI plus difficile à démontrer — mais aussi plus satisfaisant quand il est réalisé.

Ma force principale : je connais l'écosystème comptable belge. J'ai un accès direct à l'IPCF, je connais les groupements comme Comed et Nextpharma, et j'ai construit mes 35 clients chez Yuki en partant de zéro.

La limite honnête : mes deals actuels sont petits (8–25 collaborateurs). Les grands cabinets (100+) seraient un nouveau registre pour moi — mais j'ai la capacité relationnelle et la connaissance secteur pour y accéder.

Guillaume`,
    summary: `Candidat belge bilingue FR/NL avec 6 ans de vente de logiciels comptables aux fiduciaires belges et réseau IPCF. Quota dépassé régulièrement. Lacune principale: deals actuels trop petits (PME vs. grands cabinets 100+ attendus par Silverfin). Bon potentiel moyen terme.`,
    strengths: ['Réseau établi dans l\'écosystème comptable belge (IPCF, Yuki clients)', 'Bilingue FR/NL — avantage majeur pour la Belgique', 'Quota dépassé (115%, 108% chez Yuki; 122% chez Odoo)', 'Connaissance directe des fiduciaires belges et de leur écosystème', 'Solvay Brussels School — bonne formation commerciale'],
    weaknesses: ['Deals actuels: cabinets 8–25 collaborateurs vs. grands cabinets 100+ attendus', 'Quota €280K vs. objectif Silverfin de €600K+ — moitié moins', 'Pas d\'expérience grands comptes ou multi-interlocuteurs C-level', 'Transition vers deals plus complexes non encore prouvée'],
    skills: ['B2B SaaS sales', 'Accounting software', 'Belgian fiduciaires', 'HubSpot', 'Salesforce', 'IPCF network', 'Pipeline management', 'Quota attainment'],
    experience: '6 ans: BDM chez Yuki Bruxelles (3 ans) — logiciel comptable cloud, 35 cabinets belges. AE chez Odoo Louvain-la-Neuve (2,5 ans) — ERP PME belge, 60 clients.',
    education: 'Master Gestion, Solvay Brussels School ULB, 2017. BSc Sciences Commerciales, ICHEC Bruxelles, 2015.',
    recommendation: 'yes',
    language: 'fr',
    status: 'reviewing',
    source: 'upload',
    vacancyIndex: 8,
  },

  {
    firstName: 'Antoine',
    lastName: 'Lefèvre',
    email: 'antoine.lefevre.commercial@gmail.com',
    phone: '+33 7 89 01 23 45',
    cvContent: `ANTOINE LEFÈVRE
antoine.lefevre.commercial@gmail.com | +33 7 89 01 23 45 | Bordeaux, France

PROFIL
Commercial B2B avec 3 ans d'expérience dans la vente de logiciels RH. Cherche à rejoindre une scale-up SaaS dynamique. Peu d'expérience dans le secteur comptable mais bonne énergie commerciale et ambition forte.

EXPÉRIENCE

Account Executive — Lucca (logiciel RH SaaS), Paris (juin 2022 – présent)
• Vente de la suite Lucca aux PME 30–200 ETP — secteurs variés
• Quota : €180K nouveau ARR — atteint à 95% (2023), 88% (2022)
• 25 nouveaux clients en 2 ans

SDR — Hibob (HR SaaS), Paris (septembre 2021 – mai 2022)
• Prospection et qualification de leads inbound et outbound
• 120 meetings qualifiés générés en 8 mois pour l'équipe AE

FORMATION
Bachelor Commerce — Kedge Business School Bordeaux (2018 – 2021) | Mention bien

COMPÉTENCES
Prospection, qualification, closing de PME
Outils : Salesforce, Apollo, LinkedIn Sales Navigator, HubSpot
Talen : Français (natif), Anglais (B2), Néerlandais (aucun)`,
    summary: `Commercial junior avec 3 ans d'expérience en vente de logiciels RH. Quota non atteint (95%, 88%). Aucune expérience dans l'expertise comptable. Trop junior et hors secteur pour un rôle BDM Grands Comptes chez Silverfin qui nécessite 4+ ans et un réseau dans les cabinets comptables.`,
    strengths: ['Énergie commerciale claire', 'Expérience SaaS B2B', 'Kedge Business School — formation sérieuse'],
    weaknesses: ['3 ans d\'expérience vs. 4+ requis — insuffisant', 'Quota sous-atteint (95%, 88%) — signal préoccupant', 'Aucune expérience expertise comptable ni fiduciaires', 'Aucune connaissance du néerlandais — problème sévère pour la Belgique', 'Deals trop petits (PME 30–200 vs. grands cabinets 100+ de Silverfin)', 'Pas de réseau dans le milieu comptable'],
    skills: ['B2B SaaS sales', 'Salesforce', 'Apollo', 'LinkedIn Sales Navigator', 'HubSpot', 'Prospecting', 'SDR qualification'],
    experience: '3 ans: AE chez Lucca Paris (2 ans) — HR SaaS, PME. SDR chez Hibob Paris (8 mois).',
    education: 'Bachelor Commerce, Kedge Business School Bordeaux, 2021.',
    recommendation: 'no',
    language: 'fr',
    status: 'rejected',
    source: 'email',
    vacancyIndex: 8,
  },

  {
    firstName: 'Isabeau',
    lastName: 'Moreau',
    email: 'isabeau.moreau.bdm@gmail.com',
    phone: '+32 479 334 557',
    cvContent: `ISABEAU MOREAU
isabeau.moreau.bdm@gmail.com | +32 479 334 557 | Namur, Belgique
linkedin.com/in/isabeaumoreau-sales

PROFIL PROFESSIONNEL
Business Development Manager avec 7 ans d'expérience en vente B2B SaaS auprès de PME et grands comptes belges. Expérience directe dans la vente aux cabinets comptables et fiduciaires belges. Trilingue FR/NL/EN. Quota dépassé pendant 5 exercices consécutifs.

EXPÉRIENCE

Business Development Manager — Isabel Group, Bruxelles (janvier 2020 – présent)
• Développement commercial de la plateforme Isabel 6 (open banking, e-facturation) auprès de cabinets comptables et PME belges
• Quota : €500K nouveau ARR — atteint à 119% (2023), 111% (2022), 124% (2021)
• 55 nouveaux cabinets comptables et fiduciaires clients en 4 ans
• Comptes gérés : Top 20 des fiduciaires belges (BDO, Moore, Nexia, Liantis)
• Gestion de cycles complexes 6–12 mois avec DSI, direction financière et associés
• Participation au Congrès IEC-IAB et à l'Accountancy Expo annuel

Senior Account Executive — Billtobox (Unifiedpost), Louvain-la-Neuve (mars 2016 – décembre 2019)
• Vente de la solution de dématérialisation des factures aux PME et cabinets comptables belges
• Quota : €300K — atteint à 118% en 2018, 107% en 2019
• 80 nouveaux clients en 3,5 ans

FORMATION
Master en Sciences de Gestion — FUNDP Namur (2013 – 2015) | Grande distinction
Bachelor Sciences Économiques — FUNDP Namur (2010 – 2013)

COMPÉTENCES
Vente B2B complexe : cycle long, multi-décideurs (associés, DSI, direction financière)
Secteur : expertise comptable belge, e-facturation, open banking, dématérialisation
CRM : Salesforce (expert), HubSpot
Réseaux : IEC-IAB, réseau Top 20 fiduciaires belges, 2.800 connexions LinkedIn comptabilité belge
Talen : Français (natif), Néerlandais (C1), Anglais (C1)`,
    motivationText: `Madame, Monsieur,

Je postule au poste de BDM Grands Comptes chez Silverfin en tant qu'actuelle Business Development Manager chez Isabel Group, où je vends des solutions open banking et e-facturation aux cabinets comptables belges — y compris aux Top 20 fiduciaires que Silverfin cible.

Ce qui me différencie des autres candidats : j'ai déjà une relation avec les décideurs des grands cabinets belges (BDO, Moore, Nexia, Liantis). Je connais leur cycle d'achat, leurs freins, leurs comités de direction. Je sais que le principal obstacle à la vente de Silverfin n'est pas le produit — c'est la migration des données et la résistance au changement des collaborateurs séniors.

Mon quota 2023 chez Isabel : €500K, atteint à 119%. Je suis disponible pour un entretien à votre convenance.

Isabeau Moreau`,
    summary: `Candidat exceptionnel: 7 ans de vente SaaS aux cabinets comptables belges, réseau direct dans les Top 20 fiduciaires belges (BDO, Moore, Nexia), quota dépassé pendant 5 exercices consécutifs. Isabel Group est une référence dans l'écosystème fintech-comptable belge — accès aux mêmes prospects que Silverfin. Meilleur profil du pipeline.`,
    strengths: ['7 ans vente SaaS aux cabinets comptables belges — secteur exact', 'Réseau Top 20 fiduciaires belges (BDO, Moore, Nexia, Liantis)', 'Quota dépassé 5 exercices consécutifs (119%, 111%, 124%)', 'Isabel Group = concurrent/partenaire direct de Silverfin — connaissance parfaite du terrain', 'Trilingue FR/NL/EN — idéal pour la Belgique bilingue'],
    weaknesses: ['Vient d\'un concurrent proche (Isabel Group) — confidentialité commerciale à discuter', 'Quota €500K vs. objectif Silverfin €600K — légèrement en dessous mais trajectoire claire'],
    skills: ['B2B SaaS sales', 'Belgian accounting firms', 'Fiduciaires belges', 'Salesforce', 'HubSpot', 'IEC-IAB network', 'Open banking', 'E-facturation', 'Multi-stakeholder selling'],
    experience: '7 ans: BDM chez Isabel Group Bruxelles (4 ans) — open banking/e-fact, 55 cabinets comptables, Top 20 fiduciaires. Senior AE chez Billtobox/Unifiedpost (3,5 ans) — dématérialisation, 80 clients.',
    education: 'Master Sciences de Gestion, FUNDP Namur, 2015, grande distinction. BSc Sciences Économiques, FUNDP Namur, 2013.',
    recommendation: 'strong_yes',
    language: 'fr',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 8,
  },

  {
    firstName: 'Mehdi',
    lastName: 'Benali',
    email: 'mehdi.benali.saas@gmail.com',
    phone: '+33 6 23 45 67 89',
    cvContent: `MEHDI BENALI
mehdi.benali.saas@gmail.com | +33 6 23 45 67 89 | Montpellier, France (mobilité France)
linkedin.com/in/mehdibenali-commercial

PROFIL
Account Executive SaaS avec 4 ans d'expérience dans la vente de solutions ERP/comptabilité aux PME françaises. Familier avec le secteur comptable mais expérience limitée aux grands cabinets. Francophone uniquement.

EXPÉRIENCE

Account Executive — Sage France, Montpellier (avril 2021 – présent)
• Vente de Sage 50 et Sage 100 aux PME françaises 10–100 ETP
• Quota : €240K — atteint à 101% (2023), 94% (2022)
• Clients principalement dans le secteur PME, quelques cabinets comptables régionaux

Business Developer — Indy (comptabilité en ligne), Paris (janvier 2020 – mars 2021)
• Vente et customer success pour les auto-entrepreneurs et freelances
• Prospection digitale (SEO, webinaires) et closing téléphonique

FORMATION
Bachelor Commercial — IUT Techniques de Commercialisation, Montpellier (2016 – 2019)

COMPÉTENCES
Vente : closing PME, gestion de pipeline, démonstrations produits
CRM : Salesforce (utilisateur), HubSpot
Talen : Français (natif), Anglais (B1), Néerlandais (aucun)`,
    summary: `Junior AE avec expérience en vente de logiciels comptables aux PME françaises. Plusieurs limitations rédhibitoires pour Silverfin: deals trop petits (PME vs. grands cabinets), francophone uniquement (pas de néerlandais, B1 anglais), quota à peine atteint, pas de réseau grands cabinets. Profil non adapté à ce poste.`,
    strengths: ['Familiarité avec les logiciels comptables (Sage)', 'Expérience vente SaaS B2B'],
    weaknesses: ['Aucune connaissance du néerlandais — critique pour le marché belge', 'Deals PME petites vs. grands cabinets 100+ de Silverfin', 'Quota à peine atteint (101%, 94%)', 'Pas de réseau dans l\'expertise comptable niveau Top 30', 'Formation IUT vs. Master attendu dans un contexte scale-up', 'Mobilité France uniquement — ne mentionne pas la Belgique'],
    skills: ['Salesforce', 'HubSpot', 'Sage ERP', 'SME sales', 'Pipeline management', 'Product demos'],
    experience: '4 ans: AE chez Sage France Montpellier (3 ans) — ERP/comptabilité PME. Business Developer chez Indy Paris (1 an) — auto-entrepreneurs.',
    education: 'Bachelor Commercial IUT Techniques de Commercialisation, Montpellier, 2019.',
    recommendation: 'no',
    language: 'fr',
    status: 'rejected',
    source: 'upload',
    vacancyIndex: 8,
  },

  // ── Vacancy 9: Software Architect – Infrabel ───────────────────────────────

  {
    firstName: 'Jeroen',
    lastName: 'Buysse',
    email: 'jeroen.buysse.arch@gmail.com',
    phone: '+32 475 001 224',
    cvContent: `JEROEN BUYSSE
jeroen.buysse.arch@gmail.com | +32 475 001 224 | Bruges, Belgium
linkedin.com/in/jeroenbuysse-architect | github.com/jbuysse-arch

PROFESSIONAL SUMMARY
Software Architect with 14 years of experience in enterprise integration, distributed systems, and legacy modernisation. Spent 6 years as Solution Architect at SNCB (Belgian rail) before moving to the private sector. Deep knowledge of Belgian railway IT landscape, EU rail data standards (TAF-TSI, TAP-TSI), and ETCS/ERTMS signalling systems architecture. TOGAF 9.2 certified.

EXPERIENCE

Principal Solution Architect — Cronos Group (IT consulting), Brussels (January 2021 – present)
• Lead architect on 3 concurrent large-scale enterprise integration projects (insurance, logistics, public transport)
• Designed event-driven integration platform (Azure Service Bus + API Management) for a Belgian intermodal logistics group (50M+ events/month)
• Architecture decision records, C4 diagrams, and governance for a portfolio of 12 microservices
• TOGAF-based enterprise architecture governance: reviewed and approved 35 Architecture Decision Records
• Led legacy modernisation programme (strangler fig pattern) for a Java monolith at Brussels Airport

Solution Architect — SNCB, Brussels (February 2015 – December 2020)
• Solution Architect for SNCB's digital transformation: real-time train tracking API, passenger information system, and crew management platform
• Designed TAF-TSI / TAP-TSI compliant data exchange interfaces with Infrabel, ProRail, and DB Netz
• Led migration from Oracle Forms to Angular/Spring Boot microservices (6-year programme, 23 applications)
• Designed Azure-based real-time train position API (Azure Event Hubs + Stream Analytics) consumed by 8 external partners
• Stakeholder: CIO, external vendors (Thales, Alstom, Siemens), and EU ERA (European Union Agency for Railways)

Enterprise Architect — Capgemini Belgium, Brussels (March 2011 – January 2015)
• Solution architect for 5 major Belgian public sector IT projects (SPF Finance, SNCB, Bpost)
• Introduced domain-driven design principles and API-first architecture standards for 3 client portfolios

EDUCATION
MSc Computer Science — KU Leuven (2007 – 2009) | Cum laude
BSc Applied Informatics — KU Leuven (2004 – 2007) | Distinction

CERTIFICATIONS
TOGAF 9.2 Certified (2019)
Azure Solutions Architect Expert (2022)
CKAD – Certified Kubernetes Application Developer (2021)

TECHNICAL SKILLS
Architecture: microservices, event-driven (Azure Service Bus, Kafka), API gateway (APIM), DDD, CQRS, saga pattern
Cloud: Azure (Expert) — AKS, Service Bus, API Management, Azure Data Factory, Azure Event Hubs
Legacy modernisation: strangler fig pattern, anti-corruption layers, incremental migration
Standards: TAF-TSI, TAP-TSI, ETCS/ERTMS (Level 1/2/3 conceptual), NeTEx/SIRI passenger information
Modelling: ArchiMate (expert), C4 model, BPMN, UML
Tools: Azure DevOps, Confluence, Jira, draw.io, Structurizr

LANGUAGES
Dutch (native), English (fluent/C2), French (good/B2)`,
    motivationText: `Dear Infrabel Architecture Team,

I spent 6 years as Solution Architect at SNCB, Infrabel's sister company. The systems I designed — the real-time train position API, the TAF-TSI/TAP-TSI data exchange interfaces with Infrabel, the crew management platform — are the kinds of problems I understand at a deep level. Moving to Infrabel is the logical continuation of work I already started.

What I want to bring to Infrabel that SNCB didn't give me: the infrastructure layer. At SNCB I was always on the consumer side of Infrabel's data. I want to work on the platform itself — the track capacity systems, the real-time signalling data, the asset management architecture. These are harder problems.

I'm TOGAF certified, Azure Expert certified, and I have hands-on TAF-TSI/TAP-TSI implementation experience. I also speak the ERA regulatory language — I've attended EU Agency for Railways working groups and know what TAF-TSI compliance means in practice.

Jeroen`,
    summary: `Exceptional candidate: 14 years enterprise architecture, 6 years as SNCB Solution Architect with direct TAF-TSI/TAP-TSI experience, TOGAF certified, Azure Expert, legacy modernisation expertise. The closest possible profile match — he knows the Belgian rail ecosystem from the inside.`,
    strengths: ['14 years enterprise architecture including 6 years at SNCB (sister company)', 'TAF-TSI/TAP-TSI direct implementation experience at SNCB', 'TOGAF 9.2 + Azure Expert + CKAD — complete certification profile', 'Designed real-time train tracking API already in use by Infrabel partners', 'ERA (European Union Agency for Railways) working group participant'],
    weaknesses: ['Currently at Cronos (consulting) — may have active client commitments', 'Belgian rail insider — may have preconceptions about Infrabel IT culture'],
    skills: ['TOGAF', 'Azure Service Bus', 'Azure API Management', 'Event-driven architecture', 'Microservices', 'DDD', 'TAF-TSI', 'TAP-TSI', 'ETCS/ERTMS', 'ArchiMate', 'C4 model', 'Strangler fig pattern', 'Azure AKS', 'ADRs'],
    experience: '14 ans: Principal Solution Architect bij Cronos Group Brussels (4 jaar) — enterprise integration, Azure, TOGAF governance. Solution Architect bij SNCB Brussels (6 jaar) — TAF-TSI, real-time train API, 23 apps migratie. Enterprise Architect bij Capgemini Belgium (4 jaar).',
    education: 'MSc Computer Science, KU Leuven, 2009, cum laude. TOGAF 9.2, Azure Expert, CKAD.',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'upload',
    vacancyIndex: 9,
  },

  {
    firstName: 'Céline',
    lastName: 'Dumont',
    email: 'celine.dumont.archi@gmail.com',
    phone: '+32 477 112 335',
    cvContent: `CÉLINE DUMONT
celine.dumont.archi@gmail.com | +32 477 112 335 | Liège, Belgium
linkedin.com/in/celinedumont-architect

PROFESSIONAL SUMMARY
Software Architect with 11 years of experience in financial services and public sector IT. Expert in microservices, event-driven architecture, and Azure cloud. TOGAF certified. Strong track record of leading legacy modernisation programmes in regulated environments (banking, social security). No railway experience but deep regulated-systems architecture expertise.

EXPERIENCE

Solution Architect — SPF Sécurité Sociale / BCSS, Brussels (March 2019 – present)
• Lead architect for the Belgian Social Security network (BCSS) modernisation: 15 interconnected systems serving 5M+ citizens
• Designed event-driven integration layer (Azure Service Bus) replacing SOAP-based point-to-point integrations (40+ legacy interfaces)
• Produced Architecture Decision Records (ADRs), ArchiMate diagrams, and C4 models for all major system changes
• Led domain-driven design workshops with 8 domain teams; established bounded context map for social security data domain
• Stakeholder management: Crossroads Bank for Social Security board, KSZ/BCSS CIO, external audit teams
• Implemented API Management (Azure APIM) as the unified gateway for all external data consumers (eHealth, Dimona, etc.)

Solution Architect — ING Belgium, Brussels (January 2016 – February 2019)
• Led API-first transformation for ING Belgium's retail banking platform: designed 45 REST APIs consumed by mobile and web channels
• Designed anti-corruption layer for legacy Cobol/DB2 banking core (strangler fig pattern)
• Introduced contract-first API design (OpenAPI 3.0) adopted by 12 development teams

Software Architect — Accenture Belgium, Brussels (September 2012 – December 2015)
• Architect on 3 public sector projects: FAMIFED, RSZ, and NMBS (SNCB) — some rail exposure here

EDUCATION
MSc Software Engineering — ULiège (2010 – 2012) | Distinction
BSc Computer Science — ULiège (2007 – 2010)

CERTIFICATIONS
TOGAF 9.2 Certified (2020) | Azure Solutions Architect Expert (2021)

TECHNICAL SKILLS
Architecture: event-driven (Azure Service Bus, Kafka evaluated), microservices, API gateway, DDD, CQRS
Cloud: Azure (Expert) — AKS, Service Bus, APIM, Data Factory
Legacy: strangler fig pattern, anti-corruption layers, SOAP→REST migration
Modelling: ArchiMate (proficient), C4 model, BPMN, OpenAPI 3.0
Belgian public sector: eHealth, Dimona, BCSS, KSZ data exchange standards
Railway: some SNCB exposure at Accenture (3 years ago — not deep)

LANGUAGES
French (native), English (fluent/C2), Dutch (good/B2)`,
    summary: `Strong software architect with 11 years, TOGAF + Azure Expert certified, excellent legacy modernisation and event-driven architecture credentials in regulated Belgian public sector. No deep railway or TAF-TSI experience. The regulated-systems pattern expertise transfers well, but rail-specific knowledge would need to be built.`,
    strengths: ['11 years enterprise architecture in regulated Belgian public sector', 'TOGAF 9.2 + Azure Expert — exact certification match', 'Event-driven integration on Azure Service Bus at BCSS scale (5M+ citizens)', 'Anti-corruption layer and strangler fig pattern experience', 'ADRs, ArchiMate, C4 — exact methodology match'],
    weaknesses: ['No meaningful railway or transport industry experience', 'No TAF-TSI/TAP-TSI or ERA regulatory knowledge', 'Dutch only B2 — Infrabel is a Dutch/French bilingual organisation', 'Some SNCB exposure at Accenture was 10+ years ago and not deep'],
    skills: ['TOGAF', 'Azure Service Bus', 'Azure APIM', 'AKS', 'Event-driven architecture', 'DDD', 'CQRS', 'ArchiMate', 'C4 model', 'ADRs', 'Strangler fig pattern', 'OpenAPI 3.0', 'Anti-corruption layer'],
    experience: '11 ans: Solution Architect bij BCSS/SPF Sécurité Sociale Brussels (5 jaar) — legacy modernisatie, Azure Service Bus, APIM. Solution Architect bij ING Belgium (3 jaar) — API-first, strangler fig. Architect bij Accenture (3 jaar) — overheidsprojecten.',
    education: 'MSc Software Engineering, ULiège, 2012. BSc Computer Science, ULiège, 2010. TOGAF 9.2, Azure Expert.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 9,
  },

  {
    firstName: 'Stefan',
    lastName: 'Hoffmann',
    email: 'stefan.hoffmann.arch@gmail.com',
    phone: '+49 160 234 5678',
    cvContent: `STEFAN HOFFMANN
stefan.hoffmann.arch@gmail.com | +49 160 234 5678 | Cologne, Germany (open to Brussels)
linkedin.com/in/stefanhoffmann-architect

PROFESSIONAL SUMMARY
Principal Software Architect with 15 years of experience in railway and transport IT. Currently Principal Architect at Deutsche Bahn (DB Systel). Expert in ETCS/ERTMS, EU rail data standards (TAF-TSI, TAP-TSI, NeTEx), and real-time train control system architecture. Deep knowledge of the European rail IT ecosystem.

EXPERIENCE

Principal Software Architect — Railway Operations Systems — DB Systel, Frankfurt (March 2018 – present)
• Principal Architect for DB's real-time train operations platform (covering 30,000+ daily train movements)
• Designed event-driven architecture (Kafka + Apache Flink) for real-time delay propagation modelling
• Led TAF-TSI implementation for DB's cross-border freight operations with SNCF, SNCB, and PKP
• Designed NeTEx-compliant passenger information API consumed by 15 external journey planners
• Architecture governance: 40+ ADRs produced; Chair of DB Systel Architecture Council (railway domain)
• Stakeholder: DB Executive Board, ERA (EU Agency for Railways), UIC Technical Committee

Solution Architect — Siemens Mobility, Munich (January 2013 – February 2018)
• Lead architect for ETCS Level 2 Trackside data management system for 3 European rail operators
• Designed safety-critical real-time control system interfaces (IEC 62280 compliant)
• Delivered railway signalling data exchange standard implementations for Belgium (Infrabel contract), Netherlands (ProRail), and Germany (DB)

EDUCATION
MSc Electrical Engineering / Information Systems — TU Munich (2008 – 2010) | Summa cum laude
BSc Electrical Engineering — RWTH Aachen (2005 – 2008)

CERTIFICATIONS
TOGAF 9.2 Certified (2016) | AWS Certified Solutions Architect Professional (2021)
IEC 62280 Railway Security (2019) | Scrum Master (CSM)

TECHNICAL SKILLS
Railway: ETCS/ERTMS Levels 1–3, TAF-TSI, TAP-TSI, NeTEx/SIRI, RNE/RailML, ERA regulatory compliance
Architecture: event-driven (Kafka + Flink), microservices, real-time systems, safety-critical interfaces, IEC 62280
Cloud: AWS (Professional), Azure (intermediate — AKS, Service Bus)
Modelling: ArchiMate (expert), C4 model, BPMN, SysML (safety systems)

LANGUAGES
German (native), English (fluent/C2), French (good/B2), Dutch (basic/A2)`,
    motivationText: `Dear Infrabel Architecture Team,

I am applying for the Software Architect position from my current role as Principal Architect at DB Systel. I have directly worked with Infrabel as a stakeholder in two contexts: the TAF-TSI cross-border implementation at DB that included SNCB/Infrabel as a partner, and the Siemens Mobility ETCS Level 2 project that delivered safety-critical systems to Infrabel.

The architecture challenges you describe — real-time train tracking, predictive maintenance, legacy Oracle Forms migration, TAF-TSI compliance — are problems I have been solving for 15 years across 5 European rail operators.

What I bring that is rare: I can speak both "railway engineering" (ETCS, ERTMS, IEC 62280) and "enterprise architecture" (TOGAF, ADRs, DDD, microservices). That bridge is where the most important architectural decisions live.

Brussels is appealing to me personally — I have Belgian family and have visited Infrabel's operations centre. I would relocate within 3 months.

Stefan Hoffmann`,
    summary: `World-class rail software architect with 15 years at DB Systel and Siemens Mobility, direct Infrabel project experience, TAF-TSI implementation expert, ETCS/ERTMS deep domain knowledge, TOGAF certified. The most technically aligned profile in the entire pipeline by a significant margin.`,
    strengths: ['15 years railway IT architecture — unmatched domain depth', 'Direct Infrabel project experience (Siemens Mobility ETCS L2 contract)', 'TAF-TSI implementation with SNCB/Infrabel as explicit stakeholder', 'ETCS/ERTMS Levels 1-3 and IEC 62280 safety-critical systems expertise', 'ERA working group participation and UIC Technical Committee experience'],
    weaknesses: ['Based in Cologne — significant relocation required (motivated: Belgian family)', 'Dutch A2 — improving but still basic for bilingual Infrabel', 'Azure experience intermediate (AWS-primary) — Infrabel uses Azure'],
    skills: ['ETCS/ERTMS', 'TAF-TSI', 'TAP-TSI', 'NeTEx', 'Kafka', 'Apache Flink', 'TOGAF', 'ArchiMate', 'C4 model', 'IEC 62280', 'AWS', 'Azure', 'DDD', 'Real-time systems', 'ADRs'],
    experience: '15 ans: Principal Architect bij DB Systel Frankfurt (6 jaar) — real-time train ops, TAF-TSI, ERA. Solution Architect bij Siemens Mobility Munich (5 jaar) — ETCS L2, Infrabel/ProRail contract. Eerdere rollen (4 jaar).',
    education: 'MSc Electrical Engineering/IS, TU Munich, 2010, summa cum laude. TOGAF 9.2, AWS Professional, IEC 62280.',
    recommendation: 'strong_yes',
    language: 'en',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 9,
  },

  {
    firstName: 'Noah',
    lastName: 'Pieters',
    email: 'noah.pieters.tech@gmail.com',
    phone: '+32 492 778 001',
    cvContent: `NOAH PIETERS
noah.pieters.tech@gmail.com | +32 492 778 001 | Leuven, Belgium
github.com/noahpieters-dev

PROFESSIONAL SUMMARY
Senior Software Engineer transitioning to architecture. 8 years of development experience in microservices, cloud-native applications, and API design. Strong coding skills and emerging architecture skills. Working toward TOGAF certification. No formal architecture role yet.

EXPERIENCE

Senior Software Engineer — Bpost Digital, Brussels (April 2021 – present)
• Technical lead for the track-and-trace microservices (4 engineers): designed event-driven parcel tracking system using Azure Service Bus
• Produced C4 architecture diagrams for the track-and-trace domain; introduced ADR practice to the team
• Led tech council sessions: API design review, security standards, dependency management
• Contributed to the enterprise API gateway strategy document (participated, not led)

Software Engineer — SNCB Digital (contractor via Cegeka), Brussels (January 2019 – March 2021)
• Backend developer for SNCB's real-time train information API (Java/Spring Boot + Azure Event Hubs)
• Contributed to TAF-TSI data exchange service implementation (junior contributor)
• No architecture role — engineering contributor only

Software Engineer — Cegeka, Hasselt (August 2016 – December 2018)
• Full-stack developer for government IT projects

EDUCATION
MSc Computer Science — KU Leuven (2014 – 2016) | Cum laude
BSc Applied Informatics — KU Leuven (2011 – 2014)

SKILLS
Technical: Java (expert), Spring Boot, Python, Azure (Service Bus, Event Hubs, AKS), Kafka (intermediate)
Architecture (emerging): C4 model (intermediate), ADRs (practiced at team level), basic TOGAF concepts
Patterns: microservices, event-driven, API gateway (consumer perspective), DDD (learning)
Tools: Azure DevOps, IntelliJ, Docker, Kubernetes (developer level)

LANGUAGES
Dutch (native), English (fluent/C1), French (basic/B1)`,
    summary: `Senior engineer making the transition to architecture. Has relevant SNCB contractor experience and Azure skills. However, he has never held a formal architect role, has no TOGAF certification, and lacks the 3+ years explicit architecture experience required. The "contributing to" TAF-TSI work is developer-level, not architecture-level. Interesting internal promotion candidate in 3-5 years.`,
    strengths: ['SNCB contractor experience — some Belgian rail context', 'Azure Service Bus and Event Hubs real-world experience', 'C4 model and ADR practice started at team level', 'MSc Computer Science KU Leuven cum laude — strong technical foundation', 'Belgian candidate, Dutch native'],
    weaknesses: ['No formal architecture role — significant gap for "3+ years architect" requirement', 'TOGAF not certified — working toward it', 'TAF-TSI contribution was junior developer level, not architecture level', 'No stakeholder management or governance experience at architecture level', 'No DDD, event-driven architecture design experience at enterprise scale'],
    skills: ['Java', 'Spring Boot', 'Azure Service Bus', 'Azure Event Hubs', 'AKS', 'Kafka', 'C4 model', 'ADRs', 'Docker', 'Kubernetes', 'Python'],
    experience: '8 ans: Senior SE bij Bpost Digital Brussels (3 jaar) — tech lead, C4, ADRs. SE bij SNCB (contractor via Cegeka, 2 jaar) — real-time API, TAF-TSI contributeur. SE bij Cegeka (2,5 jaar) — overheids IT.',
    education: 'MSc Computer Science, KU Leuven, 2016, cum laude. BSc Applied Informatics, KU Leuven, 2014.',
    recommendation: 'maybe',
    language: 'nl',
    status: 'new',
    source: 'upload',
    vacancyIndex: 9,
  },

  {
    firstName: 'Arnaud',
    lastName: 'Maes',
    email: 'arnaud.maes.it@gmail.com',
    phone: '+32 478 889 002',
    cvContent: `ARNAUD MAES
arnaud.maes.it@gmail.com | +32 478 889 002 | Namur, Belgique

PROFIL
Architecte logiciel senior avec 12 ans d'expérience dans les systèmes embarqués et l'IoT industriel. Cherche à se reconvertir vers l'architecture d'entreprise dans un contexte de transport ou d'infrastructure critique. Aucune expérience ferroviaire ni en architecture d'entreprise formelle.

EXPÉRIENCE

Architecte Logiciel Embarqué — Safran Engineering Services, Gosselies (janvier 2015 – présent)
• Architecte pour les systèmes de contrôle embarqués (avionique) — cycle de certification DO-178C
• Conception d'interfaces temps réel entre systèmes embarqués et ground stations
• Travail dans un environnement à exigences de sécurité critiques (SIL3/SIL4 équivalent avionique)

Senior Développeur Embarqué — Sirris, Liège (mars 2011 – décembre 2014)
• Développement de systèmes IoT pour l'industrie manufacturière belge

FORMATION
Master en Informatique — FUNDP Namur (2009 – 2011) | Grande distinction
Bachelor Électronique — Haute École de Namur (2006 – 2009)

COMPÉTENCES
Embarqué: C/C++ (expert), RTOS, DO-178C, systèmes temps réel SIL3/4
Entreprise IT (limité): notions de microservices, notions de cloud (AWS basics)
Certification: aucune TOGAF, aucune certification cloud`,
    summary: `Embedded systems architect avec expertise avionique SIL3/4 — compétences safety-critical pertinentes dans l'absolu mais profil non aligné avec l'architecture d'entreprise cloud/API/événementielle attendue pour ce rôle. Aucune expérience ferroviaire, TOGAF ou cloud architecture enterprise. Reconversion trop importante pour être viable à court terme.`,
    strengths: ['Safety-critical systems expertise (SIL3/4 avionique) — transférable en concept à ETCS', 'Systèmes temps réel embarqués — expertise technique rare', 'Master Informatique grande distinction'],
    weaknesses: ['Aucune expérience ferroviaire ni TAF-TSI', 'Aucune expérience architecture d\'entreprise cloud (Azure Service Bus, microservices à l\'échelle)', 'Pas de TOGAF, pas de certification cloud', 'Domaine avionique très différent de l\'architecture IT enterprise', 'Reconversion trop importante pour un rôle de Software Architect en production'],
    skills: ['C/C++', 'RTOS', 'DO-178C', 'Safety-critical systems', 'SIL3/4', 'Real-time systems', 'IoT', 'AWS basics'],
    experience: '12 ans: Architecte Logiciel Embarqué chez Safran Gosselies (9 ans) — avionique, DO-178C, temps réel. Senior Dev Embarqué chez Sirris Liège (3 ans) — IoT industriel.',
    education: 'Master Informatique, FUNDP Namur, 2011, grande distinction. Bachelor Électronique, HE Namur, 2009.',
    recommendation: 'no',
    language: 'fr',
    status: 'rejected',
    source: 'email',
    vacancyIndex: 9,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// ADDITIONAL CANDIDATES to reach 6 per vacancy
// ─────────────────────────────────────────────────────────────────────────────

export const EXTRA_CANDIDATES: CandidateData[] = [
  // Vacancy 3 – 6th candidate: Financial Controller UCB
  {
    firstName: 'Gwenaëlle',
    lastName: 'Thibaut',
    email: 'gwenaelle.thibaut@gmail.com',
    phone: '+32 472 334 557',
    cvContent: `GWENAËLLE THIBAUT
gwenaelle.thibaut@gmail.com | +32 472 334 557 | Mons, Belgique
linkedin.com/in/gwenaellethibaut-finance

PROFIL PROFESSIONNEL
Financial Controller avec 6 ans d'expérience en pharmacie et chimie fine. Maîtrise SAP CO/FI et Excel avancé. CIMA qualifiée (2022). Cherche à rejoindre une grande pharma bruxelloise pour développer son expertise en controlling R&D.

EXPÉRIENCE

Financial Controller — Prayon (chimie fine), Engis (janvier 2020 – présent)
• Contrôleur de gestion pour la division R&D et Innovations (budget €35M)
• Mensualisation : accruals, provisions, analyses d'écarts vs budget
• Préparation du budget annuel et des forecasts trimestriels dans SAP CO
• Coordination avec l'équipe audit externe (BDO) lors de la clôture annuelle
• Rapports mensuels au CFO et au Director R&D

Financial Analyst — Solvay, Bruxelles (mars 2017 – décembre 2019)
• Analyste financier pour la division de chimie de performance
• Clôture mensuelle, réconciliations intercompany, reporting IFRS
• Participation au projet d'implémentation Anaplan (module utilisateur)

FORMATION
Master en Sciences de Gestion — Université de Mons (2015 – 2017) | Distinction
Bachelor Comptabilité — HELHa Mons (2012 – 2015) | Grande distinction

QUALIFICATIONS
CIMA Qualified (2022) | SAP CO/FI (utilisateur avancé)

LANGUES
Français (natif), Anglais (B2), Néerlandais (A2)`,
    summary: `Controller R&D avec 6 ans chez Prayon et Solvay, CIMA qualifiée, SAP CO/FI, participation Anaplan. Budget R&D géré plus petit (€35M vs €180M+ chez UCB) et profil moins senior que d'autres candidats. Bon potentiel de croissance mais pas le niveau senior idéal.`,
    strengths: ['6 ans pharma/chimie fine contrôle R&D — domaine pertinent', 'CIMA qualifiée (2022) — qualification professionnelle complète', 'Expérience Anaplan en tant qu\'utilisateur (projet Solvay)', 'Coordination avec Big 4 (BDO) lors des clôtures annuelles'],
    weaknesses: ['Budget R&D €35M vs. €180M+ attendu chez UCB', 'Néerlandais A2 — insuffisant pour environnement bilingue UCB', 'Anaplan uniquement utilisateur — pas de construction de modèles', 'Profil moins senior que les autres candidats du pipeline'],
    skills: ['SAP CO/FI', 'CIMA', 'IFRS', 'Anaplan (user)', 'Monthly close', 'Budget planning', 'Variance analysis', 'R&D controlling basics'],
    experience: '6 ans: Financial Controller R&D chez Prayon Engis (4 ans) — €35M budget. Financial Analyst chez Solvay Brussels (3 ans) — chimie de performance, IFRS.',
    education: 'Master Sciences de Gestion, UMons, 2017. CIMA (2022).',
    recommendation: 'maybe',
    language: 'fr',
    status: 'new',
    source: 'upload',
    vacancyIndex: 3,
  },

  // Vacancy 4 – 6th candidate: Digital Marketing Manager Colruyt
  {
    firstName: 'Joris',
    lastName: 'Nijs',
    email: 'joris.nijs.digital@gmail.com',
    phone: '+32 486 001 223',
    cvContent: `JORIS NIJS
joris.nijs.digital@gmail.com | +32 486 001 223 | Mechelen, België
linkedin.com/in/jorisnijs-marketing

PROFESSIONELE SAMENVATTING
Digital Marketing Manager met 6 jaar ervaring in e-commerce en retail. Beheerd een Google Ads-budget van €2,8M bij een Belgische pure-play e-commerce speler. Sterk in performance marketing en e-mailautomatisering. Heeft minder ervaring met loyalty-programma's maar sterk analytisch profiel.

WERKERVARING

Digital Marketing Manager — Bol.com (Belgisch team), Mechelen (april 2020 – heden)
• Verantwoordelijke voor alle Belgian Digital Marketing kanalen: SEA, e-mail, sociale media, display
• Budget: €2,8M/jaar — ROAS gemiddeld 5,4 over 2 jaar
• E-mailprogramma geoptimaliseerd via Braze: open rate +24%, conversieratio +18%
• Introductie van server-side tagging (GTM Server-Side) in samenwerking met het data team
• A/B-testprogramma: 18 significante tests in 18 maanden

Digital Marketing Specialist — 2Dehands (Adevinta), Brussel (juli 2017 – maart 2020)
• Google Ads en Meta Ads voor Belgisch marktplaatsplatform — budget €800K
• SEO-optimalisatie: organisch verkeer +45% in 18 maanden
• E-mailautomatisering via Mailchimp → Braze migratie

OPLEIDING
Master Handelswetenschappen — Universiteit Antwerpen (2015 – 2017) | Onderscheiding

VAARDIGHEDEN
Google Ads (expert, gecertificeerd), Meta Ads, Braze, GA4, Looker Studio, GTM Server-Side, SEO (gevorderd), A/B testing
Talen: Nederlands (moedertaal), Frans (B1), Engels (C1)`,
    summary: `Competente digital marketing manager met 6 jaar in e-commerce, €2,8M budget, Braze e-mailplatform en server-side tagging. Solide profiel maar mist directe ervaring met loyalty-programma's (Xtra is kern van de Colruyt-rol). Frans B1 is ook aan de lage kant voor de bilingue Colruyt-context.`,
    strengths: ['6 jaar digitale marketing met groot mediabudget (€2,8M)', 'ROAS 5,4 — sterke campagneoptimalisatie', 'Server-side tagging en cookieless marketing kennis', 'Braze e-mailplatform — moderne tool stack', 'A/B testing discipline'],
    weaknesses: ['Geen loyalty-programma-ervaring — Xtra-activatie is kern van de Colruyt-rol', 'Frans B1 — te laag voor bilingue Colruyt-omgeving', 'Pure-play e-commerce vs. traditioneel retail — ander klantengedrag', 'Geen Salesforce Marketing Cloud (Colruyt gebruikt vermoedelijk dit platform)'],
    skills: ['Google Ads', 'Meta Ads', 'Braze', 'GA4', 'Looker Studio', 'GTM Server-Side', 'SEO', 'A/B testing', 'Email automation'],
    experience: '6 jaar: Digital Marketing Manager bij bol.com Belgisch team (4 jaar) — €2,8M budget, Braze, server-side tagging. Digital Marketing Specialist bij 2Dehands/Adevinta (3 jaar) — Google/Meta Ads, SEO.',
    education: 'Master Handelswetenschappen, UAntwerpen, 2017.',
    recommendation: 'yes',
    language: 'nl',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 4,
  },

  // Vacancy 5 – 6th candidate: DevOps/Platform Engineer BNP Paribas Fortis
  {
    firstName: 'Adrien',
    lastName: 'Leroy',
    email: 'adrien.leroy.cloud@gmail.com',
    phone: '+32 474 667 890',
    cvContent: `ADRIEN LEROY
adrien.leroy.cloud@gmail.com | +32 474 667 890 | Brussels, Belgium
github.com/aleroy-devops

PROFESSIONAL SUMMARY
Senior DevOps Engineer with 7 years of experience in cloud infrastructure and CI/CD, including 4 years in Belgian financial services. Strong Kubernetes and Terraform background. AWS Certified Solutions Architect Associate. Currently at Euroclear building Kubernetes-based settlement platform infrastructure.

EXPERIENCE

Senior DevOps Engineer — Euroclear, Brussels (February 2020 – present)
• Infrastructure engineer for Euroclear's core securities settlement platform (critical financial market infrastructure)
• Kubernetes (EKS) cluster administration for 25 application teams — 300+ workloads
• Terraform modules for AWS: EKS, RDS, ALB, IAM, Route53 — 150+ resources managed
• GitHub Actions CI/CD for 20 application teams; migrated 8 legacy Jenkins pipelines
• ArgoCD implementation (in progress — 15 teams migrated to GitOps so far)
• HashiCorp Vault deployment: dynamic secrets for RDS and AWS IAM (12 applications migrated)
• Change management and audit trail tooling for Euroclear regulatory requirements (ESMA, ECB oversight)
• Compliance: change approval workflow integrated with ServiceNow for all infrastructure changes

DevOps Engineer — Belfius Digital, Brussels (September 2016 – January 2020)
• CI/CD pipeline build for 15 Agile teams (Jenkins → GitLab CI migration)
• Docker containerisation and Kubernetes (on-prem OpenShift) for 40 microservices
• Ansible automation for Linux server fleet management

EDUCATION
Master of Science in Computer Science — UCLouvain (2014 – 2016) | Cum laude
BSc Applied Informatics — HELB Brussels (2011 – 2014)

CERTIFICATIONS
AWS Certified Solutions Architect Associate (2022) — working toward Professional
CKA – Certified Kubernetes Administrator (2023)

TECHNICAL SKILLS
Kubernetes: EKS, OpenShift, Helm, RBAC, Kyverno (basic), ArgoCD (in-progress deployment)
IaC: Terraform (proficient — modules, but not workspaces or Atlantis), Ansible
CI/CD: GitHub Actions (expert), GitLab CI (expert), Jenkins (legacy)
Secrets: HashiCorp Vault (dynamic secrets for RDS and IAM — partial deployment)
Security: Trivy in CI/CD, basic OPA policies, AWS Security Hub
Cloud: AWS (Associate), Azure (basic)
Scripting: Python (proficient), Bash, Go (none)
Compliance: ServiceNow change management, ECB/ESMA audit trail requirements

LANGUAGES
French (native), English (fluent/C1), Dutch (good/B2)`,
    summary: `Solid senior DevOps engineer with 7 years including 4 in critical Belgian financial infrastructure (Euroclear). ArgoCD deployment in progress (not complete), Vault partially deployed, Terraform proficient but not at module-library level. Below the 6+ year expert bar but very relevant financial compliance experience. Good candidate worth interviewing.`,
    strengths: ['7 years DevOps including 4 at Euroclear (most critical Belgian financial infrastructure)', 'Euroclear compliance experience (ESMA, ECB) — stricter than typical banking', 'CKA certified with EKS production experience', 'ArgoCD implementation in progress — some GitOps experience', 'French native + Dutch B2 — excellent for Belgian bilingual bank'],
    weaknesses: ['ArgoCD still in progress — not yet expert level', 'Vault partially deployed (12 apps vs. 300+ workloads)', 'AWS Associate (not Professional) — below the expert bar', 'Terraform proficient but not advanced (no workspaces, no Atlantis)', 'No Go programming skills'],
    skills: ['Kubernetes', 'EKS', 'OpenShift', 'Helm', 'Terraform', 'ArgoCD', 'GitHub Actions', 'GitLab CI', 'HashiCorp Vault', 'Trivy', 'Ansible', 'Python', 'ServiceNow'],
    experience: '7 ans: Senior DevOps Engineer bij Euroclear Brussels (4 jaar) — EKS, Terraform, ArgoCD (in-progress), Vault. DevOps Engineer bij Belfius Digital (3,5 jaar) — OpenShift, Jenkins, Ansible.',
    education: 'MSc Computer Science, UCLouvain, 2016, cum laude. BSc Applied Informatics, HELB Brussels, 2014. CKA, AWS Associate.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'email',
    vacancyIndex: 5,
  },

  // Vacancy 6 – 6th candidate: HR Business Partner Delhaize
  {
    firstName: 'Nathalie',
    lastName: 'Deschamps',
    email: 'nathalie.deschamps.rh@gmail.com',
    phone: '+32 473 556 779',
    cvContent: `NATHALIE DESCHAMPS
nathalie.deschamps.rh@gmail.com | +32 473 556 779 | Bruxelles, Belgique
linkedin.com/in/nathaliedeschamps-hrbp

PROFIL PROFESSIONNEL
HR Business Partner avec 9 ans d'expérience dans la distribution et le retail belge. Ancienne HRBP chez Okay (Colruyt Group) avec une expertise solide en droit social belge PC 202, relations syndicales et gestion multi-sites. Bilingue FR/NL.

EXPÉRIENCE

HR Business Partner — Okay (Colruyt Group), Halle (mai 2017 – présent)
• HRBP pour le réseau Okay : 120 magasins de proximité, 1.800 collaborateurs (PC 202)
• Accompagnement de 15 directeurs régionaux et 120 responsables de magasin sur les sujets RH
• Relations syndicales : CPPT et Conseil d'Entreprise au niveau groupe Colruyt ; délégations syndicales CNE, FGTB locales
• Gestion disciplinaire : 40–50 dossiers/an (avertissements, ruptures de contrat, C4)
• Suivi de l'absentéisme : programme de réintégration — réduction de 7,1% à 5,4%
• Participation au déploiement de Workday (modules Absence et Paie) pour Okay

Coordinatrice RH — Colruyt Group (siège), Halle (septembre 2014 – avril 2017)
• Coordination des processus RH groupe pour les marques de distribution
• Support aux HRBPs des différentes enseignes (Colruyt, Dreamland, Bike Republic)

FORMATION
Master en Droit (orientation Droit Social) — ULB (2012 – 2014) | Distinction
Bachelor en Sciences Économiques et Sociales — ULB (2009 – 2012)

COMPÉTENCES
Droit social : PC 202, CCT 109, temps de travail commerce, licenciements, RGPD RH
Relations syndicales : CNE, FGTB, CPPT, CE groupe Colruyt
SIRH : Workday (Absence, Paie), SD Worx (paie)
Permis B, véhicule personnel, mobile

LANGUES
Français (natif), Néerlandais (C1), Anglais (B1)`,
    motivationText: `Madame, Monsieur,

Je postule au poste de HRBP Retail Operations chez Delhaize Belgique avec une conviction forte : mon profil est directement transposable. Depuis 8 ans chez Okay (Colruyt Group), je gère un réseau de 120 magasins de proximité avec les mêmes conventions collectives (PC 202), les mêmes syndicats (CNE, FGTB), et les mêmes enjeux d'absentéisme et de turnover que Delhaize.

Ce qui m'attire chez Delhaize, c'est l'ambition digitale (refonte SIRH) et la taille du périmètre Bruxelles-Wallonie que vous proposez. Je suis prête pour un périmètre plus grand.

Je suis disponible rapidement et mobile sur toute la région.

Nathalie Deschamps`,
    summary: `Profil HRBP retail très solide avec 9 ans chez Okay (Colruyt Group), droit social PC 202, relations syndicales CNE/FGTB belges, Workday, et bilingue FR/NL. Périmètre plus petit (120 magasins proximité vs. supermarchés Delhaize) mais expertise très directement transférable. Fort potentiel.`,
    strengths: ['9 ans HRBP retail belge (Okay/Colruyt Group) — droit social PC 202 identique à Delhaize', 'Relations syndicales CNE/FGTB belges en contexte retail', 'Workday (Absence + Paie) — probablement utilisé par Delhaize', 'Bilingue FR/NL C1 — indispensable', 'Connaissance des enjeux absentéisme retail et programme de réintégration'],
    weaknesses: ['Magasins de proximité Okay (petits formats) vs. supermarchés Delhaize — format différent', 'Anglais seulement B1 — limite dans un groupe international (Ahold)', 'FGTB principalement locale — moins d\'expérience avec les grandes délégations syndicales centrales'],
    skills: ['HRBP', 'Belgian labour law', 'PC 202', 'Trade unions (CNE/FGTB)', 'Workday', 'SD Worx', 'Absenteeism management', 'Disciplinary procedures', 'CCT 109'],
    experience: '9 ans: HRBP chez Okay (Colruyt Group) Halle (7 ans) — 120 magasins, 1.800 collab., PC 202, Workday. Coordinatrice RH chez Colruyt Group siège (3 ans).',
    education: 'Master Droit (orientation Droit Social), ULB, 2014. Bachelor Sciences Éco & Sociales, ULB, 2012.',
    recommendation: 'strong_yes',
    language: 'fr',
    status: 'shortlisted',
    source: 'email',
    vacancyIndex: 6,
  },

  // Vacancy 7 – 6th candidate: Customer Success Manager Teamleader
  {
    firstName: 'Dieter',
    lastName: 'Van Damme',
    email: 'dieter.vandamme.cs@gmail.com',
    phone: '+32 475 990 113',
    cvContent: `DIETER VAN DAMME
dieter.vandamme.cs@gmail.com | +32 475 990 113 | Antwerp, Belgium
linkedin.com/in/dietervandamme-cs

PROFESSIONAL SUMMARY
Senior Customer Success Manager with 5 years at Salesforce Belgium and Unit4, managing enterprise accounts (€50K–€300K ARR). Consistent NRR 116–118%. Strong commercial mindset — drove €520K expansion ARR in the past 12 months. Trilingual Dutch/French/English. Deep CRM and ERP domain expertise.

EXPERIENCE

Senior Customer Success Manager — Salesforce Belgium, Brussels (October 2021 – present)
• Portfolio: 30 enterprise accounts (€3.5M ARR) in manufacturing, distribution, and professional services verticals in Benelux
• NRR: 118% over 2.5 years | Churn: 2.4%
• Closed €520K expansion ARR through Sales Cloud, Service Cloud, and Einstein AI upsells
• Facilitated QBRs with C-suite (CEO, CRO, CFO) and VP-level stakeholders
• Led complex Salesforce onboardings (1,000–5,000 users): Salesforce partner coordination, data migration, user training
• Gainsight health scoring and playbook implementation for Salesforce Belgium CS team

Customer Success Manager — Unit4 (ERP SaaS), Antwerp (August 2018 – September 2021)
• Portfolio: 50 mid-market accounts (€2.1M ARR) in professional services and NGO sectors
• NRR: 116% | Churn: 3.8%
• Facilitated semi-annual EBRs aligned to customer ROI and product roadmap adoption

EDUCATION
MSc Business Engineering — KU Leuven (2016 – 2018) | Cum laude

SKILLS
CS tools: Gainsight (health scores, playbooks — implementation experience), Salesforce CRM (expert — admin certified), Slack
Process: QBR/EBR facilitation, executive stakeholder management, expansion selling, complex onboarding management
Domains: CRM SaaS (Salesforce), ERP SaaS, manufacturing and distribution verticals
Technical: Salesforce SOQL, report builder, Gainsight CTAs and Journey Orchestrator

LANGUAGES
Dutch (native), English (fluent/C2), French (fluent/C1)`,
    motivationText: `Hi Teamleader team,

I'm a Senior CSM at Salesforce Belgium and I'm looking to make a deliberate move to a product-focused company where CS genuinely drives product strategy — not just adoption of a feature set set 5 layers up the management chain.

Teamleader's position in the market is interesting to me: it's the natural convergence point for Belgian and Dutch SMEs who need CRM, invoicing, and project management in one tool. I've been on the other side — selling Salesforce to the same Belgian SME segment — and I know exactly why some of them don't buy Salesforce. Teamleader solves a real problem for a real segment.

What I bring: 118% NRR at Salesforce Belgium, €520K expansion ARR last 12 months, Gainsight implementation experience, and trilingual Dutch/French/English. The enterprise CS motion at Teamleader is where I want to grow.

Dieter`,
    summary: `Strong CSM candidate from Salesforce Belgium with 5 years enterprise CS, 118% NRR, €520K expansion ARR, Gainsight implementation, and Salesforce admin certification. Trilingual NL/FR/EN is ideal for Teamleader's Benelux + France market. Domain switch from Salesforce enterprise to Teamleader SME/mid-market is the main consideration.`,
    strengths: ['5 years enterprise CS at Salesforce Belgium and Unit4', '118% NRR — meets target of >115%', '€520K expansion ARR — strong commercial track record', 'Gainsight implementation experience', 'Trilingual NL/FR/EN — perfect for Teamleader Benelux + French markets'],
    weaknesses: ['Salesforce enterprise (large deals, complex environments) vs. Teamleader SME — different motion', 'Salesforce CRM expertise could lead to bias in CS conversations about Teamleader vs. Salesforce', 'Expected compensation at Salesforce level may exceed Teamleader budget'],
    skills: ['Gainsight', 'Salesforce CRM', 'Unit4 ERP', 'QBR facilitation', 'Executive stakeholder management', 'Expansion selling', 'Complex onboarding', 'Churn management'],
    experience: '5 ans: Senior CSM bij Salesforce Belgium Brussels (3 jaar) — 30 enterprise accounts, €3,5M ARR, 118% NRR. CSM bij Unit4 Antwerpen (3 jaar) — 50 accounts, €2,1M ARR.',
    education: 'MSc Business Engineering, KU Leuven, 2018, cum laude.',
    recommendation: 'yes',
    language: 'en',
    status: 'reviewing',
    source: 'upload',
    vacancyIndex: 7,
  },

  // Vacancy 9 – 6th candidate: Software Architect Infrabel
  {
    firstName: 'Pieter-Jan',
    lastName: 'Dewulf',
    email: 'pieterjan.dewulf@gmail.com',
    phone: '+32 476 223 446',
    cvContent: `PIETER-JAN DEWULF
pieterjan.dewulf@gmail.com | +32 476 223 446 | Ghent, Belgium
linkedin.com/in/pieterjan-dewulf-architect

PROFESSIONAL SUMMARY
Enterprise Solution Architect with 12 years of experience, including 4 years as senior architect in the Belgian transport and logistics sector. Expert in Azure-based integration platforms, event-driven architecture, and domain-driven design. TOGAF 9.2 certified. Led architecture for De Lijn's digital transformation programme.

EXPERIENCE

Solution Architect — De Lijn (public transport), Ghent (April 2019 – present)
• Lead Solution Architect for De Lijn's digital transformation programme (€45M, 5-year programme)
• Designed real-time vehicle tracking and passenger information platform (Azure Event Hubs + Azure Stream Analytics + NeTEx/SIRI compliant APIs)
• Defined the integration architecture connecting De Lijn's planning systems, vehicle OBCs, and passenger apps (150K+ daily active users)
• Led GTFS-RT and NeTEx data feed implementation for the Flanders MaaS platform (integration with Google Maps, Moovit, 9292)
• Produced 30+ ADRs, ArchiMate 3.0 enterprise architecture models, and C4 component diagrams
• Stakeholder management: De Lijn CEO, Departement MOW Vlaanderen, VMM, and external tech partners

Senior Software Architect — Cegeka, Hasselt (March 2015 – March 2019)
• Lead architect for 3 Belgian government IT transformation projects (VDAB, Agentschap Wegen en Verkeer, Stad Gent)
• Introduced microservices migration patterns (strangler fig, anti-corruption layer) for 2 legacy monolith programmes
• Azure Cloud-first architecture: Service Bus, APIM, AKS, Azure Data Factory

Junior Architect / Senior Developer — Various (2010 – 2015)

EDUCATION
MSc Computer Science — Ghent University (2008 – 2010) | Distinction
BSc Computer Science — Howest (2005 – 2008)

CERTIFICATIONS
TOGAF 9.2 Certified (2018) | Azure Solutions Architect Expert (2020)
CKAD – Certified Kubernetes Application Developer (2021)

TECHNICAL SKILLS
Architecture: event-driven (Azure Event Hubs, Service Bus, Kafka evaluated), microservices, DDD, CQRS, API-first
Cloud: Azure (Expert) — AKS, Event Hubs, Stream Analytics, APIM, Data Factory, Azure Digital Twins
Transport standards: GTFS-RT, NeTEx, SIRI (passenger information — not signalling/ETCS)
Legacy modernisation: strangler fig pattern, anti-corruption layers
Modelling: ArchiMate 3.0 (expert), C4 model, BPMN, OpenAPI
Belgian transport ecosystem: De Lijn, NMBS/SNCB, Departement MOW, TEC, STIB

LANGUAGES
Dutch (native), English (fluent/C2), French (good/B2)`,
    motivationText: `Dear Infrabel Architecture Team,

I am applying as Solution Architect at De Lijn, where I've spent 4 years leading the digital transformation of Flemish public transport — designing real-time vehicle tracking, NeTEx-compliant passenger information APIs, and MaaS platform integrations.

My connection to the Belgian rail ecosystem is direct: I've designed systems that integrate with SNCB/Infrabel train data feeds, and I understand the GTFS-RT/NeTEx standards landscape that underpins multimodal passenger information in Belgium. Moving to Infrabel is the natural continuation — from bus to rail, from consumer-side to infrastructure-side.

What I bring that few candidates have: TOGAF + Azure Expert + real-time transport data architecture + SIRI/NeTEx/GTFS standards experience + the Belgian public transport political and regulatory context. That combination is genuinely rare.

Pieter-Jan`,
    summary: `Strong architecture candidate with De Lijn digital transformation experience, GTFS-RT/NeTEx/SIRI passenger information standards knowledge, TOGAF + Azure Expert certified, and deep Belgian public transport ecosystem knowledge. Gap: bus/tram domain rather than rail, no ETCS/ERTMS or TAF-TSI experience. High potential for Infrabel's passenger information systems.`,
    strengths: ['4 years Solution Architect at De Lijn (Belgian public transport) — ecosystem knowledge', 'NeTEx, SIRI, GTFS-RT standards expertise — direct passenger information relevance', 'Real-time vehicle tracking architecture experience (transferable to train tracking)', 'TOGAF 9.2 + Azure Expert + CKAD — full certification profile', 'ArchiMate 3.0 expert + 30+ ADRs — strong architecture governance skills'],
    weaknesses: ['Road transport (bus/tram) domain vs. rail — no ETCS/ERTMS or TAF-TSI experience', 'No signalling system or safety-critical system experience', 'De Lijn scale much smaller than Infrabel digital portfolio'],
    skills: ['TOGAF', 'Azure Event Hubs', 'Azure Stream Analytics', 'Azure APIM', 'Azure AKS', 'NeTEx', 'SIRI', 'GTFS-RT', 'ArchiMate', 'C4 model', 'DDD', 'Strangler fig pattern', 'ADRs', 'Anti-corruption layer'],
    experience: '12 ans: Solution Architect bij De Lijn Ghent (4 jaar) — real-time tracking, NeTEx, MaaS. Senior Architect bij Cegeka Hasselt (4 jaar) — VDAB, Azure, strangler fig. Junior Architect (4 jaar).',
    education: 'MSc Computer Science, Ghent University, 2010. BSc Computer Science, Howest, 2008. TOGAF 9.2, Azure Expert, CKAD.',
    recommendation: 'yes',
    language: 'nl',
    status: 'reviewing',
    source: 'upload',
    vacancyIndex: 9,
  },
]

// Merge for convenience — re-export combined arrays usable by seed.ts
export const ALL_CANDIDATES: CandidateData[] = [...CANDIDATES, ...EXTRA_CANDIDATES]
