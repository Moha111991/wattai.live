
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
  return (
    <div className="device-grid">
  <div style={{ fontSize: 44, color: 'blue', fontWeight: 'bold', marginBottom: 8 }}>🔋</div>
  <div style={{ color: 'blue', fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>BATTERY EMOJI TEST (GRID TOP)</div>
  <div style={{background:'#ff0',color:'#222',fontWeight:'bold',padding:8,marginBottom:8}}>DEVICEGRID AKTIV</div>
  <pre style={{background:'#222',color:'#0f0',padding:8,marginBottom:8,fontSize:13}}>{JSON.stringify(devices, null, 2)}</pre>
      {devices.map((device) => {
        const typeStr = (device.type || '').toLowerCase();
        if (typeStr.includes('battery') || typeStr.includes('heimspeicher')) {
          // Special UI for Heimspeicher/Battery (alle Varianten)
          return (
            <div key={device.id || Math.random()} className="device-card battery-card" style={{ background: '#f5f7fa', border: '1.5px solid #2196f3', boxShadow: '0 2px 12px #2196f322', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 44, color: 'green', fontWeight: 'bold' }}>🔋</span>
                <span style={{ color: '#222', fontWeight: 600, fontSize: 17, lineHeight: 1 }}>{device.type || 'Battery'} ({device.brand || 'Unbekannt'})</span>
              </div>
              <div>IP: {device.ip}</div>
              <div>Status: <span style={{ color: device.status === 'connected' ? '#4caf50' : '#f44336' }}>{device.status}</span></div>
              <div>Model: {device.model || '-'}</div>
              <div>Hersteller: {device.manufacturer || '-'}</div>
              <div style={{ margin: '12px 0' }}>
                <span>Batterie-SOC:</span>
                <div style={{ background: '#e0e0e0', borderRadius: 8, height: 18, width: '100%', marginTop: 4, position: 'relative' }}>
                  <div style={{ width: `${device.soc ?? 0}%`, background: '#2196f3', height: '100%', borderRadius: 8, transition: 'width 0.5s' }} />
                  <span style={{ position: 'absolute', left: 8, top: 0, fontWeight: 600, color: '#222', fontSize: 13 }}>{device.soc ?? '-'}%</span>
                </div>
              </div>
              <div>Leistung: <b>{device.power_kw ?? '-'} kW</b></div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button style={{ flex: 1, background: '#4caf50', color: '#fff', border: 'none', borderRadius: 4, padding: 6, fontWeight: 600, cursor: 'pointer' }}
                  disabled={device.status !== 'connected'}
                  onClick={() => alert('Batterie laden (Demo)')}
                >
                  ➕ Laden
                </button>
                <button style={{ flex: 1, background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, padding: 6, fontWeight: 600, cursor: 'pointer' }}
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
          <div key={device.id} className="device-card">
            <h4>{device.type} ({device.brand})</h4>
            <div>IP: {device.ip}</div>
            <div>Status: {device.status}</div>
            <div>Model: {device.model || "-"}</div>
            <div>Manufacturer: {device.manufacturer || "-"}</div>
            <div>SOC: {device.soc ?? "-"}</div>
            <div>Power: {device.power_kw ?? "-"} kW</div>
            <button
              disabled={device.status === "connected"}
              onClick={() => onConnect && onConnect(device)}
              style={{ marginTop: 8 }}
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
