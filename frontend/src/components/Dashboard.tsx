import { useEffect, useRef, useState } from 'react';
import HistoryChart from './HistoryChart';
import EVProfileManager from "./EVProfileManager";
import PowerChart from "./PowerChart";
import DeviceManager from "./DeviceManager";
import CO2CostWidget from './CO2CostWidget';
import ErrorAlarmMonitor from './ErrorAlarmMonitor';
import BatteryWidget from './BatteryWidget';
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

const API_BASE = API_URL;
const WS_BASE = WS_URL;

export default function Dashboard() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [battery, setBattery] = useState({ soc: 50, power_kw: 0, capacity_kwh: 10 });
  const [wsStatus, setWsStatus] = useState<'connecting'|'live'|'offline'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
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
    let wsUrl = WS_BASE;

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
    let wsUrl2 = WS_BASE;
    const ws = new WebSocket(wsUrl2);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setData(data);
    };
    return () => ws.close();
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verbinde mit Backend...</p>
          <p className="text-xs text-gray-400 mt-2">WebSocket: {wsStatus}</p>
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
    <div className="min-h-screen bg-gray-50 p-5 space-y-3">
      <div className="flex flex-col items-center justify-center w-full mt-2 mb-6">
        <h1 className="text-sm font-bold text-gray-900 whitespace-nowrap text-center mb-2">KI-gestützte Energie- und Lademanagement-Plattform für E-Autos</h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium`} style={{marginTop: '-4px', color: wsStatus === 'live' ? '#16a34a' : '#111', background: wsStatus === 'live' ? '#e6fbe6' : '#f3f4f6'}}>
          {wsStatus === 'live' ? '● Live' : '● Offline'}
        </span>
      </div>

      {/* CO2 & Kosten Widget */}
      <CO2CostWidget co2SavedKg={123.4} costEur={56.78} autarky={87.6} period="Monat" />

      {/* Error/Alarm Monitor */}
      <ErrorAlarmMonitor />

      {/* Heimspeicher und Geräte ganz oben */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Heimspeicher</h2>
          <BatteryWidget data={battery} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Geräte</h2>
          <DeviceManager />
        </div>
      </div>

      {/* Charts darunter nur wenn echte Geräte */}
      {hasRealDevice ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <HistoryChart title="PV-Ertrag (24h)" endpoint="/history/pv" dataKey="PV (kW)" color="#10b981" />
            <HistoryChart title="Verbrauch (24h)" endpoint="/history/consumption" dataKey="Verbrauch (kW)" color="#3b82f6" />
          </div>
          <HistoryChart title="Batterie-SOC (24h)" endpoint="/history/battery" dataKey="SOC (%)" color="#f59e0b" />
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mt-6 text-center text-gray-500">
          <p>⚠️ Die Zeitreihen-Diagramme werden erst angezeigt, wenn mindestens ein echtes Gerät (Smart Meter, Inverter, Heimspeicher oder Wallbox) verbunden ist.</p>
        </div>
      )}

      <PowerChart />
    </div>
  );
}
