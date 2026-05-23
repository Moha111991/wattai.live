import React, { useEffect, useRef } from "react";

interface Device {
  id: string;
  type: string;
  brand: string;
  enabled: boolean;
  ip: string;
  status: string;
  manufacturer?: string;
  model?: string;
  soc?: number;
  power_kw?: number;
}

interface DeviceGridProps {
  devices: Device[];
  onConnect?: (device: Device) => void;
}

const WAI = `
  @keyframes wai-breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
  @keyframes wai-scan{0%{top:0}100%{top:100%}}
  @keyframes wai-glow-o{0%,100%{box-shadow:0 0 18px rgba(255,107,53,.3)}50%{box-shadow:0 0 48px rgba(255,107,53,.7)}}
  @keyframes wai-spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes wai-pulse-bar{0%,100%{opacity:.7}50%{opacity:1}}
  @keyframes wai-ring-ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
  @keyframes wai-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  .wai-dcard{transition:border-color .5s,box-shadow .5s,transform .3s!important}
  .wai-dcard:hover{border-color:rgba(255,107,53,.38)!important;box-shadow:0 20px 56px rgba(255,107,53,.09)!important;transform:translateY(-2px)!important}
  .wai-conn-btn{transition:all .4s cubic-bezier(.16,1,.3,1)!important}
  .wai-conn-btn:hover:not(:disabled){filter:brightness(1.18)!important;transform:translateY(-2px) scale(1.03)!important;box-shadow:0 0 32px rgba(255,107,53,.5)!important}
`;

const DEVICE_SLOTS = [
  { key:'battery',  label:'Heimspeicher',     sublabel:'Batteriespeicher · BMS · Modbus', icon:'⚡', accent:'#22c55e', bg:'rgba(34,197,94,0.06)',  border:'rgba(34,197,94,0.2)',  match:['battery','heimspeicher','bat'], proto:'Modbus RTU / TCP',   std:'SunSpec · CAN' },
  { key:'inverter', label:'PV-Wechselrichter', sublabel:'Solar Inverter · MPPT · SunSpec', icon:'☀️', accent:'#ff9500', bg:'rgba(255,149,0,0.06)',  border:'rgba(255,149,0,0.2)',  match:['inverter','wechselrichter','pv'], proto:'SunSpec · REST',    std:'IEC 61850' },
  { key:'wallbox',  label:'Wallbox / EVSE',   sublabel:'Ladestation · OCPP · ISO 15118',  icon:'🔌', accent:'#3b82f6', bg:'rgba(59,130,246,0.06)', border:'rgba(59,130,246,0.2)', match:['wallbox','evse','charger'],      proto:'OCPP 2.0.1',       std:'ISO 15118-20' },
  { key:'meter',    label:'Smart Meter',      sublabel:'Energiezähler · SML · DLMS',      icon:'📊', accent:'#a855f7', bg:'rgba(168,85,247,0.06)', border:'rgba(168,85,247,0.2)', match:['smart meter','meter','zähler'],  proto:'SML · DLMS/COSEM', std:'IEC 62056' },
];

const matchSlot = (device: Device, slot: typeof DEVICE_SLOTS[0]) => {
  const t = (device.type || '').toLowerCase();
  return slot.match.some(k => t.includes(k));
};

const getStatusInfo = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('connected') && !s.includes('partial')) return { color:'#22c55e', label:'Verbunden', connected:true };
  if (s.includes('partial')) return { color:'#f59e0b', label:'Teilverbunden', connected:false };
  if (s.includes('pending')) return { color:'#f59e0b', label:'Verbinde…', connected:false };
  return { color:'#6b7280', label:'Nicht verbunden', connected:false };
};

const SOCRing: React.FC<{ soc:number; accent:string }> = ({ soc, accent }) => {
  const r=20, circ=2*Math.PI*r, dash=circ*Math.min(1,soc/100);
  return (
    <svg width={54} height={54} viewBox="0 0 54 54">
      <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4.5"/>
      <circle cx="27" cy="27" r={r} fill="none" stroke={accent} strokeWidth="4.5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transform:'rotate(-90deg)', transformOrigin:'27px 27px', transition:'stroke-dasharray 1.2s ease' }}/>
      <text x="27" y="31" textAnchor="middle" fill="white" fontSize="10" fontWeight="800" fontFamily="monospace">{soc}%</text>
    </svg>
  );
};

