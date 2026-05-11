import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import Dashboard from "./components/Dashboard";
import EVDashboard from "./components/EVDashboard";
import DevicesDashboard from "./components/DevicesDashboard";
import HouseholdDashboard from "./components/HouseholdDashboard";
import KIDashboard from "./components/KIDashboard";
import FleetManagementTab from "./components/FleetManagementTab";
import LegalFooter from "./components/LegalFooter";
import UpgradeModal from "./components/UpgradeModal";
import WattAILogo from "./components/WattAILogo";
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

  const appHintBannerStyle: CSSProperties = {
    width: '100%',
    marginBottom: 6,
    borderRadius: 10,
    border: '1px solid rgba(125, 211, 252, 0.28)',
    background: 'linear-gradient(110deg, rgba(14,165,233,0.12) 0%, rgba(20,184,166,0.10) 100%)',
    color: '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: isMobile ? 4 : 'clamp(4px, 1vw, 8px)',
    flexWrap: 'nowrap' as const,
    padding: isMobile ? '0.22rem 0.5rem' : '0.32rem clamp(0.5rem, 1.2vw, 0.7rem)',
    boxSizing: 'border-box',
    boxShadow: '0 4px 12px rgba(2,6,23,0.18)',
    overflow: 'hidden',
  };

  const appHintTextStyle: CSSProperties = {
    fontSize: isMobile ? 10 : 11,
    lineHeight: 1.3,
    color: '#bae6fd',
    fontWeight: 500,
    flex: '1 1 0',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: isMobile ? 'nowrap' : 'normal',
  };

  const appHintActionsStyle: CSSProperties = {
    display: 'flex',
    gap: isMobile ? 4 : 6,
    flexWrap: 'nowrap' as const,
    alignItems: 'center',
    flexShrink: 0,
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

  const tabsWrapStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 'clamp(8px, 1.4vw, 12px)',
  };

  const actionRowStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(8px, 1.4vw, 12px)',
    flexWrap: 'wrap',
  };

  const sectionStyle: CSSProperties = {
    minHeight: 'max(420px, calc(100dvh - 260px))',
    width: '100%',
    maxWidth: '100%',
    margin: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 10,
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
    <div ref={appContentRef} style={appContentStyle}>
      <header style={headerStyle}>
        <div style={{ position: 'relative', width: '100%' }}>
          {/* WattAI Logo Overlay - Top Left - Responsive */}
          <div 
            className="logo-overlay-card"
            style={{
              position: 'absolute',
              top: 'clamp(10px, 2vw, 20px)',
              left: 'clamp(10px, 2vw, 20px)',
              zIndex: 10,
              background: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 'clamp(12px, 2vw, 20px)',
              padding: 'clamp(8px, 1.5vw, 16px) clamp(12px, 2vw, 24px)',
              border: '1px solid rgba(103, 232, 249, 0.25)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            } as CSSProperties}>
            <WattAILogo 
              size={getLogoSize()} 
              animated={!isMobile} 
              variant="full" 
            />
          </div>
          
          {/* Full-Width Header - No Frame */}
          {renderHeaderComponent()}
        </div>
      </header>
        
        {/* Main Content Container with Padding */}
        <div style={{
          padding: 'clamp(10px, 1.6vw, 20px) clamp(10px, 2.4vw, 30px)',
          boxSizing: 'border-box',
        }}>
          <nav style={navStyle}>
          {showBanner && <div style={appHintBannerStyle}>
            <span style={appHintTextStyle}>
              {isMobile ? '📱 App für iOS & Android' : '📱 Für das beste Erlebnis im Browser: Lade die App-Version für iOS oder Android herunter.'}
            </span>
            <div style={appHintActionsStyle}>
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-focusable"
                style={appStoreButtonStyle}
                aria-label="WattAI im Apple App Store herunterladen"
              >
                {isMobile ? '🍎 iOS' : 'iOS · App Store'}
              </a>
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-focusable"
                style={playStoreButtonStyle}
                aria-label="WattAI im Google Play Store herunterladen"
              >
                {isMobile ? '🤖 Android' : 'Android · Google Play'}</a>
              <button
                onClick={() => setShowBanner(false)}
                aria-label="Banner schließen"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: isMobile ? 14 : 16,
                  padding: '2px 4px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              </button>
            </div>
          </div>}
          <div style={tabsWrapStyle}>
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
          <div style={actionRowStyle}>
            {!fleetEnabled && (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="ui-focusable"
                style={{
                  textDecoration: 'none',
                  background: 'linear-gradient(90deg, #0f766e 0%, #14b8a6 100%)',
                  color: '#f8fafc',
                  borderRadius: 999,
                  padding: '0.52rem 1rem',
                  fontWeight: 700,
                  fontSize: 13,
                  minHeight: 40,
                  border: '1px solid rgba(167,243,208,0.42)',
                  cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(15,118,110,0.35)',
                }}
              >
                Upgrade: Flottenmanagement freischalten
              </button>
            )}
            <span style={{ color: '#cbd5e1', fontSize: 13, padding: '0.35rem 0.8rem', borderRadius: 999, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.5)' }}>
              Aktueller Plan: <b style={{ color: '#67e8f9' }}>{planLabel}</b>
            </span>
          </div>
        </nav>
        <section style={sectionStyle}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {tabs.find(t => t.key === tab)?.component}
          </div>
          <LegalFooter />
        </section>
        </div>
        {/* End Main Content Container */}
    </div>
      <UpgradeModal
        open={isUpgradeModalOpen}
        currentPlan={planLabel}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
