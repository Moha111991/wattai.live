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
export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlan must be used inside <PlanProvider>');
  }
  return ctx;
}
