import { useEffect, useState } from 'react';
import DeviceManager from './DeviceManager';
import { API_URL } from '../lib/api';

interface DeviceSummary {
  type?: string;
}

export default function DevicesDashboard() {
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Geräte-Liste laden
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

  return (
    <div className="tab-content animate-page-enter">
      <div className="tab-modern-card glass-effect animate-stagger-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div className="status-dot status-dot-pulse"></div>
          <h2 className="tab-section-title neon-glow" style={{ margin: 0 }}>
            Verbundene Geräte
          </h2>
          <span className="badge-count">{devices.length}</span>
        </div>
        
        <DeviceManager />
      </div>

      {/* Info-Karten */}
      <div className="tab-grid-main mt-6">
        <div className="tab-modern-card glass-effect animate-stagger-2 clickable-card">
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#67e8f9' }}>
            📡 Smart Meter
          </h3>
          <p style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Intelligente Stromzähler erfassen Ihren Energieverbrauch in Echtzeit und ermöglichen präzise Analysen.
          </p>
        </div>

        <div className="tab-modern-card glass-effect animate-stagger-3 clickable-card delay-100">
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#34d399' }}>
            ☀️ PV-Wechselrichter
          </h3>
          <p style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Wandelt Gleichstrom aus Solarmodulen in Wechselstrom um und optimiert den Eigenverbrauch.
          </p>
        </div>

        <div className="tab-modern-card glass-effect animate-stagger-4 clickable-card delay-200">
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#fbbf24' }}>
            🔋 Heimspeicher
          </h3>
          <p style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Speichert überschüssige Solarenergie für die Nutzung in den Abend- und Nachtstunden.
          </p>
        </div>

        <div className="tab-modern-card glass-effect animate-stagger-5 clickable-card delay-300">
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#a78bfa' }}>
            ⚡ Wallbox
          </h3>
          <p style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Intelligente Ladestation für Elektrofahrzeuge mit dynamischer Laststeuerung und PV-Überschussladen.
          </p>
        </div>
      </div>

      {/* Geräte-Status Übersicht */}
      <div className="tab-modern-card glass-effect animate-stagger-6 delay-400 mt-6">
        <h3 className="tab-section-title mb-4 neon-glow">Geräte-Status Übersicht</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="metric-card">
            <div className="metric-value animated-metric value-increase">
              {devices.length}
            </div>
            <div className="metric-label">Verbunden</div>
          </div>
          <div className="metric-card">
            <div className="metric-value animated-metric" style={{ color: '#34d399' }}>
              {devices.filter(d => d.type !== 'unknown').length}
            </div>
            <div className="metric-label">Aktiv</div>
          </div>
          <div className="metric-card">
            <div className="metric-value animated-metric" style={{ color: '#67e8f9' }}>
              100%
            </div>
            <div className="metric-label">Verfügbarkeit</div>
          </div>
        </div>
      </div>

      {/* Hilfe-Sektion */}
      <div className="tab-modern-card glass-effect animate-stagger-7 delay-500 mt-6" 
           style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: '#a78bfa' }}>
          💡 Gerät hinzufügen
        </h3>
        <p style={{ color: 'rgba(226, 232, 240, 0.8)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem' }}>
          Um ein neues Gerät hinzuzufügen, gehen Sie zu den Einstellungen und wählen Sie "Gerät hinzufügen". 
          Folgen Sie den Anweisungen für Ihr spezifisches Gerät.
        </p>
        <button className="btn-primary" style={{ 
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid rgba(139, 92, 246, 0.5)',
          background: 'rgba(139, 92, 246, 0.1)',
          color: '#a78bfa',
          cursor: 'pointer',
          fontSize: '0.95rem',
          transition: 'all 0.3s ease'
        }}>
          + Gerät hinzufügen
        </button>
      </div>
    </div>
  );
}
