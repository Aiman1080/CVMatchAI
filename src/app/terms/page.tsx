'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Ban, Scale, RefreshCw, Globe, Mail } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function TermsPage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Terms of Service',
      subtitle: 'Please read these terms carefully before using CVMatch AI.',
      lastUpdated: 'Last updated: May 2026',
      sections: [
        {
          icon: FileText,
          title: '1. Acceptance of terms',
          text: 'By creating an account or using CVMatch AI, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service. These terms apply to all users including recruiters, HR professionals, and organisations.',
        },
        {
          icon: Globe,
          title: '2. Description of service',
          text: 'CVMatch AI is an AI-powered recruitment platform that helps recruiters analyse CVs, manage candidates, and match applicants to vacancies. The service is provided "as is" and we reserve the right to modify or discontinue features with reasonable notice.',
        },
        {
          icon: Scale,
          title: '3. Acceptable use',
          text: 'You may only use CVMatch AI for lawful recruitment purposes. You must not: upload data of individuals without their consent, use the service for spam or unsolicited communications, attempt to reverse-engineer or scrape the platform, share your account credentials, or use the service in violation of applicable employment and data protection laws.',
        },
        {
          icon: AlertTriangle,
          title: '4. GDPR and candidate data',
          text: 'You are responsible for ensuring compliance with GDPR and applicable data protection laws when processing candidate data. This includes obtaining informed consent from candidates before uploading their CVs. CVMatch AI provides tools to help with compliance but does not assume legal responsibility for your use of candidate data.',
        },
        {
          icon: CreditCard,
          title: '5. Subscriptions and billing',
          text: 'Free accounts are subject to usage limits (vacancies, candidates, AI analyses). Paid plans (Pro, Enterprise) are billed monthly or annually. Subscriptions auto-renew unless cancelled before the renewal date. Refunds are available within 14 days of the first charge for new paid subscriptions if the service did not meet expectations.',
        },
        {
          icon: Ban,
          title: '6. Account suspension',
          text: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or whose subscription payment fails after reasonable notice. Upon termination, your data will be retained for 30 days before permanent deletion.',
        },
        {
          icon: RefreshCw,
          title: '7. Service availability',
          text: 'We aim for 99.5% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be notified in advance where possible. We are not liable for losses arising from service interruptions, data loss, or AI analysis errors.',
        },
        {
          icon: Scale,
          title: '8. Intellectual property',
          text: 'CVMatch AI and its technology, design, and content are the intellectual property of CVMatch AI. Your data (CVs, vacancies, candidates) remains yours. By using the service, you grant us a limited licence to process your data to provide the service.',
        },
        {
          icon: Mail,
          title: '9. Changes and contact',
          text: 'We may update these terms with 30 days notice. Continued use after notice constitutes acceptance. For questions about these terms, contact us at legal@cvmatch.ai.',
        },
      ],
    },
    nl: {
      title: 'Gebruiksvoorwaarden',
      subtitle: 'Lees deze voorwaarden zorgvuldig door voordat u CVMatch AI gebruikt.',
      lastUpdated: 'Laatste update: mei 2026',
      sections: [
        {
          icon: FileText,
          title: '1. Aanvaarding van voorwaarden',
          text: 'Door een account aan te maken of CVMatch AI te gebruiken, gaat u akkoord met deze Gebruiksvoorwaarden en ons Privacybeleid. Als u niet akkoord gaat, gebruik de service dan niet. Deze voorwaarden zijn van toepassing op alle gebruikers, waaronder recruiters, HR-professionals en organisaties.',
        },
        {
          icon: Globe,
          title: '2. Beschrijving van de service',
          text: 'CVMatch AI is een AI-gedreven wervingsplatform dat recruiters helpt cv\'s te analyseren, kandidaten te beheren en sollicitanten te matchen met vacatures. De service wordt geleverd "zoals die is" en wij behouden ons het recht voor om functies te wijzigen of te beëindigen met redelijke kennisgeving.',
        },
        {
          icon: Scale,
          title: '3. Aanvaardbaar gebruik',
          text: 'U mag CVMatch AI alleen gebruiken voor wettige wervingsdoeleinden. Het is verboden om: gegevens van personen te uploaden zonder hun toestemming, de service te gebruiken voor spam, te proberen het platform te reverse-engineeren of te scrapen, uw accountgegevens te delen, of de service te gebruiken in strijd met toepasselijke wetgeving.',
        },
        {
          icon: AlertTriangle,
          title: '4. AVG en kandidaatgegevens',
          text: 'U bent verantwoordelijk voor naleving van de AVG en toepasselijke gegevensbeschermingswetten bij de verwerking van kandidaatgegevens. Dit omvat het verkrijgen van geïnformeerde toestemming van kandidaten voordat u hun cv\'s uploadt. CVMatch AI biedt tools om te helpen bij naleving, maar neemt geen juridische verantwoordelijkheid voor uw gebruik van kandidaatgegevens.',
        },
        {
          icon: CreditCard,
          title: '5. Abonnementen en facturering',
          text: 'Gratis accounts zijn onderhevig aan gebruikslimieten. Betaalde abonnementen worden maandelijks of jaarlijks gefactureerd. Abonnementen worden automatisch verlengd tenzij ze voor de verlengingsdatum worden opgezegd. Terugbetalingen zijn beschikbaar binnen 14 dagen na de eerste betaling voor nieuwe betaalde abonnementen.',
        },
        {
          icon: Ban,
          title: '6. Schorsing van account',
          text: 'Wij behouden ons het recht voor om accounts te schorsen of te beëindigen die deze voorwaarden schenden, frauduleuze activiteiten vertonen of waarvoor abonnementsbetalingen uitblijven. Na beëindiging worden uw gegevens 30 dagen bewaard voordat ze permanent worden verwijderd.',
        },
        {
          icon: RefreshCw,
          title: '7. Beschikbaarheid van de service',
          text: 'Wij streven naar 99,5% uptime maar garanderen geen ononderbroken service. Geplande onderhoudswerkzaamheden worden waar mogelijk vooraf aangekondigd. Wij zijn niet aansprakelijk voor verliezen als gevolg van serviceonderbrekingen, gegevensverlies of fouten in AI-analyse.',
        },
        {
          icon: Scale,
          title: '8. Intellectueel eigendom',
          text: 'CVMatch AI en haar technologie, ontwerp en inhoud zijn het intellectueel eigendom van CVMatch AI. Uw gegevens (cv\'s, vacatures, kandidaten) blijven van u. Door de service te gebruiken, verleent u ons een beperkte licentie om uw gegevens te verwerken om de service te leveren.',
        },
        {
          icon: Mail,
          title: '9. Wijzigingen en contact',
          text: 'Wij kunnen deze voorwaarden bijwerken met 30 dagen kennisgeving. Voortgezet gebruik na kennisgeving geldt als aanvaarding. Voor vragen over deze voorwaarden kunt u contact opnemen via legal@cvmatch.ai.',
        },
      ],
    },
    fr: {
      title: "Conditions d'utilisation",
      subtitle: "Veuillez lire attentivement ces conditions avant d'utiliser CVMatch AI.",
      lastUpdated: 'Dernière mise à jour : mai 2026',
      sections: [
        {
          icon: FileText,
          title: "1. Acceptation des conditions",
          text: "En créant un compte ou en utilisant CVMatch AI, vous acceptez ces Conditions d'utilisation et notre Politique de confidentialité. Si vous n'acceptez pas, veuillez ne pas utiliser le service. Ces conditions s'appliquent à tous les utilisateurs, y compris les recruteurs, professionnels RH et organisations.",
        },
        {
          icon: Globe,
          title: '2. Description du service',
          text: "CVMatch AI est une plateforme de recrutement propulsée par l'IA qui aide les recruteurs à analyser les CV, gérer les candidats et faire correspondre les candidatures aux offres d'emploi. Le service est fourni \"en l'état\" et nous nous réservons le droit de modifier ou d'interrompre des fonctionnalités avec un préavis raisonnable.",
        },
        {
          icon: Scale,
          title: '3. Utilisation acceptable',
          text: "Vous ne pouvez utiliser CVMatch AI qu'à des fins de recrutement légales. Il est interdit de : uploader des données de personnes sans leur consentement, utiliser le service pour du spam, tenter de faire de l'ingénierie inverse ou du scraping, partager vos identifiants de compte, ou utiliser le service en violation des lois applicables.",
        },
        {
          icon: AlertTriangle,
          title: '4. RGPD et données candidats',
          text: "Vous êtes responsable du respect du RGPD et des lois applicables en matière de protection des données lors du traitement des données candidats. Cela inclut l'obtention du consentement éclairé des candidats avant l'upload de leurs CV. CVMatch AI fournit des outils pour faciliter la conformité mais n'assume pas de responsabilité juridique pour votre utilisation des données candidats.",
        },
        {
          icon: CreditCard,
          title: '5. Abonnements et facturation',
          text: "Les comptes gratuits sont soumis à des limites d'utilisation. Les abonnements payants (Pro, Enterprise) sont facturés mensuellement ou annuellement. Les abonnements se renouvellent automatiquement sauf résiliation avant la date de renouvellement. Les remboursements sont disponibles dans les 14 jours suivant le premier paiement pour les nouveaux abonnements payants.",
        },
        {
          icon: Ban,
          title: '6. Suspension de compte',
          text: "Nous nous réservons le droit de suspendre ou de résilier les comptes qui violent ces conditions, exercent des activités frauduleuses ou dont le paiement d'abonnement échoue. En cas de résiliation, vos données seront conservées 30 jours avant suppression définitive.",
        },
        {
          icon: RefreshCw,
          title: '7. Disponibilité du service',
          text: "Nous visons 99,5% de disponibilité mais ne garantissons pas un service ininterrompu. Les maintenances planifiées seront notifiées à l'avance dans la mesure du possible. Nous ne sommes pas responsables des pertes résultant d'interruptions de service, de perte de données ou d'erreurs d'analyse IA.",
        },
        {
          icon: Scale,
          title: '8. Propriété intellectuelle',
          text: "CVMatch AI et sa technologie, son design et son contenu sont la propriété intellectuelle de CVMatch AI. Vos données (CV, offres, candidats) vous appartiennent. En utilisant le service, vous nous accordez une licence limitée pour traiter vos données afin de fournir le service.",
        },
        {
          icon: Mail,
          title: '9. Modifications et contact',
          text: "Nous pouvons mettre à jour ces conditions avec un préavis de 30 jours. L'utilisation continue après notification vaut acceptation. Pour toute question sur ces conditions, contactez-nous à legal@cvmatch.ai.",
        },
      ],
    },
  }

  const c = content[locale as keyof typeof content] || content.fr

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-gray-900 dark:text-white">CVMatch AI</span>
          </Link>
          <div className="flex items-center gap-4">
            
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={15} />
              {locale === 'nl' ? 'Terug' : locale === 'en' ? 'Back' : 'Retour'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-900 py-16 px-6 text-center border-b border-gray-100 dark:border-gray-800">
        <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3">{c.title}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">{c.subtitle}</p>
        <span className="text-xs text-gray-400 dark:text-gray-500">{c.lastUpdated}</span>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        {c.sections.map((section, i) => {
          const Icon = section.icon
          return (
            <div key={i} className="flex gap-5">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mt-0.5">
                <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{section.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{section.text}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} CVMatch AI</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">
              {locale === 'nl' ? 'Privacy' : locale === 'en' ? 'Privacy' : 'Confidentialité'}
            </Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white text-blue-600 dark:text-blue-400 font-medium">
              {locale === 'nl' ? 'Voorwaarden' : locale === 'en' ? 'Terms' : 'Conditions'}
            </Link>
            <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
