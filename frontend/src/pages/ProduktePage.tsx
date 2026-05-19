import type { CSSProperties } from 'react';
import { CHECKOUT_URLS, SALES_UPGRADE_LINK } from '../config/featureFlags';

type ProduktePageProps = {
  onUpgradeClick: () => void;
};

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    segment: 'B2C',
    price: null,
    priceNote: 'Kostenlos',
    color: '#67e8f9',
    border: 'rgba(103,232,249,0.25)',
    bg: 'rgba(15,23,42,0.7)',
    badge: null,
    recommended: false,
    features: [
      '📊 Live-Energieverbrauch & PV-Ertrag',
      '🔋 Basis-Speichervisualisierung',
      '🚗 1 EV-Profil',
      '📱 Mobile App (iOS & Android)',
      '⚡ Echtzeit-Energiefluss-Anzeige',
    ],
    locked: [
      'Smart-Home-Automatisierungen',
      'KI-Ladeoptimierung',
      'V2H / V2G-Strategien',
      'Flottenmanagement',
    ],
    cta: 'Kostenlos starten',
    ctaHref: null,
  },
  {
    id: 'pro',
    label: 'Pro',
    segment: 'B2C',
    price: '19',
    priceNote: '€ / Monat',
    color: '#06b6d4',
    border: 'rgba(6,182,212,0.6)',
    bg: 'linear-gradient(160deg,rgba(6,182,212,0.12),rgba(14,165,233,0.07))',
    badge: '⭐ Empfohlen',
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
    locked: [],
    cta: '🛒 Jetzt kaufen & freischalten',
    ctaHref: CHECKOUT_URLS.pro,
  },
  {
    id: 'business',
    label: 'Business',
    segment: 'B2B',
    price: '49',
    priceNote: '€ / Standort / Monat',
    color: '#a78bfa',
    border: 'rgba(167,139,250,0.4)',
    bg: 'linear-gradient(160deg,rgba(139,92,246,0.10),rgba(167,139,250,0.05))',
    badge: 'B2B',
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
    locked: [],
    cta: '📧 Kontakt aufnehmen',
    ctaHref: SALES_UPGRADE_LINK,
  },
];

const FAQS = [
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja. Pro-Abos können monatlich gekündigt werden, ohne Mindestlaufzeit.',
  },
  {
    q: 'Welche Geräte werden unterstützt?',
    a: 'Wallboxen (OCPP), Heimspeicher (SMA, Fronius, BYD), Wechselrichter, Wärmepumpen und alle gängigen EV-Modelle via ISO 15118.',
  },
  {
    q: 'Ist meine Nutzerdaten sicher?',
    a: 'Alle Daten werden DSGVO-konform in der EU verarbeitet (Art. 6, 13, 15–22 DSGVO). Keine Weitergabe an Dritte.',
  },
  {
    q: 'Was ist der Unterschied zwischen Pro und Business?',
    a: 'Pro richtet sich an Privathaushalte (bis 3 EVs). Business ergänzt Flottenmanagement, KI-Dispatch, API-Zugang und SLA für gewerbliche Betreiber.',
  },
  {
    q: 'Gibt es eine kostenlose Testphase für Pro?',
    a: 'Aktuell gibt es kein Probe-Abo. Der Free-Plan bietet jedoch dauerhaft die Basis-Funktionen ohne Zeitlimit.',
  },
];

export default function ProduktePage({ onUpgradeClick }: ProduktePageProps) {
  const sectionStyle: CSSProperties = {
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,32px)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ color: '#e2e8f0', width: '100%' }}>

      {/* ── Header ── */}
      <section style={{ ...sectionStyle, textAlign: 'center', paddingBottom: 0 }}>
        <h1 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, color: '#f1f5f9', margin: '0 0 14px' }}>
          Produkte & Leistungen
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 'clamp(14px,2vw,17px)', maxWidth: 600, margin: '0 auto 10px', lineHeight: 1.7 }}>
          Wähle den Plan, der zu deinem Zuhause oder Betrieb passt. Jederzeit upgradebar.
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

              {plan.ctaHref ? (
                <a
                  href={plan.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textAlign: 'center', textDecoration: 'none', display: 'block',
                    padding: '0.65rem', borderRadius: 10,
                    background: plan.recommended ? 'linear-gradient(90deg,#0ea5e9,#06b6d4)' : 'transparent',
                    border: `1px solid ${plan.color}`,
                    color: plan.recommended ? '#fff' : plan.color,
                    fontSize: 13, fontWeight: 700,
                    boxShadow: plan.recommended ? '0 4px 20px rgba(6,182,212,0.3)' : 'none',
                  }}
                >
                  {plan.cta}
                </a>
              ) : (
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
              )}
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: '#475569' }}>
          🔒 Keine Kreditkarte nötig für Free · DSGVO-konform · Jederzeit kündbar
        </p>
      </section>

      {/* ── Feature Comparison Table ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 28 }}>
          Funktionsvergleich
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#cbd5e1' }}>
            <thead>
              <tr>
                {['Funktion', 'Free', 'Pro', 'Business'].map((h, i) => (
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
                ['Live-Energieverbrauch & PV', '✅', '✅', '✅'],
                ['Basis-Speichervisualisierung', '✅', '✅', '✅'],
                ['1 EV-Profil', '✅', '✅', '✅'],
                ['Smart-Home-Automatisierungen', '✗', '✅', '✅'],
                ['KI-Ladeoptimierung', '✗', '✅', '✅'],
                ['V2H / V2G-Strategien', '✗', '✅', '✅'],
                ['Multi-EV (bis 3)', '✗', '✅', '✅'],
                ['Dynamische Tarife (Tibber etc.)', '✗', '✅', '✅'],
                ['Erweiterte Insights & Berichte', '✗', '✅', '✅'],
                ['Flottenmanagement', '✗', '✗', '✅'],
                ['KI-Dispatch & Lastspitzen', '✗', '✗', '✅'],
                ['API-Zugang & Webhooks', '✗', '✗', '✅'],
                ['SSO & Mandantenfähigkeit', '✗', '✗', '✅'],
                ['Compliance- & Audit-Reporting', '✗', '✗', '✅'],
                ['SLA & dedizierter Support', '✗', '✗', '✅'],
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
          Häufige Fragen
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
