// Translations for the landing page in English, Dutch, and French.
// Add keys here whenever new user-facing strings are added to page.tsx.
export type Locale = 'en' | 'nl' | 'fr'

export const translations = {
  en: {
    nav: {
      features: 'Features',
      howItWorks: 'How it works',
      pricing: 'Pricing',
      signIn: 'Sign in',
      startFree: 'Start free',
    },
    hero: {
      badge: 'Powered by Claude AI',
      title1: 'Hire smarter with',
      title2: 'AI-powered recruitment',
      subtitle: 'Upload CVs, connect your ATS or inbox, and let AI rank candidates, generate match scores, and surface the best talent — in seconds.',
      startFree: 'Start for free',
      viewDemo: 'View Demo',
      tagline: 'No credit card required · GDPR compliant · Free forever plan',
    },
    features: {
      title: 'Everything you need to hire faster',
      subtitle: 'AI automation handles screening so your team can focus on finding the right people.',
      items: [
        { title: 'AI-Powered Analysis', desc: 'Claude AI reads every CV, extracts skills, and generates a detailed compatibility score.' },
        { title: 'Bulk CV Upload', desc: 'Upload PDF, DOCX, or text files. Parser extracts text and sends it to AI analysis automatically.' },
        { title: 'Email Inbox Scanning', desc: 'Connect your recruitment inbox. AI auto-detects CVs, ignores spam, creates candidate profiles.' },
        { title: 'Smart Ranking', desc: 'Candidates are ranked by match score. See strengths, weaknesses, and AI recommendations.' },
        { title: 'Pipeline Management', desc: 'Move candidates through stages: New → Reviewing → Shortlisted → Hired.' },
        { title: 'GDPR Compliant', desc: 'Encrypted storage, consent tracking, data export, automatic deletion, DPA agreement.' },
        { title: 'ATS Integrations', desc: 'Connect Teamtailor, Recruitee, and SmartRecruiters. Import candidates and vacancies with one click, AI analyzes each CV automatically.' },
        { title: 'AI Email Generator', desc: 'Generate personalized interview invitations or rejection emails with AI. One click, professional tone, in the candidate\'s language.' },
        { title: 'Kanban & Talent Pool', desc: 'Visualize your pipeline in Kanban view. Drag candidates between stages. Save your best profiles in a talent pool for future roles.' },
      ],
    },
    howItWorks: {
      title: 'Up and running in minutes',
      steps: [
        { title: 'Create a vacancy', desc: 'Post your job requirements, skills, and description. Takes 2 minutes.' },
        { title: 'Connect your ATS or inbox', desc: 'Link Teamtailor, Recruitee, or SmartRecruiters — or connect your email to auto-scan incoming applications.' },
        { title: 'Upload CVs directly', desc: 'Drag and drop PDF/DOCX files for instant parsing and analysis alongside your ATS candidates.' },
        { title: 'AI analyzes & ranks', desc: 'Claude AI reads every document, computes match scores, and ranks candidates automatically.' },
        { title: 'Review & hire', desc: 'See ranked candidates with scores, summaries, strengths and weaknesses. Pick the best fit.' },
      ],
    },
    pricing: {
      title: 'Simple, transparent pricing',
      subtitle: 'Start free, upgrade when you need more',
      mostPopular: 'Most Popular',
      plans: [
        { name: 'Free', price: '€0', period: 'forever', cta: 'Get started free', features: ['5 active vacancies', '50 candidates/month', 'AI match scoring', 'Basic dashboard'] },
        { name: 'Pro', price: '€49', period: '/month', cta: 'Start Pro trial', features: ['Unlimited vacancies', '500 candidates/month', 'Advanced AI analysis', 'Email inbox scanning', 'ATS integrations (Teamtailor, Recruitee)', 'Analytics', 'Priority support'] },
        { name: 'Enterprise', price: 'Custom', period: 'pricing', cta: 'Contact sales', features: ['Unlimited everything', 'All ATS integrations incl. SmartRecruiters', 'Custom AI models', 'API & webhooks', 'SSO & SAML', 'Dedicated manager', 'SLA 99.9%'] },
      ],
    },
    cta: {
      title: 'Ready to hire 5× faster?',
      subtitle: 'Join hundreds of recruiters who cut screening time by 80%.',
      button: 'Start for free today',
    },
    footer: {
      copyright: '© 2025 CVMatch AI. Built for modern recruiters. GDPR compliant.',
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact',
    },
  },

  nl: {
    nav: {
      features: 'Functies',
      howItWorks: 'Hoe het werkt',
      pricing: 'Prijzen',
      signIn: 'Inloggen',
      startFree: 'Gratis starten',
    },
    hero: {
      badge: 'Aangedreven door Claude AI',
      title1: 'Slimmer aanwerven met',
      title2: 'AI-gestuurde rekrutering',
      subtitle: "Upload cv's, verbind je ATS of inbox en laat AI kandidaten rangschikken, match scores genereren en het beste talent ontdekken — in seconden.",
      startFree: 'Gratis starten',
      viewDemo: 'Demo bekijken',
      tagline: 'Geen creditcard nodig · GDPR-conform · Gratis voor altijd',
    },
    features: {
      title: 'Alles wat je nodig hebt om sneller aan te werven',
      subtitle: "AI-automatisering zorgt voor de screening zodat jouw team zich kan focussen op de juiste mensen.",
      items: [
        { title: 'AI-Analyse', desc: "Claude AI leest elk cv, extraheert vaardigheden en genereert een gedetailleerde compatibiliteitsscore." },
        { title: 'Bulk CV Upload', desc: "Upload PDF, DOCX of tekstbestanden. De parser extraheert tekst en stuurt het automatisch naar AI-analyse." },
        { title: 'E-mail Inbox Scanning', desc: "Verbind je recruitmentinbox. AI detecteert automatisch cv's, negeert spam en maakt kandidaatprofielen." },
        { title: 'Slimme Rangschikking', desc: 'Kandidaten worden gerangschikt op matchscore. Zie sterke punten, zwaktes en AI-aanbevelingen.' },
        { title: 'Pipeline Beheer', desc: 'Verplaats kandidaten door stadia: Nieuw → Beoordeling → Shortlist → Aangenomen.' },
        { title: 'GDPR-conform', desc: 'Versleutelde opslag, toestemmingsregistratie, gegevensexport, automatische verwijdering, DPA-overeenkomst.' },
        { title: 'ATS-integraties', desc: 'Verbind Teamtailor, Recruitee en SmartRecruiters. Importeer kandidaten en vacatures met één klik, AI analyseert elk cv automatisch.' },
        { title: 'AI E-mailgenerator', desc: 'Genereer gepersonaliseerde uitnodigingen voor gesprekken of afwijzingsmails met AI. Één klik, professionele toon, in de taal van de kandidaat.' },
        { title: 'Kanban & Talentpool', desc: 'Visualiseer je pipeline in Kanban-weergave. Sleep kandidaten tussen stadia. Bewaar je beste profielen in een talentpool voor toekomstige functies.' },
      ],
    },
    howItWorks: {
      title: 'In minuten aan de slag',
      steps: [
        { title: 'Maak een vacature', desc: 'Publiceer je vacature-eisen, vaardigheden en beschrijving. Duurt 2 minuten.' },
        { title: 'Verbind je ATS of inbox', desc: 'Koppel Teamtailor, Recruitee of SmartRecruiters — of verbind je e-mail om inkomende sollicitaties automatisch te scannen.' },
        { title: "Upload cv's rechtstreeks", desc: "Sleep PDF/DOCX-bestanden voor directe verwerking en analyse naast je ATS-kandidaten." },
        { title: 'AI analyseert & rangschikt', desc: 'Claude AI leest elk document, berekent matchscores en rangschikt kandidaten automatisch.' },
        { title: 'Beoordeel & neem aan', desc: 'Zie gerangschikte kandidaten met scores, samenvattingen, sterke en zwakke punten. Kies de beste match.' },
      ],
    },
    pricing: {
      title: 'Eenvoudige, transparante prijzen',
      subtitle: 'Start gratis, upgrade wanneer je meer nodig hebt',
      mostPopular: 'Meest Populair',
      plans: [
        { name: 'Gratis', price: '€0', period: 'voor altijd', cta: 'Gratis starten', features: ['5 actieve vacatures', '50 kandidaten/maand', 'AI match scoring', 'Basis dashboard'] },
        { name: 'Pro', price: '€49', period: '/maand', cta: 'Pro proberen', features: ['Onbeperkte vacatures', '500 kandidaten/maand', 'Geavanceerde AI-analyse', 'E-mail inbox scanning', 'ATS-integraties (Teamtailor, Recruitee)', 'Analytics', 'Prioriteitsondersteuning'] },
        { name: 'Enterprise', price: 'Aangepast', period: 'prijs', cta: 'Contacteer sales', features: ['Onbeperkt alles', 'Alle ATS-integraties incl. SmartRecruiters', 'Aangepaste AI-modellen', 'API & webhooks', 'SSO & SAML', 'Toegewijde manager', 'SLA 99.9%'] },
      ],
    },
    cta: {
      title: '5× sneller aanwerven?',
      subtitle: 'Sluit je aan bij honderden recruiters die de screeningtijd met 80% verminderden.',
      button: 'Start vandaag gratis',
    },
    footer: {
      copyright: '© 2025 CVMatch AI. Gebouwd voor moderne recruiters. GDPR-conform.',
      privacy: 'Privacy',
      terms: 'Voorwaarden',
      contact: 'Contact',
    },
  },

  fr: {
    nav: {
      features: 'Fonctionnalités',
      howItWorks: 'Comment ça marche',
      pricing: 'Tarifs',
      signIn: 'Se connecter',
      startFree: 'Commencer gratuitement',
    },
    hero: {
      badge: 'Propulsé par Claude AI',
      title1: 'Recrutez mieux avec',
      title2: "le recrutement piloté par IA",
      subtitle: "Uploadez des CV, connectez votre ATS ou boîte mail et laissez l'IA classer les candidats, générer des scores de correspondance et identifier les meilleurs talents — en quelques secondes.",
      startFree: 'Commencer gratuitement',
      viewDemo: 'Voir la démo',
      tagline: 'Sans carte de crédit · Conforme RGPD · Plan gratuit à vie',
    },
    features: {
      title: 'Tout ce dont vous avez besoin pour recruter plus vite',
      subtitle: "L'automatisation IA gère le tri pour que votre équipe se concentre sur les bonnes personnes.",
      items: [
        { title: 'Analyse par IA', desc: 'Claude AI lit chaque CV, extrait les compétences et génère un score de compatibilité détaillé.' },
        { title: 'Upload de CV en masse', desc: "Uploadez des fichiers PDF, DOCX ou texte. Le parseur extrait le texte et l'envoie automatiquement à l'analyse IA." },
        { title: 'Scan de la boîte mail', desc: "Connectez votre boîte de recrutement. L'IA détecte les CV, ignore le spam et crée des profils de candidats." },
        { title: 'Classement intelligent', desc: 'Les candidats sont classés par score de correspondance. Visualisez forces, faiblesses et recommandations IA.' },
        { title: 'Gestion du pipeline', desc: 'Faites avancer les candidats : Nouveau → En cours → Shortlisté → Embauché.' },
        { title: 'Conforme RGPD', desc: 'Stockage chiffré, suivi des consentements, export de données, suppression automatique, accord DPA.' },
        { title: 'Intégrations ATS', desc: 'Connectez Teamtailor, Recruitee et SmartRecruiters. Importez candidats et offres en un clic, l\'IA analyse chaque CV automatiquement.' },
        { title: 'Générateur d\'e-mails IA', desc: 'Générez des invitations à des entretiens ou des e-mails de refus personnalisés avec l\'IA. Un clic, ton professionnel, dans la langue du candidat.' },
        { title: 'Kanban & Vivier de talents', desc: 'Visualisez votre pipeline en vue Kanban. Glissez les candidats entre les étapes. Sauvegardez vos meilleurs profils dans un vivier de talents pour de futurs postes.' },
      ],
    },
    howItWorks: {
      title: 'Opérationnel en quelques minutes',
      steps: [
        { title: "Créez une offre d'emploi", desc: 'Publiez vos exigences, compétences et description. Cela prend 2 minutes.' },
        { title: 'Connectez votre ATS ou boîte mail', desc: "Liez Teamtailor, Recruitee ou SmartRecruiters — ou connectez votre email pour scanner automatiquement les candidatures." },
        { title: 'Uploadez des CV directement', desc: "Glissez-déposez des fichiers PDF/DOCX pour une analyse instantanée en parallèle de vos candidats ATS." },
        { title: "L'IA analyse et classe", desc: 'Claude AI lit chaque document, calcule les scores de correspondance et classe les candidats automatiquement.' },
        { title: 'Examinez et recrutez', desc: 'Visualisez les candidats classés avec scores, résumés, forces et faiblesses. Choisissez le meilleur profil.' },
      ],
    },
    pricing: {
      title: 'Tarification simple et transparente',
      subtitle: 'Commencez gratuitement, passez en Pro quand vous en avez besoin',
      mostPopular: 'Le Plus Populaire',
      plans: [
        { name: 'Gratuit', price: '€0', period: 'pour toujours', cta: 'Commencer gratuitement', features: ["5 offres actives", '50 candidats/mois', 'Score de correspondance IA', 'Tableau de bord de base'] },
        { name: 'Pro', price: '€49', period: '/mois', cta: 'Essayer Pro', features: ['Offres illimitées', '500 candidats/mois', 'Analyse IA avancée', 'Scan de la boîte mail', 'Intégrations ATS (Teamtailor, Recruitee)', 'Analytics', 'Support prioritaire'] },
        { name: 'Enterprise', price: 'Sur devis', period: '', cta: 'Contacter les ventes', features: ['Tout illimité', 'Toutes les intégrations ATS incl. SmartRecruiters', 'Modèles IA personnalisés', 'API & webhooks', 'SSO & SAML', 'Manager dédié', 'SLA 99.9%'] },
      ],
    },
    cta: {
      title: 'Prêt à recruter 5× plus vite ?',
      subtitle: "Rejoignez des centaines de recruteurs qui ont réduit le temps de présélection de 80%.",
      button: "Commencer gratuitement aujourd'hui",
    },
    footer: {
      copyright: '© 2025 CVMatch AI. Conçu pour les recruteurs modernes. Conforme RGPD.',
      privacy: 'Confidentialité',
      terms: 'Conditions',
      contact: 'Contact',
    },
  },
} as const

export type Translations = typeof translations.en
