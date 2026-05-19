import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  PLAN_DEFINITIONS,
  PLAN_STORAGE_KEY,
  getStoredPlan,
  type FeatureKey,
  type PlanDefinition,
  type PlanId,
} from '../config/featureFlags';

// ─── Context Shape ────────────────────────────────────────────────────────────
export type PlanContextValue = {
  planId: PlanId;
  plan: PlanDefinition;
  hasFeature: (key: FeatureKey) => boolean;
  fleetUnlocked: boolean;
  setPlan: (id: PlanId) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PlanProvider({ children }: { children: ReactNode }) {
  const [planId, setPlanId] = useState<PlanId>(getStoredPlan);

  const setPlan = useCallback((id: PlanId) => {
    setPlanId(id);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLAN_STORAGE_KEY, id);
    }
  }, []);

  // Re-sync if localStorage changes externally (e.g. other tab)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === PLAN_STORAGE_KEY) {
        setPlanId(getStoredPlan());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  /**
   * Activate a plan after successful payment.
   * Called by the payment-callback route (e.g. ?plan=pro&payment=success).
   * NOT called directly on button clicks — payment must happen first.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const planParam = params.get('plan') as PlanId | null;
    if (paymentStatus === 'success' && planParam && PLAN_DEFINITIONS[planParam]) {
      setPlan(planParam);
      // Clean up the URL so the param isn't applied again on reload
      const clean = new URL(window.location.href);
      clean.searchParams.delete('payment');
      clean.searchParams.delete('plan');
      window.history.replaceState({}, '', clean.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = PLAN_DEFINITIONS[planId];
  const enabledFeatures = useMemo(() => new Set(plan.features), [plan]);

  const hasFeature = useCallback(
    (key: FeatureKey) => enabledFeatures.has(key),
    [enabledFeatures],
  );

  const fleetUnlocked = enabledFeatures.has('fleet.tab');

  const value = useMemo<PlanContextValue>(
    () => ({ planId, plan, hasFeature, fleetUnlocked, setPlan }),
    [planId, plan, hasFeature, fleetUnlocked, setPlan],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlan must be used inside <PlanProvider>');
  }
  return ctx;
}
