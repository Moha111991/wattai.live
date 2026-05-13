import { useEffect, useId, useRef } from 'react';
import { SALES_UPGRADE_LINK } from '../config/featureFlags';

type UpgradeModalProps = {
  open: boolean;
  currentPlan: string;
  onClose: () => void;
};

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    badge: null,
    price: null,
    priceNote: 'Kostenlos',
    color: '#67e8f9',
    borderColor: 'rgba(103,232,249,0.25)',
    bg: 'rgba(15,23,42,0.7)',
    recommended: false,
    features: [
      '📊 Live-Energieverbrauch & PV-Ertrag',
      '🔋 Basis-Speicher­visualisierung',
      '🚗 1 EV-Profil',
      '📱 Mobile App (iOS & Android)',
      '⚡ Echtzeit-Energiefluss-Anzeige',
    ],
    missing: [
      'Smart-Home-Automatisierungen',
      'KI-Ladeoptimierung',
      'V2H / V2G-Strategien',
      'Multi-EV & Flottenmanagement',
    ],
    cta: 'Aktueller Plan',
    ctaDisabled: true,
  },
  {
    id: 'pro',
    label: 'Pro',
    badge: '⭐ Empfohlen',
    price: '19',
    priceNote: '€ / Monat',
    color: '#06b6d4',
    borderColor: 'rgba(6,182,212,0.6)',
    bg: 'linear-gradient(160deg, rgba(6,182,212,0.12) 0%, rgba(14,165,233,0.08) 100%)',
    recommended: true,
    features: [
      '✅ Alles aus Free',
      '🤖 KI-Ladeoptimierung & Zeitfenster',
      '🏠 Smart-Home-Automatisierungen',
      '🔮 Verbrauchs- & PV-Prognosen',
      '⚡ Dynamische Tarifintegration (Tibber etc.)',
      '🔋 V2H / V2G-Strategien',
      '🚗 Multi-EV (bis zu 3 Fahrzeuge)',
      '📈 Erweiterte Insights & Berichte',
    ],
    missing: [],
    cta: 'Jetzt upgraden',
    ctaDisabled: false,
  },
  {
    id: 'business',
    label: 'Business',
    badge: 'B2B',
    price: '49',
    priceNote: '€ / Standort / Monat',
    color: '#a78bfa',
    borderColor: 'rgba(167,139,250,0.4)',
    bg: 'linear-gradient(160deg, rgba(139,92,246,0.10) 0%, rgba(167,139,250,0.06) 100%)',
    recommended: false,
    features: [
      '✅ Alles aus Pro',
      '🏭 Flottenmanagement (unbegrenzt EVs)',
      '📡 KI-Dispatch & Lastspitzen-Management',
      '🔗 API-Zugang & Webhooks',
      '🔒 SSO & Mandantenfähigkeit',
      '📋 Compliance- & Audit-Reporting',
      '🛠 SLA, Alerting & dedizierter Support',
      '🤝 OEM- & Installateurkanal',
    ],
    missing: [],
    cta: 'Kontakt aufnehmen',
    ctaDisabled: false,
  },
];

export default function UpgradeModal({
  open,
  currentPlan,
  onClose,
}: UpgradeModalProps) {
  const titleId = useId();
  const keyboardHintId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = () => {
    if (!dialogRef.current) return [];
    const selectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(selectors)).filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true'
    );
  };

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements();
      if (focusable.length === 0) { e.preventDefault(); dialogRef.current?.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first || !dialogRef.current?.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (!active || active === last || !dialogRef.current?.contains(active)) {
        e.preventDefault(); first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); previouslyFocusedRef.current?.focus(); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={keyboardHintId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1000px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: 20,
          background: 'linear-gradient(160deg, #0b1220 0%, #0f172a 100%)',
          border: '1px solid rgba(103,232,249,0.18)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
          padding: '28px 24px 24px',
          color: '#e2e8f0',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>⚡</span>
              <h2 id={titleId} style={{ margin: 0, fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, color: '#f1f5f9' }}>
                WattAI Tarife
              </h2>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
              Aktueller Plan: <span style={{ color: '#67e8f9', fontWeight: 600 }}>{currentPlan}</span>
            </p>
            <p id={keyboardHintId} style={{ margin: '4px 0 0', color: '#475569', fontSize: 11 }}>
              Tab zum Navigieren · Escape zum Schließen
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            style={{
              border: '1px solid rgba(148,163,184,0.25)',
              borderRadius: 10,
              background: 'rgba(15,23,42,0.6)',
              color: '#94a3b8',
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            ✕ Schließen
          </button>
        </div>

        {/* Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan.toLowerCase() === plan.label.toLowerCase();
            return (
              <div
                key={plan.id}
                style={{
                  position: 'relative',
                  border: `1.5px solid ${plan.recommended ? plan.borderColor : 'rgba(148,163,184,0.15)'}`,
                  background: plan.bg,
                  borderRadius: 16,
                  padding: '20px 18px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.recommended
                    ? `0 0 40px rgba(6,182,212,0.15), inset 0 1px 0 rgba(103,232,249,0.08)`
                    : 'none',
                  transition: 'transform 0.2s',
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: plan.recommended
                      ? 'linear-gradient(90deg,#0ea5e9,#06b6d4)'
                      : 'rgba(167,139,250,0.25)',
                    border: `1px solid ${plan.recommended ? '#67e8f9' : 'rgba(167,139,250,0.4)'}`,
                    borderRadius: 999,
                    padding: '2px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: plan.recommended ? '#fff' : '#c4b5fd',
                    whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan Name */}
                <div style={{ marginBottom: 4, marginTop: plan.badge ? 4 : 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {plan.id === 'business' ? 'B2B' : 'B2C'}
                  </span>
                  <h3 style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>
                    {plan.label}
                  </h3>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 16, minHeight: 44, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  {plan.price ? (
                    <>
                      <span style={{ fontSize: 36, fontWeight: 800, color: plan.color, lineHeight: 1 }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>{plan.priceNote}</span>
                    </>
                  ) : (
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}>{plan.priceNote}</span>
                  )}
                </div>

                {/* Features */}
                <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>{f.slice(0, 2)}</span>
                      <span>{f.slice(2)}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>✗</span>
                      <span style={{ textDecoration: 'line-through' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.ctaDisabled || isCurrent ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '0.55rem',
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(15,23,42,0.5)',
                    color: '#64748b',
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {isCurrent ? '✓ Dein aktueller Plan' : plan.cta}
                  </div>
                ) : (
                  <a
                    href={SALES_UPGRADE_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'block',
                      padding: '0.6rem',
                      borderRadius: 10,
                      border: `1px solid ${plan.color}`,
                      background: plan.recommended
                        ? 'linear-gradient(90deg,#0ea5e9,#06b6d4)'
                        : 'transparent',
                      color: plan.recommended ? '#fff' : plan.color,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: plan.recommended ? `0 4px 20px rgba(6,182,212,0.3)` : 'none',
                    }}
                  >
                    {plan.cta} →
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div style={{
          borderTop: '1px solid rgba(148,163,184,0.1)',
          paddingTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#475569' }}>
            🔒 Keine Kreditkarte nötig für Free · Jederzeit kündbar · DSGVO-konform
          </p>
          <button
            onClick={onClose}
            style={{
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 8,
              background: 'transparent',
              color: '#64748b',
              padding: '0.4rem 0.9rem',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Später entscheiden
          </button>
        </div>
      </div>
    </div>
  );
}
