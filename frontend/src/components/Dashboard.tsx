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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#020617 0%,#04060e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: 'rgba(4,6,20,0.72)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 20, padding: '48px 40px', backdropFilter: 'blur(16px)' }}>
          {/* Animated energy ring */}
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ display: 'block', margin: '0 auto 20px' }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,107,53,0.15)" strokeWidth="4"/>
            <circle cx="32" cy="32" r="28" fill="none" stroke="#ff6b35" strokeWidth="4" strokeDasharray="40 136" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="32" cy="32" r="8" fill="rgba(255,149,0,0.3)">
              <animate attributeName="r" values="6;10;6" dur="1.8s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <p style={{ color: '#f8fafc', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Verbinde mit Backend...</p>
          <p style={{ color: 'rgba(248,250,252,0.42)', fontSize: 13, margin: 0 }}>WebSocket: {wsStatus}</p>
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
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '0 0 40px', background: 'transparent' }}>
      <style>{`
        @keyframes dash-flow { to { stroke-dashoffset: -40; } }
        @keyframes node-pulse { 0%,100%{opacity:.5;r:5} 50%{opacity:1;r:7} }
        @keyframes db-breathe { 0%,100%{opacity:.7} 50%{opacity:1} }
      `}</style>

      {/* Cinematic Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* Energy Flow SVG Scene */}
        <div style={{ flexShrink: 0 }}>
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            {/* Sun */}
            <circle cx="20" cy="30" r="12" fill="rgba(255,149,0,0.15)" stroke="#ff9500" strokeWidth="1.5">
              <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="20" cy="30" r="6" fill="#ff9500"/>
            {/* House */}
            <rect x="62" y="42" width="36" height="30" rx="3" fill="rgba(4,6,20,0.8)" stroke="rgba(255,107,53,0.4)" strokeWidth="1.5"/>
            <polygon points="62,42 80,24 98,42" fill="rgba(255,107,53,0.1)" stroke="rgba(255,107,53,0.5)" strokeWidth="1.5"/>
            {/* Battery */}
            <rect x="122" y="38" width="24" height="34" rx="4" fill="rgba(4,6,20,0.8)" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5"/>
            <rect x="130" y="34" width="8" height="5" rx="2" fill="rgba(59,130,246,0.4)"/>
            <rect x="124" y="55" width="20" height="14" rx="2" fill="rgba(59,130,246,0.2)">
              <animate attributeName="height" values="4;14;4" dur="4s" repeatCount="indefinite"/>
              <animate attributeName="y" values="65;55;65" dur="4s" repeatCount="indefinite"/>
            </rect>
            {/* Flow lines */}
            <line x1="32" y1="30" x2="62" y2="46" stroke="#ff9500" strokeWidth="1.5" strokeDasharray="6 4">
              <animate attributeName="stroke-dashoffset" values="0;-40" dur="1.2s" repeatCount="indefinite"/>
            </line>
            <line x1="98" y1="57" x2="122" y2="57" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 4">
              <animate attributeName="stroke-dashoffset" values="0;-40" dur="1.4s" repeatCount="indefinite"/>
            </line>
            {/* Particles */}
            <circle r="3" fill="#ff9500" opacity="0.9">
              <animateMotion dur="1.4s" repeatCount="indefinite" path="M32,30 L62,46"/>
            </circle>
            <circle r="3" fill="#3b82f6" opacity="0.9">
              <animateMotion dur="1.6s" repeatCount="indefinite" path="M98,57 L122,57"/>
            </circle>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff9500', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Live Dashboard</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            KI-gestützte Energie- &amp; Lademanagement-Plattform
          </h1>
          <p style={{ margin: '0 0 12px', color: 'rgba(248,250,252,0.52)', fontSize: 14, lineHeight: 1.5 }}>
            Live-Status, Lastmanagement und Energieflussanalyse in einer einheitlichen Steuerungsoberfläche.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px',
            borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: wsStatus === 'live' ? 'rgba(34,197,94,0.1)' : wsStatus === 'connecting' ? 'rgba(251,191,36,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${wsStatus === 'live' ? 'rgba(34,197,94,0.4)' : wsStatus === 'connecting' ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: wsStatus === 'live' ? '#22c55e' : wsStatus === 'connecting' ? '#fbbf24' : '#ef4444',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: wsStatus === 'live' ? '#22c55e' : wsStatus === 'connecting' ? '#fbbf24' : '#ef4444',
              boxShadow: wsStatus === 'live' ? '0 0 8px #22c55e' : 'none',
              animation: wsStatus === 'live' ? 'db-breathe 2s ease-in-out infinite' : 'none',
              display: 'inline-block'
            }}/>
            {wsStatus === 'live' ? 'Live' : wsStatus === 'connecting' ? 'Verbinde...' : 'Offline'}
          </div>
        </div>
      </div>

      {/* CO2 & Kosten Widget */}
      <div style={{ marginBottom: 16 }}>
        <CO2CostWidget co2SavedKg={123.4} costEur={56.78} autarky={87.6} period="Monat" />
      </div>

      {/* Error/Alarm Monitor */}
      <div style={{ marginBottom: 16 }}>
        <ErrorAlarmMonitor />
      </div>

      {/* Animated Energy Flow */}
      <div style={{ marginBottom: 16 }}>
        <AnimatedEnergyFlow
          pvPower={data.pv_power_kw}
          housePower={data.house_load_w / 1000}
          batteryPower={battery.power_kw}
          gridPower={(data.grid_import_w - data.grid_export_w) / 1000}
          evPower={data.ev_power_w / 1000}
        />
      </div>

      {/* Heimspeicher */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{
          background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)',
          borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px',
          width: '100%', maxWidth: 680, color: '#e2e8f0',
        }}>
          <div style={{ height: 2, background: 'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', borderRadius: 2, marginBottom: 16 }}/>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#f8fafc', letterSpacing: 1 }}>Heimspeicher</h2>
          <BatteryWidget data={battery} />
        </div>
      </div>

      {/* Charts */}
      {hasRealDevice ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 16 }}>
            <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px' }}>
              <HistoryChart title="PV-Ertrag (24h)" endpoint="/history/pv" dataKey="PV (kW)" color="#10b981" />
            </div>
            <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px' }}>
              <HistoryChart title="Verbrauch (24h)" endpoint="/history/consumption" dataKey="Verbrauch (kW)" color="#3b82f6" />
            </div>
          </div>
          <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px', marginBottom: 16 }}>
            <HistoryChart title="Batterie-SOC (24h)" endpoint="/history/battery" dataKey="SOC (%)" color="#f59e0b" />
          </div>
        </>
      ) : (
        <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px', marginBottom: 16, textAlign: 'center', color: 'rgba(254,243,199,0.9)' }}>
          <p style={{ margin: 0 }}>⚠️ Die Zeitreihen-Diagramme werden erst angezeigt, wenn mindestens ein echtes Gerät (Smart Meter, Inverter, Heimspeicher oder Wallbox) verbunden ist.</p>
        </div>
      )}

      <div style={{ background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)', borderRadius: 20, backdropFilter: 'blur(12px)', padding: '20px 24px' }}>
        <PowerChart />
      </div>
    </div>
  );
}
