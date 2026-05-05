
import { useEffect, useState, useCallback, useRef } from "react";
import SmartMeterConnectDialog from "./components/SmartMeterConnectDialog";
import ConsumerProfileSelector from "./components/ConsumerProfileSelector";
import ConsumerProfileDetails from "./components/ConsumerProfileDetails";
import type { ConsumerProfile } from "./components/ConsumerProfileSelector";
import CO2CostWidget from "./components/CO2CostWidget";
import ErrorAlarmMonitor from "./components/ErrorAlarmMonitor";
import InverterSelector from "./components/InverterSelector";
import type { InverterOption } from "./components/InverterSelector";
import InverterConnectDialog from "./components/InverterConnectDialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./styles/styles.css";
import RecommendationCard from "./components/RecommendationCard";
import DeviceManager from "./components/DeviceManager";
import OnboardingWizard from "./components/OnboardingWizard";
import EVProfileManager from "./components/EVProfileManager";

// Statt location.host:
const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const API_URL = import.meta.env.VITE_API_URL || (isLocalHost ? "http://localhost:8000" : window.location.origin);
const WS_URL = API_URL ? `${API_URL.replace(/^http/, 'ws')}/ws` : null;

interface RealtimeData {
  ev_soc: number;
  ev_charging: boolean;
  ev_v2h: boolean;
  ev_power_kw: number;
  home_battery_soc: number;
  pv_power_kw: number;
  pv_today_kwh: number;
  grid_import_w: number;
  grid_export_w: number;
}

interface AIRecommendation {
  action: string;
  reason: string;
  priority: string;
  estimated_savings_eur: number;
  co2_saved_kg: number;
}

interface HistoryPoint {
  hour: string;
  power_kw?: number;
  consumption_kw?: number;
}

interface ReportData {
  co2_saved_kg: number;
  cost_eur: number;
  autarky: number;
  period?: string;
  co2_last_year?: number;
  cost_last_year?: number;
}

interface BackendConsumptionPoint {
  time: string;
  value: number;
}

interface EnergyAction {
  explanation?: string;
  ev_charge_rate?: number;
  battery_charge_enable?: boolean;
  battery_discharge_enable?: boolean;
  grid_import?: number;
  grid_export?: number;
  confidence?: number;
}

interface EVProfile {
  id: number;
  manufacturer: string;
  model: string;
  active?: boolean;
}

interface InverterData {
  error?: string;
  [key: string]: unknown;
}

interface HistoryApiPoint {
  time: string;
  value: number;
}

