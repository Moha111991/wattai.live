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
  // ── TopNav / Auth ──────────────────────────────────────────────────────────
  'Abmelden': 'Log out',
  'Einloggen / Registrieren': 'Log in / Sign up',
  'Menü öffnen': 'Open menu',
  'Menü schließen': 'Close menu',
  'Zur Startseite': 'Go to home page',
  'Hauptnavigation': 'Main navigation',
  'Schließen': 'Close',
  'Auf Pro upgraden': 'Upgrade to Pro',
  'Auf Business upgraden': 'Upgrade to Business',

  // ── Dashboard Tab ─────────────────────────────────────────────────────────
  'Verbinde mit Backend...': 'Connecting to backend...',
  'KI-gestützte': 'AI-Powered',
  'Energieplattform': 'Energy Platform',
  'Live-Status, Lastmanagement und Energieflussanalyse — alles in einer Steuerungsoberfläche.': 'Live status, load management and energy flow analysis — all in one control panel.',
  'WattAI · Energie-Ökosystem': 'WattAI · Energy Ecosystem',
  'KI-Optimierung': 'AI Optimization',
  'PV-Ertrag': 'PV Yield',
  'Hausverbrauch': 'Home Consumption',
  'Speicher-SOC': 'Battery SOC',
  'Netz': 'Grid',
  'Speicher': 'Battery',
  'Eigenverbrauch': 'Self-Consumption',
  'Netzeinspeisung': 'Grid Feed-in',
  'Netzbezug': 'Grid Import',
  'Echtzeit': 'Real-time',
  'Leistung': 'Power',
  'Ladezustand': 'State of Charge',
  'CO₂ & Kosten Übersicht (Monat)': 'CO₂ & Cost Overview (Month)',
  'Fehler- & Alarmmonitor': 'Error & Alarm Monitor',
  'Energiefluss Live': 'Live Energy Flow',
  'System läuft einwandfrei – keine aktiven Alarme': 'System running properly – no active alarms',
  'Alles in Ordnung': 'All good',
  'Keine aktuellen Fehler oder Warnungen. Das System überwacht alle Komponenten kontinuierlich.': 'No current errors or warnings. The system continuously monitors all components.',
  'Benachrichtigungen aus': 'Notifications off',

  // ── Geräte Tab (DeviceGrid) ───────────────────────────────────────────────
  'Verbunden': 'Connected',
  'Teilverbunden': 'Partially connected',
  'Nicht verbunden': 'Not connected',
  'Verbinde…': 'Connecting…',
  'Jetzt verbinden': 'Connect now',
  '✓ Verbunden': '✓ Connected',
  '✓ Erfolgreich verbunden': '✓ Successfully connected',
  'Protokoll': 'Protocol',
  'Standard': 'Standard',
  'Sicherheit': 'Security',
  'Schnittstelle': 'Interface',
  'Geräte verbunden': 'devices connected',
  'Geräteverwaltung · MQTT/TLS': 'Device Management · MQTT/TLS',
  'Geräteverwaltung': 'Device Management',
  '& Netzwerk': '& Network',
  'Geräte & Adapter': 'Devices & Adapters',
  'Gerät hinzufügen': 'Add device',
  'Gerät entfernen': 'Remove device',
  'Geräte': 'Devices',
  'Heimspeicher': 'Home Battery',
  'Wechselrichter': 'Inverter',
  'Wallbox': 'Wallbox',
  'Energiezähler': 'Energy Meter',
  'Batteriespeicher': 'Battery Storage',
  'Solar Inverter': 'Solar Inverter',
  'Ladestation': 'Charging Station',
  'NICHT VERBUNDEN': 'NOT CONNECTED',

  // ── Elektroauto Tab (EVDashboard) ─────────────────────────────────────────
  'Elektroauto · V2H/V2G': 'Electric Vehicle · V2H/V2G',
  'Intelligente': 'Intelligent',
  'Ladesteuerung': 'Charging Control',
  'Bidirektionales Laden, V2H/V2G-Integration und Echtzeit-Monitoring für Ihr Elektrofahrzeug.': 'Bidirectional charging, V2H/V2G integration and real-time monitoring for your EV.',
  'Bidirektional': 'Bidirectional',
  'V2H aktiv': 'V2H active',
  'Ladeleistung': 'Charging Power',
  'Lädt mit': 'Charging at',
  'verbunden': 'connected',
  'aktiv': 'active',
  'V2H / V2G Strategien': 'V2H / V2G Strategies',
  'V2H / V2G-Strategien': 'V2H / V2G Strategies',
  'V2H aktiv · 2.4 kW ins Haus': 'V2H active · 2.4 kW to home',
  'SOC 68 % · Lädt mit 11 kW': 'SOC 68% · Charging at 11 kW',

  // ── Smart Home Tab (HouseholdDashboard) ──────────────────────────────────
  'Smart Home': 'Smart Home',
  'Wärmepumpe': 'Heat Pump',
  'Waschmaschine': 'Washing Machine',
  'Trockner': 'Dryer',
  'Spülmaschine': 'Dishwasher',
  'Klimaanlage': 'Air Conditioning',
  'Smart Licht': 'Smart Light',
  'PV-Überschuss': 'PV Surplus',
  'Günstigster Tarif': 'Cheapest Tariff',
  'Zeitfenster': 'Time Window',
  'SG-Ready': 'SG-Ready',
  'Startet automatisch bei Solarüberschuss': 'Starts automatically on solar surplus',
  'Nutzt den günstigsten Netztarif (Tibber/aWATTar)': 'Uses the cheapest grid tariff (Tibber/aWATTar)',
  'Startet in definiertem Zeitfenster': 'Starts in defined time window',
  'Steuersignal vom Netzbetreiber': 'Control signal from grid operator',
  'Hausautomation': 'Home Automation',
  'Hausautomation · IoT-Geräte': 'Home Automation · IoT Devices',
  'Gerät auswählen': 'Select device',
  'Protokoll wählen': 'Choose protocol',
  'Automation wählen': 'Choose automation',
  'Verbindung herstellen': 'Establish connection',
  'Gerät verwalten': 'Manage device',
  'Verbindung aufgebaut': 'Connection established',
  'Diagnose starten': 'Run diagnostics',
  'Diagnosebericht': 'Diagnostic report',
  'Logfile anzeigen': 'Show log',
  'Logfile verbergen': 'Hide log',
  'Gerät trennen': 'Disconnect device',
  'Gerät getrennt': 'Device disconnected',
  'Zurück': 'Back',
  'Weiter': 'Next',
  'Abbrechen': 'Cancel',
  'Verbinden': 'Connect',
  'Verbindung wird hergestellt…': 'Establishing connection…',
  'Authentifizierung…': 'Authenticating…',
  'Gerät registriert': 'Device registered',
  'Bereit': 'Ready',
  'Signal': 'Signal',
  'IP-Adresse': 'IP Address',
  'Pairing-Code': 'Pairing Code',
  'Zuletzt gesehen': 'Last seen',
  'Einschalten': 'Turn on',
  'Ausschalten': 'Turn off',
  'Ein': 'On',
  'Aus': 'Off',

  // KNX / Zigbee / Z-Wave connection steps
  'KNX-Bus wird gescannt…': 'Scanning KNX bus…',
  'Gerät auf IP-Adresse gefunden': 'Device found at IP address',
  'ETS-Gruppenadresse wird geprüft…': 'Checking ETS group address…',
  'Tunnel-Verbindung aufgebaut': 'Tunnel connection established',
  'Zigbee-Coordinator initialisiert…': 'Zigbee coordinator initializing…',
  'IEEE 802.15.4 Scan läuft…': 'IEEE 802.15.4 scan running…',
  'Gerät antwortet auf Beacon': 'Device responding to beacon',
  'Sicherheitsschlüssel ausgetauscht': 'Security key exchanged',
  'Z-Wave Controller aktiv…': 'Z-Wave controller active…',
  '900 MHz Band wird gescannt…': 'Scanning 900 MHz band…',
  'Node-ID zugewiesen': 'Node ID assigned',
  'S2-Sicherheitsprofil aktiviert': 'S2 security profile activated',
  'Home Assistant API verbinden…': 'Connecting to Home Assistant API…',
  'Token wird validiert…': 'Validating token…',
  'Entity-ID wird ermittelt': 'Resolving entity ID',
  'Webhook registriert': 'Webhook registered',
  'openHAB REST-API erreichbar…': 'openHAB REST API reachable…',
  'Thing-Discovery läuft…': 'Thing discovery running…',
  'Channel wird gemappt': 'Channel mapping…',
  'Rule erstellt': 'Rule created',
  'Loxone Miniserver gefunden…': 'Loxone Miniserver found…',
  'Websocket öffnen…': 'Opening WebSocket…',
  'Authentifizierung mit Token': 'Authenticating with token',
  'Virtueller Eingang aktiv': 'Virtual input active',

  // ── KI-Empfehlung Tab (KIDashboard) ──────────────────────────────────────
  'KI-Command Center · DQN v2.1': 'AI Command Center · DQN v2.1',
  'KI-Empfehlung': 'AI Recommendation',
  '& Optimierung': '& Optimization',
  'Deep-Q-Network + LSTM analysiert Echtzeitstrom und liefert optimale Lade-, Speicher- und Einspeisestrategien für Ihr E-Auto-Ökosystem.': 'Deep-Q-Network + LSTM analyses real-time power flow and delivers optimal charging, storage and feed-in strategies for your EV ecosystem.',
  'Ersparnis/Jahr': 'Savings/Year',
  'CO₂ eingespart': 'CO₂ Saved',
  'Effizienz': 'Efficiency',
  'CO₂ kg gespart': 'CO₂ kg saved',
  '⟳ Analysiere…': '⟳ Analyzing…',
  '🧠 Empfehlung laden': '🧠 Load Recommendation',
  '📈 Verlauf': '📈 History',
  'Aktuelle KI-Empfehlung': 'Current AI Recommendation',
  'Aktion': 'Action',
  'Einsparung': 'Savings',
  'Konfidenz': 'Confidence',
  'KI-Entscheidungsverlauf': 'AI Decision History',
  'KI-Module & Features': 'AI Modules & Features',
  'KI-Optimierungsplan · Nächste 24h': 'AI Optimization Plan · Next 24h',
  'Aktiv': 'Active',
  'umgesetzt': 'applied',
  '% Konfidenz': '% Confidence',
  // AI Module subtitles & descriptions
  'EV-Ladeoptimierung · Echtzeit': 'EV Charging Optimization · Real-time',
  'Lastspitzenreduktion · Grid': 'Peak Load Reduction · Grid',
  'PV-Eigenverbrauch · Prognose': 'PV Self-Consumption · Forecast',
  'Vehicle-to-Home · Netzrückspeisung': 'Vehicle-to-Home · Grid Feed-back',
  'Anomalieerkennung · Batteriegesundheit': 'Anomaly Detection · Battery Health',
  'Dynamischer Stromtarif · Tibber': 'Dynamic Energy Tariff · Tibber',
  'Ø Ladepreis': 'Avg. Charge Price',
  'Lastspitze': 'Peak Load',
  // AI module descriptions (long)
  'Dynamische Ladestrategie basierend auf Spotmarktpreisen, PV-Prognose und Fahrtplanung. SOC-Ziel 80% bis 07:00 Uhr.': 'Dynamic charging strategy based on spot market prices, PV forecast and trip planning. SOC target 80% by 07:00.',
  'Automatische Entladung des Heimspeichers bei Leistungsspitzen > 8 kW. Spart Netzentgelte und schützt die Infrastruktur.': 'Automatic home battery discharge at power peaks > 8 kW. Saves grid fees and protects infrastructure.',
  'KI-gestützte Prognose für 48h PV-Ertrag. Optimale Speicherstrategie: Laden bei Überschuss, Entladen bei Teurung.': 'AI-powered 48h PV yield forecast. Optimal storage strategy: charge on surplus, discharge at peak prices.',
  'Bidirektionales Laden mit ISO 15118-20. Das EV fungiert als Puffer — Einspeisung bei negativen Preisen.': 'Bidirectional charging with ISO 15118-20. The EV acts as a buffer — feeds back at negative prices.',
  'Edge-KI erkennt Degradation, Zellimbalancen und thermische Anomalien. Frühwarnsystem für Wartungsbedarf.': 'Edge AI detects degradation, cell imbalances and thermal anomalies. Early warning system for maintenance.',
  'Integration mit dynamischen Tarifen (Tibber, Octopus Energy). Vollautomatische Lade- und Entladezeitplanung nach Preisprognose.': 'Integration with dynamic tariffs (Tibber, Octopus Energy). Fully automatic charge/discharge scheduling by price forecast.',
  // 24h timeline actions
  'EV laden (Niedrigtarif · Tibber)': 'EV charging (low tariff · Tibber)',
  'PV-Prognose: 3.2 kWh — Speicher laden': 'PV forecast: 3.2 kWh — charge battery',
  'Solar-Überschuss → Netzeinspeisung': 'Solar surplus → grid feed-in',
  'Peak Shaving aktiv — Speicher entladen': 'Peak shaving active — discharge battery',
  'V2H: EV → Haushalt (Abendspitze)': 'V2H: EV → Household (evening peak)',
  'Nacht-Ladung EV (günstiger Tarif)': 'Night EV charging (low tariff)',
  // System status
  '48h · Aktiv': '48h · Active',
  'Täglich 03:00': 'Daily 03:00',
  // KI history entries
  'Jetzt laden – PV-Überschuss 4,2 kW': 'Charge now – PV surplus 4.2 kW',
  'Laden pausieren – Spitzentarif aktiv': 'Pause charging – peak tariff active',
  'Heimspeicher entladen – Preispeak': 'Discharge home battery – price peak',
  'V2H aktiv – EV als Puffer nutzen': 'V2H active – use EV as buffer',
  'Heute, 09:14': 'Today, 09:14',
  'Heute, 07:30': 'Today, 07:30',
  'Gestern, 18:45': 'Yesterday, 18:45',
  'Gestern, 14:00': 'Yesterday, 14:00',
  'Gestern, 11:20': 'Yesterday, 11:20',
  'PV-Überschuss laden': 'Charge PV surplus',
  'Nachtladen abgeschlossen': 'Night charging complete',
  'Peak-Shaving aktiv': 'Peak shaving active',
  'Ladepause – Spitzentarif': 'Charging pause – peak tariff',
  'V2H Entladung': 'V2H discharge',
  'Tibber Niedertarif laden': 'Charge on Tibber low tariff',
  'Solar-Eigenverbrauch': 'Solar self-consumption',

  // ── FAQ / Misc ────────────────────────────────────────────────────────────
  'Häufige Fragen': 'Frequently Asked Questions',
  'Häufig gestellte Fragen': 'Frequently Asked Questions',
  'Jetzt kostenlos testen': 'Start Free Trial',
  'Mehr erfahren': 'Learn More',
  'Kostenlos starten': 'Start for Free',
  'Kein Vertrag. Jederzeit kündbar.': 'No contract. Cancel anytime.',
  'Keine Kreditkarte nötig': 'No credit card required',
  'DSGVO-konform': 'GDPR-compliant',
  'Jederzeit kündbar': 'Cancel anytime',
  'Kein Vertrag': 'No contract',
  'Aktueller Plan:': 'Current Plan:',
  'Anmelden für mehr Funktionen': 'Sign in for more features',
  'Was ist WattAI.live?': 'What is WattAI.live?',
  'Ist die App kostenlos?': 'Is the app free?',
  'Welche Geräte werden unterstützt?': 'Which devices are supported?',
  'Sind meine Daten sicher?': 'Is my data safe?',
  'Kann ich den Plan jederzeit kündigen?': 'Can I cancel the plan anytime?',
  'Impressum': 'Legal Notice',
  'Datenschutz': 'Privacy Policy',
  'AGB': 'Terms & Conditions',
  'Alle Angaben ohne Gewähr · Kein Rechtsrat': 'All information without guarantee · No legal advice',
  'Nur notwendige': 'Only necessary',
  'Verstanden & Akzeptieren': 'Understood & Accept',
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
    if (saved === 'en' || saved === 'de') return saved;
    // Auto-detect from browser language
    const browserLang = navigator.language?.toLowerCase() ?? '';
    return browserLang.startsWith('en') ? 'en' : 'de';
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

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
