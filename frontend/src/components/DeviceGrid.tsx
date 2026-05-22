import React, { useEffect, useRef } from "react";

interface Device {
  id: string;
  type: string;
  brand: string;
  enabled: boolean;
  ip: string;
  status: string;
  manufacturer?: string;
  model?: string;
  soc?: number;
  power_kw?: number;
}

interface DeviceGridProps {
  devices: Device[];
  onConnect?: (device: Device) => void;
}

const WAI = `
  @keyframes wai-breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
  @keyframes wai-shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
  @keyframes wai-scan{0%{top:0}100%{top:100%}}
  @keyframes wai-glow-o{0%,100%{box-shadow:0 0 18px rgba(255,107,53,.3)}50%{box-shadow:0 0 48px rgba(255,107,53,.7)}}
  @keyframes wai-spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes wai-pulse-bar{0%,100%{opacity:.7}50%{opacity:1}}
  @keyframes wai-energy-flow{0%{stroke-dashoffset:60}100%{stroke-dashoffset:0}}
  @keyframes wai-ring-ping{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
  .wai-dcard{transition:border-color .5s,box-shadow .5s,transform .3s!important}
  .wai-dcard:hover{border-color:rgba(255,107,53,.5)!important;box-shadow:0 24px 64px rgba(255,107,53,.14)!important;transform:translateY(-3px)!important}
  .wai-conn-btn{transition:all .4s cubic-bezier(.16,1,.3,1)!important}
  .wai-conn-btn:hover:not(:disabled){filter:brightness(1.18)!important;transform:translateY(-2px) scale(1.03)!important;box-shadow:0 0 32px rgba(255,107,53,.5)!important}
`;

const DEVICE_META: Record<string, { icon: string; label: string; accent: string; bgGrad: string }> = {
  battery:      { icon: '⚡', label: 'Heimspeicher',  accent: '#22c55e', bgGrad: 'rgba(34,197,94,0.06)'  },
  heimspeicher: { icon: '⚡', label: 'Heimspeicher',  accent: '#22c55e', bgGrad: 'rgba(34,197,94,0.06)'  },
  inverter:     { icon: '☀️', label: 'PV-Wechselrichter', accent: '#ff9500', bgGrad: 'rgba(255,149,0,0.06)'  },
  wallbox:      { icon: '🔌', label: 'Wallbox',        accent: '#3b82f6', bgGrad: 'rgba(59,130,246,0.06)'  },
  'smart meter':{ icon: '📊', label: 'Smart Meter',   accent: '#a855f7', bgGrad: 'rgba(168,85,247,0.06)'  },
  meter:        { icon: '📊', label: 'Smart Meter',   accent: '#a855f7', bgGrad: 'rgba(168,85,247,0.06)'  },
};

const getMeta = (type: string) => {
  const t = type.toLowerCase();
  for (const [k, v] of Object.entries(DEVICE_META)) { if (t.includes(k)) return v; }
  return { icon: '📡', label: type, accent: '#ff6b35', bgGrad: 'rgba(255,107,53,0.06)' };
};

const getStatusInfo = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('connected') && !s.includes('partial')) return { color: '#22c55e', label: 'Verbunden', dot: true };
  if (s.includes('partial')) return { color: '#f59e0b', label: 'Teilverbunden', dot: true };
  if (s.includes('pending')) return { color: '#f59e0b', label: 'Verbinde…', dot: true };
  return { color: '#ef4444', label: 'Offline', dot: false };
};

const HexIcon: React.FC<{ icon: string; accent: string; size?: number }> = ({ icon, accent, size = 52 }) => (
  <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" style={{ position: 'absolute', top: 0, left: 0 }}>
      <polygon points="26,2 49,14 49,38 26,50 3,38 3,14"
        fill="rgba(4,6,20,0.9)"
        stroke={accent}
        strokeWidth="1.5"
        opacity="0.9"
      />
      <polygon points="26,2 49,14 49,38 26,50 3,38 3,14"
        fill="none"
        stroke={accent}
        strokeWidth="1"
        opacity="0.2"
        style={{ animation: 'wai-spin-slow 20s linear infinite', transformOrigin: '26px 26px' }}
      />
    </svg>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42 }}>
      {icon}
    </div>
  </div>
);

const SOCRing: React.FC<{ soc: number; accent: string }> = ({ soc, accent }) => {
  const r = 22, circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, soc / 100);
  return (
    <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
      <svg width={60} height={60} viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
        <circle cx="30" cy="30" r={r} fill="none" stroke={accent} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '30px 30px', transition: 'stroke-dasharray 1.2s ease' }}
        />
        <text x="30" y="34" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" fontFamily="monospace">{soc}%</text>
      </svg>
    </div>
  );
};

