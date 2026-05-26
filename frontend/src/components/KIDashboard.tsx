import { useEffect, useState, useRef } from 'react';
import TabHeader from './TabHeader';
import PlanGate from './PlanGate';

const API_URL = import.meta.env.VITE_API_URL || '';

const WAI = `
  @keyframes wai-breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
  @keyframes wai-shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
  @keyframes wai-drift{0%,100%{transform:translateY(0) translateX(0)}40%{transform:translateY(-22px) translateX(12px)}70%{transform:translateY(10px) translateX(-8px)}}
  @keyframes wai-scan{0%{top:-2px}100%{top:100%}}
  @keyframes wai-glow-o{0%,100%{box-shadow:0 0 30px rgba(255,107,53,.25)}50%{box-shadow:0 0 70px rgba(255,107,53,.55)}}
  @keyframes wai-spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes wai-pulse-bar{0%,100%{opacity:.7}50%{opacity:1}}
  @keyframes wai-ring-ping{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.4);opacity:0}}
  @keyframes wai-slide-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes wai-count-up{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
  .wai-btn-o{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-o:hover:not(:disabled){filter:brightness(1.18)!important;transform:translateY(-3px) scale(1.02)!important}
  .wai-btn-g{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-g:hover{background:rgba(255,107,53,.08)!important;border-color:rgba(255,107,53,.45)!important;transform:translateY(-2px)!important}
  .wai-card{transition:border-color .8s ease,box-shadow .8s ease!important}
  .wai-card:hover{border-color:rgba(255,107,53,.3)!important;box-shadow:0 16px 48px rgba(255,107,53,.07)!important}
  .wai-ai-mod{transition:border-color .5s,box-shadow .5s,transform .3s!important}
  .wai-ai-mod:hover{transform:translateY(-2px)!important}
  .wai-ki-row{transition:background .3s!important}
  .wai-ki-row:hover{background:rgba(255,107,53,0.06)!important}
`;

interface KIRec { action?: string; savings_eur?: number; confidence?: number; explanation?: string; }

interface AIModule {
  id: string; title: string; subtitle: string; icon: string; accent: string;
  status: 'active' | 'learning' | 'standby';
  metric: string; metricLabel: string; description: string;
  feature: string; featureName: string; tags: string[];
}

const AI_MODULES: AIModule[] = [
  { id:'charge_intel', title:'Charge Intelligence', subtitle:'EV-Ladeoptimierung · Echtzeit', icon:'⚡', accent:'#3b82f6', status:'active', metric:'€ 0.21/kWh', metricLabel:'Ø Ladepreis', description:'Dynamische Ladestrategie basierend auf Spotmarktpreisen, PV-Prognose und Fahrtplanung. SOC-Ziel 80% bis 07:00 Uhr.', feature:'ev.multi', featureName:'EV Charge Intelligence', tags:['DQN','V2H','ISO 15118'] },
  { id:'peak_shaving', title:'Peak Shaving', subtitle:'Lastspitzenreduktion · Grid', icon:'📉', accent:'#ff6b35', status:'active', metric:'-42%', metricLabel:'Lastspitze', description:'Automatische Entladung des Heimspeichers bei Leistungsspitzen > 8 kW. Spart Netzentgelte und schützt die Infrastruktur.', feature:'optimization.time_window', featureName:'Peak Shaving', tags:['RL-Agent','Modbus','MQTT'] },
  { id:'solar_arb', title:'Solar Arbitrage', subtitle:'PV-Eigenverbrauch · Prognose', icon:'☀️', accent:'#ff9500', status:'active', metric:'87%', metricLabel:'Eigenverbrauch', description:'KI-gestützte Prognose für 48h PV-Ertrag. Optimale Speicherstrategie: Laden bei Überschuss, Entladen bei Teurung.', feature:'forecast.advanced', featureName:'Solar Arbitrage', tags:['LSTM','OpenMeteo','Prognose'] },
  { id:'v2h', title:'V2H / V2G Strategie', subtitle:'Vehicle-to-Home · Netzrückspeisung', icon:'🔄', accent:'#22c55e', status:'learning', metric:'+ € 18/Mo', metricLabel:'V2G Erlöse', description:'Bidirektionales Laden mit ISO 15118-20. Das EV fungiert als Puffer — Einspeisung bei negativen Preisen.', feature:'v2h_v2g.strategies', featureName:'V2H/V2G Strategie', tags:['ISO 15118-20','Bidirektional','Pro'] },
  { id:'pred_maint', title:'Predictive Maintenance', subtitle:'Anomalieerkennung · Batteriegesundheit', icon:'🔬', accent:'#a855f7', status:'standby', metric:'SoH 96%', metricLabel:'Batteriegesundheit', description:'Edge-KI erkennt Degradation, Zellimbalancen und thermische Anomalien. Frühwarnsystem für Wartungsbedarf.', feature:'forecast.advanced', featureName:'Predictive Maintenance', tags:['TFLite','Edge AI','ISO 21434'] },
  { id:'tariff', title:'Tarifoptimierung', subtitle:'Dynamischer Stromtarif · Tibber', icon:'💹', accent:'#06b6d4', status:'active', metric:'€ 324', metricLabel:'Jahresersparnis', description:'Integration mit dynamischen Tarifen (Tibber, Octopus Energy). Vollautomatische Lade- und Entladezeitplanung nach Preisprognose.', feature:'optimization.time_window', featureName:'Tarifoptimierung', tags:['Tibber API','EPEX Spot','Prognose'] },
];

