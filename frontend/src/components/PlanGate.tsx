import type { ReactNode } from 'react';
import { usePlan } from '../context/PlanContext';
import type { FeatureKey, PlanId } from '../config/featureFlags';

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

/**
 * Fires a custom DOM event so App.tsx can open the UpgradeModal.
 * This avoids prop-drilling an `openUpgradeModal` callback all the way down.
 */
function requestUpgrade(planId: PlanId) {
  window.dispatchEvent(
    new CustomEvent('wattai:open-upgrade', { detail: { planId } }),
  );
}

export default function PlanGate({
  feature,
  featureName,
  requiredPlan = 'pro',
  children,
  compact = false,
}: PlanGateProps) {
  const { hasFeature } = usePlan();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const planLabel = requiredPlan === 'business' ? 'Business' : 'Pro';
  const planColor = requiredPlan === 'business' ? '#a78bfa' : '#06b6d4';
  const planPrice = requiredPlan === 'business' ? '49 €/Standort/Mon.' : '19 €/Mon.';

  const handleUpgrade = () => requestUpgrade(requiredPlan);

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
    <div style={{ position:'relative' }}>
      {/* Upgrade banner */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10,
        background:`${planColor}10`, border:`1px solid ${planColor}30`, borderRadius:12, padding:'10px 16px', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:16 }}>⭐</span>
          <div>
            <span style={{ fontSize:12, fontWeight:700, color:planColor, letterSpacing:'0.1em', textTransform:'uppercase' }}>{planLabel}-Plan</span>
            <span style={{ fontSize:12, color:'rgba(248,250,252,0.45)', marginLeft:8 }}>– {featureName}</span>
          </div>
        </div>
        <button onClick={handleUpgrade} style={{
          background:`linear-gradient(90deg,${planColor},${planColor}cc)`, color:'#fff',
          border:'none', borderRadius:999, padding:'7px 18px', fontWeight:700, fontSize:12, cursor:'pointer',
        }}>Jetzt upgraden – {planPrice}</button>
      </div>
      {/* Content shown but visually disabled */}
      <div style={{ opacity:0.35, pointerEvents:'none', userSelect:'none', filter:'grayscale(0.4)' }} aria-hidden="true">
        {children}
      </div>
      {/* INVISIBLE plan-gate stubs so old CSS references don't break */}
      <div className="plan-gate" style={{display:'none'}}/>
      <div style={{display:'none'}}>
        <div className="plan-gate-inner">
          <p className="plan-gate-title">{featureName}</p>
          <p className="plan-gate-desc"></p>
          <div className="plan-gate-price" style={{ color: planColor }}>
            {planPrice}
          </div>
          <button
            className="plan-gate-cta"
            style={{ background: planColor }}
            onClick={handleUpgrade}
            aria-label={`${featureName} — ${planLabel}-Plan wählen`}
          >
            ⚡ {planLabel} wählen
          </button>
          {requiredPlan === 'business' && (
            <p className="plan-gate-hint">
              Oder erst auf{' '}
              <button
                className="plan-gate-link"
                onClick={() => requestUpgrade('pro')}
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
