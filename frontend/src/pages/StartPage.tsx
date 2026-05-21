/**
 * WattAI.live – High-End Landing Page
 *
 * Security & quality fixes applied vs. original Codex draft:
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
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=1200&auto=format&fit=crop',
    description: 'Echtzeit-Ertragsprognosen, Eigenverbrauchsmaximierung und intelligente Netzeinspeisung.',
    details: 'Die KI analysiert Wettermodelle, Verbrauchsmuster und Strompreise in Echtzeit. Automatische PV-Strategien maximieren Eigenverbrauch, reduzieren Netzkosten und optimieren dynamische Einspeisung ins Smart Grid.',
    tech: 'Forecast AI • Smart Grid Sync • Dynamic Feed-In • Realtime Solar Analytics',
    glow: 'from-yellow-400/30 via-orange-500/20 to-transparent',
  },
  {
    title: 'Batteriemanagement',
    icon: '🔋',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1200&auto=format&fit=crop',
    description: 'Dynamische Lade- und Entladezyklen nach Tarif, SOC und Haushaltslast.',
    details: 'WattAI.live steuert Batteriespeicher intelligent nach Stromtarifen, Verbrauchsspitzen und Netzsignalen. Das System verlängert die Batterielebensdauer und maximiert Wirtschaftlichkeit.',
    tech: 'SOC AI Control • Dynamic Tariffs • Peak Shaving • Smart Storage Logic',
    glow: 'from-green-400/30 via-emerald-500/20 to-transparent',
  },
  {
    title: 'EV & V2H / V2G',
    icon: '🚗',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?q=80&w=1200&auto=format&fit=crop',
    description: 'Bidirektionales Laden, intelligente Multi-EV-Profile und Echtzeitsteuerung.',
    details: 'Intelligente Ladealgorithmen koordinieren Elektrofahrzeuge, Wallboxen und bidirektionale Energieflüsse. Multi-EV-Profiles und V2G-Funktionen optimieren Lastmanagement autonom.',
    tech: 'Bidirectional Charging • Multi-EV AI • V2G Network • Smart Charging',
    glow: 'from-cyan-400/30 via-blue-500/20 to-transparent',
  },
  {
    title: 'Smart Home',
    icon: '🏠',
    image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1200&auto=format&fit=crop',
    description: 'Wärmepumpe, Waschmaschine und Haushaltsgeräte automatisch optimieren.',
    details: 'Die Plattform verschiebt energieintensive Prozesse automatisch in günstige Zeitfenster und verbindet Smart-Home-Systeme mit Echtzeit-Energieprognosen.',
    tech: 'Home Automation • Smart Devices • Heat Pump AI • Energy Scheduling',
    glow: 'from-violet-400/30 via-purple-500/20 to-transparent',
  },
  {
    title: 'KI-Empfehlung',
    icon: '🤖',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
    description: 'Deep-Q-Network analysiert Live-Daten und liefert autonome Empfehlungen.',
    details: 'Neuronale Modelle analysieren Millionen Datenpunkte aus Wetter, Marktpreisen, Lastprofilen und Geräten. WattAI.live erzeugt intelligente Optimierungsvorschläge in Echtzeit.',
    tech: 'Deep-Q Network • Live Analytics • Autonomous Decisions • AI Optimization',
    glow: 'from-fuchsia-400/30 via-pink-500/20 to-transparent',
  },
  {
    title: 'Flottenmanagement',
    icon: '🏭',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function StartPage({ onNavigate, onAuthClick, onUpgradeClick }: StartPageProps) {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden font-sans">

      {/* Background radial gradients – decorative, no content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(29,78,216,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.25),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.2),transparent_30%)]"
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-[88vh] flex items-center px-6 lg:px-16 overflow-hidden pt-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center w-full">

          {/* Left column */}
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 backdrop-blur-xl mb-8">
              <span aria-hidden="true" className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
              <span className="text-sm text-cyan-100 tracking-wide">
                Next Generation Energy Intelligence
              </span>
            </div>

            <h1 className="text-5xl lg:text-8xl font-black leading-none tracking-tight">
              Deine Energie.
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 text-transparent bg-clip-text block mt-2">
                Intelligent gesteuert.
              </span>
            </h1>

            <p className="mt-8 text-xl text-white/70 leading-relaxed max-w-2xl">
              WattAI.live verbindet PV-Anlage, Batteriespeicher, Wärmepumpe und
              Elektroauto zu einem intelligenten Energie-Ökosystem — in Echtzeit,
              DSGVO-konform, KI-gesteuert und planbasiert.
            </p>

            <div className="flex flex-wrap gap-5 mt-10">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 font-semibold text-lg shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                🚀 Dashboard starten
              </button>

              <button
                type="button"
                onClick={() => onNavigate('produkte')}
                className="px-8 py-4 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl text-lg hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
              >
                Preise &amp; Pläne ansehen →
              </button>
            </div>

            {/* KPI stats */}
            <div className="mt-16 grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-3xl">
              {STATS.map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
                >
                  <div className="text-3xl font-black">{value}</div>
                  <div className="text-white/50 mt-1 text-sm">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column – live dashboard visual */}
          <div className="relative h-[680px] hidden lg:block">
            <div className="absolute inset-0 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-3xl overflow-hidden shadow-[0_0_120px_rgba(34,211,238,0.25)]">
              <img
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop"
                alt="KI-gesteuertes Energie-Dashboard"
                className="w-full h-full object-cover opacity-70 scale-110"
                loading="lazy"
                decoding="async"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/70" />

              {/* Live label overlay */}
              <div className="absolute top-8 left-8 px-5 py-4 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
                <p className="text-sm text-cyan-300">Live Energy Flow</p>
                <p className="text-4xl font-black mt-2">+48.7 kW</p>
              </div>

              {/* Mini progress-bar card */}
              <div className="absolute bottom-8 right-8 w-72 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">
                <div className="flex justify-between items-center mb-5">
                  <span className="text-white/60 text-sm">Grid AI</span>
                  <span className="text-emerald-300 text-sm">Optimized</span>
                </div>
                <div className="space-y-4">
                  {HERO_BARS.map(({ label, pct, cls }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-white/50">{label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div
                        className="h-2 rounded-full bg-white/10 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={label}
                      >
                        <div
                          className={`h-full bg-gradient-to-r ${cls} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Glow blobs */}
            <div aria-hidden="true" className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-cyan-500/20 blur-[120px]" />
            <div aria-hidden="true" className="absolute -bottom-24 -left-12 w-80 h-80 rounded-full bg-violet-500/20 blur-[120px]" />
          </div>
        </div>
      </section>

      {/* ── Module Grid ──────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 lg:px-16 py-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between gap-10 items-end mb-20">
            <div>
              <p className="uppercase tracking-[0.4em] text-cyan-300 text-sm mb-4">
                Alles in einem System
              </p>
              <h2 className="text-5xl lg:text-7xl font-black leading-tight">
                High-End Energie-
                <br />
                und Lademanagement
              </h2>
            </div>
            <p className="max-w-xl text-white/60 text-lg leading-relaxed">
              Realtime Glassmorphism-Oberflächen und modulare KI-Architektur für
              moderne Smart-Energy-Systeme.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {MODULES.map((mod) => (
              <article
                key={mod.title}
                className="group relative rounded-[2rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl hover:-translate-y-3 transition-all duration-500"
              >
                <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${mod.glow}`} />

                {/* Module image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={mod.image}
                    alt={`${mod.title} – Visualisierung`}
                    className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div aria-hidden="true" className="absolute top-5 left-5 text-3xl backdrop-blur-xl rounded-2xl bg-black/30 w-14 h-14 flex items-center justify-center border border-white/10">
                    {mod.icon}
                  </div>
                </div>

                {/* Module body */}
                <div className="relative p-8">
                  <h3 className="text-2xl font-black mb-3">{mod.title}</h3>
                  <p className="text-white/65 leading-relaxed">{mod.description}</p>
                  <p className="mt-4 text-white/45 leading-relaxed text-sm border-l border-cyan-400/30 pl-4">
                    {mod.details}
                  </p>

                  {/* Tech tags */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {mod.tech.split(' • ').map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs tracking-wide text-cyan-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* CTA – navigates to Produkte (no misleading "neuen Tab" copy) */}
                  <button
                    type="button"
                    onClick={() => onNavigate('produkte')}
                    className="mt-6 inline-flex items-center gap-3 text-cyan-300 font-medium hover:gap-5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 rounded"
                  >
                    Mehr erfahren
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Engine ────────────────────────────────────────────────────── */}
      <section id="ai" className="relative z-10 px-6 lg:px-16 py-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">

          {/* Visual */}
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl min-h-[560px]">
            <img
              src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop"
              alt="Neuronales KI-Netz Visualisierung"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              loading="lazy"
              decoding="async"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-black/30 to-violet-600/30" />
            <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-56 rounded-full border border-cyan-300/20 bg-cyan-400/10 backdrop-blur-2xl animate-pulse" />
            </div>
            <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-2xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-cyan-300 uppercase tracking-[0.3em] text-xs">AI Core Engine</p>
                  <h3 className="text-2xl font-black mt-2">Deep-Q Neural Optimization</h3>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-cyan-300">4.2ms</div>
                  <p className="text-white/50 text-sm mt-1">Decision Latency</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="uppercase tracking-[0.4em] text-violet-300 text-sm mb-5">
              KI-Gesteuerte Entscheidungen
            </p>
            <h2 className="text-5xl lg:text-6xl font-black leading-tight">
              Realtime AI
              <br />
              Energy Brain
            </h2>
            <p className="mt-8 text-lg text-white/65 leading-relaxed">
              Die WattAI.live Engine analysiert Wetterdaten, Strompreise,
              Verbrauchsmuster und Netzsignale in Echtzeit. Das System trifft
              autonome Entscheidungen zur Optimierung von Energiefluss, Speicherung
              und Ladezyklen.
            </p>
            <ul className="mt-10 space-y-4" aria-label="KI-Funktionen">
              {AI_FEATURES.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4"
                >
                  <span aria-hidden="true" className="w-3 h-3 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Platform ─────────────────────────────────────────────────────── */}
      <section id="platform" className="relative z-10 px-6 lg:px-16 py-32">
        <div className="max-w-7xl mx-auto rounded-[3rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl p-10 lg:p-14 overflow-hidden relative">
          <div aria-hidden="true" className="absolute top-0 right-0 w-96 h-96 rounded-full bg-cyan-500/10 blur-[150px]" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="uppercase tracking-[0.4em] text-cyan-300 text-sm mb-5">
                Future Ready Infrastructure
              </p>
              <h2 className="text-5xl lg:text-6xl font-black leading-tight">
                Eine Plattform.
                <br />
                Volle Kontrolle.
              </h2>
              <p className="mt-8 text-lg text-white/65 leading-relaxed max-w-2xl">
                Entwickelt für moderne Energy-Stacks mit API-first Architektur,
                3D-Dashboards, KI-Automationen und enterprisefähiger Skalierung.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {PLATFORM_CARDS.map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 min-h-[180px] flex flex-col justify-between hover:scale-[1.03] transition-transform"
                >
                  <div aria-hidden="true" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 to-violet-500 opacity-80" />
                  <div>
                    <h3 className="text-xl font-black mb-2">{title}</h3>
                    <p className="text-white/55 text-sm">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 lg:px-16 py-24">
        <div className="max-w-7xl mx-auto rounded-[3rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 backdrop-blur-3xl p-10 lg:p-14 relative overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%)]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div>
              <p className="uppercase tracking-[0.4em] text-cyan-300 text-sm mb-5">
                Kostenlos starten
              </p>
              <h2 className="text-4xl lg:text-5xl font-black leading-tight max-w-2xl">
                Jetzt upgraden,
                <br />
                wenn du bereit bist.
              </h2>
              <p className="mt-6 text-white/65 text-lg max-w-xl leading-relaxed">
                Kein Abo-Zwang, keine Kreditkarte nötig. Einfach registrieren,
                WattAI.live verbinden und deine Energie intelligent steuern.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 shrink-0">
              <button
                type="button"
                onClick={onAuthClick}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold text-lg shadow-[0_0_60px_rgba(34,211,238,0.35)] hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                🔐 Kostenlos registrieren
              </button>

              <button
                type="button"
                onClick={onUpgradeClick}
                className="px-8 py-4 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl text-lg hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
              >
                ⚡ Pläne vergleichen
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer contact strip ──────────────────────────────────────────── */}
      <footer
        id="contact"
        className="relative z-10 px-6 lg:px-16 py-20 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-10 items-start lg:items-center">
          <div>
            <p className="text-3xl font-black">WattAI.live</p>
            <p className="text-white/50 mt-3 max-w-xl text-sm">
              High-End KI-Plattform für Energie-, Lade- und Smart-Grid-Management.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onAuthClick}
              className="px-6 py-3 rounded-2xl bg-white text-black font-semibold hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              Enterprise Demo
            </button>

            <button
              type="button"
              onClick={() => onNavigate('kontakt')}
              className="px-6 py-3 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
            >
              Kontakt aufnehmen
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
