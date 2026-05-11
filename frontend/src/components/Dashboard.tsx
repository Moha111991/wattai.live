import { useEffect, useRef, useState } from 'react';
import HistoryChart from './HistoryChart';
import PowerChart from "./PowerChart";
import CO2CostWidget from './CO2CostWidget';
import ErrorAlarmMonitor from './ErrorAlarmMonitor';
import BatteryWidget from './BatteryWidget';
import AnimatedEnergyFlow from './AnimatedEnergyFlow';
import { API_URL, WS_URL } from '../lib/api';

interface RealtimeData {
  pv_power_kw: number;
  house_load_w: number;
  ev_power_w: number;
  ev_soc: number;
  grid_import_w: number;
  grid_export_w: number;
  timestamp: string;
  battery_soc?: number;
  battery_power_kw?: number;
}

interface DeviceSummary {
  type?: string;
}

const API_BASE = API_URL;
const WS_BASE = WS_URL;

export default function Dashboard() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [battery, setBattery] = useState({ soc: 50, power_kw: 0, capacity_kwh: 10 });
  const [wsStatus, setWsStatus] = useState<'connecting'|'live'|'offline'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  // Geräte-Liste laden (nur einmal beim Mount)
  useEffect(() => {
    fetch(`${API_BASE}/devices`, {
      headers: {
        'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        setDevices(data.devices || []);
      });
  }, []);

  useEffect(() => {
    // Use ngrok WebSocket URL
    const wsUrl = WS_BASE;

    const connect = () => {
      if (wsRef.current) return;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setWsStatus('live');

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === 'realtime_update') {
            setData(msg);
            if (msg.battery_soc !== undefined) {
              setBattery({
                soc: msg.battery_soc,
                power_kw: msg.battery_power_kw,
                capacity_kwh: 10,
              });
            }
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      ws.onerror = () => {
        setWsStatus('offline');
        ws.close();
      };

      ws.onclose = () => {
        setWsStatus('offline');
        wsRef.current = null;
        if (!reconnectRef.current) {
          reconnectRef.current = setTimeout(connect, 3000);
        }
      };
    };

    connect();

    // Fallback: Battery-HTTP-Poll
    const poll = async () => {
      try {
        const r = await fetch(`${API_BASE}/battery/status`);
        if (r.ok) setBattery(await r.json());
      } catch {}
    };
    const id = setInterval(poll, 5000);
    poll();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    // Use ngrok WebSocket URL for second connection
    const wsUrl2 = WS_BASE;
    const ws = new WebSocket(wsUrl2);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setData(data);
    };
    return () => ws.close();
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center animate-fade-in">
        <div className="text-center glass-effect p-8 rounded-2xl">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-cyan-100 neon-glow text-lg">Verbinde mit Backend...</p>
          <p className="text-xs text-cyan-100/70 mt-2 animate-pulse">WebSocket: {wsStatus}</p>
        </div>
      </div>
    );
  }

  // Prüfen, ob mindestens ein echtes Gerät vorhanden ist
  const hasRealDevice = devices.some(dev => {
    const t = (dev.type || '').toLowerCase();
    return t.includes('smart meter') || t.includes('inverter') || t.includes('battery') || t.includes('wallbox');
  });

  return (
  <div className="tab-content-full w-full bg-transparent p-2 md:p-4 space-y-4">
      <div className="flex flex-col items-start justify-center w-full mt-2 mb-6 animate-fade-in">
        <h1 className="tab-page-title" style={{ marginBottom: 8 }}>
          KI-gestützte Energie- und Lademanagement-Plattform für E-Autos
        </h1>
        <p className="tab-page-subtitle">
          Live-Status, Lastmanagement und Energieflussanalyse in einer einheitlichen Steuerungsoberfläche.
        </p>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${wsStatus === 'live' ? 'status-live' : ''}`} style={{marginTop: '-2px', color: wsStatus === 'live' ? '#16a34a' : '#e2e8f0', background: wsStatus === 'live' ? '#dcfce7' : 'rgba(15,23,42,0.72)', border: wsStatus === 'live' ? '1px solid #86efac' : '1px solid rgba(148,163,184,0.35)'}}>
          <span className={`status-dot ${wsStatus === 'live' ? 'status-live' : wsStatus === 'connecting' ? 'status-connecting' : 'status-offline'}`}></span>
          {wsStatus === 'live' ? 'Live' : wsStatus === 'connecting' ? 'Verbinde...' : 'Offline'}
        </span>
      </div>

      {/* CO2 & Kosten Widget */}
      <div className="animate-stagger-1 animate-page-enter">
        <CO2CostWidget co2SavedKg={123.4} costEur={56.78} autarky={87.6} period="Monat" />
      </div>

      {/* Error/Alarm Monitor */}
      <div className="animate-stagger-2 animate-page-enter">
        <ErrorAlarmMonitor />
      </div>

      {/* Animierter Energiefluss */}
      <div className="animate-stagger-3 animate-page-enter">
        <AnimatedEnergyFlow
          pvPower={data.pv_power_kw}
          housePower={data.house_load_w / 1000}
          batteryPower={battery.power_kw}
          gridPower={(data.grid_import_w - data.grid_export_w) / 1000}
          evPower={data.ev_power_w / 1000}
        />
      </div>

      {/* Heimspeicher */}
      <div className="mt-6 flex justify-center">
        <div className="tab-modern-card animate-stagger-4 animate-page-enter glass-effect w-full max-w-2xl" style={{ color: '#e2e8f0' }}>
          <h2 className="tab-section-title">Heimspeicher</h2>
          <BatteryWidget data={battery} />
        </div>
      </div>

      {/* Charts darunter nur wenn echte Geräte */}
      {hasRealDevice ? (
        <>
          <div className="tab-grid-main mt-6">
            <div className="tab-modern-card animate-stagger-5 animate-page-enter chart-container">
              <HistoryChart title="PV-Ertrag (24h)" endpoint="/history/pv" dataKey="PV (kW)" color="#10b981" />
            </div>
            <div className="tab-modern-card animate-stagger-5 animate-page-enter chart-container delay-100">
              <HistoryChart title="Verbrauch (24h)" endpoint="/history/consumption" dataKey="Verbrauch (kW)" color="#3b82f6" />
            </div>
          </div>
          <div className="tab-modern-card animate-stagger-5 animate-page-enter chart-container delay-200">
            <HistoryChart title="Batterie-SOC (24h)" endpoint="/history/battery" dataKey="SOC (%)" color="#f59e0b" />
          </div>
        </>
      ) : (
        <div className="tab-modern-card mt-6 text-center animate-pulse" style={{ border: '1px solid rgba(251, 191, 36, 0.34)', color: 'rgba(254, 243, 199, 0.92)' }}>
          <p>⚠️ Die Zeitreihen-Diagramme werden erst angezeigt, wenn mindestens ein echtes Gerät (Smart Meter, Inverter, Heimspeicher oder Wallbox) verbunden ist.</p>
        </div>
      )}

      <div className="animate-stagger-5 animate-page-enter delay-300">
        <PowerChart />
      </div>
    </div>
  );
}
