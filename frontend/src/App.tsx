import { useEffect, useRef, useState, type ReactElement } from "react";
import Dashboard from "./components/Dashboard";
import EVDashboard from "./components/EVDashboard";
import HouseholdDashboard from "./components/HouseholdDashboard";
import KIDashboard from "./components/KIDashboard";
import FleetManagementTab from "./components/FleetManagementTab";
import LegalFooter from "./components/LegalFooter";
import UpgradeModal from "./components/UpgradeModal";
import {
  resolveFeatureFlags,
} from "./config/featureFlags";
import "./styles/styles.css";

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
  <div className="main-app" style={{ minHeight: '100vh', width: '100vw', overflow: 'auto' }}>
    <div ref={appContentRef}>
      <header style={{textAlign:'center',marginBottom:'1.5rem',width:'100vw',maxWidth:'100%',overflow:'hidden', position:'relative'}}>
      <img src="/EMS-logo-plattform.png" alt="WattAI Logo" style={{width:'100vw',maxWidth:'100%',height:'75vh',objectFit:'cover',marginBottom:8,display:'block'}} />
      <div style={{position:'absolute',left:'50%',top:'12%',transform:'translateX(-50%)',color:'#f9fafb',textShadow:'0 2px 8px rgba(15,23,42,0.9)',padding:'0.75rem 1.5rem',borderRadius:999,background:'rgba(15,23,42,0.65)'}}>
        <div style={{fontSize:'1.4rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>WattAI</div>
        <div style={{fontSize:'0.9rem',marginTop:2}}>KI-basiertes Smart Charging & Energiemanagement</div>
      </div>
      </header>
        <nav style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                margin: '0 0.5rem',
                padding: '0.5rem 1.2rem',
                borderRadius: 6,
                border: tab === t.key ? '2px solid #1976d2' : '1px solid #ccc',
                background: tab === t.key ? '#e3f2fd' : '#fff',
                color: '#111',
                cursor: 'pointer',
                fontWeight: tab === t.key ? 'bold' : 'normal',
              }}
            >
              {t.label}
            </button>
          ))}
          </div>
          {!fleetEnabled && (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              style={{
                textDecoration: 'none',
                background: '#0f766e',
                color: '#fff',
                borderRadius: 999,
                padding: '0.45rem 1rem',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Upgrade: Flottenmanagement freischalten
            </button>
          )}
          <span style={{ color: '#334155', fontSize: 13, marginLeft: 'auto' }}>
            Aktueller Plan: <b>{planLabel}</b>
          </span>
        </nav>
        <section style={{ minHeight: 'calc(100vh - 260px)', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'stretch', flexDirection: 'column' }}>
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
