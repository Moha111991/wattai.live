import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from "react";
import Dashboard from "./components/Dashboard";
import EVDashboard from "./components/EVDashboard";
import HouseholdDashboard from "./components/HouseholdDashboard";
import KIDashboard from "./components/KIDashboard";
import FleetManagementTab from "./components/FleetManagementTab";
import LegalFooter from "./components/LegalFooter";
import UpgradeModal from "./components/UpgradeModal";
import WattAILogo from "./components/WattAILogo";
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
  const appContentRef = useRef<HTMLDivElement | null>(null);

  const tabs = fleetEnabled
    ? [...BASE_TABS.slice(0, 2), FLEET_TAB, ...BASE_TABS.slice(2)]
    : BASE_TABS;

  const isDashboardTab = tab === 'main';
  const appStoreUrl = import.meta.env.VITE_APP_STORE_URL || 'https://apps.apple.com/';
  const playStoreUrl = import.meta.env.VITE_PLAY_STORE_URL || 'https://play.google.com/store/apps';
  const headerImageSrc = tab === 'ev'
    ? '/wattai.ive-eauto.png'
    : tab === 'house'
      ? '/wattai.live-smarthome.png'
      : tab === 'ki'
        ? '/wattai.live-KI.png'
      : '/wattai.live-dashboard.png';

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
    padding: 'clamp(10px, 1.6vw, 20px) clamp(10px, 2.4vw, 30px)',
    boxSizing: 'border-box',
  };

  const headerStyle: CSSProperties = {
    textAlign: 'center',
    marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    padding: 0,
    lineHeight: 0,
    borderRadius: 'clamp(16px, 2.2vw, 22px)',
    border: '1px solid rgba(103, 232, 249, 0.28)',
    boxShadow: '0 16px 44px rgba(2, 6, 23, 0.45)',
    backgroundImage: 'url(/wattai.live-header-bg.svg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const headerImageFrameStyle: CSSProperties = {
    width: '100%',
    height: 'var(--tab-header-image-height)',
    position: 'relative',
    borderRadius: 'inherit',
    overflow: 'hidden',
    background: '#020617',
    lineHeight: 0,
  };

  const headerImageStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 18%',
    display: 'block',
    borderRadius: 'inherit',
    filter: 'saturate(1.07) contrast(1.04)',
  };

  const headerOverlayStyle: CSSProperties = {
    position: 'absolute',
    left: '50%',
    bottom: 'clamp(10px, 2.2vw, 18px)',
    transform: 'translateX(-50%)',
    width: 'min(92%, 620px)',
    color: '#ecfeff',
    textShadow: '0 2px 10px rgba(15,23,42,0.9)',
    padding: 'clamp(0.62rem, 1.8vw, 0.8rem) clamp(0.9rem, 2.4vw, 1.35rem)',
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(2,6,23,0.78) 0%, rgba(2,6,23,0.58) 100%)',
    border: '1px solid rgba(103,232,249,0.25)',
    backdropFilter: 'blur(5px)',
    lineHeight: 1.2,
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  const headerOverlayTitleStyle: CSSProperties = {
    fontSize: 'clamp(1rem, 2.3vw, 1.22rem)',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
  };

  const headerOverlaySubtitleStyle: CSSProperties = {
    fontSize: 'clamp(0.74rem, 1.65vw, 0.9rem)',
    marginTop: 4,
    opacity: 0.98,
    lineHeight: 1.35,
  };

  const navStyle: CSSProperties = {
    marginBottom: 'clamp(1rem, 1.8vw, 1.4rem)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'clamp(8px, 1.6vw, 14px)',
  };

  const appHintBannerStyle: CSSProperties = {
    width: '100%',
    marginBottom: 10,
    borderRadius: 16,
    border: '1px solid rgba(125, 211, 252, 0.35)',
    background: 'linear-gradient(110deg, rgba(14,165,233,0.16) 0%, rgba(20,184,166,0.14) 100%)',
    color: '#e0f2fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'clamp(8px, 1.6vw, 12px)',
    flexWrap: 'wrap',
    padding: 'clamp(0.62rem, 1.4vw, 0.78rem) clamp(0.78rem, 1.8vw, 1rem)',
    boxSizing: 'border-box',
    boxShadow: '0 10px 24px rgba(2,6,23,0.25)',
  };

  const appHintTextStyle: CSSProperties = {
    fontSize: 13,
    lineHeight: 1.35,
    color: '#dbeafe',
    fontWeight: 600,
    flex: '1 1 240px',
    minWidth: 'var(--tab-grid-compact-min)',
  };

  const appHintActionsStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flex: '1 1 260px',
  };

  const appStoreButtonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    background: 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)',
    color: '#f8fafc',
    borderRadius: 999,
    padding: '0.52rem 1rem',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.02em',
    border: '1px solid rgba(165,243,252,0.45)',
    boxShadow: '0 8px 18px rgba(20,184,166,0.25)',
    whiteSpace: 'nowrap',
    minHeight: 40,
  };

  const playStoreButtonStyle: CSSProperties = {
    ...appStoreButtonStyle,
    background: 'linear-gradient(90deg, #22c55e 0%, #14b8a6 100%)',
    border: '1px solid rgba(167,243,208,0.45)',
    boxShadow: '0 8px 18px rgba(34,197,94,0.2)',
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
        <div style={headerImageFrameStyle}>
          {/* WattAI Logo Overlay - Unten Rechts */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 10,
            background: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '12px 20px',
            border: '1px solid rgba(103, 232, 249, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          } as CSSProperties}>
            <WattAILogo size={100} animated={true} variant="full" />
          </div>
          
          <img src={headerImageSrc} alt="WattAI Header" style={headerImageStyle} />
          {!isDashboardTab && (
            <div style={headerOverlayStyle}>
              <div style={headerOverlayTitleStyle}>WattAI</div>
              <div style={headerOverlaySubtitleStyle}>KI-basiertes Smart Charging & Energiemanagement</div>
            </div>
          )}
        </div>
      </header>
        <nav style={navStyle}>
          <div style={appHintBannerStyle}>
            <span style={appHintTextStyle}>📱 Für das beste Erlebnis im Browser: Lade die App-Version für iOS oder Android herunter.</span>
            <div style={appHintActionsStyle}>
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-focusable"
                style={appStoreButtonStyle}
                aria-label="WattAI im Apple App Store herunterladen"
              >
                iOS · App Store
              </a>
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-focusable"
                style={playStoreButtonStyle}
                aria-label="WattAI im Google Play Store herunterladen"
              >
                Android · Google Play
              </a>
            </div>
          </div>
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
      <UpgradeModal
        open={isUpgradeModalOpen}
        currentPlan={planLabel}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </div>
  );
}
