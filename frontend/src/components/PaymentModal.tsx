import { useEffect, useRef, useState } from 'react';
import { PAYMENT_URLS, SALES_UPGRADE_LINK, type PaymentMethod } from '../config/featureFlags';

// ─── Types ────────────────────────────────────────────────────────────────────
type PaidPlanId = 'pro' | 'business';

interface PaymentModalProps {
  open: boolean;
  planId: PaidPlanId;
  planLabel: string;
  planPrice: string;
  planPriceNote: string;
  planColor: string;
  onClose: () => void;
}

// ─── Payment method definitions ───────────────────────────────────────────────
const METHODS: {
  id: PaymentMethod | 'apple' | 'google';
  label: string;
  sublabel: string;
  icon: string;
  badge?: string;
  stripeNative?: boolean; // handled inside Stripe Checkout
}[] = [
  {
    id: 'stripe',
    label: 'Kreditkarte / Debitkarte',
    sublabel: 'Visa, Mastercard, Amex — sofortige Aktivierung',
    icon: '💳',
    badge: 'Empfohlen',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    sublabel: 'Zahle mit deinem PayPal-Konto',
    icon: '🅿️',
  },
  {
    id: 'sepa',
    label: 'SEPA-Lastschrift',
    sublabel: 'Bankeinzug — gilt für DACH & EU',
    icon: '🏦',
  },
  {
    id: 'apple',
    label: 'Apple Pay',
    sublabel: 'Über Stripe Checkout — Touch/Face ID',
    icon: '🍎',
    stripeNative: true,
  },
  {
    id: 'google',
    label: 'Google Pay',
    sublabel: 'Über Stripe Checkout — 1-Tap Zahlung',
    icon: '🔵',
    stripeNative: true,
  },
];

// ─── Helper: resolve URL for a method ─────────────────────────────────────────
function resolveUrl(planId: PaidPlanId, methodId: PaymentMethod | 'apple' | 'google'): string {
  // Apple Pay + Google Pay are handled inside Stripe Checkout
  if (methodId === 'apple' || methodId === 'google') {
    return PAYMENT_URLS[planId].stripe;
  }
  if (planId === 'business') {
    return SALES_UPGRADE_LINK; // Business always via sales contact
  }
  return PAYMENT_URLS[planId][methodId as PaymentMethod];
}

// ─── Security badge strip ─────────────────────────────────────────────────────
const TRUST_BADGES = ['🔒 SSL', 'DSGVO', 'PCI DSS', 'Jederzeit kündbar'];

// ─── Component ────────────────────────────────────────────────────────────────
export function PaymentModal({
  open,
  planId,
  planLabel,
  planPrice,
  planPriceNote,
  planColor,
  onClose,
}: PaymentModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const firstBtnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset selection when modal opens
  useEffect(() => {
    if (open) {
      setSelected(null);
      setTimeout(() => firstBtnRef.current?.focus(), 60);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // ── handle method click ───────────────────────────────────────────────────
  const handleSelect = (methodId: PaymentMethod | 'apple' | 'google') => {
    setSelected(methodId);
    const url = resolveUrl(planId, methodId);
    const isMailto = url.startsWith('mailto:');
    setTimeout(() => {
      if (isMailto) {
        window.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      onClose();
    }, 180); // brief visual feedback before navigating
  };

  // ── styles ────────────────────────────────────────────────────────────────
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9100,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  };

  const modal: React.CSSProperties = {
    background: 'linear-gradient(160deg,rgba(15,23,42,0.98) 0%,rgba(2,6,23,0.98) 100%)',
    border: `1px solid ${planColor}44`,
    borderRadius: 20,
    padding: '28px 24px 24px',
    width: '100%',
    maxWidth: 480,
    boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px ${planColor}22`,
    position: 'relative',
  };

  return (
    <div
      ref={overlayRef}
      style={overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Zahlungsmethode wählen"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div style={modal}>

        {/* ── Close ── */}
        <button
          onClick={onClose}
          aria-label="Schließen"
          style={{
            position: 'absolute', top: 14, right: 16,
            background: 'none', border: 'none', color: '#64748b',
            fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4,
          }}
        >
          ×
        </button>

        {/* ── Header ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: planColor, textTransform: 'uppercase', marginBottom: 6 }}>
            Zahlungsmethode wählen
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>
            WattAI.live <span style={{ color: planColor }}>{planLabel}</span>
          </h2>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9' }}>€ {planPrice}</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{planPriceNote}</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg,${planColor}44,transparent)`, marginBottom: 18 }} />

        {/* ── Method list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {METHODS.map((m, idx) => {
            const isSelected = selected === m.id;
            const isHovered = hoveredId === m.id;
            const url = resolveUrl(planId, m.id);
            const isFallback = url.startsWith('mailto:');

            return (
              <button
                key={m.id}
                ref={idx === 0 ? firstBtnRef : undefined}
                onClick={() => handleSelect(m.id as PaymentMethod | 'apple' | 'google')}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: isSelected
                    ? `1.5px solid ${planColor}`
                    : isHovered
                    ? `1.5px solid ${planColor}88`
                    : '1.5px solid rgba(148,163,184,0.12)',
                  background: isSelected
                    ? `${planColor}18`
                    : isHovered
                    ? 'rgba(248,250,252,0.04)'
                    : 'rgba(15,23,42,0.5)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 0 0 3px ${planColor}22` : 'none',
                  width: '100%',
                }}
              >
                {/* Icon */}
                <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{m.icon}</span>

                {/* Labels */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{m.label}</span>
                    {m.badge && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: planColor,
                        background: `${planColor}22`, borderRadius: 6,
                        padding: '2px 7px', letterSpacing: '0.06em',
                        border: `1px solid ${planColor}44`,
                      }}>
                        {m.badge}
                      </span>
                    )}
                    {isFallback && (
                      <span style={{
                        fontSize: 10, color: '#64748b',
                        background: 'rgba(100,116,139,0.12)', borderRadius: 6,
                        padding: '2px 7px', border: '1px solid rgba(100,116,139,0.2)',
                      }}>
                        E-Mail-Anfrage
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.sublabel}</div>
                </div>

                {/* Arrow */}
                <span style={{
                  fontSize: 16, color: isSelected ? planColor : '#475569',
                  transition: 'transform 0.15s',
                  transform: isSelected ? 'translateX(3px)' : 'none',
                }}>
                  →
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Trust badges ── */}
        <div style={{
          marginTop: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}>
          {TRUST_BADGES.map(b => (
            <span key={b} style={{
              fontSize: 11, color: '#475569',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: 8, padding: '3px 10px',
            }}>
              {b}
            </span>
          ))}
        </div>

        {/* ── Footer note ── */}
        <p style={{ margin: '14px 0 0', fontSize: 11, color: '#334155', textAlign: 'center' }}>
          Zahlung wird sicher über unsere Partner (Stripe / PayPal) abgewickelt.{' '}
          Kein Risiko — jederzeit kündbar.
        </p>
      </div>
    </div>
  );
}
