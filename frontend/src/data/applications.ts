export type ApplicationItem = {
  slug: string;
  icon: string;
  title: string;
  desc: string;
  cardBackground: string;
  technicalOverview: string;
  technicalHighlights: string[];
};

type SupportedLanguage = 'de' | 'en';

export const APPLICATIONS: ApplicationItem[] = [
  {
    slug: 'pv-optimierung',
    icon: '☀️',
    title: 'PV-Optimierung',
    desc: 'Echtzeit-Ertragsprognosen, Eigenverbrauchsmaximierung und Netzeinspeisung intelligent steuern.',
    cardBackground: 'radial-gradient(circle at 20% 15%, rgba(251,191,36,0.45), transparent 42%), linear-gradient(140deg, rgba(14,165,233,0.38), rgba(15,23,42,0.95) 70%), linear-gradient(60deg, rgba(250,204,21,0.2), rgba(6,182,212,0.08))',
    technicalOverview: 'Die PV-Optimierung kombiniert Wetterprognosen, Inverter-Telemetrie und Lastprofile zu einem rollierenden 15-Minuten-Dispatch. Das System priorisiert Eigenverbrauch, minimiert Peak-Import und steuert Netzeinspeisung unter Berücksichtigung dynamischer Tarife und Netzrestriktionen.',
    technicalHighlights: [
      'Forecast-Pipeline mit Kurzfrist-Nowcasting (Cloud-Cover) und Tagesprognose für AC/DC-Erzeugung.',
      'Inverter- und Smart-Meter-Feedback in Echtzeit zur Korrektur von Prognosefehlern.',
      'Regelstrategie mit Prioritätskaskade: Haushaltslast → Speicherladung → EV-Ladung → Einspeisung.',
      'Netzkonforme Einspeiseregelung (Ramp-Rate, Export-Limits, tarifabhängige Dispatch-Strategie).',
    ],
  },
  {
    slug: 'batteriemanagement',
    icon: '🔋',
    title: 'Batteriemanagement',
    desc: 'Lade- und Entladezyklen nach Tarifen, SOC-Grenzen und Haushaltslast automatisch regeln.',
    cardBackground: 'radial-gradient(circle at 80% 15%, rgba(16,185,129,0.38), transparent 46%), linear-gradient(145deg, rgba(59,130,246,0.32), rgba(15,23,42,0.95) 72%), linear-gradient(35deg, rgba(20,184,166,0.2), rgba(6,182,212,0.06))',
    technicalOverview: 'Das Batteriemanagement nutzt ein hierarchisches EMS mit scheduler-basierter Vorplanung und sekundenschneller Echtzeitregelung. Es optimiert Ladefenster gegen Spot- und Netztarife, schützt Zellgesundheit über SOC-/C-Rate-Grenzen und glättet Lastspitzen im Hausanschluss.',
    technicalHighlights: [
      'Mehrstufige Steuerung: Day-Ahead-Planung, Intraday-Reoptimierung und Fallback-Regler bei Kommunikationsausfall.',
      'SOC-Fenstermanagement mit Reserve für Backup-Betrieb, Peak-Shaving und EV-Ladeprioritäten.',
      'Tarif- und Lastsensitive Charge/Discharge-Entscheidung mit Wirkungsgrad- und Degradationskostenmodell.',
      'Sicherheitslogik für Temperatur, BMS-Status, Min-/Max-Leistung und netzseitige Exportgrenzen.',
    ],
  },
  {
    slug: 'ev-v2h-v2g',
    icon: '🚗',
    title: 'Electric Vehicle & Vehicle to Home/Grid',
    desc: 'Intelligentes Laden, bidirektionale Stromnutzung und Multi-EV-Profile (ab Pro).',
    cardBackground: 'radial-gradient(circle at 18% 85%, rgba(129,140,248,0.35), transparent 48%), linear-gradient(140deg, rgba(6,182,212,0.3), rgba(15,23,42,0.95) 70%), linear-gradient(20deg, rgba(99,102,241,0.22), rgba(20,184,166,0.06))',
    technicalOverview: 'Das EV-Modul orchestriert Ladeplanung, Abfahrtszeiten und bidirektionale Energieströme für V2H/V2G-fähige Fahrzeuge. Multi-EV-Profile und Connector-Prioritäten stellen sicher, dass Reichweite, Netzlast und Kosten gleichzeitig optimiert werden.',
    technicalHighlights: [
      'Fahrzeug- und Wallbox-telemetrie zur Regelung von Ladeleistung, Ziel-SOC und Abfahrtsfenstern.',
      'Bidirektionale Strategie mit Netzpreis-, Last- und SOC-Abhängigkeit für V2H/V2G.',
      'Priorisierung bei mehreren EVs über Nutzerprofile, SLA und verfügbare Anschlussleistung.',
      'Fail-safe Verhalten bei Kommunikationsverlust (Safe Charge Mode mit konservativem SOC-Ziel).',
    ],
  },
  {
    slug: 'smart-home',
    icon: '🏠',
    title: 'Smart Home',
    desc: 'Wärmepumpe, Waschmaschine & Co. automatisch in günstige Zeitfenster verschieben (ab Pro).',
    cardBackground: 'radial-gradient(circle at 84% 78%, rgba(34,197,94,0.34), transparent 48%), linear-gradient(145deg, rgba(14,165,233,0.28), rgba(15,23,42,0.95) 74%), linear-gradient(40deg, rgba(74,222,128,0.2), rgba(6,182,212,0.07))',
    technicalOverview: 'Smart Home Scheduling koordiniert flexible Verbraucher anhand von Tarif, PV-Erwartung und Komfortgrenzen. Das Modul verschiebt Lasten in günstige Fenster und hält harte Nebenbedingungen wie Temperaturhysterese, Laufzeit-Minima und Nutzerpräferenzen ein.',
    technicalHighlights: [
      'Geräteklassen mit unterschiedlichen Constraints (thermisch, zyklisch, manuell priorisiert).',
      'Constraint-basierte Zeitfensteroptimierung mit Konfliktauflösung bei Leistungsengpässen.',
      'Kopplung mit PV- und Batterieprognose zur Maximierung von Eigenverbrauchsanteilen.',
      'Event-basierte Overrides für Sofortstart, Urlaubsmodus und Komfortschutzgrenzen.',
    ],
  },
  {
    slug: 'ki-empfehlung',
    icon: '🤖',
    title: 'KI-Empfehlung',
    desc: 'Deep-Q-Network analysiert Live-Daten und gibt konkrete Handlungsempfehlungen (ab Pro).',
    cardBackground: 'radial-gradient(circle at 15% 20%, rgba(167,139,250,0.35), transparent 48%), linear-gradient(140deg, rgba(124,58,237,0.3), rgba(15,23,42,0.96) 72%), linear-gradient(24deg, rgba(99,102,241,0.22), rgba(6,182,212,0.05))',
    technicalOverview: 'Die KI-Empfehlung bewertet Zustände aus Last, Erzeugung, Speicher und Tarif über ein Deep-Q-Network. Das Modell erzeugt priorisierte Aktionen mit erwarteter Kosten-/CO₂-Wirkung und liefert nachvollziehbare Begründungen für operative Entscheidungen.',
    technicalHighlights: [
      'Feature-Stack aus Echtzeit-Telemetrie, Wetter, historischen Lastmustern und Preiszeitreihen.',
      'Policy-Scoring mit Konfidenz und Gegenfaktanalyse für transparente Handlungsvorschläge.',
      'Online-Validierung gegen harte Sicherheits- und Komfortregeln vor Ausführung.',
      'Kontinuierliches Monitoring von Modellgüte, Drift-Indikatoren und Fallback-Policies.',
    ],
  },
  {
    slug: 'flottenmanagement',
    icon: '🏭',
    title: 'Flottenmanagement',
    desc: 'KI-Dispatch, Lastspitzen-Management, SLA-Alerting für gewerbliche Standorte (Business).',
    cardBackground: 'radial-gradient(circle at 80% 18%, rgba(239,68,68,0.27), transparent 52%), linear-gradient(145deg, rgba(14,165,233,0.28), rgba(15,23,42,0.95) 70%), linear-gradient(30deg, rgba(251,146,60,0.18), rgba(6,182,212,0.06))',
    technicalOverview: 'Flottenmanagement aggregiert viele Ladepunkte und Standorte zu einem zentralen Dispatch-Layer. Es optimiert Leistungslimits, Verfügbarkeitsziele und SLA-Vorgaben, um Lastspitzen zu vermeiden und operative Kosten über alle Assets hinweg zu minimieren.',
    technicalHighlights: [
      'Standortübergreifender Dispatch mit Leistungskorridoren pro Anschluss und Vertrag.',
      'SLA-Alerting für Verfügbarkeit, Ladefortschritt und Prioritätsfahrzeuge.',
      'Peak-Shaving inkl. Lastprognose und Grenzwertsteuerung auf Standort- und Flottenebene.',
      'API-fähige Integrationen für Backoffice, Ticketing und Energie-/Abrechnungsprozesse.',
    ],
  },
];

