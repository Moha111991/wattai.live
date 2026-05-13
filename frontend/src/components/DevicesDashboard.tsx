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
    color: '#67e8f9',
    borderColor: 'rgba(103,232,249,0.25)',
    glowColor: 'rgba(103,232,249,0.08)',
    protocol: 'Modbus / REST',
    description: 'Echtzeit-Zählerstand, Verbrauch & Einspeisung',
    steps: ['Zähler-IP eingeben', 'Protokoll wählen', 'Verbinden'],
    typeKey: 'smart meter',
  },
  {
    icon: '☀️',
    label: 'PV-Wechselrichter',
    color: '#34d399',
    borderColor: 'rgba(52,211,153,0.25)',
    glowColor: 'rgba(52,211,153,0.08)',
    protocol: 'Modbus / Cloud',
    description: 'Solarertrag, Einspeiseleistung & Eigenverbrauch',
    steps: ['Inverter-IP eingeben', 'Protokoll wählen', 'Verbinden'],
    typeKey: 'inverter',
  },
  {
    icon: '🔋',
    label: 'Heimspeicher',
    color: '#fbbf24',
    borderColor: 'rgba(251,191,36,0.25)',
    glowColor: 'rgba(251,191,36,0.08)',
    protocol: 'Modbus / Cloud API',
    description: 'SoC, Lade-/Entladeleistung & Batteriestatus',
    steps: ['Speicher-IP eingeben', 'Protokoll wählen', 'Verbinden'],
    typeKey: 'battery',
  },
  {
    icon: '⚡',
    label: 'Wallbox',
    color: '#a78bfa',
    borderColor: 'rgba(167,139,250,0.25)',
    glowColor: 'rgba(167,139,250,0.08)',
    protocol: 'OCPP / Cloud',
    description: 'Ladeleistung, V2H/V2G & PV-Überschussladen',
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

      {/* Geräte verbinden – 2-spaltig, horizontale Karten */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '14px',
        marginTop: '24px',
      }}
        className="devices-connect-grid"
      >
        {DEVICE_CARDS.map((card, idx) => {
          const isConnected = devices.some(d =>
            (d.type || '').toLowerCase().includes(card.typeKey)
          );
          return (
            <div
              key={card.label}
              className={`animate-page-enter animate-stagger-${idx + 2}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                border: `1px solid ${card.borderColor}`,
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'rgba(2,6,23,0.65)',
                backdropFilter: 'blur(12px)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 10px 36px ${card.borderColor}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Left color strip + icon */}
              <div style={{
                width: '72px',
                flexShrink: 0,
                background: `linear-gradient(180deg, ${card.glowColor.replace('0.08', '0.22')} 0%, ${card.glowColor} 100%)`,
                borderRight: `1px solid ${card.borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '16px 0',
              }}>
                <span style={{ fontSize: '30px', lineHeight: 1 }}>{card.icon}</span>
                {/* Live pulse dot if connected */}
                {isConnected && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: '#34d399', boxShadow: '0 0 8px #34d399',
                    display: 'inline-block', animation: 'pulse-ring 2s infinite',
                  }}/>
                )}
              </div>

              {/* Right content */}
              <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: card.color, whiteSpace: 'nowrap' }}>
                    {card.label}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px',
                    border: `1px solid ${isConnected ? 'rgba(52,211,153,0.4)' : card.borderColor}`,
                    color: isConnected ? '#34d399' : 'rgba(203,213,225,0.45)',
                    background: isConnected ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {isConnected ? '✓ Online' : 'Offline'}
                  </span>
                </div>

                {/* Description */}
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(203,213,225,0.65)', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {card.description}
                </p>

                {/* Bottom row: protocol + steps */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  <span style={{
                    fontSize: '10px', padding: '1px 7px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(203,213,225,0.5)',
                    border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'monospace', flexShrink: 0,
                  }}>
                    {card.protocol}
                  </span>
                  {/* Step bubbles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {card.steps.map((_, si) => (
                      <div key={si} style={{
                        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                        background: isConnected ? 'rgba(52,211,153,0.15)' : si === 0 ? `${card.glowColor}` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isConnected ? 'rgba(52,211,153,0.4)' : card.borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', fontWeight: 700,
                        color: isConnected ? '#34d399' : card.color,
                      }}>
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
