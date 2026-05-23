import { useEffect, useState } from 'react';
import BatteryWidget from './BatteryWidget';
import PlanGate from './PlanGate';
import SmartMeterEnergyWidget from './SmartMeterEnergyWidget';

const API_URL = import.meta.env.VITE_API_URL || '';
const WS_URL = import.meta.env.VITE_WS_URL || '';

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
`;

interface SysState { grid_power?: number; pv_power?: number; battery_soc?: number; home_power?: number; battery_power_kw?: number; battery_capacity_kwh?: number; }

const HouseholdDashboard = () => {
  const [state, setState] = useState<SysState>({});

  useEffect(() => {
    // Try both /ws and bare WS_URL
    let ws: WebSocket;
    try {
      const url = WS_URL ? (WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`) : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
      ws = new WebSocket(url);
      ws.onmessage = e => { try { setState(JSON.parse(e.data)); } catch {} };
      ws.onerror = () => { /* silent */ };
    } catch { return; }
    return () => { try { ws.close(); } catch {} };
  }, []);

  const iotNodes = [
    { label:'Heizung',   x:48,  y:82,  c:'#ff6b35' },
    { label:'Licht',     x:152, y:82,  c:'#ff9500' },
    { label:'Waschm.',   x:48,  y:130, c:'#3b82f6' },
    { label:'Kühl.',     x:152, y:130, c:'#22c55e' },
    { label:'Steckd.',   x:100, y:155, c:'#a78bfa' },
  ];

  return (
    <div style={{ background:'transparent', paddingBottom:48, width:'100%' }}>
      <style>{WAI}</style>

      {/* ── 4K CINEMATIC HEADER ─────────────────────────────────────────── */}
      <div style={{ position:'relative', width:'100%', minHeight:'clamp(260px,30vw,360px)', overflow:'hidden', background:'linear-gradient(160deg,#020617 0%,#04060e 100%)', borderBottom:'1px solid rgba(255,107,53,0.1)', marginBottom:32 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', zIndex:3 }}/>
        <div style={{ position:'absolute', top:'-30%', left:'-5%', width:'55%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,53,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'-30%', right:'-5%', width:'45%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(30,64,175,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.18),transparent)', animation:'wai-scan 22s linear infinite', pointerEvents:'none', zIndex:2 }}/>
        {[0,1,2,3,4].map(i=>(
          <div key={i} style={{ position:'absolute', width:1.5, height:1.5, borderRadius:'50%', left:`${(i*43+9)%100}%`, top:`${(i*71+13)%100}%`, background:i%2===0?'#ff6b35':'#3b82f6', animation:`wai-drift ${32+(i%5)*4}s ease-in-out ${i*2.2}s infinite`, opacity:0.16, pointerEvents:'none' }}/>
        ))}

        {/* Smart home SVG (SmartHomeVisual port) */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'60%', opacity:0.88 }}>
          <svg viewBox="0 0 200 180" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <filter id="hh-glow"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
              <linearGradient id="hh-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b35" stopOpacity="0.7"/><stop offset="100%" stopColor="#1e40af" stopOpacity="0.5"/></linearGradient>
            </defs>
            {/* House walls */}
            <rect x="55" y="70" width="90" height="75" fill="rgba(22,30,65,0.82)" stroke="rgba(255,107,53,0.4)" strokeWidth="1.2"/>
            {/* Roof */}
            <polygon points="45,70 100,28 155,70" fill="url(#hh-roof)" stroke="rgba(255,107,53,0.5)" strokeWidth="1"/>
            {/* Central hub (inside house) */}
            <circle cx="100" cy="107" r="11" fill="rgba(22,30,65,0.88)" stroke="rgba(255,107,53,0.8)" strokeWidth="1.5" filter="url(#hh-glow)">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
            </circle>
            <text x="100" y="110" textAnchor="middle" fill="#ff9500" fontSize="6" fontFamily="monospace" fontWeight="bold">HUB</text>
            {/* Windows */}
            <rect x="66" y="80" width="20" height="16" rx="2" fill="rgba(255,149,0,0.08)" stroke="rgba(255,149,0,0.35)" strokeWidth="0.8">
              <animate attributeName="fill" values="rgba(255,149,0,0.08);rgba(255,149,0,0.18);rgba(255,149,0,0.08)" dur="5s" repeatCount="indefinite"/>
            </rect>
            <rect x="114" y="80" width="20" height="16" rx="2" fill="rgba(255,149,0,0.08)" stroke="rgba(255,149,0,0.35)" strokeWidth="0.8">
              <animate attributeName="fill" values="rgba(255,149,0,0.08);rgba(255,149,0,0.18);rgba(255,149,0,0.08)" dur="5s" begin="1.2s" repeatCount="indefinite"/>
            </rect>
            {/* Door */}
            <rect x="87" y="115" width="26" height="30" rx="2" fill="rgba(30,64,175,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8"/>
            {/* IoT nodes outside */}
            {iotNodes.map(({label,x,y,c})=>(
              <g key={label}>
                <line x1="100" y1="107" x2={x} y2={y} stroke={`${c}25`} strokeWidth="1" strokeDasharray="3 3"/>
                <circle cx={x} cy={y} r="11" fill="rgba(22,30,65,0.88)" stroke={c} strokeWidth="1.2" filter="url(#hh-glow)"/>
                <text x={x} y={y+3} textAnchor="middle" fill={c} fontSize="5.5" fontFamily="monospace">{label.slice(0,5)}</text>
                <circle r="2" fill={c} opacity="0.9">
                  <animateMotion dur="3.5s" repeatCount="indefinite" path={`M100,107 L${x},${y}`}/>
                  <animate attributeName="opacity" values="0;1;0" dur="3.5s" repeatCount="indefinite"/>
                </circle>
              </g>
            ))}
            <text x="100" y="175" textAnchor="middle" fill="rgba(255,149,0,0.4)" fontSize="6.5" fontFamily="monospace">SmartHome · {(state.home_power??0).toFixed(1)} kW Verbrauch</text>
          </svg>
        </div>

        {/* Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(28px,4vw,52px) clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', gap:16, maxWidth:'clamp(260px,46%,520px)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.28)', borderRadius:999, padding:'6px 16px', width:'fit-content', backdropFilter:'blur(12px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#ff6b35', boxShadow:'0 0 8px rgba(255,107,53,0.7)', display:'inline-block', animation:'wai-breathe 4s ease-in-out infinite' }}/>
            <span style={{ fontSize:10, color:'rgba(255,149,0,0.9)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700 }}>Haushalt · Heimspeicher · IoT</span>
          </div>
          <h1 style={{ fontSize:'clamp(26px,3.8vw,52px)', fontWeight:900, lineHeight:1.06, letterSpacing:'-0.03em', margin:0, background:'linear-gradient(135deg,#fff5f0 0%,#ff9500 40%,#ff6b35 65%,#3b82f6 100%)', backgroundSize:'300% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'wai-shimmer 9s linear infinite' }}>
            Haushalt &<br/>Heimspeicher
          </h1>
          <p style={{ margin:0, fontSize:'clamp(13px,1.4vw,15px)', color:'rgba(248,250,252,0.5)', lineHeight:1.8 }}>Intelligente Hausautomation, Verbrauchsoptimierung und Heimspeicher-Management in Echtzeit.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
            <button type="button" className="wai-btn-o" style={{ background:'linear-gradient(90deg,#ff6b35,#ff9500)', color:'#0a0305', border:'none', borderRadius:999, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 32px rgba(255,107,53,0.32)', animation:'wai-glow-o 5s ease-in-out infinite' }}>Automationen</button>
            <button type="button" className="wai-btn-g" style={{ background:'transparent', color:'rgba(255,149,0,0.9)', border:'1px solid rgba(255,107,53,0.32)', borderRadius:999, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', backdropFilter:'blur(12px)' }}>Geräte verwalten</button>
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:4 }}>
            {[
              { label:'PV', value:`${(state.pv_power??0).toFixed(1)} kW`, c:'#ff9500' },
              { label:'Netz', value:`${(state.grid_power??0).toFixed(1)} kW`, c:'#3b82f6' },
              { label:'Speicher', value:`${state.battery_soc??0} %`, c:'#22c55e' },
            ].map(({label,value,c})=>(
              <div key={label} style={{ background:`${c}08`, border:`1px solid ${c}20`, borderRadius:10, padding:'8px 14px', minWidth:80 }}>
                <div style={{ fontSize:9, color:`${c}80`, letterSpacing:'0.15em', textTransform:'uppercase' }}>{label}</div>
                <div style={{ fontSize:16, fontWeight:800, color:c, fontFamily:'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div aria-hidden="true" style={{ position:'absolute', zIndex:1, top:'50%', left:'50%', width:460, height:460, marginTop:-230, marginLeft:-230, borderRadius:'50%', border:'1px solid rgba(59,130,246,0.05)', animation:'wai-spin-slow 70s linear infinite', pointerEvents:'none' }}/>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)', display:'flex', flexDirection:'column', gap:16 }}>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.7)', marginBottom:18 }}>Smart Meter & Verbrauch</div>
            <SmartMeterEnergyWidget/>
          </div>
        </div>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(34,197,94,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#22c55e,#ff9500)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(34,197,94,0.7)', marginBottom:18 }}>Heimspeicher</div>
            <BatteryWidget data={{ soc: state.battery_soc ?? 0, power_kw: state.battery_power_kw ?? 0, capacity_kwh: state.battery_capacity_kwh ?? 10 }}/>
          </div>
        </div>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#ff9500)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(59,130,246,0.7)', marginBottom:18 }}>Hausautomation</div>
            <PlanGate feature="smarthome.automation" featureName="Hausautomation" requiredPlan="pro">
              <p style={{ margin:0, color:'rgba(248,250,252,0.4)', fontSize:13 }}>Automations-Features werden hier geladen…</p>
            </PlanGate>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdDashboard;
