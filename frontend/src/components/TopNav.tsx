import { useState, type CSSProperties } from 'react';
import WattAILogo from './WattAILogo';
import { useLanguage } from '../context/LanguageContext';

type NavPage = 'home' | 'startseite' | 'produkte' | 'about' | 'kontakt';

type TopNavProps = {
  isMobile: boolean;
  logoSize: number;
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  isLoggedIn: boolean;
  userName?: string;
  onAuthClick: () => void;
  onLogout: () => void;
};

export default function TopNav({
  isMobile,
  logoSize,
  currentPage,
  onNavigate,
  isLoggedIn,
  userName,
  onAuthClick,
  onLogout,
}: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const NAV_LINKS: { key: NavPage; label: string }[] = [
    { key: 'startseite', label: t('nav.startpage') },
    { key: 'produkte', label: t('nav.products') },
    { key: 'about', label: t('nav.about') },
    { key: 'kontakt', label: t('nav.contact') },
  ];

  const navBarStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(2,6,23,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(103,232,249,0.15)',
    boxSizing: 'border-box',
    zIndex: 100,
    position: 'sticky',
    top: 0,
  };

  const navInnerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile
      ? '0.5rem 1rem'
      : '0.55rem clamp(1rem, 3vw, 2.5rem)',
    gap: 12,
    maxWidth: 1400,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  };

  const linkStyle = (active: boolean): CSSProperties => ({
    background: 'none',
    border: 'none',
    color: active ? '#67e8f9' : '#cbd5e1',
    fontWeight: active ? 700 : 500,
    fontSize: 14,
    cursor: 'pointer',
    padding: '0.35rem 0.7rem',
    borderRadius: 8,
    transition: 'color 160ms, background 160ms',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    display: 'block',
  });

  const authBtnStyle: CSSProperties = {
    background: isLoggedIn
      ? 'rgba(103,232,249,0.12)'
      : 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)',
    border: '1px solid rgba(103,232,249,0.4)',
    color: '#f8fafc',
    borderRadius: 999,
    padding: '0.38rem 1rem',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: isLoggedIn ? 'none' : '0 4px 14px rgba(14,165,233,0.35)',
  };

  const hamburgerStyle: CSSProperties = {
    background: 'none',
    border: '1px solid rgba(103,232,249,0.3)',
    borderRadius: 8,
    color: '#67e8f9',
    cursor: 'pointer',
    padding: '0.35rem 0.55rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <nav style={navBarStyle} aria-label="Hauptnavigation">
      <div style={navInnerStyle}>
        {/* Logo */}
        <div
          data-testid="logo-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={() => onNavigate('startseite')}
          role="button"
          tabIndex={0}
          aria-label="Zur Startseite"
          onKeyDown={e => e.key === 'Enter' && onNavigate('startseite')}
        >
          <WattAILogo size={logoSize} animated={!isMobile} variant="full" />
        </div>

        {/* Desktop Navigation Links */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map(link => (
              <button
                key={link.key}
                onClick={() => onNavigate(link.key)}
                style={linkStyle(currentPage === link.key)}
                aria-current={currentPage === link.key ? 'page' : undefined}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* Language & Auth Button + Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language Switcher Buttons (Deutsch / English) */}
          <div style={{ display: 'flex', gap: 4, marginRight: 8, background: 'rgba(255,255,255,0.04)', padding: '2px', borderRadius: 6, border: '1px solid rgba(103,232,249,0.1)' }}>
            <button
              onClick={() => setLanguage('de')}
              style={{
                background: language === 'de' ? 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)' : 'none',
                border: 'none',
                color: language === 'de' ? '#f8fafc' : '#94a3b8',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Auf Deutsch übersetzen"
            >
              DE
            </button>
            <button
              onClick={() => setLanguage('en')}
              style={{
                background: language === 'en' ? 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)' : 'none',
                border: 'none',
                color: language === 'en' ? '#f8fafc' : '#94a3b8',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Translate to English"
            >
              EN
            </button>
          </div>

          {!isMobile && (
            <button style={authBtnStyle} onClick={isLoggedIn ? undefined : onAuthClick} aria-label={isLoggedIn ? t('nav.myAccount') : t('nav.login')}>
              {isLoggedIn ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>👤</span>
                  <span>{userName ?? t('nav.myAccount')}</span>
                  <button
                    onClick={onLogout}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11, padding: '0 2px', marginLeft: 4 }}
                    aria-label="Abmelden"
                  >
                    Abmelden
                  </button>
                </span>
              ) : (
                <>
                  <span>🔐</span>
                  <span>{t('nav.login')}</span>
                </>
              )}
            </button>
          )}

          {/* Hamburger Button (Mobile) */}
          {isMobile && (
            <button
              style={hamburgerStyle}
              onClick={() => setMenuOpen(v => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {menuOpen ? (
                <span style={{ fontSize: 20, lineHeight: 1, color: '#67e8f9' }}>✕</span>
              ) : (
                <>
                  <span style={{ width: 22, height: 2, background: '#67e8f9', borderRadius: 2, display: 'block' }} />
                  <span style={{ width: 22, height: 2, background: '#67e8f9', borderRadius: 2, display: 'block' }} />
                  <span style={{ width: 22, height: 2, background: '#67e8f9', borderRadius: 2, display: 'block' }} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobile && menuOpen && (
        <div
          style={{
            background: 'rgba(2,6,23,0.97)',
            borderTop: '1px solid rgba(103,232,249,0.15)',
            padding: '0.75rem 1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {NAV_LINKS.map(link => (
            <button
              key={link.key}
              onClick={() => { onNavigate(link.key); setMenuOpen(false); }}
              style={{
                ...linkStyle(currentPage === link.key),
                fontSize: 15,
                padding: '0.65rem 0.8rem',
                borderBottom: '1px solid rgba(103,232,249,0.08)',
                textAlign: 'left',
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            style={{
              ...authBtnStyle,
              marginTop: 12,
              justifyContent: 'center',
              width: '100%',
            }}
            onClick={() => { if (!isLoggedIn) { onAuthClick(); setMenuOpen(false); } }}
          >
            {isLoggedIn ? `👤 ${userName ?? 'Mein Konto'}` : '🔐 Einloggen / Registrieren'}
          </button>
          {isLoggedIn && (
            <button
              onClick={() => { onLogout(); setMenuOpen(false); }}
              style={{ background: 'none', border: '1px solid rgba(148,163,184,0.25)', color: '#94a3b8', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', fontSize: 13, marginTop: 4 }}
            >
              Abmelden
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
