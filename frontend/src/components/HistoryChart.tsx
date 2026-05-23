import { useEffect, useState, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { API_URL } from '../lib/api';

interface ChartProps {
  title: string;
  endpoint: string;
  dataKey: string;
  color: string;
  hours?: number;
}

interface HistoryApiPoint { time: string; value: number; }
interface HistoryApiResponse { data?: HistoryApiPoint[]; }
interface ChartDataPoint { time: string; value: number; }

/* ─── Accent palette derived from prop color ──────────────────────────── */
const getAccent = (color: string) => {
  if (color.includes('10b981') || color.includes('22c55e')) return { main:'#10b981', glow:'rgba(16,185,129,', label:'rgba(16,185,129,0.9)' };
  if (color.includes('3b82f6') || color.includes('2196')) return { main:'#3b82f6', glow:'rgba(59,130,246,', label:'rgba(59,130,246,0.9)' };
  if (color.includes('f59e0b') || color.includes('FF9800')) return { main:'#f59e0b', glow:'rgba(245,158,11,', label:'rgba(245,158,11,0.9)' };
  return { main:'#ff9500', glow:'rgba(255,149,0,', label:'rgba(255,149,0,0.9)' };
};

/* ─── Custom Tooltip ─────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, accent }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string; accent: ReturnType<typeof getAccent>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(18,24,55,0.92)', backdropFilter: 'blur(16px)',
      border: `1px solid ${accent.glow}0.4)`,
      borderRadius: 12, padding: '12px 16px',
      boxShadow: `0 8px 32px ${accent.glow}0.25), 0 0 0 1px ${accent.glow}0.1)`,
    }}>
      <div style={{ fontSize: 10, color: 'rgba(248,250,252,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent.main, boxShadow: `0 0 6px ${accent.main}` }}/>
          <span style={{ fontSize: 15, fontWeight: 900, color: accent.main, fontFamily: 'monospace' }}>
            {p.value?.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(248,250,252,0.5)' }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Custom Legend ─────────────────────────────────────────────────── */
const CustomLegend = ({ payload, accent }: { payload?: { value: string }[]; accent: ReturnType<typeof getAccent> }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 10 }}>
    {payload?.map((p, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 28, height: 3, borderRadius: 999, background: accent.main, boxShadow: `0 0 6px ${accent.glow}0.6)` }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(248,250,252,0.75)', letterSpacing: '0.06em' }}>{p.value}</span>
      </div>
    ))}
  </div>
);

/* ─── Gradient SVG def ID ───────────────────────────────────────────── */
let _id = 0;

export default function HistoryChart({ title, endpoint, dataKey, color, hours = 24 }: ChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const accent = getAccent(color);
  const gradId = useRef(`hc-grad-${++_id}`).current;
  const glowId = useRef(`hc-glow-${_id}`).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}${endpoint}?hours=${hours}`, {
          headers: { 'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE' }
        });
        const json: HistoryApiResponse = await res.json();
        if (Array.isArray(json.data)) {
          setData(json.data.map((d) => ({
            time: new Date(d.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            value: d.value
          })));
        }
        setLoading(false);
      } catch { setLoading(false); }
    };
    fetchData();
    const iv = setInterval(fetchData, 60000);
    return () => clearInterval(iv);
  }, [endpoint, hours]);

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background: 'rgba(22,30,65,0.78)',
    backdropFilter: 'blur(18px)',
    border: `1px solid ${accent.glow}0.22)`,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: `0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px ${accent.glow}0.08), 0 8px 32px ${accent.glow}0.12)`,
    /* subtle 3-D lift */
    transform: 'perspective(1200px) rotateX(1.2deg)',
    transformOrigin: 'center bottom',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: '-0.01em',
    color: '#f8fafc',
    marginBottom: 4,
    textShadow: `0 0 24px ${accent.glow}0.5)`,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: accent.label,
    marginBottom: 16,
  };

  if (loading) return (
    <div style={cardStyle}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${accent.main},#ff6b35)` }}/>
      <div style={{ padding: '20px 22px' }}>
        <div style={titleStyle}>{title}</div>
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="none" stroke={accent.main} strokeWidth="2" strokeDasharray="14 36"><animateTransform attributeName="transform" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite"/></circle></svg>
          <span style={{ fontSize: 13, color: 'rgba(248,250,252,0.4)', fontWeight: 600 }}>Lade Daten…</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={cardStyle}>
      {/* Top accent stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg,${accent.main},#ff6b35,#ff9500)`, boxShadow: `0 0 12px ${accent.glow}0.6)` }}/>

      {/* Scan line */}
      <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${accent.glow}0.15),transparent)`, animation: 'hc-scan 16s linear infinite', pointerEvents: 'none', zIndex: 0 }}/>

      {/* Glow orb */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '50%', height: '120%', borderRadius: '50%', background: `radial-gradient(circle,${accent.glow}0.06),transparent 68%)`, pointerEvents: 'none' }}/>

      <style>{`
        @keyframes hc-scan{0%{top:0}100%{top:100%}}
        @keyframes hc-breathe{0%,100%{opacity:.4}50%{opacity:1}}
      `}</style>

      <div style={{ padding: '20px 22px 16px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
          <div>
            <div style={titleStyle}>{title}</div>
            <div style={subtitleStyle}>{dataKey} · Letzte {hours}h</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${accent.glow}0.1)`, border: `1px solid ${accent.glow}0.25)`, borderRadius: 999, padding: '4px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent.main, animation: 'hc-breathe 2.5s ease-in-out infinite' }}/>
            <span style={{ fontSize: 9, fontWeight: 700, color: accent.label, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Live</span>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: 260, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent.main} stopOpacity={0.38}/>
                  <stop offset="55%" stopColor={accent.main} stopOpacity={0.1}/>
                  <stop offset="100%" stopColor={accent.main} stopOpacity={0}/>
                </linearGradient>
                <filter id={glowId}>
                  <feGaussianBlur stdDeviation="3" result="b"/>
                  <feComposite in="SourceGraphic" in2="b" operator="over"/>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: 'rgba(248,250,252,0.55)', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(248,250,252,0.55)', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip content={<CustomTooltip accent={accent}/>} />
              <Legend content={<CustomLegend accent={accent}/>} />
              <Area
                type="monotone"
                dataKey="value"
                name={dataKey}
                stroke={accent.main}
                strokeWidth={2.5}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 6, fill: accent.main, stroke: 'rgba(22,30,65,0.88)', strokeWidth: 2, filter: `url(#${glowId})` }}
                filter={`url(#${glowId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
