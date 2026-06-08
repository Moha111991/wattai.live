import React, { createContext, useContext, useState, useEffect } from 'react';
import { startDomAutoTranslation, stopDomAutoTranslation } from '../utils/autoTranslateDom';

type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// All translations for German (de) and English (en) across the app pages/components.
const TRANSLATIONS: Record<Language, Record<string, string>> = {
  de: {
    // Navigation
    'nav.startpage': 'Startseite',
    'nav.products': 'Produkte & Leistungen',
    'nav.about': 'Über uns',
    'nav.contact': 'Kontakt',
    'nav.login': 'Anmelden',
    'nav.myAccount': 'Mein Konto',

    // Start Page
    'start.heroTitle': 'Die intelligente KI-Steuerung für dein Zuhause',
    'start.heroSub': 'Verbinde PV, Speicher, Elektroauto und wärmepumpe. wattAI.live optimiert den Eigenverbrauch und minimiert Netzstromkosten autonom.',
    'start.startTesting': 'Jetzt kostenlos testen',
    'start.moreInfo': 'Mehr erfahren',

    // Common words
    'common.dashboard': 'Dashboard',
    'common.ev': 'Elektroauto',
    'common.devices': 'Geräte',
    'common.smarthome': 'Smart Home',
    'common.aiRecom': 'KI-Empfehlung',
    'common.fleet': 'Flottenmanagement',
    'common.capacity': 'Kapazität',
    'common.energyLoaded': 'Energie geladen',
    'common.power': 'Leistung',
    'common.loadstate': 'Ladezustand',

    // Products Page
    'products.title': 'Produkte & Leistungen',
    'products.subtitle': 'Wähle den Plan, der zu deinem Zuhause oder Betrieb passt. Jederzeit upgradebar.',
    'products.free': 'Free',
    'products.freeNote': 'Kostenlos',
    'products.freeCta': 'Kostenlos starten',
    'products.pro': 'Pro',
    'products.proNote': '€ / Monat',
    'products.proCta': '🛒 Jetzt kaufen & freischalten',
    'products.business': 'Business',
    'products.businessNote': '€ / Standort / Monat',
    'products.businessCta': '📧 Kontakt aufnehmen',
    'products.recommended': '⭐ Empfohlen',
    'products.secFree': 'Anschluss live überwachen',
    'products.secPro': 'Zuhause schlau steuern',
    'products.secBusiness': 'Gewerbliche Standorte',
    'products.freeF1': '📊 Live-Energieverbrauch & PV-Ertrag',
    'products.freeF2': '🔋 Basis-Speichervisualisierung',
    'products.freeF3': '🚗 1 EV-Profil',
    'products.freeF4': '📱 Mobile App (iOS & Android)',
    'products.freeF5': '⚡ Echtzeit-Energiefluss-Anzeige',
    'products.proF1': '✅ Alles aus Free',
    'products.proF2': '🤖 KI-Ladeoptimierung & Zeitfenster',
    'products.proF3': '🏠 Smart-Home-Automatisierungen',
    'products.proF4': '🔮 Verbrauchs- & PV-Prognosen',
    'products.proF5': '⚡ Dynamische Tarifintegration (Tibber etc.)',
    'products.proF6': '🔋 V2H / V2G-Strategien',
    'products.proF7': '🚗 Multi-EV (bis zu 3 Fahrzeuge)',
    'products.proF8': '📈 Erweiterte Insights & Berichte',
    'products.busF1': '✅ Alles aus Pro',
    'products.busF2': '🏭 Flottenmanagement (unbegrenzt EVs)',
    'products.busF3': '📡 KI-Dispatch & Lastspitzen-Management',
    'products.busF4': '🔗 API-Zugang & Webhooks',
    'products.busF5': '🔒 SSO & Mandantenfähigkeit',
    'products.busF6': '📋 Compliance- & Audit-Reporting',
    'products.busF7': '🛠 SLA, Alerting & dedizierter Support',
    'products.busF8': '🤝 OEM- & Installateurkanal',
    'products.lSmartHome': 'Smart-Home-Automatisierungen',
    'products.lKi': 'KI-Ladeoptimierung',
    'products.lV2g': 'V2H / V2G-Strategien',
    'products.lFleet': 'Flottenmanagement',
    'products.disclaimer': '🔒 Keine Kreditkarte nötig für Free · DSGVO-konform · Jederzeit kündbar',
    'products.compTitle': 'Funktionsvergleich',
    'products.compFeature': 'Funktion',
    'products.faqTitle': 'Häufige Fragen',
    'products.faq1Q': 'Kann ich jederzeit kündigen?',
    'products.faq1A': 'Ja. Pro-Abos können monatlich gekündigt werden, ohne Mindestlaufzeit.',
    'products.faq2Q': 'Welche Geräte werden unterstützt?',
    'products.faq2A': 'Wallboxen (OCPP), Heimspeicher (SMA, Fronius, BYD), Wechselrichter, Wärmepumpen und alle gängigen EV-Modelle via ISO 15118.',
    'products.faq3Q': 'Sind meine Nutzerdaten sicher?',
    'products.faq3A': 'Alle Daten werden DSGVO-konform in der EU verarbeitet (Art. 6, 13, 15–22 DSGVO). Keine Weitergabe an Dritte.',
    'products.faq4Q': 'Was ist der Unterschied zwischen Pro und Business?',
    'products.faq4A': 'Pro richtet sich an Privathaushalte (bis 3 EVs). Business ergänzt Flottenmanagement, KI-Dispatch, API-Zugang und SLA für gewerbliche Betreiber.',
    'products.faq5Q': 'Gibt es eine kostenlose Testphase für Pro?',
    'products.faq5A': 'Aktuell gibt es kein Probe-Abo. Der Free-Plan bietet jedoch dauerhaft die Basis-Funktionen ohne Zeitlimit.',

    // Contact Page
    'contact.title': 'Kontakt',
    'contact.subtitle': 'Fragen, Feedback oder Interesse an Business-Lösungen? Wir freuen uns von dir zu hören.',
    'contact.formTitle': '✉️ Nachricht senden',
    'contact.formSubmitted': 'Nachricht vorbereitet!',
    'contact.formSubmittedSub': 'Dein E-Mail-Programm öffnet sich mit der vorausgefüllten Nachricht.',
    'contact.formMore': 'Weitere Nachricht senden',
    'contact.formName': 'Name *',
    'contact.formNamePlaceholder': 'Dein Name',
    'contact.formEmail': 'E-Mail *',
    'contact.formEmailPlaceholder': 'deine@email.de',
    'contact.formSubject': 'Betreff',
    'contact.formMessage': 'Nachricht *',
    'contact.formMessagePlaceholder': 'Wie können wir helfen?',
    'contact.formSubmit': '📤 Nachricht senden',
    'contact.formRequired': '* Pflichtfelder · Daten werden nur zur Beantwortung deiner Anfrage genutzt (DSGVO Art. 6 Abs. 1b)',
    'contact.direct': '📬 Direkte Kontaktwege',
    'contact.directMail': 'E-Mail',
    'contact.directSales': 'Business & Vertrieb',
    'contact.directSupport': 'Technischer Support',
    'contact.responseTitle': '🕐 Reaktionszeit',
    'contact.responseGeneral': 'Allgemeine Anfragen',
    'contact.responseSupport': 'Technischer Support',
    'contact.responseSales': 'Business / Vertrieb',
    'contact.salesInterest': '🏭 Business-Anfrage starten →',
    'contact.salesInterestText': 'Flottenmanagement, API-Integration oder individuelle Enterprise-Lösung? Wir beraten dich kostenlos.',
    'contact.validationRequired': 'Bitte alle Pflichtfelder ausfüllen.',
    'contact.validationEmail': 'Bitte eine gültige E-Mail-Adresse eingeben.',
    'contact.legalText': 'Impressum (§ 5 TMG): WattAI.live · Mohammad Hameed · Verantwortlich für den Inhalt: Mohammad Hameed · E-Mail: kontakt@wattai.live · Tel.: +49 151 28163757 · Plattform der EU-Kommission zur Online-Streitbeilegung:',

    // About Page
    'about.title': 'Über wattAI.live',
    'about.subtitle': 'wattAI.live entstand aus der Überzeugung, dass Energie nicht verschwendet werden muss — sie muss nur besser koordiniert werden. Wir bauen die intelligente Plattform, die Haushalt, E-Mobilität und Gewerbe zusammenbringt.',
    'about.mission': 'Unsere Mission',
    'about.missionText1': 'Wir glauben, dass jeder Haushalt und jedes Unternehmen das Potenzial hat, energieautarker zu werden. wattAI.live liefert dafür die KI-Intelligenz — von der PV-Anlage über den Heimspeicher bis zur Fahrzeugflotte.',
    'about.missionText2': 'Gegründet in Deutschland. Entwickelt nach ISO 15118, ISO 21434 und DSGVO. Betrieben auf europäischer Cloud-Infrastruktur.',
    'about.foundingYear': 'Gründungsjahr',
    'about.dataLoc': 'Datenstandort',
    'about.v2g': 'V2G-Standard',
    'about.privacy': 'Datenschutz',
    'about.values': 'Unsere Werte',
    'about.team': 'Das Team',
    'about.techStack': 'Technologie-Stack & Compliance',
    'about.techSub': 'Unsere Software-Architektur ist nach strengen Industriemassstäben für kritische Infrastruktur (KRITIS) modular, latenzarm und cybersicher aufgebaut.',
    'about.tableCategory': 'Kategorie',
    'about.tableTech': 'Technologien / Standards',
    'about.tablePitch': 'Business-Nutzen im Pitch',
    'about.cat1': 'Sicherheit & Standards',
    'about.pitch1': 'Maximale Compliance für kritische Smart-Grid-Infrastrukturen und sicheres Laden (V2G / Plug & Charge).',
    'about.cat2': 'Künstliche Intelligenz',
    'about.pitch2': 'Latenzarme, ausfallsichere Ausführung lernender Reinforcement-Learning-Modelle direkt auf dezentralen Gateways (Edge).',
    'about.cat3': 'IoT & Telemetrie',
    'about.pitch3': 'Echtzeit-Schnittstellen für bidirektionale Steuerung und hochfrequente Datenübertragung dezentraler EMS-Anlagen.',
    'about.cat4': 'Enterprise-Backend',
    'about.pitch4': 'Skalierbare, hochperformante API-Strukturen mit ultraschnellem In-Memory Caching für Echtzeit-Optimierungen.',
    'about.cat5': 'DevOps & Monitoring',
    'about.pitch5': 'Sichere, automatisierte Bereitstellung (CI/CD) und lückenlose Echtzeit-Überwachung aller Edge-Instanzen im Betrieb.',
  },
  en: {
    // Navigation
    'nav.startpage': 'Home',
    'nav.products': 'Products & Services',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.login': 'Log In',
    'nav.myAccount': 'My Account',

    // Start Page
    'start.heroTitle': 'Intelligent AI Control for Your Home',
    'start.heroSub': 'Connect PV, battery, electric vehicle and heat pump. wattAI.live optimizes self-consumption and minimizes grid costs autonomously.',
    'start.startTesting': 'Start Free Trial',
    'start.moreInfo': 'Learn More',

    // Common words
    'common.dashboard': 'Dashboard',
    'common.ev': 'Electric Vehicle',
    'common.devices': 'Devices',
    'common.smarthome': 'Smart Home',
    'common.aiRecom': 'AI Recommendation',
    'common.fleet': 'Fleet Management',
    'common.capacity': 'Capacity',
    'common.energyLoaded': 'Energy Charged',
    'common.power': 'Power',
    'common.loadstate': 'State of Charge',

    // Products Page
    'products.title': 'Products & Services',
    'products.subtitle': 'Choose the plan that fits your home or business. Upgradeable anytime.',
    'products.free': 'Free',
    'products.freeNote': 'Free',
    'products.freeCta': 'Start for Free',
    'products.pro': 'Pro',
    'products.proNote': '€ / Month',
    'products.proCta': '🛒 Buy now & unlock',
    'products.business': 'Business',
    'products.businessNote': '€ / Site / Month',
    'products.businessCta': '📧 Get in touch',
    'products.recommended': '⭐ Recommended',
    'products.secFree': 'Live connection monitoring',
    'products.secPro': 'Smart home control',
    'products.secBusiness': 'Commercial deployment',
    'products.freeF1': '📊 Live energy usage & PV yield',
    'products.freeF2': '🔋 Basic battery visualization',
    'products.freeF3': '🚗 1 EV profile',
    'products.freeF4': '📱 Mobile App (iOS & Android)',
    'products.freeF5': '⚡ Real-time energy flow UI',
    'products.proF1': '✅ Everything in Free',
    'products.proF2': '🤖 AI EV charging & time slots',
    'products.proF3': '🏠 Smart home integrations',
    'products.proF4': '🔮 Generation & load forecasts',
    'products.proF5': '⚡ Dynamic tariff billing (Tibber, etc.)',
    'products.proF6': '🔋 V2H / V2G smart strategy',
    'products.proF7': '🚗 Multi-EV (up to 3 vehicles)',
    'products.proF8': '📈 Advanced insights & reports',
    'products.busF1': '✅ Everything in Pro',
    'products.busF2': '🏭 Fleet management (unlimited EVs)',
    'products.busF3': '📡 AI dispatching & peak-shaving',
    'products.busF4': '🔗 API integration & webhooks',
    'products.busF5': '🔒 SSO & multi-tenancy controls',
    'products.busF6': '📋 Compliance & audit reports',
    'products.busF7': '🛠 SLA, paging alerts & premium support',
    'products.busF8': '🤝 OEM & installer custom channel',
    'products.lSmartHome': 'Smart home automation',
    'products.lKi': 'AI solar optimization',
    'products.lV2g': 'V2H / V2G charge schemes',
    'products.lFleet': 'Fleet management console',
    'products.disclaimer': '🔒 No credit card required for Free · GDPR-compliant · Cancel anytime',
    'products.compTitle': 'Feature Comparison',
    'products.compFeature': 'Feature',
    'products.faqTitle': 'Frequently Asked Questions',
    'products.faq1Q': 'Can I cancel anytime?',
    'products.faq1A': 'Yes. Pro subscriptions can be canceled monthly without a minimum contract period.',
    'products.faq2Q': 'Which hardware platforms are supported?',
    'products.faq2A': 'Wallboxes (OCPP), home storage batteries (SMA, Fronius, BYD), PV inverters, heat pumps, and standard EVs via ISO 15118.',
    'products.faq3Q': 'Is my personal user data safe?',
    'products.faq3A': 'All telemetry and audit data is processed strictly in accordance with GDPR on secure servers within the EU. No third-party sales.',
    'products.faq4Q': 'What is the main difference between Pro and Business?',
    'products.faq4A': 'Pro targets private households (up to 3 EVs). Business adds complex fleet dispatching, sub-milisecond Peak-Shaving, webhooks, and enterprise APIs.',
    'products.faq5Q': 'Do you offer a free trial period for Pro?',
    'products.faq5A': 'We currently don\'t offer trials, but the Free plan provides permanent basic energy routing functionality without any time limit.',

    // Contact Page
    'contact.title': 'Contact',
    'contact.subtitle': 'Questions, suggestions, or customized B2B inquiries? We\'d love to hear from you.',
    'contact.formTitle': '✉️ Send Message',
    'contact.formSubmitted': 'Message Prepared!',
    'contact.formSubmittedSub': 'Your default e-mail client will open with the pre-filled inquiry.',
    'contact.formMore': 'Send another message',
    'contact.formName': 'Name *',
    'contact.formNamePlaceholder': 'Your Name',
    'contact.formEmail': 'E-Mail *',
    'contact.formEmailPlaceholder': 'your@email.com',
    'contact.formSubject': 'Subject',
    'contact.formMessage': 'Message *',
    'contact.formMessagePlaceholder': 'How can we help you?',
    'contact.formSubmit': '📤 Send Message',
    'contact.formRequired': '* Required fields · Personal data is solely utilized to process your request (GDPR Art. 6 Para. 1b)',
    'contact.direct': '📬 Direct Contact Channels',
    'contact.directMail': 'E-Mail',
    'contact.directSales': 'Business & Sales',
    'contact.directSupport': 'Technical Support',
    'contact.responseTitle': '🕐 Response Time',
    'contact.responseGeneral': 'General Inquiries',
    'contact.responseSupport': 'Technical Support',
    'contact.responseSales': 'Corporate Inquiries',
    'contact.salesInterest': '🏭 Start Corporate Inquiry →',
    'contact.salesInterestText': 'Fleet routing, high-performance API integration, or white-labeled installations? Let\'s discuss.',
    'contact.validationRequired': 'Please fill out all required fields.',
    'contact.validationEmail': 'Please enter a valid e-mail address.',
    'contact.legalText': 'Imprint (§ 5 TMG): WattAI.live · Mohammad Hameed · Responsible for content: Mohammad Hameed · E-Mail: kontakt@wattai.live · Tel: +49 151 28163757 · European Commission Online Dispute Resolution platform:',

    // About Page
    'about.title': 'About wattAI.live',
    'about.subtitle': 'wattAI.live was born from the conviction that energy doesn\'t have to be wasted — it just needs to be coordinated better. We build the intelligent platform that connects households, e-mobility, and businesses.',
    'about.mission': 'Our Mission',
    'about.missionText1': 'We believe that every household and business has the potential to become more energy independent. wattAI.live delivers the AI intelligence for this — from PV systems and home storage to vehicle fleets.',
    'about.missionText2': 'Founded in Germany. Developed in compliance with ISO 15118, ISO 21434, and GDPR. Hosted on European cloud infrastructure.',
    'about.foundingYear': 'Year Founded',
    'about.dataLoc': 'Data Location',
    'about.v2g': 'V2G Standard',
    'about.privacy': 'Data Privacy',
    'about.values': 'Our Values',
    'about.team': 'The Team',
    'about.techStack': 'Technology Stack & Compliance',
    'about.techSub': 'Our software architecture is built modularly, with low latency, and cybersecure according to strict industrial standards for critical infrastructure (KRITIS).',
    'about.tableCategory': 'Category',
    'about.tableTech': 'Technologies / Standards',
    'about.tablePitch': 'Business Value in Pitch',
    'about.cat1': 'Security & Standards',
    'about.pitch1': 'Maximum compliance for critical smart grid infrastructure and secure charging (V2G / Plug & Charge).',
    'about.cat2': 'Artificial Intelligence',
    'about.pitch2': 'Low-latency, fail-safe execution of learning Reinforcement Learning models directly on decentralized gateways (Edge).',
    'about.cat3': 'IoT & Telemetry',
    'about.pitch3': 'Real-time interfaces for bidirectional control and high-frequency data transmission of decentralized EMS installations.',
    'about.cat4': 'Enterprise Backend',
    'about.pitch4': 'Scalable, high-performance API structures with ultra-fast in-memory caching for real-time optimization.',
    'about.cat5': 'DevOps & Monitoring',
    'about.pitch5': 'Secure, automated deployment (CI/CD) and seamless real-time monitoring of all active Edge instances.',
  }
};

