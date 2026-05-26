import React from "react";

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
  @keyframes wai-breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
  @keyframes wai-pulse-ring{0%{transform:scale(1);opacity:0.4}100%{transform:scale(1.6);opacity:0}}
  .wai-dev-card{transition:border-color .5s ease,box-shadow .5s ease,transform .3s ease!important}
  .wai-dev-card:hover{border-color:rgba(255,107,53,0.35)!important;box-shadow:0 16px 48px rgba(255,107,53,0.09)!important;transform:translateY(-2px)!important}
  .wai-dev-btn{transition:all .4s cubic-bezier(.16,1,.3,1)!important}
  .wai-dev-btn:hover:not(:disabled){filter:brightness(1.15)!important;transform:translateY(-2px) scale(1.02)!important}
`;

const DEVICE_ICONS: Record<string, string> = {
  battery: '🔋', heimspeicher: '🔋', inverter: '☀️', wallbox: '⚡',
  'smart meter': '📊', meter: '📊',
};

const getIcon = (type: string) => {
  const t = type.toLowerCase();
  for (const [k, v] of Object.entries(DEVICE_ICONS)) { if (t.includes(k)) return v; }
  return '📡';
};

const getStatusColor = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s.includes('connected')) return '#22c55e';
  if (s.includes('pending')) return '#f59e0b';
  if (s.includes('partial')) return '#f59e0b';
  return '#ef4444';
};

const DeviceGrid: React.FC<DeviceGridProps> = ({ devices, onConnect }) => {
  return (
    <div>
      <style>{WAI}</style>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16, width:'100%' }}>
        {devices.map((device) => {
          const typeStr = (device.type || '').toLowerCase();
          const isBattery = typeStr.includes('battery') || typeStr.includes('heimspeicher');
          const safeSoc = Number.isFinite(device.soc) ? Math.max(0, Math.min(100, Number(device.soc))) : 0;
          const safePower = Number.isFinite(device.power_kw) ? Number(device.power_kw) : 0;
          const statusColor = getStatusColor(device.status);
          const connected = (device.status || '').toLowerCase().includes('connected');
          const icon = getIcon(device.type);

          return (
            <div key={device.id} className="wai-dev-card" style={{
              background:'rgba(4,6,20,0.72)', border:`1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(255,107,53,0.12)'}`,
              borderRadius:18, overflow:'hidden', color:'#f8fafc',
            }}>
              {/* Top accent bar */}
              <div style={{ height:3, background:`linear-gradient(90deg,${statusColor},${connected ? '#3b82f6' : '#ff6b35'})` }}/>

              <div style={{ padding:'18px 20px' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ position:'relative', width:44, height:44, flexShrink:0 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.05)', border:`1px solid ${statusColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                      {icon}
                    </div>
                    {/* Live status dot */}
                    <div style={{ position:'absolute', bottom:2, right:2, width:10, height:10, borderRadius:'50%', background:statusColor, border:'2px solid rgba(4,6,20,0.9)', animation:'wai-breathe 4s ease-in-out infinite' }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:15, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{device.type}</div>
                    <div style={{ fontSize:12, color:'rgba(248,250,252,0.45)', marginTop:2 }}>{device.brand || 'Unbekannt'}</div>
                  </div>
                  <div style={{ background:`${statusColor}15`, border:`1px solid ${statusColor}35`, borderRadius:999, padding:'4px 10px', fontSize:10, fontWeight:700, color:statusColor, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                    {device.status || 'offline'}
                  </div>
                </div>

                {/* Details */}
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {[
                    { label:'Verbindung', value: device.ip || '—' },
                    { label:'Modell', value: device.model || '—' },
                    { label:'Hersteller', value: device.manufacturer || '—' },
                    ...(isBattery ? [{ label:'Leistung', value:`${safePower.toFixed(1)} kW` }] : []),
                    ...(device.soc != null ? [{ label:'SOC', value:`${safeSoc}%` }] : []),
                  ].map(({label,value})=>(
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', background:'rgba(255,255,255,0.025)', borderRadius:8 }}>
                      <span style={{ fontSize:11, color:'rgba(248,250,252,0.35)', letterSpacing:'0.1em', textTransform:'uppercase' }}>{label}</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'rgba(248,250,252,0.7)', fontFamily:'monospace' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* SOC bar for battery */}
                {isBattery && (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'rgba(248,250,252,0.35)', letterSpacing:'0.1em', marginBottom:5, textTransform:'uppercase' }}>
                      <span>Ladezustand</span><span style={{ color: safeSoc > 60 ? '#22c55e' : safeSoc > 25 ? '#f59e0b' : '#ef4444', fontWeight:700 }}>{safeSoc}%</span>
                    </div>
                    <div style={{ height:7, background:'rgba(255,255,255,0.06)', borderRadius:999, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${safeSoc}%`, borderRadius:999, transition:'width 1s ease',
                        background: safeSoc > 60 ? 'linear-gradient(90deg,#22c55e,#3b82f6)' : safeSoc > 25 ? 'linear-gradient(90deg,#f59e0b,#22c55e)' : 'linear-gradient(90deg,#ef4444,#f59e0b)',
                        boxShadow:`0 0 8px ${safeSoc > 60 ? '#22c55e' : safeSoc > 25 ? '#f59e0b' : '#ef4444'}60`,
                      }}/>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <button
                  className="wai-dev-btn"
                  disabled={connected}
                  onClick={() => onConnect && onConnect(device)}
                  style={{
                    width:'100%', border:'none', borderRadius:999, padding:'11px 0', fontWeight:800, fontSize:13,
                    cursor: connected ? 'default' : 'pointer',
                    background: connected
                      ? 'linear-gradient(90deg,rgba(34,197,94,0.15),rgba(34,197,94,0.08))'
                      : 'linear-gradient(90deg,#ff6b35,#ff9500)',
                    color: connected ? '#22c55e' : '#0a0305',
                    border: connected ? '1px solid rgba(34,197,94,0.3)' : 'none',
                  }}>
                  {connected ? '✓ Verbunden' : 'Gerät verbinden'}
                </button>
              </div>
            </div>
          );
        })}
        {devices.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'40px 20px', color:'rgba(248,250,252,0.25)', fontSize:14 }}>
            Keine Geräte gefunden. Backend aktiv?
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceGrid;
