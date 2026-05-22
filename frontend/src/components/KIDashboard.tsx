import { useEffect, useState } from 'react';
import PlanGate from './PlanGate';

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
`;

interface KIRec { action?: string; savings_eur?: number; confidence?: number; explanation?: string; }

const KIDashboard = () => {
  const [rec, setRec] = useState<KIRec | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRec = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/api/ai/recommendation`);
      const d = await r.json();
      setRec(d);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchRec(); }, []);

  const conf = rec?.confidence ?? 0;

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

        {/* Neural network SVG (KiVisual port) */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'60%', opacity:0.88 }}>
          <svg viewBox="0 0 200 180" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <filter id="ki-glow"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
              <linearGradient id="ki-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ff6b35"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient>
            </defs>
            {/* DQN layers: input(4), hidden1(5), hidden2(4), output(3) */}
            {([[30,4],[78,5],[126,4],[174,3]] as [number,number][]).map(([x,n])=>
              Array.from({length:n},(_,i)=>{
                const y = 30 + i*(140/(n-1||1));
                return <circle key={`${x}-${i}`} cx={x} cy={y} r="9" fill="rgba(4,6,20,0.9)" stroke={x===30?'rgba(255,107,53,0.8)':x===174?'rgba(34,197,94,0.8)':'rgba(59,130,246,0.7)'} strokeWidth="1.5" filter="url(#ki-glow)"><animate attributeName="opacity" values="0.6;1;0.6" dur={`${2.5+i*0.4}s`} repeatCount="indefinite"/></circle>;
              })
            )}
            {/* Connections l1→l2 */}
            {Array.from({length:4},(_,i)=>Array.from({length:5},(_,j)=>(
              <line key={`c12-${i}-${j}`} x1="30" y1={30+i*(140/3)} x2="78" y2={30+j*(140/4)} stroke="rgba(59,130,246,0.08)" strokeWidth="0.7"/>
            )))}
            {/* Connections l2→l3 */}
            {Array.from({length:5},(_,i)=>Array.from({length:4},(_,j)=>(
              <line key={`c23-${i}-${j}`} x1="78" y1={30+i*(140/4)} x2="126" y2={30+j*(140/3)} stroke="rgba(59,130,246,0.08)" strokeWidth="0.7"/>
            )))}
            {/* Connections l3→l4 */}
            {Array.from({length:4},(_,i)=>Array.from({length:3},(_,j)=>(
              <line key={`c34-${i}-${j}`} x1="126" y1={30+i*(140/3)} x2="174" y2={30+j*(140/2)} stroke="rgba(59,130,246,0.08)" strokeWidth="0.7"/>
            )))}
            {/* Animated signal particles */}
            {['rgba(255,107,53,0.9)','rgba(255,149,0,0.9)','rgba(34,197,94,0.9)'].map((c,i)=>(
              <circle key={i} r="2.5" fill={c} filter="url(#ki-glow)">
                <animateMotion dur={`${2.8+i*0.7}s`} repeatCount="indefinite" begin={`${i*0.9}s`}
                  path={`M30,${30+i*45} L78,${30+(i+1)*35} L126,${30+i*47} L174,${30+i*70}`}/>
                <animate attributeName="opacity" values="0;1;1;0" dur={`${2.8+i*0.7}s`} begin={`${i*0.9}s`} repeatCount="indefinite"/>
              </circle>
            ))}
            {/* Confidence bar */}
            <rect x="20" y="162" width="160" height="6" rx="3" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5"/>
            <rect x="20" y="162" width={160*conf} height="6" rx="3" fill="url(#ki-grad)">
              <animate attributeName="width" from="0" to={160*conf} dur="2s" fill="freeze"/>
            </rect>
            <text x="100" y="176" textAnchor="middle" fill="rgba(255,149,0,0.6)" fontSize="7" fontFamily="monospace">Konfidenz {Math.round(conf*100)}% · DQN Agent</text>
            {/* Labels */}
            {[['STATE',30],['HIDDEN',78],['HIDDEN',126],['ACTION',174]].map(([l,x])=>(
              <text key={l as string} x={x as number} y="22" textAnchor="middle" fill="rgba(59,130,246,0.45)" fontSize="6.5" fontFamily="monospace">{l as string}</text>
            ))}
          </svg>
        </div>

        {/* Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(28px,4vw,52px) clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', gap:16, maxWidth:'clamp(260px,46%,520px)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.28)', borderRadius:999, padding:'6px 16px', width:'fit-content', backdropFilter:'blur(12px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#ff6b35', boxShadow:'0 0 8px rgba(255,107,53,0.7)', display:'inline-block', animation:'wai-breathe 4s ease-in-out infinite' }}/>
            <span style={{ fontSize:10, color:'rgba(255,149,0,0.9)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700 }}>KI-Agent · DQN Reinforcement Learning</span>
          </div>
          <h1 style={{ fontSize:'clamp(26px,3.8vw,52px)', fontWeight:900, lineHeight:1.06, letterSpacing:'-0.03em', margin:0, background:'linear-gradient(135deg,#fff5f0 0%,#ff9500 40%,#ff6b35 65%,#3b82f6 100%)', backgroundSize:'300% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'wai-shimmer 9s linear infinite' }}>
            KI-Empfehlung<br/>& Optimierung
          </h1>
          <p style={{ margin:0, fontSize:'clamp(13px,1.4vw,15px)', color:'rgba(248,250,252,0.5)', lineHeight:1.8 }}>Deep-Q-Network analysiert Echtzeitzustand und liefert optimale Ladestrategien.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
            <button type="button" className="wai-btn-o" onClick={fetchRec} disabled={loading} style={{ background:'linear-gradient(90deg,#ff6b35,#ff9500)', color:'#0a0305', border:'none', borderRadius:999, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 32px rgba(255,107,53,0.32)', animation:'wai-glow-o 5s ease-in-out infinite' }}>{loading ? 'Analysiere…' : 'Empfehlung laden'}</button>
            <button type="button" className="wai-btn-g" style={{ background:'transparent', color:'rgba(255,149,0,0.9)', border:'1px solid rgba(255,107,53,0.32)', borderRadius:999, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', backdropFilter:'blur(12px)' }}>Verlauf anzeigen</button>
          </div>
        </div>

        <div aria-hidden="true" style={{ position:'absolute', zIndex:1, top:'50%', left:'50%', width:460, height:460, marginTop:-230, marginLeft:-230, borderRadius:'50%', border:'1px solid rgba(59,130,246,0.05)', animation:'wai-spin-slow 70s linear infinite', pointerEvents:'none' }}/>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)', display:'flex', flexDirection:'column', gap:16 }}>
        {rec && (
          <div className="wai-card" style={{ background:'rgba(4,6,20,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
            <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
            <div style={{ padding:'24px' }}>
              <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.7)', marginBottom:18 }}>Aktuelle Empfehlung</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
                {[
                  { label:'Aktion', value: rec.action ?? '—' },
                  { label:'Einsparung', value: rec.savings_eur != null ? `${rec.savings_eur.toFixed(2)} €` : '—' },
                  { label:'Konfidenz', value: rec.confidence != null ? `${(rec.confidence*100).toFixed(0)} %` : '—' },
                ].map(({label,value})=>(
                  <div key={label} style={{ background:'rgba(255,107,53,0.04)', border:'1px solid rgba(255,107,53,0.08)', borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:10, color:'rgba(248,250,252,0.38)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:'#ff9500', fontFamily:'monospace' }}>{value}</div>
                  </div>
                ))}
              </div>
              {rec.explanation && <p style={{ margin:'16px 0 0', fontSize:13, color:'rgba(248,250,252,0.5)', lineHeight:1.7 }}>{rec.explanation}</p>}
            </div>
          </div>
        )}
        <div className="wai-card" style={{ background:'rgba(4,6,20,0.65)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#ff9500)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(59,130,246,0.7)', marginBottom:18 }}>KI-Optimierungsplan</div>
            <PlanGate feature="ai.recommendations" featureName="KI-Empfehlungen" requiredPlan="pro">
              <p style={{ margin:0, color:'rgba(248,250,252,0.4)', fontSize:13 }}>KI-Planungsfeatures werden hier geladen…</p>
            </PlanGate>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KIDashboard;
