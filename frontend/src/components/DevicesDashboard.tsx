import { ReactElement, useEffect, useRef, useState } from 'react';
import TabHeader from './TabHeader';
import DeviceManager from './DeviceManager';

const API_URL = import.meta.env.VITE_API_URL || '';

const WAI = `
  @keyframes wai-breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
  @keyframes wai-shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
  @keyframes wai-drift{0%,100%{transform:translateY(0) translateX(0)}40%{transform:translateY(-22px) translateX(12px)}70%{transform:translateY(10px) translateX(-8px)}}
  @keyframes wai-scan{0%{top:-2px}100%{top:100%}}
  @keyframes wai-glow-o{0%,100%{box-shadow:0 0 30px rgba(255,107,53,.25)}50%{box-shadow:0 0 70px rgba(255,107,53,.55)}}
  @keyframes wai-spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .wai-btn-o{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-o:hover{filter:brightness(1.18)!important;transform:translateY(-3px) scale(1.02)!important}
  .wai-btn-g{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-g:hover{background:rgba(255,107,53,.08)!important;border-color:rgba(255,107,53,.45)!important;transform:translateY(-2px)!important}
  .wai-card{transition:border-color .8s ease,box-shadow .8s ease!important}
  .wai-card:hover{border-color:rgba(255,107,53,.3)!important;box-shadow:0 16px 48px rgba(255,107,53,.07)!important}
  @keyframes wai-pulse-ring{0%{r:18;opacity:0.3}100%{r:36;opacity:0}}
`;

interface Device { id: string; name: string; type: string; status: string; }

const DevicesDashboard = (): ReactElement => {
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/devices`).then(r=>r.json()).then(d=>setDevices(Array.isArray(d)?d:[])).catch(()=>{});
  }, []);

  const nodes = [
    { label:'METER', angle:270, color:'#ff6b35' },
    { label:'PV',    angle:0,   color:'#ff9500' },
    { label:'BAT',   angle:90,  color:'#22c55e' },
    { label:'EV',    angle:180, color:'#3b82f6' },
  ];

  return (
    <div style={{ background:'transparent', paddingBottom:48, width:'100%' }}>
      <style>{WAI}</style>

      <TabHeader
        badge="Geräteverwaltung · MQTT/TLS"
        title={['Geräteverwaltung', '& Netzwerk']}
        subtitle="Echtzeitverwaltung aller Energiegeräte via MQTT über TLS mit zertifikatsbasierter Authentifizierung."
        accentColor="#ff6b35"
        gradientFrom="#ff6b35"
        gradientTo="#a855f7"
        tags={[['MQTT/TLS','#ff9500'],['ISO 21434','#a855f7'],['Echtzeit','#22c55e'],['Zero-Trust','#3b82f6']]}
        stats={[
          { label:'Geräte', value:String(devices.length), unit:'online', color:'#22c55e', icon:'📡' },
          { label:'MQTT', value:'TLS 1.3', unit:'', color:'#ff9500', icon:'🔐' },
          { label:'Latenz', value:'12', unit:'ms', color:'#3b82f6', icon:'⚡' },
        ]}
        ticker={[
          { label:'Geräte', value:`${devices.length} online`, color:'#22c55e' },
          { label:'MQTT', value:'TLS gesichert', color:'#ff9500' },
          { label:'Latenz', value:'12 ms', color:'#3b82f6' },
          { label:'ISO 21434', value:'konform', color:'#a855f7' },
          { label:'Zero-Trust', value:'aktiv', color:'#ff6b35' },
        ]}
        visual={
          <svg viewBox="0 0 200 180" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <filter id="dev-glow"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
            </defs>
            {[40,80,120,160].map(x=><line key={x} x1={x} y1="20" x2={x} y2="155" stroke="rgba(255,107,53,0.06)" strokeWidth="0.5"/>)}
            {[50,90,130].map(y=><line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(255,107,53,0.06)" strokeWidth="0.5"/>)}
            <circle cx="100" cy="90" r="18" fill="rgba(22,30,65,0.88)" stroke="rgba(255,107,53,0.5)" strokeWidth="1.5"/>
            <circle cx="100" cy="90" r="18" fill="none" stroke="rgba(255,107,53,0.25)" strokeWidth="28">
              <animate attributeName="r" values="18;40" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.25;0" dur="3s" repeatCount="indefinite"/>
            </circle>
            <text x="100" y="93" textAnchor="middle" fill="#ff9500" fontSize="7" fontFamily="monospace" fontWeight="bold">HUB</text>
            {nodes.map(({label,angle,color})=>{
              const rad = (angle-90)*Math.PI/180;
              const nx = 100+62*Math.cos(rad);
              const ny = 90+62*Math.sin(rad);
              const pathId = `dev-path-${label}`;
              return (
                <g key={label}>
                  <path id={pathId} d={`M 100 90 L ${nx} ${ny}`} fill="none"/>
                  <line x1="100" y1="90" x2={nx} y2={ny} stroke={`${color}30`} strokeWidth="1.2"/>
                  <circle cx={nx} cy={ny} r="14" fill="rgba(22,30,65,0.88)" stroke={color} strokeWidth="1.5"/>
                  <text x={nx} y={ny+3} textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace" fontWeight="bold">{label}</text>
                  <circle r="3" fill={color} filter="url(#dev-glow)" opacity="0.9">
                    <animateMotion dur="3s" repeatCount="indefinite"><mpath xlinkHref={`#${pathId}`}/></animateMotion>
                    <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/>
                  </circle>
                </g>
              );
            })}
            <text x="100" y="178" textAnchor="middle" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">MQTT · TLS 1.3 · ISO 21434</text>
          </svg>
        }
      />


      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)' }}>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.7)', marginBottom:18 }}>Geräte & Adapter</div>
            <DeviceManager/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevicesDashboard;
