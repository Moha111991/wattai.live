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

// ── Technical Details Data ──────────────────────────────────────────────────────

const TECH_DATA: Record<string, { specs: { label: string; value: string }[]; protocols: string[]; plan: string }> = {
  'pv-optimierung': {
    specs: [
      { label: 'Algorithmus', value: 'MPPT + ML-Ertragsprognose' },
      { label: 'Prognose-Horizont', value: '72 h (OpenMeteo-Wetterdaten)' },
      { label: 'Eigenverbrauchsquote', value: 'Ø +28 % gegenüber unkontrolliert' },
      { label: 'Einspeisung', value: '§ 9 EEG-konform, dyn. Abregelung' },
      { label: 'Auflösung', value: '1-Minuten-Intervall, Echtzeit-API' },
      { label: 'Wechselrichter', value: 'SMA, Fronius, Huawei, Enphase, Kostal' },
    ],
    protocols: ['Modbus TCP', 'SunSpec', 'REST API', 'MQTT'],
    plan: 'Free',
  },
  'batteriemanagement': {
    specs: [
      { label: 'SOC-Grenzen', value: '15 – 95 % (konfig.), SOH-Schutz aktiv' },
      { label: 'Tarifintegration', value: 'Tibber, aWATTar, EPEX Spot' },
      { label: 'Lastprognose', value: '15-Min-Intervall, LSTM-Modell' },
      { label: 'Zyklen-Optimierung', value: 'Kalend. + Lebensdauer-Prädiktor' },
      { label: 'Reaktionszeit', value: '< 500 ms Steuerbefehl' },
      { label: 'Kompatibilität', value: 'LG RESU, BYD Box, Sonnen, Sungrow' },
    ],
    protocols: ['CAN Bus', 'Modbus RTU', 'REST API', 'MQTT'],
    plan: 'Free',
  },
  'ev-v2h-v2g': {
    specs: [
      { label: 'Ladestandard', value: 'ISO 15118 Plug & Charge, OCPP 2.0.1' },
      { label: 'V2H-Leistung', value: 'bis 11 kW bidirektional' },
      { label: 'V2G-Support', value: 'Netzdienst, Regelenergie (ab Pro)' },
      { label: 'Multi-EV', value: 'bis 5 Fahrzeugprofile (ab Pro)' },
      { label: 'Wallboxen', value: 'Wallbe, ABB Terra, KEBA, Easee' },
      { label: 'Tarif-Laden', value: 'Spot-Preis-Laden, PV-Überschuss' },
    ],
    protocols: ['OCPP 1.6/2.0.1', 'ISO 15118', 'MQTT', 'Modbus TCP'],
    plan: 'Pro (Multi-EV)',
  },
  'smart-home': {
    specs: [
      { label: 'Zeitfenster', value: 'Dynamisch, tarifbasiert + PV-Prognose' },
      { label: 'Wärmepumpe', value: 'SG-Ready Schnittstelle, COP-Optimierung' },
      { label: 'Standard', value: 'HEMS nach EN 50631-1' },
      { label: 'Schnittstellen', value: 'KNX, Home Assistant, openHAB, Loxone' },
      { label: 'Lastspitzen', value: 'Peak-Shaving, kW-Begrenzung konfig.' },
      { label: 'Geräte', value: 'Waschmaschine, Trockner, Spülmaschine, HP' },
    ],
    protocols: ['KNX', 'Z-Wave', 'Zigbee', 'REST/MQTT'],
    plan: 'Pro',
  },
  'ki-empfehlung': {
    specs: [
      { label: 'Modell', value: 'Deep-Q-Network (DQN), 128-Node Hidden' },
      { label: 'Trainingsdaten', value: '3 Jahre historische Energiedaten' },
      { label: 'Inference', value: '< 50 ms Latenz, Edge-AI fähig' },
      { label: 'Runtime', value: 'TensorFlow Lite / ONNX Runtime' },
      { label: 'Konfidenz', value: 'Score pro Empfehlung, Begründung sichtbar' },
      { label: 'Update', value: 'Wöchentliches Re-Training, Auto-Deploy' },
    ],
    protocols: ['ONNX', 'TFLite', 'REST API', 'WebSocket'],
    plan: 'Pro',
  },
  'flottenmanagement': {
    specs: [
      { label: 'Standorte', value: 'bis 50 Standorte gleichzeitig (Business)' },
      { label: 'Dispatch', value: 'KI-Optimierung, Lastspitzen-Capping' },
      { label: 'Alerting', value: 'SLA-Monitoring, E-Mail + Push-Benachricht.' },
      { label: 'Reporting', value: 'CO₂-Bilanz, Kostenreport, CSV-Export' },
      { label: 'API', value: 'REST + MQTT, Webhook, OpenAPI 3.1' },
      { label: 'Compliance', value: 'ISO 27001-konformes Logging, DSGVO' },
    ],
    protocols: ['REST API', 'MQTT', 'Webhook', 'OpenAPI 3.1'],
    plan: 'Business',
  },
};

