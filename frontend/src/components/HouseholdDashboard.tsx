
import { useEffect, useState } from 'react';
import SmartMeterEnergyWidget from './SmartMeterEnergyWidget';
import BatteryWidget from './BatteryWidget';
import { API_URL, WS_URL } from '../lib/api';

type State = {
  battery_soc?: number;
  battery_power_kw?: number;
  house_load_w?: number;
  [key: string]: unknown;
};

type SmartHomeDevicePayload = {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  power_w?: unknown;
  flexibility?: unknown;
  last_seen?: unknown;
  type?: unknown;
  source?: unknown;
};

type EvProfileSummary = {
  manufacturer: string;
  model: string;
  capacity_kwh: number;
};

type SmartHomeDevice = {
  id: string;
  name: string;
  status: 'aktiv' | 'standby' | 'offline';
  powerW: number;
  flexibility: 'hoch' | 'mittel' | 'niedrig';
  lastSeen?: string | null;
  type?: string;
  source?: string;
};

const SMART_HOME_DEVICE_FALLBACK: SmartHomeDevice[] = [
  { id: 'washing_machine', name: 'Waschmaschine', status: 'standby', powerW: 0, flexibility: 'hoch', source: 'fallback' },
  { id: 'light_groups', name: 'Lichtgruppen', status: 'standby', powerW: 0, flexibility: 'niedrig', source: 'fallback' },
];

const normalizeStatus = (value: unknown): SmartHomeDevice['status'] => {
  const v = String(value ?? '').toLowerCase();
  if (v === 'aktiv' || v === 'active' || v === 'on') return 'aktiv';
  if (v === 'offline' || v === 'error') return 'offline';
  return 'standby';
};

const normalizeFlexibility = (value: unknown): SmartHomeDevice['flexibility'] => {
  const v = String(value ?? '').toLowerCase();
  if (v === 'hoch' || v === 'high') return 'hoch';
  if (v === 'niedrig' || v === 'low') return 'niedrig';
  return 'mittel';
};

