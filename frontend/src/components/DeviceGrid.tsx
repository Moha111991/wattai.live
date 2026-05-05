
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

const DeviceGrid: React.FC<DeviceGridProps> = ({ devices, onConnect }) => {
  const getStatusColor = (status?: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('connected')) return '#22c55e';
    if (normalized.includes('pending')) return '#f59e0b';
    return '#f87171';
  };

  return (
  <div className="device-grid" style={{ display: 'grid', gap: 14, width: '100%', minWidth: 0 }}>
      {devices.map((device) => {
        const typeStr = (device.type || '').toLowerCase();
        if (typeStr.includes('battery') || typeStr.includes('heimspeicher')) {
          const safeSoc = Number.isFinite(device.soc) ? Math.max(0, Math.min(100, Number(device.soc))) : 0;
          const safePower = Number.isFinite(device.power_kw) ? Number(device.power_kw) : 0;

          // Special UI for Heimspeicher/Battery (alle Varianten)
          return (
            <div key={device.id || Math.random()} className="device-card battery-card" style={{ background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(103,232,249,0.32)', boxShadow: '0 10px 30px rgba(2,6,23,0.35)', borderRadius: 14, padding: 18, color: '#e2e8f0', width: '100%', minWidth: 0, overflowWrap: 'anywhere' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, minWidth: 0 }}>
                <span style={{ fontSize: 36 }}>🔋</span>
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 17, lineHeight: 1.2, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{device.type || 'Battery'} ({device.brand || 'Unbekannt'})</span>
              </div>
              <div style={{ color: '#cbd5e1' }}>IP: {device.ip || '-'}</div>
              <div style={{ color: '#cbd5e1' }}>Status: <span style={{ color: getStatusColor(device.status), fontWeight: 700 }}>{device.status || 'offline'}</span></div>
              <div style={{ color: '#cbd5e1' }}>Model: {device.model || '-'}</div>
              <div style={{ color: '#cbd5e1' }}>Hersteller: {device.manufacturer || '-'}</div>
              <div style={{ margin: '12px 0' }}>
                <span style={{ color: '#bae6fd', fontWeight: 600 }}>Batterie-SOC:</span>
                <div style={{ background: 'rgba(148,163,184,0.25)', borderRadius: 8, height: 18, width: '100%', marginTop: 4, position: 'relative' }}>
                  <div style={{ width: `${safeSoc}%`, background: 'linear-gradient(90deg, #38bdf8 0%, #14b8a6 100%)', height: '100%', borderRadius: 8, transition: 'width 0.5s' }} />
                  <span style={{ position: 'absolute', left: 8, top: 0, fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>{safeSoc}%</span>
                </div>
              </div>
              <div style={{ color: '#cbd5e1' }}>Leistung: <b style={{ color: '#f8fafc' }}>{safePower.toFixed(1)} kW</b></div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={{ flex: '1 1 140px', minWidth: 0, background: 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: 7, fontWeight: 700, cursor: 'pointer' }}
                  disabled={device.status !== 'connected'}
                  onClick={() => alert('Batterie laden (Demo)')}
                >
                  ➕ Laden
                </button>
                <button style={{ flex: '1 1 140px', minWidth: 0, background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: 7, fontWeight: 700, cursor: 'pointer' }}
                  disabled={device.status !== 'connected'}
                  onClick={() => alert('Batterie entladen (Demo)')}
                >
                  ➖ Entladen
                </button>
              </div>
            </div>
          );
        }
        // Default card for other devices
        return (
          <div key={device.id} className="device-card" style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148,163,184,0.28)', borderRadius: 12, padding: 14, color: '#e2e8f0', width: '100%', minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>{device.type} ({device.brand})</h4>
            <div style={{ color: '#cbd5e1' }}>IP: {device.ip || '-'}</div>
            <div style={{ color: '#cbd5e1' }}>Status: <span style={{ color: getStatusColor(device.status), fontWeight: 700 }}>{device.status || 'offline'}</span></div>
            <div style={{ color: '#cbd5e1' }}>Model: {device.model || "-"}</div>
            <div style={{ color: '#cbd5e1' }}>Manufacturer: {device.manufacturer || "-"}</div>
            <div style={{ color: '#cbd5e1' }}>SOC: {device.soc ?? "-"}</div>
            <div style={{ color: '#cbd5e1' }}>Power: {Number.isFinite(device.power_kw) ? Number(device.power_kw).toFixed(1) : '0.0'} kW</div>
            <button
              disabled={device.status === "connected"}
              onClick={() => onConnect && onConnect(device)}
              style={{ marginTop: 10, background: 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}
            >
              {device.status === "connected" ? "Verbunden" : "Verbinden"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DeviceGrid;
