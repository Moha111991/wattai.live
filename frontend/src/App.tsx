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
import CookieConsent from "./components/CookieConsent";
import { PlanProvider, usePlan } from "./context/PlanContext";
import { TabContext } from "./context/TabContext";
import StartPage from "./pages/StartPage";
import ProduktePage from "./pages/ProduktePage";
import AboutPage from "./pages/AboutPage";
import KontaktPage from "./pages/KontaktPage";
import "./styles/styles.css";
import "./styles/animations.css";

type TabDefinition = {
  key: string;
  label: string;
  component: ReactElement;
};

type NavPage = 'home' | 'startseite' | 'produkte' | 'about' | 'kontakt';

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
  return (
    <PlanProvider>
      <AppShell />
    </PlanProvider>
  );
}

function AppShell() {
  const { plan, fleetUnlocked } = usePlan();
  const [tab, setTab] = useState('main');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [navPage, setNavPage] = useState<NavPage>('startseite');
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
    if (width < 360) return 40;
    if (width < 480) return 50;
    if (width < 768) return 60;
    return 80;
  };

  // Build tabs from plan — fleet tab only for Business
  const tabs = fleetUnlocked
    ? [...BASE_TABS.slice(0, 2), FLEET_TAB, ...BASE_TABS.slice(2)]
    : BASE_TABS;

  const appStoreUrl = import.meta.env.VITE_APP_STORE_URL || 'https://apps.apple.com/';
  const playStoreUrl = import.meta.env.VITE_PLAY_STORE_URL || 'https://play.google.com/store/apps';

  // If fleet tab was unlocked and the fleet tab is removed, go back to main
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

  // If fleet tab was unlocked and the fleet tab is removed, go back to main
  useEffect(() => {
    if (!fleetUnlocked && tab === 'fleet') {
      setTab('main');
    }
  }, [fleetUnlocked, tab]);

  // PlanGate dispatches this event to open the UpgradeModal without prop drilling
  useEffect(() => {
    const handler = () => setIsUpgradeModalOpen(true);
    window.addEventListener('wattai:open-upgrade', handler);
    return () => window.removeEventListener('wattai:open-upgrade', handler);
  }, []);

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
      {/* For non-dashboard pages: render the page, hide header/tabs */}
      {navPage !== 'home' ? (
        <>
          {navPage === 'startseite' && (
            <StartPage
              onNavigate={(p) => setNavPage(p)}
              onAuthClick={() => setIsAuthModalOpen(true)}
              onUpgradeClick={() => setIsUpgradeModalOpen(true)}
            />
          )}
          {navPage === 'produkte' && <ProduktePage onUpgradeClick={() => setIsUpgradeModalOpen(true)} />}
          {navPage === 'about' && <AboutPage />}
          {navPage === 'kontakt' && <KontaktPage />}
          <AppFooter />
        </>
      ) : (
        <TabContext.Provider value={{
          tab,
          setTab,
          tabs,
          isLoggedIn,
          onAuthClick: () => setIsAuthModalOpen(true),
          planTitle: plan.title,
          planColor: plan.color,
        }}>
          <>
          <section style={{
            minHeight: 'max(420px, calc(100dvh - 120px))',
            width: '100%',
            maxWidth: '100%',
            margin: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            flexDirection: 'column',
          }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
              {tabs.find(t => t.key === tab)?.component}
            </div>
          </section>
          <AppFooter />
          </>
        </TabContext.Provider>
      )}
    </div>
    {/* End appContentRef div */}

    {/* Floating Bottom-Right Widget: Upgrade + App Store */}
    {(showBanner || plan.id !== 'business') && (
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
        {plan.id !== 'business' && (
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="ui-focusable"
            style={{
              background: plan.id === 'free'
                ? 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 100%)'
                : 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)',
              color: '#fff',
              borderRadius: 999,
              border: `1px solid ${plan.id === 'free' ? 'rgba(103,232,249,0.45)' : 'rgba(167,139,250,0.45)'}`,
              padding: isMobile ? '0.45rem 0.9rem' : '0.52rem 1.1rem',
              fontWeight: 700,
              fontSize: isMobile ? 12 : 13,
              cursor: 'pointer',
              boxShadow: plan.id === 'free'
                ? '0 6px 24px rgba(6,182,212,0.4)'
                : '0 6px 24px rgba(139,92,246,0.4)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⚡</span>
            {isMobile
              ? 'Upgrade'
              : plan.id === 'free'
                ? 'Auf Pro upgraden'
                : 'Auf Business upgraden'}
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
      currentPlan={plan.title}
      onClose={() => setIsUpgradeModalOpen(false)}
      onSelectPlan={() => setIsUpgradeModalOpen(false)}
    />

    {/* DSGVO-konformer Cookie-Hinweis */}
    <CookieConsent />
  </div>
  );
}
