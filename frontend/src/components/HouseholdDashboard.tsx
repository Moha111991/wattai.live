
import { useEffect, useState } from 'react';
import SmartMeterEnergyWidget from './SmartMeterEnergyWidget';
import BatteryWidget from './BatteryWidget';
import PlanGate from './PlanGate';
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
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '0 0 40px', background: 'transparent' }}>
      <style>{`
        @keyframes hh-room { 0%,100%{opacity:.3}50%{opacity:.7} }
        @keyframes hh-flow { to{stroke-dashoffset:-20} }
      `}</style>

      {/* Cinematic Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* House SVG scene */}
        <div style={{ flexShrink: 0 }}>
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            {/* House outline */}
            <rect x="30" y="46" width="100" height="52" rx="3" fill="rgba(4,6,20,0.9)" stroke="rgba(255,107,53,0.3)" strokeWidth="1.5"/>
            <polygon points="30,46 80,14 130,46" fill="rgba(4,6,20,0.8)" stroke="rgba(255,107,53,0.45)" strokeWidth="1.5"/>
            {/* Rooms */}
            <rect x="34" y="50" width="38" height="24" rx="2" fill="rgba(255,107,53,0.06)" stroke="rgba(255,107,53,0.2)" strokeWidth="1">
              <animate attributeName="fill-opacity" values="0.06;0.15;0.06" dur="3s" repeatCount="indefinite"/>
            </rect>
            <rect x="76" y="50" width="50" height="24" rx="2" fill="rgba(59,130,246,0.06)" stroke="rgba(59,130,246,0.2)" strokeWidth="1">
              <animate attributeName="fill-opacity" values="0.06;0.15;0.06" dur="4s" repeatCount="indefinite"/>
            </rect>
            <rect x="34" y="78" width="38" height="16" rx="2" fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.2)" strokeWidth="1"/>
            {/* Door */}
            <rect x="68" y="78" width="24" height="20" rx="2" fill="rgba(4,6,20,0.8)" stroke="rgba(255,107,53,0.3)" strokeWidth="1"/>
            {/* Energy bar on roof */}
            <rect x="44" y="30" width="8" height="5" rx="1" fill="#ff9500" opacity="0.7"/>
            <rect x="56" y="26" width="8" height="5" rx="1" fill="#ff9500" opacity="0.8"/>
            <rect x="68" y="23" width="8" height="5" rx="1" fill="#ff9500"/>
            {/* Power line */}
            <line x1="130" y1="46" x2="155" y2="30" stroke="rgba(59,130,246,0.4)" strokeWidth="1.2" strokeDasharray="4 3">
              <animate attributeName="stroke-dashoffset" values="0;-20" dur="1.5s" repeatCount="indefinite"/>
            </line>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff9500', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Haushalt</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            Haushalt &amp; Heimspeicher
          </h2>
          <p style={{ margin: 0, color: 'rgba(248,250,252,0.52)', fontSize: 14, lineHeight: 1.5 }}>
            Echtzeit-Überblick für Hauslast, Speicherstatus und flexible Smarthome-Lasten.
          </p>
        </div>
      </div>

      {/* Main grid: SmartMeter + Battery */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#ff6b35,#ff9500)', borderRadius: 2, marginBottom: 16 }}/>
          <SmartMeterEnergyWidget />
        </div>
        <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px' }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#3b82f6,#ff9500)', borderRadius: 2, marginBottom: 16 }}/>
          <BatteryWidget data={{ soc: state?.battery_soc ?? 0, power_kw: state?.battery_power_kw ?? 0, capacity_kwh: 10 }} />
          {evProfile && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(248,250,252,0.45)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
              Verbundenes EV: {evProfile.manufacturer} {evProfile.model} · {evProfile.capacity_kwh.toFixed(1)} kWh
            </div>
          )}
        </div>
      </div>

      {/* Smart Home Section */}
      <PlanGate feature="smarthome.automation" featureName="Smart-Home-Automatisierungen" requiredPlan="pro">
        <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#ff6b35,#a78bfa,#3b82f6)', borderRadius: 2, marginBottom: 20 }}/>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#f8fafc', letterSpacing: 1 }}>IoT &amp; Smarthome-Orchestrierung</h3>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { value: activeSmartHomeDevices, label: 'Aktive IoT-Geräte', color: '#ff9500' },
              { value: flexibleLoads, label: 'Verschiebbare Lasten', color: '#22c55e' },
              { value: `${smartHomePowerW} W`, label: 'Smarthome-Leistung', color: '#3b82f6' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: m.color, marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(248,250,252,0.4)', letterSpacing: 0.5 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Automation hints */}
          <div style={{ background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#f8fafc', fontSize: 13 }}>Empfohlene Automationen</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(248,250,252,0.6)', fontSize: 13, lineHeight: 1.8 }}>
              <li>Wärmepumpe bevorzugt bei PV-Überschuss &gt; 1.5 kW laufen lassen.</li>
              <li>Waschmaschine automatisch in Zeitfenster mit niedrigem Börsenpreis verschieben.</li>
              <li>Wallbox nur bei SOC &lt; 35% priorisieren, sonst Haushaltslast glätten.</li>
            </ul>
          </div>

          {/* Device cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            {smartHomeDevices.map((device) => (
              <div key={device.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, transition: 'border-color 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <b style={{ color: '#f8fafc', fontSize: 13 }}>{device.name}</b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: device.status === 'aktiv' ? '#22c55e' : device.status === 'standby' ? '#f59e0b' : '#ef4444' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: device.status === 'aktiv' ? '#22c55e' : device.status === 'standby' ? '#f59e0b' : '#ef4444', display: 'inline-block', boxShadow: device.status === 'aktiv' ? '0 0 6px #22c55e' : 'none' }}/>
                    {device.status}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(248,250,252,0.5)', marginBottom: 4 }}>Last: <strong style={{ color: '#f8fafc' }}>{device.powerW} W</strong></div>
                <div style={{ fontSize: 12, color: 'rgba(248,250,252,0.5)' }}>Flexibilität: <span style={{ color: device.flexibility === 'hoch' ? '#22c55e' : device.flexibility === 'mittel' ? '#f59e0b' : 'rgba(248,250,252,0.35)', fontWeight: 600 }}>{device.flexibility}</span></div>
                {device.lastSeen && (
                  <div style={{ fontSize: 11, color: 'rgba(248,250,252,0.3)', marginTop: 6 }}>
                    {new Date(device.lastSeen).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PlanGate>
    </div>
  );
};

export default HouseholdDashboard;
