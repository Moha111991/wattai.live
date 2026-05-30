import { useEffect, useRef, useState, type ReactNode } from 'react';

// ── Shared CSS ───────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes th-shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
  @keyframes th-breathe{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.12)}}
  @keyframes th-scan{0%{top:-2px}100%{top:102%}}
  @keyframes th-scan-h{0%{left:-30%}100%{left:130%}}
  @keyframes th-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes th-spin-r{from{transform:rotate(360deg)}to{transform:rotate(0deg)}}
  @keyframes th-drift{0%,100%{transform:translateY(0) translateX(0)}40%{transform:translateY(-18px) translateX(10px)}70%{transform:translateY(8px) translateX(-6px)}}
  @keyframes th-fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes th-fade-right{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes th-pulse-green{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.45)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}}
  @keyframes th-pulse-red{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.45)}70%{box-shadow:0 0 0 7px rgba(239,68,68,0)}}
  @keyframes th-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  @keyframes th-glow{0%,100%{opacity:.6}50%{opacity:1}}
  @keyframes th-count{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

  .th-stat-card{transition:all .35s cubic-bezier(.16,1,.3,1)!important;cursor:default}
  .th-stat-card:hover{transform:translateY(-4px) scale(1.04)!important;z-index:2}
  .th-tag{transition:all .3s ease!important}
  .th-tag:hover{transform:translateY(-2px)!important;opacity:.85!important}
  .th-visual{transition:transform .1s ease-out!important}

  @media(max-width:640px){
    .th-root{
      display:flex!important; flex-direction:column!important;
      min-height:auto!important; margin-bottom:16px!important;
    }
    .th-visual{
      position:relative!important; display:block!important;
      width:100%!important; height:150px!important;
      top:auto!important; bottom:auto!important; right:auto!important;
      opacity:0.85!important; order:-1;
    }
    .th-left{
      max-width:100%!important;
      padding:8px 12px 10px!important;
      gap:6px!important;
    }
    .th-left h1{ font-size:clamp(17px,5vw,24px)!important; line-height:1.1!important }
    .th-left p{ font-size:10px!important; line-height:1.5!important;
      display:-webkit-box!important; -webkit-line-clamp:2!important;
      -webkit-box-orient:vertical!important; overflow:hidden!important }
    .th-tags{ gap:4px!important; margin-top:0!important }
    .th-tag{ font-size:8px!important; padding:2px 6px!important }
    .th-stats{ gap:5px!important; margin-top:0!important }
    .th-stat-card{
      padding:4px 7px!important; min-width:50px!important;
      border-radius:8px!important;
    }
    .th-stat-icon{ font-size:10px!important; margin-bottom:1px!important }
    .th-stat-label{ font-size:7px!important }
    .th-stat-value{ font-size:12px!important }
    .th-stat-dot{ width:3px!important; height:3px!important; margin-top:3px!important }
  }
  @media(max-width:400px){
    .th-visual{ height:120px!important }
    .th-left{ padding:6px 10px 8px!important }
    .th-left p{ display:none!important }
    .th-orbit{ display:none!important }
    .th-tags{ display:none!important }
  }
`;

export type WsStatus = 'live' | 'connecting' | 'offline';

export interface StatCard {
  label: string;
  value: string;
  unit?: string;
  color: string;
  icon?: string;
}

export interface TabHeaderProps {
  badge: string;
  title: [string, string] | string;       // two-line or single-line title
  subtitle: string;
  accentColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  tags?: [string, string][];               // [label, color]
  stats?: StatCard[];
  visual: ReactNode;
  wsStatus?: WsStatus;
  ticker?: { label: string; value: string; color: string }[];
}

// ── Sub-components ───────────────────────────────────────────────────────────

function WsStatusBadge({ status }: { status: WsStatus }) {
  const map = {
    live:       { color: '#22c55e', label: 'Live', anim: 'th-pulse-green' },
    connecting: { color: '#ff9500', label: 'Verbinde…', anim: '' },
    offline:    { color: '#ef4444', label: 'Offline', anim: 'th-pulse-red' },
  }[status];

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      background: `${map.color}10`, border: `1px solid ${map.color}35`,
      borderRadius: 999, padding: '5px 14px',
    }}>
      {status === 'connecting' ? (
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          border: `1.5px solid ${map.color}`, borderTopColor: 'transparent',
          animation: 'th-spin .7s linear infinite' }} />
      ) : (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: map.color,
          display: 'inline-block', animation: `${map.anim} 2s ease-in-out infinite` }} />
      )}
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: map.color }}>
        {map.label}
      </span>
    </div>
  );
}

function Ticker({ items }: { items: { label: string; value: string; color: string }[] }) {
  const doubled = [...items, ...items]; // seamless loop
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden',
      display: 'flex', alignItems: 'center', zIndex: 4,
    }}>
      <div style={{
        display: 'flex', gap: 0, whiteSpace: 'nowrap',
        animation: `th-ticker ${items.length * 6}s linear infinite`,
        willChange: 'transform',
      }}>
        {doubled.map((item, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0 28px', borderRight: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.color,
              display: 'inline-block', animation: 'th-glow 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, color: 'rgba(248,250,252,0.4)', fontFamily: 'monospace' }}>
              {item.label}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>
              {item.value}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function TabHeader({
  badge, title, subtitle,
  accentColor = '#ff6b35',
  gradientFrom = '#ff6b35',
  gradientTo = '#3b82f6',
  tags = [],
  stats = [],
  visual,
  wsStatus,
  ticker = [],
}: TabHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };
  const handleMouseLeave = () => setMouse({ x: 0.5, y: 0.5 });

  const parallaxX = (mouse.x - 0.5) * -18;
  const parallaxY = (mouse.y - 0.5) * -10;

  const titleLines = Array.isArray(title) ? title : [title];
  const hasTicker = ticker.length > 0;

  return (
    <>
      <style>{STYLES}</style>
      <div
        ref={containerRef}
        className="th-root"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative', width: '100%',
          minHeight: `clamp(${hasTicker ? '220px' : '190px'}, 28vw, ${hasTicker ? '400px' : '360px'})`,
          overflow: 'hidden', marginBottom: 32,
          background: 'linear-gradient(160deg,#020617 0%,#050d1a 60%,#040810 100%)',
          borderBottom: `1px solid ${accentColor}18`,
          paddingBottom: hasTicker ? 36 : 0,
        }}
      >
        {/* ── Top gradient bar ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 5,
          background: `linear-gradient(90deg,${gradientFrom},${accentColor},${gradientTo})`,
        }} />

        {/* ── Ambient glow orbs ── */}
        <div style={{
          position: 'absolute', top: '-35%', left: '-8%', width: '52%', height: '180%',
          borderRadius: '50%', pointerEvents: 'none',
          background: `radial-gradient(circle,${accentColor}14,transparent 65%)`,
          transform: `translate(${(mouse.x - 0.5) * 12}px,${(mouse.y - 0.5) * 8}px)`,
          transition: 'transform .4s ease-out',
        }} />
        <div style={{
          position: 'absolute', top: '-35%', right: '-8%', width: '42%', height: '180%',
          borderRadius: '50%', pointerEvents: 'none',
          background: `radial-gradient(circle,${gradientTo}12,transparent 65%)`,
          transform: `translate(${(mouse.x - 0.5) * -8}px,${(mouse.y - 0.5) * 6}px)`,
          transition: 'transform .4s ease-out',
        }} />

        {/* ── Scan line ── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1, zIndex: 2, pointerEvents: 'none',
          background: `linear-gradient(90deg,transparent,${accentColor}22,transparent)`,
          animation: 'th-scan 18s linear infinite',
        }} />
        {/* ── Horizontal shimmer on visual hover ── */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '18%', zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)',
          animation: 'th-scan-h 9s ease-in-out infinite',
        }} />

        {/* ── Floating micro-dots ── */}
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            position: 'absolute', width: 2, height: 2, borderRadius: '50%', pointerEvents: 'none',
            left: `${(i * 47 + 7) % 100}%`, top: `${(i * 61 + 11) % 100}%`,
            background: i % 2 === 0 ? accentColor : gradientTo,
            animation: `th-drift ${28 + (i % 4) * 5}s ease-in-out ${i * 2.1}s infinite`,
            opacity: 0.18,
          }} />
        ))}

        {/* ── Spinning orbit rings ── */}
        <div aria-hidden="true" className="th-orbit" style={{
          position: 'absolute', zIndex: 1, top: '50%', left: '50%',
          width: 500, height: 500, marginTop: -250, marginLeft: -250,
          borderRadius: '50%', border: `1px solid ${accentColor}06`,
          animation: 'th-spin 80s linear infinite', pointerEvents: 'none',
        }} />
        <div aria-hidden="true" className="th-orbit" style={{
          position: 'absolute', zIndex: 1, top: '50%', left: '50%',
          width: 360, height: 360, marginTop: -180, marginLeft: -180,
          borderRadius: '50%', border: `1px solid ${gradientTo}05`,
          animation: 'th-spin-r 55s linear infinite', pointerEvents: 'none',
        }} />

        {/* ── Visual (right side, parallax) ── */}
        <div
          ref={visualRef}
          className="th-visual"
          style={{
            position: 'absolute', right: 0, top: 0, bottom: hasTicker ? 36 : 0,
            width: '60%', opacity: mounted ? 0.9 : 0,
            transform: `translate(${parallaxX}px,${parallaxY}px)`,
            transition: 'opacity .8s ease, transform .12s ease-out',
          }}
        >
          {visual}
        </div>

        {/* ── Left content ── */}
        <div className="th-left" style={{
          position: 'relative', zIndex: 3,
          padding: 'clamp(28px,4vw,52px) clamp(20px,3vw,48px)',
          display: 'flex', flexDirection: 'column', gap: 14,
          maxWidth: 'clamp(280px,48%,560px)',
        }}>
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Main badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: `${accentColor}0d`, border: `1px solid ${accentColor}30`,
              borderRadius: 999, padding: '6px 16px', backdropFilter: 'blur(12px)',
              opacity: mounted ? 1 : 0,
              animation: mounted ? 'th-fade-up .5s ease forwards' : 'none',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: accentColor,
                boxShadow: `0 0 8px ${accentColor}99`, display: 'inline-block',
                animation: 'th-breathe 4s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 10, color: `${accentColor}ee`, letterSpacing: '0.15em',
                textTransform: 'uppercase', fontWeight: 700 }}>{badge}</span>
            </div>
            {/* WS status */}
            {wsStatus && <WsStatusBadge status={wsStatus} />}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(26px,3.8vw,54px)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0,
            background: `linear-gradient(135deg,#fff5f0 0%,${accentColor} 38%,${gradientFrom} 62%,${gradientTo} 100%)`,
            backgroundSize: '300% auto', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            animation: 'th-shimmer 9s linear infinite',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'none' : 'translateY(14px)',
            transition: 'opacity .6s .1s ease, transform .6s .1s ease',
          }}>
            {titleLines.map((line, i) => (
              <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>
            ))}
          </h1>

          {/* Subtitle */}
          <p style={{
            margin: 0, fontSize: 'clamp(12px,1.4vw,15px)',
            color: 'rgba(248,250,252,0.48)', lineHeight: 1.8,
            opacity: mounted ? 1 : 0,
            transition: 'opacity .6s .2s ease',
          }}>
            {subtitle}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="th-tags" style={{
              display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4,
              opacity: mounted ? 1 : 0, transition: 'opacity .6s .3s ease',
            }}>
              {tags.map(([label, color]) => (
                <span key={label} className="th-tag" style={{
                  fontSize: 11, fontFamily: 'monospace', fontWeight: 600,
                  color, background: `${color}12`, border: `1px solid ${color}30`,
                  borderRadius: 999, padding: '4px 12px', cursor: 'default',
                }}>
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Stat cards */}
          {stats.length > 0 && (
            <div className="th-stats" style={{
              display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6,
              opacity: mounted ? 1 : 0, transition: 'opacity .6s .4s ease',
            }}>
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="th-stat-card"
                  onMouseEnter={() => setHoveredStat(i)}
                  onMouseLeave={() => setHoveredStat(null)}
                  style={{
                    background: hoveredStat === i ? `${s.color}14` : `${s.color}08`,
                    border: `1px solid ${hoveredStat === i ? s.color + '50' : s.color + '22'}`,
                    borderRadius: 12, padding: '9px 14px', minWidth: 76,
                    boxShadow: hoveredStat === i ? `0 8px 24px ${s.color}18` : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {hoveredStat === i && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg,transparent,${s.color},transparent)`,
                    }} />
                  )}
                  {s.icon && (
                    <div className="th-stat-icon" style={{ fontSize: 14, marginBottom: 3 }}>{s.icon}</div>
                  )}
                  <div className="th-stat-label" style={{ fontSize: 9, color: `${s.color}80`, letterSpacing: '0.14em',
                    textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
                  <div className="th-stat-value" style={{ fontSize: 17, fontWeight: 800, color: s.color,
                    fontFamily: 'monospace', lineHeight: 1 }}>
                    {s.value}
                    {s.unit && (
                      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.7,
                        marginLeft: 3 }}>{s.unit}</span>
                    )}
                  </div>
                  <div className="th-stat-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: s.color,
                    marginTop: 5, animation: 'th-breathe 3s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Bottom ticker ── */}
        {hasTicker && <Ticker items={ticker} />}
      </div>
    </>
  );
}
