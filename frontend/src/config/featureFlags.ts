// ─── Plan IDs ───────────────────────────────────────────────────────────────
// Three commercial tiers: Free B2C → Pro B2C → Business B2B
export type PlanId = 'free' | 'pro' | 'business';

// ─── Feature Keys ────────────────────────────────────────────────────────────
export type FeatureKey =
  // Free
  | 'dashboard.basic'
  | 'consumption.live'
  | 'ev.single_profile'
  // Pro B2C
  | 'smarthome.automation'
  | 'optimization.time_window'
  | 'forecast.advanced'
  | 'v2h_v2g.strategies'
  | 'ev.multi'
  | 'tariff.dynamic'
  | 'insights.advanced'
  // Business B2B
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
  subtitle: string;
  segment: 'b2c' | 'b2b';
  pricing: string;
  color: string;
  badgeColor: string;
  features: FeatureKey[];
};

export const PLAN_STORAGE_KEY = 'ems_plan';
export const FLEET_OVERRIDE_STORAGE_KEY = 'feature_fleet_tab';

export const SALES_UPGRADE_LINK =
  'mailto:kontakt@wattai.live?subject=Upgrade%20auf%20Business';

/**
 * Checkout-URLs per Plan.
 * In Produktion: echte Stripe Payment-Links hinterlegen.
 * Kann via Umgebungsvariablen überschrieben werden.
 */
export const CHECKOUT_URLS: Record<'pro' | 'business', string> = {
  pro:
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: Record<string, string> }).env
        ?.VITE_PRO_CHECKOUT_URL) ||
    'mailto:kontakt@wattai.live?subject=WattAI%20Pro%20Upgrade%20(19%20%E2%82%AC%2FMon.)',
  business:
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: Record<string, string> }).env
        ?.VITE_BUSINESS_CHECKOUT_URL) ||
    'mailto:kontakt@wattai.live?subject=WattAI%20Business%20Upgrade%20(49%20%E2%82%AC%2FStandort)',
};

// ─── Plan Definitions ────────────────────────────────────────────────────────
export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    title: 'Free',
    subtitle: 'B2C · Kostenlos',
    segment: 'b2c',
    pricing: 'Kostenlos',
    color: '#67e8f9',
    badgeColor: 'rgba(103,232,249,0.18)',
    features: ['dashboard.basic', 'consumption.live', 'ev.single_profile'],
  },
  pro: {
    id: 'pro',
    title: 'Pro',
    subtitle: 'B2C · 19 €/Monat',
    segment: 'b2c',
    pricing: '19 €/Monat',
    color: '#06b6d4',
    badgeColor: 'rgba(6,182,212,0.22)',
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
  business: {
    id: 'business',
    title: 'Business',
    subtitle: 'B2B · 49 €/Standort/Monat',
    segment: 'b2b',
    pricing: '49 €/Standort/Monat',
    color: '#a78bfa',
    badgeColor: 'rgba(167,139,250,0.22)',
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
  basis: 'free',
  pro: 'pro',
  plus: 'pro',
  business: 'business',
  b2b: 'business',
  fleet: 'business',
  fleet_starter: 'business',
  fleet_pro: 'business',
  enterprise: 'business',
};

export const COMMERCIAL_MODEL = {
  b2c: [
    {
      name: 'Free',
      offer: 'Basis-Visualisierung, Live-Verbrauch, 1 EV-Profil',
    },
    {
      name: 'Pro',
      offer:
        'Smart-Home-Automationen, KI-Optimierung, V2H/V2G-Strategien, Multi-EV, dynamische Tarife',
      price: '19 €/Monat',
    },
  ],
  b2b: [
    {
      name: 'Business',
      offer:
        'Flottenmanagement, KI-Dispatch, Lastspitzen, API, SSO, Compliance-Reporting',
      price: '49 €/Standort/Monat',
    },
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
