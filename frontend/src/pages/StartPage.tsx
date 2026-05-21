/**
 * WattAI.live – High-End Landing Page v2
 * ✅ Scroll-Reveal via IntersectionObserver
 * ✅ Mouse-Parallax on Hero visual
 * ✅ 3D Card-Tilt on Module cards (CSS perspective)
 * ✅ 3D Rotating Energy Rings (CSS keyframes + perspective)
 * ✅ Floating particle background
 * ✅ Slow animated gradient orbs
 * Original fixes retained:
 *  ✅ Removed duplicate <header>/<nav> – TopNav already handles global navigation
 *  ✅ All <button> have type="button" – prevents accidental form submit
 *  ✅ All buttons wired to onNavigate / onAuthClick / onUpgradeClick props
 *  ✅ External <a> links: rel="noopener noreferrer" + target="_blank"
 *  ✅ Images: loading="lazy" + decoding="async" + meaningful alt text
 *  ✅ "Technische Details im neuen Tab" replaced – no misleading copy
 *  ✅ Progress bars: role="progressbar" + ARIA labels added
 *  ✅ Decorative elements: aria-hidden="true"
 *  ✅ Module list uses <article>, AI list uses <ul>/<li> for semantics
 *  ✅ font-sans instead of font-[Inter] (no missing @font-face)
 *  ✅ Reduced Unsplash image width to 1200px (was 2400px) – faster load
 *  ✅ No dangerouslySetInnerHTML / eval / raw user data → XSS-safe
 *  ✅ Constants extracted – no inline magic data
 */

