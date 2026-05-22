/**
 * WattAI.live — Slow Cinema Landing Page
 * Pure inline styles. No Tailwind.
 * Philosophy: slow motion, intentional pacing, mysterious.
 * All animations: 8–30 s. Transitions: 0.8–1.6 s.
 */

import { useEffect, useRef, useState, useCallback, type CSSProperties, type MouseEvent as RMouseEvent } from 'react';
import { APPLICATIONS } from '../data/applications';

// ─── Types ───────────────────────────────────────────────────────────────────

type StartPageProps = {
  onNavigate: (page: 'home' | 'startseite' | 'produkte' | 'about' | 'kontakt') => void;
  onAuthClick: () => void;
  onUpgradeClick: () => void;
};

// ─── Tokens ──────────────────────────────────────────────────────────────────

const C = {
  border: 'rgba(103,232,249,0.12)',
  cyan: '#22d3ee',
  cyanDim: '#67e8f9',
  muted: '#94a3b8',
  mutedDark: '#334155',
  white: '#f1f5f9',
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, on };
}

function useParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = useCallback((e: RMouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    });
  }, []);
  const onLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);
  return { ref, pos, onMove, onLeave };
}

// ─── Reveal wrapper ──────────────────────────────────────────────────────────

function Fade({
  children, delay = 0, y = 32, style = {},
}: {
  children: React.ReactNode; delay?: number; y?: number; style?: CSSProperties;
}) {
  const { ref, on } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: on ? 1 : 0,
      transform: on ? 'translateY(0) scale(1)' : `translateY(${y}px) scale(0.98)`,
      transition: `opacity 1.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 1.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── 3D Tilt ─────────────────────────────────────────────────────────────────

function Tilt({ children, style = {} }: { children: React.ReactNode; style?: CSSProperties }) {
  const r = useRef<HTMLDivElement>(null);
  const onMove = (e: RMouseEvent<HTMLDivElement>) => {
    const el = r.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const rx = ((e.clientX - b.left) / b.width - 0.5) * 14;
    const ry = ((e.clientY - b.top) / b.height - 0.5) * -14;
    el.style.transform = `perspective(1000px) rotateY(${rx}deg) rotateX(${ry}deg) translateY(-8px)`;
    el.style.boxShadow = '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(103,232,249,0.25)';
  };
  const onLeave = () => {
    if (!r.current) return;
    r.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) translateY(0)';
    r.current.style.boxShadow = '';
  };
  return (
    <div ref={r} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{
        transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1), box-shadow 0.8s ease',
        transformStyle: 'preserve-3d', willChange: 'transform', ...style,
      }}>
      {children}
    </div>
  );
}

// ─── Slow Plasma Canvas ───────────────────────────────────────────────────────

function PlasmaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    let t = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: 18 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00008,
      vy: (Math.random() - 0.5) * 0.00008,
      phase: Math.random() * Math.PI * 2,
      hue: 180 + Math.random() * 80,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.fillStyle = 'rgba(2,6,23,0.04)';
      ctx.fillRect(0, 0, W, H);
      t += 0.002;

      nodes.forEach(n => {
        n.x += n.vx + Math.sin(t * 0.3 + n.phase) * 0.00012;
        n.y += n.vy + Math.cos(t * 0.2 + n.phase * 1.3) * 0.00012;
        if (n.x < 0) n.x = 1; if (n.x > 1) n.x = 0;
        if (n.y < 0) n.y = 1; if (n.y > 1) n.y = 0;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 220) continue;
          const breathe = 0.5 + 0.5 * Math.sin(t * 0.5 + i + j);
          const alpha = (1 - dist / 220) * 0.3 * breathe;
          const flow = ((t * 0.15 + i * 0.5) % 1);
          const fx = a.x * W + (b.x - a.x) * W * flow;
          const fy = a.y * H + (b.y - a.y) * H * flow;
          const grad = ctx.createLinearGradient(a.x * W, a.y * H, b.x * W, b.y * H);
          grad.addColorStop(0, `hsla(${a.hue},80%,65%,${alpha})`);
          grad.addColorStop(1, `hsla(${b.hue},80%,65%,${alpha * 0.3})`);
          ctx.beginPath();
          ctx.moveTo(a.x * W, a.y * H);
          ctx.lineTo(b.x * W, b.y * H);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 0.6;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${(a.hue + b.hue) / 2},90%,80%,${alpha * 2})`;
          ctx.fill();
        }
      }

      nodes.forEach(n => {
        const x = n.x * W, y = n.y * H;
        const pulse = 0.4 + 0.6 * Math.sin(t * 0.7 + n.phase);
        const nr = 1.5 + pulse * 2.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, nr * 6);
        g.addColorStop(0, `hsla(${n.hue},80%,70%,${0.4 * pulse})`);
        g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(x, y, nr * 6, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, nr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${n.hue},90%,75%,0.8)`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas ref={canvasRef} aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
  );
}

// ─── SVG Visuals per Application (no emoji) ──────────────────────────────────

function PvVisual() {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      {/* Production curve */}
      <polyline points="0,80 20,70 40,50 60,30 80,22 100,26 120,44 140,62 160,75"
        stroke="rgba(251,191,36,0.55)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <polyline points="0,80 20,70 40,50 60,30 80,22 100,26 120,44 140,62 160,75"
        stroke="rgba(251,191,36,0.1)" strokeWidth="9" fill="none" strokeLinecap="round" />
      {/* Sun */}
      <circle cx="80" cy="22" r="5.5" fill="rgba(251,191,36,0.9)">
        <animate attributeName="r" values="5.5;7;5.5" dur="7s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;1;0.9" dur="7s" repeatCount="indefinite" />
      </circle>
      {[14, 22, 33].map((rad, i) => (
        <circle key={i} cx="80" cy="22" r={rad}
          stroke="rgba(251,191,36,0.15)" strokeWidth="0.7" fill="none">
          <animate attributeName="r" values={`${rad};${rad + 4};${rad}`} dur={`${9 + i * 5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.03;0.15" dur={`${9 + i * 5}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = angle * Math.PI / 180;
        return (
          <line key={i}
            x1={80 + Math.cos(rad) * 9} y1={22 + Math.sin(rad) * 9}
            x2={80 + Math.cos(rad) * 18} y2={22 + Math.sin(rad) * 18}
            stroke="rgba(251,191,36,0.4)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;0.1;0.4"
              dur={`${4 + (i % 3)}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </line>
        );
      })}
      {[35, 55, 72].map(yg => (
        <line key={yg} x1="0" y1={yg} x2="160" y2={yg}
          stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 10" />
      ))}
    </svg>
  );
}

function BatteryVisual() {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      <defs>
        <linearGradient id="bat-fill" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="rgba(6,182,212,0.7)" />
          <stop offset="1" stopColor="rgba(34,211,238,0.2)" />
        </linearGradient>
        <clipPath id="bat-clip"><rect x="48" y="18" width="44" height="58" rx="3" /></clipPath>
      </defs>
      {/* Front face */}
      <rect x="48" y="18" width="44" height="58" rx="4"
        fill="rgba(15,23,42,0.8)" stroke="rgba(34,211,238,0.35)" strokeWidth="1" />
      {/* Top cap */}
      <rect x="61" y="12" width="18" height="8" rx="2"
        fill="rgba(34,211,238,0.2)" stroke="rgba(34,211,238,0.4)" strokeWidth="0.8" />
      {/* Right 3D face */}
      <path d="M92 22 L108 14 L108 70 L92 76 Z"
        fill="rgba(8,145,178,0.12)" stroke="rgba(34,211,238,0.12)" strokeWidth="0.5" />
      {/* Top 3D face */}
      <path d="M48 18 L64 10 L108 10 L92 18 Z"
        fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.18)" strokeWidth="0.5" />
      {/* Cell lines */}
      {[32, 44, 56].map(y => (
        <line key={y} x1="49" y1={y} x2="91" y2={y} stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" />
      ))}
      {/* Charge fill animated */}
      <rect x="49" y="18" width="42" height="57" rx="3" fill="rgba(34,211,238,0.04)" />
      <rect x="49" y="18" width="42" height="57" rx="3" fill="url(#bat-fill)" clipPath="url(#bat-clip)">
        <animate attributeName="y" values="53;33;53" dur="14s" repeatCount="indefinite" />
        <animate attributeName="height" values="22;42;22" dur="14s" repeatCount="indefinite" />
      </rect>
      {/* Percentage */}
      <text x="70" y="50" textAnchor="middle" fill="rgba(103,232,249,0.75)"
        fontSize="10" fontFamily="monospace" fontWeight="bold">
        78%
        <animate attributeName="opacity" values="0.75;1;0.75" dur="5s" repeatCount="indefinite" />
      </text>
      {/* Bolt */}
      <path d="M66 25 L62 37 L67 37 L64 50 L74 33 L69 33 Z"
        fill="rgba(34,211,238,0.5)" stroke="rgba(34,211,238,0.9)" strokeWidth="0.4">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3.5s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function EvVisual() {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      {/* House */}
      <path d="M10 48 L10 72 L36 72 L36 48 L23 34 Z"
        fill="rgba(124,58,237,0.1)" stroke="rgba(167,139,250,0.5)" strokeWidth="1" strokeLinejoin="round" />
      <rect x="15" y="56" width="9" height="16" rx="1" fill="rgba(124,58,237,0.2)" />
      <circle cx="23" cy="45" r="3" fill="rgba(167,139,250,0.3)">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="5s" repeatCount="indefinite" />
      </circle>
      {/* EV */}
      <rect x="110" y="52" width="44" height="17" rx="4"
        fill="rgba(59,130,246,0.15)" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
      <path d="M118 52 L123 43 L148 43 L153 52"
        fill="rgba(59,130,246,0.12)" stroke="rgba(96,165,250,0.4)" strokeWidth="0.8" />
      <circle cx="122" cy="70" r="5" fill="rgba(15,23,42,0.9)" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
      <circle cx="148" cy="70" r="5" fill="rgba(15,23,42,0.9)" stroke="rgba(96,165,250,0.5)" strokeWidth="1" />
      <rect x="110" y="57" width="4" height="7" rx="1" fill="rgba(34,211,238,0.6)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
      </rect>
      {/* Flow paths */}
      <path id="ev-fwd" d="M38 58 Q80 36 110 58" fill="none" />
      <path id="ev-rev" d="M110 62 Q80 84 38 62" fill="none" />
      <path d="M38 58 Q80 36 110 58" stroke="rgba(103,232,249,0.12)" strokeWidth="1.2"
        strokeDasharray="5 7" fill="none" />
      <path d="M110 62 Q80 84 38 62" stroke="rgba(167,139,250,0.12)" strokeWidth="1.2"
        strokeDasharray="5 7" fill="none" />
      <circle r="3" fill="rgba(34,211,238,0.9)">
        <animateMotion dur="5s" repeatCount="indefinite" begin="0s">
          <mpath xlinkHref="#ev-fwd" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle r="2.5" fill="rgba(167,139,250,0.9)">
        <animateMotion dur="7s" repeatCount="indefinite" begin="2.5s">
          <mpath xlinkHref="#ev-rev" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="7s" begin="2.5s" repeatCount="indefinite" />
      </circle>
      <text x="23" y="84" textAnchor="middle" fill="rgba(167,139,250,0.5)" fontSize="6" fontFamily="monospace">HOME</text>
      <text x="133" y="84" textAnchor="middle" fill="rgba(96,165,250,0.5)" fontSize="6" fontFamily="monospace">EV</text>
      <text x="80" y="32" textAnchor="middle" fill="rgba(34,211,238,0.45)" fontSize="6" fontFamily="monospace">V2H · V2G</text>
    </svg>
  );
}

function SmartHomeVisual() {
  const deviceNodes = [
    { x: 28, y: 40, d: '0s', label: 'HP' },
    { x: 58, y: 28, d: '1.8s', label: 'TV' },
    { x: 38, y: 64, d: '3.2s', label: 'WM' },
    { x: 100, y: 26, d: '1s', label: 'AC' },
    { x: 132, y: 62, d: '2.4s', label: 'BAT' },
    { x: 116, y: 46, d: '4s', label: 'PV' },
  ];
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      <rect x="8" y="12" width="144" height="66" rx="2"
        stroke="rgba(52,211,153,0.18)" strokeWidth="0.8" fill="none" />
      <line x1="80" y1="12" x2="80" y2="78" stroke="rgba(52,211,153,0.1)" strokeWidth="0.5" />
      <line x1="8" y1="50" x2="80" y2="50" stroke="rgba(52,211,153,0.1)" strokeWidth="0.5" />
      <line x1="80" y1="46" x2="152" y2="46" stroke="rgba(52,211,153,0.1)" strokeWidth="0.5" />
      <text x="44" y="34" textAnchor="middle" fill="rgba(52,211,153,0.22)" fontSize="7" fontFamily="monospace">WOHNZIMMER</text>
      <text x="44" y="66" textAnchor="middle" fill="rgba(52,211,153,0.22)" fontSize="7" fontFamily="monospace">KÜCHE</text>
      <text x="116" y="32" textAnchor="middle" fill="rgba(52,211,153,0.22)" fontSize="7" fontFamily="monospace">SCHLAFZIMMER</text>
      <text x="116" y="64" textAnchor="middle" fill="rgba(52,211,153,0.22)" fontSize="7" fontFamily="monospace">TECHNIK</text>
      {deviceNodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="7" fill="transparent" stroke="rgba(52,211,153,0.2)" strokeWidth="0.6">
            <animate attributeName="r" values="7;12;7" dur="9s" begin={n.d} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="9s" begin={n.d} repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r="3" fill="rgba(52,211,153,0.85)">
            <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" begin={n.d} repeatCount="indefinite" />
          </circle>
          <text x={n.x} y={n.y + 13} textAnchor="middle" fill="rgba(52,211,153,0.35)" fontSize="5" fontFamily="monospace">{n.label}</text>
        </g>
      ))}
      <line x1="28" y1="40" x2="58" y2="28" stroke="rgba(52,211,153,0.07)" strokeWidth="0.5" strokeDasharray="3 6" />
      <line x1="58" y1="28" x2="100" y2="26" stroke="rgba(52,211,153,0.07)" strokeWidth="0.5" strokeDasharray="3 6" />
      <line x1="132" y1="62" x2="116" y2="46" stroke="rgba(52,211,153,0.07)" strokeWidth="0.5" strokeDasharray="3 6" />
    </svg>
  );
}

function KiVisual() {
  const inputY = [18, 46, 74];
  const hiddenY = [14, 36, 58, 80];
  const outputY = [32, 62];
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      {inputY.map(iy => hiddenY.map(hy => (
        <line key={`${iy}-${hy}`} x1="34" y1={iy} x2="88" y2={hy}
          stroke="rgba(129,140,248,0.1)" strokeWidth="0.5">
          <animate attributeName="opacity" values="0.1;0.28;0.1"
            dur={`${6 + (iy + hy) % 5}s`} repeatCount="indefinite" />
        </line>
      )))}
      {hiddenY.map(hy => outputY.map(oy => (
        <line key={`${hy}-${oy}`} x1="88" y1={hy} x2="136" y2={oy}
          stroke="rgba(129,140,248,0.1)" strokeWidth="0.5">
          <animate attributeName="opacity" values="0.1;0.38;0.1"
            dur={`${7 + (hy + oy) % 4}s`} repeatCount="indefinite" />
        </line>
      )))}
      {/* Slow pulses */}
      {[
        { x1: 34, y1: 46, x2: 88, y2: 36, d: '0s', t: '5s', id: 'kp0' },
        { x1: 34, y1: 18, x2: 88, y2: 58, d: '2s', t: '6s', id: 'kp1' },
        { x1: 88, y1: 14, x2: 136, y2: 32, d: '1s', t: '5s', id: 'kp2' },
        { x1: 88, y1: 80, x2: 136, y2: 62, d: '3s', t: '4.5s', id: 'kp3' },
      ].map((p, i) => (
        <g key={i}>
          <path id={p.id} d={`M${p.x1},${p.y1} L${p.x2},${p.y2}`} fill="none" />
          <circle r="2" fill="rgba(129,140,248,0.9)">
            <animateMotion dur={p.t} repeatCount="indefinite" begin={p.d}>
              <mpath xlinkHref={`#${p.id}`} />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={p.t} begin={p.d} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {inputY.map((y, i) => (
        <g key={i}>
          <circle cx="34" cy={y} r="5" fill="rgba(129,140,248,0.15)" stroke="rgba(129,140,248,0.4)" strokeWidth="0.8">
            <animate attributeName="opacity" values="0.8;1;0.8" dur={`${3 + i}s`} repeatCount="indefinite" />
          </circle>
          <text x="12" y={y + 3} textAnchor="middle" fill="rgba(129,140,248,0.4)" fontSize="5" fontFamily="monospace">
            {['PV', 'BAT', 'GRID'][i]}
          </text>
        </g>
      ))}
      {hiddenY.map((y, i) => (
        <circle key={i} cx="88" cy={y} r="5" fill="rgba(129,140,248,0.08)" stroke="rgba(129,140,248,0.28)" strokeWidth="0.8">
          <animate attributeName="fill" values="rgba(129,140,248,0.08);rgba(129,140,248,0.28);rgba(129,140,248,0.08)"
            dur={`${4 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {outputY.map((y, i) => (
        <g key={i}>
          <circle cx="136" cy={y} r="6" fill="rgba(129,140,248,0.18)" stroke="rgba(129,140,248,0.6)" strokeWidth="1">
            <animate attributeName="opacity" values="0.8;1;0.8" dur={`${4 + i * 2}s`} repeatCount="indefinite" />
          </circle>
          <text x="150" y={y + 3} textAnchor="start" fill="rgba(129,140,248,0.45)" fontSize="5" fontFamily="monospace">
            {['LOAD', 'SELL'][i]}
          </text>
        </g>
      ))}
      <text x="34" y="88" textAnchor="middle" fill="rgba(129,140,248,0.22)" fontSize="5.5" fontFamily="monospace">INPUT</text>
      <text x="88" y="88" textAnchor="middle" fill="rgba(129,140,248,0.22)" fontSize="5.5" fontFamily="monospace">DQN</text>
      <text x="136" y="88" textAnchor="middle" fill="rgba(129,140,248,0.22)" fontSize="5.5" fontFamily="monospace">ACTION</text>
    </svg>
  );
}

function FleetVisual() {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      <defs>
        <linearGradient id="wave-g" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="transparent" />
          <stop offset="0.5" stopColor="rgba(251,146,60,0.55)" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4, 5].map(i => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = 14 + col * 48, y = 14 + row * 40;
        const delaySec = col * 1.4 + row * 0.7;
        const socW = 8 + (i * 11) % 22;
        return (
          <g key={i}>
            <rect x={x} y={y} width="36" height="22" rx="3"
              fill="rgba(251,146,60,0.05)" stroke="rgba(251,146,60,0.2)" strokeWidth="0.6">
              <animate attributeName="stroke" values="rgba(251,146,60,0.2);rgba(251,146,60,0.55);rgba(251,146,60,0.2)"
                dur="9s" begin={`${delaySec}s`} repeatCount="indefinite" />
            </rect>
            <rect x={x + 4} y={y + 7} width="28" height="10" rx="2" fill="rgba(251,146,60,0.18)">
              <animate attributeName="fill"
                values="rgba(251,146,60,0.18);rgba(251,146,60,0.45);rgba(251,146,60,0.18)"
                dur="9s" begin={`${delaySec}s`} repeatCount="indefinite" />
            </rect>
            <path d={`M${x + 8} ${y + 7} L${x + 11} ${y + 3} L${x + 25} ${y + 3} L${x + 28} ${y + 7}`}
              fill="rgba(251,146,60,0.12)" />
            <circle cx={x + 11} cy={y + 18} r="2.5"
              fill="rgba(15,23,42,0.9)" stroke="rgba(251,146,60,0.4)" strokeWidth="0.5" />
            <circle cx={x + 25} cy={y + 18} r="2.5"
              fill="rgba(15,23,42,0.9)" stroke="rgba(251,146,60,0.4)" strokeWidth="0.5" />
            <rect x={x + 4} y={y + 1} width="28" height="3" rx="1" fill="rgba(255,255,255,0.05)" />
            <rect x={x + 4} y={y + 1} width={socW} height="3" rx="1" fill="rgba(251,146,60,0.5)">
              <animate attributeName="width" values={`${socW};${socW + 10};${socW}`}
                dur={`${11 + i * 2}s`} repeatCount="indefinite" />
            </rect>
          </g>
        );
      })}
      <rect x="0" y="0" width="10" height="90" fill="url(#wave-g)" opacity="0.4">
        <animate attributeName="x" values="-10;170;-10" dur="7s" repeatCount="indefinite" />
      </rect>
      <text x="80" y="88" textAnchor="middle" fill="rgba(251,146,60,0.28)" fontSize="6" fontFamily="monospace">
        FLEET DISPATCH · KI-OPTIMIZED
      </text>
    </svg>
  );
}

const VISUAL_MAP: Record<string, () => React.ReactElement> = {
  'pv-optimierung': PvVisual,
  'batteriemanagement': BatteryVisual,
  'ev-v2h-v2g': EvVisual,
  'smart-home': SmartHomeVisual,
  'ki-empfehlung': KiVisual,
  'flottenmanagement': FleetVisual,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StartPage({ onNavigate, onAuthClick, onUpgradeClick }: StartPageProps) {
  const { ref: heroRef, pos, onMove, onLeave } = useParallax();
  const [hovered, setHovered] = useState<string | null>(null);

  const sec: CSSProperties = {
    width: '100%', maxWidth: 1100, margin: '0 auto',
    padding: 'clamp(48px,7vw,96px) clamp(16px,4vw,32px)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ color: C.white, width: '100%', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes wai-drift {
          0%,100% { transform:translateY(0) translateX(0); }
          33%      { transform:translateY(-18px) translateX(10px); }
          66%      { transform:translateY(8px) translateX(-8px); }
        }
        @keyframes wai-shimmer {
          0%   { background-position:-300% center; }
          100% { background-position:300% center; }
        }
        @keyframes wai-breath {
          0%,100% { opacity:.4; transform:scale(1); }
          50%      { opacity:.9; transform:scale(1.12); }
        }
        @keyframes wai-scan {
          0%   { transform:translateY(-4px); }
          100% { transform:translateY(100vh); }
        }
        @keyframes wai-orb {
          0%,100% { opacity:.16; transform:scale(1); }
          50%      { opacity:.26; transform:scale(1.06); }
        }
        @keyframes wai-glow {
          0%,100% { box-shadow:0 0 32px rgba(34,211,238,0.18); }
          50%      { box-shadow:0 0 72px rgba(34,211,238,0.42); }
        }
        @keyframes wai-spin-slow {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        .wai-cta-p { transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .wai-cta-p:hover { filter:brightness(1.2); transform:translateY(-3px) scale(1.02); }
        .wai-cta-g { transition:all 0.7s cubic-bezier(0.16,1,0.3,1); }
        .wai-cta-g:hover { background:rgba(103,232,249,0.07)!important; border-color:rgba(103,232,249,0.38)!important; transform:translateY(-2px); }
        .wai-stat { transition:all 0.9s cubic-bezier(0.16,1,0.3,1); }
        .wai-stat:hover { border-color:rgba(34,211,238,0.38)!important; background:rgba(34,211,238,0.05)!important; transform:translateY(-4px); }
      `}</style>

      {/* ── Ambient background ── */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-12%', left: '-10%', width: 800, height: 800, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(29,78,216,0.2) 0%,transparent 65%)',
          animation: 'wai-orb 24s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-12%', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(124,58,237,0.16) 0%,transparent 65%)',
          animation: 'wai-orb 30s ease-in-out 7s infinite reverse',
        }} />
        <div style={{
          position: 'absolute', top: '35%', left: '42%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(6,182,212,0.09) 0%,transparent 65%)',
          animation: 'wai-orb 20s ease-in-out 3s infinite',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg,transparent,rgba(34,211,238,0.1),transparent)',
          animation: 'wai-scan 18s linear infinite',
        }} />
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', width: 1.5, height: 1.5, borderRadius: '50%',
            left: `${(i * 41 + 7) % 100}%`, top: `${(i * 67 + 11) % 100}%`,
            background: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#818cf8' : '#34d399',
            animation: `wai-drift ${30 + (i % 8) * 5}s ease-in-out ${i * 2.3}s infinite`,
            opacity: 0.22,
          }} />
        ))}
      </div>

      {/* ════ HERO ════ */}
      <section
        ref={heroRef} onMouseMove={onMove} onMouseLeave={onLeave}
        style={{ ...sec, position: 'relative', zIndex: 1, minHeight: '94vh',
          display: 'flex', alignItems: 'center', paddingTop: 'clamp(60px,10vh,130px)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 56, width: '100%' }}>

          {/* Text block */}
          <div style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto' }}>
            <Fade delay={0}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(103,232,249,0.22)',
                borderRadius: 999, padding: '7px 20px', marginBottom: 32,
                fontSize: 12, color: C.cyanDim, letterSpacing: '0.1em',
                backdropFilter: 'blur(10px)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: C.cyan,
                  display: 'inline-block', animation: 'wai-breath 5s ease-in-out infinite',
                }} />
                Die smarte Energieplattform für Heim &amp; Flotte
              </div>
            </Fade>
            <Fade delay={200}>
              <h1 style={{ fontSize: 'clamp(38px,6vw,80px)', fontWeight: 900,
                lineHeight: 1.06, letterSpacing: '-0.03em', margin: '0 0 28px' }}>
                <span style={{
                  background: 'linear-gradient(135deg,#f1f5f9 0%,#67e8f9 40%,#22d3ee 60%,#818cf8 100%)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text', animation: 'wai-shimmer 10s linear infinite',
                  display: 'block',
                }}>Deine Energie.</span>
                <span style={{
                  background: 'linear-gradient(135deg,#e2e8f0 0%,#22d3ee 50%,#06b6d4 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text', display: 'block', marginTop: 6,
                }}>Intelligent gesteuert.</span>
              </h1>
            </Fade>
            <Fade delay={400}>
              <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: C.muted,
                maxWidth: 640, margin: '0 auto 44px', lineHeight: 1.85 }}>
                WattAI.live verbindet PV-Anlage, Batteriespeicher, Wärmepumpe und Elektroauto
                zu einem intelligenten Ökosystem — in Echtzeit, DSGVO-konform und planbasiert.
              </p>
            </Fade>
            <Fade delay={600}>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => onNavigate('home')}
                  className="wai-cta-p"
                  style={{
                    background: 'linear-gradient(90deg,#0ea5e9,#06b6d4,#22d3ee)',
                    color: '#000', border: 'none', borderRadius: 999,
                    padding: '15px 36px', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                    boxShadow: '0 0 48px rgba(34,211,238,0.3)',
                    animation: 'wai-glow 6s ease-in-out infinite',
                    letterSpacing: '0.02em',
                  }}>
                  Dashboard starten
                </button>
                <button type="button" onClick={() => onNavigate('produkte')}
                  className="wai-cta-g"
                  style={{
                    background: 'transparent', color: C.cyanDim,
                    border: '1px solid rgba(103,232,249,0.25)', borderRadius: 999,
                    padding: '15px 36px', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    backdropFilter: 'blur(10px)', letterSpacing: '0.02em',
                  }}>
                  Preise &amp; Pläne ansehen
                </button>
              </div>
            </Fade>
          </div>

          {/* Plasma canvas */}
          <Fade delay={800} style={{ width: '100%' }}>
            <div style={{
              position: 'relative', width: '100%',
              height: 'clamp(280px,36vw,480px)',
              borderRadius: 28,
              border: '1px solid rgba(103,232,249,0.15)',
              background: 'rgba(2,6,23,0.75)',
              overflow: 'hidden',
              boxShadow: '0 0 100px rgba(34,211,238,0.08), inset 0 0 80px rgba(2,6,23,0.8)',
              transform: `perspective(1400px) rotateY(${pos.x * 3}deg) rotateX(${pos.y * -1.5}deg)`,
              transition: 'transform 0.3s ease',
            }}>
              <PlasmaCanvas />
              {/* Vignette */}
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at 50% 50%, transparent 28%, rgba(2,6,23,0.78) 100%)',
              }} />
              {/* Slow orbit rings */}
              {[160, 280, 420].map((size, i) => (
                <div key={i} aria-hidden="true" style={{
                  position: 'absolute', top: '50%', left: '50%',
                  width: size, height: size, marginTop: -size / 2, marginLeft: -size / 2,
                  borderRadius: '50%',
                  border: `1px solid rgba(34,211,238,${0.055 - i * 0.015})`,
                  animation: `wai-spin-slow ${42 + i * 22}s linear ${i % 2 === 0 ? '' : 'reverse'} infinite`,
                  pointerEvents: 'none',
                }} />
              ))}
              {/* Minimal label */}
              <div style={{
                position: 'absolute', bottom: 20, right: 22,
                fontSize: 9, color: 'rgba(103,232,249,0.3)',
                letterSpacing: '0.28em', textTransform: 'uppercase', fontFamily: 'monospace',
              }}>
                ENERGY TOPOLOGY
              </div>
            </div>
          </Fade>

          {/* Scroll breath */}
          <div style={{ textAlign: 'center', marginTop: -24 }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: 0.28 }}>
              <span style={{ fontSize: 9, letterSpacing: '0.5em', textTransform: 'uppercase', color: C.muted }}>Explore</span>
              <div style={{
                width: 1, height: 48,
                background: `linear-gradient(to bottom, ${C.cyan}, transparent)`,
                animation: 'wai-breath 5s ease-in-out infinite',
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════ STAT BAR ════ */}
      <Fade y={16}>
        <section style={{
          background: 'rgba(10,17,35,0.7)',
          borderTop: '1px solid rgba(103,232,249,0.07)',
          borderBottom: '1px solid rgba(103,232,249,0.07)',
          padding: '36px 0', position: 'relative', zIndex: 1,
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{ ...sec, padding: '0 clamp(16px,4vw,32px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
              {[
                { v: '< 2 min', l: 'Einrichtungszeit' },
                { v: '98 %',    l: 'Uptime SLA' },
                { v: '30 %',    l: 'Ø Einsparung' },
                { v: 'ISO 15118', l: 'V2G-Standard' },
                { v: 'DSGVO',  l: 'Datenschutz Art. 6' },
              ].map((s, i) => (
                <div key={i} className="wai-stat" style={{
                  textAlign: 'center', padding: '22px 12px', borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  background: 'rgba(15,23,42,0.5)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ fontSize: 'clamp(16px,2.2vw,26px)', fontWeight: 800,
                    color: C.cyan, lineHeight: 1, marginBottom: 6 }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: C.mutedDark, textTransform: 'uppercase',
                    letterSpacing: '0.1em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Fade>

      {/* ════ FEATURES ════ */}
      <section style={{ ...sec, position: 'relative', zIndex: 1 }}>
        <Fade delay={0}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 11, letterSpacing: '0.45em', textTransform: 'uppercase',
              color: C.cyan, marginBottom: 14, opacity: 0.65 }}>
              Alles in einem System
            </p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,52px)', fontWeight: 900,
              margin: '0 0 18px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              High-End Energie- und Lademanagement
            </h2>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 520,
              margin: '0 auto', lineHeight: 1.8 }}>
              Modulare KI-Architektur, 3D-Dashboards und Echtzeit-Steuerung
              für PV, Speicher, EV und Smart Home.
            </p>
          </div>
        </Fade>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 20 }}>
          {APPLICATIONS.map((app, i) => {
            const Visual = VISUAL_MAP[app.slug];
            const isH = hovered === app.slug;
            return (
              <Fade key={app.slug} delay={i * 110}>
                <Tilt>
                  <div
                    onMouseEnter={() => setHovered(app.slug)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'relative', borderRadius: 20, overflow: 'hidden',
                      border: `1px solid ${isH ? 'rgba(103,232,249,0.32)' : C.border}`,
                      background: app.cardBackground,
                      paddingBottom: 24,
                      transition: 'border-color 1s ease',
                      cursor: 'pointer',
                    }}
                  >
                    {/* SVG visual */}
                    <div style={{
                      padding: '24px 24px 0',
                      opacity: isH ? 1 : 0.72,
                      transition: 'opacity 1.2s ease',
                    }}>
                      {Visual ? <Visual /> : null}
                    </div>

                    {/* Separator */}
                    <div style={{
                      height: 1, margin: '0 0 20px',
                      background: 'linear-gradient(90deg,transparent,rgba(103,232,249,0.1),transparent)',
                    }} />

                    {/* Text */}
                    <div style={{ padding: '0 24px' }}>
                      <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800,
                        color: '#f1f5f9', lineHeight: 1.3 }}>{app.title}</h3>
                      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#bfdbfe',
                        lineHeight: 1.75 }}>{app.desc}</p>
                      <button
                        type="button"
                        onClick={() => onNavigate('produkte')}
                        style={{
                          background: isH ? 'rgba(34,211,238,0.09)' : 'transparent',
                          border: `1px solid ${isH ? 'rgba(34,211,238,0.38)' : 'rgba(34,211,238,0.14)'}`,
                          borderRadius: 999, color: '#67e8f9',
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                          padding: '8px 18px', cursor: 'pointer',
                          transition: 'all 1s cubic-bezier(0.16,1,0.3,1)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Technische Details
                      </button>
                    </div>

                    {/* Hover glow */}
                    <div aria-hidden="true" style={{
                      position: 'absolute', top: -60, right: -60, width: 200, height: 200,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle,rgba(34,211,238,0.09),transparent 70%)',
                      opacity: isH ? 1 : 0, transition: 'opacity 1.4s ease',
                      pointerEvents: 'none',
                    }} />
                  </div>
                </Tilt>
              </Fade>
            );
          })}
        </div>
      </section>

      {/* ════ CTA BANNER ════ */}
      <Fade>
        <section style={{ ...sec, position: 'relative', zIndex: 1 }}>
          <div style={{
            position: 'relative', borderRadius: 24, overflow: 'hidden',
            border: '1px solid rgba(34,211,238,0.15)',
            background: 'linear-gradient(135deg,rgba(6,182,212,0.07),rgba(139,92,246,0.05))',
            padding: 'clamp(48px,6vw,80px) clamp(24px,5vw,64px)',
            backdropFilter: 'blur(20px)',
          }}>
            <div aria-hidden="true" style={{
              position: 'absolute', top: 0, right: 0, width: 500, height: 500, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(34,211,238,0.07),transparent 65%)',
              pointerEvents: 'none',
            }} />
            <div aria-hidden="true" style={{
              position: 'absolute', bottom: 0, left: 0, width: 400, height: 400, borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(124,58,237,0.06),transparent 65%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <p style={{ fontSize: 11, letterSpacing: '0.45em', textTransform: 'uppercase',
                color: C.cyan, marginBottom: 18, opacity: 0.6 }}>
                Kostenlos starten
              </p>
              <h2 style={{ fontSize: 'clamp(22px,3.5vw,42px)', fontWeight: 900,
                margin: '0 0 18px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Kostenlos starten — jetzt upgraden wenn du bereit bist
              </h2>
              <p style={{ color: C.muted, fontSize: 15, maxWidth: 460,
                margin: '0 auto 40px', lineHeight: 1.8 }}>
                Kein Abo-Zwang, keine Kreditkarte nötig.
                Einfach registrieren und loslegen.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" onClick={onAuthClick} className="wai-cta-p"
                  style={{
                    background: 'linear-gradient(90deg,#0ea5e9,#06b6d4)',
                    color: '#000', border: 'none', borderRadius: 999,
                    padding: '15px 36px', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                    boxShadow: '0 0 48px rgba(34,211,238,0.3)', letterSpacing: '0.02em',
                  }}>
                  Kostenlos registrieren
                </button>
                <button type="button" onClick={onUpgradeClick} className="wai-cta-g"
                  style={{
                    background: 'transparent', color: '#a78bfa',
                    border: '1px solid rgba(167,139,250,0.28)', borderRadius: 999,
                    padding: '15px 36px', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    backdropFilter: 'blur(10px)', letterSpacing: '0.02em',
                  }}>
                  Pläne vergleichen
                </button>
              </div>
            </div>
          </div>
        </section>
      </Fade>
    </div>
  );
}
