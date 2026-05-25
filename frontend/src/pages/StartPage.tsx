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
    <svg viewBox="0 0 340 210" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 210, display: 'block' }}>
      <defs>
        <linearGradient id="pvbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#040b1a" />
          <stop offset="100%" stopColor="#02060f" />
        </linearGradient>
        <radialGradient id="pv-sun-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff4a0" stopOpacity="1" />
          <stop offset="35%" stopColor="#ff9500" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pv-bar-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="60%" stopColor="#ff9500" />
          <stop offset="100%" stopColor="#ffe066" />
        </linearGradient>
        <linearGradient id="pv-panel-f" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d2a50" />
          <stop offset="100%" stopColor="#040e22" />
        </linearGradient>
        <linearGradient id="pv-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,149,0,0.28)" />
          <stop offset="100%" stopColor="rgba(255,149,0,0)" />
        </linearGradient>
        <filter id="pvGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="pvSoftGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>

      {/* ── Background ── */}
      <rect width="340" height="210" fill="url(#pvbg)" rx="10" />

      {/* HMI corner brackets */}
      {([[4,4],[336,4],[4,206],[336,206]] as [number,number][]).map(([cx,cy],i)=>{
        const sx = cx < 170 ? 1 : -1, sy = cy < 105 ? 1 : -1;
        return <g key={i}>
          <line x1={cx} y1={cy} x2={cx+sx*18} y2={cy} stroke="rgba(255,107,53,0.6)" strokeWidth="1.5"/>
          <line x1={cx} y1={cy} x2={cx} y2={cy+sy*18} stroke="rgba(255,107,53,0.6)" strokeWidth="1.5"/>
        </g>;
      })}

      {/* Top header bar */}
      <rect x="4" y="4" width="332" height="28" rx="4" fill="rgba(255,107,53,0.05)" stroke="rgba(255,107,53,0.15)" strokeWidth="0.7" />
      <text x="14" y="22" fill="rgba(255,149,0,0.9)" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="0.12em">PV-SOLAR MONITOR</text>
      <circle cx="290" cy="18" r="4" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <text x="298" y="22" fill="rgba(34,197,94,0.9)" fontSize="7" fontFamily="monospace">LIVE</text>
      <text x="140" y="22" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">SYS·ID: WA-INV-01</text>

      {/* ── Sun ── */}
      <circle cx="294" cy="75" r="28" fill="url(#pv-sun-aura)" opacity="0.7">
        <animate attributeName="r" values="28;34;28" dur="7s" repeatCount="indefinite"/>
      </circle>
      <circle cx="294" cy="75" r="14" fill="#ffe87a" filter="url(#pvSoftGlow)">
        <animate attributeName="r" values="14;16;14" dur="5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="294" cy="75" r="9" fill="#fff0a0"/>
      {/* Sun rays */}
      {Array.from({length:12},(_,i)=>{
        const a=i*30*Math.PI/180, r1=17, r2=24;
        return <line key={i} x1={294+Math.cos(a)*r1} y1={75+Math.sin(a)*r1} x2={294+Math.cos(a)*r2} y2={75+Math.sin(a)*r2}
          stroke="#ffe87a" strokeWidth="1.4" strokeLinecap="round" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${2.5+i*0.18}s`} begin={`${i*0.2}s`} repeatCount="indefinite"/>
        </line>;
      })}

      {/* ── Isometric Solar Panel Array ── */}
      {/* 4 panels in 2×2 isometric layout */}
      {[0,1,2,3].map(i=>{
        const col=i%2, row=Math.floor(i/2);
        const ox=30+col*90, oy=60+row*52-col*14;
        const pw=82, ph=14;
        return <g key={i}>
          {/* Panel face */}
          <polygon points={`${ox},${oy} ${ox+pw},${oy-pw*0.12} ${ox+pw},${oy+ph} ${ox},${oy+ph+pw*0.12}`}
            fill="url(#pv-panel-f)" stroke="rgba(30,130,200,0.55)" strokeWidth="0.8"/>
          {/* Cell grid horizontal */}
          {[1,2,3,4].map(r=>(
            <line key={r} x1={ox} y1={oy+r*(ph/4)+r*pw*0.03} x2={ox+pw} y2={oy+r*(ph/4)-r*pw*0.01}
              stroke="rgba(100,190,255,0.2)" strokeWidth="0.4"/>
          ))}
          {/* Cell grid vertical */}
          {[1,2,3,4,5,6].map(c=>(
            <line key={c} x1={ox+c*(pw/7)} y1={oy-c*1.7} x2={ox+c*(pw/7)} y2={oy+ph+c*0.4}
              stroke="rgba(100,190,255,0.18)" strokeWidth="0.4"/>
          ))}
          {/* Top edge 3D */}
          <polygon points={`${ox},${oy} ${ox+pw},${oy-pw*0.12} ${ox+pw+4},${oy-pw*0.12-3} ${ox+4},${oy-3}`}
            fill="rgba(60,140,210,0.25)" stroke="rgba(120,180,255,0.4)" strokeWidth="0.5"/>
          {/* Shimmer */}
          <polygon points={`${ox},${oy} ${ox+pw},${oy-pw*0.12} ${ox+pw},${oy-pw*0.12+4} ${ox},${oy+4}`}
            fill="rgba(255,255,255,0.07)">
            <animate attributeName="opacity" values="0.07;0.18;0.07" dur={`${8+i*2}s`} repeatCount="indefinite"/>
          </polygon>
          {/* Active glow */}
          <polygon points={`${ox},${oy} ${ox+pw},${oy-pw*0.12} ${ox+pw},${oy+ph} ${ox},${oy+ph+pw*0.12}`}
            fill="rgba(255,149,0,0)">
            <animate attributeName="fill" values="rgba(255,149,0,0);rgba(255,149,0,0.1);rgba(255,149,0,0)"
              dur={`${10+i*2}s`} begin={`${i*1.5}s`} repeatCount="indefinite"/>
          </polygon>
        </g>;
      })}

      {/* ── Energy flow particles: panels → right ── */}
      {[0,1,2].map(i=>{
        const pid=`pv-ep-${i}`;
        return <g key={i}>
          <path id={pid} d={`M ${90+i*10} ${90+i*12} Q 220 ${50+i*8} 285 65`} fill="none"/>
          <circle r="3" fill="#ff9500" filter="url(#pvGlow)">
            <animateMotion dur={`${3+i*0.9}s`} repeatCount="indefinite" begin={`${i*1.1}s`}>
              <mpath xlinkHref={`#${pid}`}/>
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={`${3+i*0.9}s`} begin={`${i*1.1}s`} repeatCount="indefinite"/>
          </circle>
        </g>;
      })}

      {/* ── Power curve chart (bottom left) ── */}
      <rect x="10" y="148" width="200" height="52" rx="4" fill="rgba(255,107,53,0.03)" stroke="rgba(255,107,53,0.12)" strokeWidth="0.6"/>
      <text x="16" y="160" fill="rgba(255,149,0,0.6)" fontSize="6.5" fontFamily="monospace" letterSpacing="0.08em">ERTRAG TODAY · kWh</text>
      {/* Chart gridlines */}
      {[168,178,188].map(y=>(
        <line key={y} x1="16" y1={y} x2="204" y2={y} stroke="rgba(255,107,53,0.07)" strokeWidth="0.5"/>
      ))}
      {/* Area fill */}
      <polygon points="16,195 36,185 56,172 76,164 96,168 116,155 136,162 156,152 176,158 196,150 196,195"
        fill="url(#pv-chart-fill)"/>
      {/* Chart line */}
      <polyline points="16,195 36,185 56,172 76,164 96,168 116,155 136,162 156,152 176,158 196,150"
        stroke="#ff9500" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <animate attributeName="stroke-opacity" values="1;0.6;1" dur="6s" repeatCount="indefinite"/>
      </polyline>
      {/* Chart dots */}
      {[[36,185],[76,164],[116,155],[156,152],[196,150]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2.5" fill="#ff9500" filter="url(#pvGlow)">
          <animate attributeName="r" values="2.5;4;2.5" dur={`${5+i}s`} begin={`${i*0.7}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* ── Metric panels (right side) ── */}
      {[
        {x:222,y:120,label:'LEISTUNG',val:'7.4 kW',bar:74,c:'#ff9500'},
        {x:282,y:120,label:'EINSPEIS.',val:'2.1 kW',bar:42,c:'#3b82f6'},
      ].map((m,i)=>(
        <g key={i}>
          <rect x={m.x} y={m.y} width="52" height="50" rx="4"
            fill="rgba(255,107,53,0.04)" stroke="rgba(255,107,53,0.18)" strokeWidth="0.6"/>
          <text x={m.x+26} y={m.y+13} textAnchor="middle" fill="rgba(255,149,0,0.5)"
            fontSize="5.5" fontFamily="monospace" letterSpacing="0.08em">{m.label}</text>
          <text x={m.x+26} y={m.y+28} textAnchor="middle" fill={m.c}
            fontSize="10" fontFamily="monospace" fontWeight="900">{m.val}</text>
          {/* Mini bar */}
          <rect x={m.x+6} y={m.y+36} width="40" height="5" rx="2.5" fill="rgba(255,255,255,0.05)"/>
          <rect x={m.x+6} y={m.y+36} width={m.bar*0.4} height="5" rx="2.5" fill={m.c} opacity="0.8">
            <animate attributeName="width" values={`${m.bar*0.4};${m.bar*0.4+6};${m.bar*0.4}`} dur={`${9+i*3}s`} repeatCount="indefinite"/>
          </rect>
          <text x={m.x+26} y={m.y+48} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="5" fontFamily="monospace">{m.bar}%</text>
        </g>
      ))}

      {/* ── Efficiency ring ── */}
      <circle cx="254" cy="90" r="26" fill="rgba(255,107,53,0.04)" stroke="rgba(255,107,53,0.12)" strokeWidth="0.8"/>
      <circle cx="254" cy="90" r="26" fill="none" stroke="rgba(255,107,53,0.08)" strokeWidth="6"/>
      <circle cx="254" cy="90" r="26" fill="none" stroke="#ff9500" strokeWidth="6"
        strokeLinecap="round" strokeDasharray="103 64" strokeDashoffset="40" transform="rotate(-90 254 90)" opacity="0.85">
        <animate attributeName="stroke-dasharray" values="103 64;116 51;103 64" dur="10s" repeatCount="indefinite"/>
      </circle>
      <text x="254" y="87" textAnchor="middle" fill="#ff9500" fontSize="13" fontFamily="monospace" fontWeight="900">94%</text>
      <text x="254" y="98" textAnchor="middle" fill="rgba(255,149,0,0.5)" fontSize="5.5" fontFamily="monospace">EFF.</text>

      {/* ── Inverter status (bottom right) ── */}
      <rect x="222" y="174" width="112" height="28" rx="4" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.2)" strokeWidth="0.6"/>
      <circle cx="232" cy="188" r="3.5" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="240" y="184" fill="rgba(34,197,94,0.8)" fontSize="6.5" fontFamily="monospace" fontWeight="bold">INVERTER OK</text>
      <text x="240" y="196" fill="rgba(255,255,255,0.3)" fontSize="5.5" fontFamily="monospace">Freq 50.01 Hz · Cos φ 1.00</text>
    </svg>
  );
}
function BatteryVisual() {
  return (
    <svg viewBox="0 0 340 210" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 210, display: 'block' }}>
      <defs>
        <linearGradient id="batbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05050f"/>
          <stop offset="100%" stopColor="#010108"/>
        </linearGradient>
        <linearGradient id="bat-cellG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff4500"/>
          <stop offset="40%" stopColor="#ff9500"/>
          <stop offset="100%" stopColor="#22c55e"/>
        </linearGradient>
        <linearGradient id="bat-3dTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(60,40,100,0.95)"/>
          <stop offset="100%" stopColor="rgba(30,20,60,0.8)"/>
        </linearGradient>
        <linearGradient id="bat-3dRight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(20,10,40,0.95)"/>
          <stop offset="100%" stopColor="rgba(10,5,20,0.9)"/>
        </linearGradient>
        <filter id="batGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="batPulse" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <clipPath id="bat-clipFront"><rect x="90" y="38" width="82" height="148" rx="5"/></clipPath>
      </defs>

      <rect width="340" height="210" fill="url(#batbg)" rx="10"/>

      {/* Corner brackets */}
      {([[4,4],[336,4],[4,206],[336,206]] as [number,number][]).map(([cx,cy],i)=>{
        const sx=cx<170?1:-1, sy=cy<105?1:-1;
        return <g key={i}>
          <line x1={cx} y1={cy} x2={cx+sx*18} y2={cy} stroke="rgba(34,197,94,0.5)" strokeWidth="1.5"/>
          <line x1={cx} y1={cy} x2={cx} y2={cy+sy*18} stroke="rgba(34,197,94,0.5)" strokeWidth="1.5"/>
        </g>;
      })}

      {/* Header */}
      <rect x="4" y="4" width="332" height="28" rx="4" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="0.7"/>
      <text x="14" y="22" fill="rgba(34,197,94,0.85)" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="0.12em">BMS · BATTERY MONITOR</text>
      <text x="140" y="22" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">HV-PACK 48 V · 15 kWh</text>
      <circle cx="300" cy="18" r="4" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="308" y="22" fill="rgba(34,197,94,0.8)" fontSize="7" fontFamily="monospace">ONLINE</text>

      {/* ── 3D Battery body ── */}
      {/* Right face */}
      <polygon points="172,38 192,48 192,186 172,176"
        fill="url(#bat-3dRight)" stroke="rgba(34,197,94,0.25)" strokeWidth="0.8"/>
      {/* Top face */}
      <polygon points="90,38 172,38 192,48 110,48"
        fill="url(#bat-3dTop)" stroke="rgba(34,197,94,0.3)" strokeWidth="0.8"/>
      {/* Front face */}
      <rect x="90" y="38" width="82" height="148" rx="6"
        fill="rgba(12,8,28,0.96)" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5"/>

      {/* Cell rows */}
      {[70,95,120,145].map(y=>(
        <line key={y} x1="91" y1={y} x2="171" y2={y} stroke="rgba(34,197,94,0.1)" strokeWidth="0.6"/>
      ))}

      {/* Fill level bar */}
      <rect x="91" y="39" width="80" height="146" rx="5" fill="url(#bat-cellG)" clipPath="url(#bat-clipFront)">
        <animate attributeName="y" values="110;68;110" dur="18s" repeatCount="indefinite"/>
        <animate attributeName="height" values="74;116;74" dur="18s" repeatCount="indefinite"/>
      </rect>

      {/* Shimmer */}
      <rect x="91" y="39" width="38" height="146" rx="5" fill="rgba(255,255,255,0.05)" clipPath="url(#bat-clipFront)">
        <animate attributeName="opacity" values="0.05;0.14;0.05" dur="5s" repeatCount="indefinite"/>
      </rect>

      {/* Terminal */}
      <rect x="108" y="24" width="46" height="16" rx="4"
        fill="rgba(20,12,40,0.95)" stroke="rgba(34,197,94,0.5)" strokeWidth="1.2"/>
      <rect x="118" y="28" width="26" height="8" rx="2" fill="rgba(34,197,94,0.15)"/>

      {/* SOC label on front */}
      <text x="131" y="106" textAnchor="middle" fill="#22c55e" fontSize="24" fontFamily="monospace" fontWeight="900" filter="url(#batGlow)">78%</text>
      <text x="131" y="122" textAnchor="middle" fill="rgba(34,197,94,0.5)" fontSize="6.5" fontFamily="monospace" letterSpacing="0.1em">STATE OF CHARGE</text>

      {/* Lightning bolt – top-right of battery face, clear of SOC text */}
      <path d="M150 42 L144 58 L152 58 L148 76 L164 52 L156 52 L162 42Z"
        fill="rgba(255,220,50,0.9)" stroke="rgba(255,149,0,0.7)" strokeWidth="0.5" filter="url(#batGlow)">
        <animate attributeName="opacity" values="0.9;0.25;0.9" dur="2.2s" repeatCount="indefinite"/>
      </path>

      {/* ── SOC Arc meter (left panel) ── */}
      <circle cx="45" cy="110" r="34" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.1)" strokeWidth="1"/>
      <circle cx="45" cy="110" r="34" fill="none" stroke="rgba(34,197,94,0.08)" strokeWidth="9"/>
      <circle cx="45" cy="110" r="34" fill="none" stroke="url(#bat-cellG)" strokeWidth="9"
        strokeLinecap="round" strokeDasharray="147 66" strokeDashoffset="55" transform="rotate(-210 45 110)" opacity="0.9">
        <animate attributeName="stroke-dasharray" values="147 66;162 51;147 66" dur="18s" repeatCount="indefinite"/>
      </circle>
      <text x="45" y="105" textAnchor="middle" fill="#22c55e" fontSize="12" fontFamily="monospace" fontWeight="900">78%</text>
      <text x="45" y="117" textAnchor="middle" fill="rgba(34,197,94,0.45)" fontSize="5.5" fontFamily="monospace">SOC</text>
      <text x="45" y="152" textAnchor="middle" fill="rgba(255,149,0,0.6)" fontSize="7" fontFamily="monospace">+3.2 kW</text>
      <text x="45" y="163" textAnchor="middle" fill="rgba(255,149,0,0.35)" fontSize="6" fontFamily="monospace">LADUNG</text>

      {/* ── Cell voltage mini bars (right panel) ── */}
      <text x="216" y="50" fill="rgba(34,197,94,0.5)" fontSize="6.5" fontFamily="monospace" letterSpacing="0.08em">ZELLSPANNUNGEN</text>
      {[3.82,3.81,3.85,3.79,3.83,3.80].map((v,i)=>{
        const bar=(v-3.7)*200;
        const c=v>3.83?'#22c55e':v>3.80?'#ff9500':'#ff6b35';
        return <g key={i}>
          <rect x="216" y={56+i*18} width="90" height="10" rx="5" fill="rgba(255,255,255,0.04)" stroke="rgba(34,197,94,0.1)" strokeWidth="0.5"/>
          <rect x="216" y={56+i*18} width={bar} height="10" rx="5" fill={c} opacity="0.75">
            <animate attributeName="width" values={`${bar};${bar+3};${bar}`} dur={`${8+i*2}s`} repeatCount="indefinite"/>
          </rect>
          <text x="308" y={56+i*18+8} fill="rgba(255,255,255,0.4)" fontSize="5.5" fontFamily="monospace">{i+1}:{v}V</text>
        </g>;
      })}

      {/* Temp / charge status footer */}
      <rect x="216" y="172" width="116" height="30" rx="4" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="0.6"/>
      <text x="226" y="185" fill="rgba(255,149,0,0.7)" fontSize="7" fontFamily="monospace">28.4°C · Zyklen: 312</text>
      <text x="226" y="197" fill="rgba(34,197,94,0.55)" fontSize="7" fontFamily="monospace">Tibber · Tarifoptimiert</text>

      {/* Charging particles in */}
      {[0,1,2].map(i=>{
        const pid=`bat-in-${i}`;
        return <g key={i}>
          <path id={pid} d={`M ${20+i*25} 10 Q ${55+i*12} 25 ${115+i*8} 38`} fill="none"/>
          <circle r="2.5" fill="#ff9500" filter="url(#batGlow)">
            <animateMotion dur={`${2.5+i*0.7}s`} repeatCount="indefinite" begin={`${i*0.9}s`}>
              <mpath xlinkHref={`#${pid}`}/>
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={`${2.5+i*0.7}s`} begin={`${i*0.9}s`} repeatCount="indefinite"/>
          </circle>
        </g>;
      })}
    </svg>
  );
}