// ── Tech Details Modal ────────────────────────────────────────────────────────

function TechModal({ slug, title, onClose }: { slug: string; title: string; onClose: () => void }) {
  const data = TECH_DATA[slug];
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);
  if (!data) return null;

  const planColor = data.plan === 'Free' ? '#22c55e' : data.plan.includes('Business') ? '#a855f7' : '#ff9500';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(2,4,14,0.88)', backdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(12px,3vw,32px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 620,
          background: 'linear-gradient(160deg,rgba(10,6,30,0.97),rgba(4,6,20,0.99))',
          border: '1px solid rgba(255,107,53,0.3)',
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 0 80px rgba(255,107,53,0.15), 0 40px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Top accent bar */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)',
        }} />

        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${planColor}18`, border: `1px solid ${planColor}44`,
              borderRadius: 999, padding: '4px 12px', marginBottom: 10,
              fontSize: 10, color: planColor, letterSpacing: '0.12em', fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              Verfügbar ab Plan: {data.plan}
            </div>
            <h2 style={{ margin: 0, fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 900, color: '#f8fafc', lineHeight: 1.2 }}>
              {title}
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(248,250,252,0.4)', letterSpacing: '0.06em' }}>
              Technische Spezifikation
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)',
              borderRadius: 999, color: 'rgba(255,107,53,0.8)',
              width: 36, height: 36, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Schließen"
          >✕</button>
        </div>

        {/* Specs grid */}
        <div style={{ padding: '20px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {data.specs.map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,107,53,0.04)',
                border: '1px solid rgba(255,107,53,0.1)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 10, color: 'rgba(255,149,0,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 600, lineHeight: 1.4 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocols */}
        <div style={{ padding: '0 28px 24px' }}>
          <div style={{ fontSize: 10, color: 'rgba(59,130,246,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
            Protokolle &amp; Schnittstellen
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.protocols.map((p, i) => (
              <span key={i} style={{
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.22)',
                borderRadius: 999, padding: '5px 14px',
                fontSize: 11, color: 'rgba(147,197,253,0.9)', fontWeight: 600,
                fontFamily: 'monospace',
              }}>{p}</span>
            ))}
          </div>
        </div>

        {/* Bottom glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: -60, right: -60, width: 200, height: 200,
          borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,53,0.1),transparent 65%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

// ── SVG Visuals per Application (high-end animated 3D scenes) ─────────────────

function PvVisual() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 180, display: 'block' }}>
      <defs>
        <radialGradient id="pv-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffde6b" stopOpacity="1" />
          <stop offset="40%" stopColor="#ff9500" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pv-panel-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
        <linearGradient id="pv-energy-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff9500" stopOpacity="0" />
          <stop offset="50%" stopColor="#ff9500" stopOpacity="1" />
          <stop offset="100%" stopColor="#ff9500" stopOpacity="0" />
        </linearGradient>
        <filter id="pv-glow-f">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Sky gradient bg */}
      <rect width="200" height="180" fill="url(#pv-sky)" />
      <defs>
        <linearGradient id="pv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0f2e" />
          <stop offset="100%" stopColor="#0d1a10" />
        </linearGradient>
      </defs>

      {/* Sun */}
      <circle cx="162" cy="28" r="22" fill="url(#pv-sun-glow)" opacity="0.9">
        <animate attributeName="r" values="22;26;22" dur="8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;1;0.9" dur="5s" repeatCount="indefinite" />
      </circle>
      <circle cx="162" cy="28" r="11" fill="#ffde6b">
        <animate attributeName="r" values="11;13;11" dur="6s" repeatCount="indefinite" />
      </circle>
      {/* Sun rays */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => {
        const rad = a * Math.PI / 180;
        return (
          <line key={i}
            x1={162 + Math.cos(rad)*15} y1={28 + Math.sin(rad)*15}
            x2={162 + Math.cos(rad)*24} y2={28 + Math.sin(rad)*24}
            stroke="#ffde6b" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur={`${3+i%3}s`} begin={`${i*0.2}s`} repeatCount="indefinite" />
          </line>
        );
      })}

      {/* Ground line */}
      <line x1="0" y1="148" x2="200" y2="148" stroke="rgba(255,107,53,0.15)" strokeWidth="1" />

      {/* Isometric solar panel array — 6 panels in 3x2 */}
      {[0,1,2,3,4,5].map(i => {
        const col = i % 3, row = Math.floor(i / 3);
        const px = 12 + col * 58, py = 78 + row * 34 - col * 8;
        return (
          <g key={i}>
            {/* Panel face */}
            <polygon points={`${px},${py} ${px+52},${py-8} ${px+52},${py+22} ${px},${py+30}`}
              fill="url(#pv-panel-face)" stroke="rgba(30,120,180,0.6)" strokeWidth="0.8" />
            {/* Panel cells grid */}
            {[1,2,3].map(c => (
              <line key={c} x1={px+c*13} y1={py-2-c*2} x2={px+c*13} y2={py+28-c*2}
                stroke="rgba(100,180,255,0.25)" strokeWidth="0.5" />
            ))}
            {[1,2].map(r => (
              <line key={r} x1={px} y1={py+r*10} x2={px+52} y2={py+r*10-8}
                stroke="rgba(100,180,255,0.25)" strokeWidth="0.5" />
            ))}
            {/* Highlight shimmer */}
            <polygon points={`${px},${py} ${px+52},${py-8} ${px+52},${py-2} ${px},${py+6}`}
              fill="rgba(255,255,255,0.06)">
              <animate attributeName="opacity" values="0.06;0.15;0.06" dur={`${7+i}s`} repeatCount="indefinite" />
            </polygon>
            {/* Panel top edge */}
            <polygon points={`${px},${py} ${px+52},${py-8} ${px+56},${py-5} ${px+4},${py+3}`}
              fill="rgba(80,140,200,0.2)" stroke="rgba(100,160,220,0.4)" strokeWidth="0.5" />
            {/* Active glow */}
            <polygon points={`${px},${py} ${px+52},${py-8} ${px+52},${py+22} ${px},${py+30}`}
              fill="rgba(255,149,0,0.04)">
              <animate attributeName="fill"
                values="rgba(255,149,0,0.04);rgba(255,149,0,0.12);rgba(255,149,0,0.04)"
                dur={`${9+i*1.5}s`} begin={`${i*1.1}s`} repeatCount="indefinite" />
            </polygon>
          </g>
        );
      })}

      {/* Energy flow arcs from panels to right */}
      {['m-pv0','m-pv1','m-pv2'].map((id, i) => (
        <g key={id}>
          <path id={id} d={`M ${96+i*8} ${100-i*8} Q 150 ${60+i*10} 185 45`} fill="none" />
          <circle r="3.5" fill="#ff9500" filter="url(#pv-glow-f)" opacity="0.9">
            <animateMotion dur={`${3.5+i}s`} repeatCount="indefinite" begin={`${i*1.2}s`}>
              <mpath xlinkHref={`#${id}`} />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={`${3.5+i}s`} begin={`${i*1.2}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* Power meter bar at bottom */}
      <rect x="16" y="158" width="120" height="8" rx="4" fill="rgba(255,107,53,0.1)" stroke="rgba(255,107,53,0.2)" strokeWidth="0.5" />
      <rect x="16" y="158" width="88" height="8" rx="4" fill="rgba(255,149,0,0.7)">
        <animate attributeName="width" values="88;110;88" dur="12s" repeatCount="indefinite" />
      </rect>
      <text x="144" y="166" fontSize="8" fill="rgba(255,149,0,0.9)" fontFamily="monospace" fontWeight="bold">7.4 kW</text>
      <text x="16" y="176" fontSize="7" fill="rgba(255,107,53,0.5)" fontFamily="monospace">PV-Leistung aktuell</text>

      {/* Yield line chart overlay */}
      <polyline points="16,145 36,130 56,115 76,110 96,118 116,108 136,120 156,114"
        stroke="rgba(255,149,0,0.55)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <polyline points="16,145 36,130 56,115 76,110 96,118 116,108 136,120 156,114"
        stroke="rgba(255,149,0,0.08)" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BatteryVisual() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 180, display: 'block' }}>
      <defs>
        <linearGradient id="bat-body-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1030" />
          <stop offset="100%" stopColor="#0a0618" />
        </linearGradient>
        <linearGradient id="bat-fill-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff4500" />
          <stop offset="50%" stopColor="#ff9500" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <clipPath id="bat-fill-clip"><rect x="68" y="34" width="64" height="112" rx="3" /></clipPath>
        <filter id="bat-glow-f">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="bat-soft-glow">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient glow behind battery */}
      <ellipse cx="100" cy="100" rx="55" ry="65" fill="rgba(255,107,53,0.07)">
        <animate attributeName="rx" values="55;65;55" dur="8s" repeatCount="indefinite" />
        <animate attributeName="ry" values="65;75;65" dur="8s" repeatCount="indefinite" />
      </ellipse>

      {/* Battery body — isometric 3D look */}
      {/* Right face */}
      <polygon points="132,34 148,42 148,154 132,146"
        fill="rgba(30,20,60,0.9)" stroke="rgba(255,107,53,0.25)" strokeWidth="0.8" />
      {/* Top face */}
      <polygon points="68,34 132,34 148,42 84,42"
        fill="rgba(50,35,90,0.8)" stroke="rgba(255,107,53,0.3)" strokeWidth="0.8" />
      {/* Front face */}
      <rect x="68" y="34" width="64" height="112" rx="4"
        fill="url(#bat-body-grad)" stroke="rgba(255,107,53,0.35)" strokeWidth="1.2" />

      {/* Horizontal cell dividers */}
      {[58, 82, 106].map(y => (
        <line key={y} x1="69" y1={y} x2="131" y2={y} stroke="rgba(255,107,53,0.1)" strokeWidth="0.6" />
      ))}

      {/* Fill level (animated 30%→82%) */}
      <rect x="69" y="34" width="62" height="112" rx="3" fill="url(#bat-fill-grad)" clipPath="url(#bat-fill-clip)">
        <animate attributeName="y" values="105;56;105" dur="16s" repeatCount="indefinite" />
        <animate attributeName="height" values="41;90;41" dur="16s" repeatCount="indefinite" />
      </rect>

      {/* Fill shimmer */}
      <rect x="69" y="34" width="30" height="112" rx="3" fill="rgba(255,255,255,0.04)" clipPath="url(#bat-fill-clip)">
        <animate attributeName="opacity" values="0.04;0.10;0.04" dur="6s" repeatCount="indefinite" />
      </rect>

      {/* Terminal cap */}
      <rect x="83" y="24" width="34" height="12" rx="3"
        fill="rgba(40,30,70,0.9)" stroke="rgba(255,107,53,0.45)" strokeWidth="1" />

      {/* SOC percent label */}
      <text x="100" y="95" textAnchor="middle" fill="#ff9500"
        fontSize="22" fontFamily="monospace" fontWeight="900" filter="url(#bat-glow-f)">
        78%
        <animate attributeName="textContent" values="42%;55%;68%;78%;82%;78%" dur="16s" repeatCount="indefinite" />
      </text>
      <text x="100" y="108" textAnchor="middle" fill="rgba(255,149,0,0.5)"
        fontSize="7" fontFamily="monospace" letterSpacing="0.08em">STATE OF CHARGE</text>

      {/* Lightning bolt */}
      <path d="M96 56 L90 74 L98 74 L94 92 L110 68 L102 68 L108 56 Z"
        fill="rgba(255,220,50,0.9)" stroke="rgba(255,149,0,0.9)" strokeWidth="0.5" filter="url(#bat-glow-f)">
        <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.5s" repeatCount="indefinite" />
      </path>

      {/* Energy particles flowing in */}
      {[0,1,2].map(i => (
        <g key={i}>
          <path id={`bat-in-${i}`} d={`M ${40+i*20} 10 Q ${60+i*10} 30 ${90+i*6} 34`} fill="none" />
          <circle r="2.5" fill="#ff9500" filter="url(#bat-glow-f)">
            <animateMotion dur={`${2.5+i*0.8}s`} repeatCount="indefinite" begin={`${i*0.9}s`}>
              <mpath xlinkHref={`#bat-in-${i}`} />
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={`${2.5+i*0.8}s`} begin={`${i*0.9}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* Discharge path out */}
      <path id="bat-out-0" d="M 132 100 Q 165 100 180 80" fill="none" />
      <circle r="2.5" fill="#22c55e" filter="url(#bat-glow-f)">
        <animateMotion dur="3.5s" repeatCount="indefinite" begin="1.2s">
          <mpath xlinkHref="#bat-out-0" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="3.5s" begin="1.2s" repeatCount="indefinite" />
      </circle>

      {/* Bottom status labels */}
      <text x="16" y="170" fill="rgba(255,149,0,0.6)" fontSize="7.5" fontFamily="monospace">⚡ Wird geladen · +3.2 kW</text>
      <text x="16" y="180" fill="rgba(100,200,100,0.5)" fontSize="7" fontFamily="monospace">Tarifoptimiert · Tibber-Spot aktiv</text>
    </svg>
  );
}

function EvVisual() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 180, display: 'block' }}>
      <defs>
        <linearGradient id="ev-body-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2060" />
          <stop offset="100%" stopColor="#0a1230" />
        </linearGradient>
        <linearGradient id="ev-charge-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <filter id="ev-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background grid lines */}
      {[40,80,120,160].map(x => (
        <line key={x} x1={x} y1="20" x2={x} y2="155" stroke="rgba(59,130,246,0.06)" strokeWidth="0.5" />
      ))}
      {[50,90,130].map(y => (
        <line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(59,130,246,0.06)" strokeWidth="0.5" />
      ))}

      {/* EV car body (side view) */}
      <path d="M 24 110 L 24 82 Q 30 62 55 56 L 108 52 Q 134 52 148 66 L 162 82 L 162 110 Z"
        fill="url(#ev-body-grad)" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5" />
      {/* Car roof */}
      <path d="M 55 56 Q 60 40 78 36 L 120 36 Q 138 38 148 52 L 108 52 Z"
        fill="rgba(20,40,100,0.9)" stroke="rgba(59,130,246,0.5)" strokeWidth="1" />
      {/* Windshield */}
      <path d="M 80 37 Q 82 40 86 52 L 108 52 Q 120 48 122 38 Z"
        fill="rgba(100,180,255,0.12)" stroke="rgba(100,200,255,0.3)" strokeWidth="0.6" />
      {/* Side window */}
      <path d="M 58 57 Q 62 48 76 44 L 80 53 Z"
        fill="rgba(100,180,255,0.1)" stroke="rgba(100,200,255,0.25)" strokeWidth="0.5" />
      {/* Door line */}
      <line x1="108" y1="52" x2="110" y2="108" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8" />
      {/* Wheels */}
      <circle cx="62" cy="112" r="16" fill="rgba(8,12,30,0.95)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" />
      <circle cx="62" cy="112" r="8" fill="rgba(20,40,80,0.9)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.8" />
      <circle cx="62" cy="112" r="3" fill="rgba(59,130,246,0.7)" />
      <circle cx="140" cy="112" r="16" fill="rgba(8,12,30,0.95)" stroke="rgba(59,130,246,0.5)" strokeWidth="1.5" />
      <circle cx="140" cy="112" r="8" fill="rgba(20,40,80,0.9)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.8" />
      <circle cx="140" cy="112" r="3" fill="rgba(59,130,246,0.7)" />

      {/* Neon underbody glow */}
      <ellipse cx="93" cy="128" rx="68" ry="5" fill="rgba(59,130,246,0.18)">
        <animate attributeName="opacity" values="0.18;0.35;0.18" dur="5s" repeatCount="indefinite" />
      </ellipse>

      {/* Charging port (right side) */}
      <rect x="162" y="86" width="8" height="14" rx="2"
        fill="rgba(255,107,53,0.3)" stroke="rgba(255,107,53,0.7)" strokeWidth="1">
        <animate attributeName="fill" values="rgba(255,107,53,0.3);rgba(255,107,53,0.7);rgba(255,107,53,0.3)" dur="2s" repeatCount="indefinite" />
      </rect>

      {/* Charging cable */}
      <path id="ev-cable" d="M 170 93 Q 185 93 190 75" fill="none" stroke="rgba(255,107,53,0.35)" strokeWidth="2.5" strokeLinecap="round" />

      {/* V2H arrow — from car to house left */}
      <path id="ev-v2h" d="M 24 90 Q 10 90 6 70" fill="none" />
      <path d="M 24 90 Q 10 90 6 70" stroke="rgba(34,197,94,0.2)" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      <circle r="3" fill="rgba(34,197,94,0.9)" filter="url(#ev-glow)">
        <animateMotion dur="4s" repeatCount="indefinite" begin="0.5s">
          <mpath xlinkHref="#ev-v2h" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="4s" begin="0.5s" repeatCount="indefinite" />
      </circle>

      {/* Charge flow — grid to car */}
      <path id="ev-charge-f" d="M 190 75 Q 185 93 170 93" fill="none" />
      <circle r="3" fill="rgba(255,149,0,0.9)" filter="url(#ev-glow)">
        <animateMotion dur="2.5s" repeatCount="indefinite">
          <mpath xlinkHref="#ev-charge-f" />
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Labels */}
      <text x="4" y="60" fill="rgba(34,197,94,0.7)" fontSize="7" fontFamily="monospace" fontWeight="bold">HOME</text>
      <text x="176" y="60" fill="rgba(255,149,0,0.7)" fontSize="7" fontFamily="monospace" fontWeight="bold">GRID</text>
      <text x="100" y="47" textAnchor="middle" fill="rgba(59,130,246,0.6)" fontSize="7.5" fontFamily="monospace">ISO 15118 · OCPP 2.0.1</text>

      {/* Charge state bar */}
      <rect x="24" y="142" width="138" height="7" rx="3.5" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" />
      <rect x="24" y="142" width="95" height="7" rx="3.5" fill="url(#ev-charge-bar)">
        <animate attributeName="width" values="95;115;95" dur="10s" repeatCount="indefinite" />
      </rect>
      <text x="100" y="160" textAnchor="middle" fill="rgba(255,149,0,0.65)" fontSize="7" fontFamily="monospace">SOC 68 % · Lädt mit 11 kW</text>
      <text x="100" y="172" textAnchor="middle" fill="rgba(34,197,94,0.5)" fontSize="6.5" fontFamily="monospace">V2H aktiv · 2.4 kW ins Haus</text>
    </svg>
  );
}

function SmartHomeVisual() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 180, display: 'block' }}>
      <defs>
        <radialGradient id="sh-hub-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,149,0,0.6)" />
          <stop offset="100%" stopColor="rgba(255,149,0,0)" />
        </radialGradient>
        <filter id="sh-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* House outline */}
      <path d="M 72 110 L 72 72 L 100 50 L 128 72 L 128 110 Z"
        fill="rgba(15,20,50,0.85)" stroke="rgba(255,107,53,0.45)" strokeWidth="1.5" />
      {/* Roof */}
      <path d="M 65 74 L 100 48 L 135 74"
        fill="none" stroke="rgba(255,107,53,0.55)" strokeWidth="2" strokeLinejoin="round" />
      {/* Door */}
      <rect x="90" y="90" width="20" height="20" rx="2"
        fill="rgba(255,107,53,0.1)" stroke="rgba(255,107,53,0.3)" strokeWidth="0.8" />
      {/* Windows */}
      <rect x="76" y="75" width="14" height="12" rx="2"
        fill="rgba(255,149,0,0.15)" stroke="rgba(255,149,0,0.4)" strokeWidth="0.8">
        <animate attributeName="fill" values="rgba(255,149,0,0.15);rgba(255,149,0,0.35);rgba(255,149,0,0.15)" dur="6s" repeatCount="indefinite" />
      </rect>
      <rect x="110" y="75" width="14" height="12" rx="2"
        fill="rgba(255,149,0,0.15)" stroke="rgba(255,149,0,0.4)" strokeWidth="0.8">
        <animate attributeName="fill" values="rgba(255,149,0,0.15);rgba(255,149,0,0.35);rgba(255,149,0,0.15)" dur="8s" begin="2s" repeatCount="indefinite" />
      </rect>
      {/* House glow */}
      <path d="M 72 110 L 72 72 L 100 50 L 128 72 L 128 110 Z"
        fill="rgba(255,107,53,0.04)">
        <animate attributeName="fill" values="rgba(255,107,53,0.04);rgba(255,107,53,0.1);rgba(255,107,53,0.04)" dur="5s" repeatCount="indefinite" />
      </path>

      {/* Central hub */}
      <circle cx="100" cy="82" r="10" fill="url(#sh-hub-glow)" />
      <circle cx="100" cy="82" r="5" fill="rgba(255,149,0,0.9)" filter="url(#sh-glow)">
        <animate attributeName="r" values="5;7;5" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Device nodes */}
      {[
        { x: 22, y: 40, label: 'HP', color: '#ff6b35', d: '0s' },
        { x: 178, y: 40, label: 'WP', color: '#ff9500', d: '1.2s' },
        { x: 18, y: 130, label: 'WM', color: '#3b82f6', d: '2.4s' },
        { x: 182, y: 130, label: 'AC', color: '#22d3ee', d: '3.5s' },
        { x: 100, y: 160, label: 'PV', color: '#22c55e', d: '0.8s' },
        { x: 100, y: 22, label: 'BAT', color: '#a855f7', d: '1.8s' },
      ].map((n, i) => {
        const pathId = `sh-path-${i}`;
        return (
          <g key={i}>
            {/* Connection line */}
            <line x1={n.x} y1={n.y} x2="100" y2="82"
              stroke={`${n.color}30`} strokeWidth="1.5" strokeDasharray="4 5" />
            {/* Animated pulse on line */}
            <path id={pathId} d={`M${n.x},${n.y} L100,82`} fill="none" />
            <circle r="2.5" fill={n.color} filter="url(#sh-glow)">
              <animateMotion dur={`${3+i*0.7}s`} repeatCount="indefinite" begin={n.d}>
                <mpath xlinkHref={`#${pathId}`} />
              </animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" dur={`${3+i*0.7}s`} begin={n.d} repeatCount="indefinite" />
            </circle>
            {/* Node circle */}
            <circle cx={n.x} cy={n.y} r="13"
              fill={`${n.color}12`} stroke={`${n.color}55`} strokeWidth="1.2">
              <animate attributeName="r" values="13;17;13" dur={`${9+i*2}s`} begin={n.d} repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.4;1" dur={`${9+i*2}s`} begin={n.d} repeatCount="indefinite" />
            </circle>
            <circle cx={n.x} cy={n.y} r="6" fill={`${n.color}80`} stroke={n.color} strokeWidth="1">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="4s" begin={n.d} repeatCount="indefinite" />
            </circle>
            <text x={n.x} y={n.y + 3.5} textAnchor="middle"
              fill="rgba(255,255,255,0.9)" fontSize="5.5" fontFamily="monospace" fontWeight="bold">{n.label}</text>
          </g>
        );
      })}

      {/* Status footer */}
      <text x="100" y="180" textAnchor="middle" fill="rgba(255,107,53,0.45)" fontSize="7" fontFamily="monospace">
        6 Geräte optimiert · Einsparung: −2.1 kWh/d
      </text>
    </svg>
  );
}

