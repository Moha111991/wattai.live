/**
 * WattAI.live — Cinematic Dark Landing Page v3
 * ─────────────────────────────────────────────
 * • CSS animated deep orange / blue atmosphere  (zero images)
 * • WebGL GLSL ShaderMaterial — neon light streaks (zero images)
 * • SVG lone silhouette hero character
 * • Fixed sticky nav — backdrop-filter blur
 * • IntersectionObserver stagger — every section headline
 * • 100 % inline styles + injected keyframes
 */

import {
  useEffect, useRef, useState, useCallback,
  type CSSProperties, type MouseEvent as RMouseEvent,
} from 'react';
import { APPLICATIONS } from '../data/applications';

// ── Types ────────────────────────────────────────────────────────────────────

type Page = 'home' | 'startseite' | 'produkte' | 'about' | 'kontakt';

type StartPageProps = {
  onNavigate: (page: Page) => void;
  onAuthClick: () => void;
  onUpgradeClick: () => void;
};

// ── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  orange:     '#ff6b35',
  orangeDim:  '#e65c00',
  orangeGlow: 'rgba(255,107,53,0.35)',
  blue:       '#1e40af',
  blueBright: '#3b82f6',
  neon:       '#ff9500',
  white:      '#f8fafc',
  ghost:      'rgba(248,250,252,0.72)',
  muted:      'rgba(248,250,252,0.42)',
  border:     'rgba(255,107,53,0.18)',
  borderB:    'rgba(59,130,246,0.18)',
  surface:    'rgba(4,6,20,0.72)',
};

// ── GLSL Fragment Shader source ───────────────────────────────────────────────

const FRAG_SHADER = `
precision mediump float;
uniform float u_time;
uniform vec2  u_res;

#define PI 3.14159265

float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}

// Signed distance to a line segment
float sdLine(vec2 p, vec2 a, vec2 b){
  vec2 pa=p-a, ba=b-a;
  float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
  return length(pa-ba*h);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  uv.x *= u_res.x / u_res.y;   // aspect correct
  float t = u_time * 0.18;

  // ── Deep background gradient (orange → blue) ──────────────────
  vec3 col = mix(
    vec3(0.12, 0.02, 0.0),   // deep burnt orange bottom
    vec3(0.01, 0.04, 0.16),  // deep navy top
    uv.y
  );

  // ── Slow atmospheric nebula ───────────────────────────────────
  float nb = noise(uv * 2.5 + vec2(t * 0.4, t * 0.3));
  float nb2 = noise(uv * 4.0 - vec2(t * 0.3, t * 0.5));
  col += vec3(0.18, 0.05, 0.0) * nb * 0.45;
  col += vec3(0.0, 0.04, 0.22) * nb2 * 0.4;

  // ── Neon streak generator ─────────────────────────────────────
  // Each streak: animated angle, position, width, colour phase
  for(int k = 0; k < 14; k++){
    float fk = float(k);
    float phase   = fk * 0.71 + 1.3;
    float speed   = 0.06 + fk * 0.007;
    float angle   = phase + t * speed * (k < 7 ? 1.0 : -0.8);
    float offset  = sin(phase * 2.1 + t * 0.11) * 0.55 + 0.5;

    // streak direction
    vec2 dir = vec2(cos(angle), sin(angle));
    // project uv onto perpendicular
    float d = abs(dot(uv - vec2(0.5 + cos(phase)*0.3, offset), vec2(-dir.y, dir.x)));

    // streak width pulses
    float w = 0.0006 + 0.0004 * sin(t * 2.0 + fk);

    // streak colour — alternates orange / blue / white
    vec3 streakCol;
    if(k < 5)       streakCol = vec3(1.0, 0.42, 0.1);   // orange
    else if(k < 10) streakCol = vec3(0.2, 0.55, 1.0);   // electric blue
    else            streakCol = vec3(1.0, 0.9, 0.7);    // warm white

    float intensity = w / max(d, 0.00005);
    intensity = min(intensity, 1.8);
    // fade at ends along direction
    float along = dot(uv - vec2(0.5), dir) * 0.5 + 0.5;
    float endFade = smoothstep(0.0, 0.12, along) * smoothstep(1.0, 0.88, along);
    // slow pulse
    float pulse = 0.55 + 0.45 * sin(t * 3.0 + fk * 1.7);

    col += streakCol * intensity * endFade * pulse * 0.55;
  }

  // ── Vignette ─────────────────────────────────────────────────
  float vig = 1.0 - smoothstep(0.35, 1.2, length(uv - vec2(u_res.x/u_res.y*0.5, 0.5)));
  col *= vig * 0.72 + 0.28;

  // ── Grain ────────────────────────────────────────────────────
  float grain = (hash(uv + fract(t)) - 0.5) * 0.04;
  col += grain;

  col = clamp(col, 0.0, 1.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT_SHADER = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

// ── WebGL Shader Canvas ───────────────────────────────────────────────────────

function ShaderCanvas({ style = {} }: { style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = cv.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;

    let raf: number;
    const start = performance.now();

    // Compile shader
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const vert = compile(gl.VERTEX_SHADER, VERT_SHADER);
    const frag = compile(gl.FRAGMENT_SHADER, FRAG_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert); gl.attachShader(prog, frag);
    gl.linkProgram(prog); gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes  = gl.getUniformLocation(prog, 'u_res');

    const resize = () => {
      cv.width  = cv.offsetWidth;
      cv.height = cv.offsetHeight;
      gl.viewport(0, 0, cv.width, cv.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const sec = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, sec);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(prog);
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }} />
  );
}

// ── Lone Silhouette SVG ───────────────────────────────────────────────────────

function Silhouette() {
  return (
    <svg viewBox="0 0 120 280" fill="none" xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="Standing figure"
      style={{ height: 'clamp(180px,28vh,300px)', width: 'auto', filter: 'drop-shadow(0 0 32px rgba(255,107,53,0.45))' }}>
      {/* Head */}
      <ellipse cx="60" cy="28" rx="16" ry="18" fill="#0a0416" />
      {/* Neck */}
      <rect x="54" y="44" width="12" height="10" fill="#0a0416" />
      {/* Torso */}
      <path d="M34 54 Q30 120 32 148 L88 148 Q90 120 86 54 Z" fill="#0a0416" />
      {/* Left arm */}
      <path d="M34 60 Q16 96 14 136 Q18 138 24 136 Q28 104 44 72 Z" fill="#0a0416" />
      {/* Right arm — slightly raised */}
      <path d="M86 60 Q102 88 108 128 Q104 132 98 130 Q90 96 76 70 Z" fill="#0a0416" />
      {/* Left leg */}
      <path d="M44 148 Q38 204 36 258 Q44 262 52 258 Q52 204 56 148 Z" fill="#0a0416" />
      {/* Right leg */}
      <path d="M76 148 Q82 204 84 258 Q76 262 68 258 Q68 204 64 148 Z" fill="#0a0416" />

      {/* Glow halo ring */}
      <ellipse cx="60" cy="264" rx="28" ry="6" fill="rgba(255,107,53,0.2)" />

      {/* Neon rim light left */}
      <path d="M34 54 Q30 120 32 148 L36 148 Q34 122 38 58 Z"
        fill="rgba(255,107,53,0.55)">
        <animate attributeName="opacity" values="0.55;0.9;0.55" dur="4s" repeatCount="indefinite" />
      </path>
      {/* Neon rim light right */}
      <path d="M86 54 Q90 120 88 148 L84 148 Q88 122 82 58 Z"
        fill="rgba(59,130,246,0.55)">
        <animate attributeName="opacity" values="0.55;0.85;0.55" dur="5s" begin="1.5s" repeatCount="indefinite" />
      </path>

      {/* Head rim */}
      <ellipse cx="60" cy="28" rx="16" ry="18" fill="none"
        stroke="rgba(255,107,53,0.4)" strokeWidth="1.2">
        <animate attributeName="stroke-opacity" values="0.4;0.8;0.4" dur="3.5s" repeatCount="indefinite" />
      </ellipse>
    </svg>
  );
}

// ── Stagger IntersectionObserver hook ────────────────────────────────────────

function useStaggerReveal(count: number, threshold = 0.1) {
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
  return { ref, visible, count };
}

// ── Single reveal ─────────────────────────────────────────────────────────────

function useReveal(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, on };
}

function Fade({ children, delay = 0, y = 36, style = {} }: {
  children: React.ReactNode; delay?: number; y?: number; style?: CSSProperties;
}) {
  const { ref, on } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: on ? 1 : 0,
      transform: on ? 'translateY(0) scale(1)' : `translateY(${y}px) scale(0.97)`,
      transition: `opacity 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                   transform 1.2s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── 3D Tilt ───────────────────────────────────────────────────────────────────

