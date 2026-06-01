'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Ban, Scale, RefreshCw, Globe, Mail, ShieldOff, Gavel } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useLanguage } from '@/contexts/LanguageContext'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export default function TermsPage() {
  const { locale } = useLanguage()

  const content = {
    en: {
      title: 'Terms of Service',
      subtitle: 'Please read these terms carefully before using DeltaMatch.',
      lastUpdated: 'Last updated: May 2026',
      sections: [
        {
          icon: FileText,
          title: '1. Acceptance of terms',
          text: 'These Terms of Service form a legally binding agreement between you (the "Customer") and DeltaMatch, operated by [Company name], a company registered in Belgium ([company form], company number [BCE/KBO number], registered office: [address]) ("we", "us", "DeltaMatch"). By creating an account, accessing or using DeltaMatch, you confirm that you have read, understood and agree to be bound by these Terms and our Privacy Policy. If you are entering into these Terms on behalf of an organisation, you represent that you have authority to bind that organisation. If you do not agree, you must not use the service. The service is intended for professional (B2B) use by recruiters, HR professionals and organisations.',
        },
        {
          icon: Globe,
          title: '2. Description of service — provided "as is"',
          text: 'DeltaMatch is an AI-assisted recruitment platform that helps recruiters analyse CVs, manage candidates, and match applicants to vacancies. THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, whether express or implied, including but not limited to fitness for a particular purpose, accuracy, reliability, or non-infringement. We do not warrant that the service will be uninterrupted, error-free, secure, or that AI outputs will be accurate or complete. We may add, modify, suspend or discontinue any feature at any time, with reasonable notice where practicable.',
        },
        {
          icon: Scale,
          title: '3. Acceptable use',
          text: 'You may use DeltaMatch only for lawful recruitment purposes. You must not: upload or process personal data of individuals without a valid legal basis and, where required, their consent; use the service for spam or unsolicited communications; attempt to reverse-engineer, decompile, scrape, overload, or circumvent any security or rate-limiting measure; resell or sublicense the service; share your account credentials; or use the service in violation of applicable employment, anti-discrimination, or data protection laws. We may investigate and take action, including suspension, for any suspected breach.',
        },
        {
          icon: AlertTriangle,
          title: '4. Your responsibilities (GDPR & candidate data)',
          text: 'As between you and DeltaMatch, you are the data controller for all candidate personal data you upload, import or process, and DeltaMatch acts as your data processor. YOU are solely responsible for: having a valid legal basis and, where required, obtaining informed consent from candidates before uploading their data; the lawfulness, accuracy and content of the data you process; complying with the GDPR and all applicable employment and anti-discrimination laws; and responding to data-subject requests. DeltaMatch provides tools to assist compliance but assumes no legal responsibility for your use of candidate data. You agree to indemnify and hold us harmless against any claim arising from your data or your use of the service (see section 8).',
        },
        {
          icon: CreditCard,
          title: '5. Subscriptions, billing & no refunds',
          text: 'Free accounts are subject to usage limits. Paid plans (e.g. Pro at the price displayed at checkout) are billed in advance on a recurring basis (monthly or annually) and renew automatically until cancelled. You may cancel at any time; cancellation stops future renewals but does NOT entitle you to a refund of amounts already paid. EXCEPT WHERE A MANDATORY STATUTORY RIGHT OF WITHDRAWAL APPLIES (under EU consumer law, a 14-day withdrawal right may apply to consumers; by requesting immediate access to a digital service you may waive it once the service has been fully provided), ALL FEES ARE NON-REFUNDABLE AND NON-CANCELLABLE FOR THE CURRENT BILLING PERIOD, including for partial use, downgrades, or periods of non-use. No refunds are given for downtime, outages, data loss, dissatisfaction with AI results, or feature changes. Prices may change with 30 days notice for the next billing period. Failed payments may result in suspension.',
        },
        {
          icon: ShieldOff,
          title: '6. Disclaimer — outages, data loss & AI errors',
          text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, DeltaMatch is NOT liable for any loss or damage arising from: service interruptions, downtime, crashes, bugs, or maintenance; loss, corruption or unavailability of data (you are responsible for keeping your own backups/exports); errors, inaccuracies, omissions or bias in AI-generated scores, summaries, rankings, interview questions, reports or emails; reliance on any AI output; third-party services (e.g. AI providers, hosting, email/IMAP, ATS integrations, payment processor) being unavailable, changing, or failing; or any hiring, rejection or employment decision you make. AI outputs are decision-support only and must be reviewed by a human before use. No hiring decision is automated by DeltaMatch.',
        },
        {
          icon: Scale,
          title: '7. Limitation of liability',
          text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, DeltaMatch (and its directors, employees and suppliers) shall not be liable for any indirect, incidental, special, consequential, exemplary or punitive damages, nor for any loss of profits, revenue, data, goodwill, business opportunities, or recruitment outcomes, even if advised of the possibility. Our total aggregate liability for all claims arising out of or relating to the service, whether in contract, tort (including negligence) or otherwise, shall not exceed the total amounts actually paid by you to DeltaMatch in the three (3) months immediately preceding the event giving rise to the claim. Nothing in these Terms excludes or limits liability that cannot be excluded under Belgian law (including liability for fraud, wilful misconduct, or death/personal injury caused by negligence).',
        },
        {
          icon: ShieldOff,
          title: '8. Indemnification',
          text: 'You agree to defend, indemnify and hold harmless DeltaMatch and its operators from and against any claims, damages, liabilities, losses, costs and expenses (including reasonable legal fees) arising out of or related to: (a) the candidate or other personal data you upload, import or process; (b) your breach of these Terms or of any applicable law (including GDPR, employment and anti-discrimination law); (c) your use of, or reliance on, any AI output; or (d) any dispute between you and a candidate or third party.',
        },
        {
          icon: Ban,
          title: '9. Suspension & termination',
          text: 'We may suspend or terminate your account, with or without notice, if you breach these Terms, engage in fraudulent or unlawful activity, create risk or legal exposure for us, or fail to pay. You may terminate at any time by closing your account. On termination, your right to use the service ceases immediately; your data is retained for up to 30 days (to allow export) and then permanently deleted, unless longer retention is legally required. Sections 4–8, 10 and 11 survive termination.',
        },
        {
          icon: Scale,
          title: '10. Intellectual property & force majeure',
          text: 'DeltaMatch, including its software, design, trademarks and content, is and remains our exclusive intellectual property; no rights are granted except the limited, revocable, non-exclusive right to use the service per these Terms. Your data (CVs, vacancies, candidates) remains yours; you grant us a limited licence to host and process it solely to provide the service. We are not liable for any delay or failure to perform caused by events beyond our reasonable control (force majeure), including outages of hosting, AI, network or third-party providers, cyber-attacks, or acts of government.',
        },
        {
          icon: Gavel,
          title: '11. Governing law, changes & contact',
          text: 'These Terms are governed by the laws of Belgium, without regard to conflict-of-law rules. Any dispute shall be subject to the exclusive jurisdiction of the courts of [judicial district, e.g. Brussels], Belgium, without prejudice to any mandatory consumer-protection rights. If any provision is held invalid, the remainder stays in force. We may update these Terms with 30 days notice (by email or in-app); continued use after the effective date constitutes acceptance. Questions: legal@mydeltamatch.com (update to your real contact).',
        },
      ],
    },
    nl: {
      title: 'Gebruiksvoorwaarden',
      subtitle: 'Lees deze voorwaarden zorgvuldig door voordat u DeltaMatch gebruikt.',
      lastUpdated: 'Laatste update: mei 2026',
      sections: [
        {
          icon: FileText,
          title: '1. Aanvaarding van voorwaarden',
          text: 'Deze Gebruiksvoorwaarden vormen een juridisch bindende overeenkomst tussen u (de "Klant") en DeltaMatch, geëxploiteerd door [Bedrijfsnaam], een in België geregistreerde onderneming ([rechtsvorm], ondernemingsnummer [KBO-nummer], maatschappelijke zetel: [adres]) ("wij", "ons", "DeltaMatch"). Door een account aan te maken of DeltaMatch te gebruiken, bevestigt u dat u deze voorwaarden en ons Privacybeleid hebt gelezen, begrepen en aanvaard. Als u namens een organisatie handelt, verklaart u bevoegd te zijn die te binden. Gaat u niet akkoord, gebruik de service dan niet. De dienst is bestemd voor professioneel (B2B) gebruik door recruiters, HR-professionals en organisaties.',
        },
        {
          icon: Globe,
          title: '2. Beschrijving van de service — "zoals die is"',
          text: 'DeltaMatch is een AI-ondersteund wervingsplatform dat recruiters helpt cv\'s te analyseren, kandidaten te beheren en sollicitanten te matchen met vacatures. DE SERVICE WORDT GELEVERD "ZOALS DIE IS" EN "ZOALS BESCHIKBAAR", ZONDER ENIGE GARANTIE, expliciet of impliciet, met inbegrip van geschiktheid voor een bepaald doel, juistheid of betrouwbaarheid. Wij garanderen niet dat de service ononderbroken, foutloos of veilig is, noch dat AI-resultaten juist of volledig zijn. Wij kunnen functies te allen tijde toevoegen, wijzigen, opschorten of beëindigen, waar mogelijk met redelijke kennisgeving.',
        },
        {
          icon: Scale,
          title: '3. Aanvaardbaar gebruik',
          text: 'U mag DeltaMatch enkel gebruiken voor wettige wervingsdoeleinden. Het is verboden om: persoonsgegevens te uploaden of te verwerken zonder geldige rechtsgrond en, indien vereist, toestemming; de service te gebruiken voor spam; te proberen het platform te reverse-engineeren, te decompileren, te scrapen, te overbelasten of beveiligings- of limietmaatregelen te omzeilen; de service door te verkopen of in sublicentie te geven; uw inloggegevens te delen; of de service te gebruiken in strijd met toepasselijke arbeids-, antidiscriminatie- of gegevensbeschermingswetgeving. Bij vermoeden van inbreuk kunnen wij optreden, inclusief schorsing.',
        },
        {
          icon: AlertTriangle,
          title: '4. Uw verantwoordelijkheden (AVG & kandidaatgegevens)',
          text: 'In de verhouding tussen u en DeltaMatch bent u de verwerkingsverantwoordelijke voor alle kandidaatgegevens die u uploadt, importeert of verwerkt; DeltaMatch treedt op als uw verwerker. U bent als enige verantwoordelijk voor: een geldige rechtsgrond en, indien vereist, geïnformeerde toestemming van kandidaten vóór het uploaden; de rechtmatigheid, juistheid en inhoud van de gegevens; naleving van de AVG en alle toepasselijke arbeids- en antidiscriminatiewetgeving; en het beantwoorden van verzoeken van betrokkenen. DeltaMatch biedt hulpmiddelen maar neemt geen juridische verantwoordelijkheid voor uw gebruik van kandidaatgegevens. U vrijwaart ons tegen elke vordering die voortvloeit uit uw gegevens of gebruik (zie artikel 8).',
        },
        {
          icon: CreditCard,
          title: '5. Abonnementen, facturering & geen terugbetaling',
          text: 'Gratis accounts kennen gebruikslimieten. Betaalde abonnementen (bv. Pro tegen de prijs getoond bij afrekenen) worden vooraf en periodiek (maandelijks of jaarlijks) gefactureerd en verlengen automatisch tot opzegging. U kunt te allen tijde opzeggen; opzegging stopt toekomstige verlengingen maar geeft GEEN recht op terugbetaling van reeds betaalde bedragen. BEHOUDENS EEN DWINGEND WETTELIJK HERROEPINGSRECHT (onder EU-consumentenrecht kan een herroepingsrecht van 14 dagen gelden voor consumenten; door onmiddellijke toegang te vragen kunt u dit verliezen zodra de dienst volledig is geleverd), ZIJN ALLE BEDRAGEN NIET-TERUGBETAALBAAR voor de lopende factureringsperiode, ook bij gedeeltelijk gebruik, downgrade of niet-gebruik. Geen terugbetaling bij downtime, storingen, gegevensverlies, ontevredenheid over AI-resultaten of functiewijzigingen. Prijzen kunnen met 30 dagen kennisgeving wijzigen voor de volgende periode. Mislukte betalingen kunnen leiden tot schorsing.',
        },
        {
          icon: ShieldOff,
          title: '6. Disclaimer — storingen, gegevensverlies & AI-fouten',
          text: 'VOOR ZOVER WETTELIJK TOEGESTAAN is DeltaMatch NIET aansprakelijk voor verlies of schade door: serviceonderbrekingen, downtime, crashes, bugs of onderhoud; verlies, beschadiging of onbeschikbaarheid van gegevens (u bent verantwoordelijk voor eigen back-ups/exports); fouten, onjuistheden of bias in door AI gegenereerde scores, samenvattingen, rankings, vragen, rapporten of e-mails; vertrouwen op AI-resultaten; uitval of wijziging van derde-partijdiensten (AI-providers, hosting, e-mail/IMAP, ATS-integraties, betalingsverwerker); of enige aanwervings-, afwijzings- of arbeidsbeslissing die u neemt. AI-resultaten dienen enkel als beslissingsondersteuning en moeten door een mens worden beoordeeld. DeltaMatch automatiseert geen aanwervingsbeslissingen.',
        },
        {
          icon: Scale,
          title: '7. Beperking van aansprakelijkheid',
          text: 'VOOR ZOVER WETTELIJK TOEGESTAAN is DeltaMatch (en haar bestuurders, werknemers en leveranciers) niet aansprakelijk voor indirecte, incidentele, bijzondere of gevolgschade, noch voor winstderving, verlies van omzet, gegevens, goodwill, zakelijke kansen of wervingsresultaten, zelfs indien op de mogelijkheid gewezen. Onze totale gecumuleerde aansprakelijkheid voor alle vorderingen overschrijdt nooit het totaal dat u in de drie (3) maanden vóór de gebeurtenis aan DeltaMatch hebt betaald. Niets sluit aansprakelijkheid uit die naar Belgisch recht niet kan worden uitgesloten (waaronder fraude, opzet, of overlijden/lichamelijk letsel door nalatigheid).',
        },
        {
          icon: ShieldOff,
          title: '8. Vrijwaring',
          text: 'U verbindt zich ertoe DeltaMatch en haar exploitanten te verdedigen, te vrijwaren en schadeloos te stellen tegen alle vorderingen, schade, aansprakelijkheden, verliezen, kosten en uitgaven (inclusief redelijke advocatenkosten) die voortvloeien uit: (a) de kandidaat- of andere persoonsgegevens die u verwerkt; (b) uw inbreuk op deze voorwaarden of op toepasselijke wetgeving (AVG, arbeids- en antidiscriminatierecht); (c) uw gebruik van of vertrouwen op AI-resultaten; of (d) een geschil tussen u en een kandidaat of derde.',
        },
        {
          icon: Ban,
          title: '9. Schorsing & beëindiging',
          text: 'Wij kunnen uw account met of zonder kennisgeving schorsen of beëindigen bij inbreuk op deze voorwaarden, frauduleuze of onwettige activiteit, risico voor ons, of niet-betaling. U kunt te allen tijde beëindigen door uw account te sluiten. Bij beëindiging stopt uw gebruiksrecht onmiddellijk; uw gegevens worden tot 30 dagen bewaard (voor export) en daarna permanent verwijderd, tenzij langere bewaring wettelijk vereist is. De artikelen 4–8, 10 en 11 blijven na beëindiging gelden.',
        },
        {
          icon: Scale,
          title: '10. Intellectueel eigendom & overmacht',
          text: 'DeltaMatch, inclusief software, ontwerp, merken en inhoud, is en blijft onze exclusieve intellectuele eigendom; er worden geen rechten verleend behalve het beperkte, herroepbare, niet-exclusieve gebruiksrecht conform deze voorwaarden. Uw gegevens (cv\'s, vacatures, kandidaten) blijven van u; u verleent ons een beperkte licentie om ze te hosten en te verwerken enkel om de service te leveren. Wij zijn niet aansprakelijk voor vertraging of niet-nakoming door omstandigheden buiten onze redelijke controle (overmacht), waaronder uitval van hosting, AI, netwerk of derden, cyberaanvallen of overheidsmaatregelen.',
        },
        {
          icon: Gavel,
          title: '11. Toepasselijk recht, wijzigingen & contact',
          text: 'Deze voorwaarden worden beheerst door het Belgisch recht. Elk geschil valt onder de exclusieve bevoegdheid van de rechtbanken van [gerechtelijk arrondissement, bv. Brussel], België, onverminderd dwingende consumentenrechten. Als een bepaling ongeldig is, blijft de rest van kracht. Wij kunnen deze voorwaarden met 30 dagen kennisgeving (per e-mail of in-app) bijwerken; voortgezet gebruik na de ingangsdatum geldt als aanvaarding. Vragen: legal@mydeltamatch.com (vervang door uw echte contact).',
        },
      ],
    },
    fr: {
      title: "Conditions d'utilisation",
      subtitle: "Veuillez lire attentivement ces conditions avant d'utiliser DeltaMatch.",
      lastUpdated: 'Dernière mise à jour : mai 2026',
      sections: [
        {
          icon: FileText,
          title: "1. Acceptation des conditions",
          text: "Les présentes Conditions d'utilisation constituent un contrat juridiquement contraignant entre vous (le « Client ») et DeltaMatch, exploité par [Nom de la société], une société enregistrée en Belgique ([forme juridique], numéro d'entreprise [numéro BCE], siège social : [adresse]) (« nous », « DeltaMatch »). En créant un compte ou en utilisant DeltaMatch, vous confirmez avoir lu, compris et accepté les présentes Conditions et notre Politique de confidentialité. Si vous agissez au nom d'une organisation, vous déclarez avoir le pouvoir de l'engager. Si vous n'acceptez pas, n'utilisez pas le service. Le service est destiné à un usage professionnel (B2B) par des recruteurs, professionnels RH et organisations.",
        },
        {
          icon: Globe,
          title: '2. Description du service — fourni « en l\'état »',
          text: "DeltaMatch est une plateforme de recrutement assistée par IA qui aide à analyser les CV, gérer les candidats et les faire correspondre aux offres. LE SERVICE EST FOURNI « EN L'ÉTAT » ET « SELON DISPONIBILITÉ », SANS GARANTIE D'AUCUNE SORTE, expresse ou implicite, y compris l'adéquation à un usage particulier, l'exactitude ou la fiabilité. Nous ne garantissons pas que le service sera ininterrompu, exempt d'erreurs ou sécurisé, ni que les résultats de l'IA seront exacts ou complets. Nous pouvons ajouter, modifier, suspendre ou interrompre toute fonctionnalité à tout moment, avec un préavis raisonnable lorsque c'est possible.",
        },
        {
          icon: Scale,
          title: '3. Utilisation acceptable',
          text: "Vous ne pouvez utiliser DeltaMatch qu'à des fins de recrutement légales. Il est interdit de : téléverser ou traiter des données personnelles sans base légale valable et, le cas échéant, consentement ; utiliser le service pour du spam ; tenter de faire de l'ingénierie inverse, décompiler, scraper, surcharger ou contourner toute mesure de sécurité ou de limitation ; revendre ou sous-licencier le service ; partager vos identifiants ; ou utiliser le service en violation des lois applicables en matière d'emploi, de non-discrimination ou de protection des données. En cas de soupçon d'infraction, nous pouvons agir, y compris suspendre le compte.",
        },
        {
          icon: AlertTriangle,
          title: '4. Vos responsabilités (RGPD & données candidats)',
          text: "Dans la relation entre vous et DeltaMatch, vous êtes le responsable du traitement de toutes les données candidats que vous téléversez, importez ou traitez, et DeltaMatch agit comme votre sous-traitant. Vous êtes seul responsable de : disposer d'une base légale valable et, le cas échéant, obtenir le consentement éclairé des candidats avant le téléversement ; la licéité, l'exactitude et le contenu des données ; le respect du RGPD et de toutes les lois applicables en matière d'emploi et de non-discrimination ; et le traitement des demandes des personnes concernées. DeltaMatch fournit des outils d'aide à la conformité mais n'assume aucune responsabilité juridique pour votre utilisation des données candidats. Vous vous engagez à nous garantir contre toute réclamation découlant de vos données ou de votre utilisation (voir article 8).",
        },
        {
          icon: CreditCard,
          title: '5. Abonnements, facturation & absence de remboursement',
          text: "Les comptes gratuits sont soumis à des limites d'utilisation. Les abonnements payants (ex. Pro au prix affiché au paiement) sont facturés d'avance de façon récurrente (mensuelle ou annuelle) et se renouvellent automatiquement jusqu'à résiliation. Vous pouvez résilier à tout moment ; la résiliation arrête les renouvellements futurs mais NE donne PAS droit au remboursement des sommes déjà payées. SAUF DROIT LÉGAL DE RÉTRACTATION IMPÉRATIF (en droit européen de la consommation, un droit de rétractation de 14 jours peut s'appliquer aux consommateurs ; en demandant l'accès immédiat au service numérique, vous pouvez y renoncer une fois le service pleinement fourni), TOUTES LES SOMMES SONT NON REMBOURSABLES pour la période de facturation en cours, y compris en cas d'utilisation partielle, de rétrogradation ou de non-utilisation. Aucun remboursement n'est accordé en cas d'indisponibilité, de panne, de perte de données, d'insatisfaction vis-à-vis des résultats de l'IA ou de modification de fonctionnalités. Les prix peuvent changer avec un préavis de 30 jours pour la période suivante. Un défaut de paiement peut entraîner la suspension.",
        },
        {
          icon: ShieldOff,
          title: '6. Avertissement — pannes, perte de données & erreurs IA',
          text: "DANS LA MESURE MAXIMALE PERMISE PAR LA LOI, DeltaMatch n'est PAS responsable des pertes ou dommages résultant de : interruptions de service, indisponibilités, plantages, bugs ou maintenance ; perte, corruption ou indisponibilité de données (il vous appartient de conserver vos propres sauvegardes/exports) ; erreurs, inexactitudes, omissions ou biais dans les scores, résumés, classements, questions, rapports ou e-mails générés par l'IA ; confiance accordée à un résultat de l'IA ; indisponibilité, modification ou défaillance de services tiers (fournisseurs d'IA, hébergement, e-mail/IMAP, intégrations ATS, prestataire de paiement) ; ou toute décision d'embauche, de rejet ou d'emploi que vous prenez. Les résultats de l'IA constituent une aide à la décision uniquement et doivent être vérifiés par un humain. DeltaMatch n'automatise aucune décision d'embauche.",
        },
        {
          icon: Scale,
          title: '7. Limitation de responsabilité',
          text: "DANS LA MESURE MAXIMALE PERMISE PAR LA LOI, DeltaMatch (ainsi que ses dirigeants, employés et fournisseurs) ne saurait être tenu responsable de dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, ni de toute perte de profits, de revenus, de données, de clientèle, d'opportunités commerciales ou de résultats de recrutement, même si avisé de cette possibilité. Notre responsabilité totale cumulée pour toute réclamation liée au service, qu'elle soit contractuelle, délictuelle (y compris négligence) ou autre, n'excédera pas le total des sommes effectivement payées par vous à DeltaMatch au cours des trois (3) mois précédant le fait générateur. Rien dans les présentes n'exclut la responsabilité qui ne peut être exclue selon le droit belge (notamment fraude, faute intentionnelle, ou décès/dommage corporel causé par négligence).",
        },
        {
          icon: ShieldOff,
          title: '8. Indemnisation',
          text: "Vous acceptez de défendre, d'indemniser et de garantir DeltaMatch et ses exploitants contre toute réclamation, dommage, responsabilité, perte, coût et dépense (y compris les frais juridiques raisonnables) découlant de ou liés à : (a) les données candidats ou autres données personnelles que vous traitez ; (b) votre violation des présentes Conditions ou de toute loi applicable (RGPD, droit du travail et de la non-discrimination) ; (c) votre utilisation ou votre confiance dans un résultat de l'IA ; ou (d) tout litige entre vous et un candidat ou un tiers.",
        },
        {
          icon: Ban,
          title: '9. Suspension & résiliation',
          text: "Nous pouvons suspendre ou résilier votre compte, avec ou sans préavis, en cas de violation des présentes, d'activité frauduleuse ou illégale, de risque pour nous, ou de défaut de paiement. Vous pouvez résilier à tout moment en fermant votre compte. À la résiliation, votre droit d'utilisation cesse immédiatement ; vos données sont conservées jusqu'à 30 jours (pour permettre l'export) puis supprimées définitivement, sauf obligation légale de conservation plus longue. Les articles 4 à 8, 10 et 11 survivent à la résiliation.",
        },
        {
          icon: Scale,
          title: '10. Propriété intellectuelle & force majeure',
          text: "DeltaMatch, y compris son logiciel, son design, ses marques et son contenu, est et reste notre propriété intellectuelle exclusive ; aucun droit n'est accordé hormis le droit limité, révocable et non exclusif d'utiliser le service conformément aux présentes. Vos données (CV, offres, candidats) restent les vôtres ; vous nous accordez une licence limitée pour les héberger et les traiter à seule fin de fournir le service. Nous ne sommes pas responsables d'un retard ou d'un manquement dû à des événements échappant à notre contrôle raisonnable (force majeure), y compris les pannes d'hébergement, d'IA, de réseau ou de tiers, les cyberattaques ou les actes des autorités.",
        },
        {
          icon: Gavel,
          title: '11. Droit applicable, modifications & contact',
          text: "Les présentes Conditions sont régies par le droit belge. Tout litige relève de la compétence exclusive des tribunaux de [arrondissement judiciaire, ex. Bruxelles], Belgique, sans préjudice des droits impératifs des consommateurs. Si une clause est jugée invalide, le reste demeure en vigueur. Nous pouvons mettre à jour ces Conditions avec un préavis de 30 jours (par e-mail ou dans l'application) ; l'utilisation continue après la date d'effet vaut acceptation. Questions : legal@mydeltamatch.com (à remplacer par votre contact réel).",
        },
      ],
    },
  }

  const c = content[locale as keyof typeof content] || content.fr

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-gray-900 dark:text-white">DeltaMatch</span>
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
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-gray-900 py-10 sm:py-16 px-4 sm:px-6 text-center border-b border-gray-100 dark:border-gray-800">
        <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">{c.title}</h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-2">{c.subtitle}</p>
        <span className="text-xs text-gray-400 dark:text-gray-500">{c.lastUpdated}</span>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 sm:space-y-10">
        {c.sections.map((section, i) => {
          const Icon = section.icon
          return (
            <div key={i} className="flex gap-3 sm:gap-5">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mt-0.5">
                <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">{section.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm break-words">{section.text}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span>© {new Date().getFullYear()} DeltaMatch</span>
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
