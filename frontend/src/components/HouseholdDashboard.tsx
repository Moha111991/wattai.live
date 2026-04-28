
import { useEffect, useState } from 'react';
import SmartMeterEnergyWidget from './SmartMeterEnergyWidget';
import BatteryWidget from './BatteryWidget';
import { API_URL, WS_URL } from '../lib/api';

type State = {
  battery_soc?: number;
  battery_power_kw?: number;
  house_load_w?: number;
  [key: string]: any;
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

        const mapped: SmartHomeDevice[] = incoming.map((device: any) => ({
          id: String(device.id || device.name || Math.random()),
          name: String(device.name || device.id || 'SmartHome-Gerät'),
          status: normalizeStatus(device.status),
          powerW: Number(device.power_w ?? 0),
          flexibility: normalizeFlexibility(device.flexibility),
          lastSeen: device.last_seen ?? null,
          type: device.type,
          source: device.source,
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
    <div className="household-dashboard" style={{maxWidth: 700, margin: '0 auto'}}>
      <h2 style={{fontSize: 24, fontWeight: 700, marginBottom: 16}}>Haushalt & Heimspeicher (Batterie)</h2>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 24}}>
        <div style={{flex: 1, minWidth: 320}}>
          <SmartMeterEnergyWidget />
        </div>
        <div style={{flex: 1, minWidth: 320}}>
          <BatteryWidget
            data={{
              soc: state?.battery_soc ?? 0,
              power_kw: state?.battery_power_kw ?? 0,
              capacity_kwh: 10
            }}
          />
          {evProfile && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#555' }}>
              Verbundenes Elektroauto: {evProfile.manufacturer} {evProfile.model}
              {` 
· ${evProfile.capacity_kwh.toFixed(1)} kWh Batterie`}
            </div>
          )}
        </div>
      </div>

      {/* Smarthome Section */}
      <div style={{ background: '#f3f4f6', borderRadius: 10, padding: 20, marginTop: 16 }}>
        <h3 style={{ fontSize: 20, marginBottom: 12 }}>IoT & Smarthome-Orchestrierung</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Aktive IoT-Geräte</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{activeSmartHomeDevices}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Verschiebbare Lasten</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{flexibleLoads}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Smarthome-Leistung</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{smartHomePowerW} W</div>
          </div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Empfohlene Automationen</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#374151' }}>
            <li>Wärmepumpe bevorzugt bei PV-Überschuss &gt; 1.5 kW laufen lassen.</li>
            <li>Waschmaschine automatisch in Zeitfenster mit niedrigem Börsenpreis verschieben.</li>
            <li>Wallbox nur bei SOC &lt; 35% priorisieren, sonst Haushaltslast glätten.</li>
          </ul>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {smartHomeDevices.map((device) => (
            <div key={device.id} style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <b>{device.name}</b>
                <span style={{ color: device.status === 'aktiv' ? '#15803d' : device.status === 'standby' ? '#6b7280' : '#b91c1c' }}>
                  {device.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Aktuelle Last: {device.powerW} W</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Flexibilität: {device.flexibility}</div>
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
