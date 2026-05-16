import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import Dashboard from "./components/Dashboard";
import EVDashboard from "./components/EVDashboard";
import DevicesDashboard from "./components/DevicesDashboard";
import HouseholdDashboard from "./components/HouseholdDashboard";
import KIDashboard from "./components/KIDashboard";
import FleetManagementTab from "./components/FleetManagementTab";
import AppFooter from "./components/AppFooter";
import TopNav from "./components/TopNav";
import AuthModal from "./components/AuthModal";
import UpgradeModal from "./components/UpgradeModal";
import DashboardHeader3D from "./components/headers/DashboardHeader3D";
import EVHeader3D from "./components/headers/EVHeader3D";
import DevicesHeader3D from "./components/headers/DevicesHeader3D";
import SmartHomeHeader3D from "./components/headers/SmartHomeHeader3D";
import AIHeader3D from "./components/headers/AIHeader3D";
import {
  resolveFeatureFlags,
} from "./config/featureFlags";
import "./styles/styles.css";
import "./styles/animations.css";

type TabDefinition = {
  key: string;
  label: string;
  component: ReactElement;
};

type NavPage = 'home' | 'produkte' | 'about' | 'kontakt';

const BASE_TABS: TabDefinition[] = [
  { key: 'main', label: 'Dashboard', component: <Dashboard /> },
  { key: 'ev', label: 'Elektroauto', component: <EVDashboard /> },
  { key: 'devices', label: 'Geräte', component: <DevicesDashboard /> },
  { key: 'house', label: 'Smart Home', component: <HouseholdDashboard /> },
  { key: 'ki', label: 'KI-Empfehlung', component: <KIDashboard /> },
];

const FLEET_TAB: TabDefinition = {
  key: 'fleet',
  label: 'Flottenmanagement',
  component: <FleetManagementTab />,
};