export default function DashboardSimple() {
  // KI-Optimierung
  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const payload = {
        pv_power: (data && data.pv_power_kw) ?? 0,
        battery_soc: (data && data.home_battery_soc) ?? 0,
        ev_soc: (data && data.ev_soc) ?? 0,
        household_load: (data && data.grid_import_w) ? data.grid_import_w / 1000 : 1.0,
        grid_price: 0.28,
        hour: new Date().getHours(),
        temperature: 20
      };
      const res = await fetch(`${API_URL}/energy/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      setEnergyAction(result);
    } catch {
      setEnergyAction({ explanation: "Fehler bei KI-Optimierung" });
    }
    setOptimizing(false);
  };
  // Fehlende State-Hooks ergänzen
  const [smartMeterConnected, setSmartMeterConnected] = useState(false);
  const [smartMeterParams, setSmartMeterParams] = useState<Record<string, unknown> | null>(null);
  const [selectedConsumer, setSelectedConsumer] = useState<ConsumerProfile | null>(null);
  const [consumerSoc, setConsumerSoc] = useState(80); // Beispielwert
  const [consumerCycles, setConsumerCycles] = useState(120); // Beispielwert
  const [backendProfile, setBackendProfile] = useState<Partial<ConsumerProfile> | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // CO2/Kosten/Autarkie regelmäßig laden
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API_URL}/reporting/co2_costs?period=Monat`, {
          headers: { 'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE' }
        });
        const json = await res.json();
        setReportData(json);
      } catch {
        // Fehler ignorieren, Widget bleibt leer
      }
    };
    fetchReport();
    const interval = setInterval(fetchReport, 60000); // alle 60s
    return () => clearInterval(interval);
  }, []);
  const [backendConsumption, setBackendConsumption] = useState<BackendConsumptionPoint[]>([]);
  const [energyAction, setEnergyAction] = useState<EnergyAction | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [data, setData] = useState<RealtimeData | null>(null);
  const [aiRec, setAiRec] = useState<AIRecommendation | null>(null);
  const [pvHistory, setPvHistory] = useState<HistoryPoint[]>([]);
  const [consumptionHistory, setConsumptionHistory] = useState<HistoryPoint[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("onboarding_completed")
  );
  const [evProfiles, setEvProfiles] = useState<EVProfile[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  // Wechselrichter-Auswahl und Verbindung
  const [selectedInverter, setSelectedInverter] = useState<InverterOption | null>(null);
  const [inverterConnected, setInverterConnected] = useState(false);
  const [inverterParams, setInverterParams] = useState<Record<string, unknown> | null>(null);
  const [inverterData, setInverterData] = useState<InverterData | null>(null);

  // WebSocket Connection
  useEffect(() => {
    if (!WS_URL) {
      setConnected(false);
      setError("VITE_API_URL fehlt (kein Backend konfiguriert)");
      return;
    }

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          setConnected(true);
          setError("");
        };

        ws.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);

            if (raw.type === "realtime_update" || raw.type === "state") {
              // Fallbacks/Normalisierung
              const evPowerKw =
                typeof raw.ev_power_kw === "number"
                  ? raw.ev_power_kw
                  : typeof raw.ev_power_w === "number"
                  ? raw.ev_power_w / 1000
                  : 0;

              const pvPowerKw =
                typeof raw.pv_power_kw === "number"
                  ? raw.pv_power_kw
                  : typeof raw.pv_power_w === "number"
                  ? raw.pv_power_w / 1000
                  : 0;

              const homeBatterySoc =
                typeof raw.home_battery_soc === "number"
                  ? raw.home_battery_soc
                  : typeof raw.battery_soc === "number"
                  ? raw.battery_soc
                  : 0;

              setData({
                ev_soc: Number(raw.ev_soc ?? 0),
                ev_charging: Boolean(raw.ev_charging),
                ev_v2h: Boolean(raw.ev_v2h),
                ev_power_kw: evPowerKw,
                home_battery_soc: homeBatterySoc,
                pv_power_kw: pvPowerKw,
                pv_today_kwh: Number(raw.pv_today_kwh ?? 0),
                grid_import_w: Number(raw.grid_import_w ?? 0),
                grid_export_w: Number(raw.grid_export_w ?? 0),
              });
            }
          } catch (e) {
            console.warn("WS parse error:", e, event.data);
          }
        };

        ws.onerror = (e) => {
          console.error("WebSocket error", e);
          setError("WebSocket Fehler");
          setConnected(false);
        };

        ws.onclose = (ev) => {
          setConnected(false);
          console.warn(`🔌 WebSocket closed code=${ev.code} reason=${ev.reason || "n/a"}`);
          // setError(`WebSocket geschlossen (${ev.code})`);
          setTimeout(connect, 3000);
        };
      } catch (err) {
        console.error("WS connect error", err);
        setError("Verbindungsfehler");
        setTimeout(connect, 3000);
      }
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  // Fetch AI Recommendation every 10s
  useEffect(() => {
    const fetchAI = async () => {
      try {
        const res = await fetch(`${API_URL}/airecommendation`, {
          headers: {
            'X-API-Key': 'mein_geheimer_schulkey123'
          }
        });
        const json = await res.json();
        setAiRec(json);
      } catch (err) {
        console.error("AI fetch error", err);
      }
    };
    fetchAI();
    const interval = setInterval(fetchAI, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch History once
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [pvRes, consRes] = await Promise.all([
          fetch(`${API_URL}/history/pv?hours=24`, {
            headers: {
              'X-API-Key': import.meta.env.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY.VITE_API_KEY || 'YOUR_API_KEY_HERE'
            }
          }),
          fetch(`${API_URL}/history/consumption?hours=24`, {
            headers: {
              'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
            }
          }),
        ]);
        const pvJson = await pvRes.json();
        const consJson = await consRes.json();

        const pvMapped = ((pvJson.data || []) as HistoryApiPoint[]).map((d) => ({
          hour: new Date(d.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
          power_kw: d.value, // bereits kW im Backend
        }));
        const consMapped = ((consJson.data || []) as HistoryApiPoint[]).map((d) => ({
          hour: new Date(d.time).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
          consumption_kw: d.value,
        }));

        setPvHistory(pvMapped);
        setConsumptionHistory(consMapped);
      } catch (err) {
        console.error("History fetch error", err);
      }
    };
    fetchHistory();
  }, []);

  // Fetch EV Profiles
  useEffect(() => {
    const fetchEVProfiles = async () => {
      try {
        const res = await fetch(`${API_URL}/ev/profiles`, {
          headers: {
            'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
          }
        });
        const json = await res.json();
        setEvProfiles(json.profiles || []);
      } catch (err) {
        console.error("EV Profiles fetch error", err);
      }
    };
    fetchEVProfiles();
  }, []);

  // Show notification
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Control Commands
  const startCharging = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/control/ev/charge_start`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
        }
      });
      const result = await res.json();
      showNotification(result.status, result.message);
    } catch (err) {
      showNotification("error", `❌ Fehler: ${err}`);
    }
  }, []);

  const stopCharging = useCallback(async () => {
    if (!window.confirm("🛑 Ladevorgang wirklich stoppen?")) return;
    
    try {
      const res = await fetch(`${API_URL}/control/ev/charge_stop`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
        }
      });
      const result = await res.json();
      showNotification(result.status, result.message);
    } catch (err) {
      showNotification("error", `❌ Fehler: ${err}`);
    }
  }, []);

  const toggleV2H = useCallback(async () => {
    const endpoint = data?.ev_v2h ? "/control/ev/v2h_stop" : "/control/ev/v2h_start";
    const action = data?.ev_v2h ? "deaktivieren" : "aktivieren";
    
    if (!window.confirm(`🔄 V2H wirklich ${action}?\n\n${data?.ev_v2h ? "E-Auto wird nicht mehr das Haus versorgen." : "E-Auto wird das Haus mit Strom versorgen."}`)) return;
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
        }
      });
      const result = await res.json();
      showNotification(result.status, result.message);
    } catch (err) {
      showNotification("error", `❌ Fehler: ${err}`);
    }
  }, [data?.ev_v2h]);

  const activateEV = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/ev/active/${id}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
        }
      });
      const result = await res.json();
      showNotification(result.status, result.message);
      
      // Nach Aktivierung das Profil aktualisieren
      setEvProfiles((prev) => 
        prev.map((ev) => (ev.id === id ? { ...ev, active: true } : ev))
      );
    } catch (err) {
      showNotification("error", `❌ Fehler: ${err}`);
    }
  };

  const safe = (val: number | string | null | undefined, decimals: number = 2) => Number(val ?? 0).toFixed(decimals);

  // data kommt aus WebSocket-State
  const evSoc = data?.ev_soc;
  const evPowerKw = data?.ev_power_kw;

  if (error) return <ErrorView message={error} />;
  // Schritt 1: Wechselrichter verbinden
  if (!inverterConnected) {
    return (
      <div className="dashboard-grid">
        <header>
          <h1>⚡ WattAI</h1>
          <span className={`status ${connected ? "online" : "offline"}`}>
            {connected ? "🟢 Live" : "🔴 Offline"}
          </span>
        </header>
        {!selectedInverter ? (
          <>
            <h2>PV-Anlage verbinden</h2>
            <InverterSelector onSelect={setSelectedInverter} />
          </>
        ) : (
          <InverterConnectDialog inverter={selectedInverter} onConnect={async params => {
            setInverterParams(params);
            setInverterConnected(true);
            // API-Call an Backend für Realtime-Daten
            try {
              const url = new URL(`${API_URL}/inverter/realtime`);
              url.searchParams.set('manufacturer', selectedInverter.id);
              url.searchParams.set('model', selectedInverter.name);
              url.searchParams.set('protocol', selectedInverter.protocol.toLowerCase());
              if (params.ip) url.searchParams.set('ip', params.ip);
              // Optional: port/token falls Backend unterstützt
              const res = await fetch(url.toString(), {
                headers: {
                  'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
                }
              });
              const data = await res.json();
              setInverterData(data);
            } catch {
              setInverterData({ error: 'Fehler beim Laden der Inverter-Daten' });
            }
          }} />
        )}
      </div>
    );
  }
  // Schritt 2: Smart Meter verbinden
  if (!smartMeterConnected) {
    return (
      <div className="dashboard-grid">
        <header>
          <h1>⚡ WattAI</h1>
          <span className={`status ${connected ? "online" : "offline"}`}>
            {connected ? "🟢 Live" : "🔴 Offline"}
          </span>
        </header>
        <SmartMeterConnectDialog onConnect={async params => {
          setSmartMeterParams(params);
          setSmartMeterConnected(true);
          // Backend: Verbindung speichern (Dummy)
          await fetch(`${API_URL}/smartmeter/connect`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
            },
            body: JSON.stringify(params)
          });
          // Verbrauchsdaten holen
          const res = await fetch(`${API_URL}/smartmeter/consumption?hours=24`, {
            headers: {
              'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
            }
          });
          const json = await res.json();
          setBackendConsumption(json.data || []);
        }} />
      </div>
    );
  }
  // Schritt 3: Verbraucherprofil auswählen
  if (!selectedConsumer) {
    return (
      <div className="dashboard-grid">
        <header>
          <h1>⚡ WattAI</h1>
          <span className={`status ${connected ? "online" : "offline"}`}>
            {connected ? "🟢 Live" : "🔴 Offline"}
          </span>
        </header>
        <ConsumerProfileSelector onSelect={async profile => {
          setSelectedConsumer(profile);
          // Backend: Profil holen
          const res = await fetch(`${API_URL}/smartmeter/consumer_profile?consumer=${profile.id}`, {
            headers: {
              'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
            }
          });
          const json = await res.json();
          setBackendProfile(json);
          setConsumerSoc(json.soc ?? 80);
          setConsumerCycles(json.cycles ?? 120);
        }} />
      </div>
    );
  }
  // Schritt 4: Dashboard mit Profil-Details und Charts
  if (!data) return <LoadingView />;

  return (
    <div className="dashboard-grid">
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
      
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <header>
    <h1>⚡ WattAI</h1>
        <span className={`status ${connected ? "online" : "offline"}`}>
          {connected ? "🟢 Live" : "🔴 Offline"}
        </span>
        <div style={{marginLeft: "auto"}}>
          <span style={{fontWeight: "bold", color: "#FF9800"}}>
            {selectedInverter ? selectedInverter.name : "Kein Wechselrichter ausgewählt"}
          </span>
          {inverterParams && (
            <span style={{marginLeft: 12, color: "#2196F3"}}>
              Verbunden: {JSON.stringify(inverterParams)}
            </span>
          )}
          {inverterData && (
            <div style={{marginTop: 8, color: inverterData.error ? 'red' : '#388e3c'}}>
              {inverterData.error
                ? `Fehler: ${inverterData.error}`
                : <pre style={{margin:0}}>{JSON.stringify(inverterData, null, 2)}</pre>}
            </div>
          )}
          {smartMeterParams && (
            <span style={{marginLeft: 12, color: "#4CAF50"}}>
              Smart Meter: {JSON.stringify(smartMeterParams)}
            </span>
          )}
          {selectedConsumer && (
            <span style={{marginLeft: 12, color: "#F44336"}}>
              Verbraucher: {selectedConsumer.name}
            </span>
          )}
        </div>
      </header>
  <ConsumerProfileDetails profile={backendProfile || selectedConsumer} soc={consumerSoc} cycles={consumerCycles} />
      {/* Fehler- und Alarmmonitor */}
      <ErrorAlarmMonitor />
      {/* CO₂- und Kosten-Widget mit echten Daten */}
      {reportData && (
        <CO2CostWidget
          co2SavedKg={reportData.co2_saved_kg}
          costEur={reportData.cost_eur}
          autarky={reportData.autarky}
          period={reportData.period}
          co2DeltaPercent={
            reportData.co2_last_year
              ? ((reportData.co2_saved_kg - reportData.co2_last_year) / reportData.co2_last_year) * 100
              : 0
          }
          costDeltaPercent={
            reportData.cost_last_year
              ? ((reportData.cost_eur - reportData.cost_last_year) / reportData.cost_last_year) * 100
              : 0
          }
        />
      )}
      {/* Verbrauchs-Chart mit echten Backend-Daten */}
      <section className="charts">
        <div className="chart-container">
          <h3>Verbrauch (Smart Meter)</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={backendConsumption} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <XAxis dataKey="time" tick={{fontSize:12}} />
              <YAxis unit="kW" />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#2196F3" strokeWidth={3} dot={false} name="Verbrauch" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      {/* KI-Energiemanagement */}
      <section className="ai-panel">
        <h2>🤖 KI-Energiemanagement</h2>
        <button className="btn btn-info" onClick={handleOptimize} disabled={optimizing}>
          {optimizing ? "Optimierung läuft..." : "Energiefluss optimieren"}
        </button>
        {energyAction && (
          <div className="recommendation" style={{marginTop:16}}>
            <div><b>Empfehlung:</b> {energyAction.explanation}</div>
            <div>EV-Ladeleistung: {energyAction.ev_charge_rate} kW</div>
            <div>Batterie laden: {energyAction.battery_charge_enable ? "Ja" : "Nein"}</div>
            <div>Batterie entladen: {energyAction.battery_discharge_enable ? "Ja" : "Nein"}</div>
            <div>Netzimport: {energyAction.grid_import} kW</div>
            <div>Netzexport: {energyAction.grid_export} kW</div>
            <div>KI-Confidence: {energyAction.confidence}</div>
          </div>
        )}
      </section>

      {/* Realtime Metrics */}
      <section className="metrics">
        <MetricCard 
          title="🚗 E-Auto SOC" 
          value={`${safe(data.ev_soc, 1)}%`}
          subtitle={
            data.ev_charging ? "🔌 Lädt..." : 
            data.ev_v2h ? "🏠 Versorgt Haus" : 
            "⏸️ Inaktiv"
          }
          color={
            data.ev_charging ? "#4CAF50" : 
            data.ev_v2h ? "#FF9800" : 
            "#2196F3"
          }
        />
        <MetricCard 
          title="⚡ E-Auto Leistung" 
          value={`${safe(data.ev_power_kw, 2)} kW`}
          subtitle={
            data.ev_charging ? "Laden" : 
            data.ev_v2h ? "Entladen (V2H)" : 
            "Keine Aktivität"
          }
          color={data.ev_charging ? "#4CAF50" : (data.ev_v2h ? "#FF9800" : "#999")}
        />
        <MetricCard title="🔋 Hausspeicher" value={`${safe(data.home_battery_soc, 1)}%`} color="#2196F3" />
        <MetricCard 
          title="☀️ PV-Leistung" 
          value={`${safe(data.pv_power_kw, 2)} kW`} 
          subtitle={`Heute: ${safe(data.pv_today_kwh, 1)} kWh`} 
          color="#FF9800" 
        />
        <MetricCard title="📥 Netz Import" value={`${safe(data.grid_import_w / 1000, 2)} kW`} color="#F44336" />
        <MetricCard title="📤 Netz Export" value={`${safe(data.grid_export_w / 1000, 2)} kW`} color="#8BC34A" />
      </section>

      {/* AI Recommendation */}
  {aiRec && aiRec.estimated_savings_eur !== undefined && (
        <section className="ai-panel">
          <h2>🤖 KI-Empfehlung</h2>
          <div className={`recommendation priority-${aiRec.priority || 'medium'}`}>
            <div className="action">{getActionEmoji(aiRec.action)} {getActionText(aiRec.action)}</div>
            <div className="reason">{aiRec.reason}</div>
            <div className="benefits">
              💰 {(aiRec.estimated_savings_eur ?? 0).toFixed(2)} € Ersparnis · 
              🌱 {(aiRec.co2_saved_kg ?? 0).toFixed(1)} kg CO₂ vermieden
            </div>
          </div>
        </section>
      )}

      <RecommendationCard />
      
      <DeviceManager />
      
      {/* Control Panel */}
      <section className="control-panel">
        <h2>⚙️ E-Auto Steuerung</h2>
        <div className="status-bar">
          {data.ev_charging && <span className="status-badge charging">🔌 Lädt mit {Math.abs(data.ev_power_kw).toFixed(1)} kW</span>}
          {data.ev_v2h && <span className="status-badge v2h">🏠 V2H aktiv - {Math.abs(data.ev_power_kw).toFixed(1)} kW an Haus</span>}
          {!data.ev_charging && !data.ev_v2h && <span className="status-badge idle">⏸️ Inaktiv</span>}
        </div>
        <div className="buttons">
          <button 
            className={`btn btn-success ${data.ev_charging ? 'active' : ''}`}
            onClick={startCharging}
            disabled={data.ev_charging || data.ev_v2h}
          >
            {data.ev_charging ? "✅ Lädt..." : "▶️ Laden starten"}
          </button>
          <button 
            className="btn btn-danger"
            onClick={stopCharging}
            disabled={!data.ev_charging}
          >
            ⏹️ Laden stoppen
          </button>
          <button 
            className={`btn btn-warning ${data.ev_v2h ? 'active' : ''}`}
            onClick={toggleV2H}
            disabled={data.ev_charging}
          >
            {data.ev_v2h ? "⏹️ V2H stoppen" : "🏠 V2H aktivieren"}
          </button>
        </div>
        <div className="control-info">
          <p>💡 <strong>V2H (Vehicle-to-Home):</strong> E-Auto versorgt Haus bei Spitzenlast (z.B. Winter: niedriger PV-Ertrag + hoher Wärmepumpenbedarf)</p>
          <p>⚠️ <strong>Mindest-SOC für V2H:</strong> 20% (Schutz vor Tiefentladung)</p>
        </div>
      </section>

      {/* EV Profile Manager */}
      <section>
        <h2>🔌 E‑Auto Steuerung</h2>
        <EVProfileManager evSoc={evSoc} evPowerKw={evPowerKw} />
      </section>

      <section className="dashboard-section">
        <h3>🚗 Fahrzeug-Zuweisung</h3>
        {/* Aktuelles Fahrzeug anzeigen */}
        {/* Status, z.B. "Kein Fahrzeug zugewiesen" */}
      </section>
      <section className="dashboard-section">
        <h3>🔄 EV-Profile</h3>
        {/* Liste der EV-Profile, Auswahl, Aktivierung */}
        {evProfiles.map(ev => (
          <div key={ev.id} className="ev-profile-list-item">
            <span>{ev.manufacturer} {ev.model}</span>
            <button onClick={() => activateEV(ev.id)}>Aktivieren</button>
          </div>
        ))}
      </section>
      <section className="dashboard-section">
  {/* <EVProfileForm onSave={handleSave} /> */}
      </section>
      
      {/* Charts */}
      <section className="charts">
        <div className="chart-container">
          <h3>☀️ PV-Ertrag (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={pvHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="power_kw" stroke="#FF9800" strokeWidth={2} name="PV (kW)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>📊 Verbrauch (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={consumptionHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="consumption_kw" stroke="#2196F3" strokeWidth={2} name="Verbrauch (kW)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      {/* Debug-Panel */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#222',color:'#fff',padding:'8px',fontSize:'12px',zIndex:9999}}>
        <b>Debug:</b> Status: {connected ? '🟢 Verbunden' : '🔴 Offline'} | Fehler: {error || 'keine'}<br/>
        <span>Letzte Daten: {JSON.stringify(data)}</span>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color: string }) {
  return (
    <div className="metric-card" style={{ borderColor: color }}>
      <div className="metric-title">{title}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
}

function getActionEmoji(action: string) {
  const emojis: Record<string, string> = { charge_ev: "🔌", charge_battery: "🔋", v2h: "🏠", idle: "⏸️" };
  return emojis[action] || "❓";
}

function getActionText(action: string) {
  const texts: Record<string, string> = {
    charge_ev: "E-Auto laden",
    charge_battery: "Speicher laden",
    v2h: "Haus versorgen (V2H)",
    idle: "Keine Aktion",
  };
  return texts[action] || action;
}

function LoadingView() {
  return <div className="loading">⏳ Verbinde...</div>;
}

function ErrorView({ message }: { message: string }) {
  return <div className="error">❌ {message}</div>;
}