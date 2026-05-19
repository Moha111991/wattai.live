import type { CSSProperties } from 'react';

const sectionStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1100,
  margin: '0 auto',
  padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,32px)',
  boxSizing: 'border-box',
};

const TEAM = [
  {
    name: 'Mohammad Hameed',
    role: 'Gründer & CEO',
    bio: 'Energietechnik-Ingenieur mit Fokus auf KI-gesteuerte EMS-Systeme und ISO 15118-Implementierungen.',
    emoji: '👨‍💻',
  },
  {
    name: 'Technik-Team',
    role: 'Backend & KI',
    bio: 'Spezialisiert auf FastAPI, MQTT, Deep-Q-Network RL-Agenten und Echtzeit-Datenverarbeitung.',
    emoji: '🤖',
  },
  {
    name: 'Produkt-Team',
    role: 'UX & Frontend',
    bio: 'React/Vite mit Fokus auf mobile-first Interfaces, Accessibility und DSGVO-konforme Datenvisualisierung.',
    emoji: '🎨',
  },
];

const VALUES = [
  { icon: '🌱', title: 'Nachhaltigkeit', desc: 'Jede kWh Eigenverbrauch schont das Klima. WattAI macht erneuerbare Energie effizienter nutzbar.' },
  { icon: '🔒', title: 'Datenschutz', desc: 'DSGVO Art. 6/13/15–22 — Deine Daten bleiben in der EU, werden nicht weiterverkauft.' },
  { icon: '⚡', title: 'Echtzeit', desc: 'Entscheidungen in Millisekunden, nicht Minuten. KI-Modelle laufen direkt am Edge.' },
  { icon: '🤝', title: 'Transparenz', desc: 'Open API, nachvollziehbare KI-Empfehlungen und Audit-Logs für jeden Schritt.' },
];

export default function AboutPage() {
  return (
    <div style={{ color: '#e2e8f0', width: '100%' }}>

      {/* ── Hero ── */}
      <section style={{ ...sectionStyle, textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, color: '#f1f5f9', margin: '0 0 16px' }}>
          Über WattAI
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 'clamp(14px,2vw,17px)', maxWidth: 700, margin: '0 auto', lineHeight: 1.75 }}>
          WattAI entstand aus der Überzeugung, dass Energie nicht verschwendet werden muss —
          sie muss nur besser koordiniert werden. Wir bauen die intelligente Plattform,
          die Haushalt, E-Mobilität und Gewerbe zusammenbringt.
        </p>
      </section>

      {/* ── Mission ── */}
      <section style={{ background: 'rgba(15,23,42,0.7)', borderTop: '1px solid rgba(103,232,249,0.1)', borderBottom: '1px solid rgba(103,232,249,0.1)' }}>
        <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 800, color: '#f1f5f9', margin: '0 0 16px' }}>
              Unsere Mission
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.75, fontSize: 15, margin: 0 }}>
              Wir glauben, dass jeder Haushalt und jedes Unternehmen das Potenzial hat,
              energieautarker zu werden. WattAI liefert dafür die KI-Intelligenz —
              von der PV-Anlage über den Heimspeicher bis zur Fahrzeugflotte.
            </p>
            <p style={{ color: '#94a3b8', lineHeight: 1.75, fontSize: 15, marginTop: 14 }}>
              Gegründet in Deutschland. Entwickelt nach ISO 15118, ISO 21434 und DSGVO.
              Betrieben auf europäischer Cloud-Infrastruktur.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { v: '2024', l: 'Gründungsjahr' },
              { v: 'EU', l: 'Datenstandort' },
              { v: 'ISO 15118', l: 'V2G-Standard' },
              { v: 'DSGVO', l: 'Datenschutz' },
            ].map(s => (
              <div key={s.l} style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(103,232,249,0.12)', borderRadius: 12, padding: '18px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#67e8f9' }}>{s.v}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={sectionStyle}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 32 }}>
          Unsere Werte
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18 }}>
          {VALUES.map(v => (
            <div key={v.title} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(103,232,249,0.1)', borderRadius: 14, padding: '22px 18px' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{v.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{v.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 32 }}>
          Das Team
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {TEAM.map(m => (
            <div key={m.name} style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(103,232,249,0.12)', borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{m.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#67e8f9', fontWeight: 600, marginBottom: 12 }}>{m.role}</div>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 800, color: '#f1f5f9', marginBottom: 24 }}>
          Technologie-Stack
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {['FastAPI', 'React + Vite', 'MQTT', 'TensorFlow Lite', 'ONNX', 'PostgreSQL', 'Redis',
            'Docker', 'Railway', 'ISO 15118', 'ISO 21434', 'DSGVO', 'Playwright', 'Prometheus'].map(t => (
            <span key={t} style={{
              background: 'rgba(103,232,249,0.08)', border: '1px solid rgba(103,232,249,0.2)',
              borderRadius: 999, padding: '4px 14px', fontSize: 12, color: '#67e8f9', fontWeight: 600,
            }}>
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
