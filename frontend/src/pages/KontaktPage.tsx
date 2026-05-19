import { useState, type CSSProperties, type FormEvent } from 'react';
import { SALES_UPGRADE_LINK } from '../config/featureFlags';

const sectionStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1100,
  margin: '0 auto',
  padding: 'clamp(32px,5vw,64px) clamp(16px,4vw,32px)',
  boxSizing: 'border-box',
};

const CONTACT_OPTIONS = [
  { icon: '📧', label: 'E-Mail', value: 'kontakt@wattai.energy', href: 'mailto:kontakt@wattai.energy' },
  { icon: '💼', label: 'Business & Vertrieb', value: 'sales@wattai.energy', href: SALES_UPGRADE_LINK },
  { icon: '🛠', label: 'Technischer Support', value: 'support@wattai.energy', href: 'mailto:support@wattai.energy' },
];

export default function KontaktPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'Allgemeine Anfrage', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    // mailto: fallback (replace with real backend API call)
    const mailto = `mailto:kontakt@wattai.energy?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(
      `Name: ${form.name}\nE-Mail: ${form.email}\n\n${form.message}`
    )}`;
    window.location.href = mailto;
    setSent(true);
    setError('');
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(103,232,249,0.2)',
    borderRadius: 10,
    padding: '0.65rem 1rem',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={{ color: '#e2e8f0', width: '100%' }}>

      {/* ── Header ── */}
      <section style={{ ...sectionStyle, textAlign: 'center', paddingBottom: 0 }}>
        <h1 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, color: '#f1f5f9', margin: '0 0 14px' }}>
          Kontakt
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 'clamp(14px,2vw,17px)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Fragen, Feedback oder Interesse an Business-Lösungen? Wir freuen uns von dir zu hören.
        </p>
      </section>

      {/* ── Grid: Form + Info ── */}
      <section style={sectionStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 32 }}>

          {/* Contact Form */}
          <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(103,232,249,0.15)', borderRadius: 18, padding: 'clamp(20px,3vw,32px)' }}>
            <h2 style={{ margin: '0 0 22px', fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>
              ✉️ Nachricht senden
            </h2>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>
                  Nachricht vorbereitet!
                </p>
                <p style={{ color: '#94a3b8', fontSize: 13 }}>
                  Dein E-Mail-Programm öffnet sich mit der vorausgefüllten Nachricht.
                </p>
                <button
                  onClick={() => setSent(false)}
                  style={{ marginTop: 20, background: 'none', border: '1px solid rgba(103,232,249,0.3)', color: '#67e8f9', borderRadius: 8, padding: '0.5rem 1.2rem', cursor: 'pointer', fontSize: 13 }}
                >
                  Weitere Nachricht senden
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input
                    type="text"
                    placeholder="Dein Name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>E-Mail *</label>
                  <input
                    type="email"
                    placeholder="deine@email.de"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Betreff</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option>Allgemeine Anfrage</option>
                    <option>Technischer Support</option>
                    <option>Business / Vertrieb</option>
                    <option>Partnerschaft</option>
                    <option>Datenschutz</option>
                    <option>Sonstiges</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nachricht *</label>
                  <textarea
                    rows={5}
                    placeholder="Wie können wir helfen?"
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
                    required
                  />
                </div>
                {error && (
                  <p style={{ margin: 0, color: '#f87171', fontSize: 12 }}>⚠️ {error}</p>
                )}
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(90deg,#0ea5e9,#06b6d4)', color: '#fff',
                    border: 'none', borderRadius: 10, padding: '0.7rem', fontWeight: 700,
                    fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(6,182,212,0.3)',
                  }}
                >
                  📤 Nachricht senden
                </button>
                <p style={{ margin: 0, fontSize: 11, color: '#475569', textAlign: 'center' }}>
                  * Pflichtfelder · Daten werden nur zur Beantwortung deiner Anfrage genutzt (DSGVO Art. 6 Abs. 1b)
                </p>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(103,232,249,0.12)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>📬 Direkte Kontaktwege</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {CONTACT_OPTIONS.map(c => (
                  <a
                    key={c.label}
                    href={c.href}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', padding: '10px 12px', borderRadius: 10, background: 'rgba(2,6,23,0.5)', border: '1px solid rgba(103,232,249,0.1)', transition: 'border-color 0.2s' }}
                  >
                    <span style={{ fontSize: 22 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: 13, color: '#67e8f9', fontWeight: 600 }}>{c.value}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(103,232,249,0.12)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>🕐 Reaktionszeit</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Allgemeine Anfragen', time: '1–2 Werktage' },
                  { label: 'Technischer Support', time: '< 24 Stunden' },
                  { label: 'Business / Vertrieb', time: '< 4 Stunden' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8' }}>
                    <span>{r.label}</span>
                    <span style={{ color: '#4ade80', fontWeight: 600 }}>{r.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(6,182,212,0.08))', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
                🏭 Business-Interesse?
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>
                Flottenmanagement, API-Integration oder individuelle Enterprise-Lösung? Wir beraten dich kostenlos.
              </p>
              <a
                href={SALES_UPGRADE_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none',
                  padding: '0.6rem', borderRadius: 10, border: '1px solid rgba(167,139,250,0.4)',
                  color: '#a78bfa', fontSize: 13, fontWeight: 700,
                }}
              >
                📧 Business-Anfrage starten →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impressum Kurzinfo ── */}
      <section style={{ ...sectionStyle, paddingTop: 0 }}>
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 14, padding: '20px 24px', fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
          <strong style={{ color: '#64748b' }}>Impressum (§ 5 TMG):</strong> WattAI · Mohammad Hameed ·
          Verantwortlich für den Inhalt: Mohammad Hameed · E-Mail: kontakt@wattai.energy ·
          Plattform der EU-Kommission zur Online-Streitbeilegung: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: '#64748b' }}>ec.europa.eu/consumers/odr</a>
        </div>
      </section>
    </div>
  );
}
