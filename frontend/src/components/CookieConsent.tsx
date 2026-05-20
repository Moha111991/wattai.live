/**
 * CookieConsent — DSGVO-konformer Cookie-Hinweis
 * Speichert Entscheidung in localStorage (kein Cookie dafür nötig).
 * Nur technisch notwendige Cookies werden ohne Einwilligung gesetzt.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'wattai_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ConsentState;
    if (!stored) setVisible(true);
  }, []);

  const handle = (choice: 'accepted' | 'declined') => {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderTop: '1px solid #334155',
      padding: '1rem 1.5rem',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
    }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
          🍪 Wir verwenden ausschließlich <strong>technisch notwendige Cookies</strong> für den Betrieb der Plattform (Session, Sicherheit). 
          Keine Tracking- oder Werbe-Cookies. Mehr in unserer{' '}
          <a href="/datenschutz" style={{ color: '#67e8f9', textDecoration: 'underline' }}>
            Datenschutzerklärung
          </a>.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
        <button
          onClick={() => handle('declined')}
          style={{
            padding: '0.5rem 1.2rem', borderRadius: 8, border: '1px solid #475569',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem',
          }}
        >
          Nur notwendige
        </button>
        <button
          onClick={() => handle('accepted')}
          style={{
            padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none',
            background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
            color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
          }}
        >
          Verstanden & Akzeptieren
        </button>
      </div>
    </div>
  );
}