export default function App() {
  const [tab, setTab] = useState('main');
  const [fleetEnabled, setFleetEnabled] = useState(false);
  const [planLabel, setPlanLabel] = useState('Free');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [navPage, setNavPage] = useState<NavPage>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const appContentRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile screen size with finer granularity
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calculate responsive logo size
  const getLogoSize = () => {
    if (typeof window === 'undefined') return 80;
    const width = window.innerWidth;
    if (width < 360) return 40; // Extra small phones
    if (width < 480) return 50; // Small phones
    if (width < 768) return 60; // Tablets portrait
    return 80; // Desktop
  };

  const tabs = fleetEnabled
    ? [...BASE_TABS.slice(0, 2), FLEET_TAB, ...BASE_TABS.slice(2)]
    : BASE_TABS;

  const appStoreUrl = import.meta.env.VITE_APP_STORE_URL || 'https://apps.apple.com/';
  const playStoreUrl = import.meta.env.VITE_PLAY_STORE_URL || 'https://play.google.com/store/apps';
  // Render 3D Header Component based on tab
  const renderHeaderComponent = () => {
    switch (tab) {
      case 'main':
        return <DashboardHeader3D />;
      case 'ev':
        return <EVHeader3D />;
      case 'devices':
        return <DevicesHeader3D />;
      case 'house':
        return <SmartHomeHeader3D />;
      case 'ki':
        return <AIHeader3D />;
      default:
        return <DashboardHeader3D />;
    }
  };

  const appShellStyle: CSSProperties = {
    minHeight: '100dvh',
    width: '100%',
    margin: 0,
    padding: 0,
    overflowX: 'hidden',
    background: 'linear-gradient(160deg, #020617 0%, #0b1220 35%, #0f172a 100%)',
  };

  const appContentStyle: CSSProperties = {
    width: '100%',
    minHeight: '100dvh',
    maxWidth: '100%',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  };

  const headerStyle: CSSProperties = {
    textAlign: 'center',
    marginBottom: 0,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    padding: 0,
    lineHeight: 0,
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
  };

  const navStyle: CSSProperties = {
    marginBottom: 'clamp(1rem, 1.8vw, 1.4rem)',
    marginTop: 'clamp(1.5rem, 2.5vw, 2rem)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(8px, 1.6vw, 14px)',
    position: 'relative',
  };

  const appStoreButtonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    background: 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)',
    color: '#f8fafc',
    borderRadius: 999,
    padding: isMobile ? '0.18rem 0.45rem' : '0.25rem 0.65rem',
    fontWeight: 600,
    fontSize: isMobile ? 10 : 11,
    letterSpacing: '0.01em',
    border: '1px solid rgba(165,243,252,0.35)',
    boxShadow: '0 3px 8px rgba(20,184,166,0.18)',
    whiteSpace: 'nowrap',
    minHeight: isMobile ? 24 : 28,
  };

  const playStoreButtonStyle: CSSProperties = {
    ...appStoreButtonStyle,
    background: 'linear-gradient(90deg, #22c55e 0%, #14b8a6 100%)',
    border: '1px solid rgba(167,243,208,0.35)',
    boxShadow: '0 3px 8px rgba(34,197,94,0.15)',
  };

  // Feature-Gate zentral über config/featureFlags.ts
  useEffect(() => {
    const flags = resolveFeatureFlags();
    setFleetEnabled(flags.showFleetTab);
    setPlanLabel(flags.plan.title);
  }, []);

  useEffect(() => {
    if (!fleetEnabled && tab === 'fleet') {
      setTab('main');
    }
  }, [fleetEnabled, tab]);

  useEffect(() => {
    const appContent = appContentRef.current;
    if (!appContent) {
      return;
    }

    if (isUpgradeModalOpen) {
      appContent.setAttribute('inert', '');
      appContent.setAttribute('aria-hidden', 'true');
    } else {
      appContent.removeAttribute('inert');
      appContent.removeAttribute('aria-hidden');
    }

    return () => {
      appContent.removeAttribute('inert');
      appContent.removeAttribute('aria-hidden');
    };
  }, [isUpgradeModalOpen]);

  return (
  <div className="main-app" style={appShellStyle}>
    {/* Top Navigation with Logo */}
    <TopNav
      isMobile={isMobile}
      logoSize={getLogoSize()}
      currentPage={navPage}
      onNavigate={setNavPage}
      isLoggedIn={isLoggedIn}
      userName={userName}
      onAuthClick={() => setIsAuthModalOpen(true)}
      onLogout={() => { setIsLoggedIn(false); setUserName(undefined); }}
    />

    <div ref={appContentRef} style={appContentStyle}>
      {/* Header Image */}
      <header style={headerStyle}>
        <div style={{ width: '100%', height: 'clamp(300px, 50vw, 560px)' }}>
          {renderHeaderComponent()}
        </div>
      </header>

      {/* Main Content Container with Padding */}
      <div style={{
        padding: 'clamp(10px, 1.6vw, 20px) clamp(10px, 2.4vw, 30px)',
        boxSizing: 'border-box',
      }}>
        <nav style={navStyle}>
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'clamp(8px, 1.4vw, 12px)',
          }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="ui-focusable"
                style={{
                  padding: '0.52rem 1rem',
                  borderRadius: 999,
                  border: tab === t.key ? '1px solid rgba(103,232,249,0.72)' : '1px solid rgba(148,163,184,0.35)',
                  background: tab === t.key ? 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)' : 'rgba(15,23,42,0.56)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: tab === t.key ? 700 : 600,
                  fontSize: 13,
                  minHeight: 40,
                  letterSpacing: '0.02em',
                  boxShadow: tab === t.key ? '0 8px 20px rgba(14,165,233,0.35)' : '0 4px 10px rgba(2,6,23,0.35)',
                  transition: 'all 180ms ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'clamp(8px, 1.4vw, 12px)',
            flexWrap: 'wrap',
          }}>
            <span style={{ color: '#cbd5e1', fontSize: 13, padding: '0.35rem 0.8rem', borderRadius: 999, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.5)' }}>
              Aktueller Plan: <b style={{ color: '#67e8f9' }}>{planLabel}</b>
            </span>
            {!isLoggedIn && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  background: 'rgba(103,232,249,0.1)',
                  border: '1px solid rgba(103,232,249,0.35)',
                  color: '#67e8f9',
                  borderRadius: 999,
                  padding: '0.35rem 0.9rem',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                🔐 Anmelden für mehr Funktionen
              </button>
            )}
          </div>
        </nav>
        <section style={{
          minHeight: 'max(420px, calc(100dvh - 260px))',
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {tabs.find(t => t.key === tab)?.component}
          </div>
        </section>
      </div>
      {/* End Main Content Container */}

      {/* Footer */}
      <AppFooter />
    </div>

    {/* Floating Bottom-Right Widget: Upgrade + App Store */}
    {(showBanner || !fleetEnabled) && (
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 16 : 24,
        right: isMobile ? 12 : 24,
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}>
        {!fleetEnabled && (
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="ui-focusable"
            style={{
              background: 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 100%)',
              color: '#fff',
              borderRadius: 999,
              border: '1px solid rgba(103,232,249,0.45)',
              padding: isMobile ? '0.45rem 0.9rem' : '0.52rem 1.1rem',
              fontWeight: 700,
              fontSize: isMobile ? 12 : 13,
              cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(6,182,212,0.4)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⚡</span>
            {isMobile ? 'Upgrade' : 'Flottenmanagement freischalten'}
          </button>
        )}
        {showBanner && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(15,23,42,0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(103,232,249,0.2)',
            borderRadius: 12,
            padding: isMobile ? '0.3rem 0.6rem' : '0.4rem 0.8rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            <span style={{ fontSize: isMobile ? 10 : 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
              📱 App
            </span>
            <a href={appStoreUrl} target="_blank" rel="noopener noreferrer" style={appStoreButtonStyle} aria-label="iOS App Store">
              🍎{!isMobile && ' iOS'}
            </a>
            <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" style={playStoreButtonStyle} aria-label="Google Play Store">
              🤖{!isMobile && ' Android'}
            </a>
            <button
              onClick={() => setShowBanner(false)}
              aria-label="Schließen"
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, padding: '1px 3px', lineHeight: 1 }}
            >✕</button>
          </div>
        )}
      </div>
    )}

    <AuthModal
      open={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      onLogin={(_email, name) => { setIsLoggedIn(true); setUserName(name); }}
    />

    <UpgradeModal
      open={isUpgradeModalOpen}
      currentPlan={planLabel}
      onClose={() => setIsUpgradeModalOpen(false)}
    />
  </div>
  );
}