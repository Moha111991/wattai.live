import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

interface BatteryData {
  soc: number;
  power_kw: number;
  capacity_kwh: number;
}

export default function BatteryWidget({ data }: { data?: BatteryData }) {
  const [live, setLive] = useState<BatteryData | null>(data ?? null);

  // If no data prop, fetch from API
  useEffect(() => {
    if (data) { setLive(data); return; }
    const load = async () => {
      try {
        const r = await fetch(`${API_URL}/battery/status`);
        if (r.ok) setLive(await r.json());
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [data]);

  const d = live ?? { soc: 0, power_kw: 0, capacity_kwh: 0 };
  const soc = Number.isFinite(d.soc) ? Math.max(0, Math.min(100, d.soc)) : 0;
  const power = Number.isFinite(d.power_kw) ? d.power_kw : 0;
  const cap = Number.isFinite(d.capacity_kwh) ? d.capacity_kwh : 0;
  const isCharging = power > 0;
  const isDischarging = power < 0;

  const socColor = soc > 60 ? '#22c55e' : soc > 25 ? '#f59e0b' : '#ef4444';
  const powerColor = isCharging ? '#22c55e' : isDischarging ? '#ff6b35' : 'rgba(248,250,252,0.4)';

  // Radial SOC arc params
  const r = 52, cx = 64, cy = 68;
  const circ = 2 * Math.PI * r;
  const dash = (soc / 100) * circ;

  return (
    <div style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:20, overflow:'hidden', color:'#f8fafc' }}>
      <div style={{ height:3, background:`linear-gradient(90deg,${socColor},#22c55e,#3b82f6)` }}/>
      <div style={{ padding:'20px 22px' }}>
        <div style={{ display:'flex', gap:24, alignItems:'flex-start', flexWrap:'wrap' }}>
          {/* Radial SOC gauge */}
          <div style={{ position:'relative', flexShrink:0 }}>
            <svg width="128" height="136" viewBox="0 0 128 136">
              <defs>
                <linearGradient id="bat-arc" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={soc > 60 ? '#22c55e' : soc > 25 ? '#f59e0b' : '#ef4444'}/>
                  <stop offset="100%" stopColor="#3b82f6"/>
                </linearGradient>
                <filter id="bat-glow"><feGaussianBlur stdDeviation="4" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
              </defs>
              {/* Track */}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
              {/* Arc */}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#bat-arc)" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={circ * 0.25}
                style={{ transition:'stroke-dasharray 1s ease', filter:'drop-shadow(0 0 8px rgba(34,197,94,0.5))' }}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
              {/* Icon */}
              <text x={cx} y={cy - 10} textAnchor="middle" fontSize="22" fill="#f8fafc">🔋</text>
              {/* SOC number */}
              <text x={cx} y={cy + 14} textAnchor="middle" fontSize="22" fontWeight="800" fill={socColor} fontFamily="monospace">{soc}</text>
              <text x={cx} y={cy + 28} textAnchor="middle" fontSize="11" fill="rgba(248,250,252,0.45)" fontFamily="monospace">%</text>
              {/* Status */}
              <text x={cx} y={cy + 50} textAnchor="middle" fontSize="9" fill={powerColor} fontFamily="monospace">
                {isCharging ? '▲ LÄDT' : isDischarging ? '▼ ENTLÄDT' : '● BEREIT'}
              </text>
            </svg>
          </div>

          {/* Data grid */}
          <div style={{ flex:1, minWidth:140, display:'flex', flexDirection:'column', gap:12, paddingTop:8 }}>
            {[
              { label:'Leistung', value: `${isCharging ? '+' : ''}${power.toFixed(1)} kW`, color: powerColor },
              { label:'Kapazität', value: `${cap.toFixed(1)} kWh`, color:'rgba(59,130,246,0.9)' },
              { label:'Energie geladen', value: `${(cap * soc / 100).toFixed(1)} kWh`, color:'rgba(248,250,252,0.6)' },
            ].map(({label,value,color})=>(
              <div key={label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:10, color:'rgba(248,250,252,0.35)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:17, fontWeight:800, color, fontFamily:'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(248,250,252,0.38)', marginBottom:6, letterSpacing:'0.1em' }}>
            <span>LADEZUSTAND</span><span style={{ color:socColor, fontWeight:700 }}>{soc}%</span>
          </div>
          <div style={{ height:8, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${soc}%`, background:`linear-gradient(90deg,${socColor},#3b82f6)`, borderRadius:999, transition:'width 1s ease', boxShadow:`0 0 12px ${socColor}60` }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:'rgba(248,250,252,0.22)' }}>
            <span>0%</span><span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
