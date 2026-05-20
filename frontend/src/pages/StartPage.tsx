import type { CSSProperties } from 'react';

type StartPageProps = {
  onNavigate: (page: 'home' | 'startseite' | 'produkte' | 'about' | 'kontakt') => void;
  onAuthClick: () => void;
  onUpgradeClick: () => void;
};

export default function StartPage({ onNavigate, onAuthClick, onUpgradeClick }: StartPageProps) {
  const sectionStyle: CSSProperties = {
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    padding: 'clamp(32px,5vw,72px) clamp(16px,4vw,32px)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ color: '#e2e8f0', width: '100%' }}>

      {/* ── Hero ── */}
      <section style={{ ...sectionStyle, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(103,232,249,0.1)', border: '1px solid rgba(103,232,249,0.3)',
          borderRadius: 999, padding: '4px 16px', marginBottom: 24, fontSize: 13, color: '#67e8f9',
        }}>
          ⚡ Die smarte Energieplattform für Heim & Flotte
        </div>
        <h1 style={{
          fontSize: 'clamp(28px,5vw,60px)', fontWeight: 900, lineHeight: 1.15,
          background: 'linear-gradient(135deg,#f1f5f9 0%,#67e8f9 50%,#06b6d4 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', margin: '0 0 20px',
        }}>
          Deine Energie.<br />Intelligent gesteuert.
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: '#94a3b8', maxWidth: 680, margin: '0 auto 36px', lineHeight: 1.7 }}>
          WattAI.live verbindet PV-Anlage, Batteriespeicher, Wärmepumpe und Elektroauto zu einem
          intelligenten Ökosystem — in Echtzeit, DSGVO-konform und planbasiert.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('home')}
            style={{
              background: 'linear-gradient(90deg,#0ea5e9,#06b6d4)', color: '#fff',
              border: 'none', borderRadius: 999, padding: '0.75rem 2rem',
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 8px 28px rgba(6,182,212,0.4)',
            }}
          >
            🚀 Dashboard starten
          </button>
          <button
            onClick={() => onNavigate('produkte')}
            style={{
              background: 'transparent', color: '#67e8f9',
              border: '1px solid rgba(103,232,249,0.45)', borderRadius: 999,
              padding: '0.75rem 2rem', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            }}
          >
            Preise & Pläne ansehen →
          </button>
        </div>
      </section>

      {/* ── Stat-Bar ── */}
      <section style={{ background: 'rgba(15,23,42,0.7)', borderTop: '1px solid rgba(103,232,249,0.1)', borderBottom: '1px solid rgba(103,232,249,0.1)', padding: '28px 0' }}>
        <div style={{ ...sectionStyle, padding: '0 clamp(16px,4vw,32px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 24, textAlign: 'center' }}>
            {[
              { value: '< 2 min', label: 'Einrichtungszeit' },
              { value: '98 %', label: 'Uptime SLA' },
              { value: '30 %', label: 'Ø Einsparung' },
              { value: 'ISO 15118', label: 'V2G-Standard' },
              { value: 'DSGVO', label: 'Datenschutz Art. 6' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#67e8f9' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={sectionStyle}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, marginBottom: 40, color: '#f1f5f9' }}>
          Alles in einem System
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
          {[
            { icon: '☀️', title: 'PV-Optimierung', desc: 'Echtzeit-Ertragsprognosen, Eigenverbrauchsmaximierung und Netzeinspeisung intelligent steuern.' },
            { icon: '🔋', title: 'Batteriemanagement', desc: 'Lade- und Entladezyklen nach Tarifen, SOC-Grenzen und Haushaltslast automatisch regeln.' },
            { icon: '🚗', title: 'EV & V2H / V2G', desc: 'Intelligentes Laden, bidirektionale Stromnutzung und Multi-EV-Profile (ab Pro).' },
            { icon: '🏠', title: 'Smart Home', desc: 'Wärmepumpe, Waschmaschine & Co. automatisch in günstige Zeitfenster verschieben (ab Pro).' },
            { icon: '🤖', title: 'KI-Empfehlung', desc: 'Deep-Q-Network analysiert Live-Daten und gibt konkrete Handlungsempfehlungen (ab Pro).' },
            { icon: '🏭', title: 'Flottenmanagement', desc: 'KI-Dispatch, Lastspitzen-Management, SLA-Alerting für gewerbliche Standorte (Business).' },
          ].map(f => (
            <div key={f.title} style={{
              background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(103,232,249,0.12)',
              borderRadius: 16, padding: '24px 20px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ ...sectionStyle, textAlign: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg,rgba(6,182,212,0.15),rgba(139,92,246,0.1))',
          border: '1px solid rgba(103,232,249,0.2)', borderRadius: 20, padding: 'clamp(32px,5vw,56px) clamp(20px,4vw,48px)',
        }}>
          <h2 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 800, margin: '0 0 12px', color: '#f1f5f9' }}>
            Kostenlos starten — jetzt upgraden wenn du bereit bist
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28, maxWidth: 500, margin: '0 auto 28px' }}>
            Kein Abo-Zwang, keine Kreditkarte nötig. Einfach registrieren und loslegen.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={onAuthClick}
              style={{
                background: 'linear-gradient(90deg,#0ea5e9,#06b6d4)', color: '#fff',
                border: 'none', borderRadius: 999, padding: '0.7rem 1.8rem',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(6,182,212,0.35)',
              }}
            >
              🔐 Kostenlos registrieren
            </button>
            <button
              onClick={onUpgradeClick}
              style={{
                background: 'transparent', color: '#a78bfa',
                border: '1px solid rgba(167,139,250,0.4)', borderRadius: 999,
                padding: '0.7rem 1.8rem', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              ⚡ Pläne vergleichen
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
