import { ReactElement, useEffect, useState } from 'react';
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

      {/* ── 4K CINEMATIC HEADER ─────────────────────────────────────────── */}
      <div style={{ position:'relative', width:'100%', minHeight:'clamp(260px,30vw,360px)', overflow:'hidden', background:'linear-gradient(160deg,#020617 0%,#04060e 100%)', borderBottom:'1px solid rgba(255,107,53,0.1)', marginBottom:32 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', zIndex:3 }}/>
        <div style={{ position:'absolute', top:'-30%', left:'-5%', width:'55%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,53,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'-30%', right:'-5%', width:'45%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(30,64,175,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.18),transparent)', animation:'wai-scan 22s linear infinite', pointerEvents:'none', zIndex:2 }}/>
        {[0,1,2,3,4].map(i=>(
          <div key={i} style={{ position:'absolute', width:1.5, height:1.5, borderRadius:'50%', left:`${(i*43+9)%100}%`, top:`${(i*71+13)%100}%`, background:i%2===0?'#ff6b35':'#3b82f6', animation:`wai-drift ${32+(i%5)*4}s ease-in-out ${i*2.2}s infinite`, opacity:0.16, pointerEvents:'none' }}/>
        ))}

        {/* Device topology SVG */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'60%', opacity:0.88 }}>
          <svg viewBox="0 0 200 180" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <filter id="dev-glow"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
            </defs>
            {/* Hub */}
            <circle cx="100" cy="90" r="18" fill="rgba(4,6,20,0.9)" stroke="rgba(255,107,53,0.7)" strokeWidth="1.5" filter="url(#dev-glow)"/>
            <circle cx="100" cy="90" r="18" fill="none" stroke="rgba(255,107,53,0.4)" strokeWidth="1.5">
              <animate attributeName="r" values="18;36" dur="3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0" dur="3s" repeatCount="indefinite"/>
            </circle>
            <text x="100" y="93" textAnchor="middle" fill="#ff9500" fontSize="7" fontFamily="monospace" fontWeight="bold">EMS</text>
            {/* 4 device nodes */}
            {nodes.map(({label,angle,color})=>{
              const rad = (angle-90)*Math.PI/180;
              const nx = 100+62*Math.cos(rad);
              const ny = 90+62*Math.sin(rad);
              return (
                <g key={label}>
                  <line x1="100" y1="90" x2={nx} y2={ny} stroke={`${color}30`} strokeWidth="1.2" strokeDasharray="4 3"/>
                  <circle cx={nx} cy={ny} r="14" fill="rgba(4,6,20,0.9)" stroke={color} strokeWidth="1.5" filter="url(#dev-glow)"/>
                  <text x={nx} y={ny+3} textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace" fontWeight="bold">{label}</text>
                  {/* signal pulse */}
                  <circle r="3" fill={color} filter="url(#dev-glow)" opacity="0.9">
                    <animateMotion dur={`${3+nodes.indexOf({label,angle,color})*0.8}s`} repeatCount="indefinite" begin={`${nodes.indexOf({label,angle,color})*0.7}s`} path={`M100,90 L${nx},${ny}`}/>
                    <animate attributeName="opacity" values="0;1;1;0" dur={`${3+nodes.indexOf({label,angle,color})*0.8}s`} repeatCount="indefinite"/>
                  </circle>
                </g>
              );
            })}
            <text x="100" y="170" textAnchor="middle" fill="rgba(255,149,0,0.4)" fontSize="6.5" fontFamily="monospace">{devices.length} Geräte verbunden · MQTT · TLS</text>
          </svg>
        </div>

        {/* Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(28px,4vw,52px) clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', gap:16, maxWidth:'clamp(260px,46%,520px)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.28)', borderRadius:999, padding:'6px 16px', width:'fit-content', backdropFilter:'blur(12px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#ff6b35', boxShadow:'0 0 8px rgba(255,107,53,0.7)', display:'inline-block', animation:'wai-breathe 4s ease-in-out infinite' }}/>
            <span style={{ fontSize:10, color:'rgba(255,149,0,0.9)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700 }}>Geräteverwaltung · MQTT</span>
          </div>
          <h1 style={{ fontSize:'clamp(26px,3.8vw,52px)', fontWeight:900, lineHeight:1.06, letterSpacing:'-0.03em', margin:0, background:'linear-gradient(135deg,#fff5f0 0%,#ff9500 40%,#ff6b35 65%,#3b82f6 100%)', backgroundSize:'300% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'wai-shimmer 9s linear infinite' }}>
            Geräteverwaltung<br/>& Netzwerk
          </h1>
          <p style={{ margin:0, fontSize:'clamp(13px,1.4vw,15px)', color:'rgba(248,250,252,0.5)', lineHeight:1.8 }}>Echtzeitüberwachung aller verbundenen Geräte — Zähler, PV, Speicher und EV über MQTT/TLS.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
            <button type="button" className="wai-btn-o" style={{ background:'linear-gradient(90deg,#ff6b35,#ff9500)', color:'#0a0305', border:'none', borderRadius:999, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 32px rgba(255,107,53,0.32)', animation:'wai-glow-o 5s ease-in-out infinite' }}>Gerät hinzufügen</button>
            <button type="button" className="wai-btn-g" style={{ background:'transparent', color:'rgba(255,149,0,0.9)', border:'1px solid rgba(255,107,53,0.32)', borderRadius:999, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', backdropFilter:'blur(12px)' }}>Status prüfen</button>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
            <span style={{ fontSize:13, fontFamily:'monospace', color:'#22c55e' }}>●</span>
            <span style={{ fontSize:12, color:'rgba(248,250,252,0.4)' }}>{devices.length} Gerät{devices.length!==1?'e':''} aktiv</span>
          </div>
        </div>

        <div aria-hidden="true" style={{ position:'absolute', zIndex:1, top:'50%', left:'50%', width:460, height:460, marginTop:-230, marginLeft:-230, borderRadius:'50%', border:'1px solid rgba(59,130,246,0.05)', animation:'wai-spin-slow 70s linear infinite', pointerEvents:'none' }}/>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)' }}>
        <div className="wai-card" style={{ background:'rgba(4,6,20,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
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
