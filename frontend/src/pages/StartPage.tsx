/**
 * WattAI.live – Premium 4K Landing Page
 * 100 % Inline-Styles (kein Tailwind) → funktioniert mit Tailwind v3 + v4
 * Features:
 *  • Canvas 3D Energie-Netz im Hero (requestAnimationFrame)
 *  • Scroll-Reveal (IntersectionObserver)
 *  • Mouse-Parallax auf Hero-Visual
 *  • 3D Tilt auf Feature-Karten
 *  • Shimmer-Text, Glow-Pulse, Scan-Lines, Floating Particles
 *  • Alle Copy-Texte exakt wie vorgegeben
 */

import { useEffect, useRef, useState, useCallback, type CSSProperties, type MouseEvent as RMouseEvent } from 'react';
import { APPLICATIONS } from '../data/applications';

// ─── Types ────────────────────────────────────────────────────────────────────

type StartPageProps = {
  onNavigate: (page: 'home' | 'startseite' | 'produkte' | 'about' | 'kontakt') => void;
  onAuthClick: () => void;
  onUpgradeClick: () => void;
};

// ─── Design Tokens (all inline) ──────────────────────────────────────────────

const C = {
  bg: '#020617',
  surface: 'rgba(15,23,42,0.85)',
  surfaceHover: 'rgba(15,23,42,0.95)',
  border: 'rgba(103,232,249,0.15)',
  borderStrong: 'rgba(103,232,249,0.35)',
  cyan: '#22d3ee',
  cyanDim: '#67e8f9',
  blue: '#3b82f6',
  violet: '#7c3aed',
  white: '#f1f5f9',
  muted: '#94a3b8',
  mutedDark: '#475569',
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function useMouseParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = useCallback((e: RMouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  }, []);
  const onLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);
  return { ref, pos, onMove, onLeave };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: CSSProperties }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(44px)',
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function TiltCard({ children, style = {} }: { children: React.ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: RMouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 20;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -20;
    el.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg) translateY(-6px)`;
    el.style.boxShadow = `0 24px 60px rgba(34,211,238,0.18), 0 0 0 1px rgba(103,232,249,0.3)`;
  };
  const onLeave = () => {
    if (ref.current) { ref.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateY(0)'; ref.current.style.boxShadow = ''; }
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: 'transform 0.15s ease, box-shadow 0.15s ease', willChange: 'transform', transformStyle: 'preserve-3d', ...style }}>
      {children}
    </div>
  );
}

// 3D Canvas Energy Network
function EnergyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate nodes
    const nodes = Array.from({ length: 32 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r: 2 + Math.random() * 3,
      pulse: Math.random() * Math.PI * 2,
      energy: Math.random(),
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // Move nodes
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
        n.pulse += 0.03;
      });

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 180) continue;
          const alpha = (1 - dist / 180) * 0.6;
          // Animated flow dot along edge
          const flow = (t * 0.6 + i * 0.3) % 1;
          const fx = a.x * W + (b.x - a.x) * W * flow;
          const fy = a.y * H + (b.y - a.y) * H * flow;

          ctx.beginPath();
          ctx.moveTo(a.x * W, a.y * H);
          ctx.lineTo(b.x * W, b.y * H);
          const energy = (a.energy + b.energy) / 2;
          const r = Math.round(34 + energy * 180);
          const g = Math.round(211 + energy * 30);
          const bl = Math.round(238 - energy * 100);
          ctx.strokeStyle = `rgba(${r},${g},${bl},${alpha * 0.5})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Flow dot
          ctx.beginPath();
          ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${bl},${alpha})`;
          ctx.fill();
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        const x = n.x * W, y = n.y * H;
        const pulse = 0.6 + 0.4 * Math.sin(n.pulse);
        const r = n.r * pulse;
        const energy = n.energy;
        const cr = Math.round(34 + energy * 200);
        const cg = Math.round(211 - energy * 30);
        const cb = Math.round(238 - energy * 120);

        // Glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},0.4)`);
        grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        // Core
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.9)`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 32 }} />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StartPage({ onNavigate, onAuthClick, onUpgradeClick }: StartPageProps) {
  const { ref: heroRef, pos, onMove, onLeave } = useMouseParallax();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const W = 1100;

  const sec: CSSProperties = {
    width: '100%', maxWidth: W, margin: '0 auto',
    padding: 'clamp(40px,6vw,80px) clamp(16px,4vw,32px)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ color: C.white, width: '100%', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Global CSS animations ── */}
      <style>{`
        @keyframes wai-shimmer {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }
        @keyframes wai-pulse-ring {
          0%,100% { opacity:.5; transform:scale(1); }
          50%      { opacity:1; transform:scale(1.06); }
        }
        @keyframes wai-float {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-14px); }
        }
        @keyframes wai-particle {
          0%   { transform:translateY(0) translateX(0); opacity:0; }
          10%  { opacity:.7; }
          90%  { opacity:.7; }
          100% { transform:translateY(-160px) translateX(30px); opacity:0; }
        }
        @keyframes wai-spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes wai-reveal-up {
          from { opacity:0; transform:translateY(30px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes wai-glow-pulse {
          0%,100% { box-shadow: 0 0 24px rgba(34,211,238,0.3); }
          50%      { box-shadow: 0 0 60px rgba(34,211,238,0.65); }
        }
        @keyframes wai-scan {
          0%   { transform:translateY(-100%); }
          100% { transform:translateY(100vh); }
        }
        .wai-btn-primary:hover { filter:brightness(1.15); transform:translateY(-2px) scale(1.02); }
        .wai-btn-primary { transition:all .2s ease; }
        .wai-btn-secondary:hover { background:rgba(103,232,249,0.12)!important; border-color:rgba(103,232,249,0.5)!important; transform:translateY(-2px); }
        .wai-btn-secondary { transition:all .2s ease; }
        .wai-stat:hover { border-color:rgba(34,211,238,0.5)!important; background:rgba(34,211,238,0.08)!important; transform:translateY(-3px); }
        .wai-stat { transition:all .25s ease; }
      `}</style>

      {/* ── Ambient background orbs ── */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{
          position:'absolute', top:'-10%', left:'-8%', width:700, height:700, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(29,78,216,0.28) 0%, transparent 70%)',
          animation:'wai-float 20s ease-in-out infinite',
        }} />
        <div style={{
          position:'absolute', bottom:'-15%', right:'-10%', width:600, height:600, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)',
          animation:'wai-float 26s ease-in-out infinite reverse',
        }} />
        <div style={{
          position:'absolute', top:'40%', left:'40%', width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          animation:'wai-float 18s ease-in-out 4s infinite',
        }} />
        {/* Scan line */}
        <div style={{
          position:'absolute', left:0, right:0, height:2,
          background:'linear-gradient(90deg,transparent,rgba(34,211,238,0.15),transparent)',
          animation:'wai-scan 8s linear infinite', pointerEvents:'none',
        }} />
        {/* Particles */}
        {Array.from({length:20},(_,i)=>(
          <div key={i} aria-hidden="true" style={{
            position:'absolute',
            width: 1.5 + (i%3),
            height: 1.5 + (i%3),
            left:`${(i*37+13)%100}%`,
            top:`${(i*53+9)%100}%`,
            borderRadius:'50%',
            background: i%3===0 ? C.cyan : i%3===1 ? '#818cf8' : '#34d399',
            animation:`wai-particle ${10+(i%12)}s linear ${(i*1.4)%9}s infinite`,
            opacity:.4,
          }} />
        ))}
      </div>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ ...sec, position:'relative', zIndex:1, minHeight:'92vh', display:'flex', alignItems:'center', paddingTop:'clamp(60px,8vh,120px)' }}
      >
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:48, width:'100%' }}>

          {/* Text block – centered */}
          <div style={{ textAlign:'center', maxWidth:800, margin:'0 auto' }}>

            {/* Badge */}
            <Reveal delay={0}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'rgba(34,211,238,0.08)', border:`1px solid ${C.borderStrong}`,
                borderRadius:999, padding:'6px 18px', marginBottom:28, fontSize:13, color:C.cyanDim,
                backdropFilter:'blur(8px)',
              }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:C.cyan, display:'inline-block', animation:'wai-pulse-ring 2s ease-in-out infinite' }} />
                ⚡ Die smarte Energieplattform für Heim & Flotte
              </div>
            </Reveal>

            {/* H1 */}
            <Reveal delay={80}>
              <h1 style={{
                fontSize:'clamp(36px,6vw,76px)', fontWeight:900, lineHeight:1.08,
                letterSpacing:'-0.02em', margin:'0 0 24px',
              }}>
                <span style={{
                  background:'linear-gradient(135deg,#f1f5f9 0%,#67e8f9 40%,#22d3ee 60%,#818cf8 100%)',
                  backgroundSize:'300% auto',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  backgroundClip:'text',
                  animation:'wai-shimmer 5s linear infinite',
                  display:'block',
                }}>
                  Deine Energie.
                </span>
                <span style={{
                  background:'linear-gradient(135deg,#e2e8f0 0%,#22d3ee 50%,#06b6d4 100%)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  backgroundClip:'text', display:'block', marginTop:4,
                }}>
                  Intelligent gesteuert.
                </span>
              </h1>
            </Reveal>

            {/* Subheadline */}
            <Reveal delay={160}>
              <p style={{ fontSize:'clamp(15px,2vw,19px)', color:C.muted, maxWidth:660, margin:'0 auto 40px', lineHeight:1.75 }}>
                WattAI.live verbindet PV-Anlage, Batteriespeicher, Wärmepumpe und Elektroauto zu einem
                intelligenten Ökosystem — in Echtzeit, DSGVO-konform und planbasiert.
              </p>
            </Reveal>

            {/* CTAs */}
            <Reveal delay={240}>
              <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
                <button type="button" onClick={() => onNavigate('home')}
                  className="wai-btn-primary"
                  style={{
                    background:'linear-gradient(90deg,#0ea5e9,#06b6d4,#22d3ee)',
                    backgroundSize:'200% auto',
                    color:'#000', border:'none', borderRadius:999,
                    padding:'14px 32px', fontWeight:800, fontSize:16, cursor:'pointer',
                    boxShadow:'0 0 40px rgba(34,211,238,0.45)',
                    animation:'wai-glow-pulse 3s ease-in-out infinite',
                  }}>
                  🚀 Dashboard starten
                </button>
                <button type="button" onClick={() => onNavigate('produkte')}
                  className="wai-btn-secondary"
                  style={{
                    background:'transparent', color:C.cyanDim,
                    border:`1px solid ${C.borderStrong}`, borderRadius:999,
                    padding:'14px 32px', fontWeight:700, fontSize:16, cursor:'pointer',
                    backdropFilter:'blur(8px)',
                  }}>
                  Preise &amp; Pläne ansehen →
                </button>
              </div>
            </Reveal>
          </div>

          {/* 3D Canvas Hero visual */}
          <Reveal delay={320} style={{ width:'100%' }}>
            <div style={{
              position:'relative', width:'100%', height:'clamp(300px,40vw,520px)',
              borderRadius:32,
              border:`1px solid ${C.borderStrong}`,
              background:'rgba(2,6,23,0.7)',
              overflow:'hidden',
              boxShadow:'0 0 120px rgba(34,211,238,0.18), 0 0 0 1px rgba(34,211,238,0.08)',
              transform:`perspective(1200px) rotateY(${pos.x*4}deg) rotateX(${pos.y*-2}deg)`,
              transition:'transform 0.08s linear',
            }}>
              <EnergyCanvas />

              {/* Overlay gradient */}
              <div aria-hidden="true" style={{
                position:'absolute', inset:0,
                background:'radial-gradient(ellipse at center, transparent 40%, rgba(2,6,23,0.7) 100%)',
                pointerEvents:'none',
              }} />

              {/* Live stat overlays */}
              <div style={{
                position:'absolute', top:20, left:20,
                background:'rgba(2,6,23,0.75)', border:`1px solid ${C.borderStrong}`,
                borderRadius:14, padding:'12px 18px', backdropFilter:'blur(12px)',
              }}>
                <p style={{ margin:0, fontSize:11, color:C.cyan, textTransform:'uppercase', letterSpacing:'0.12em' }}>Live Energy Flow</p>
                <p style={{ margin:'4px 0 0', fontSize:28, fontWeight:900, color:'#fff' }}>+48.7 kW</p>
              </div>

              <div style={{
                position:'absolute', bottom:20, right:20,
                background:'rgba(2,6,23,0.75)', border:`1px solid rgba(52,211,153,0.3)`,
                borderRadius:14, padding:'12px 18px', backdropFilter:'blur(12px)',
              }}>
                <p style={{ margin:0, fontSize:11, color:'#34d399', textTransform:'uppercase', letterSpacing:'0.12em' }}>Grid AI Status</p>
                <p style={{ margin:'4px 0 0', fontSize:16, fontWeight:700, color:'#fff' }}>● Optimized</p>
              </div>

              {/* Progress bars */}
              <div style={{
                position:'absolute', bottom:20, left:20,
                background:'rgba(2,6,23,0.75)', border:`1px solid ${C.border}`,
                borderRadius:14, padding:'12px 18px', backdropFilter:'blur(12px)', minWidth:180,
              }}>
                {[
                  { label:'PV Output', pct:93, color:'#fbbf24' },
                  { label:'Battery AI', pct:78, color:C.cyan },
                  { label:'EV Sync', pct:64, color:'#818cf8' },
                ].map(b => (
                  <div key={b.label} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.muted, marginBottom:3 }}>
                      <span>{b.label}</span><span style={{ color:'#fff', fontWeight:600 }}>{b.pct}%</span>
                    </div>
                    <div style={{ height:4, borderRadius:4, background:'rgba(255,255,255,0.08)' }}>
                      <div style={{ height:4, borderRadius:4, width:`${b.pct}%`, background:b.color,
                        boxShadow:`0 0 8px ${b.color}80`, transition:'width 1.2s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Spinning ring decoration */}
              <div aria-hidden="true" style={{
                position:'absolute', top:'50%', left:'50%',
                width:200, height:200, marginTop:-100, marginLeft:-100,
                borderRadius:'50%', pointerEvents:'none',
                border:'1px solid rgba(34,211,238,0.12)',
                animation:'wai-spin 20s linear infinite',
              }} />
              <div aria-hidden="true" style={{
                position:'absolute', top:'50%', left:'50%',
                width:320, height:320, marginTop:-160, marginLeft:-160,
                borderRadius:'50%', pointerEvents:'none',
                border:'1px solid rgba(124,58,237,0.1)',
                animation:'wai-spin 30s linear infinite reverse',
              }} />
            </div>
          </Reveal>

          {/* Scroll indicator */}
          <div style={{ textAlign:'center', marginTop:-16 }}>
            <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:6, opacity:.4 }}>
              <span style={{ fontSize:10, letterSpacing:'0.35em', textTransform:'uppercase', color:C.muted }}>Scroll</span>
              <div style={{ width:1, height:36, background:`linear-gradient(to bottom, ${C.cyan}, transparent)`, animation:'wai-pulse-ring 2s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STAT BAR
      ════════════════════════════════════════════ */}
      <Reveal>
        <section style={{
          background:'rgba(15,23,42,0.7)',
          borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`,
          padding:'32px 0', position:'relative', zIndex:1,
          backdropFilter:'blur(12px)',
        }}>
          <div style={{ ...sec, padding:'0 clamp(16px,4vw,32px)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16 }}>
              {[
                { value:'< 2 min', label:'Einrichtungszeit', icon:'⚡' },
                { value:'98 %',    label:'Uptime SLA',       icon:'🛡️' },
                { value:'30 %',    label:'Ø Einsparung',     icon:'📉' },
                { value:'ISO 15118', label:'V2G-Standard',   icon:'🔌' },
                { value:'DSGVO',   label:'Datenschutz Art. 6', icon:'🔒' },
              ].map(s => (
                <div key={s.label} className="wai-stat" style={{
                  textAlign:'center', padding:'20px 12px', borderRadius:16,
                  border:`1px solid ${C.border}`,
                  background:'rgba(15,23,42,0.6)',
                  backdropFilter:'blur(8px)',
                  cursor:'default',
                }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                  <div style={{ fontSize:'clamp(18px,2.5vw,28px)', fontWeight:800, color:C.cyan, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:11, color:C.mutedDark, marginTop:5, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════ */}
      <section style={{ ...sec, position:'relative', zIndex:1 }}>
        <Reveal>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <p style={{ fontSize:12, letterSpacing:'0.4em', textTransform:'uppercase', color:C.cyan, marginBottom:12 }}>
              Alles in einem System
            </p>
            <h2 style={{ fontSize:'clamp(26px,4vw,48px)', fontWeight:900, margin:'0 0 16px', lineHeight:1.15 }}>
              High-End Energie- und Lademanagement
            </h2>
            <p style={{ fontSize:16, color:C.muted, maxWidth:560, margin:'0 auto', lineHeight:1.7 }}>
              Modulare KI-Architektur, 3D-Dashboards und Echtzeit-Steuerung für PV, Speicher, EV und Smart Home.
            </p>
          </div>
        </Reveal>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:20 }}>
          {APPLICATIONS.map((f, i) => (
            <Reveal key={f.slug} delay={i * 60}>
              <TiltCard>
                <div
                  style={{
                    position:'relative', borderRadius:20, overflow:'hidden',
                    border:`1px solid ${hoveredCard===f.slug ? 'rgba(103,232,249,0.45)' : C.border}`,
                    background: f.cardBackground,
                    padding:'28px 24px', minHeight:240,
                    transition:'border-color 0.2s ease',
                    cursor:'pointer',
                  }}
                  onMouseEnter={() => setHoveredCard(f.slug)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Icon */}
                  <div style={{
                    width:50, height:50, borderRadius:14,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:26, marginBottom:16,
                    background:'rgba(2,6,23,0.5)', border:'1px solid rgba(125,211,252,0.3)',
                    backdropFilter:'blur(4px)',
                    boxShadow: hoveredCard===f.slug ? '0 0 20px rgba(34,211,238,0.3)' : 'none',
                    transition:'box-shadow 0.2s ease',
                  }}>
                    {f.icon}
                  </div>

                  <h3 style={{ margin:'0 0 10px', fontSize:17, fontWeight:800, color:'#f1f5f9' }}>{f.title}</h3>
                  <p style={{ margin:'0 0 16px', fontSize:13, color:'#dbeafe', lineHeight:1.7 }}>{f.desc}</p>

                  {/* Action button */}
                  <button
                    type="button"
                    onClick={() => onNavigate('produkte')}
                    style={{
                      background: hoveredCard===f.slug
                        ? 'linear-gradient(90deg,rgba(34,211,238,0.2),rgba(59,130,246,0.2))'
                        : 'rgba(34,211,238,0.06)',
                      border:`1px solid ${hoveredCard===f.slug ? 'rgba(34,211,238,0.5)' : 'rgba(34,211,238,0.2)'}`,
                      borderRadius:999, color:'#7dd3fc', fontSize:12, fontWeight:700,
                      padding:'7px 16px', cursor:'pointer', transition:'all .2s ease',
                      backdropFilter:'blur(4px)',
                    }}
                  >
                    Technische Details →
                  </button>

                  {/* Glow corner */}
                  {hoveredCard===f.slug && (
                    <div aria-hidden="true" style={{
                      position:'absolute', top:-30, right:-30, width:120, height:120,
                      borderRadius:'50%', background:'rgba(34,211,238,0.12)',
                      filter:'blur(24px)', pointerEvents:'none',
                    }} />
                  )}
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════ */}
      <Reveal>
        <section style={{ ...sec, position:'relative', zIndex:1 }}>
          <div style={{
            position:'relative', borderRadius:24, overflow:'hidden',
            border:`1px solid rgba(34,211,238,0.25)`,
            background:'linear-gradient(135deg,rgba(6,182,212,0.12),rgba(139,92,246,0.08))',
            padding:'clamp(40px,5vw,64px) clamp(24px,5vw,56px)',
            backdropFilter:'blur(16px)',
          }}>
            {/* Background glow */}
            <div aria-hidden="true" style={{
              position:'absolute', top:0, right:0, width:400, height:400,
              borderRadius:'50%', background:'radial-gradient(circle,rgba(34,211,238,0.12),transparent 70%)',
              pointerEvents:'none',
            }} />
            <div aria-hidden="true" style={{
              position:'absolute', bottom:0, left:0, width:300, height:300,
              borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.1),transparent 70%)',
              pointerEvents:'none',
            }} />

            <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
              <p style={{ fontSize:12, letterSpacing:'0.4em', textTransform:'uppercase', color:C.cyan, marginBottom:16 }}>
                Kostenlos starten
              </p>
              <h2 style={{ fontSize:'clamp(22px,3.5vw,40px)', fontWeight:900, margin:'0 0 16px', lineHeight:1.2 }}>
                Kostenlos starten — jetzt upgraden wenn du bereit bist
              </h2>
              <p style={{ color:C.muted, fontSize:15, marginBottom:36, maxWidth:480, margin:'0 auto 36px', lineHeight:1.7 }}>
                Kein Abo-Zwang, keine Kreditkarte nötig. Einfach registrieren und loslegen.
              </p>

              <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
                <button type="button" onClick={onAuthClick}
                  className="wai-btn-primary"
                  style={{
                    background:'linear-gradient(90deg,#0ea5e9,#06b6d4)',
                    color:'#000', border:'none', borderRadius:999,
                    padding:'14px 32px', fontWeight:800, fontSize:16, cursor:'pointer',
                    boxShadow:'0 0 40px rgba(34,211,238,0.45)',
                  }}>
                  🔐 Kostenlos registrieren
                </button>
                <button type="button" onClick={onUpgradeClick}
                  className="wai-btn-secondary"
                  style={{
                    background:'transparent', color:'#a78bfa',
                    border:'1px solid rgba(167,139,250,0.4)', borderRadius:999,
                    padding:'14px 32px', fontWeight:700, fontSize:16, cursor:'pointer',
                    backdropFilter:'blur(8px)',
                  }}>
                  ⚡ Pläne vergleichen
                </button>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
