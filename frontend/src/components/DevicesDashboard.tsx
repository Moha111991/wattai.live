import { useEffect, useState } from 'react';
import DeviceManager from './DeviceManager';
import { API_URL } from '../lib/api';

interface DeviceSummary {
  type?: string;
  status?: string;
}

const DEVICE_CARDS = [
  {
    icon: '📡',
    label: 'Smart Meter',
    accent: '#67e8f9',
    accentBg: 'rgba(103,232,249,0.10)',
    accentBorder: 'rgba(103,232,249,0.28)',
    protocol: 'Modbus / REST',
    description: 'Echtzeit-Zählerstand, Verbrauch & Einspeisung in Watt und kWh',
    steps: ['Zähler-IP eingeben', 'Protokoll wählen', 'Verbinden'],
    typeKey: 'smart meter',
  },
  {
    icon: '☀️',
    label: 'PV-Wechselrichter',
    accent: '#67e8f9',
    accentBg: 'rgba(103,232,249,0.10)',
    accentBorder: 'rgba(103,232,249,0.28)',
    protocol: 'Modbus / Cloud',
    description: 'Solarertrag, Einspeiseleistung & Eigenverbrauchsquote',
    steps: ['Inverter-IP eingeben', 'Protokoll wählen', 'Verbinden'],
    typeKey: 'inverter',
  },
  {
    icon: '🔋',
    label: 'Heimspeicher',
    accent: '#67e8f9',
    accentBg: 'rgba(103,232,249,0.10)',
    accentBorder: 'rgba(103,232,249,0.28)',
    protocol: 'Modbus / Cloud API',
    description: 'SoC, Lade-/Entladeleistung & Batteriestatus in Echtzeit',
    steps: ['Speicher-IP eingeben', 'Protokoll wählen', 'Verbinden'],
    typeKey: 'battery',
  },
  {
    icon: '⚡',
    label: 'Wallbox',
    accent: '#67e8f9',
    accentBg: 'rgba(103,232,249,0.10)',
    accentBorder: 'rgba(103,232,249,0.28)',
    protocol: 'OCPP / Cloud',
    description: 'Ladeleistung, V2H/V2G & PV-Überschussladen steuern',
    steps: ['Wallbox-ID eingeben', 'Protokoll wählen', 'Verbinden'],
    typeKey: 'wallbox',
  },
];

export default function DevicesDashboard() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/devices`, {
      headers: {
        'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setDevices(data.devices || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'rgba(226, 232, 240, 0.8)' }}>Geräte werden geladen...</p>
      </div>
    );
  }

  const connectedCount = devices.length;
  const activeCount = devices.filter(d => d.status === 'connected').length;

  return (
    <div className="tab-content animate-page-enter">

      {/* DeviceManager */}
      <div className="tab-modern-card glass-effect animate-stagger-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div className="status-dot status-dot-pulse"></div>
          <h2 className="tab-section-title neon-glow" style={{ margin: 0 }}>Verbundene Geräte</h2>
          <span className="badge-count">{connectedCount}</span>
        </div>
        <DeviceManager />
      </div>

      {/* Geräte verbinden – 2-spaltig, einheitliches Design */}
      <div className="devices-connect-grid">
        {DEVICE_CARDS.map((card, idx) => {
          const isConnected = devices.some(d =>
            (d.type || '').toLowerCase().includes(card.typeKey)
          );
          return (
            <div
              key={card.label}
              className={`device-connect-card animate-page-enter animate-stagger-${idx + 2}`}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(103,232,249,0.14)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Icon column */}
              <div className="device-card-icon-col">
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{card.icon}</span>
                <span className={`device-card-dot ${isConnected ? 'device-card-dot--online' : 'device-card-dot--offline'}`} />
              </div>

              {/* Content column */}
              <div className="device-card-content">
                <div className="device-card-header">
                  <span className="device-card-label">{card.label}</span>
                  <span className={`device-card-badge ${isConnected ? 'device-card-badge--online' : ''}`}>
                    {isConnected ? '✓ Online' : 'Offline'}
                  </span>
                </div>
                <p className="device-card-desc">{card.description}</p>
                <div className="device-card-footer">
                  <span className="device-card-protocol">{card.protocol}</span>
                  <div className="device-card-steps">
                    {card.steps.map((_, si) => (
                      <div key={si} className={`device-step-bubble ${isConnected ? 'device-step-bubble--done' : si === 0 ? 'device-step-bubble--active' : ''}`}>
                        {isConnected ? '✓' : si + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Geräte-Status Übersicht */}
      <div className="tab-modern-card glass-effect animate-stagger-6 mt-6">
        <h3 className="tab-section-title mb-4 neon-glow">Geräte-Status Übersicht</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {[
            { value: connectedCount, label: 'Registriert', color: '#67e8f9' },
            { value: activeCount, label: 'Verbunden', color: '#34d399' },
            { value: '100%', label: 'Verfügbarkeit', color: '#a78bfa' },
          ].map(m => (
            <div key={m.label} className="metric-card" style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div className="metric-value animated-metric" style={{ color: m.color, fontSize: '2rem' }}>
                {m.value}
              </div>
              <div className="metric-label" style={{ fontSize: '0.8rem', opacity: 0.7 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding – Gerät hinzufügen */}
      <div className="tab-modern-card glass-effect animate-stagger-7 mt-6"
           style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(2,6,23,0.6) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <h3 style={{ color: '#a78bfa', fontWeight: 700, margin: '0 0 8px 0', fontSize: '1rem' }}>
              💡 Neues Gerät verbinden
            </h3>
            <p style={{ color: 'rgba(226,232,240,0.75)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
              Klicken Sie auf <strong style={{ color: '#a78bfa' }}>„Gerät hinzufügen"</strong> im Panel oben, um ein Smart Meter, einen PV-Wechselrichter, Heimspeicher oder eine Wallbox einzurichten. Unterstützte Protokolle: Modbus TCP, Cloud API, OCPP.
            </p>
          </div>
          {/* 3-step wizard visual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' }}>
            {['Gerät auswählen', 'Verbindung konfigurieren', 'Gerät registrieren'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#a78bfa',
                }}>{i + 1}</div>
                <span style={{ fontSize: '0.85rem', color: 'rgba(203,213,225,0.8)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
