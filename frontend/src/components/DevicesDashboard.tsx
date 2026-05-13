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

      {/* Geräte verbinden – moderne Karten */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        marginTop: '24px',
      }}>
        {DEVICE_CARDS.map((card, idx) => {
          const isConnected = devices.some(d =>
            (d.type || '').toLowerCase().includes(card.typeKey)
          );
          return (
            <div
              key={card.label}
              className={`tab-modern-card glass-effect animate-page-enter animate-stagger-${idx + 2}`}
              style={{
                border: `1px solid ${card.borderColor}`,
                background: `linear-gradient(135deg, ${card.glowColor} 0%, rgba(2,6,23,0.6) 100%)`,
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${card.borderColor}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Subtle top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
                borderRadius: '16px 16px 0 0',
              }}/>

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '28px', lineHeight: 1 }}>{card.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: card.color }}>{card.label}</span>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em',
                  padding: '3px 10px', borderRadius: '20px',
                  border: `1px solid ${isConnected ? 'rgba(52,211,153,0.4)' : card.borderColor}`,
                  color: isConnected ? '#34d399' : 'rgba(203,213,225,0.5)',
                  background: isConnected ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  {isConnected && (
                    <span style={{
                      display: 'inline-block', width: '6px', height: '6px',
                      borderRadius: '50%', background: '#34d399',
                      boxShadow: '0 0 6px #34d399', animation: 'pulse-ring 2s infinite',
                    }}/>
                  )}
                  {isConnected ? 'Verbunden' : 'Nicht verbunden'}
                </span>
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(203,213,225,0.75)', lineHeight: 1.5 }}>
                {card.description}
              </p>

              {/* Protocol badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '11px', padding: '2px 9px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)', color: 'rgba(203,213,225,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace',
                }}>
                  {card.protocol}
                </span>
              </div>

              {/* Step indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {card.steps.map((step, si) => (
                  <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: isConnected
                          ? 'rgba(52,211,153,0.2)'
                          : si === 0 ? `rgba(${card.color.replace(/[^\d,]/g,'')},0.15)` : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isConnected ? 'rgba(52,211,153,0.5)' : card.borderColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 700,
                        color: isConnected ? '#34d399' : card.color,
                        flexShrink: 0,
                      }}>
                        {isConnected ? '✓' : si + 1}
                      </div>
                      <span style={{ fontSize: '10px', color: 'rgba(203,213,225,0.45)', whiteSpace: 'nowrap' }}>
                        {step}
                      </span>
                    </div>
                    {si < card.steps.length - 1 && (
                      <div style={{ width: '12px', height: '1px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}/>
                    )}
                  </div>
                ))}
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
