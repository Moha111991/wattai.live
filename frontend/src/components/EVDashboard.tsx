import '../styles/ev-dashboard.css';
import ElektroautoV2H from './ElektroautoV2H';
import EVChargeControl from './EVChargeControl';
import PlanGate from './PlanGate';

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

const EVDashboard = () => {
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

        {/* EV Visual — ported from StartPage EvVisual() */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'60%', opacity:0.88 }}>
          <svg viewBox="0 0 200 180" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <linearGradient id="ev-body-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a2060"/><stop offset="100%" stopColor="#0a1230"/></linearGradient>
              <linearGradient id="ev-charge-bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff6b35"/><stop offset="100%" stopColor="#22c55e"/></linearGradient>
              <filter id="ev-glow"><feGaussianBlur stdDeviation="4" result="blur"/><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
            </defs>
            {[40,80,120,160].map(x=><line key={x} x1={x} y1="20" x2={x} y2="155" stroke="rgba(59,130,246,0.06)" strokeWidth="0.5"/>)}
            {[50,90,130].map(y=><line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(59,130,246,0.06)" strokeWidth="0.5"/>)}
            <path d="M 24 110 L 24 82 Q 30 62 55 56 L 108 52 Q 134 52 148 66 L 162 82 L 162 110 Z" fill="url(#ev-body-grad)" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5"/>
            <path d="M 55 56 Q 60 40 78 36 L 120 36 Q 138 38 148 52 L 108 52 Z" fill="rgba(20,40,100,0.9)" stroke="rgba(59,130,246,0.5)" strokeWidth="1"/>
            <path d="M 80 37 Q 82 40 86 52 L 108 52 Q 120 48 122 38 Z" fill="rgba(100,180,255,0.12)" stroke="rgba(100,200,255,0.3)" strokeWidth="0.6"/>
            <path d="M 58 57 Q 62 48 76 44 L 80 53 Z" fill="rgba(100,180,255,0.1)" stroke="rgba(100,200,255,0.25)" strokeWidth="0.5"/>
            <line x1="108" y1="52" x2="110" y2="108" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8"/>
            <circle cx="62" cy="112" r="16" fill="rgba(8,12,30,0.95)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/>
            <circle cx="62" cy="112" r="8" fill="rgba(20,40,80,0.9)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.8"/>
            <circle cx="62" cy="112" r="3" fill="rgba(59,130,246,0.7)"/>
            <circle cx="140" cy="112" r="16" fill="rgba(8,12,30,0.95)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5"/>
            <circle cx="140" cy="112" r="8" fill="rgba(20,40,80,0.9)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.8"/>
            <circle cx="140" cy="112" r="3" fill="rgba(59,130,246,0.7)"/>
            <ellipse cx="93" cy="128" rx="68" ry="5" fill="rgba(59,130,246,0.18)"><animate attributeName="opacity" values="0.18;0.35;0.18" dur="5s" repeatCount="indefinite"/></ellipse>
            <rect x="162" y="86" width="8" height="14" rx="2" fill="rgba(255,107,53,0.3)" stroke="rgba(255,107,53,0.7)" strokeWidth="1"><animate attributeName="fill" values="rgba(255,107,53,0.3);rgba(255,107,53,0.7);rgba(255,107,53,0.3)" dur="2s" repeatCount="indefinite"/></rect>
            <path id="ev-cable" d="M 170 93 Q 185 93 190 75" fill="none" stroke="rgba(255,107,53,0.35)" strokeWidth="2.5" strokeLinecap="round"/>
            <path id="ev-v2h" d="M 24 90 Q 10 90 6 70" fill="none"/>
            <path d="M 24 90 Q 10 90 6 70" stroke="rgba(34,197,94,0.2)" strokeWidth="2" strokeDasharray="4 4" fill="none"/>
            <circle r="3" fill="rgba(34,197,94,0.9)" filter="url(#ev-glow)"><animateMotion dur="4s" repeatCount="indefinite" begin="0.5s"><mpath xlinkHref="#ev-v2h"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" dur="4s" begin="0.5s" repeatCount="indefinite"/></circle>
            <path id="ev-charge-f" d="M 190 75 Q 185 93 170 93" fill="none"/>
            <circle r="3" fill="rgba(255,149,0,0.9)" filter="url(#ev-glow)"><animateMotion dur="2.5s" repeatCount="indefinite"><mpath xlinkHref="#ev-charge-f"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite"/></circle>
            <text x="4" y="60" fill="rgba(34,197,94,0.7)" fontSize="7" fontFamily="monospace" fontWeight="bold">HOME</text>
            <text x="176" y="60" fill="rgba(255,149,0,0.7)" fontSize="7" fontFamily="monospace" fontWeight="bold">GRID</text>
            <text x="100" y="47" textAnchor="middle" fill="rgba(59,130,246,0.6)" fontSize="7.5" fontFamily="monospace">ISO 15118 · OCPP 2.0.1</text>
            <rect x="24" y="142" width="138" height="7" rx="3.5" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5"/>
            <rect x="24" y="142" width="95" height="7" rx="3.5" fill="url(#ev-charge-bar)"><animate attributeName="width" values="95;115;95" dur="10s" repeatCount="indefinite"/></rect>
            <text x="100" y="160" textAnchor="middle" fill="rgba(255,149,0,0.65)" fontSize="7" fontFamily="monospace">SOC 68 % · Lädt mit 11 kW</text>
            <text x="100" y="172" textAnchor="middle" fill="rgba(34,197,94,0.5)" fontSize="6.5" fontFamily="monospace">V2H aktiv · 2.4 kW ins Haus</text>
          </svg>
        </div>

        {/* Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(28px,4vw,52px) clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', gap:16, maxWidth:'clamp(260px,46%,520px)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.28)', borderRadius:999, padding:'6px 16px', width:'fit-content', backdropFilter:'blur(12px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#ff6b35', boxShadow:'0 0 8px rgba(255,107,53,0.7)', display:'inline-block', animation:'wai-breathe 4s ease-in-out infinite' }}/>
            <span style={{ fontSize:10, color:'rgba(255,149,0,0.9)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700 }}>Elektroauto · V2H/V2G</span>
          </div>
          <h1 style={{ fontSize:'clamp(26px,3.8vw,52px)', fontWeight:900, lineHeight:1.06, letterSpacing:'-0.03em', margin:0, background:'linear-gradient(135deg,#fff5f0 0%,#ff9500 40%,#ff6b35 65%,#3b82f6 100%)', backgroundSize:'300% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'wai-shimmer 9s linear infinite' }}>
            Intelligente<br/>Ladesteuerung
          </h1>
          <p style={{ margin:0, fontSize:'clamp(13px,1.4vw,15px)', color:'rgba(248,250,252,0.5)', lineHeight:1.8 }}>Bidirektionales Laden, V2H/V2G-Integration und Echtzeit-Monitoring für Ihr Elektrofahrzeug.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
            <button type="button" className="wai-btn-o" style={{ background:'linear-gradient(90deg,#ff6b35,#ff9500)', color:'#0a0305', border:'none', borderRadius:999, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 32px rgba(255,107,53,0.32)', letterSpacing:'0.02em', animation:'wai-glow-o 5s ease-in-out infinite' }}>Laden starten</button>
            <button type="button" className="wai-btn-g" style={{ background:'transparent', color:'rgba(255,149,0,0.9)', border:'1px solid rgba(255,107,53,0.32)', borderRadius:999, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', backdropFilter:'blur(12px)' }}>V2H aktivieren</button>
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:4 }}>
            {[['ISO 15118','#ff9500'],['OCPP 2.0.1','#3b82f6'],['Bidirektional','#22c55e']].map(([l,c])=>(
              <span key={l} style={{ fontSize:11, fontFamily:'monospace', fontWeight:600, color:c, background:`${c}12`, border:`1px solid ${c}30`, borderRadius:999, padding:'4px 12px' }}>{l}</span>
            ))}
          </div>
        </div>

        <div aria-hidden="true" style={{ position:'absolute', zIndex:1, top:'50%', left:'50%', width:460, height:460, marginTop:-230, marginLeft:-230, borderRadius:'50%', border:'1px solid rgba(59,130,246,0.05)', animation:'wai-spin-slow 70s linear infinite', pointerEvents:'none' }}/>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)', display:'flex', flexDirection:'column', gap:16 }}>
        <div className="wai-card" style={{ background:'rgba(4,6,20,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.7)', marginBottom:18 }}>Ladesteuerung</div>
            <EVChargeControl/>
          </div>
        </div>
        <div className="wai-card" style={{ background:'rgba(4,6,20,0.65)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#ff9500)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(59,130,246,0.7)', marginBottom:18 }}>V2H / V2G Strategien</div>
            <PlanGate feature="v2h_v2g.strategies" featureName="V2H / V2G-Strategien" requiredPlan="pro">
              <ElektroautoV2H/>
            </PlanGate>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVDashboard;