import { useEffect, useRef, useState, useCallback, type MouseEvent } from 'react';
import type { ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type StartPageProps = {
  onNavigate: (page: 'home' | 'startseite' | 'produkte' | 'about' | 'kontakt') => void;
  onAuthClick: () => void;
  onUpgradeClick: () => void;
};

// ─── Static data (extracted from JSX for readability & testability) ──────────

const MODULES = [
  {
    title: 'PV-Optimierung',
    icon: '☀️',
    image: '/wattai.live-dashboard.png',
    description: 'Echtzeit-Ertragsprognosen, Eigenverbrauchsmaximierung und intelligente Netzeinspeisung.',
    details: 'Die KI analysiert Wettermodelle, Verbrauchsmuster und Strompreise in Echtzeit. Automatische PV-Strategien maximieren Eigenverbrauch, reduzieren Netzkosten und optimieren dynamische Einspeisung ins Smart Grid.',
    tech: 'Forecast AI • Smart Grid Sync • Dynamic Feed-In • Realtime Solar Analytics',
    glow: 'from-yellow-400/30 via-orange-500/20 to-transparent',
  },
  {
    title: 'Batteriemanagement',
    icon: '🔋',
    image: '/wattai.live-dashboard.png',
    description: 'Dynamische Lade- und Entladezyklen nach Tarif, SOC und Haushaltslast.',
    details: 'WattAI.live steuert Batteriespeicher intelligent nach Stromtarifen, Verbrauchsspitzen und Netzsignalen. Das System verlängert die Batterielebensdauer und maximiert Wirtschaftlichkeit.',
    tech: 'SOC AI Control • Dynamic Tariffs • Peak Shaving • Smart Storage Logic',
    glow: 'from-green-400/30 via-emerald-500/20 to-transparent',
  },
  {
    title: 'EV & V2H / V2G',
    icon: '🚗',
    image: '/v2h-hero.png',
    description: 'Bidirektionales Laden, intelligente Multi-EV-Profile und Echtzeitsteuerung.',
    details: 'Intelligente Ladealgorithmen koordinieren Elektrofahrzeuge, Wallboxen und bidirektionale Energieflüsse. Multi-EV-Profiles und V2G-Funktionen optimieren Lastmanagement autonom.',
    tech: 'Bidirectional Charging • Multi-EV AI • V2G Network • Smart Charging',
    glow: 'from-cyan-400/30 via-blue-500/20 to-transparent',
  },
  {
    title: 'Smart Home',
    icon: '🏠',
    image: '/wattai.live-smarthome.png',
    description: 'Wärmepumpe, Waschmaschine und Haushaltsgeräte automatisch optimieren.',
    details: 'Die Plattform verschiebt energieintensive Prozesse automatisch in günstige Zeitfenster und verbindet Smart-Home-Systeme mit Echtzeit-Energieprognosen.',
    tech: 'Home Automation • Smart Devices • Heat Pump AI • Energy Scheduling',
    glow: 'from-violet-400/30 via-purple-500/20 to-transparent',
  },
  {
    title: 'KI-Empfehlung',
    icon: '🤖',
    image: '/wattai.live-KI.png',
    description: 'Deep-Q-Network analysiert Live-Daten und liefert autonome Empfehlungen.',
    details: 'Neuronale Modelle analysieren Millionen Datenpunkte aus Wetter, Marktpreisen, Lastprofilen und Geräten. WattAI.live erzeugt intelligente Optimierungsvorschläge in Echtzeit.',
    tech: 'Deep-Q Network • Live Analytics • Autonomous Decisions • AI Optimization',
    glow: 'from-fuchsia-400/30 via-pink-500/20 to-transparent',
  },
  {
    title: 'Flottenmanagement',
    icon: '🏭',
    image: '/wattai.ive-eauto.png',
    description: 'KI-Dispatch, Lastspitzen-Management und SLA-Alerting für Business-Standorte.',
    details: 'Für Unternehmen und Ladeparks orchestriert die KI Ladepunkte, Fahrzeugflotten und Netzkapazitäten. SLA-Monitoring und Predictive Dispatching sorgen für maximale Verfügbarkeit.',
    tech: 'Fleet Dispatch AI • SLA Monitoring • Commercial Grid AI • Peak Management',
    glow: 'from-sky-400/30 via-indigo-500/20 to-transparent',
  },
] as const;

const STATS = [
  ['< 2 min', 'Einrichtungszeit'],
  ['98 %', 'Uptime SLA'],
  ['30 %', 'Ø Einsparung'],
  ['ISO 15118', 'V2G-Standard'],
  ['DSGVO', 'Datenschutz Art. 6'],
  ['4K', 'Realtime Platform'],
] as const;

const HERO_BARS = [
  { label: 'PV Output', pct: 93, cls: 'from-yellow-300 to-orange-500' },
  { label: 'Battery AI', pct: 78, cls: 'from-cyan-300 to-blue-500' },
  { label: 'EV Sync', pct: 64, cls: 'from-violet-300 to-fuchsia-500' },
] as const;

const AI_FEATURES = [
  'Live Spotmarkt-Optimierung',
  'Bidirektionale V2G-Entscheidungen',
  'Realtime Peak-Shaving',
  'Forecasting mit neuronalen Modellen',
] as const;

const PLATFORM_CARDS = [
  ['Realtime APIs', 'Open Energy Interfaces'],
  ['AI Forecasting', 'Neuronale Prognosemodelle'],
  ['4K Dashboards', 'Cinematic UI Experience'],
  ['Edge Control', 'Ultra-Low-Latency Automation'],
] as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Returns true once the element enters the viewport */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/** Tracks mouse position normalised to [-1, 1] relative to an element */
function useMouseParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width - 0.5) * 2,
      y: ((e.clientY - r.top) / r.height - 0.5) * 2,
    });
  }, []);
  const onLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);
  return { ref, pos, onMove, onLeave };
}

// ─── Small components ─────────────────────────────────────────────────────────

