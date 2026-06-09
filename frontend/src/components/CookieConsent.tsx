/**
 * CookieConsent — DSGVO-konformer Cookie-Hinweis
 * Speichert Entscheidung in localStorage (kein Cookie dafür nötig).
 * Nur technisch notwendige Cookies werden ohne Einwilligung gesetzt.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'wattai_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();
  const isEnglish = language === 'en';

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
          {isEnglish ? '🍪 We only use ' : '🍪 Wir verwenden ausschließlich '}
          <strong>{isEnglish ? 'technically necessary cookies' : 'technisch notwendige Cookies'}</strong>
          {isEnglish
            ? ' for operating the platform (session, security). No tracking or advertising cookies. More details in our '
            : ' für den Betrieb der Plattform (Session, Sicherheit). Keine Tracking- oder Werbe-Cookies. Mehr in unserer '}
          <a href="/datenschutz" style={{ color: '#67e8f9', textDecoration: 'underline' }}>
            {isEnglish ? 'privacy policy' : 'Datenschutzerklärung'}
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
          {isEnglish ? 'Necessary only' : 'Nur notwendige'}
        </button>
        <button
          onClick={() => handle('accepted')}
          style={{
            padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none',
            background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
            color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
          }}
        >
          {isEnglish ? 'Got it & accept' : 'Verstanden & Akzeptieren'}
        </button>
      </div>
    </div>
  );
}
