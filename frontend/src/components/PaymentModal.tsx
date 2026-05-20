import { useEffect, useRef, useState } from 'react';
import { PAYMENT_URLS, SALES_UPGRADE_LINK, type PaymentMethod } from '../config/featureFlags';

function useWindowWidth() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 768);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

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
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 480;

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
    display: 'flex',
    alignItems: isMobile ? 'flex-end' : 'center',
    justifyContent: 'center',
    padding: isMobile ? '0' : '16px',
  };

  const modal: React.CSSProperties = {
    background: 'linear-gradient(160deg,rgba(15,23,42,0.99) 0%,rgba(2,6,23,0.99) 100%)',
    border: `1px solid ${planColor}44`,
    borderRadius: isMobile ? '20px 20px 0 0' : 20,
    padding: isMobile ? '20px 16px 28px' : '28px 24px 24px',
    width: '100%',
    maxWidth: isMobile ? '100%' : 480,
    maxHeight: isMobile ? '92dvh' : '90vh',
    overflowY: 'auto',
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
        <div style={{ marginBottom: isMobile ? 14 : 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: planColor, textTransform: 'uppercase', marginBottom: 4 }}>
            Zahlungsmethode wählen
          </div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#f1f5f9' }}>
            WattAI.live <span style={{ color: planColor }}>{planLabel}</span>
          </h2>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#f1f5f9' }}>€ {planPrice}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{planPriceNote}</span>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg,${planColor}44,transparent)`, marginBottom: isMobile ? 12 : 18 }} />

        {/* ── Method list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
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
                  gap: isMobile ? 10 : 14,
                  padding: isMobile ? '11px 12px' : '14px 16px',
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
                <span style={{ fontSize: isMobile ? 20 : 26, flexShrink: 0, lineHeight: 1 }}>{m.icon}</span>

                {/* Labels */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: '#f1f5f9' }}>{m.label}</span>
                    {m.badge && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: planColor,
                        background: `${planColor}22`, borderRadius: 6,
                        padding: '2px 6px', letterSpacing: '0.05em',
                        border: `1px solid ${planColor}44`,
                        flexShrink: 0,
                      }}>
                        {m.badge}
                      </span>
                    )}
                    {isFallback && (
                      <span style={{
                        fontSize: 10, color: '#64748b',
                        background: 'rgba(100,116,139,0.12)', borderRadius: 6,
                        padding: '2px 6px', border: '1px solid rgba(100,116,139,0.2)',
                        flexShrink: 0,
                      }}>
                        E-Mail-Anfrage
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 12, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.sublabel}</div>
                </div>

                {/* Arrow */}
                <span style={{
                  fontSize: 15, color: isSelected ? planColor : '#475569',
                  transition: 'transform 0.15s',
                  transform: isSelected ? 'translateX(3px)' : 'none',
                  flexShrink: 0,
                }}>
                  →
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Trust badges ── */}
        <div style={{
          marginTop: isMobile ? 14 : 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          justifyContent: 'center',
        }}>
          {TRUST_BADGES.map(b => (
            <span key={b} style={{
              fontSize: 10, color: '#475569',
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: 8, padding: '3px 8px',
            }}>
              {b}
            </span>
          ))}
        </div>

        {/* ── Footer note ── */}
        <p style={{ margin: isMobile ? '10px 0 0' : '14px 0 0', fontSize: 11, color: '#334155', textAlign: 'center' }}>
          Zahlung wird sicher über Stripe / PayPal abgewickelt. Jederzeit kündbar.
        </p>
      </div>
    </div>
  );
}
