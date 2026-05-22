import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
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
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '0 0 40px', background: 'transparent' }}>
      <style>{`
        @keyframes dev-orbit { to{transform:rotate(360deg)} }
        @keyframes dev-ring { 0%,100%{r:18;opacity:.3}50%{r:22;opacity:.6} }
        @keyframes dev-signal { 0%{stroke-dashoffset:0}100%{stroke-dashoffset:-30} }
      `}</style>

      {/* Cinematic Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* Network topology SVG */}
        <div style={{ flexShrink: 0 }}>
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            {/* Central hub */}
            <circle cx="80" cy="50" r="14" fill="rgba(4,6,20,0.9)" stroke="rgba(255,107,53,0.5)" strokeWidth="2"/>
            <circle cx="80" cy="50" r="6" fill="#ff6b35">
              <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite"/>
            </circle>
            {/* Orbit ring */}
            <circle cx="80" cy="50" r="22" fill="none" stroke="rgba(255,107,53,0.1)" strokeWidth="1" strokeDasharray="4 4"/>
            {/* Device nodes */}
            {[[80,20,'#ff9500'],[116,68,'#3b82f6'],[44,68,'#22c55e'],[80,80,'#a78bfa']].map(([cx,cy,color],i) => (
              <g key={i}>
                <line x1="80" y1="50" x2={cx as number} y2={cy as number} stroke={color as string} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 3">
                  <animate attributeName="stroke-dashoffset" values="0;-30" dur={`${1.4+i*0.3}s`} repeatCount="indefinite"/>
                </line>
                <circle cx={cx as number} cy={cy as number} r="7" fill="rgba(4,6,20,0.9)" stroke={color as string} strokeWidth="1.5">
                  <animate attributeName="r" values="5;8;5" dur={`${2+i*0.4}s`} repeatCount="indefinite"/>
                </circle>
              </g>
            ))}
            {/* Labels */}
            <text x="80" y="13" textAnchor="middle" fill="#ff9500" fontSize="7" fontWeight="600">METER</text>
            <text x="130" y="71" textAnchor="middle" fill="#3b82f6" fontSize="7" fontWeight="600">PV</text>
            <text x="30" y="71" textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="600">BAT</text>
            <text x="80" y="94" textAnchor="middle" fill="#a78bfa" fontSize="7" fontWeight="600">EV</text>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff9500', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Geräte</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            Geräteverwaltung
          </h2>
          <p style={{ margin: 0, color: 'rgba(248,250,252,0.52)', fontSize: 14, lineHeight: 1.5 }}>
            Smart Meter, PV-Wechselrichter, Heimspeicher und Wallbox — alle Geräte im Überblick.
          </p>
        </div>
      </div>

      {/* DeviceManager */}
      <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', borderRadius: 2, marginBottom: 20 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b35', boxShadow: '0 0 8px #ff6b35', display: 'inline-block' }}/>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f8fafc', letterSpacing: 1 }}>Verbundene Geräte</h2>
          <span style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)', color: '#ff9500', borderRadius: 20, fontSize: 12, fontWeight: 700, padding: '2px 10px' }}>
            {connectedCount}
          </span>
        </div>
        <DeviceManager />
      </div>

      {/* Device Connect Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 16 }}>
        {DEVICE_CARDS.map((card) => {
          const isConnected = devices.some(d => (d.type || '').toLowerCase().includes(card.typeKey));
          const svgIcons: Record<string, ReactElement> = {
            'Smart Meter': (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="6" width="24" height="20" rx="3" fill="rgba(255,149,0,0.1)" stroke="#ff9500" strokeWidth="1.5"/>
                <rect x="8" y="10" width="16" height="8" rx="2" fill="rgba(255,149,0,0.15)"/>
                <circle cx="12" cy="22" r="1.5" fill="#ff9500"/><circle cx="16" cy="22" r="1.5" fill="#ff9500"/><circle cx="20" cy="22" r="1.5" fill="#ff9500"/>
              </svg>
            ),
            'PV-Wechselrichter': (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="8" fill="rgba(255,149,0,0.1)" stroke="#ff9500" strokeWidth="1.5">
                  <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="16" cy="16" r="4" fill="#ff9500"/>
                {[0,60,120,180,240,300].map((a,i) => (
                  <line key={i} x1="16" y1="16" x2={16+Math.cos(a*Math.PI/180)*14} y2={16+Math.sin(a*Math.PI/180)*14} stroke="rgba(255,149,0,0.4)" strokeWidth="1"/>
                ))}
              </svg>
            ),
            'Heimspeicher': (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="8" y="6" width="16" height="22" rx="3" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="1.5"/>
                <rect x="12" y="3" width="8" height="4" rx="2" fill="rgba(34,197,94,0.3)"/>
                <rect x="10" y="16" width="12" height="10" rx="2" fill="rgba(34,197,94,0.2)">
                  <animate attributeName="height" values="3;10;3" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="y" values="23;16;23" dur="3s" repeatCount="indefinite"/>
                </rect>
              </svg>
            ),
            'Wallbox': (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="4" width="20" height="24" rx="4" fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth="1.5"/>
                <rect x="10" y="8" width="12" height="8" rx="2" fill="rgba(59,130,246,0.15)"/>
                <text x="16" y="23" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="800">⚡</text>
              </svg>
            ),
          };
          return (
            <div
              key={card.label}
              style={{
                background: 'rgba(4,6,20,0.65)', border: `1px solid ${isConnected ? 'rgba(34,197,94,0.2)' : 'rgba(255,107,53,0.1)'}`,
                borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px',
                transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 48px rgba(255,107,53,0.12)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {svgIcons[card.label] || <span style={{ fontSize: 20 }}>{card.icon}</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15 }}>{card.label}</div>
                  <div style={{ fontSize: 11, color: isConnected ? '#22c55e' : 'rgba(248,250,252,0.35)', fontWeight: 600 }}>
                    {isConnected ? '● Online' : '○ Offline'}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: isConnected ? 'rgba(34,197,94,0.1)' : 'rgba(255,107,53,0.06)',
                  border: `1px solid ${isConnected ? 'rgba(34,197,94,0.3)' : 'rgba(255,107,53,0.15)'}`,
                  color: isConnected ? '#22c55e' : 'rgba(248,250,252,0.4)',
                }}>{isConnected ? '✓ Online' : 'Offline'}</span>
              </div>
              <p style={{ margin: '0 0 12px', color: 'rgba(248,250,252,0.55)', fontSize: 13, lineHeight: 1.5 }}>{card.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,149,0,0.7)', fontWeight: 600 }}>{card.protocol}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {card.steps.map((_, si) => (
                    <div key={si} style={{
                      width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isConnected ? 'rgba(34,197,94,0.15)' : si === 0 ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isConnected ? 'rgba(34,197,94,0.3)' : si === 0 ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      color: isConnected ? '#22c55e' : si === 0 ? '#ff9500' : 'rgba(248,250,252,0.3)',
                    }}>{isConnected ? '✓' : si + 1}</div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Overview */}
      <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', borderRadius: 2, marginBottom: 20 }}/>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#f8fafc', letterSpacing: 1 }}>Geräte-Status Übersicht</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12 }}>
          {[
            { value: connectedCount, label: 'Registriert', color: '#ff9500' },
            { value: activeCount, label: 'Verbunden', color: '#22c55e' },
            { value: '100%', label: 'Verfügbarkeit', color: '#3b82f6' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center', padding: '16px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color, marginBottom: 4 }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(248,250,252,0.45)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding */}
      <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ color: '#a78bfa', fontWeight: 700, margin: '0 0 8px', fontSize: 15 }}>Neues Gerät verbinden</h3>
            <p style={{ color: 'rgba(248,250,252,0.55)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Klicken Sie auf <strong style={{ color: '#a78bfa' }}>„Gerät hinzufügen"</strong> im Panel oben, um ein Smart Meter, PV-Wechselrichter, Heimspeicher oder eine Wallbox einzurichten. Unterstützte Protokolle: Modbus TCP, Cloud API, OCPP.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
            {['Gerät auswählen', 'Verbindung konfigurieren', 'Gerät registrieren'].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>{i+1}</div>
                <span style={{ fontSize: 13, color: 'rgba(248,250,252,0.65)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