function EvVisual() {
  return (
    <svg viewBox="0 0 340 210" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 210, display: 'block' }}>
      <defs>
        <linearGradient id="evbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020a1a"/>
          <stop offset="100%" stopColor="#010508"/>
        </linearGradient>
        <linearGradient id="ev-carBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1e5a"/>
          <stop offset="100%" stopColor="#060e2e"/>
        </linearGradient>
        <linearGradient id="ev-chargebar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff6b35"/>
          <stop offset="50%" stopColor="#ff9500"/>
          <stop offset="100%" stopColor="#22c55e"/>
        </linearGradient>
        <radialGradient id="ev-underbody" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.45)"/>
          <stop offset="100%" stopColor="rgba(59,130,246,0)"/>
        </radialGradient>
        <filter id="evGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="evSoft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="10" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>

      <rect width="340" height="210" fill="url(#evbg)" rx="10"/>

      {/* Corner brackets */}
      {([[4,4],[336,4],[4,206],[336,206]] as [number,number][]).map(([cx,cy],i)=>{
        const sx=cx<170?1:-1, sy=cy<105?1:-1;
        return <g key={i}>
          <line x1={cx} y1={cy} x2={cx+sx*18} y2={cy} stroke="rgba(59,130,246,0.55)" strokeWidth="1.5"/>
          <line x1={cx} y1={cy} x2={cx} y2={cy+sy*18} stroke="rgba(59,130,246,0.55)" strokeWidth="1.5"/>
        </g>;
      })}

      {/* Header */}
      <rect x="4" y="4" width="332" height="28" rx="4" fill="rgba(59,130,246,0.05)" stroke="rgba(59,130,246,0.15)" strokeWidth="0.7"/>
      <text x="14" y="22" fill="rgba(59,130,246,0.9)" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="0.12em">EV · V2H/V2G CHARGE HUB</text>
      <text x="160" y="22" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">ISO 15118 · OCPP 2.0.1</text>
      <circle cx="308" cy="18" r="4" fill="#3b82f6">
        <animate attributeName="opacity" values="1;0.2;1" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <text x="316" y="22" fill="rgba(59,130,246,0.8)" fontSize="7" fontFamily="monospace">CHG</text>

      {/* Background grid */}
      {[60,100,140,180,220,260,300].map(x=>(
        <line key={x} x1={x} y1="36" x2={x} y2="175" stroke="rgba(59,130,246,0.05)" strokeWidth="0.5"/>
      ))}
      {[60,90,120,150].map(y=>(
        <line key={y} x1="10" y1={y} x2="330" y2={y} stroke="rgba(59,130,246,0.05)" strokeWidth="0.5"/>
      ))}

      {/* ── EV car body (detailed side view) ── */}
      {/* Body */}
      <path d="M 40 138 L 40 105 Q 48 80 78 72 L 160 68 Q 195 68 212 86 L 228 105 L 228 138 Z"
        fill="url(#ev-carBody)" stroke="rgba(59,130,246,0.7)" strokeWidth="1.8"/>
      {/* Roof */}
      <path d="M 78 72 Q 86 50 108 44 L 172 44 Q 196 46 212 68 L 160 68 Z"
        fill="rgba(6,18,58,0.95)" stroke="rgba(59,130,246,0.55)" strokeWidth="1.2"/>
      {/* Windshield */}
      <path d="M 110 44 Q 114 52 118 68 L 158 68 Q 168 58 170 44 Z"
        fill="rgba(100,170,255,0.13)" stroke="rgba(100,200,255,0.35)" strokeWidth="0.7"/>
      {/* Rear window */}
      <path d="M 80 73 Q 86 56 98 50 L 111 44 Q 115 52 112 68 Z"
        fill="rgba(100,170,255,0.1)" stroke="rgba(100,200,255,0.25)" strokeWidth="0.5"/>
      {/* Door line */}
      <line x1="158" y1="68" x2="160" y2="136" stroke="rgba(59,130,246,0.35)" strokeWidth="0.8"/>
      {/* Side crease */}
      <path d="M 48 120 Q 130 110 228 115" stroke="rgba(59,130,246,0.25)" strokeWidth="0.8" fill="none"/>
      {/* Headlights */}
      <ellipse cx="228" cy="108" rx="5" ry="3" fill="rgba(180,220,255,0.5)" stroke="rgba(200,235,255,0.7)" strokeWidth="0.5">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite"/>
      </ellipse>
      {/* Taillights */}
      <ellipse cx="42" cy="112" rx="4" ry="2.5" fill="rgba(255,60,40,0.4)" stroke="rgba(255,100,80,0.6)" strokeWidth="0.5">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite"/>
      </ellipse>

      {/* Wheels */}
      {[[80,142],[192,142]].map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="20" fill="rgba(4,8,20,0.96)" stroke="rgba(59,130,246,0.55)" strokeWidth="1.8"/>
          <circle cx={cx} cy={cy} r="11" fill="rgba(10,20,50,0.9)" stroke="rgba(59,130,246,0.4)" strokeWidth="0.8"/>
          <circle cx={cx} cy={cy} r="4" fill="rgba(59,130,246,0.7)"/>
          {/* Wheel spokes */}
          {[0,60,120,180,240,300].map(a=>{
            const r=a*Math.PI/180;
            return <line key={a} x1={cx+Math.cos(r)*5} y1={cy+Math.sin(r)*5} x2={cx+Math.cos(r)*10} y2={cy+Math.sin(r)*10}
              stroke="rgba(59,130,246,0.5)" strokeWidth="0.8"/>;
          })}
        </g>
      ))}

      {/* Underbody glow */}
      <ellipse cx="134" cy="162" rx="88" ry="7" fill="url(#ev-underbody)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite"/>
      </ellipse>

      {/* ── Charging port + cable ── */}
      <rect x="228" y="108" width="10" height="18" rx="3"
        fill="rgba(255,107,53,0.3)" stroke="rgba(255,107,53,0.8)" strokeWidth="1.2">
        <animate attributeName="fill" values="rgba(255,107,53,0.3);rgba(255,107,53,0.7);rgba(255,107,53,0.3)" dur="1.8s" repeatCount="indefinite"/>
      </rect>
      {/* Cable to charger */}
      <path d="M 238 117 C 258 117 266 100 280 95 L 300 95"
        stroke="rgba(255,107,53,0.5)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      {/* Charger box */}
      <rect x="300" y="82" width="32" height="56" rx="5"
        fill="rgba(10,8,22,0.95)" stroke="rgba(255,107,53,0.5)" strokeWidth="1.2"/>
      <text x="316" y="103" textAnchor="middle" fill="rgba(255,149,0,0.8)" fontSize="9" fontFamily="monospace">⚡</text>
      <text x="316" y="116" textAnchor="middle" fill="rgba(255,149,0,0.6)" fontSize="5.5" fontFamily="monospace">11 kW</text>
      <text x="316" y="127" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="5" fontFamily="monospace">AC</text>
      <rect x="306" y="130" width="20" height="4" rx="2" fill="rgba(255,107,53,0.1)"/>
      <rect x="306" y="130" width="14" height="4" rx="2" fill="#ff9500" opacity="0.7">
        <animate attributeName="width" values="14;18;14" dur="3s" repeatCount="indefinite"/>
      </rect>

      {/* ── V2H arrow left ── */}
      <path id="ev-v2h-path" d="M 40 117 Q 20 117 12 100" fill="none"/>
      <path d="M 40 117 Q 20 117 12 100" stroke="rgba(34,197,94,0.25)" strokeWidth="2.2" strokeDasharray="5 5" fill="none"/>
      <circle r="3.5" fill="#22c55e" filter="url(#evGlow)">
        <animateMotion dur="4s" repeatCount="indefinite" begin="0.5s">
          <mpath xlinkHref="#ev-v2h-path"/>
        </animateMotion>
        <animate attributeName="opacity" values="0;1;1;0" dur="4s" begin="0.5s" repeatCount="indefinite"/>
      </circle>
      {/* HOME label */}
      <rect x="4" y="84" width="32" height="20" rx="4" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.3)" strokeWidth="0.7"/>
      <text x="20" y="94" textAnchor="middle" fill="rgba(34,197,94,0.8)" fontSize="6.5" fontFamily="monospace" fontWeight="bold">HOME</text>
      <text x="20" y="103" textAnchor="middle" fill="rgba(34,197,94,0.5)" fontSize="5.5" fontFamily="monospace">2.4kW</text>

      {/* Charge particles: charger → car */}
      {[0,1].map(i=>{
        const pid=`ev-chg-${i}`;
        return <g key={i}>
          <path id={pid} d="M 300 95 C 280 95 258 117 238 117" fill="none"/>
          <circle r="3" fill="#ff9500" filter="url(#evGlow)">
            <animateMotion dur={`${2.2+i*0.8}s`} repeatCount="indefinite" begin={`${i*1.1}s`}>
              <mpath xlinkHref={`#${pid}`}/>
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={`${2.2+i*0.8}s`} begin={`${i*1.1}s`} repeatCount="indefinite"/>
          </circle>
        </g>;
      })}

      {/* ── SOC circular gauge (top-right, clear of car roof) ── */}
      <circle cx="260" cy="55" r="18" fill="rgba(59,130,246,0.05)" stroke="rgba(59,130,246,0.1)" strokeWidth="1"/>
      <circle cx="260" cy="55" r="18" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="6"/>
      <circle cx="260" cy="55" r="18" fill="none" stroke="url(#ev-chargebar)" strokeWidth="6"
        strokeLinecap="round" strokeDasharray="76 37" strokeDashoffset="29" transform="rotate(-210 260 55)" opacity="0.9">
        <animate attributeName="stroke-dasharray" values="76 37;86 27;76 37" dur="12s" repeatCount="indefinite"/>
      </circle>
      <text x="260" y="52" textAnchor="middle" fill="#3b82f6" fontSize="10" fontFamily="monospace" fontWeight="900">68%</text>
      <text x="260" y="62" textAnchor="middle" fill="rgba(59,130,246,0.45)" fontSize="5" fontFamily="monospace">SOC</text>

      {/* ── Charge bar ── */}
      <rect x="20" y="175" width="300" height="9" rx="4.5" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.18)" strokeWidth="0.6"/>
      <rect x="20" y="175" width="204" height="9" rx="4.5" fill="url(#ev-chargebar)">
        <animate attributeName="width" values="204;224;204" dur="12s" repeatCount="indefinite"/>
      </rect>
      <text x="170" y="196" textAnchor="middle" fill="rgba(255,149,0,0.6)" fontSize="7" fontFamily="monospace">SOC 68% · Lädt mit 11 kW · Fertig 06:30</text>
      <text x="170" y="207" textAnchor="middle" fill="rgba(34,197,94,0.45)" fontSize="6.5" fontFamily="monospace">V2H aktiv · 2.4 kW ins Haus gespeist</text>
    </svg>
  );
}

