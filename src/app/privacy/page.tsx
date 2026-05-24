'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Database, Lock, Mail, Globe, UserX, RefreshCw } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function PrivacyPage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Privacy Policy',
      subtitle: 'Your data belongs to you. Here is how we handle it.',
      lastUpdated: 'Last updated: May 2026',
      sections: [
        {
          icon: Eye,
          title: 'What data we collect',
          text: 'We collect the information you provide when creating an account (name, email, company), the CVs and motivation letters you upload or import, vacancy details you create, and basic usage data (last login, account settings). We do not collect payment card data directly — payments are processed by our payment provider.',
        },
        {
          icon: Database,
          title: 'How we use your data',
          text: 'Your data is used exclusively to provide the CVMatch AI service: AI analysis of CVs against your vacancies, candidate management, email scanning, and third-party ATS integrations you configure. We never sell your data or use it to train our AI models without explicit consent.',
        },
        {
          icon: Shield,
          title: 'GDPR compliance',
          text: 'CVMatch AI is compliant with the EU General Data Protection Regulation (GDPR). As a recruiter, you are the data controller for candidate personal data. We are the data processor. You must ensure candidates have given consent before uploading their data. We provide tools to export and delete all candidate data on request.',
        },
        {
          icon: Lock,
          title: 'Data security',
          text: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Passwords are hashed using bcrypt. We use Neon PostgreSQL hosted in the EU (AWS eu-west-2). Access to production systems is restricted to authorised personnel only.',
        },
        {
          icon: RefreshCw,
          title: 'Data retention',
          text: 'Your account data is retained as long as your account is active. Candidate data is retained until you delete it or close your account. You can export all your data at any time from Settings → GDPR. On account deletion, all personal data is permanently erased within 30 days.',
        },
        {
          icon: Globe,
          title: 'Third-party services',
          text: 'We use Anthropic (Claude AI) to analyse CVs — CV text is sent to their API for processing and is not retained by Anthropic beyond the request. We use Neon for database hosting and Vercel for deployment. No data is transferred outside the EU without appropriate safeguards.',
        },
        {
          icon: UserX,
          title: 'Your rights',
          text: 'Under GDPR you have the right to access, rectify, erase, restrict, and port your personal data. To exercise these rights, contact us at privacy@cvmatch.ai or use the export/delete tools in Settings. You also have the right to lodge a complaint with your national supervisory authority.',
        },
        {
          icon: Mail,
          title: 'Contact',
          text: 'For any privacy-related questions, contact our Data Protection Officer at privacy@cvmatch.ai. For general questions, visit our Contact page.',
        },
      ],
    },
    nl: {
      title: 'Privacybeleid',
      subtitle: 'Uw gegevens zijn van u. Zo gaan wij ermee om.',
      lastUpdated: 'Laatste update: mei 2026',
      sections: [
        {
          icon: Eye,
          title: 'Welke gegevens we verzamelen',
          text: 'We verzamelen de informatie die u opgeft bij het aanmaken van een account (naam, e-mail, bedrijf), de cv\'s en motivatiebrieven die u uploadt of importeert, vacaturegegevens die u aanmaakt en basisgebruiksgegevens (laatste aanmelding, accountinstellingen). We verzamelen geen betaalkaartgegevens rechtstreeks — betalingen worden verwerkt door onze betalingsprovider.',
        },
        {
          icon: Database,
          title: 'Hoe we uw gegevens gebruiken',
          text: 'Uw gegevens worden uitsluitend gebruikt om de CVMatch AI-service te leveren: AI-analyse van cv\'s ten opzichte van uw vacatures, kandidaatbeheer, e-mailscannen en door u geconfigureerde ATS-integraties van derden. We verkopen uw gegevens nooit en gebruiken ze niet om onze AI-modellen te trainen zonder uitdrukkelijke toestemming.',
        },
        {
          icon: Shield,
          title: 'AVG-naleving',
          text: 'CVMatch AI voldoet aan de Europese Algemene Verordening Gegevensbescherming (AVG/GDPR). Als recruiter bent u de verwerkingsverantwoordelijke voor persoonsgegevens van kandidaten. Wij zijn de verwerker. U moet ervoor zorgen dat kandidaten toestemming hebben gegeven voordat u hun gegevens uploadt.',
        },
        {
          icon: Lock,
          title: 'Gegevensbeveiliging',
          text: 'Alle gegevens zijn versleuteld tijdens transport (TLS 1.3) en in rust (AES-256). Wachtwoorden worden gehasht met bcrypt. We gebruiken Neon PostgreSQL gehost in de EU (AWS eu-west-2). Toegang tot productiesystemen is beperkt tot bevoegd personeel.',
        },
        {
          icon: RefreshCw,
          title: 'Bewaartermijn',
          text: 'Uw accountgegevens worden bewaard zolang uw account actief is. Kandidaatgegevens worden bewaard totdat u ze verwijdert of uw account sluit. U kunt al uw gegevens op elk moment exporteren via Instellingen → AVG. Bij accountverwijdering worden alle persoonsgegevens binnen 30 dagen permanent gewist.',
        },
        {
          icon: Globe,
          title: 'Diensten van derden',
          text: 'We gebruiken Anthropic (Claude AI) om cv\'s te analyseren — cv-tekst wordt naar hun API gestuurd en wordt niet door Anthropic bewaard na het verzoek. We gebruiken Neon voor databasehosting en Vercel voor implementatie. Er worden geen gegevens buiten de EU overgedragen zonder passende waarborgen.',
        },
        {
          icon: UserX,
          title: 'Uw rechten',
          text: 'Op grond van de AVG heeft u het recht op inzage, rectificatie, verwijdering, beperking en overdraagbaarheid van uw persoonsgegevens. Neem contact op via privacy@cvmatch.ai of gebruik de export-/verwijdertools in Instellingen.',
        },
        {
          icon: Mail,
          title: 'Contact',
          text: 'Voor privacygerelateerde vragen kunt u contact opnemen met onze Functionaris voor Gegevensbescherming via privacy@cvmatch.ai.',
        },
      ],
    },
    fr: {
      title: 'Politique de confidentialité',
      subtitle: 'Vos données vous appartiennent. Voici comment nous les traitons.',
      lastUpdated: 'Dernière mise à jour : mai 2026',
      sections: [
        {
          icon: Eye,
          title: 'Données collectées',
          text: 'Nous collectons les informations que vous fournissez lors de la création de votre compte (nom, e-mail, entreprise), les CV et lettres de motivation que vous importez ou uploadez, les détails des offres d\'emploi que vous créez, ainsi que des données d\'utilisation de base (dernière connexion, paramètres). Nous ne collectons pas directement vos données de paiement — les transactions sont gérées par notre prestataire de paiement.',
        },
        {
          icon: Database,
          title: 'Utilisation des données',
          text: 'Vos données sont utilisées exclusivement pour fournir le service CVMatch AI : analyse IA des CV par rapport à vos offres, gestion des candidats, scan d\'e-mails et intégrations ATS que vous configurez. Nous ne vendons jamais vos données et ne les utilisons pas pour entraîner nos modèles IA sans consentement explicite.',
        },
        {
          icon: Shield,
          title: 'Conformité RGPD',
          text: 'CVMatch AI est conforme au Règlement Général sur la Protection des Données (RGPD). En tant que recruteur, vous êtes le responsable du traitement des données personnelles des candidats. Nous sommes le sous-traitant. Vous devez vous assurer que les candidats ont donné leur consentement avant l\'upload de leurs données. Nous fournissons des outils pour exporter et supprimer toutes les données candidats sur demande.',
        },
        {
          icon: Lock,
          title: 'Sécurité des données',
          text: 'Toutes les données sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Les mots de passe sont hachés avec bcrypt. Nous utilisons Neon PostgreSQL hébergé dans l\'UE (AWS eu-west-2). L\'accès aux systèmes de production est limité au personnel autorisé.',
        },
        {
          icon: RefreshCw,
          title: 'Conservation des données',
          text: 'Vos données de compte sont conservées tant que votre compte est actif. Les données candidats sont conservées jusqu\'à ce que vous les supprimiez ou fermiez votre compte. Vous pouvez exporter toutes vos données à tout moment depuis Paramètres → RGPD. Lors de la suppression du compte, toutes les données personnelles sont définitivement effacées dans les 30 jours.',
        },
        {
          icon: Globe,
          title: 'Services tiers',
          text: 'Nous utilisons Anthropic (Claude AI) pour analyser les CV — le texte des CV est envoyé à leur API et n\'est pas conservé par Anthropic au-delà de la requête. Nous utilisons Neon pour l\'hébergement de la base de données et Vercel pour le déploiement. Aucune donnée n\'est transférée hors de l\'UE sans garanties appropriées.',
        },
        {
          icon: UserX,
          title: 'Vos droits',
          text: 'En vertu du RGPD, vous disposez du droit d\'accès, de rectification, d\'effacement, de limitation et de portabilité de vos données personnelles. Pour exercer ces droits, contactez-nous à privacy@cvmatch.ai ou utilisez les outils d\'export/suppression dans Paramètres. Vous avez également le droit d\'introduire une réclamation auprès de la CNIL.',
        },
        {
          icon: Mail,
          title: 'Contact',
          text: 'Pour toute question relative à la confidentialité, contactez notre Délégué à la Protection des Données à privacy@cvmatch.ai. Pour les questions générales, consultez notre page Contact.',
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
            <LanguageSwitcher />
            <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft size={15} />
              {locale === 'nl' ? 'Terug' : locale === 'en' ? 'Back' : 'Retour'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 py-16 px-6 text-center border-b border-gray-100 dark:border-gray-800">
        <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-white" />
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
              <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center mt-0.5">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
            <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white text-blue-600 dark:text-blue-400 font-medium">
              {locale === 'nl' ? 'Privacy' : locale === 'en' ? 'Privacy' : 'Confidentialité'}
            </Link>
            <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">
              {locale === 'nl' ? 'Voorwaarden' : locale === 'en' ? 'Terms' : 'Conditions'}
            </Link>
            <Link href="/contact" className="hover:text-gray-900 dark:hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
