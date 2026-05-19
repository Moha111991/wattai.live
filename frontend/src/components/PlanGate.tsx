import type { ReactNode } from 'react';
import { usePlan } from '../context/PlanContext';
import type { FeatureKey } from '../config/featureFlags';

type PlanGateProps = {
  /** The feature that must be unlocked to see children */
  feature: FeatureKey;
  /** Human-readable name of the locked feature */
  featureName: string;
  /** Which plan unlocks this feature */
  requiredPlan?: 'pro' | 'business';
  children: ReactNode;
  /** Optional: render a compact inline lock badge instead of full overlay */
  compact?: boolean;
};

export default function PlanGate({
  feature,
  featureName,
  requiredPlan = 'pro',
  children,
  compact = false,
}: PlanGateProps) {
  const { hasFeature, setPlan, planId } = usePlan();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const planLabel = requiredPlan === 'business' ? 'Business' : 'Pro';
  const planColor = requiredPlan === 'business' ? '#a78bfa' : '#06b6d4';
  const planPrice = requiredPlan === 'business' ? '49 €/Standort/Mon.' : '19 €/Mon.';

  const handleUpgrade = () => {
    // Immediately demo-switch the plan (replace with real checkout later)
    setPlan(requiredPlan);
  };

  if (compact) {
    return (
      <span
        className="plan-gate-badge"
        title={`${featureName} — ab ${planLabel}`}
        style={{ color: planColor, borderColor: planColor }}
        onClick={handleUpgrade}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleUpgrade()}
        aria-label={`${featureName} freischalten — ${planLabel} erforderlich`}
      >
        🔒 {planLabel}
      </span>
    );
  }

  return (
    <div className="plan-gate">
      {/* Blurred preview of the underlying content */}
      <div className="plan-gate-blur" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="plan-gate-overlay" role="region" aria-label={`Gesperrte Funktion: ${featureName}`}>
        <div className="plan-gate-inner">
          <span className="plan-gate-lock" aria-hidden="true">🔒</span>
          <p className="plan-gate-title">{featureName}</p>
          <p className="plan-gate-desc">
            Diese Funktion ist ab dem{' '}
            <strong style={{ color: planColor }}>{planLabel}-Plan</strong>{' '}
            verfügbar.
          </p>
          <div className="plan-gate-price" style={{ color: planColor }}>
            {planPrice}
          </div>
          <button
            className="plan-gate-cta"
            style={{ background: planColor }}
            onClick={handleUpgrade}
            aria-label={`${featureName} jetzt freischalten`}
          >
            ⚡ {planLabel} freischalten
          </button>
          {planId === 'free' && requiredPlan === 'business' && (
            <p className="plan-gate-hint">
              Oder erst auf{' '}
              <button
                className="plan-gate-link"
                onClick={() => setPlan('pro')}
              >
                Pro (19 €/Mon.)
              </button>{' '}
              upgraden.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