const PowerBar: React.FC<{ kw: number; accent: string; max?: number }> = ({ kw, accent, max = 10 }) => {
  const pct = Math.min(100, Math.abs(kw) / max * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(248,250,252,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
        <span>Leistung</span>
        <span style={{ color: accent, fontWeight: 700 }}>{kw > 0 ? '+' : ''}{kw.toFixed(1)} kW</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${accent}88,${accent})`, borderRadius: 999, boxShadow: `0 0 8px ${accent}60`, transition: 'width 1s ease', animation: 'wai-pulse-bar 2s ease-in-out infinite' }}/>
      </div>
    </div>
  );
};

const EnergyPulse: React.FC<{ accent: string; active: boolean }> = ({ accent, active }) => (
  <svg width="32" height="16" viewBox="0 0 32 16" fill="none" style={{ opacity: active ? 1 : 0.2 }}>
    <polyline points="0,8 6,8 9,2 13,14 17,4 21,12 25,8 32,8"
      stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: active ? 'wai-pulse-bar 1.8s ease-in-out infinite' : 'none' }}
    />
  </svg>
);

const DeviceGrid: React.FC<DeviceGridProps> = ({ devices, onConnect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    canvas.width = W; canvas.height = H;
    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
      c: Math.random() > 0.5 ? 'rgba(255,107,53,' : 'rgba(59,130,246,'
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c + '0.35)';
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <style>{WAI}</style>

      {/* Particle canvas background */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}/>

      {/* Section sub-header */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#ff6b35,#ff9500)', borderRadius: 999 }}/>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(248,250,252,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {devices.length} Gerät{devices.length !== 1 ? 'e' : ''} erkannt
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['MQTT', 'TLS', 'ISO15118'].map(tag => (
            <span key={tag} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(59,130,246,0.7)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 4, padding: '3px 8px' }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Device cards — full-width stacked rows */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {devices.map((device) => {
          const meta = getMeta(device.type);
          const statusInfo = getStatusInfo(device.status);
          const isBattery = (device.type || '').toLowerCase().match(/battery|heimspeicher/);
          const safeSoc = Number.isFinite(device.soc) ? Math.max(0, Math.min(100, Number(device.soc))) : 0;
          const safePower = Number.isFinite(device.power_kw) ? Number(device.power_kw) : 0;
          const isConnected = (device.status || '').toLowerCase().includes('connected');

          return (
            <div key={device.id} className="wai-dcard" style={{
              background: `linear-gradient(120deg,rgba(4,6,20,0.82) 60%,${meta.bgGrad})`,
              border: `1px solid ${isConnected ? meta.accent + '30' : 'rgba(255,107,53,0.12)'}`,
              borderRadius: 20,
              overflow: 'hidden',
              backdropFilter: 'blur(16px)',
              position: 'relative',
            }}>
              {/* Top stripe */}
              <div style={{ height: 2, background: `linear-gradient(90deg,${meta.accent},${isConnected ? '#3b82f6' : '#ff6b35'})` }}/>

              {/* Scan line */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${meta.accent}22,transparent)`, animation: 'wai-scan 14s linear infinite', pointerEvents: 'none', zIndex: 0 }}/>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', position: 'relative', zIndex: 1 }}>

                {/* Left: hex icon */}
                <HexIcon icon={meta.icon} accent={meta.accent}/>

                {/* Center left: name + status */}
                <div style={{ flex: '0 0 auto', minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {/* Animated status ring */}
                    <div style={{ position: 'relative', width: 12, height: 12, flexShrink: 0 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: statusInfo.color, animation: 'wai-breathe 3.5s ease-in-out infinite' }}/>
                      {isConnected && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: statusInfo.color, animation: 'wai-ring-ping 2.5s ease-out infinite' }}/>}
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>{meta.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(248,250,252,0.4)', letterSpacing: '0.06em' }}>{device.brand || 'Unbekannt'}</div>
                  <div style={{ marginTop: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${statusInfo.color}15`, border: `1px solid ${statusInfo.color}35`, borderRadius: 999, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: statusInfo.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Center: data details */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: '8px 16px' }}>
                  {[
                    { label: 'IP / Verbindung', value: device.ip || '—' },
                    { label: 'Modell', value: device.model || '—' },
                    { label: 'Hersteller', value: device.manufacturer || '—' },
                    { label: 'Protokoll', value: 'MQTT · TLS 1.3' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.025)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: 9, color: 'rgba(248,250,252,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.75)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Right: SOC ring + power + button */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0, minWidth: 120 }}>
                  {isBattery ? (
                    <>
                      <SOCRing soc={safeSoc} accent={meta.accent}/>
                      <PowerBar kw={safePower} accent={meta.accent}/>
                    </>
                  ) : (
                    <EnergyPulse accent={meta.accent} active={isConnected}/>
                  )}
                  <button
                    className="wai-conn-btn"
                    disabled={isConnected}
                    onClick={() => onConnect && onConnect(device)}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 999,
                      padding: '10px 16px',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: isConnected ? 'default' : 'pointer',
                      letterSpacing: '0.04em',
                      background: isConnected
                        ? `linear-gradient(90deg,${meta.accent}22,${meta.accent}11)`
                        : 'linear-gradient(90deg,#ff6b35,#ff9500)',
                      color: isConnected ? meta.accent : '#0a0305',
                      border: isConnected ? `1px solid ${meta.accent}40` : 'none',
                      animation: isConnected ? 'none' : 'wai-glow-o 4s ease-in-out infinite',
                    }}>
                    {isConnected ? '✓ Verbunden' : 'Verbinden'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {devices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '56px 20px', color: 'rgba(248,250,252,0.2)', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
            <div>Keine Geräte erkannt — Backend aktiv?</div>
            <div style={{ fontSize: 11, marginTop: 6, color: 'rgba(248,250,252,0.12)' }}>MQTT Broker · TLS · ISO 15118</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceGrid;
