import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PaymentModal } from '../components/PaymentModal';

type ProduktePageProps = {
  onUpgradeClick: () => void;
};

export default function ProduktePage({ onUpgradeClick }: ProduktePageProps) {
  const { t } = useLanguage();
  const [paymentPlan, setPaymentPlan] = useState<{
    id: 'pro' | 'business';
    label: string;
    price: string;
    priceNote: string;
    color: string;
  } | null>(null);

  const PLANS = [
    {
      id: 'free',
      label: t('products.free'),
      segment: 'B2C',
      price: null,
      priceNote: t('products.freeNote'),
      color: '#67e8f9',
      border: 'rgba(103,232,249,0.25)',
      bg: 'rgba(15,23,42,0.7)',
      badge: null,
      recommended: false,
      features: [
        t('products.freeF1'),
        t('products.freeF2'),
        t('products.freeF3'),
        t('products.freeF4'),
        t('products.freeF5'),
      ],
      locked: [
        t('products.lSmartHome'),
        t('products.lKi'),
        t('products.lV2g'),
        t('products.lFleet'),
      ],
      cta: t('products.freeCta'),
      ctaHref: null,
    },
    {
      id: 'pro',
      label: t('products.pro'),
      segment: 'B2C',
      price: '19',
      priceNote: t('products.proNote'),
      color: '#06b6d4',
      border: 'rgba(6,182,212,0.6)',
      bg: 'linear-gradient(160deg,rgba(6,182,212,0.12),rgba(14,165,233,0.07))',
      badge: t('products.recommended'),
      recommended: true,
      features: [
        t('products.proF1'),
        t('products.proF2'),
        t('products.proF3'),
        t('products.proF4'),
        t('products.proF5'),
        t('products.proF6'),
        t('products.proF7'),
        t('products.proF8'),
      ],
      locked: [],
      cta: t('products.proCta'),
      ctaHref: null,
    },
    {
      id: 'business',
      label: t('products.business'),
      segment: 'B2B',
      price: '49',
      priceNote: t('products.businessNote'),
      color: '#a78bfa',
      border: 'rgba(167,139,250,0.4)',
      bg: 'linear-gradient(160deg,rgba(139,92,246,0.10),rgba(167,139,250,0.05))',
      badge: 'B2B',
      recommended: false,
      features: [
        t('products.busF1'),
        t('products.busF2'),
        t('products.busF3'),
        t('products.busF4'),
        t('products.busF5'),
        t('products.busF6'),
        t('products.busF7'),
        t('products.busF8'),
      ],
      locked: [],
      cta: t('products.businessCta'),
      ctaHref: null,
    },
  ];

  const FAQS = [
    {
      q: t('products.faq1Q'),
      a: t('products.faq1A'),
    },
    {
      q: t('products.faq2Q'),
      a: t('products.faq2A'),
    },
    {
      q: t('products.faq3Q'),
      a: t('products.faq3A'),
    },
    {
      q: t('products.faq4Q'),
      a: t('products.faq4A'),
    },
    {
      q: t('products.faq5Q'),
      a: t('products.faq5A'),
    },
  ];

  const sectionStyle: CSSProperties = {
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,32px)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ color: '#e2e8f0', width: '100%' }}>

      {/* ── Payment Modal ── */}
      {paymentPlan && (
        <PaymentModal
          open={true}
          planId={paymentPlan.id}
          planLabel={paymentPlan.label}
          planPrice={paymentPlan.price}
          planPriceNote={paymentPlan.priceNote}
          planColor={paymentPlan.color}
          onClose={() => setPaymentPlan(null)}
        />
      )}

      {/* ── Header ── */}
      <section style={{ ...sectionStyle, textAlign: 'center', paddingBottom: 0 }}>
        <h1 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, color: '#f1f5f9', margin: '0 0 14px' }}>
          {t('products.title')}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 'clamp(14px,2vw,17px)', maxWidth: 600, margin: '0 auto 10px', lineHeight: 1.7 }}>
          {t('products.subtitle')}
        </p>
      </section>

      {/* ── Plan Cards ── */}
      <section style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{
                position: 'relative',
                background: plan.bg,
                border: `1.5px solid ${plan.recommended ? plan.border : 'rgba(148,163,184,0.15)'}`,
                borderRadius: 18,
                padding: '28px 22px 22px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: plan.recommended ? '0 0 40px rgba(6,182,212,0.15)' : 'none',
              }}
            >
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                  background: plan.recommended ? 'linear-gradient(90deg,#0ea5e9,#06b6d4)' : 'rgba(167,139,250,0.2)',
                  border: `1px solid ${plan.recommended ? '#67e8f9' : 'rgba(167,139,250,0.4)'}`,
                  borderRadius: 999, padding: '3px 16px', fontSize: 11, fontWeight: 700,
                  color: plan.recommended ? '#fff' : '#c4b5fd', whiteSpace: 'nowrap',
                }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: 6, marginTop: plan.badge ? 6 : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {plan.segment}
                </span>
                <h2 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 800, color: '#f1f5f9' }}>{plan.label}</h2>
              </div>

              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                {plan.price ? (
                  <>
                    <span style={{ fontSize: 40, fontWeight: 800, color: plan.color, lineHeight: 1 }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{plan.priceNote}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 26, fontWeight: 700, color: '#4ade80' }}>{plan.priceNote}</span>
                )}
              </div>

              <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: '#cbd5e1', display: 'flex', gap: 6 }}>
                    <span style={{ flexShrink: 0 }}>{f.slice(0, 2)}</span>
                    <span>{f.slice(2)}</span>
                  </li>
                ))}
                {plan.locked.map(f => (
                  <li key={f} style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 6 }}>
                    <span>✗</span>
                    <span style={{ textDecoration: 'line-through' }}>{f}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <button
                  onClick={onUpgradeClick}
                  style={{
                    width: '100%', padding: '0.65rem', borderRadius: 10,
                    border: `1px solid ${plan.color}`, background: 'transparent',
                    color: plan.color, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {plan.cta}
                </button>
              ) : (
                <button
                  onClick={() =>
                    setPaymentPlan({
                      id: plan.id as 'pro' | 'business',
                      label: plan.label,
                      price: plan.price!,
                      priceNote: plan.priceNote,
                      color: plan.color,
                    })
                  }
                  style={{
                    width: '100%', padding: '0.65rem', borderRadius: 10,
                    border: `1px solid ${plan.color}`,
                    background: plan.recommended
                      ? 'linear-gradient(90deg,#0ea5e9,#06b6d4)'
                      : 'transparent',
                    color: plan.recommended ? '#fff' : plan.color,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: plan.recommended ? '0 4px 20px rgba(6,182,212,0.3)' : 'none',
                  }}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: '#475569' }}>
          {t('products.disclaimer')}
        </p>
      </section>

      {/* ── Feature Comparison Table ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 28 }}>
          {t('products.compTitle')}
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#cbd5e1' }}>
            <thead>
              <tr>
                {[t('products.compFeature'), 'Free', 'Pro', 'Business'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: i === 0 ? 'left' : 'center',
                    borderBottom: '1px solid rgba(148,163,184,0.15)',
                    color: i === 0 ? '#94a3b8' : ['#94a3b8','#67e8f9','#06b6d4','#a78bfa'][i],
                    fontWeight: 700, fontSize: 13,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [t('products.freeF1').slice(2), '✅', '✅', '✅'],
                [t('products.freeF2').slice(2), '✅', '✅', '✅'],
                [t('products.freeF3').slice(2), '✅', '✅', '✅'],
                [t('products.lSmartHome'), '✗', '✅', '✅'],
                [t('products.lKi'), '✗', '✅', '✅'],
                [t('products.lV2g'), '✗', '✅', '✅'],
                [t('products.proF7').slice(2), '✗', '✅', '✅'],
                [t('products.proF5').slice(2), '✗', '✅', '✅'],
                [t('products.proF8').slice(2), '✗', '✅', '✅'],
                [t('products.lFleet'), '✗', '✗', '✅'],
                [t('products.busF3').slice(2), '✗', '✗', '✅'],
                [t('products.busF4').slice(2), '✗', '✗', '✅'],
                [t('products.busF5').slice(2), '✗', '✗', '✅'],
                [t('products.busF6').slice(2), '✗', '✗', '✅'],
                [t('products.busF7').slice(2), '✗', '✗', '✅'],
              ].map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(15,23,42,0.3)' : 'transparent' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '9px 16px',
                      textAlign: ci === 0 ? 'left' : 'center',
                      borderBottom: '1px solid rgba(148,163,184,0.08)',
                      color: cell === '✅' ? '#4ade80' : cell === '✗' ? '#475569' : '#cbd5e1',
                      fontWeight: ci === 0 ? 500 : 600,
                    }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>
          {t('products.faqTitle')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720, margin: '0 auto' }}>
          {FAQS.map(faq => (
            <details
              key={faq.q}
              style={{
                background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(103,232,249,0.12)',
                borderRadius: 12, padding: '14px 18px',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#f1f5f9', fontSize: 14, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {faq.q}
                <span style={{ color: '#67e8f9', fontSize: 18, lineHeight: 1 }}>＋</span>
              </summary>
              <p style={{ margin: '12px 0 0', fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