function SmartHomeVisual() {
  return (
    <svg viewBox="0 0 340 210" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 210, display: 'block' }}>
      <defs>
        <linearGradient id="shbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05070a"/>
          <stop offset="100%" stopColor="#020407"/>
        </linearGradient>
        <radialGradient id="sh-hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,149,0,0.7)"/>
          <stop offset="100%" stopColor="rgba(255,149,0,0)"/>
        </radialGradient>
        <filter id="shGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="shSoft" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="10" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>

      <rect width="340" height="210" fill="url(#shbg)" rx="10"/>

      {/* Corner brackets */}
      {([[4,4],[336,4],[4,206],[336,206]] as [number,number][]).map(([cx,cy],i)=>{
        const sx=cx<170?1:-1, sy=cy<105?1:-1;
        return <g key={i}>
          <line x1={cx} y1={cy} x2={cx+sx*18} y2={cy} stroke="rgba(255,107,53,0.5)" strokeWidth="1.5"/>
          <line x1={cx} y1={cy} x2={cx} y2={cy+sy*18} stroke="rgba(255,107,53,0.5)" strokeWidth="1.5"/>
        </g>;
      })}

      {/* Header */}
      <rect x="4" y="4" width="332" height="28" rx="4" fill="rgba(255,107,53,0.04)" stroke="rgba(255,107,53,0.15)" strokeWidth="0.7"/>
      <text x="14" y="22" fill="rgba(255,107,53,0.85)" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="0.12em">SMART HOME · ENERGY HUB</text>
      <text x="180" y="22" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">6 Geräte optimiert</text>
      <circle cx="308" cy="18" r="4" fill="#ff9500">
        <animate attributeName="opacity" values="1;0.25;1" dur="3s" repeatCount="indefinite"/>
      </circle>
      <text x="316" y="22" fill="rgba(255,149,0,0.8)" fontSize="7" fontFamily="monospace">AUTO</text>

      {/* ── House schematic ── */}
      {/* Roof */}
      <path d="M 100 55 L 170 30 L 240 55"
        fill="none" stroke="rgba(255,107,53,0.55)" strokeWidth="2.2" strokeLinejoin="round" filter="url(#shGlow)"/>
      {/* Roof fill */}
      <path d="M 104 55 L 170 32 L 236 55 Z"
        fill="rgba(255,107,53,0.04)"/>
      {/* Walls */}
      <rect x="100" y="55" width="140" height="100" rx="2"
        fill="rgba(10,12,25,0.85)" stroke="rgba(255,107,53,0.3)" strokeWidth="1.2"/>
      {/* Door */}
      <rect x="154" y="115" width="32" height="40" rx="2"
        fill="rgba(255,107,53,0.08)" stroke="rgba(255,107,53,0.25)" strokeWidth="0.8"/>
      <circle cx="181" cy="135" r="2" fill="rgba(255,107,53,0.4)"/>
      {/* Windows */}
      {[[112,65],[196,65],[112,95],[196,95]].map(([x,y],i)=>(
        <rect key={i} x={x} y={y} width="24" height="18" rx="2"
          fill="rgba(255,149,0,0.1)" stroke="rgba(255,149,0,0.35)" strokeWidth="0.7">
          <animate attributeName="fill" values="rgba(255,149,0,0.1);rgba(255,149,0,0.28);rgba(255,149,0,0.1)"
            dur={`${6+i*2}s`} begin={`${i*1.5}s`} repeatCount="indefinite"/>
        </rect>
      ))}
      {/* Cross lines in windows */}
      {[[112,65],[196,65],[112,95],[196,95]].map(([x,y],i)=>(
        <g key={i}>
          <line x1={x+12} y1={y} x2={x+12} y2={y+18} stroke="rgba(255,149,0,0.2)" strokeWidth="0.5"/>
          <line x1={x} y1={y+9} x2={x+24} y2={y+9} stroke="rgba(255,149,0,0.2)" strokeWidth="0.5"/>
        </g>
      ))}

      {/* Chimney */}
      <rect x="198" y="36" width="14" height="24" fill="rgba(10,12,25,0.9)" stroke="rgba(255,107,53,0.25)" strokeWidth="0.7"/>

      {/* ── Central AI hub ── */}
      <circle cx="170" cy="90" r="16" fill="url(#sh-hubGlow)" filter="url(#shSoft)"/>
      <circle cx="170" cy="90" r="10" fill="rgba(255,149,0,0.2)" stroke="rgba(255,149,0,0.8)" strokeWidth="1.5">
        <animate attributeName="r" values="10;13;10" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="0.8;0.3;0.8" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="170" cy="90" r="5" fill="rgba(255,149,0,0.95)" filter="url(#shGlow)"/>

      {/* ── Device nodes (outside house) ── */}
      {[
        {x:30,y:55,label:'HP',sub:'Wärme',c:'#ff6b35',d:'0s'},
        {x:310,y:55,label:'PV',sub:'7.4kW',c:'#facc15',d:'1.2s'},
        {x:26,y:130,label:'WM',sub:'Pause',c:'#3b82f6',d:'2.4s'},
        {x:316,y:130,label:'AC',sub:'20°C',c:'#22d3ee',d:'3.5s'},
        {x:80,y:172,label:'BAT',sub:'78%',c:'#22c55e',d:'0.8s'},
        {x:260,y:172,label:'EV',sub:'68%',c:'#a855f7',d:'1.8s'},
      ].map((n,i)=>{
        const pid=`sh-conn-${i}`;
        return <g key={i}>
          {/* Connection line */}
          <line x1={n.x} y1={n.y} x2="170" y2="90"
            stroke={`${n.c}25`} strokeWidth="1.5" strokeDasharray="5 6"/>
          {/* Animated data pulse */}
          <path id={pid} d={`M${n.x},${n.y} L170,90`} fill="none"/>
          <circle r="2.8" fill={n.c} filter="url(#shGlow)">
            <animateMotion dur={`${3.2+i*0.6}s`} repeatCount="indefinite" begin={n.d}>
              <mpath xlinkHref={`#${pid}`}/>
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={`${3.2+i*0.6}s`} begin={n.d} repeatCount="indefinite"/>
          </circle>
          {/* Node */}
          <circle cx={n.x} cy={n.y} r="16" fill={`${n.c}0f`} stroke={`${n.c}55`} strokeWidth="1.3">
            <animate attributeName="r" values="16;20;16" dur={`${9+i*2}s`} begin={n.d} repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" values="0.33;0.8;0.33" dur={`${9+i*2}s`} begin={n.d} repeatCount="indefinite"/>
          </circle>
          <circle cx={n.x} cy={n.y} r="8" fill={`${n.c}22`} stroke={n.c} strokeWidth="1.2"/>
          <text x={n.x} y={n.y-1} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="6" fontFamily="monospace" fontWeight="bold">{n.label}</text>
          <text x={n.x} y={n.y+9} textAnchor="middle" fill={n.c} fontSize="5.5" fontFamily="monospace">{n.sub}</text>
        </g>;
      })}

      {/* ── Savings ticker ── */}
      <rect x="4" y="186" width="332" height="20" rx="4" fill="rgba(255,107,53,0.04)" stroke="rgba(255,107,53,0.12)" strokeWidth="0.6"/>
      <text x="170" y="200" textAnchor="middle" fill="rgba(255,107,53,0.55)" fontSize="7" fontFamily="monospace">
        Einsparung heute: −2.1 kWh · CO₂ vermieden: 0.92 kg · Optimierung aktiv
      </text>
    </svg>
  );
}

