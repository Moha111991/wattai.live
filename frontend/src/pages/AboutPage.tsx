import type { CSSProperties } from 'react';
import { useTheme } from '../hooks/useTheme';

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
  { icon: '🌱', title: 'Nachhaltigkeit', desc: 'Jede kWh Eigenverbrauch schont das Klima. WattAI.live macht erneuerbare Energie effizienter nutzbar.' },
  { icon: '🔒', title: 'Datenschutz', desc: 'DSGVO Art. 6/13/15–22 — Deine Daten bleiben in der EU, werden nicht weiterverkauft.' },
  { icon: '⚡', title: 'Echtzeit', desc: 'Entscheidungen in Millisekunden, nicht Minuten. KI-Modelle laufen direkt am Edge.' },
  { icon: '🤝', title: 'Transparenz', desc: 'Open API, nachvollziehbare KI-Empfehlungen und Audit-Logs für jeden Schritt.' },
];

export default function AboutPage() {
  const { isLight } = useTheme();
  
  const textPrimary = isLight ? '#0f172a' : '#f1f5f9';
  const textMuted = isLight ? '#475569' : '#94a3b8';
  const sectionBg = isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)';
  const borderLightColor = isLight ? 'rgba(15,23,42,0.08)' : 'rgba(103,232,249,0.1)';
  const itemBg = isLight ? '#f8fafc' : 'rgba(2,6,23,0.6)';
  const cellBorder = isLight ? 'rgba(15,23,42,0.06)' : 'rgba(103,232,249,0.12)';

  return (
    <div style={{ color: textMuted, width: '100%' }}>

      {/* ── Hero ── */}
      <section style={{ ...sectionStyle, textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, color: textPrimary, margin: '0 0 16px' }}>
          Über wattAI.live
        </h1>
        <p style={{ color: textMuted, fontSize: 'clamp(14px,2vw,17px)', maxWidth: 700, margin: '0 auto', lineHeight: 1.75 }}>
          wattAI.live entstand aus der Überzeugung, dass Energie nicht verschwendet werden muss —
          sie muss nur besser koordiniert werden. Wir bauen die intelligente Plattform,
          die Haushalt, E-Mobilität und Gewerbe zusammenbringt.
        </p>
      </section>

      {/* ── Mission ── */}
      <section style={{ background: sectionBg, borderTop: `1px solid ${borderLightColor}`, borderBottom: `1px solid ${borderLightColor}` }}>
        <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(20px,3vw,30px)', fontWeight: 800, color: textPrimary, margin: '0 0 16px' }}>
              Unsere Mission
            </h2>
            <p style={{ color: textMuted, lineHeight: 1.75, fontSize: 15, margin: 0 }}>
              Wir glauben, dass jeder Haushalt und jedes Unternehmen das Potenzial hat,
              energieautarker zu werden. wattAI.live liefert dafür die KI-Intelligenz —
              von der PV-Anlage über den Heimspeicher bis zur Fahrzeugflotte.
            </p>
            <p style={{ color: textMuted, lineHeight: 1.75, fontSize: 15, marginTop: 14 }}>
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
              <div key={s.l} style={{ background: itemBg, border: `1px solid ${cellBorder}`, borderRadius: 12, padding: '18px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#67e8f9' }}>{s.v}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section style={sectionStyle}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 800, color: textPrimary, marginBottom: 32 }}>
          Unsere Werte
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18 }}>
          {VALUES.map(v => (
            <div key={v.title} style={{ background: sectionBg, border: `1px solid ${borderLightColor}`, borderRadius: 14, padding: '22px 18px' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{v.icon}</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: textPrimary }}>{v.title}</h3>
              <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.65 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 800, color: textPrimary, marginBottom: 32 }}>
          Das Team
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {TEAM.map(m => (
            <div key={m.name} style={{ background: sectionBg, border: `1px solid ${borderLightColor}`, borderRadius: 16, padding: '28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{m.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: textPrimary, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: '#67e8f9', fontWeight: 600, marginBottom: 12 }}>{m.role}</div>
              <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.65 }}>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech Stack Table (B2B Business Value) ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(18px,2.5vw,28px)', fontWeight: 800, color: textPrimary, marginBottom: 12 }}>
          Technologie-Stack & Compliance
        </h2>
        <p style={{ textAlign: 'center', color: textMuted, fontSize: '14px', maxWidth: 650, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Unsere Software-Architektur ist nach strengen Industriemassstäben für kritische Infrastruktur (KRITIS) modular, latenzarm und cybersicher aufgebaut.
        </p>

        <div style={{ overflowX: 'auto', background: sectionBg, border: `1px solid ${borderLightColor}`, borderRadius: 16, padding: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${borderLightColor}` }}>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.08em', width: '22%' }}>Kategorie</th>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.08em', width: '28%' }}>Technologien / Standards</th>
                <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: textPrimary, textTransform: 'uppercase', letterSpacing: '0.08em', width: '50%' }}>Business-Nutzen im Pitch</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  cat: 'Sicherheit & Standards',
                  tech: 'ISO 21434, ISO 15118, DSGVO',
                  pitch: 'Maximale Compliance für kritische Smart-Grid-Infrastrukturen und sicheres Laden (V2G / Plug & Charge).'
                },
                {
                  cat: 'Künstliche Intelligenz',
                  tech: 'TensorFlow Lite, ONNX',
                  pitch: 'Latenzarme, ausfallsichere Ausführung lernender Reinforcement-Learning-Modelle direkt auf dezentralen Gateways (Edge).'
                },
                {
                  cat: 'IoT & Telemetrie',
                  tech: 'MQTT, WebSockets, TLS',
                  pitch: 'Echtzeit-Schnittstellen für bidirektionale Steuerung und hochfrequente Datenübertragung dezentraler EMS-Anlagen.'
                },
                {
                  cat: 'Enterprise-Backend',
                  tech: 'FastAPI, PostgreSQL, Redis',
                  pitch: 'Skalierbare, hochperformante API-Strukturen mit ultraschnellem In-Memory Caching für Echtzeit-Optimierungen.'
                },
                {
                  cat: 'DevOps & Monitoring',
                  tech: 'Docker, Railway, Prometheus, Playwright',
                  pitch: 'Sichere, automatisierte Bereitstellung (CI/CD) und lückenlose Echtzeit-Überwachung aller Edge-Instanzen im Betrieb.'
                }
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: idx === 4 ? 'none' : `1px solid ${borderLightColor}`, transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } } as CSSProperties}>
                  <td style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: textPrimary }}>{row.cat}</td>
                  <td style={{ padding: '16px', fontSize: '13px', fontFamily: 'monospace' }}>
                    {row.tech.split(', ').map((t, tIdx, arr) => (
                      <span key={tIdx}>
                        <span style={{ color: '#67e8f9', fontWeight: 600 }}>{t}</span>
                        {tIdx < arr.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: textMuted, lineHeight: 1.5 }}>{row.pitch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
