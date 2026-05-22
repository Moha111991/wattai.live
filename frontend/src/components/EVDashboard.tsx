import '../styles/ev-dashboard.css';
import ElektroautoV2H from './ElektroautoV2H';
import EVChargeControl from './EVChargeControl';
import PlanGate from './PlanGate';

const EVDashboard = () => {
  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '0 0 40px', background: 'transparent' }}>
      <style>{`
        @keyframes ev-charge { 0%{height:4px;y:68px}100%{height:28px;y:44px} }
        @keyframes cable-pulse { 0%,100%{stroke-opacity:.4}50%{stroke-opacity:1} }
        @keyframes ev-glow { 0%,100%{filter:drop-shadow(0 0 4px #ff6b35)}50%{filter:drop-shadow(0 0 12px #ff9500)} }
      `}</style>

      {/* Cinematic Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* EV SVG Scene */}
        <div style={{ flexShrink: 0 }}>
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none" style={{ animation: 'ev-glow 3s ease-in-out infinite' }}>
            {/* Road */}
            <rect x="0" y="82" width="160" height="4" rx="2" fill="rgba(255,107,53,0.08)"/>
            {/* Car body */}
            <rect x="20" y="58" width="100" height="28" rx="8" fill="rgba(4,6,20,0.9)" stroke="rgba(255,107,53,0.5)" strokeWidth="1.5"/>
            {/* Cabin */}
            <path d="M38 58 Q50 38 82 38 Q100 38 108 58Z" fill="rgba(4,6,20,0.8)" stroke="rgba(255,107,53,0.3)" strokeWidth="1.2"/>
            {/* Windows */}
            <rect x="48" y="42" width="24" height="16" rx="3" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
            <rect x="76" y="42" width="24" height="16" rx="3" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
            {/* Wheels */}
            <circle cx="45" cy="86" r="9" fill="rgba(4,6,20,0.9)" stroke="rgba(255,107,53,0.4)" strokeWidth="2"/>
            <circle cx="45" cy="86" r="4" fill="rgba(255,107,53,0.2)"/>
            <circle cx="105" cy="86" r="9" fill="rgba(4,6,20,0.9)" stroke="rgba(255,107,53,0.4)" strokeWidth="2"/>
            <circle cx="105" cy="86" r="4" fill="rgba(255,107,53,0.2)"/>
            {/* Charge port */}
            <rect x="118" y="64" width="6" height="10" rx="2" fill="rgba(59,130,246,0.5)"/>
            {/* Charging cable */}
            <path d="M124 69 Q140 69 140 50 L148 50" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 3" fill="none" style={{ animation: 'cable-pulse 1.5s ease-in-out infinite' }}/>
            {/* Charging station */}
            <rect x="148" y="38" width="10" height="30" rx="3" fill="rgba(4,6,20,0.9)" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5"/>
            {/* SOC bar */}
            <rect x="150" y="68" width="6" height="28" rx="2" fill="rgba(59,130,246,0.1)" transform="rotate(180,153,72)"/>
            <rect x="150" y="44" width="6" height="4" rx="1" fill="rgba(59,130,246,0.6)">
              <animate attributeName="height" values="4;18;4" dur="3s" repeatCount="indefinite"/>
            </rect>
            {/* Lightning bolt */}
            <text x="151" y="60" fontSize="8" fill="#ff9500">⚡</text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff9500', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Elektroauto</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            Intelligente Ladesteuerung
          </h2>
          <p style={{ margin: 0, color: 'rgba(248,250,252,0.52)', fontSize: 14, lineHeight: 1.5 }}>
            V2H/V2G Integration und Echtzeit-Monitoring für Ihr Elektrofahrzeug.
          </p>
        </div>
      </div>

      {/* EV Charge Control */}
      <div style={{
        background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)',
        borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px', marginBottom: 16,
      }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', borderRadius: 2, marginBottom: 20 }}/>
        <EVChargeControl />
      </div>

      {/* V2H Integration */}
      <div style={{
        background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px',
      }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#3b82f6,#ff9500)', borderRadius: 2, marginBottom: 20 }}/>
        <PlanGate feature="v2h_v2g.strategies" featureName="V2H / V2G-Strategien" requiredPlan="pro">
          <ElektroautoV2H />
        </PlanGate>
      </div>
    </div>
  );
};

export default EVDashboard;
