import { useEffect, useRef, useState } from 'react';
import HistoryChart from './HistoryChart';
import PowerChart from "./PowerChart";
import CO2CostWidget from './CO2CostWidget';
import ErrorAlarmMonitor from './ErrorAlarmMonitor';
import BatteryWidget from './BatteryWidget';
import AnimatedEnergyFlow from './AnimatedEnergyFlow';
import { API_URL, WS_URL } from '../lib/api';

interface RealtimeData {
  pv_power_kw: number;
  house_load_w: number;
  ev_power_w: number;
  ev_soc: number;
  grid_import_w: number;
  grid_export_w: number;
  timestamp: string;
  battery_soc?: number;
  battery_power_kw?: number;
}
interface DeviceSummary { type?: string; }

const API_BASE = API_URL;
const WS_BASE  = WS_URL;

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

export default function Dashboard() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [battery, setBattery] = useState({ soc: 50, power_kw: 0, capacity_kwh: 10 });
  const [wsStatus, setWsStatus] = useState<'connecting'|'live'|'offline'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/devices`, { headers: { 'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE', 'Content-Type': 'application/json' } })
      .then(r => r.json()).then(d => setDevices(d.devices || []));
  }, []);

  useEffect(() => {
    const connect = () => {
      if (wsRef.current) return;
      const ws = new WebSocket(WS_BASE);
      wsRef.current = ws;
      ws.onopen = () => setWsStatus('live');
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'realtime_update') {
            setData(msg);
            if (msg.battery_soc !== undefined) setBattery({ soc: msg.battery_soc, power_kw: msg.battery_power_kw, capacity_kwh: 10 });
          }
        } catch {}
      };
      ws.onerror = () => { setWsStatus('offline'); ws.close(); };
      ws.onclose = () => { setWsStatus('offline'); wsRef.current = null; if (!reconnectRef.current) { reconnectRef.current = setTimeout(connect, 3000); } };
    };
    connect();
    const poll = async () => { try { const r = await fetch(`${API_BASE}/battery/status`); if (r.ok) setBattery(await r.json()); } catch {} };
    const id = setInterval(poll, 5000); poll();
    return () => { wsRef.current?.close(); if (reconnectRef.current) clearTimeout(reconnectRef.current); clearInterval(id); };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS_BASE);
    ws.onmessage = (e) => { try { setData(JSON.parse(e.data)); } catch {} };
    return () => ws.close();
  }, []);

  if (!data) {
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#020617 0%,#04060e 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <style>{WAI}</style>
        <div style={{ textAlign:'center', background:'rgba(22,30,65,0.72)', border:'1px solid rgba(255,107,53,0.18)', borderRadius:20, padding:'48px 40px', backdropFilter:'blur(16px)' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" style={{ display:'block', margin:'0 auto 24px' }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,107,53,0.12)" strokeWidth="4"/>
            <circle cx="36" cy="36" r="30" fill="none" stroke="#ff6b35" strokeWidth="4" strokeDasharray="48 140" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 36 36" to="360 36 36" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="36" cy="36" r="10" fill="rgba(255,149,0,0.2)"><animate attributeName="r" values="8;13;8" dur="2s" repeatCount="indefinite"/></circle>
            <circle cx="36" cy="36" r="4" fill="#ff9500"/>
          </svg>
          <p style={{ color:'#f8fafc', fontSize:18, fontWeight:700, margin:'0 0 8px', letterSpacing:'-0.01em' }}>Verbinde mit Backend...</p>
          <p style={{ color:'rgba(248,250,252,0.38)', fontSize:13, margin:0 }}>WebSocket: {wsStatus}</p>
        </div>
      </div>
    );
  }

  const hasRealDevice = devices.some(d => { const t=(d.type||'').toLowerCase(); return t.includes('smart meter')||t.includes('inverter')||t.includes('battery')||t.includes('wallbox'); });

  return (
    <div style={{ background:'transparent', paddingBottom:48, width:'100%' }}>
      <style>{WAI}</style>

      {/* ── 4K CINEMATIC HEADER ─────────────────────────────────────────── */}
      <div style={{ position:'relative', width:'100%', minHeight:'clamp(260px,30vw,360px)', overflow:'hidden', background:'linear-gradient(160deg,#020617 0%,#04060e 100%)', borderBottom:'1px solid rgba(255,107,53,0.1)', marginBottom:32 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', zIndex:3 }}/>
        <div style={{ position:'absolute', top:'-30%', left:'-5%', width:'55%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,53,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'-30%', right:'-5%', width:'45%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(30,64,175,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.18),transparent)', animation:'wai-scan 22s linear infinite', pointerEvents:'none', zIndex:2 }}/>
        {[0,1,2,3,4,5].map(i=>(
          <div key={i} style={{ position:'absolute', width:1.5, height:1.5, borderRadius:'50%', left:`${(i*43+9)%100}%`, top:`${(i*71+13)%100}%`, background:i%2===0?'#ff6b35':'#3b82f6', animation:`wai-drift ${32+(i%5)*4}s ease-in-out ${i*2.2}s infinite`, opacity:0.16, pointerEvents:'none' }}/>
        ))}

        {/* Energy Ecosystem SVG */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'63%', opacity:0.85 }}>
          <svg viewBox="0 0 700 280" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <radialGradient id="db-sun" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ffde6b"/><stop offset="40%" stopColor="#ff9500" stopOpacity="0.8"/><stop offset="100%" stopColor="#ff6b35" stopOpacity="0"/></radialGradient>
              <linearGradient id="db-bat" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ff4500"/><stop offset="55%" stopColor="#ff9500"/><stop offset="100%" stopColor="#22c55e"/></linearGradient>
              <linearGradient id="db-ev-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a2060"/><stop offset="100%" stopColor="#0a1230"/></linearGradient>
              <filter id="db-glow"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
              <clipPath id="db-bc"><rect x="432" y="82" width="46" height="108" rx="4"/></clipPath>
            </defs>
            {[100,200,300,400,500,600].map(x=><line key={x} x1={x} y1="0" x2={x} y2="280" stroke="rgba(59,130,246,0.04)" strokeWidth="0.5"/>)}
            {[70,140,210].map(y=><line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(59,130,246,0.04)" strokeWidth="0.5"/>)}
            {/* SUN */}
            <circle cx="68" cy="62" r="38" fill="url(#db-sun)" opacity="0.9"><animate attributeName="r" values="38;46;38" dur="8s" repeatCount="indefinite"/></circle>
            <circle cx="68" cy="62" r="17" fill="#ffde6b"><animate attributeName="r" values="17;21;17" dur="6s" repeatCount="indefinite"/></circle>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i)=>{const r=a*Math.PI/180;return <line key={i} x1={68+Math.cos(r)*21} y1={62+Math.sin(r)*21} x2={68+Math.cos(r)*34} y2={62+Math.sin(r)*34} stroke="#ffde6b" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"><animate attributeName="opacity" values="0.65;0.15;0.65" dur={`${3+i%3}s`} begin={`${i*0.2}s`} repeatCount="indefinite"/></line>;})}
            {/* PV PANELS */}
            {[0,1,2].map(i=>{const px=14+i*62,py=152-i*14;return <g key={i}>
              <polygon points={`${px},${py} ${px+56},${py-10} ${px+56},${py+30} ${px},${py+40}`} fill="rgba(20,40,90,0.92)" stroke="rgba(30,120,180,0.55)" strokeWidth="1"/>
              <polygon points={`${px},${py} ${px+56},${py-10} ${px+60},${py-6} ${px+4},${py+4}`} fill="rgba(50,100,150,0.35)" stroke="rgba(100,180,255,0.35)" strokeWidth="0.5"/>
              <polygon points={`${px},${py} ${px+56},${py-10} ${px+56},${py+30} ${px},${py+40}`} fill="rgba(255,149,0,0.04)"><animate attributeName="fill" values="rgba(255,149,0,0.04);rgba(255,149,0,0.14);rgba(255,149,0,0.04)" dur={`${7+i*2}s`} repeatCount="indefinite"/></polygon>
              {[1,2,3].map(c=><line key={c} x1={px+c*14} y1={py-2-c*2.5} x2={px+c*14} y2={py+38-c*2.5} stroke="rgba(100,200,255,0.18)" strokeWidth="0.5"/>)}
            </g>;})}
            {/* HOUSE */}
            <rect x="258" y="128" width="112" height="112" rx="4" fill="rgba(10,16,40,0.95)" stroke="rgba(255,107,53,0.4)" strokeWidth="1.5"/>
            <polygon points="250,130 314,86 378,130" fill="rgba(10,12,30,0.9)" stroke="rgba(255,107,53,0.5)" strokeWidth="2"/>
            <rect x="270" y="145" width="28" height="22" rx="2" fill="rgba(255,149,0,0.1)" stroke="rgba(255,149,0,0.35)" strokeWidth="0.8"><animate attributeName="fill" values="rgba(255,149,0,0.1);rgba(255,149,0,0.3);rgba(255,149,0,0.1)" dur="6s" repeatCount="indefinite"/></rect>
            <rect x="306" y="145" width="28" height="22" rx="2" fill="rgba(255,149,0,0.1)" stroke="rgba(255,149,0,0.35)" strokeWidth="0.8"><animate attributeName="fill" values="rgba(255,149,0,0.1);rgba(255,149,0,0.3);rgba(255,149,0,0.1)" dur="9s" begin="2s" repeatCount="indefinite"/></rect>
            <rect x="276" y="190" width="56" height="50" rx="2" fill="rgba(255,107,53,0.06)" stroke="rgba(255,107,53,0.2)" strokeWidth="0.8"/>
            <circle cx="314" cy="162" r="11" fill="rgba(255,149,0,0.1)"/><circle cx="314" cy="162" r="5" fill="rgba(255,149,0,0.85)" filter="url(#db-glow)"><animate attributeName="r" values="5;7;5" dur="3s" repeatCount="indefinite"/></circle>
            {/* BATTERY */}
            <rect x="432" y="78" width="50" height="116" rx="6" fill="rgba(10,6,22,0.95)" stroke="rgba(255,107,53,0.38)" strokeWidth="1.5"/>
            <rect x="442" y="64" width="30" height="15" rx="4" fill="rgba(30,20,60,0.9)" stroke="rgba(255,107,53,0.38)" strokeWidth="1"/>
            <rect x="433" y="79" width="48" height="114" rx="5" fill="url(#db-bat)" clipPath="url(#db-bc)"><animate attributeName="y" values="153;98;153" dur="14s" repeatCount="indefinite"/><animate attributeName="height" values="40;95;40" dur="14s" repeatCount="indefinite"/></rect>
            <text x="457" y="140" textAnchor="middle" fill="#ff9500" fontSize="15" fontFamily="monospace" fontWeight="900" filter="url(#db-glow)">78%</text>
            <text x="457" y="153" textAnchor="middle" fill="rgba(255,149,0,0.4)" fontSize="6" fontFamily="monospace">SOC</text>
            <path d="M453 100 L448 116 L455 116 L451 132 L466 110 L459 110 L464 100 Z" fill="rgba(255,220,50,0.8)"><animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite"/></path>
            {/* EV */}
            <path d="M520 214 L520 186 Q526 170 548 165 L592 162 Q612 162 622 174 L632 186 L632 214 Z" fill="url(#db-ev-b)" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5"/>
            <path d="M548 165 Q555 150 568 146 L600 146 Q612 148 622 162 L592 162 Z" fill="rgba(20,40,100,0.9)" stroke="rgba(59,130,246,0.5)" strokeWidth="1"/>
            <path d="M568 147 Q570 150 573 163 L592 163 Q600 160 602 148 Z" fill="rgba(100,180,255,0.1)" stroke="rgba(100,200,255,0.22)" strokeWidth="0.5"/>
            <circle cx="548" cy="217" r="14" fill="rgba(8,12,30,0.95)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/><circle cx="548" cy="217" r="6" fill="rgba(59,130,246,0.7)"/>
            <circle cx="612" cy="217" r="14" fill="rgba(8,12,30,0.95)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/><circle cx="612" cy="217" r="6" fill="rgba(59,130,246,0.7)"/>
            <ellipse cx="576" cy="232" rx="56" ry="4" fill="rgba(59,130,246,0.14)"><animate attributeName="opacity" values="0.14;0.3;0.14" dur="5s" repeatCount="indefinite"/></ellipse>
            <rect x="632" y="188" width="7" height="12" rx="2" fill="rgba(255,107,53,0.4)" stroke="rgba(255,107,53,0.8)" strokeWidth="1"><animate attributeName="fill" values="rgba(255,107,53,0.4);rgba(255,107,53,0.85);rgba(255,107,53,0.4)" dur="2s" repeatCount="indefinite"/></rect>
            <path d="M639 194 Q660 194 668 170" stroke="rgba(255,107,53,0.38)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            {/* GRID TOWER */}
            <line x1="682" y1="48" x2="682" y2="222" stroke="rgba(59,130,246,0.22)" strokeWidth="1.5"/>
            <line x1="660" y1="78" x2="704" y2="78" stroke="rgba(59,130,246,0.22)" strokeWidth="1.5"/>
            <line x1="665" y1="118" x2="699" y2="118" stroke="rgba(59,130,246,0.22)" strokeWidth="1.5"/>
            <line x1="668" y1="158" x2="696" y2="158" stroke="rgba(59,130,246,0.22)" strokeWidth="1.5"/>
            <path d="M660 78 Q640 58 622 100 Q602 142 622 174" stroke="rgba(59,130,246,0.18)" strokeWidth="1" strokeDasharray="5 4" fill="none"/>
            {/* FLOW PARTICLES */}
            <path id="dp1" d="M200 148 Q232 128 258 158" fill="none"/>
            <path d="M200 148 Q232 128 258 158" stroke="#ff9500" strokeWidth="1" strokeDasharray="5 4" strokeOpacity="0.25" fill="none"/>
            {[0,1.3].map((d,i)=><circle key={i} r="4" fill="#ff9500" filter="url(#db-glow)"><animateMotion dur="2.6s" begin={`${d}s`} repeatCount="indefinite"><mpath xlinkHref="#dp1"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" dur="2.6s" begin={`${d}s`} repeatCount="indefinite"/></circle>)}
            <path id="dp2" d="M370 168 Q400 168 432 138" fill="none"/>
            <path d="M370 168 Q400 168 432 138" stroke="#ff6b35" strokeWidth="1" strokeDasharray="5 4" strokeOpacity="0.25" fill="none"/>
            <circle r="4" fill="#ff6b35" filter="url(#db-glow)"><animateMotion dur="2.9s" repeatCount="indefinite"><mpath xlinkHref="#dp2"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" dur="2.9s" repeatCount="indefinite"/></circle>
            <path id="dp3" d="M482 138 Q502 120 520 186" fill="none"/>
            <path d="M482 138 Q502 120 520 186" stroke="#3b82f6" strokeWidth="1" strokeDasharray="5 4" strokeOpacity="0.25" fill="none"/>
            <circle r="4" fill="#3b82f6" filter="url(#db-glow)"><animateMotion dur="3.1s" repeatCount="indefinite"><mpath xlinkHref="#dp3"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" dur="3.1s" repeatCount="indefinite"/></circle>
            <path id="dp4" d="M668 168 Q650 194 639 194" fill="none"/>
            <circle r="3.5" fill="rgba(34,197,94,0.9)" filter="url(#db-glow)"><animateMotion dur="2s" repeatCount="indefinite"><mpath xlinkHref="#dp4"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite"/></circle>
            {/* LABELS */}
            <text x="68" y="114" textAnchor="middle" fill="rgba(255,149,0,0.55)" fontSize="9" fontFamily="monospace" fontWeight="bold">7.4 kW PV</text>
            <text x="314" y="258" textAnchor="middle" fill="rgba(255,107,53,0.45)" fontSize="8" fontFamily="monospace">HAUS</text>
            <text x="457" y="210" textAnchor="middle" fill="rgba(255,107,53,0.45)" fontSize="8" fontFamily="monospace">SPEICHER</text>
            <text x="576" y="250" textAnchor="middle" fill="rgba(59,130,246,0.45)" fontSize="8" fontFamily="monospace">EV · 68%</text>
            <text x="682" y="242" textAnchor="middle" fill="rgba(59,130,246,0.4)" fontSize="8" fontFamily="monospace">NETZ</text>
          </svg>
        </div>

        {/* Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(28px,4vw,52px) clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', gap:16, maxWidth:'clamp(260px,46%,520px)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.28)', borderRadius:999, padding:'6px 16px', width:'fit-content', backdropFilter:'blur(12px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:wsStatus==='live'?'#22c55e':'#ff6b35', boxShadow:wsStatus==='live'?'0 0 8px #22c55e':'0 0 8px rgba(255,107,53,0.6)', display:'inline-block', animation:'wai-breathe 4s ease-in-out infinite' }}/>
            <span style={{ fontSize:10, color:'rgba(255,149,0,0.9)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700 }}>{wsStatus==='live'?'Live · Verbunden':wsStatus==='connecting'?'Verbinde...':'Offline'}</span>
          </div>
          <h1 style={{ fontSize:'clamp(26px,3.8vw,52px)', fontWeight:900, lineHeight:1.06, letterSpacing:'-0.03em', margin:0, background:'linear-gradient(135deg,#fff5f0 0%,#ff9500 40%,#ff6b35 65%,#3b82f6 100%)', backgroundSize:'300% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'wai-shimmer 9s linear infinite' }}>
            KI-gestützte<br/>Energieplattform
          </h1>
          <p style={{ margin:0, fontSize:'clamp(13px,1.4vw,15px)', color:'rgba(248,250,252,0.5)', lineHeight:1.8 }}>Live-Status, Lastmanagement und Energieflussanalyse — alles in einer Steuerungsoberfläche.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
            <button type="button" className="wai-btn-o" style={{ background:'linear-gradient(90deg,#ff6b35,#ff9500)', color:'#0a0305', border:'none', borderRadius:999, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 32px rgba(255,107,53,0.32)', letterSpacing:'0.02em', animation:'wai-glow-o 5s ease-in-out infinite' }}>Echtzeit-Ansicht</button>
            <button type="button" className="wai-btn-g" style={{ background:'transparent', color:'rgba(255,149,0,0.9)', border:'1px solid rgba(255,107,53,0.32)', borderRadius:999, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', backdropFilter:'blur(12px)' }}>Verlauf</button>
          </div>
        </div>

        {/* 3D spin rings */}
        <div aria-hidden="true" style={{ position:'absolute', zIndex:1, top:'50%', left:'50%', width:460, height:460, marginTop:-230, marginLeft:-230, borderRadius:'50%', border:'1px solid rgba(255,107,53,0.05)', animation:'wai-spin-slow 60s linear infinite', pointerEvents:'none' }}/>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)', display:'flex', flexDirection:'column', gap:16 }}>
        <CO2CostWidget co2SavedKg={123.4} costEur={56.78} autarky={87.6} period="Monat" />
        <ErrorAlarmMonitor />
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
          <div style={{ padding:'20px 24px' }}>
            <AnimatedEnergyFlow pvPower={data.pv_power_kw} housePower={data.house_load_w/1000} batteryPower={battery.power_kw} gridPower={(data.grid_import_w-data.grid_export_w)/1000} evPower={data.ev_power_w/1000}/>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'center' }}>
          <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden', width:'100%', maxWidth:700 }}>
            <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#ff9500)' }}/>
            <div style={{ padding:'20px 24px' }}>
              <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(59,130,246,0.8)', marginBottom:14 }}>Heimspeicher</div>
              <BatteryWidget data={battery}/>
            </div>
          </div>
        </div>
        {hasRealDevice ? (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16 }}>
              <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', padding:'20px 24px' }}><HistoryChart title="PV-Ertrag (24h)" endpoint="/history/pv" dataKey="PV (kW)" color="#10b981"/></div>
              <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', padding:'20px 24px' }}><HistoryChart title="Verbrauch (24h)" endpoint="/history/consumption" dataKey="Verbrauch (kW)" color="#3b82f6"/></div>
            </div>
            <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', padding:'20px 24px' }}><HistoryChart title="Batterie-SOC (24h)" endpoint="/history/battery" dataKey="SOC (%)" color="#f59e0b"/></div>
          </>
        ) : (
          <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(251,191,36,0.22)', borderRadius:20, backdropFilter:'blur(12px)', padding:'20px 24px', textAlign:'center', color:'rgba(254,243,199,0.8)', fontSize:14 }}>
            ⚠️ Zeitreihen werden angezeigt, sobald mindestens ein echtes Gerät verbunden ist.
          </div>
        )}
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', padding:'20px 24px' }}><PowerChart/></div>
      </div>
    </div>
  );
}