const AUTO_TRANSLATION_OVERRIDES: Record<string, string> = {
  'Abmelden': 'Log out',
  'Einloggen / Registrieren': 'Log in / Sign up',
  'Menü öffnen': 'Open menu',
  'Menü schließen': 'Close menu',
  'Zur Startseite': 'Go to home page',
  'Hauptnavigation': 'Main navigation',
  'Schließen': 'Close',
  'Auf Pro upgraden': 'Upgrade to Pro',
  'Auf Business upgraden': 'Upgrade to Business',
};

const DOM_AUTO_TRANSLATION_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const deTranslations = TRANSLATIONS.de;
  const enTranslations = TRANSLATIONS.en;

  for (const [key, germanText] of Object.entries(deTranslations)) {
    const englishText = enTranslations[key];
    if (!germanText || !englishText || germanText === englishText) {
      continue;
    }
    map[germanText] = englishText;
  }

  return {
    ...map,
    ...AUTO_TRANSLATION_OVERRIDES,
  };
})();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('wattai-language');
    // Default to German ('de')
    return (saved === 'en' || saved === 'de') ? saved : 'de';
  });

  useEffect(() => {
    localStorage.setItem('wattai-language', language);
  }, [language]);

  useEffect(() => {
    if (language === 'en') {
      startDomAutoTranslation(DOM_AUTO_TRANSLATION_MAP);
    } else {
      stopDomAutoTranslation();
    }

    return () => stopDomAutoTranslation();
  }, [language]);

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['de']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