function KiVisual() {
  const inputs = [{y:42,l:'PV',v:'7.4kW'},{y:78,l:'BAT',v:'78%'},{y:114,l:'GRID',v:'0.3€'},{y:150,l:'WTR',v:'22°C'},{y:186,l:'LOAD',v:'2.1kW'}];
  const h1 = [30,58,86,114,142,170,198];
  const h2 = [50,82,114,146,178];
  const outputs = [{y:60,l:'CHARGE',c:'#22c55e'},{y:100,l:'SELL',c:'#3b82f6'},{y:140,l:'STORE',c:'#a855f7'},{y:180,l:'SHIFT',c:'#ff9500'}];
  return (
    <svg viewBox="0 0 340 210" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 210, display: 'block' }}>
      <defs>
        <linearGradient id="kibg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#060412"/>
          <stop offset="100%" stopColor="#020109"/>
        </linearGradient>
        <filter id="kiGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="kiSoft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>

      <rect width="340" height="210" fill="url(#kibg)" rx="10"/>

      {/* Corner brackets */}
      {([[4,4],[336,4],[4,206],[336,206]] as [number,number][]).map(([cx,cy],i)=>{
        const sx=cx<170?1:-1, sy=cy<105?1:-1;
        return <g key={i}>
          <line x1={cx} y1={cy} x2={cx+sx*18} y2={cy} stroke="rgba(167,139,250,0.5)" strokeWidth="1.5"/>
          <line x1={cx} y1={cy} x2={cx} y2={cy+sy*18} stroke="rgba(167,139,250,0.5)" strokeWidth="1.5"/>
        </g>;
      })}

      {/* Header */}
      <rect x="4" y="4" width="332" height="28" rx="4" fill="rgba(124,58,237,0.05)" stroke="rgba(167,139,250,0.2)" strokeWidth="0.7"/>
      <text x="14" y="22" fill="rgba(167,139,250,0.85)" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="0.12em">DQN · KI ENERGY AGENT</text>
      <text x="175" y="22" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">Konfidenz: 94%</text>
      <circle cx="308" cy="18" r="4" fill="#a855f7">
        <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/>
      </circle>
      <text x="316" y="22" fill="rgba(167,139,250,0.8)" fontSize="7" fontFamily="monospace">INFER</text>

      {/* ── Network connections: input→h1 ── */}
      {inputs.map(inp=>h1.map(hy=>(
        <line key={`${inp.y}-${hy}`} x1="56" y1={inp.y} x2="130" y2={hy}
          stroke="rgba(255,107,53,0.1)" strokeWidth="0.45">
          <animate attributeName="opacity" values="0.1;0.35;0.1" dur={`${5+(inp.y+hy)%7}s`} repeatCount="indefinite"/>
        </line>
      )))}
      {/* h1→h2 */}
      {h1.map(h1y=>h2.map(h2y=>(
        <line key={`${h1y}-${h2y}`} x1="130" y1={h1y} x2="200" y2={h2y}
          stroke="rgba(255,149,0,0.09)" strokeWidth="0.45">
          <animate attributeName="opacity" values="0.09;0.3;0.09" dur={`${6+(h1y+h2y)%6}s`} repeatCount="indefinite"/>
        </line>
      )))}
      {/* h2→output */}
      {h2.map(h2y=>outputs.map(o=>(
        <line key={`${h2y}-${o.y}`} x1="200" y1={h2y} x2="268" y2={o.y}
          stroke={`${o.c}20`} strokeWidth="0.6">
          <animate attributeName="opacity" values="0.12;0.45;0.12" dur={`${7+(h2y+o.y)%5}s`} repeatCount="indefinite"/>
        </line>
      )))}

      {/* Animated signal particles */}
      {[
        {from:[56,42],to:[130,58],t:'3.8s',d:'0s',c:'#ff6b35'},
        {from:[56,114],to:[130,114],t:'4.5s',d:'1.2s',c:'#ff9500'},
        {from:[56,186],to:[130,170],t:'4s',d:'0.5s',c:'#ff6b35'},
        {from:[130,58],to:[200,82],t:'3.5s',d:'0.8s',c:'#ff9500'},
        {from:[130,170],to:[200,146],t:'4.2s',d:'2s',c:'#a855f7'},
        {from:[200,50],to:[268,60],t:'3.2s',d:'1s',c:'#22c55e'},
        {from:[200,114],to:[268,100],t:'4s',d:'2.2s',c:'#3b82f6'},
        {from:[200,178],to:[268,180],t:'5s',d:'0.3s',c:'#ff9500'},
      ].map((p,i)=>{
        const pid=`ki-sig-${i}`;
        return <g key={i}>
          <path id={pid} d={`M${p.from[0]},${p.from[1]} L${p.to[0]},${p.to[1]}`} fill="none"/>
          <circle r="2.8" fill={p.c} filter="url(#kiSoft)">
            <animateMotion dur={p.t} repeatCount="indefinite" begin={p.d}>
              <mpath xlinkHref={`#${pid}`}/>
            </animateMotion>
            <animate attributeName="opacity" values="0;1;1;0" dur={p.t} begin={p.d} repeatCount="indefinite"/>
          </circle>
        </g>;
      })}

      {/* ── Input nodes ── */}
      {inputs.map((n,i)=>(
        <g key={i}>
          <circle cx="56" cy={n.y} r="12" fill="rgba(255,107,53,0.1)" stroke="rgba(255,107,53,0.5)" strokeWidth="1">
            <animate attributeName="r" values="12;15;12" dur={`${8+i*2}s`} repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur={`${8+i*2}s`} repeatCount="indefinite"/>
          </circle>
          <text x="56" y={n.y-2} textAnchor="middle" fill="rgba(255,149,0,0.9)" fontSize="6" fontFamily="monospace" fontWeight="bold">{n.l}</text>
          <text x="56" y={n.y+8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="5.5" fontFamily="monospace">{n.v}</text>
        </g>
      ))}

      {/* ── Hidden layer 1 ── */}
      {h1.map((y,i)=>(
        <circle key={i} cx="130" cy={y} r="8" fill="rgba(255,107,53,0.07)" stroke="rgba(255,107,53,0.4)" strokeWidth="0.8">
          <animate attributeName="fill" values="rgba(255,107,53,0.07);rgba(255,107,53,0.3);rgba(255,107,53,0.07)"
            dur={`${5+i}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <text x="130" y="208" textAnchor="middle" fill="rgba(255,107,53,0.3)" fontSize="6" fontFamily="monospace">H1·7</text>

      {/* ── Hidden layer 2 ── */}
      {h2.map((y,i)=>(
        <circle key={i} cx="200" cy={y} r="9" fill="rgba(255,149,0,0.06)" stroke="rgba(255,149,0,0.4)" strokeWidth="0.8">
          <animate attributeName="fill" values="rgba(255,149,0,0.06);rgba(255,149,0,0.28);rgba(255,149,0,0.06)"
            dur={`${6+i}s`} repeatCount="indefinite"/>
        </circle>
      ))}
      <text x="200" y="208" textAnchor="middle" fill="rgba(255,149,0,0.3)" fontSize="6" fontFamily="monospace">H2·5</text>

      {/* ── Output nodes with confidence bars ── */}
      {outputs.map((o,i)=>(
        <g key={i}>
          <circle cx="268" cy={o.y} r="11" fill={`${o.c}15`} stroke={o.c} strokeWidth="1.3" filter="url(#kiSoft)">
            <animate attributeName="r" values="11;14;11" dur={`${8+i*1.5}s`} repeatCount="indefinite"/>
          </circle>
          <text x="268" y={o.y+4} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="5.5" fontFamily="monospace" fontWeight="bold">{o.l}</text>
          {/* Confidence bar */}
          <rect x="284" y={o.y-5} width="46" height="7" rx="3.5" fill="rgba(255,255,255,0.04)" stroke={`${o.c}40`} strokeWidth="0.5"/>
          <rect x="284" y={o.y-5} width={[38,28,22,18][i]} height="7" rx="3.5" fill={o.c} opacity="0.7">
            <animate attributeName="width" values={`${[38,28,22,18][i]};${[38,28,22,18][i]+4};${[38,28,22,18][i]}`} dur={`${8+i*2}s`} repeatCount="indefinite"/>
          </rect>
          <text x="334" y={o.y+3} fill={o.c} fontSize="6" fontFamily="monospace">{['94','74','58','47'][i]}%</text>
        </g>
      ))}

      {/* ── Reward curve (bottom-right, clear of input nodes) ── */}
      <rect x="228" y="188" width="104" height="18" rx="3" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.15)" strokeWidth="0.5"/>
      <polyline points="232,202 242,198 252,200 262,195 272,193 282,190 292,192 302,188 312,186 322,184"
        stroke="#22c55e" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <animate attributeName="stroke-opacity" values="1;0.5;1" dur="4s" repeatCount="indefinite"/>
      </polyline>
      <text x="230" y="203" fill="rgba(34,197,94,0.45)" fontSize="5.5" fontFamily="monospace">Reward ↑</text>

      {/* Input/output labels */}
      <text x="56" y="208" textAnchor="middle" fill="rgba(255,107,53,0.3)" fontSize="6" fontFamily="monospace">INPUT</text>
      <text x="268" y="208" textAnchor="middle" fill="rgba(100,200,100,0.3)" fontSize="6" fontFamily="monospace">OUTPUT</text>
    </svg>
  );
}

function FleetVisual() {
  const vehicles = [
    {x:8,  y:36, soc:72, chg:true,  label:'EV-01', model:'Tesla M3', kw:'+11.0'},
    {x:120,y:36, soc:41, chg:false, label:'EV-02', model:'VW ID.4',  kw:'idle'},
    {x:232,y:36, soc:88, chg:false, label:'EV-03', model:'BMW iX3',  kw:'idle'},
    {x:8,  y:118,soc:15, chg:true,  label:'EV-04', model:'Audi Q4',  kw:'+22.0'},
    {x:120,y:118,soc:63, chg:true,  label:'EV-05', model:'Hyundai',  kw:'+11.0'},
    {x:232,y:118,soc:54, chg:false, label:'EV-06', model:'Polestar', kw:'idle'},
  ];
  return (
    <div style={{position:'relative'}}>
      <svg viewBox="0 0 340 210" fill="none" xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 210, display: 'block' }}>
      <defs>
        <linearGradient id="flbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#030810"/>
          <stop offset="100%" stopColor="#010408"/>
        </linearGradient>
        <linearGradient id="fl-barLo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff4500"/><stop offset="100%" stopColor="#ff6b35"/>
        </linearGradient>
        <linearGradient id="fl-barHi" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff9500"/><stop offset="100%" stopColor="#22c55e"/>
        </linearGradient>
        <filter id="flGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>

      <rect width="340" height="210" fill="url(#flbg)" rx="10"/>

      {/* Corner brackets */}
      {([[4,4],[336,4],[4,206],[336,206]] as [number,number][]).map(([cx,cy],i)=>{
        const sx=cx<170?1:-1, sy=cy<105?1:-1;
        return <g key={i}>
          <line x1={cx} y1={cy} x2={cx+sx*18} y2={cy} stroke="rgba(255,107,53,0.5)" strokeWidth="1.5"/>
          <line x1={cx} y1={cy} x2={cx} y2={cy+sy*18} stroke="rgba(255,107,53,0.5)" strokeWidth="1.5"/>
        </g>;
      })}

      {/* Header */}
      <rect x="4" y="4" width="332" height="28" rx="4" fill="rgba(255,107,53,0.04)" stroke="rgba(255,107,53,0.15)" strokeWidth="0.7"/>
      <text x="14" y="22" fill="rgba(255,107,53,0.85)" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="0.12em">FLEET EMS · CHARGE DISPATCH</text>
      <text x="205" y="22" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">6 EV · 3 CHG</text>
      <circle cx="308" cy="18" r="4" fill="#ff9500">
        <animate attributeName="opacity" values="1;0.2;1" dur="2.2s" repeatCount="indefinite"/>
      </circle>
      <text x="316" y="22" fill="rgba(255,149,0,0.8)" fontSize="7" fontFamily="monospace">LIVE</text>

      {/* Vehicle cards */}
      {vehicles.map((v,i)=>{
        const isLo=v.soc<30;
        const ac=isLo?'rgba(255,80,0,0.75)':'rgba(255,149,0,0.65)';
        const bar=(v.soc/100)*92;
        const barFill=isLo?'url(#fl-barLo)':'url(#fl-barHi)';
        return <g key={i}>
          {/* Card */}
          <rect x={v.x} y={v.y} width="104" height="70" rx="6"
            fill="rgba(6,10,22,0.9)" stroke={isLo?'rgba(255,60,0,0.5)':'rgba(255,107,53,0.22)'} strokeWidth="0.9">
            <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur={`${7+i}s`} repeatCount="indefinite"/>
          </rect>

          {/* Label row */}
          <text x={v.x+8} y={v.y+16} fill={ac} fontSize="8.5" fontFamily="monospace" fontWeight="bold">{v.label}</text>
          <text x={v.x+56} y={v.y+16} fill="rgba(255,255,255,0.25)" fontSize="6.5" fontFamily="monospace">{v.model}</text>

          {/* Charging bolt */}
          {v.chg && (
            <text x={v.x+90} y={v.y+16} fill="rgba(255,220,50,0.9)" fontSize="11" fontFamily="monospace">
              ⚡
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite"/>
            </text>
          )}

          {/* SOC bar */}
          <rect x={v.x+8} y={v.y+26} width="88" height="10" rx="5" fill="rgba(255,255,255,0.05)" stroke="rgba(255,107,53,0.1)" strokeWidth="0.4"/>
          <rect x={v.x+8} y={v.y+26} width={bar} height="10" rx="5" fill={barFill}>
            <animate attributeName="width" values={`${bar};${Math.min(bar+6,88)};${bar}`} dur={`${11+i*2}s`} repeatCount="indefinite"/>
          </rect>
          <text x={v.x+8+bar+3} y={v.y+34} fill="rgba(255,255,255,0.35)" fontSize="5.5" fontFamily="monospace">{v.soc}%</text>

          {/* Power row */}
          <text x={v.x+8} y={v.y+52} fill={ac} fontSize="8" fontFamily="monospace" fontWeight="bold">{v.soc}% SOC</text>
          <text x={v.x+68} y={v.y+52} fill={v.chg?'rgba(34,197,94,0.7)':'rgba(255,255,255,0.25)'} fontSize="7.5" fontFamily="monospace">{v.kw}</text>

          {/* Status dot */}
          <circle cx={v.x+96} cy={v.y+52} r="3.5" fill={v.chg?'#22c55e':'rgba(255,255,255,0.15)'}>
            {v.chg&&<animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>}
          </circle>
        </g>;
      })}

      {/* ── Fleet aggregate footer ── */}
      <rect x="4" y="196" width="332" height="11" rx="3" fill="rgba(255,107,53,0.04)" stroke="rgba(255,107,53,0.12)" strokeWidth="0.5"/>
      {/* Aggregate charge bar */}
      <rect x="6" y="198" width="268" height="7" rx="3.5" fill="rgba(255,255,255,0.04)"/>
      <rect x="6" y="198" width="178" height="7" rx="3.5" fill="url(#fl-barHi)" opacity="0.7">
        <animate attributeName="width" values="178;190;178" dur="12s" repeatCount="indefinite"/>
      </rect>
      <text x="288" y="205" fill="rgba(255,149,0,0.55)" fontSize="6.5" fontFamily="monospace">Ø 55% SOC</text>

      {/* KI sweep beam */}
      <rect x="-6" y="0" width="5" height="210" rx="2"
        fill="rgba(255,107,53,0.18)" filter="url(#flGlow)">
        <animate attributeName="x" values="-6;341;-6" dur="5s" repeatCount="indefinite"/>
      </rect>
    </svg>
    {/* Business Leistungsbox */}
    <div style={{
      position:'absolute', right:0, top:0, width:320, maxWidth:'60vw', background:'rgba(167,139,250,0.13)',
      border:'2px solid #a78bfa', borderRadius:18, padding:'22px 28px', zIndex:10, boxShadow:'0 8px 32px #0002',
      color:'#e0e7ff', fontFamily:'monospace', fontSize:15, fontWeight:500, lineHeight:1.7
    }}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
        <span style={{fontSize:22, fontWeight:900, color:'#a78bfa'}}>Business</span>
        <span style={{fontSize:13, background:'#a78bfa22', color:'#a78bfa', borderRadius:8, padding:'2px 10px', fontWeight:700}}>49 € / Standort / Monat</span>
      </div>
      <ul style={{margin:'0 0 10px 0',padding:'0 0 0 18px'}}>
        <li>✅ <b>Alles aus Pro</b></li>
        <li>🏭 <b>Flottenmanagement</b> (unbegrenzt EVs, Standorte & Gruppen)</li>
        <li>📡 <b>KI-Dispatch & Lastspitzen-Management</b></li>
        <li>🔗 <b>API-Zugang & Webhooks</b> (REST, MQTT, OpenAPI 3.1)</li>
        <li>🔒 <b>SSO & Mandantenfähigkeit</b></li>
        <li>📋 <b>Compliance- & Audit-Reporting</b> (ISO 27001, DSGVO)</li>
        <li>🛠 <b>SLA, Alerting & dedizierter Support</b></li>
        <li>🤝 <b>OEM- & Installateurkanal</b></li>
      </ul>
      <a href="mailto:kontakt@wattai.live?subject=Business%20Anfrage" style={{
        display:'inline-block',marginTop:8,padding:'8px 22px',background:'#a78bfa',color:'#181028',borderRadius:999,fontWeight:700,fontSize:15,textDecoration:'none',boxShadow:'0 2px 12px #a78bfa55',letterSpacing:'0.04em'
      }}>Jetzt Kontakt aufnehmen</a>
    </div>
    </div>
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
                    <div style={{ padding:'8px 8px 0', opacity: 1 }}>
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
