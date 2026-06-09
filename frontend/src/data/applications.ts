export type ApplicationItem = {
  slug: string;
  icon: string;
  title: string;
  desc: string;
  cardBackground: string;
  technicalOverview: string;
  technicalHighlights: string[];
};

type LocalizedText = Record<Language, string>;
type LocalizedTextList = Record<Language, string[]>;
type Language = 'de' | 'en';

type LocalizedApplicationItem = {
  slug: string;
  icon: string;
  cardBackground: string;
  title: LocalizedText;
  desc: LocalizedText;
  technicalOverview: LocalizedText;
  technicalHighlights: LocalizedTextList;
};

const LOCALIZED_APPLICATIONS: LocalizedApplicationItem[] = [
  {
    slug: 'pv-optimierung',
    icon: '☀️',
    title: {
      de: 'PV-Optimierung',
      en: 'PV Optimization',
    },
    desc: {
      de: 'Echtzeit-Ertragsprognosen, Eigenverbrauchsmaximierung und Netzeinspeisung intelligent steuern.',
      en: 'Control yield forecasts, self-consumption, and grid feed-in intelligently in real time.',
    },
    cardBackground: 'radial-gradient(circle at 20% 15%, rgba(251,191,36,0.45), transparent 42%), linear-gradient(140deg, rgba(14,165,233,0.38), rgba(15,23,42,0.95) 70%), linear-gradient(60deg, rgba(250,204,21,0.2), rgba(6,182,212,0.08))',
    technicalOverview: {
      de: 'Die PV-Optimierung kombiniert Wetterprognosen, Inverter-Telemetrie und Lastprofile zu einem rollierenden 15-Minuten-Dispatch. Das System priorisiert Eigenverbrauch, minimiert Peak-Import und steuert Netzeinspeisung unter Berücksichtigung dynamischer Tarife und Netzrestriktionen.',
      en: 'PV optimization combines weather forecasts, inverter telemetry, and load profiles into a rolling 15-minute dispatch. The system prioritizes self-consumption, minimizes peak imports, and controls grid feed-in while respecting dynamic tariffs and grid constraints.',
    },
    technicalHighlights: {
      de: [
        'Forecast-Pipeline mit Kurzfrist-Nowcasting (Cloud-Cover) und Tagesprognose für AC/DC-Erzeugung.',
        'Inverter- und Smart-Meter-Feedback in Echtzeit zur Korrektur von Prognosefehlern.',
        'Regelstrategie mit Prioritätskaskade: Haushaltslast → Speicherladung → EV-Ladung → Einspeisung.',
        'Netzkonforme Einspeiseregelung (Ramp-Rate, Export-Limits, tarifabhängige Dispatch-Strategie).',
      ],
      en: [
        'Forecast pipeline with short-term nowcasting (cloud cover) and day-ahead AC/DC generation predictions.',
        'Real-time inverter and smart meter feedback to correct forecast errors.',
        'Control strategy with priority cascade: household load → battery charging → EV charging → feed-in.',
        'Grid-compliant export control with ramp rate, export limits, and tariff-aware dispatch.',
      ],
    },
  },
  {
    slug: 'batteriemanagement',
    icon: '🔋',
    title: {
      de: 'Batteriemanagement',
      en: 'Battery Management',
    },
    desc: {
      de: 'Lade- und Entladezyklen nach Tarifen, SOC-Grenzen und Haushaltslast automatisch regeln.',
      en: 'Automatically manage charge and discharge cycles based on tariffs, SoC limits, and household load.',
    },
    cardBackground: 'radial-gradient(circle at 80% 15%, rgba(16,185,129,0.38), transparent 46%), linear-gradient(145deg, rgba(59,130,246,0.32), rgba(15,23,42,0.95) 72%), linear-gradient(35deg, rgba(20,184,166,0.2), rgba(6,182,212,0.06))',
    technicalOverview: {
      de: 'Das Batteriemanagement nutzt ein hierarchisches EMS mit scheduler-basierter Vorplanung und sekundenschneller Echtzeitregelung. Es optimiert Ladefenster gegen Spot- und Netztarife, schützt Zellgesundheit über SOC-/C-Rate-Grenzen und glättet Lastspitzen im Hausanschluss.',
      en: 'Battery management uses a hierarchical EMS with scheduler-based pre-planning and sub-second real-time control. It optimizes charging windows against spot and grid tariffs, protects cell health via SoC and C-rate limits, and smooths peaks at the grid connection.',
    },
    technicalHighlights: {
      de: [
        'Mehrstufige Steuerung: Day-Ahead-Planung, Intraday-Reoptimierung und Fallback-Regler bei Kommunikationsausfall.',
        'SOC-Fenstermanagement mit Reserve für Backup-Betrieb, Peak-Shaving und EV-Ladeprioritäten.',
        'Tarif- und Lastsensitive Charge/Discharge-Entscheidung mit Wirkungsgrad- und Degradationskostenmodell.',
        'Sicherheitslogik für Temperatur, BMS-Status, Min-/Max-Leistung und netzseitige Exportgrenzen.',
      ],
      en: [
        'Multi-layer control with day-ahead planning, intraday re-optimization, and fallback control during communication loss.',
        'SoC window management with reserve for backup mode, peak shaving, and EV charging priorities.',
        'Tariff- and load-aware charge/discharge decisions with efficiency and degradation cost models.',
        'Safety logic for temperature, BMS status, min/max power, and grid-side export limits.',
      ],
    },
  },
  {
    slug: 'ev-v2h-v2g',
    icon: '🚗',
    title: {
      de: 'Electric Vehicle & Vehicle to Home/Grid',
      en: 'Electric Vehicle & Vehicle to Home/Grid',
    },
    desc: {
      de: 'Intelligentes Laden, bidirektionale Stromnutzung und Multi-EV-Profile (ab Pro).',
      en: 'Smart charging, bidirectional energy usage, and multi-EV profiles (from Pro).',
    },
    cardBackground: 'radial-gradient(circle at 18% 85%, rgba(129,140,248,0.35), transparent 48%), linear-gradient(140deg, rgba(6,182,212,0.3), rgba(15,23,42,0.95) 70%), linear-gradient(20deg, rgba(99,102,241,0.22), rgba(20,184,166,0.06))',
    technicalOverview: {
      de: 'Das EV-Modul orchestriert Ladeplanung, Abfahrtszeiten und bidirektionale Energieströme für V2H/V2G-fähige Fahrzeuge. Multi-EV-Profile und Connector-Prioritäten stellen sicher, dass Reichweite, Netzlast und Kosten gleichzeitig optimiert werden.',
      en: 'The EV module orchestrates charging plans, departure times, and bidirectional power flows for V2H/V2G-capable vehicles. Multi-EV profiles and connector priorities ensure range, grid load, and cost are optimized together.',
    },
    technicalHighlights: {
      de: [
        'Fahrzeug- und Wallbox-telemetrie zur Regelung von Ladeleistung, Ziel-SOC und Abfahrtsfenstern.',
        'Bidirektionale Strategie mit Netzpreis-, Last- und SOC-Abhängigkeit für V2H/V2G.',
        'Priorisierung bei mehreren EVs über Nutzerprofile, SLA und verfügbare Anschlussleistung.',
        'Fail-safe Verhalten bei Kommunikationsverlust (Safe Charge Mode mit konservativem SOC-Ziel).',
      ],
      en: [
        'Vehicle and charger telemetry to control charging power, target SoC, and departure windows.',
        'Bidirectional strategy for V2H/V2G based on grid price, load, and SoC conditions.',
        'Prioritization across multiple EVs using user profiles, SLA targets, and available connection power.',
        'Fail-safe behavior during communication loss with a conservative Safe Charge Mode target.',
      ],
    },
  },
  {
    slug: 'smart-home',
    icon: '🏠',
    title: {
      de: 'Smart Home',
      en: 'Smart Home',
    },
    desc: {
      de: 'Wärmepumpe, Waschmaschine & Co. automatisch in günstige Zeitfenster verschieben (ab Pro).',
      en: 'Shift heat pumps, washing machines, and more into cheaper time windows automatically (from Pro).',
    },
    cardBackground: 'radial-gradient(circle at 84% 78%, rgba(34,197,94,0.34), transparent 48%), linear-gradient(145deg, rgba(14,165,233,0.28), rgba(15,23,42,0.95) 74%), linear-gradient(40deg, rgba(74,222,128,0.2), rgba(6,182,212,0.07))',
    technicalOverview: {
      de: 'Smart Home Scheduling koordiniert flexible Verbraucher anhand von Tarif, PV-Erwartung und Komfortgrenzen. Das Modul verschiebt Lasten in günstige Fenster und hält harte Nebenbedingungen wie Temperaturhysterese, Laufzeit-Minima und Nutzerpräferenzen ein.',
      en: 'Smart home scheduling coordinates flexible loads based on tariffs, PV expectations, and comfort limits. The module shifts loads into cost-efficient windows while honoring hard constraints like temperature hysteresis, minimum runtimes, and user preferences.',
    },
    technicalHighlights: {
      de: [
        'Geräteklassen mit unterschiedlichen Constraints (thermisch, zyklisch, manuell priorisiert).',
        'Constraint-basierte Zeitfensteroptimierung mit Konfliktauflösung bei Leistungsengpässen.',
        'Kopplung mit PV- und Batterieprognose zur Maximierung von Eigenverbrauchsanteilen.',
        'Event-basierte Overrides für Sofortstart, Urlaubsmodus und Komfortschutzgrenzen.',
      ],
      en: [
        'Device classes with different constraints such as thermal, cyclic, and manually prioritized loads.',
        'Constraint-based time window optimization with conflict resolution during power bottlenecks.',
        'Tight coupling with PV and battery forecasts to maximize self-consumption.',
        'Event-based overrides for instant start, vacation mode, and comfort protection limits.',
      ],
    },
  },
  {
    slug: 'ki-empfehlung',
    icon: '🤖',
    title: {
      de: 'KI-Empfehlung',
      en: 'AI Recommendation',
    },
    desc: {
      de: 'Deep-Q-Network analysiert Live-Daten und gibt konkrete Handlungsempfehlungen (ab Pro).',
      en: 'A deep Q-network analyzes live data and provides concrete action recommendations (from Pro).',
    },
    cardBackground: 'radial-gradient(circle at 15% 20%, rgba(167,139,250,0.35), transparent 48%), linear-gradient(140deg, rgba(124,58,237,0.3), rgba(15,23,42,0.96) 72%), linear-gradient(24deg, rgba(99,102,241,0.22), rgba(6,182,212,0.05))',
    technicalOverview: {
      de: 'Die KI-Empfehlung bewertet Zustände aus Last, Erzeugung, Speicher und Tarif über ein Deep-Q-Network. Das Modell erzeugt priorisierte Aktionen mit erwarteter Kosten-/CO₂-Wirkung und liefert nachvollziehbare Begründungen für operative Entscheidungen.',
      en: 'The AI recommendation engine evaluates load, generation, storage, and tariff states with a deep Q-network. The model produces prioritized actions with expected cost and CO₂ impact and provides explainable reasoning for operational decisions.',
    },
    technicalHighlights: {
      de: [
        'Feature-Stack aus Echtzeit-Telemetrie, Wetter, historischen Lastmustern und Preiszeitreihen.',
        'Policy-Scoring mit Konfidenz und Gegenfaktanalyse für transparente Handlungsvorschläge.',
        'Online-Validierung gegen harte Sicherheits- und Komfortregeln vor Ausführung.',
        'Kontinuierliches Monitoring von Modellgüte, Drift-Indikatoren und Fallback-Policies.',
      ],
      en: [
        'Feature stack combining real-time telemetry, weather, historical load patterns, and price series.',
        'Policy scoring with confidence and counterfactual analysis for transparent recommendations.',
        'Online validation against hard safety and comfort rules before execution.',
        'Continuous monitoring of model quality, drift indicators, and fallback policies.',
      ],
    },
  },
  {
    slug: 'flottenmanagement',
    icon: '🏭',
    title: {
      de: 'Flottenmanagement',
      en: 'Fleet Management',
    },
    desc: {
      de: 'KI-Dispatch, Lastspitzen-Management, SLA-Alerting für gewerbliche Standorte (Business).',
      en: 'AI dispatch, peak-shaving, and SLA alerting for commercial sites (Business).',
    },
    cardBackground: 'radial-gradient(circle at 80% 18%, rgba(239,68,68,0.27), transparent 52%), linear-gradient(145deg, rgba(14,165,233,0.28), rgba(15,23,42,0.95) 70%), linear-gradient(30deg, rgba(251,146,60,0.18), rgba(6,182,212,0.06))',
    technicalOverview: {
      de: 'Flottenmanagement aggregiert viele Ladepunkte und Standorte zu einem zentralen Dispatch-Layer. Es optimiert Leistungslimits, Verfügbarkeitsziele und SLA-Vorgaben, um Lastspitzen zu vermeiden und operative Kosten über alle Assets hinweg zu minimieren.',
      en: 'Fleet management aggregates many chargers and sites into a central dispatch layer. It optimizes power limits, availability targets, and SLA requirements to avoid peaks and minimize operating cost across all assets.',
    },
    technicalHighlights: {
      de: [
        'Standortübergreifender Dispatch mit Leistungskorridoren pro Anschluss und Vertrag.',
        'SLA-Alerting für Verfügbarkeit, Ladefortschritt und Prioritätsfahrzeuge.',
        'Peak-Shaving inkl. Lastprognose und Grenzwertsteuerung auf Standort- und Flottenebene.',
        'API-fähige Integrationen für Backoffice, Ticketing und Energie-/Abrechnungsprozesse.',
      ],
      en: [
        'Cross-site dispatch with power corridors per connection and contract.',
        'SLA alerting for availability, charging progress, and priority vehicles.',
        'Peak shaving with load forecasts and limit control across site and fleet levels.',
        'API-ready integrations for back office, ticketing, and energy or billing workflows.',
      ],
    },
  },
];

const localizeApplication = (
  application: LocalizedApplicationItem,
  language: Language,
): ApplicationItem => ({
  slug: application.slug,
  icon: application.icon,
  cardBackground: application.cardBackground,
  title: application.title[language],
  desc: application.desc[language],
  technicalOverview: application.technicalOverview[language],
  technicalHighlights: application.technicalHighlights[language],
});

export const getApplications = (language: Language): ApplicationItem[] =>
  LOCALIZED_APPLICATIONS.map(application => localizeApplication(application, language));

export const getApplicationMap = (language: Language): Record<string, ApplicationItem> =>
  getApplications(language).reduce<Record<string, ApplicationItem>>((map, application) => {
    map[application.slug] = application;
    return map;
  }, {});

export const APPLICATIONS = getApplications('de');

export const APPLICATION_MAP: Record<string, ApplicationItem> = getApplicationMap('de');