const HouseholdDashboard = () => {
  const [state, setState] = useState<State | null>(null);
  const [evProfile, setEvProfile] = useState<EvProfileSummary | null>(null);
  const [smartHomeDevices, setSmartHomeDevices] = useState<SmartHomeDevice[]>(SMART_HOME_DEVICE_FALLBACK);
  const [smartHomeSummary, setSmartHomeSummary] = useState<{ active_count: number; flexible_count: number; total_power_w: number } | null>(null);

  const activeSmartHomeDevices = smartHomeSummary?.active_count ?? smartHomeDevices.filter((d) => d.status === 'aktiv').length;
  const flexibleLoads = smartHomeSummary?.flexible_count ?? smartHomeDevices.filter((d) => d.flexibility === 'hoch').length;
  const smartHomePowerW = smartHomeSummary?.total_power_w ?? smartHomeDevices.reduce((sum, d) => sum + d.powerW, 0);

  useEffect(() => {
    if (!WS_URL) return;
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if ('house_load_w' in data) {
        setState(data);
      }
    };
    return () => ws.close();
  }, []);

  // Aktives EV-Profil laden, um die Batterie-Kapazität des verbundenen Fahrzeugs anzuzeigen
  useEffect(() => {
    const loadEvProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/ev/profiles`);
        if (!res.ok) return;
        const data = await res.json();
        const profiles = data.ev_profiles || {};
        const activeId = data.active_ev_id;
        if (activeId && profiles[activeId]) {
          const p = profiles[activeId];
          setEvProfile({
            manufacturer: p.manufacturer,
            model: p.model,
            capacity_kwh: p.capacity_kwh,
          });
        }
      } catch (e) {
        console.error('EV profile load error (HouseholdDashboard):', e);
      }
    };
    loadEvProfile();
  }, []);

  useEffect(() => {
    const loadSmartHomeDevices = async () => {
      try {
        const res = await fetch(`${API_URL}/smarthome/devices`);
        if (!res.ok) return;

        const data = await res.json();
        const incoming = Array.isArray(data.devices) ? data.devices : [];

        const mapped: SmartHomeDevice[] = incoming.map((device: SmartHomeDevicePayload) => ({
          id: String(device.id || device.name || Math.random()),
          name: String(device.name || device.id || 'SmartHome-Gerät'),
          status: normalizeStatus(device.status),
          powerW: Number(device.power_w ?? 0),
          flexibility: normalizeFlexibility(device.flexibility),
          lastSeen: device.last_seen ?? null,
          type: typeof device.type === 'string' ? device.type : undefined,
          source: typeof device.source === 'string' ? device.source : undefined,
        }));

        if (mapped.length > 0) {
          const existingIds = new Set(mapped.map((d) => d.id));
          const withFallback = [
            ...mapped,
            ...SMART_HOME_DEVICE_FALLBACK.filter((f) => !existingIds.has(f.id)),
          ];
          setSmartHomeDevices(withFallback);
        } else {
          setSmartHomeDevices(SMART_HOME_DEVICE_FALLBACK);
        }

        const summary = data.summary;
        if (summary) {
          setSmartHomeSummary({
            active_count: Number(summary.active_count ?? 0),
            flexible_count: Number(summary.flexible_count ?? 0),
            total_power_w: Number(summary.total_power_w ?? 0),
          });
        }
      } catch (e) {
        console.error('Smart home device load error:', e);
      }
    };

    loadSmartHomeDevices();
    const interval = window.setInterval(loadSmartHomeDevices, 10000);
    return () => window.clearInterval(interval);
  }, []);

  return (
  <div className="household-dashboard tab-content-full" style={{ width: '100%', maxWidth: '100%', margin: 0 }}>
      <div className="animate-fade-in">
        <h2 className="tab-page-title" style={{ marginBottom: 16 }}>Haushalt & Heimspeicher (Batterie)</h2>
        <p className="tab-page-subtitle">Echtzeit-Überblick für Hauslast, Speicherstatus und flexible Smarthome-Lasten im selben Steuerungsfenster.</p>
      </div>
      
      <div className="tab-grid-main animate-stagger-1 animate-page-enter" style={{ marginBottom: 24 }}>
        <div className="glass-effect" style={{ minWidth: 0, borderRadius: '12px', padding: '16px' }}>
          <SmartMeterEnergyWidget />
        </div>
        <div className="glass-effect" style={{ minWidth: 0, borderRadius: '12px', padding: '16px' }}>
          <BatteryWidget
            data={{
              soc: state?.battery_soc ?? 0,
              power_kw: state?.battery_power_kw ?? 0,
              capacity_kwh: 10
            }}
          />
          {evProfile && (
            <div className="animate-fade-in delay-300" style={{ marginTop: 8, fontSize: 13, color: '#94a3b8' }}>
              Verbundenes Elektroauto: {evProfile.manufacturer} {evProfile.model}
              {` 
· ${evProfile.capacity_kwh.toFixed(1)} kWh Batterie`}
            </div>
          )}
        </div>
      </div>

      {/* Smarthome Section */}
      <div className="glass-effect animate-stagger-2 animate-page-enter" style={{ background: 'rgba(15,23,42,0.78)', borderRadius: 12, padding: 20, marginTop: 16, border: '1px solid rgba(148,163,184,0.22)' }}>
        <h3 className="tab-section-title neon-glow">IoT & Smarthome-Orchestrierung</h3>
        
        <div className="tab-grid-compact animate-stagger-3 animate-page-enter" style={{ marginBottom: 14 }}>
          <div className="metric-card clickable" style={{ background: 'rgba(2,6,23,0.74)', borderRadius: 8, padding: 12, border: '1px solid rgba(71,85,105,0.45)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Aktive IoT-Geräte</div>
            <div className="value-increase" style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{activeSmartHomeDevices}</div>
          </div>
          <div className="metric-card clickable" style={{ background: 'rgba(2,6,23,0.74)', borderRadius: 8, padding: 12, border: '1px solid rgba(71,85,105,0.45)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Verschiebbare Lasten</div>
            <div className="value-increase" style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{flexibleLoads}</div>
          </div>
          <div className="metric-card clickable" style={{ background: 'rgba(2,6,23,0.74)', borderRadius: 8, padding: 12, border: '1px solid rgba(71,85,105,0.45)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Smarthome-Leistung</div>
            <div className="value-increase" style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>{smartHomePowerW} W</div>
          </div>
        </div>

        <div className="animate-stagger-4 animate-page-enter" style={{ background: 'rgba(2,6,23,0.7)', borderRadius: 8, padding: 14, marginBottom: 12, border: '1px solid rgba(71,85,105,0.4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>💡 Empfohlene Automationen</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#cbd5e1' }}>
            <li>Wärmepumpe bevorzugt bei PV-Überschuss &gt; 1.5 kW laufen lassen.</li>
            <li>Waschmaschine automatisch in Zeitfenster mit niedrigem Börsenpreis verschieben.</li>
            <li>Wallbox nur bei SOC &lt; 35% priorisieren, sonst Haushaltslast glätten.</li>
          </ul>
        </div>

        <div className="tab-grid-compact" style={{ gap: 10 }}>
          {smartHomeDevices.map((device, index) => (
            <div 
              key={device.id} 
              className={`device-card clickable animate-scale-in delay-${Math.min(index, 5) * 100}`}
              style={{ 
                background: 'rgba(2,6,23,0.74)', 
                borderRadius: 8, 
                padding: 12, 
                border: '1px solid rgba(71,85,105,0.45)',
                opacity: 0
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <b style={{ color: '#f8fafc' }}>{device.name}</b>
                <span className={device.status === 'aktiv' ? 'status-live' : device.status === 'standby' ? 'status-connecting' : 'status-offline'} style={{ color: device.status === 'aktiv' ? '#22c55e' : device.status === 'standby' ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                  <span className={`status-dot ${device.status === 'aktiv' ? 'status-live' : device.status === 'standby' ? 'status-connecting' : 'status-offline'}`}></span>
                  {device.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>Aktuelle Last: <strong>{device.powerW} W</strong></div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>Flexibilität: <span style={{ color: device.flexibility === 'hoch' ? '#22c55e' : device.flexibility === 'mittel' ? '#f59e0b' : '#94a3b8' }}>{device.flexibility}</span></div>
              {device.lastSeen && (
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Letztes Update: {new Date(device.lastSeen).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HouseholdDashboard;