function RevealSection({ children, delay = 0, className = '' }: {
  children: ReactNode; delay?: number; className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(48px)',
        transition: `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 18;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -18;
    el.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg) translateY(-8px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateY(0)';
  };
  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: 'transform 0.15s ease', willChange: 'transform', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StartPage({ onNavigate, onAuthClick, onUpgradeClick }: StartPageProps) {
  const { ref: heroRef, pos, onMove: onHeroMove, onLeave: onHeroLeave } = useMouseParallax();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-[#0a1d3f] to-[#081324] text-white overflow-x-hidden font-sans">

      {/* ── Ambient background ── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Slow-moving colour orbs */}
        <div style={{ animation: 'orbFloat1 18s ease-in-out infinite' }}
          className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-[140px]" />
        <div style={{ animation: 'orbFloat2 22s ease-in-out infinite' }}
          className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[130px]" />
        <div style={{ animation: 'orbFloat3 26s ease-in-out infinite' }}
          className="absolute top-[40%] left-[45%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />

        {/* Floating particles */}
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animation: `particleDrift ${10 + (i % 14)}s linear ${(i * 1.3) % 8}s infinite`,
              opacity: 0.25 + (i % 4) * 0.1,
            }}
            className="absolute rounded-full bg-cyan-300"
          />
        ))}
      </div>

      <style>{`
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-40px) scale(1.08); }
          66%      { transform: translate(-40px,70px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-80px,50px) scale(1.12); }
          70%      { transform: translate(50px,-60px) scale(0.93); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-60px,-80px) scale(1.15); }
        }
        @keyframes particleDrift {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-180px) translateX(40px); opacity: 0; }
        }
        @keyframes ringRotate {
          from { transform: rotateX(65deg) rotateZ(0deg); }
          to   { transform: rotateX(65deg) rotateZ(360deg); }
        }
        @keyframes ringRotateReverse {
          from { transform: rotateX(65deg) rotateZ(360deg); }
          to   { transform: rotateX(65deg) rotateZ(0deg); }
        }
        @keyframes ringPulse {
          0%,100% { opacity: 0.5; }
          50%     { opacity: 1; }
        }
        @keyframes counterUp {
          from { opacity:0; transform:scale(0.7) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #67e8f9 0%, #ffffff 40%, #818cf8 60%, #67e8f9 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        onMouseMove={onHeroMove}
        onMouseLeave={onHeroLeave}
        className="relative z-10 min-h-[96vh] flex items-center px-6 lg:px-16 pt-10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left */}
          <div>
            <RevealSection delay={0}>
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 backdrop-blur-xl mb-8">
                <span aria-hidden="true" className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                <span className="text-sm text-cyan-100 tracking-wide">Next Generation Energy Intelligence</span>
              </div>
            </RevealSection>

            <RevealSection delay={80}>
              <h1 className="text-5xl lg:text-[5.5rem] font-black leading-none tracking-tight">
                Deine Energie.
                <span className="shimmer-text block mt-2">Intelligent gesteuert.</span>
              </h1>
            </RevealSection>

            <RevealSection delay={160}>
              <p className="mt-8 text-xl text-white/65 leading-relaxed max-w-2xl">
                WattAI.live verbindet PV-Anlage, Batteriespeicher, Wärmepumpe und Elektroauto zu
                einem intelligenten Energie-Ökosystem — in Echtzeit, DSGVO-konform und KI-gesteuert.
              </p>
            </RevealSection>

            <RevealSection delay={240}>
              <div className="flex flex-wrap gap-5 mt-10">
                <button type="button" onClick={() => onNavigate('home')}
                  className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 font-semibold text-lg overflow-hidden hover:scale-105 transition-transform shadow-[0_0_40px_rgba(34,211,238,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                  <span className="relative z-10">🚀 Dashboard starten</span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
                </button>
                <button type="button" onClick={() => onNavigate('produkte')}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl text-lg hover:bg-white/10 hover:border-white/40 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40">
                  Preise &amp; Pläne ansehen →
                </button>
              </div>
            </RevealSection>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
              {STATS.map(([value, label], i) => (
                <RevealSection key={label} delay={320 + i * 60}>
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 hover:border-cyan-400/40 hover:bg-cyan-500/10 transition-all duration-300">
                    <div className="text-2xl font-black text-cyan-300"
                      style={{ animation: `counterUp 0.6s ease ${400 + i * 80}ms both` }}>
                      {value}
                    </div>
                    <div className="text-white/50 mt-1 text-xs uppercase tracking-widest">{label}</div>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>

          {/* Right – 3D Parallax Visual */}
          <div className="relative h-[700px] hidden lg:block">
            {/* Parallax wrapper */}
            <div
              className="absolute inset-0"
              style={{
                transform: `perspective(1200px) rotateY(${pos.x * 5}deg) rotateX(${pos.y * -3}deg)`,
                transition: 'transform 0.08s linear',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Main card */}
              <div className="absolute inset-0 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden shadow-[0_0_120px_rgba(34,211,238,0.3)]">
                <img
                  src="/wattai.live-dashboard.png"
                  alt="KI-gesteuertes Energie-Dashboard"
                  className="w-full h-full object-cover opacity-60 scale-110"
                  loading="eager"
                  decoding="async"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-slate-950/80" />

                {/* Live energy badge – floats 3D */}
                <div
                  className="absolute top-8 left-8 px-5 py-4 rounded-2xl bg-slate-900/45 backdrop-blur-xl border border-cyan-300/40"
                  style={{ transform: 'translateZ(40px)' }}
                >
                  <p className="text-xs text-cyan-300 uppercase tracking-widest">Live Energy Flow</p>
                  <p className="text-4xl font-black mt-1 text-white">+48.7 kW</p>
                </div>

                {/* Progress card – floats deeper */}
                <div
                  className="absolute bottom-8 right-8 w-72 rounded-3xl border border-cyan-200/20 bg-slate-900/55 backdrop-blur-xl p-6"
                  style={{ transform: 'translateZ(60px)' }}
                >
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-white/60 text-sm">Grid AI</span>
                    <span className="text-emerald-300 text-sm font-medium">● Optimized</span>
                  </div>
                  <div className="space-y-4">
                    {HERO_BARS.map(({ label, pct, cls }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-white/50">{label}</span>
                          <span className="font-medium">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden"
                          role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
                          <div className={`h-full bg-gradient-to-r ${cls} rounded-full`}
                            style={{ width: `${pct}%`, transition: 'width 1.5s ease 0.5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3D Energy rings */}
              <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
                <div style={{ width: 380, height: 380, position: 'relative', transformStyle: 'preserve-3d' }}>
                  {[
                    { size: 380, dur: '8s', color: 'rgba(34,211,238,0.25)', rev: false },
                    { size: 300, dur: '12s', color: 'rgba(139,92,246,0.2)', rev: true },
                    { size: 220, dur: '6s', color: 'rgba(34,211,238,0.15)', rev: false },
                  ].map(({ size, dur, color, rev }, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: '50%', left: '50%',
                      width: size, height: size,
                      marginTop: -size / 2, marginLeft: -size / 2,
                      border: `1px solid ${color}`,
                      borderRadius: '50%',
                      animation: `${rev ? 'ringRotateReverse' : 'ringRotate'} ${dur} linear infinite, ringPulse 3s ease-in-out ${i * 1}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Glow halos outside the card */}
            <div aria-hidden="true" className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyan-500/20 blur-[140px] pointer-events-none" />
            <div aria-hidden="true" className="absolute -bottom-28 -left-16 w-96 h-96 rounded-full bg-violet-500/20 blur-[130px] pointer-events-none" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs uppercase tracking-[0.4em] text-white">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white to-transparent animate-pulse" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MODULE GRID
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 px-6 lg:px-16 py-32">
        <div className="max-w-7xl mx-auto">
          <RevealSection className="mb-20">
            <div className="flex flex-col lg:flex-row justify-between gap-10 items-end">
              <div>
                <p className="uppercase tracking-[0.4em] text-cyan-300 text-sm mb-4">Alles in einem System</p>
                <h2 className="text-5xl lg:text-7xl font-black leading-tight">
                  High-End Energie-<br />und Lademanagement
                </h2>
              </div>
              <p className="max-w-xl text-white/55 text-lg leading-relaxed">
                Modulare KI-Architektur und Glassmorphism-Oberflächen für moderne Smart-Energy-Systeme.
              </p>
            </div>
          </RevealSection>

          <div className="grid lg:grid-cols-3 gap-8">
            {MODULES.map((mod, i) => (
              <RevealSection key={mod.title} delay={i * 80}>
                <TiltCard className="h-full">
                  <article className="group relative rounded-[2rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl h-full"
                    style={{ transformStyle: 'preserve-3d' }}>
                    <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${mod.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img src={mod.image} alt={`${mod.title} – Visualisierung`}
                        className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                        loading="lazy" decoding="async" />
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      {/* Icon floats in 3D */}
                      <div aria-hidden="true"
                        className="absolute top-5 left-5 text-3xl backdrop-blur-xl rounded-2xl bg-black/40 w-14 h-14 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300"
                        style={{ transform: 'translateZ(20px)' }}>
                        {mod.icon}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="relative p-7" style={{ transform: 'translateZ(10px)' }}>
                      <h3 className="text-xl font-black mb-2">{mod.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{mod.description}</p>
                      <p className="mt-3 text-white/40 text-xs leading-relaxed border-l border-cyan-400/30 pl-3">
                        {mod.details}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {mod.tech.split(' • ').map((item) => (
                          <span key={item} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] tracking-wide text-cyan-200">
                            {item}
                          </span>
                        ))}
                      </div>
                      <button type="button" onClick={() => onNavigate('produkte')}
                        className="mt-5 inline-flex items-center gap-2 text-cyan-300 text-sm font-medium group-hover:gap-4 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded">
                        Mehr erfahren <span aria-hidden="true">→</span>
                      </button>
                    </div>

                    {/* Shine overlay on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)' }} />
                  </article>
                </TiltCard>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          AI ENGINE
      ══════════════════════════════════════════════════════════ */}
      <section id="ai" className="relative z-10 px-6 lg:px-16 py-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">

          {/* 3D visual */}
          <RevealSection delay={0}>
            <div className="relative rounded-[3rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl min-h-[540px]"
              style={{ perspective: 1000 }}>
              <img src="/wattai.live-KI.png"
                alt="Neuronales KI-Netz Visualisierung"
                className="absolute inset-0 w-full h-full object-cover opacity-50" loading="lazy" decoding="async" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-black/40 to-violet-600/30" />

              {/* Concentric 3D rings */}
              <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
                {[280, 200, 130].map((size, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    width: size, height: size,
                    borderRadius: '50%',
                    border: `1px solid rgba(34,211,238,${0.15 + i * 0.1})`,
                    animation: `${i % 2 === 0 ? 'ringRotate' : 'ringRotateReverse'} ${9 + i * 4}s linear infinite`,
                    boxShadow: `0 0 ${20 + i * 15}px rgba(34,211,238,${0.08 + i * 0.05})`,
                  }} />
                ))}
                <div className="w-16 h-16 rounded-full bg-cyan-400/30 backdrop-blur-2xl border border-cyan-300/40 flex items-center justify-center"
                  style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                  <div className="w-6 h-6 rounded-full bg-cyan-300" />
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-black/50 backdrop-blur-2xl p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-cyan-300 uppercase tracking-[0.3em] text-xs">AI Core Engine</p>
                    <h3 className="text-2xl font-black mt-1">Deep-Q Neural Optimization</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-cyan-300">4.2ms</div>
                    <p className="text-white/50 text-xs mt-1">Decision Latency</p>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>

          {/* Text */}
          <RevealSection delay={150}>
            <p className="uppercase tracking-[0.4em] text-violet-300 text-sm mb-5">KI-Gesteuerte Entscheidungen</p>
            <h2 className="text-5xl lg:text-6xl font-black leading-tight">
              Realtime AI<br />Energy Brain
            </h2>
            <p className="mt-8 text-lg text-white/60 leading-relaxed">
              Die WattAI.live Engine analysiert Wetterdaten, Strompreise, Verbrauchsmuster und
              Netzsignale in Echtzeit. Autonome Entscheidungen für maximale Effizienz.
            </p>
            <ul className="mt-10 space-y-3" aria-label="KI-Funktionen">
              {AI_FEATURES.map((item, i) => (
                <li key={item}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 hover:border-cyan-400/30 hover:bg-cyan-500/5 transition-all duration-300"
                  style={{ animation: `counterUp 0.5s ease ${i * 80 + 200}ms both` }}>
                  <span aria-hidden="true" className="w-3 h-3 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </RevealSection>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PLATFORM
      ══════════════════════════════════════════════════════════ */}
      <section id="platform" className="relative z-10 px-6 lg:px-16 py-32">
        <RevealSection>
          <div className="max-w-7xl mx-auto rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl p-10 lg:p-14 overflow-hidden relative">
            <div aria-hidden="true" className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyan-500/10 blur-[160px]" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="uppercase tracking-[0.4em] text-cyan-300 text-sm mb-5">Future Ready Infrastructure</p>
                <h2 className="text-5xl lg:text-6xl font-black leading-tight">
                  Eine Plattform.<br />Volle Kontrolle.
                </h2>
                <p className="mt-8 text-lg text-white/60 leading-relaxed max-w-2xl">
                  API-first Architektur, 3D-Dashboards, KI-Automationen und enterprisefähige Skalierung.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {PLATFORM_CARDS.map(([title, desc], i) => (
                  <TiltCard key={title}>
                    <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 min-h-[170px] flex flex-col justify-between hover:border-cyan-400/30 hover:bg-cyan-500/5 transition-all duration-300"
                      style={{ animation: `counterUp 0.5s ease ${i * 100}ms both` }}>
                      <div aria-hidden="true" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 opacity-80" />
                      <div>
                        <h3 className="text-lg font-black mb-1">{title}</h3>
                        <p className="text-white/50 text-sm">{desc}</p>
                      </div>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 lg:px-16 py-24">
        <RevealSection>
          <div className="max-w-7xl mx-auto rounded-[3rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 backdrop-blur-3xl p-10 lg:p-14 relative overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_40%)]" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
              <div>
                <p className="uppercase tracking-[0.4em] text-cyan-300 text-sm mb-5">Kostenlos starten</p>
                <h2 className="text-4xl lg:text-5xl font-black leading-tight max-w-2xl">
                  Jetzt upgraden,<br />wenn du bereit bist.
                </h2>
                <p className="mt-6 text-white/60 text-lg max-w-xl leading-relaxed">
                  Kein Abo-Zwang, keine Kreditkarte nötig. Einfach registrieren und loslegen.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 shrink-0">
                <button type="button" onClick={onAuthClick}
                  className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold text-lg overflow-hidden hover:scale-105 transition-transform shadow-[0_0_60px_rgba(34,211,238,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                  <span className="relative z-10">🔐 Kostenlos registrieren</span>
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
                </button>
                <button type="button" onClick={onUpgradeClick}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl text-lg hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40">
                  ⚡ Pläne vergleichen
                </button>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER STRIP
      ══════════════════════════════════════════════════════════ */}
      <footer id="contact" className="relative z-10 px-6 lg:px-16 py-20 border-t border-white/10">
        <RevealSection>
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-10 items-start lg:items-center">
            <div>
              <p className="text-3xl font-black shimmer-text" style={{ WebkitTextFillColor: undefined }}>WattAI.live</p>
              <p className="text-white/45 mt-3 max-w-xl text-sm">
                High-End KI-Plattform für Energie-, Lade- und Smart-Grid-Management.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={onAuthClick}
                className="px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
                Enterprise Demo
              </button>
              <button type="button" onClick={() => onNavigate('kontakt')}
                className="px-6 py-3 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40">
                Kontakt aufnehmen
              </button>
            </div>
          </div>
        </RevealSection>
      </footer>
    </div>
  );
}