function Tilt({ children, style = {} }: { children: React.ReactNode; style?: CSSProperties }) {
  const r = useRef<HTMLDivElement>(null);
  const onMove = (e: RMouseEvent<HTMLDivElement>) => {
    const el = r.current; if (!el) return;
    const b = el.getBoundingClientRect();
    const rx = ((e.clientX - b.left) / b.width - 0.5) * 12;
    const ry = ((e.clientY - b.top) / b.height - 0.5) * -12;
    el.style.transform = `perspective(900px) rotateY(${rx}deg) rotateX(${ry}deg) translateY(-6px)`;
    el.style.boxShadow = '0 32px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,53,0.2)';
  };
  const onLeave = () => {
    if (!r.current) return;
    r.current.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateY(0)';
    r.current.style.boxShadow = '';
  };
  return (
    <div ref={r} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1), box-shadow 0.9s ease',
        transformStyle: 'preserve-3d', willChange: 'transform', ...style }}>
      {children}
    </div>
  );
}

// ── SVG Visuals per Application ───────────────────────────────────────────────

function PvVisual() {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      <polyline points="0,80 20,70 40,50 60,30 80,22 100,26 120,44 140,62 160,75"
        stroke="rgba(255,149,0,0.6)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <polyline points="0,80 20,70 40,50 60,30 80,22 100,26 120,44 140,62 160,75"
        stroke="rgba(255,149,0,0.1)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="22" r="6" fill="rgba(255,149,0,0.95)">
        <animate attributeName="r" values="6;8;6" dur="7s" repeatCount="indefinite" />
      </circle>
      {[15, 24, 36].map((rad, i) => (
        <circle key={i} cx="80" cy="22" r={rad} stroke="rgba(255,149,0,0.15)" strokeWidth="0.7" fill="none">
          <animate attributeName="r" values={`${rad};${rad + 4};${rad}`} dur={`${10 + i * 5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.15;0.03;0.15" dur={`${10 + i * 5}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = angle * Math.PI / 180;
        return (
          <line key={i}
            x1={80 + Math.cos(rad) * 9} y1={22 + Math.sin(rad) * 9}
            x2={80 + Math.cos(rad) * 18} y2={22 + Math.sin(rad) * 18}
            stroke="rgba(255,149,0,0.45)" strokeWidth="0.8" strokeLinecap="round">
            <animate attributeName="opacity" values="0.45;0.1;0.45"
              dur={`${5 + (i % 3)}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </line>
        );
      })}
      {[35, 55, 72].map(y => (
        <line key={y} x1="0" y1={y} x2="160" y2={y}
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
        <linearGradient id="bat-fill-v3" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="rgba(255,107,53,0.8)" />
          <stop offset="0.5" stopColor="rgba(255,149,0,0.5)" />
          <stop offset="1" stopColor="rgba(59,130,246,0.3)" />
        </linearGradient>
        <clipPath id="bat-clip-v3"><rect x="48" y="18" width="44" height="58" rx="3" /></clipPath>
      </defs>
      <rect x="48" y="18" width="44" height="58" rx="4"
        fill="rgba(10,6,22,0.85)" stroke="rgba(255,107,53,0.4)" strokeWidth="1" />
      <rect x="61" y="12" width="18" height="8" rx="2"
        fill="rgba(255,107,53,0.25)" stroke="rgba(255,107,53,0.5)" strokeWidth="0.8" />
      <path d="M92 22 L108 14 L108 70 L92 76 Z"
        fill="rgba(255,107,53,0.08)" stroke="rgba(255,107,53,0.12)" strokeWidth="0.5" />
      <path d="M48 18 L64 10 L108 10 L92 18 Z"
        fill="rgba(255,107,53,0.05)" stroke="rgba(255,107,53,0.15)" strokeWidth="0.5" />
      {[32, 44, 56].map(y => (
        <line key={y} x1="49" y1={y} x2="91" y2={y} stroke="rgba(255,107,53,0.1)" strokeWidth="0.5" />
      ))}
      <rect x="49" y="18" width="42" height="57" rx="3" fill="url(#bat-fill-v3)" clipPath="url(#bat-clip-v3)">
        <animate attributeName="y" values="53;33;53" dur="14s" repeatCount="indefinite" />
        <animate attributeName="height" values="22;42;22" dur="14s" repeatCount="indefinite" />
      </rect>
      <text x="70" y="50" textAnchor="middle" fill="rgba(255,149,0,0.8)"
        fontSize="10" fontFamily="monospace" fontWeight="bold">
        78%
        <animate attributeName="opacity" values="0.8;1;0.8" dur="5s" repeatCount="indefinite" />
      </text>
      <path d="M66 25 L62 37 L67 37 L64 50 L74 33 L69 33 Z"
        fill="rgba(255,107,53,0.55)" stroke="rgba(255,149,0,0.9)" strokeWidth="0.4">
        <animate attributeName="opacity" values="0.55;1;0.55" dur="3.5s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function EvVisual() {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      <path d="M10 48 L10 72 L36 72 L36 48 L23 34 Z"
        fill="rgba(30,64,175,0.15)" stroke="rgba(59,130,246,0.5)" strokeWidth="1" strokeLinejoin="round" />
      <rect x="15" y="56" width="9" height="16" rx="1" fill="rgba(30,64,175,0.25)" />
      <circle cx="23" cy="45" r="3" fill="rgba(255,107,53,0.4)">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="4s" repeatCount="indefinite" />
      </circle>
      <rect x="110" y="52" width="44" height="17" rx="4"
        fill="rgba(30,64,175,0.18)" stroke="rgba(59,130,246,0.55)" strokeWidth="1" />
      <path d="M118 52 L123 43 L148 43 L153 52"
        fill="rgba(30,64,175,0.14)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.8" />
      <circle cx="122" cy="70" r="5" fill="rgba(6,9,30,0.9)" stroke="rgba(59,130,246,0.5)" strokeWidth="1" />
      <circle cx="148" cy="70" r="5" fill="rgba(6,9,30,0.9)" stroke="rgba(59,130,246,0.5)" strokeWidth="1" />
      <rect x="110" y="57" width="4" height="7" rx="1" fill="rgba(255,107,53,0.7)">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <path id="ev-fwd-v3" d="M38 58 Q80 36 110 58" fill="none" />
      <path id="ev-rev-v3" d="M110 62 Q80 84 38 62" fill="none" />
      <path d="M38 58 Q80 36 110 58" stroke="rgba(255,107,53,0.18)" strokeWidth="1.2"
        strokeDasharray="5 7" fill="none" />
      <path d="M110 62 Q80 84 38 62" stroke="rgba(59,130,246,0.18)" strokeWidth="1.2"
        strokeDasharray="5 7" fill="none" />
      <circle r="3" fill="rgba(255,107,53,0.9)">
        <animateMotion dur="5s" repeatCount="indefinite" begin="0s">
          <mpath xlinkHref="#ev-fwd-v3" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle r="2.5" fill="rgba(59,130,246,0.9)">
        <animateMotion dur="7s" repeatCount="indefinite" begin="2.5s">
          <mpath xlinkHref="#ev-rev-v3" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="7s" begin="2.5s" repeatCount="indefinite" />
      </circle>
      <text x="23" y="84" textAnchor="middle" fill="rgba(59,130,246,0.45)" fontSize="6" fontFamily="monospace">HOME</text>
      <text x="133" y="84" textAnchor="middle" fill="rgba(59,130,246,0.45)" fontSize="6" fontFamily="monospace">EV</text>
      <text x="80" y="32" textAnchor="middle" fill="rgba(255,107,53,0.5)" fontSize="6" fontFamily="monospace">V2H · V2G</text>
    </svg>
  );
}

function SmartHomeVisual() {
  const nodes = [
    { x: 28, y: 40, d: '0s', l: 'HP' }, { x: 58, y: 28, d: '1.8s', l: 'TV' },
    { x: 38, y: 64, d: '3.2s', l: 'WM' }, { x: 100, y: 26, d: '1s', l: 'AC' },
    { x: 132, y: 62, d: '2.4s', l: 'BAT' }, { x: 116, y: 46, d: '4s', l: 'PV' },
  ];
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      <rect x="8" y="12" width="144" height="66" rx="2"
        stroke="rgba(255,107,53,0.18)" strokeWidth="0.8" fill="none" />
      <line x1="80" y1="12" x2="80" y2="78" stroke="rgba(255,107,53,0.1)" strokeWidth="0.5" />
      <line x1="8" y1="50" x2="80" y2="50" stroke="rgba(255,107,53,0.1)" strokeWidth="0.5" />
      <line x1="80" y1="46" x2="152" y2="46" stroke="rgba(255,107,53,0.1)" strokeWidth="0.5" />
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="7" fill="transparent" stroke="rgba(255,107,53,0.22)" strokeWidth="0.6">
            <animate attributeName="r" values="7;12;7" dur="9s" begin={n.d} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="9s" begin={n.d} repeatCount="indefinite" />
          </circle>
          <circle cx={n.x} cy={n.y} r="3" fill="rgba(255,149,0,0.85)">
            <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" begin={n.d} repeatCount="indefinite" />
          </circle>
          <text x={n.x} y={n.y + 13} textAnchor="middle" fill="rgba(255,107,53,0.38)" fontSize="5" fontFamily="monospace">{n.l}</text>
        </g>
      ))}
    </svg>
  );
}

function KiVisual() {
  const inputY = [18, 46, 74], hiddenY = [14, 36, 58, 80], outputY = [32, 62];
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      {inputY.map(iy => hiddenY.map(hy => (
        <line key={`${iy}-${hy}`} x1="34" y1={iy} x2="88" y2={hy}
          stroke="rgba(255,107,53,0.1)" strokeWidth="0.5">
          <animate attributeName="opacity" values="0.1;0.3;0.1"
            dur={`${6 + (iy + hy) % 5}s`} repeatCount="indefinite" />
        </line>
      )))}
      {hiddenY.map(hy => outputY.map(oy => (
        <line key={`${hy}-${oy}`} x1="88" y1={hy} x2="136" y2={oy}
          stroke="rgba(59,130,246,0.12)" strokeWidth="0.5">
          <animate attributeName="opacity" values="0.12;0.4;0.12"
            dur={`${7 + (hy + oy) % 4}s`} repeatCount="indefinite" />
        </line>
      )))}
      {[
        { id: 'kp0v3', y1i: 46, y1h: 36, d: '0s', t: '5s' },
        { id: 'kp1v3', y1i: 18, y1h: 58, d: '2s', t: '6s' },
        { id: 'kp2v3', y1h: 14, y2o: 32, d: '1s', t: '5s', out: true },
        { id: 'kp3v3', y1h: 80, y2o: 62, d: '3s', t: '4.5s', out: true },
      ].map((p, i) => (
        <g key={i}>
          {!p.out
            ? <path id={p.id} d={`M34,${p.y1i} L88,${p.y1h}`} fill="none" />
            : <path id={p.id} d={`M88,${p.y1h} L136,${p.y2o}`} fill="none" />}
          <circle r="2" fill={p.out ? 'rgba(59,130,246,0.9)' : 'rgba(255,107,53,0.9)'}>
            <animateMotion dur={p.t} repeatCount="indefinite" begin={p.d}>
              <mpath xlinkHref={`#${p.id}`} />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={p.t} begin={p.d} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {inputY.map((y, i) => (
        <g key={i}>
          <circle cx="34" cy={y} r="5" fill="rgba(255,107,53,0.18)" stroke="rgba(255,107,53,0.45)" strokeWidth="0.8" />
          <text x="12" y={y + 3} textAnchor="middle" fill="rgba(255,107,53,0.4)" fontSize="5" fontFamily="monospace">
            {['PV', 'BAT', 'GRID'][i]}
          </text>
        </g>
      ))}
      {hiddenY.map((y, i) => (
        <circle key={i} cx="88" cy={y} r="5" fill="rgba(255,107,53,0.06)" stroke="rgba(255,107,53,0.25)" strokeWidth="0.8">
          <animate attributeName="fill" values="rgba(255,107,53,0.06);rgba(255,107,53,0.25);rgba(255,107,53,0.06)"
            dur={`${4 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
      {outputY.map((y, i) => (
        <g key={i}>
          <circle cx="136" cy={y} r="6" fill="rgba(59,130,246,0.18)" stroke="rgba(59,130,246,0.6)" strokeWidth="1" />
          <text x="152" y={y + 3} textAnchor="start" fill="rgba(59,130,246,0.45)" fontSize="5" fontFamily="monospace">
            {['LOAD', 'SELL'][i]}
          </text>
        </g>
      ))}
      <text x="34" y="88" textAnchor="middle" fill="rgba(255,107,53,0.22)" fontSize="5.5" fontFamily="monospace">INPUT</text>
      <text x="88" y="88" textAnchor="middle" fill="rgba(255,107,53,0.22)" fontSize="5.5" fontFamily="monospace">DQN</text>
      <text x="136" y="88" textAnchor="middle" fill="rgba(59,130,246,0.22)" fontSize="5.5" fontFamily="monospace">ACTION</text>
    </svg>
  );
}

function FleetVisual() {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 90, display: 'block' }}>
      <defs>
        <linearGradient id="wave-v3" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor="transparent" />
          <stop offset="0.5" stopColor="rgba(255,107,53,0.55)" />
          <stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4, 5].map(i => {
        const col = i % 3, row = Math.floor(i / 3);
        const x = 14 + col * 48, y = 14 + row * 40, dl = col * 1.4 + row * 0.7;
        const sw = 8 + (i * 11) % 22;
        return (
          <g key={i}>
            <rect x={x} y={y} width="36" height="22" rx="3"
              fill="rgba(255,107,53,0.05)" stroke="rgba(255,107,53,0.2)" strokeWidth="0.6">
              <animate attributeName="stroke" values="rgba(255,107,53,0.2);rgba(255,107,53,0.55);rgba(255,107,53,0.2)"
                dur="9s" begin={`${dl}s`} repeatCount="indefinite" />
            </rect>
            <rect x={x + 4} y={y + 7} width="28" height="10" rx="2" fill="rgba(255,107,53,0.18)">
              <animate attributeName="fill"
                values="rgba(255,107,53,0.18);rgba(255,107,53,0.45);rgba(255,107,53,0.18)"
                dur="9s" begin={`${dl}s`} repeatCount="indefinite" />
            </rect>
            <path d={`M${x + 8} ${y + 7} L${x + 11} ${y + 3} L${x + 25} ${y + 3} L${x + 28} ${y + 7}`}
              fill="rgba(255,107,53,0.12)" />
            <circle cx={x + 11} cy={y + 18} r="2.5" fill="rgba(6,9,30,0.9)" stroke="rgba(255,107,53,0.4)" strokeWidth="0.5" />
            <circle cx={x + 25} cy={y + 18} r="2.5" fill="rgba(6,9,30,0.9)" stroke="rgba(255,107,53,0.4)" strokeWidth="0.5" />
            <rect x={x + 4} y={y + 1} width="28" height="3" rx="1" fill="rgba(255,255,255,0.05)" />
            <rect x={x + 4} y={y + 1} width={sw} height="3" rx="1" fill="rgba(255,107,53,0.55)">
              <animate attributeName="width" values={`${sw};${sw + 10};${sw}`}
                dur={`${11 + i * 2}s`} repeatCount="indefinite" />
            </rect>
          </g>
        );
      })}
      <rect x="0" y="0" width="10" height="90" fill="url(#wave-v3)" opacity="0.4">
        <animate attributeName="x" values="-10;170;-10" dur="7s" repeatCount="indefinite" />
      </rect>
      <text x="80" y="88" textAnchor="middle" fill="rgba(255,107,53,0.28)" fontSize="6" fontFamily="monospace">
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

// ── Staggered Section Headline ────────────────────────────────────────────────

function SectionHeadline({
  label, title, subtitle, accentColor = T.orange,
}: {
  label: string; title: string; subtitle?: string; accentColor?: string;
}) {
  const { ref, visible, count: _c } = useStaggerReveal(3);
  return (
    <div ref={ref} style={{ textAlign: 'center', marginBottom: 56 }}>
      {/* label staggered 0 ms */}
      <p style={{
        fontSize: 11, letterSpacing: '0.5em', textTransform: 'uppercase',
        color: accentColor, marginBottom: 14,
        opacity: visible ? 0.8 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 1s ease 0ms, transform 1s ease 0ms',
      }}>{label}</p>
      {/* title staggered 150 ms */}
      <h2 style={{
        fontSize: 'clamp(24px,4vw,50px)', fontWeight: 900,
        margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.02em',
        color: T.white,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 1s ease 150ms, transform 1s ease 150ms',
      }}>{title}</h2>
      {/* subtitle staggered 300 ms */}
      {subtitle && (
        <p style={{
          fontSize: 16, color: T.muted, maxWidth: 520, margin: '0 auto',
          lineHeight: 1.8,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 1s ease 300ms, transform 1s ease 300ms',
        }}>{subtitle}</p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StartPage({ onNavigate, onAuthClick, onUpgradeClick }: StartPageProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  const onMove = useCallback((e: RMouseEvent<HTMLDivElement>) => {
    const r = heroRef.current?.getBoundingClientRect();
    if (!r) return;
    setParallax({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    });
  }, []);
  const onLeave = useCallback(() => setParallax({ x: 0, y: 0 }), []);

  const sec: CSSProperties = {
    width: '100%', maxWidth: 1100, margin: '0 auto',
    padding: 'clamp(48px,7vw,100px) clamp(16px,4vw,32px)',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ color: T.white, width: '100%', overflowX: 'hidden', position: 'relative', background: '#04060e' }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes wai-breathe {
          0%,100%{opacity:.5;transform:scale(1);}
          50%{opacity:1;transform:scale(1.1);}
        }
        @keyframes wai-shimmer {
          0%{background-position:-300% center;}
          100%{background-position:300% center;}
        }
        @keyframes wai-drift {
          0%,100%{transform:translateY(0)translateX(0);}
          40%{transform:translateY(-22px)translateX(12px);}
          70%{transform:translateY(10px)translateX(-8px);}
        }
        @keyframes wai-scan {
          0%{top:-2px;}
          100%{top:100vh;}
        }
        @keyframes wai-glow-o {
          0%,100%{box-shadow:0 0 30px rgba(255,107,53,0.25);}
          50%{box-shadow:0 0 70px rgba(255,107,53,0.55);}
        }
        @keyframes wai-glow-b {
          0%,100%{box-shadow:0 0 30px rgba(59,130,246,0.2);}
          50%{box-shadow:0 0 70px rgba(59,130,246,0.45);}
        }
        @keyframes wai-silhouette-rise {
          from{opacity:0;transform:translateY(40px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes wai-spin-slow {
          from{transform:rotate(0deg);}
          to{transform:rotate(360deg);}
        }
        .wai-nav-link:hover{color:${T.orange}!important;}
        .wai-cta-o{transition:all .6s cubic-bezier(0.16,1,0.3,1);}
        .wai-cta-o:hover{filter:brightness(1.2);transform:translateY(-3px) scale(1.02);}
        .wai-cta-g{transition:all .6s cubic-bezier(0.16,1,0.3,1);}
        .wai-cta-g:hover{background:rgba(255,107,53,0.08)!important;border-color:rgba(255,107,53,0.45)!important;transform:translateY(-2px);}
        .wai-stat{transition:all .8s cubic-bezier(0.16,1,0.3,1);}
        .wai-stat:hover{border-color:rgba(255,107,53,0.38)!important;background:rgba(255,107,53,0.05)!important;transform:translateY(-4px);}
        .wai-card{transition:border-color 1s ease;}
        .wai-card:hover{border-color:rgba(255,107,53,0.35)!important;}
      `}</style>

      {/* ── Ambient particles (fixed) ── */}
      <div aria-hidden="true" style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        {/* Slow scan */}
        <div style={{
          position:'absolute', left:0, right:0, height:1,
          background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.12),transparent)',
          animation:'wai-scan 22s linear infinite',
        }} />
        {/* Sparse dust */}
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} style={{
            position:'absolute',
            width: 1.5, height: 1.5, borderRadius:'50%',
            left:`${(i * 43 + 9) % 100}%`,
            top:`${(i * 71 + 13) % 100}%`,
            background: i % 2 === 0 ? T.orange : T.blueBright,
            animation:`wai-drift ${32+(i%7)*4}s ease-in-out ${i*2.2}s infinite`,
            opacity: 0.18,
          }} />
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          HERO  (WebGL ShaderMaterial + Silhouette)
      ══════════════════════════════════════════════ */}
      <section
        ref={heroRef} onMouseMove={onMove} onMouseLeave={onLeave}
        style={{ position:'relative', zIndex:1, minHeight:'100vh',
          display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', overflow:'hidden',
        }}
      >
        {/* WebGL full-screen shader background */}
        <ShaderCanvas style={{ zIndex: 0 }} />

        {/* Extra CSS-only atmosphere layer on top of shader */}
        <div aria-hidden="true" style={{
          position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
          background:`
            radial-gradient(ellipse 80% 60% at 20% 80%, rgba(255,107,53,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 20%, rgba(30,64,175,0.2) 0%, transparent 55%)
          `,
        }} />

        {/* Content above shader */}
        <div style={{ position:'relative', zIndex:2, width:'100%', maxWidth:1100,
          padding:'0 clamp(16px,4vw,32px)', boxSizing:'border-box',
          display:'flex', flexDirection:'column', alignItems:'center', gap:0 }}>

          {/* Silhouette */}
          <div style={{ animation:'wai-silhouette-rise 2.2s cubic-bezier(0.16,1,0.3,1) 0.3s both',
            marginBottom:24 }}>
            <Silhouette />
          </div>

          {/* Overline badge */}
          <div style={{
            animation:'wai-silhouette-rise 1.4s ease 1.2s both',
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.28)',
            borderRadius:999, padding:'6px 18px', marginBottom:24,
            fontSize:11, color:'rgba(255,149,0,0.9)', letterSpacing:'0.15em',
            backdropFilter:'blur(12px)',
          }}>
            <span style={{
              width:6, height:6, borderRadius:'50%', background:T.orange, display:'inline-block',
              animation:'wai-breathe 4s ease-in-out infinite',
            }} />
            Die smarte Energieplattform für Heim &amp; Flotte
          </div>

          {/* H1 */}
          <h1 style={{
            animation:'wai-silhouette-rise 1.4s ease 1.5s both',
            fontSize:'clamp(40px,6.5vw,84px)', fontWeight:900,
            lineHeight:1.04, letterSpacing:'-0.035em', margin:'0 0 24px',
            textAlign:'center', maxWidth:780,
          }}>
            <span style={{
              background:'linear-gradient(135deg,#fff5f0 0%,#ff9500 35%,#ff6b35 60%,#3b82f6 100%)',
              backgroundSize:'300% auto',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text', animation:'wai-shimmer 9s linear infinite',
              display:'block',
            }}>Deine Energie.</span>
            <span style={{
              background:'linear-gradient(135deg,#f8fafc 0%,#ff9500 45%,#1e40af 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text', display:'block', marginTop:4,
            }}>Intelligent gesteuert.</span>
          </h1>

          {/* Subline */}
          <p style={{
            animation:'wai-silhouette-rise 1.4s ease 1.8s both',
            fontSize:'clamp(15px,1.8vw,19px)', color:T.ghost,
            maxWidth:620, margin:'0 auto 44px', lineHeight:1.85, textAlign:'center',
          }}>
            WattAI.live verbindet PV-Anlage, Batteriespeicher, Wärmepumpe und Elektroauto
            zu einem intelligenten Ökosystem — in Echtzeit, DSGVO-konform und planbasiert.
          </p>

          {/* CTAs */}
          <div style={{
            animation:'wai-silhouette-rise 1.4s ease 2.1s both',
            display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center',
          }}>
            <button type="button" onClick={() => onNavigate('home')} className="wai-cta-o"
              style={{
                background:'linear-gradient(90deg,#ff6b35,#ff9500,#e65c00)',
                color:'#0a0305', border:'none', borderRadius:999,
                padding:'15px 38px', fontWeight:800, fontSize:16, cursor:'pointer',
                animation:'wai-glow-o 5s ease-in-out infinite',
                letterSpacing:'0.02em',
              }}>
              Dashboard starten
            </button>
            <button type="button" onClick={() => onNavigate('produkte')} className="wai-cta-g"
              style={{
                background:'transparent', color:'rgba(255,149,0,0.9)',
                border:'1px solid rgba(255,107,53,0.32)', borderRadius:999,
                padding:'15px 38px', fontWeight:700, fontSize:16, cursor:'pointer',
                backdropFilter:'blur(12px)', letterSpacing:'0.02em',
              }}>
              Preise &amp; Pläne ansehen
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop:56, display:'flex', flexDirection:'column', alignItems:'center', gap:8, opacity:0.32 }}>
            <span style={{ fontSize:9, letterSpacing:'0.5em', textTransform:'uppercase', color:T.muted }}>Explore</span>
            <div style={{
              width:1, height:52,
              background:`linear-gradient(to bottom, ${T.orange}, transparent)`,
              animation:'wai-breathe 5s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* 3D parallax rings behind hero text */}
        <div aria-hidden="true" style={{
          position:'absolute', zIndex:1,
          top:'50%', left:'50%',
          width:500, height:500, marginTop:-250, marginLeft:-250,
          borderRadius:'50%',
          border:'1px solid rgba(255,107,53,0.06)',
          animation:'wai-spin-slow 60s linear infinite',
          transform:`perspective(1000px) rotateY(${parallax.x*4}deg) rotateX(${parallax.y*-2}deg)`,
          pointerEvents:'none',
        }} />
        <div aria-hidden="true" style={{
          position:'absolute', zIndex:1,
          top:'50%', left:'50%',
          width:720, height:720, marginTop:-360, marginLeft:-360,
          borderRadius:'50%',
          border:'1px solid rgba(30,64,175,0.05)',
          animation:'wai-spin-slow 90s linear reverse infinite',
          pointerEvents:'none',
        }} />
      </section>

      {/* ══════════════════════════════════════════════
          STAT BAR
      ══════════════════════════════════════════════ */}
      <Fade y={16}>
        <section style={{
          background:'rgba(4,6,20,0.75)',
          borderTop:'1px solid rgba(255,107,53,0.1)',
          borderBottom:'1px solid rgba(59,130,246,0.1)',
          padding:'36px 0', position:'relative', zIndex:1,
          backdropFilter:'blur(20px)',
        }}>
          <div style={{ ...sec, padding:'0 clamp(16px,4vw,32px)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
              {[
                { v:'< 2 min', l:'Einrichtungszeit' },
                { v:'98 %',    l:'Uptime SLA' },
                { v:'30 %',    l:'Ø Einsparung' },
                { v:'ISO 15118', l:'V2G-Standard' },
                { v:'DSGVO',  l:'Datenschutz Art. 6' },
              ].map((s, i) => (
                <div key={i} className="wai-stat" style={{
                  textAlign:'center', padding:'22px 12px', borderRadius:14,
                  border:'1px solid rgba(255,107,53,0.14)',
                  background:'rgba(255,107,53,0.03)',
                  backdropFilter:'blur(8px)',
                }}>
                  <div style={{ fontSize:'clamp(16px,2.2vw,26px)', fontWeight:800,
                    color:T.orange, lineHeight:1, marginBottom:6,
                    textShadow:'0 0 20px rgba(255,107,53,0.5)',
                  }}>{s.v}</div>
                  <div style={{ fontSize:10, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Fade>

      {/* ══════════════════════════════════════════════
          FEATURES  (stagger IntersectionObserver)
      ══════════════════════════════════════════════ */}
      <section style={{ ...sec, position:'relative', zIndex:1 }}>
        <SectionHeadline
          label="Alles in einem System"
          title="High-End Energie- und Lademanagement"
          subtitle="Modulare KI-Architektur, 3D-Dashboards und Echtzeit-Steuerung für PV, Speicher, EV und Smart Home."
          accentColor={T.orange}
        />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))', gap:20 }}>
          {APPLICATIONS.map((app, i) => {
            const Visual = VISUAL_MAP[app.slug];
            const isH = hovered === app.slug;
            return (
              <Fade key={app.slug} delay={i * 110}>
                <Tilt>
                  <div
                    className="wai-card"
                    onMouseEnter={() => setHovered(app.slug)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position:'relative', borderRadius:20, overflow:'hidden',
                      border:`1px solid ${isH ? 'rgba(255,107,53,0.35)' : 'rgba(255,107,53,0.1)'}`,
                      background:'rgba(4,6,20,0.65)',
                      paddingBottom:24,
                      backdropFilter:'blur(12px)',
                      cursor:'pointer',
                    }}
                  >
                    {/* Gradient accent top bar */}
                    <div style={{
                      height:2, background:isH
                        ? 'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)'
                        : 'linear-gradient(90deg,rgba(255,107,53,0.3),rgba(59,130,246,0.2))',
                      transition:'background 1s ease',
                    }} />

                    {/* SVG visual */}
                    <div style={{ padding:'22px 22px 0',
                      opacity: isH ? 1 : 0.65, transition:'opacity 1.2s ease' }}>
                      {Visual ? <Visual /> : null}
                    </div>

                    {/* Divider */}
                    <div style={{
                      height:1, margin:'0 0 20px',
                      background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.12),transparent)',
                    }} />

                    <div style={{ padding:'0 22px' }}>
                      <h3 style={{ margin:'0 0 10px', fontSize:16, fontWeight:800,
                        color:T.white, lineHeight:1.3 }}>{app.title}</h3>
                      <p style={{ margin:'0 0 20px', fontSize:13,
                        color:'rgba(248,250,252,0.6)', lineHeight:1.75 }}>{app.desc}</p>
                      <button type="button" onClick={() => onNavigate('produkte')}
                        style={{
                          background: isH ? 'rgba(255,107,53,0.1)' : 'transparent',
                          border:`1px solid ${isH ? 'rgba(255,107,53,0.4)' : 'rgba(255,107,53,0.18)'}`,
                          borderRadius:999, color:'rgba(255,149,0,0.85)',
                          fontSize:11, fontWeight:700, letterSpacing:'0.08em',
                          padding:'8px 18px', cursor:'pointer',
                          transition:'all 1s cubic-bezier(0.16,1,0.3,1)',
                          textTransform:'uppercase',
                        }}>
                        Technische Details
                      </button>
                    </div>

                    {/* Hover corner glow */}
                    <div aria-hidden="true" style={{
                      position:'absolute', top:-50, right:-50, width:160, height:160,
                      borderRadius:'50%',
                      background:'radial-gradient(circle,rgba(255,107,53,0.12),transparent 70%)',
                      opacity: isH ? 1 : 0, transition:'opacity 1.4s ease',
                      pointerEvents:'none',
                    }} />
                    <div aria-hidden="true" style={{
                      position:'absolute', bottom:-50, left:-50, width:140, height:140,
                      borderRadius:'50%',
                      background:'radial-gradient(circle,rgba(30,64,175,0.1),transparent 70%)',
                      opacity: isH ? 1 : 0, transition:'opacity 1.4s ease 0.2s',
                      pointerEvents:'none',
                    }} />
                  </div>
                </Tilt>
              </Fade>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════ */}
      <Fade>
        <section style={{ ...sec, position:'relative', zIndex:1 }}>
          <div style={{
            position:'relative', borderRadius:24, overflow:'hidden',
            border:'1px solid rgba(255,107,53,0.2)',
            background:'rgba(4,6,20,0.7)',
            padding:'clamp(48px,6vw,80px) clamp(24px,5vw,64px)',
            backdropFilter:'blur(24px)',
          }}>
            {/* Orange atmosphere top-right */}
            <div aria-hidden="true" style={{
              position:'absolute', top:-80, right:-80, width:400, height:400,
              borderRadius:'50%',
              background:'radial-gradient(circle,rgba(255,107,53,0.14),transparent 65%)',
              pointerEvents:'none',
            }} />
            {/* Blue atmosphere bottom-left */}
            <div aria-hidden="true" style={{
              position:'absolute', bottom:-80, left:-80, width:380, height:380,
              borderRadius:'50%',
              background:'radial-gradient(circle,rgba(30,64,175,0.12),transparent 65%)',
              pointerEvents:'none',
            }} />
            {/* Top accent bar */}
            <div style={{
              position:'absolute', top:0, left:0, right:0, height:2,
              background:'linear-gradient(90deg,transparent,#ff6b35,#ff9500,#3b82f6,transparent)',
            }} />

            <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
              <SectionHeadline
                label="Kostenlos starten"
                title="Kostenlos starten — jetzt upgraden wenn du bereit bist"
                subtitle="Kein Abo-Zwang, keine Kreditkarte nötig. Einfach registrieren und loslegen."
                accentColor={T.orange}
              />
              <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
                <button type="button" onClick={onAuthClick} className="wai-cta-o"
                  style={{
                    background:'linear-gradient(90deg,#ff6b35,#ff9500)',
                    color:'#0a0305', border:'none', borderRadius:999,
                    padding:'15px 36px', fontWeight:800, fontSize:16, cursor:'pointer',
                    boxShadow:'0 0 48px rgba(255,107,53,0.35)',
                    letterSpacing:'0.02em',
                  }}>
                  Kostenlos registrieren
                </button>
                <button type="button" onClick={onUpgradeClick} className="wai-cta-g"
                  style={{
                    background:'transparent', color:'rgba(255,149,0,0.9)',
                    border:'1px solid rgba(255,107,53,0.3)', borderRadius:999,
                    padding:'15px 36px', fontWeight:700, fontSize:16, cursor:'pointer',
                    backdropFilter:'blur(12px)', letterSpacing:'0.02em',
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