const PowerBar: React.FC<{ kw:number; accent:string }> = ({ kw, accent }) => {
  const pct = Math.min(100, Math.abs(kw)/10*100);
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(248,250,252,0.32)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>
        <span>Leistung</span>
        <span style={{ color:accent, fontWeight:700 }}>{kw>0?'+':''}{kw.toFixed(1)} kW</span>
      </div>
      <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${accent}88,${accent})`, borderRadius:999, transition:'width 1s ease', animation:'wai-pulse-bar 2s ease-in-out infinite' }}/>
      </div>
    </div>
  );
};

const TopoNode: React.FC<{ accent:string; active:boolean }> = ({ accent, active }) => (
  <svg width={54} height={54} viewBox="0 0 54 54" fill="none">
    <circle cx="27" cy="27" r="16" fill="none" stroke={accent} strokeWidth="1.2"
      strokeDasharray="5 4" strokeOpacity={active?0.5:0.14}
      style={{ animation:active?'wai-spin-slow 14s linear infinite':'none', transformOrigin:'27px 27px' }}/>
    <circle cx="27" cy="27" r="7" fill={`${accent}18`} stroke={accent} strokeWidth="1.2" strokeOpacity={active?0.8:0.28}/>
    {active && <>
      <circle cx="27" cy="27" r="7" fill="none" stroke={accent} strokeOpacity="0.3"
        style={{ animation:'wai-ring-ping 2.8s ease-out infinite', transformOrigin:'27px 27px' }}/>
    </>}
    <text x="27" y="30" textAnchor="middle" fontSize="6" fill={accent} fontFamily="monospace" fontWeight="bold" fillOpacity={active?0.9:0.35}>{active?'LIVE':'OFF'}</text>
  </svg>
);

const SignalLine: React.FC<{ accent:string; active:boolean }> = ({ accent, active }) => (
  <svg width={54} height={22} viewBox="0 0 54 22" fill="none" style={{ opacity:active?1:0.15 }}>
    <polyline points="0,11 9,11 14,3 21,19 28,5 35,17 42,11 54,11"
      stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation:active?'wai-pulse-bar 2s ease-in-out infinite':'none' }}/>
  </svg>
);

const DeviceGrid: React.FC<DeviceGridProps> = ({ devices, onConnect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const pts = Array.from({ length:20 }, () => ({
      x:Math.random()*canvas.width, y:Math.random()*canvas.height,
      vx:(Math.random()-.5)*.32, vy:(Math.random()-.5)*.32,
      r:Math.random()*1.2+.4,
      c:Math.random()>.5?'rgba(255,107,53,':'rgba(59,130,246,',
    }));
    let raf:number;
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>canvas.width)p.vx*=-1;
        if(p.y<0||p.y>canvas.height)p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.c+'0.24)'; ctx.fill();
      });
      raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position:'relative' }}>
      <style>{WAI}</style>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>

      {/* Header */}
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:3, height:22, background:'linear-gradient(180deg,#ff6b35,#ff9500)', borderRadius:999 }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'rgba(248,250,252,0.55)', letterSpacing:'0.18em', textTransform:'uppercase' }}>
            {devices.length} / {DEVICE_SLOTS.length} Geräte erkannt
          </span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['MQTT','TLS 1.3','ISO 15118'].map(t=>(
            <span key={t} style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', color:'rgba(59,130,246,0.6)', background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.16)', borderRadius:4, padding:'3px 8px' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* 4 unified device slot cards */}
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:12 }}>
        {DEVICE_SLOTS.map(slot => {
          const device = devices.find(d => matchSlot(d, slot)) ?? null;
          const si = getStatusInfo(device?.status);
          const isBatt = slot.key==='battery';
          const safeSoc = device && Number.isFinite(device.soc) ? Math.max(0,Math.min(100,Number(device.soc))) : 0;
          const safePow = device && Number.isFinite(device.power_kw) ? Number(device.power_kw) : 0;

          return (
            <div key={slot.key} className="wai-dcard" style={{
              background:`linear-gradient(118deg, rgba(18,24,58,0.84) 0%, rgba(22,30,65,0.80) 58%, ${slot.bg})`,
              border:`1px solid ${si.connected ? slot.border : 'rgba(255,255,255,0.07)'}`,
              borderRadius:20, overflow:'hidden',
              backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)',
              position:'relative',
            }}>
              {/* Top accent stripe */}
              <div style={{ height:2.5, background: si.connected
                ? `linear-gradient(90deg,${slot.accent},${slot.accent}55,transparent)`
                : 'linear-gradient(90deg,rgba(255,255,255,0.05),transparent)'
              }}/>
              {/* Scan line */}
              <div style={{ position:'absolute', left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${slot.accent}16,transparent)`, animation:'wai-scan 20s linear infinite', pointerEvents:'none', zIndex:0 }}/>

              <div style={{ display:'flex', alignItems:'center', padding:'18px 22px', gap:0, position:'relative', zIndex:1, flexWrap:'wrap' }}>

                {/* Icon + status dot */}
                <div style={{ flexShrink:0, width:68, display:'flex', flexDirection:'column', alignItems:'center', gap:7, marginRight:18 }}>
                  <div style={{ position:'relative', width:54, height:54 }}>
                    <svg width={54} height={54} viewBox="0 0 54 54" fill="none" style={{ position:'absolute', top:0, left:0 }}>
                      <polygon points="27,3 50,15 50,39 27,51 4,39 4,15"
                        fill={`${slot.accent}09`} stroke={slot.accent} strokeWidth="1.4"
                        strokeOpacity={si.connected?0.65:0.25}/>
                      <polygon points="27,3 50,15 50,39 27,51 4,39 4,15"
                        fill="none" stroke={slot.accent} strokeWidth="0.8" strokeOpacity="0.15"
                        style={{ animation:'wai-spin-slow 28s linear infinite', transformOrigin:'27px 27px' }}/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:23,
                      animation: si.connected ? 'wai-float 4s ease-in-out infinite' : 'none' }}>
                      {slot.icon}
                    </div>
                  </div>
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:si.color, animation:'wai-breathe 3.2s ease-in-out infinite' }}/>
                    {si.connected && <div style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:si.color, animation:'wai-ring-ping 2.5s ease-out infinite' }}/>}
                  </div>
                </div>

                {/* Name + badge + details */}
                <div style={{ flex:'0 0 auto', minWidth:165, marginRight:18 }}>
                  <div style={{ fontSize:16, fontWeight:900, color:'#f8fafc', letterSpacing:'-0.02em', marginBottom:2 }}>{slot.label}</div>
                  <div style={{ fontSize:10, color:'rgba(248,250,252,0.32)', letterSpacing:'0.05em', marginBottom:9 }}>{slot.sublabel}</div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                    background:`${si.color}12`, border:`1px solid ${si.color}30`, borderRadius:999,
                    padding:'3px 11px', fontSize:10, fontWeight:700, color:si.color,
                    letterSpacing:'0.08em', textTransform:'uppercase'
                  }}>{si.label}</span>
                  {device && (
                    <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:2 }}>
                      <div style={{ fontSize:10, color:'rgba(248,250,252,0.38)', fontFamily:'monospace' }}>{device.brand||'—'}{device.model?` · ${device.model}`:''}</div>
                      <div style={{ fontSize:10, color:'rgba(248,250,252,0.24)', fontFamily:'monospace' }}>{device.ip||'—'}</div>
                    </div>
                  )}
                </div>

                {/* Specs grid */}
                <div style={{ flex:1, minWidth:200, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'7px 9px', marginRight:18 }}>
                  {[
                    { label:'Protokoll', value:slot.proto },
                    { label:'Standard', value:slot.std },
                    { label:'Sicherheit', value:'TLS 1.3 · mTLS' },
                    { label:'Transport', value:device?.ip ? device.ip : 'MQTT · REST' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding:'8px 10px', background:'rgba(255,255,255,0.028)', borderRadius:10, border:'1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize:9, color:'rgba(248,250,252,0.26)', letterSpacing:'0.13em', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:'rgba(248,250,252,0.64)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Metrics + action */}
                <div style={{ flexShrink:0, width:126, display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  {isBatt && device ? (
                    <>
                      <SOCRing soc={safeSoc} accent={slot.accent}/>
                      <PowerBar kw={safePow} accent={slot.accent}/>
                    </>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                      <TopoNode accent={slot.accent} active={si.connected}/>
                      <SignalLine accent={slot.accent} active={si.connected}/>
                    </div>
                  )}

                  {si.connected ? (
                    <div style={{ width:'100%', textAlign:'center', padding:'9px 10px', borderRadius:999,
                      background:`${slot.accent}12`, border:`1px solid ${slot.accent}38`,
                      fontSize:11, fontWeight:800, color:slot.accent, letterSpacing:'0.04em' }}>
                      ✓ Verbunden
                    </div>
                  ) : (
                    <button className="wai-conn-btn"
                      onClick={()=>device&&onConnect&&onConnect(device)}
                      disabled={!device}
                      style={{ width:'100%', outline:'none',
                        border: device ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius:999, padding:'9px 10px',
                        fontWeight:800, fontSize:11, cursor:device?'pointer':'default',
                        letterSpacing:'0.04em',
                        background:device?'linear-gradient(90deg,#ff6b35,#ff9500)':'rgba(255,255,255,0.05)',
                        color:device?'#0a0305':'rgba(248,250,252,0.2)',
                        animation:device?'wai-glow-o 4s ease-in-out infinite':'none',
                        boxShadow:'none',
                      }}>
                      {device?'Verbinden':'Nicht erkannt'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeviceGrid;