const APPLICATION_TRANSLATIONS_EN: Record<string, Pick<ApplicationItem, 'title' | 'desc' | 'technicalOverview' | 'technicalHighlights'>> = {
  'pv-optimierung': {
    title: 'PV Optimization',
    desc: 'Intelligently control real-time yield forecasts, self-consumption maximization, and grid feed-in.',
    technicalOverview: 'PV optimization combines weather forecasts, inverter telemetry, and load profiles into a rolling 15-minute dispatch. The system prioritizes self-consumption, minimizes peak imports, and controls feed-in under dynamic tariff and grid constraints.',
    technicalHighlights: [
      'Forecast pipeline with short-term nowcasting (cloud cover) and day-ahead AC/DC generation prediction.',
      'Real-time inverter and smart meter feedback to correct forecast errors.',
      'Priority cascade control: household load → battery charging → EV charging → grid feed-in.',
      'Grid-compliant feed-in control (ramp-rate, export limits, tariff-aware dispatch strategy).',
    ],
  },
  batteriemanagement: {
    title: 'Battery Management',
    desc: 'Automatically optimize charging and discharging cycles by tariff, SOC limits, and household load.',
    technicalOverview: 'Battery management uses a hierarchical EMS with scheduler-based planning and sub-second real-time control. It optimizes charge windows against spot/grid tariffs, protects cell health with SOC/C-rate limits, and smooths peak demand at the grid connection.',
    technicalHighlights: [
      'Multi-stage control: day-ahead planning, intraday re-optimization, and fallback controller on communication failure.',
      'SOC window management with reserve for backup operation, peak shaving, and EV charging priorities.',
      'Tariff- and load-sensitive charge/discharge decisions with efficiency and degradation cost modeling.',
      'Safety logic for temperature, BMS status, min/max power, and grid-side export limits.',
    ],
  },
  'ev-v2h-v2g': {
    title: 'Electric Vehicle & Vehicle-to-Home/Grid',
    desc: 'Intelligent charging, bidirectional energy usage, and multi-EV profiles (from Pro).',
    technicalOverview: 'The EV module orchestrates charging plans, departure windows, and bidirectional energy flows for V2H/V2G capable vehicles. Multi-EV profiles and connector priorities optimize range, grid load, and costs at the same time.',
    technicalHighlights: [
      'Vehicle and wallbox telemetry for charging power control, target SOC, and departure windows.',
      'Bidirectional strategy with grid price, load, and SOC dependent V2H/V2G decisions.',
      'Multi-EV prioritization via user profiles, SLA targets, and available connection power.',
      'Fail-safe behavior on communication loss (Safe Charge Mode with conservative SOC target).',
    ],
  },
  'smart-home': {
    title: 'Smart Home',
    desc: 'Automatically shift heat pump, washing machine, and more into low-cost time windows (from Pro).',
    technicalOverview: 'Smart home scheduling coordinates flexible loads based on tariff, PV forecast, and comfort constraints. It shifts loads into favorable windows while respecting hard constraints like hysteresis, minimum runtimes, and user preferences.',
    technicalHighlights: [
      'Device classes with different constraints (thermal, cyclic, manually prioritized).',
      'Constraint-based time-window optimization with conflict resolution under power limits.',
      'Coupling with PV and battery forecasts to maximize self-consumption.',
      'Event-based overrides for instant start, vacation mode, and comfort guardrails.',
    ],
  },
  'ki-empfehlung': {
    title: 'AI Recommendation',
    desc: 'Deep-Q-Network analyzes live data and provides concrete action recommendations (from Pro).',
    technicalOverview: 'AI recommendation evaluates states from load, generation, storage, and tariffs using a Deep-Q-Network. The model outputs prioritized actions with expected cost/CO₂ impact and transparent reasoning for operational decisions.',
    technicalHighlights: [
      'Feature stack from real-time telemetry, weather, historical load patterns, and price series.',
      'Policy scoring with confidence and counterfactual analysis for transparent recommendations.',
      'Online validation against strict safety and comfort constraints before execution.',
      'Continuous monitoring of model quality, drift indicators, and fallback policies.',
    ],
  },
  flottenmanagement: {
    title: 'Fleet Management',
    desc: 'AI dispatching, peak-load management, and SLA alerting for commercial sites (Business).',
    technicalOverview: 'Fleet management aggregates many charge points and sites into a central dispatch layer. It optimizes power limits, availability targets, and SLA constraints to avoid peak loads and reduce operational cost across all assets.',
    technicalHighlights: [
      'Cross-site dispatch with power corridors per connection and contract.',
      'SLA alerting for availability, charging progress, and priority vehicles.',
      'Peak shaving with load forecasting and limit control at site and fleet level.',
      'API-ready integrations for back office, ticketing, and energy/billing workflows.',
    ],
  },
};

const localizeApplication = (application: ApplicationItem, language: SupportedLanguage): ApplicationItem => {
  if (language !== 'en') {
    return application;
  }
  const translated = APPLICATION_TRANSLATIONS_EN[application.slug];
  return translated ? { ...application, ...translated } : application;
};

export const getLocalizedApplications = (language: SupportedLanguage): ApplicationItem[] =>
  APPLICATIONS.map((application) => localizeApplication(application, language));

export const getLocalizedApplicationBySlug = (
  slug: string,
  language: SupportedLanguage,
): ApplicationItem | undefined => {
  const base = APPLICATION_MAP[slug];
  return base ? localizeApplication(base, language) : undefined;
};

export const APPLICATION_MAP: Record<string, ApplicationItem> = APPLICATIONS.reduce<Record<string, ApplicationItem>>(
  (map, application) => {
    map[application.slug] = application;
    return map;
  },
  {},
);