function KiVisual() {
  const inputs = [{ y: 30, l: 'PV' }, { y: 70, l: 'BAT' }, { y: 110, l: 'GRID' }, { y: 150, l: 'WTR' }];
  const hidden1 = [20, 50, 80, 110, 140, 165];
  const hidden2 = [35, 75, 115, 150];
  const outputs = [{ y: 55, l: 'LOAD', c: '#22c55e' }, { y: 100, l: 'SELL', c: '#3b82f6' }, { y: 145, l: 'STORE', c: '#a855f7' }];
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 180, display: 'block' }}>
      <defs>
        <filter id="ki-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ki-soft">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Input → Hidden1 connections */}
      {inputs.map(inp => hidden1.map(hy => (
        <line key={`${inp.y}-${hy}`} x1="30" y1={inp.y} x2="80" y2={hy}
          stroke="rgba(255,107,53,0.12)" strokeWidth="0.5">
          <animate attributeName="opacity" values="0.12;0.35;0.12"
            dur={`${5+(inp.y+hy)%6}s`} repeatCount="indefinite" />
        </line>
      )))}
      {/* Hidden1 → Hidden2 */}
      {hidden1.map(h1 => hidden2.map(h2 => (
        <line key={`${h1}-${h2}`} x1="80" y1={h1} x2="130" y2={h2}
          stroke="rgba(255,149,0,0.1)" strokeWidth="0.5">
          <animate attributeName="opacity" values="0.1;0.3;0.1"
            dur={`${6+(h1+h2)%5}s`} repeatCount="indefinite" />
        </line>
      )))}
      {/* Hidden2 → Output */}
      {hidden2.map(h2 => outputs.map(o => (
        <line key={`${h2}-${o.y}`} x1="130" y1={h2} x2="172" y2={o.y}
          stroke={`${o.c}22`} strokeWidth="0.7">
          <animate attributeName="opacity" values="0.13;0.4;0.13"
            dur={`${7+(h2+o.y)%4}s`} repeatCount="indefinite" />
        </line>
      )))}

      {/* Animated signals */}
      {[
        { from: [30, 30], to: [80, 50], t: '4s', d: '0s', c: '#ff6b35' },
        { from: [30, 70], to: [80, 110], t: '5s', d: '1.5s', c: '#ff9500' },
        { from: [30, 110], to: [80, 20], t: '4.5s', d: '0.8s', c: '#ff6b35' },
        { from: [80, 50], to: [130, 75], t: '4s', d: '0.5s', c: '#ff9500' },
        { from: [80, 140], to: [130, 115], t: '5s', d: '2s', c: '#ff6b35' },
        { from: [130, 35], to: [172, 55], t: '3.5s', d: '1s', c: '#22c55e' },
        { from: [130, 115], to: [172, 100], t: '4s', d: '2.5s', c: '#3b82f6' },
        { from: [130, 150], to: [172, 145], t: '5s', d: '0.2s', c: '#a855f7' },
      ].map((p, i) => {
        const pid = `ki-p-${i}`;
        return (
          <g key={i}>
            <path id={pid} d={`M${p.from[0]},${p.from[1]} L${p.to[0]},${p.to[1]}`} fill="none" />
            <circle r="2.8" fill={p.c} filter="url(#ki-soft)">
              <animateMotion dur={p.t} repeatCount="indefinite" begin={p.d}>
                <mpath xlinkHref={`#${pid}`} />
              </animateMotion>
              <animate attributeName="opacity" values="0;1;1;0" dur={p.t} begin={p.d} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}

      {/* Input nodes */}
      {inputs.map((n, i) => (
        <g key={i}>
          <circle cx="30" cy={n.y} r="9" fill="rgba(255,107,53,0.12)" stroke="rgba(255,107,53,0.5)" strokeWidth="1">
            <animate attributeName="r" values="9;12;9" dur={`${8+i*2}s`} repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur={`${8+i*2}s`} repeatCount="indefinite" />
          </circle>
          <text x="30" y={n.y + 3.5} textAnchor="middle" fill="rgba(255,149,0,0.9)"
            fontSize="6" fontFamily="monospace" fontWeight="bold">{n.l}</text>
        </g>
      ))}

      {/* Hidden layer 1 nodes */}
      {hidden1.map((y, i) => (
        <circle key={i} cx="80" cy={y} r="7" fill="rgba(255,107,53,0.08)" stroke="rgba(255,107,53,0.35)" strokeWidth="0.8">
          <animate attributeName="fill" values="rgba(255,107,53,0.08);rgba(255,107,53,0.28);rgba(255,107,53,0.08)"
            dur={`${5+i}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Hidden layer 2 nodes */}
      {hidden2.map((y, i) => (
        <circle key={i} cx="130" cy={y} r="8" fill="rgba(255,149,0,0.06)" stroke="rgba(255,149,0,0.4)" strokeWidth="0.8">
          <animate attributeName="fill" values="rgba(255,149,0,0.06);rgba(255,149,0,0.25);rgba(255,149,0,0.06)"
            dur={`${6+i}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Output nodes */}
      {outputs.map((o, i) => (
        <g key={i}>
          <circle cx="172" cy={o.y} r="10" fill={`${o.c}18`} stroke={o.c} strokeWidth="1.2" filter="url(#ki-soft)" />
          <text x="172" y={o.y + 3.5} textAnchor="middle" fill="rgba(255,255,255,0.85)"
            fontSize="5.5" fontFamily="monospace" fontWeight="bold">{o.l}</text>
        </g>
      ))}

      {/* Layer labels */}
      <text x="30" y="175" textAnchor="middle" fill="rgba(255,107,53,0.35)" fontSize="6" fontFamily="monospace">INPUT</text>
      <text x="80" y="175" textAnchor="middle" fill="rgba(255,107,53,0.35)" fontSize="6" fontFamily="monospace">H1·6</text>
      <text x="130" y="175" textAnchor="middle" fill="rgba(255,149,0,0.35)" fontSize="6" fontFamily="monospace">H2·4</text>
      <text x="172" y="175" textAnchor="middle" fill="rgba(100,200,100,0.45)" fontSize="6" fontFamily="monospace">DQN-OUT</text>

      {/* Confidence bar */}
      <rect x="8" y="8" width="55" height="6" rx="3" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.25)" strokeWidth="0.5" />
      <rect x="8" y="8" width="46" height="6" rx="3" fill="rgba(34,197,94,0.6)">
        <animate attributeName="width" values="46;52;46" dur="8s" repeatCount="indefinite" />
      </rect>
      <text x="66" y="14" fill="rgba(34,197,94,0.8)" fontSize="7" fontFamily="monospace">94%</text>
    </svg>
  );
}

function FleetVisual() {
  const vehicles = [
    { x: 8,  y: 16, soc: 72, chg: true,  label: 'EV-01', w: 78 },
    { x: 104, y: 16, soc: 41, chg: false, label: 'EV-02', w: 45 },
    { x: 8,  y: 78, soc: 88, chg: false, label: 'EV-03', w: 90 },
    { x: 104, y: 78, soc: 15, chg: true,  label: 'EV-04', w: 18 },
    { x: 8,  y: 140, soc: 63, chg: true,  label: 'EV-05', w: 65 },
    { x: 104, y: 140, soc: 54, chg: false, label: 'EV-06', w: 55 },
  ];
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 180, display: 'block' }}>
      <defs>
        <linearGradient id="fleet-bar-lo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff4500" /><stop offset="100%" stopColor="#ff6b35" />
        </linearGradient>
        <linearGradient id="fleet-bar-hi" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff9500" /><stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <filter id="fleet-glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feComposite in="SourceGraphic" in2="b" operator="over" /></filter>
      </defs>

      {vehicles.map((v, i) => {
        const isLo = v.soc < 30;
        const barColor = isLo ? 'url(#fleet-bar-lo)' : 'url(#fleet-bar-hi)';
        const accentCol = isLo ? 'rgba(255,80,0,0.7)' : 'rgba(255,149,0,0.6)';
        return (
          <g key={i}>
            {/* Card bg */}
            <rect x={v.x} y={v.y} width="88" height="54" rx="6"
              fill="rgba(10,6,22,0.85)" stroke={isLo ? 'rgba(255,80,0,0.4)' : 'rgba(255,107,53,0.2)'} strokeWidth="0.8">
              <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur={`${7+i}s`} repeatCount="indefinite" />
            </rect>

            {/* Vehicle label */}
            <text x={v.x + 8} y={v.y + 14} fill={accentCol} fontSize="8" fontFamily="monospace" fontWeight="bold">{v.label}</text>

            {/* Charging indicator */}
            {v.chg && (
              <text x={v.x + 64} y={v.y + 14} fill="rgba(255,220,50,0.9)" fontSize="10" fontFamily="monospace">
                ⚡
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
              </text>
            )}

            {/* SOC bar bg */}
            <rect x={v.x + 8} y={v.y + 22} width="72" height="8" rx="4"
              fill="rgba(255,255,255,0.05)" stroke="rgba(255,107,53,0.12)" strokeWidth="0.5" />
            {/* SOC bar fill */}
            <rect x={v.x + 8} y={v.y + 22} width={v.w * 0.72} height="8" rx="4" fill={barColor}>
              <animate attributeName="width" values={`${v.w*0.72};${v.w*0.72+5};${v.w*0.72}`} dur={`${11+i*2}s`} repeatCount="indefinite" />
            </rect>

            {/* SOC label */}
            <text x={v.x + 8} y={v.y + 44} fill={accentCol} fontSize="7.5" fontFamily="monospace">{v.soc}% SOC</text>
            <text x={v.x + 60} y={v.y + 44} fill="rgba(100,200,255,0.5)" fontSize="6" fontFamily="monospace">{v.chg ? '+11kW' : 'idle'}</text>
          </g>
        );
      })}

      {/* KI dispatch overlay beam */}
      <rect x="0" y="0" width="6" height="180"
        fill="linear-gradient(to bottom,transparent,rgba(255,107,53,0.5),transparent)" opacity="0.6">
        <animate attributeName="x" values="-6;204;-6" dur="6s" repeatCount="indefinite" />
      </rect>
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
  const [techModal, setTechModal] = useState<{ slug: string; title: string } | null>(null);

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
                    <div style={{ padding:'16px 16px 0', opacity: 1 }}>
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
                      <button type="button" onClick={() => setTechModal({ slug: app.slug, title: app.title })}
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
      {/* ── Tech Details Modal ── */}
      {techModal && (
        <TechModal
          slug={techModal.slug}
          title={techModal.title}
          onClose={() => setTechModal(null)}
        />
      )}
    </div>
  );
}
