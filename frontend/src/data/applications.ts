export type ApplicationItem = {
  slug: string;
  icon: string;
  title: string;
  desc: string;
  cardBackground: string;
  technicalOverview: string;
  technicalHighlights: string[];
};

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

export const APPLICATION_MAP: Record<string, ApplicationItem> = APPLICATIONS.reduce<Record<string, ApplicationItem>>(
  (map, application) => {
    map[application.slug] = application;
    return map;
  },
  {},
);
