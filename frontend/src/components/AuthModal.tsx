import { useEffect, useRef, useState, type CSSProperties } from 'react';

type AuthTab = 'login' | 'register';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, name: string) => void;
};

export default function AuthModal({ open, onClose, onLogin }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError('');
      setSuccess('');
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [open, activeTab]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Bitte E-Mail und Passwort eingeben.'); return; }
    // Demo-Logik – in Produktion: API-Call
    onLogin(email, email.split('@')[0]);
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) { setError('Bitte alle Felder ausfüllen.'); return; }
    if (password !== confirmPassword) { setError('Passwörter stimmen nicht überein.'); return; }
    if (password.length < 8) { setError('Passwort muss mindestens 8 Zeichen haben.'); return; }
    setSuccess('Konto erfolgreich erstellt! Bitte bestätige deine E-Mail.');
    setTimeout(() => { onLogin(email, name); onClose(); }, 1600);
  };

  const overlayStyle: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 2000,
    background: 'rgba(2,6,23,0.78)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  };

  const modalStyle: CSSProperties = {
    background: 'linear-gradient(160deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,0.98) 100%)',
    border: '1px solid rgba(103,232,249,0.22)',
    borderRadius: 18,
    padding: 'clamp(1.2rem, 4vw, 2rem)',
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 24px 64px rgba(2,6,23,0.7), 0 0 0 1px rgba(103,232,249,0.1)',
    position: 'relative',
  };

  const inputStyle: CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(15,23,42,0.7)',
    border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: 10,
    color: '#f8fafc',
    fontSize: 14,
    padding: '0.65rem 0.9rem',
    outline: 'none',
    transition: 'border 160ms',
  };

  const btnStyle: CSSProperties = {
    width: '100%',
    background: 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    padding: '0.75rem',
    cursor: 'pointer',
    marginTop: 8,
    boxShadow: '0 6px 20px rgba(14,165,233,0.35)',
    transition: 'opacity 150ms',
  };

  const tabBtnStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    background: active ? 'rgba(103,232,249,0.12)' : 'none',
    border: 'none',
    borderBottom: active ? '2px solid #67e8f9' : '2px solid transparent',
    color: active ? '#67e8f9' : '#94a3b8',
    fontWeight: active ? 700 : 500,
    fontSize: 14,
    cursor: 'pointer',
    padding: '0.65rem',
    transition: 'all 160ms',
  });

  const labelStyle: CSSProperties = {
    display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 4, fontWeight: 600, letterSpacing: '0.04em',
  };

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={activeTab === 'login' ? 'Anmelden' : 'Konto erstellen'}>
      <div style={modalStyle}>
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Schließen"
          style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
        >✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🔐</div>
          <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 800, margin: 0 }}>
            {activeTab === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            {activeTab === 'login'
              ? 'Melde dich an, um alle Funktionen zu nutzen.'
              : 'Erstelle ein kostenloses Konto und starte sofort.'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(103,232,249,0.12)', marginBottom: '1.4rem' }}>
          <button style={tabBtnStyle(activeTab === 'login')} onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}>
            Anmelden
          </button>
          <button style={tabBtnStyle(activeTab === 'register')} onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}>
            Neues Konto erstellen
          </button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle} htmlFor="auth-email">E-Mail-Adresse</label>
              <input ref={firstInputRef} id="auth-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="deine@email.de" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="auth-password">Passwort</label>
              <input id="auth-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>⚠ {error}</p>}
            <button type="submit" style={btnStyle}>Anmelden →</button>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>
              Noch kein Konto?{' '}
              <button type="button" onClick={() => setActiveTab('register')} style={{ background: 'none', border: 'none', color: '#67e8f9', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}>
                Jetzt registrieren
              </button>
            </p>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle} htmlFor="reg-name">Name</label>
              <input ref={firstInputRef} id="reg-name" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Dein Name" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="reg-email">E-Mail-Adresse</label>
              <input id="reg-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="deine@email.de" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="reg-password">Passwort</label>
              <input id="reg-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Min. 8 Zeichen" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="reg-confirm">Passwort bestätigen</label>
              <input id="reg-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="Passwort wiederholen" />
            </div>
            {error && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>⚠ {error}</p>}
            {success && <p style={{ color: '#34d399', fontSize: 13, margin: 0 }}>✅ {success}</p>}
            <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px', lineHeight: 1.5 }}>
              Mit der Registrierung stimmst du unseren{' '}
              <span style={{ color: '#67e8f9', cursor: 'pointer' }}>AGB</span> und der{' '}
              <span style={{ color: '#67e8f9', cursor: 'pointer' }}>Datenschutzerklärung</span> zu.
            </p>
            <button type="submit" style={btnStyle}>Konto erstellen →</button>
          </form>
        )}

        {/* Plan hint */}
        <div style={{ marginTop: 16, background: 'rgba(103,232,249,0.06)', border: '1px solid rgba(103,232,249,0.15)', borderRadius: 10, padding: '0.6rem 0.9rem', textAlign: 'center' }}>
          <span style={{ color: '#67e8f9', fontSize: 12 }}>✨ Kostenloser Free-Plan · Kein Kreditkarte nötig</span>
        </div>
      </div>
    </div>
  );
}
