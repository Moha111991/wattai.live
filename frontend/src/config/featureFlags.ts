export type PlanId =
  | 'free'
  | 'plus'
  | 'pro'
  | 'fleet_starter'
  | 'fleet_pro'
  | 'enterprise';

export type FeatureKey =
  | 'dashboard.basic'
  | 'consumption.live'
  | 'ev.single_profile'
  | 'smarthome.automation'
  | 'optimization.time_window'
  | 'forecast.advanced'
  | 'v2h_v2g.strategies'
  | 'ev.multi'
  | 'tariff.dynamic'
  | 'insights.advanced'
  | 'fleet.tab'
  | 'fleet.monitoring'
  | 'fleet.dispatch_ai'
  | 'fleet.peak_shaving'
  | 'fleet.sla_alerting'
  | 'enterprise.api'
  | 'enterprise.sso'
  | 'enterprise.multitenancy'
  | 'enterprise.compliance_reporting'
  | 'enterprise.dedicated_support';

export type PlanDefinition = {
  id: PlanId;
  title: string;
  segment: 'b2c' | 'b2b';
  pricing: string;
  features: FeatureKey[];
};

export const PLAN_STORAGE_KEY = 'ems_plan';
export const FLEET_OVERRIDE_STORAGE_KEY = 'feature_fleet_tab';

export const SALES_UPGRADE_LINK =
  'mailto:sales@loopiq.energy?subject=Upgrade%20auf%20Flottenmanagement';

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    title: 'Free',
    segment: 'b2c',
    pricing: 'Basis',
    features: ['dashboard.basic', 'consumption.live', 'ev.single_profile'],
  },
  plus: {
    id: 'plus',
    title: 'Plus',
    segment: 'b2c',
    pricing: '7–12 €/Monat',
    features: [
      'dashboard.basic',
      'consumption.live',
      'ev.single_profile',
      'smarthome.automation',
      'optimization.time_window',
      'forecast.advanced',
    ],
  },
  pro: {
    id: 'pro',
    title: 'Pro',
    segment: 'b2c',
    pricing: '15–29 €/Monat',
    features: [
      'dashboard.basic',
      'consumption.live',
      'ev.single_profile',
      'smarthome.automation',
      'optimization.time_window',
      'forecast.advanced',
      'v2h_v2g.strategies',
      'ev.multi',
      'tariff.dynamic',
      'insights.advanced',
    ],
  },
  fleet_starter: {
    id: 'fleet_starter',
    title: 'Fleet Starter',
    segment: 'b2b',
    pricing: 'pro Standort / Monat',
    features: [
      'fleet.tab',
      'fleet.monitoring',
      'optimization.time_window',
      'tariff.dynamic',
    ],
  },
  fleet_pro: {
    id: 'fleet_pro',
    title: 'Fleet Pro',
    segment: 'b2b',
    pricing: 'pro Fahrzeug / Monat',
    features: [
      'fleet.tab',
      'fleet.monitoring',
      'fleet.dispatch_ai',
      'fleet.peak_shaving',
      'fleet.sla_alerting',
      'tariff.dynamic',
      'insights.advanced',
    ],
  },
  enterprise: {
    id: 'enterprise',
    title: 'Enterprise',
    segment: 'b2b',
    pricing: 'individuell',
    features: [
      'fleet.tab',
      'fleet.monitoring',
      'fleet.dispatch_ai',
      'fleet.peak_shaving',
      'fleet.sla_alerting',
      'enterprise.api',
      'enterprise.sso',
      'enterprise.multitenancy',
      'enterprise.compliance_reporting',
      'enterprise.dedicated_support',
    ],
  },
};

const PLAN_ALIASES: Record<string, PlanId> = {
  free: 'free',
  plus: 'plus',
  pro: 'pro',
  b2b: 'fleet_starter',
  fleet: 'fleet_starter',
  fleet_starter: 'fleet_starter',
  fleetstarter: 'fleet_starter',
  fleet_pro: 'fleet_pro',
  fleetpro: 'fleet_pro',
  enterprise: 'enterprise',
};

export const COMMERCIAL_MODEL = {
  b2c: [
    {
      name: 'Free',
      offer: 'Basis-Visualisierung, Live-Verbrauch, 1 EV-Profil',
    },
    {
      name: 'Plus',
      offer:
        'Smart-Home-Automationen, Zeitfenster-Optimierung, bessere Prognosen',
      price: '7–12 €/Monat',
    },
    {
      name: 'Pro',
      offer:
        'V2H/V2G-Strategien, Multi-EV, dynamische Tarife, erweiterte Insights',
      price: '15–29 €/Monat',
    },
  ],
  b2b: [
    {
      name: 'Fleet Starter',
      offer: 'Monitoring + einfache Lade-/Lastregeln',
      price: 'pro Standort / Monat',
    },
    {
      name: 'Fleet Pro',
      offer: 'KI-Dispatch, Lastspitzen-Management, SLA/Alerting',
      price: 'pro Fahrzeug / Monat',
    },
    {
      name: 'Enterprise',
      offer:
        'API, SSO, Mandantenfähigkeit, Compliance-/Audit-Reporting, dedizierter Support',
    },
  ],
} as const;

export const GTM_DISTRIBUTION = {
  b2c: [
    'App-Store',
    'Energieversorger-Kooperationen',
    'Wallbox-Bundles',
  ],
  b2b: [
    'Partnerkanal (Installateure/OEMs)',
    'Direkte Pilotprojekte mit 8–12 Wochen ROI-Nachweis',
  ],
  strategy: [
    'Land-and-expand: Erst Haushalt/Standort, dann Upgrade auf Fleet/Enterprise-Module',
  ],
} as const;

export type ResolvedFeatureFlags = {
  planId: PlanId;
  plan: PlanDefinition;
  enabledFeatures: Set<FeatureKey>;
  showFleetTab: boolean;
  fleetUnlocked: boolean;
};

export function normalizePlan(rawPlan: string | null | undefined): PlanId {
  if (!rawPlan) {
    return 'free';
  }
  const key = rawPlan.trim().toLowerCase();
  return PLAN_ALIASES[key] ?? 'free';
}

export function getStoredPlan(): PlanId {
  if (typeof window === 'undefined') {
    return 'free';
  }
  return normalizePlan(window.localStorage.getItem(PLAN_STORAGE_KEY));
}

export function resolveFeatureFlags(): ResolvedFeatureFlags {
  const planId = getStoredPlan();
  const plan = PLAN_DEFINITIONS[planId];
  const enabledFeatures = new Set<FeatureKey>(plan.features);

  const envFleetTab = import.meta.env.VITE_ENABLE_FLEET_TAB === 'true';
  const localFleetOverride =
    typeof window !== 'undefined' &&
    window.localStorage.getItem(FLEET_OVERRIDE_STORAGE_KEY) === 'true';

  const fleetUnlocked =
    enabledFeatures.has('fleet.tab') || envFleetTab || localFleetOverride;

  return {
    planId,
    plan,
    enabledFeatures,
    showFleetTab: fleetUnlocked,
    fleetUnlocked,
  };
}