const StatusBadge = ({ status }: { status: AIModule['status'] }) => {
  const map = { active:{label:'Aktiv',color:'#22c55e'}, learning:{label:'Training',color:'#f59e0b'}, standby:{label:'Standby',color:'#6b7280'} };
  const { label, color } = map[status];
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${color}15`, border:`1px solid ${color}35`, borderRadius:999, padding:'3px 10px', fontSize:9, fontWeight:700, color, letterSpacing:'0.14em', textTransform:'uppercase' }}>
      <div style={{ width:5, height:5, borderRadius:'50%', background:color, animation:status==='active'?'wai-breathe 2.5s ease-in-out infinite':'none' }}/>
      {label}
    </div>
  );
};

const NeuralNetSVG = ({ conf }: { conf: number }) => {
  const layers: [number,number][] = [[30,4],[78,5],[126,4],[174,3]];
  const signals = [
    {color:'rgba(255,107,53,0.95)',path:'M30,25 L78,25 L126,55 L174,25',dur:'2.6s',begin:'0s'},
    {color:'rgba(255,149,0,0.95)',path:'M30,68 L78,58 L126,90 L174,90',dur:'3.1s',begin:'0.8s'},
    {color:'rgba(34,197,94,0.95)',path:'M30,112 L78,124 L126,123 L174,155',dur:'2.4s',begin:'1.5s'},
    {color:'rgba(59,130,246,0.95)',path:'M30,155 L78,91 L126,25 L174,60',dur:'3.5s',begin:'0.4s'},
  ];
  return (
    <svg viewBox="0 0 200 210" style={{ width:'100%', height:'100%' }} fill="none">
      <defs>
        <filter id="ki-glow3"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
        <linearGradient id="ki-grad3" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff6b35"/><stop offset="50%" stopColor="#ff9500"/><stop offset="100%" stopColor="#22c55e"/></linearGradient>
      </defs>
      {/* Layer-Labels — farbige Pills oben mit Abstand zum Netz */}
      {([['INPUT',30,'#ff6b35'],['HIDDEN',78,'#3b82f6'],['HIDDEN',126,'#3b82f6'],['OUTPUT',174,'#22c55e']] as [string,number,string][]).map(([l,x,col],idx)=>(
        <g key={idx}>
          <rect x={Number(x)-17} y="6" width={34} height="12" rx="3" fill="rgba(10,14,35,0.92)" stroke={`${col}60`} strokeWidth="1"/>
          <text x={Number(x)} y="14.5" textAnchor="middle" fill={col} fontSize="6.5" fontFamily="monospace" fontWeight="bold">{l}</text>
        </g>
      ))}
      {/* Verbindungslinien — beginnen unterhalb der Labels */}
      {layers.flatMap(([x,n],li)=>li<layers.length-1?Array.from({length:n},(_,i)=>Array.from({length:layers[li+1][1]},(_,j)=>(
        <line key={`c${li}-${i}-${j}`} x1={x} y1={26+i*(130/(n-1||1))} x2={layers[li+1][0]} y2={26+j*(130/(layers[li+1][1]-1||1))} stroke="rgba(59,130,246,0.08)" strokeWidth="0.8"/>
      ))):[])}
      {/* Neuronen-Kreise */}
      {layers.map(([x,n])=>Array.from({length:n},(_,i)=>{
        const y=26+i*(130/(n-1||1));
        const c=x===30?'rgba(255,107,53,0.85)':x===174?'rgba(34,197,94,0.85)':'rgba(59,130,246,0.75)';
        return <circle key={`n${x}-${i}`} cx={x} cy={y} r="8" fill="rgba(10,14,35,0.92)" stroke={c} strokeWidth="1.5" filter="url(#ki-glow3)"><animate attributeName="opacity" values="0.55;1;0.55" dur={`${2.2+i*0.35}s`} repeatCount="indefinite"/></circle>;
      }))}
      {/* Signal-Pulse */}
      {signals.map((s,i)=>(
        <circle key={i} r="2.8" fill={s.color} filter="url(#ki-glow3)">
          <animateMotion dur={s.dur} repeatCount="indefinite" begin={s.begin} path={s.path}/>
          <animate attributeName="opacity" values="0;1;1;0" dur={s.dur} begin={s.begin} repeatCount="indefinite"/>
        </circle>
      ))}
      {/* DQN Konfidenz — Balken + Label UNTERHALB des Netzes, klar getrennt */}
      <line x1="10" y1="166" x2="190" y2="166" stroke="rgba(59,130,246,0.1)" strokeWidth="0.5" strokeDasharray="4 3"/>
      <rect x="15" y="172" width="170" height="7" rx="3.5" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="0.6"/>
      <rect x="15" y="172" width={170*Math.min(1,conf)} height="7" rx="3.5" fill="url(#ki-grad3)">
        <animate attributeName="width" from="0" to={String(170*Math.min(1,conf))} dur="2.2s" fill="freeze"/>
      </rect>
      <text x="100" y="192" textAnchor="middle" fill="rgba(255,149,0,0.85)" fontSize="7" fontFamily="monospace" fontWeight="bold">DQN · Konfidenz {Math.round(Math.min(1,conf)*100)}% · RL-Agent v2.1</text>
    </svg>
  );
};

const KIDashboard = () => {
  const [rec, setRec] = useState<KIRec | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState({ savings:324, co2:1840, efficiency:87 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchRec = async () => {
    setLoading(true);
    try { const r=await fetch(`${API_URL}/airecommendation`); setRec(await r.json()); } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => {
    let frame=0;
    const id=setInterval(()=>{ frame++; setLiveMetrics({ savings:Math.round(324+Math.sin(frame*.05)*12), co2:Math.round(1840+Math.sin(frame*.03)*40), efficiency:Math.round(87+Math.sin(frame*.07)*3) }); },1200);
    return ()=>clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d'); if(!ctx) return;
    canvas.width=canvas.offsetWidth||600; canvas.height=canvas.offsetHeight||300;
    const pts=Array.from({length:20},()=>({ x:Math.random()*canvas.width, y:Math.random()*canvas.height, vx:(Math.random()-.5)*.35, vy:(Math.random()-.5)*.35, r:Math.random()*1.4+.4, c:['rgba(255,107,53,','rgba(59,130,246,','rgba(255,149,0,'][Math.floor(Math.random()*3)] }));
    let raf:number;
    const draw=()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); pts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>canvas.width)p.vx*=-1; if(p.y<0||p.y>canvas.height)p.vy*=-1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=p.c+'0.3)'; ctx.fill(); }); raf=requestAnimationFrame(draw); };
    draw(); return ()=>cancelAnimationFrame(raf);
  }, []);

  useEffect(() => { fetchRec(); }, []);
  const conf=rec?.confidence??0;

  return (
    <div style={{ background:'transparent', paddingBottom:56, width:'100%', position:'relative' }}>
      <style>{WAI}</style>
      <canvas ref={canvasRef} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0, opacity:.35 }}/>

      <TabHeader
        badge="KI-Command Center · DQN v2.1"
        title={['KI-Empfehlung', '& Optimierung']}
        subtitle="Deep-Q-Network + LSTM analysiert Echtzeitstrom und liefert optimale Lade-, Speicher- und Einspeisestrategien für Ihr E-Auto-Ökosystem."
        accentColor="#a855f7"
        gradientFrom="#ff6b35"
        gradientTo="#3b82f6"
        tags={[['DQN v2.1','#a855f7'],['LSTM','#ff9500'],['ISO 21434','#3b82f6'],['Edge AI','#22c55e']]}
        stats={[
          { label:'Ersparnis/Jahr', value:`€ ${liveMetrics.savings}`, color:'#22c55e', icon:'💰' },
          { label:'CO₂ eingespart', value:`${liveMetrics.co2}`, unit:'kg', color:'#3b82f6', icon:'🌿' },
          { label:'Effizienz', value:`${liveMetrics.efficiency}`, unit:'%', color:'#ff9500', icon:'⚡' },
        ]}
        ticker={[
          { label:'DQN-Agent', value:'aktiv', color:'#22c55e' },
          { label:'Konfidenz', value:`${Math.round(conf * 100)}%`, color:'#a855f7' },
          { label:'Ersparnis', value:`€ ${liveMetrics.savings}/Jahr`, color:'#22c55e' },
          { label:'CO₂', value:`${liveMetrics.co2} kg gespart`, color:'#3b82f6' },
          { label:'Solar-Eigenverbrauch', value:`${liveMetrics.efficiency}%`, color:'#ff9500' },
        ]}
        visual={<NeuralNetSVG conf={conf}/>}
      />
      {/* KI Action Buttons */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', padding:'0 clamp(12px,2vw,24px)', marginTop:-16, marginBottom:24, position:'relative', zIndex:2 }}>
        <button type="button" className="wai-btn-o" onClick={fetchRec} disabled={loading} style={{ background:'linear-gradient(90deg,#ff6b35,#ff9500)', color:'#0a0305', border:'none', borderRadius:999, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 32px rgba(255,107,53,0.32)', animation:'wai-glow-o 5s ease-in-out infinite' }}>{loading?'⟳ Analysiere…':'🧠 Empfehlung laden'}</button>
        <button type="button" className="wai-btn-g" style={{ background:'transparent', color:'rgba(255,149,0,0.9)', border:'1px solid rgba(255,107,53,0.32)', borderRadius:999, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', backdropFilter:'blur(12px)' }}>📈 Verlauf</button>
      </div>

      {/* CONTENT */}
      <div style={{ position:'relative', zIndex:1, padding:'0 clamp(12px,2vw,24px)', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Current recommendation */}
        {rec && (
          <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.15)', borderRadius:22, backdropFilter:'blur(14px)', overflow:'hidden', animation:'wai-slide-in .6s ease-out' }}>
            <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
            <div style={{ padding:'24px 28px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', animation:'wai-breathe 2.5s ease-in-out infinite', boxShadow:'0 0 10px rgba(34,197,94,0.7)' }}/>
                <span style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.8)' }}>Aktuelle KI-Empfehlung</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:16 }}>
                {[{label:'Aktion',value:rec.action??'—',color:'#ff9500'},{label:'Einsparung',value:rec.savings_eur!=null?`€ ${rec.savings_eur.toFixed(2)}`:'—',color:'#22c55e'},{label:'Konfidenz',value:rec.confidence!=null?`${(rec.confidence*100).toFixed(0)}%`:'—',color:'#3b82f6'}].map(({label,value,color})=>(
                  <div key={label} style={{ background:'rgba(255,107,53,0.04)', border:'1px solid rgba(255,107,53,0.09)', borderRadius:14, padding:'16px 18px' }}>
                    <div style={{ fontSize:9, color:'rgba(248,250,252,0.35)', letterSpacing:'0.16em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
                    <div style={{ fontSize:22, fontWeight:900, color, fontFamily:'monospace' }}>{value}</div>
                  </div>
                ))}
              </div>
              {rec.explanation && <p style={{ margin:0, fontSize:13, color:'rgba(248,250,252,0.5)', lineHeight:1.75, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:14 }}>{rec.explanation}</p>}
            </div>
          </div>
        )}

        {/* AI Modules label */}
        <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.6)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:3, height:16, background:'linear-gradient(180deg,#ff6b35,#ff9500)', borderRadius:999 }}/>
          KI-Module & Features
        </div>

        {/* AI Modules Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap:16 }}>
          {AI_MODULES.map((mod) => (
            <PlanGate key={mod.id} feature={mod.feature as never} featureName={mod.featureName} requiredPlan="pro">
              <div className="wai-ai-mod" onClick={()=>setActiveModule(activeModule===mod.id?null:mod.id)} style={{ background:`linear-gradient(130deg,rgba(22,30,65,0.75) 55%,${mod.accent}08)`, border:`1px solid ${activeModule===mod.id?mod.accent+'50':'rgba(255,255,255,0.06)'}`, borderRadius:18, overflow:'hidden', cursor:'pointer', backdropFilter:'blur(14px)', position:'relative' }}>
                <div style={{ height:2, background:`linear-gradient(90deg,${mod.accent},${mod.accent}44)` }}/>
                <div style={{ position:'absolute', left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${mod.accent}18,transparent)`, animation:'wai-scan 18s linear infinite', pointerEvents:'none' }}/>
                <div style={{ padding:'18px 20px', position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:`${mod.accent}15`, border:`1px solid ${mod.accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{mod.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <span style={{ fontWeight:800, fontSize:14, color:'#f8fafc' }}>{mod.title}</span>
                        <StatusBadge status={mod.status}/>
                      </div>
                      <div style={{ fontSize:10, color:'rgba(248,250,252,0.35)', letterSpacing:'0.06em' }}>{mod.subtitle}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:18, fontWeight:900, color:mod.accent, fontFamily:'monospace' }}>{mod.metric}</div>
                      <div style={{ fontSize:9, color:'rgba(248,250,252,0.3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{mod.metricLabel}</div>
                    </div>
                  </div>
                  {activeModule===mod.id && <p style={{ margin:'0 0 14px', fontSize:12, color:'rgba(248,250,252,0.55)', lineHeight:1.7, animation:'wai-slide-in .3s ease-out' }}>{mod.description}</p>}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {mod.tags.map(tag=><span key={tag} style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', color:`${mod.accent}cc`, background:`${mod.accent}10`, border:`1px solid ${mod.accent}22`, borderRadius:4, padding:'3px 8px', textTransform:'uppercase' }}>{tag}</span>)}
                  </div>
                </div>
              </div>
            </PlanGate>
          ))}
        </div>

        {/* 24h Optimization Timeline */}
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:22, backdropFilter:'blur(14px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#ff9500,#22c55e)' }}/>
          <div style={{ padding:'24px 28px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(59,130,246,0.7)', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:3, height:16, background:'linear-gradient(180deg,#3b82f6,#22c55e)', borderRadius:999 }}/>
              KI-Optimierungsplan · Nächste 24h
            </div>
            <PlanGate feature="optimization.time_window" featureName="24h-Optimierungsplan" requiredPlan="pro">
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                {[
                  { time:'00:00–06:00', action:'EV laden (Niedrigtarif · Tibber)', savings:'€ 1.24', icon:'⚡', color:'#3b82f6' },
                  { time:'06:00–10:00', action:'PV-Prognose: 3.2 kWh — Speicher laden', savings:'+ 3.2 kWh', icon:'☀️', color:'#ff9500' },
                  { time:'10:00–14:00', action:'Solar-Überschuss → Netzeinspeisung', savings:'+ € 0.82', icon:'🔄', color:'#22c55e' },
                  { time:'14:00–18:00', action:'Peak Shaving aktiv — Speicher entladen', savings:'-42% Last', icon:'📉', color:'#ff6b35' },
                  { time:'18:00–22:00', action:'V2H: EV → Haushalt (Abendspitze)', savings:'€ 0.95', icon:'🔋', color:'#a855f7' },
                  { time:'22:00–00:00', action:'Nacht-Ladung EV (günstiger Tarif)', savings:'€ 0.61', icon:'🌙', color:'#06b6d4' },
                ].map(({ time, action, savings, icon, color }) => (
                  <div key={time} className="wai-ki-row" style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', borderRadius:10 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{icon}</div>
                    <div style={{ width:115, fontSize:10, color:`${color}cc`, fontFamily:'monospace', fontWeight:700, flexShrink:0 }}>{time}</div>
                    <div style={{ flex:1, fontSize:12, color:'rgba(248,250,252,0.65)' }}>{action}</div>
                    <div style={{ fontSize:13, fontWeight:800, color, fontFamily:'monospace', flexShrink:0 }}>{savings}</div>
                  </div>
                ))}
              </div>
            </PlanGate>
          </div>
        </div>

        {/* System Status Row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
          {[
            { label:'DQN Agent', value:'v2.1 · Running', color:'#22c55e', icon:'🧠' },
            { label:'LSTM Forecast', value:'48h · Aktiv', color:'#3b82f6', icon:'📈' },
            { label:'Edge KI', value:'TFLite · On-device', color:'#ff9500', icon:'🔬' },
            { label:'ISO 15118-20', value:'V2G Ready', color:'#a855f7', icon:'⚡' },
            { label:'Modell Update', value:'Täglich 03:00', color:'#06b6d4', icon:'🔄' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{ background:'rgba(22,30,65,0.60)', border:`1px solid ${color}18`, borderRadius:14, padding:'14px 16px', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${color}12`, border:`1px solid ${color}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
              <div>
                <div style={{ fontSize:9, color:'rgba(248,250,252,0.35)', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:12, fontWeight:700, color, fontFamily:'monospace' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KIDashboard;
