import { useEffect, useState } from "react";
import { getSOC, getPVRealtime, getGridRealtime } from "../api/client";

interface DashboardData {
  ev_soc: number;
  home_battery_soc: number;
  pv_power_w: number;
  pv_power_kw: number;
  grid_import_w: number;
  grid_export_w: number;
  net_flow_w: number;
}

export function RealtimeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const [soc, pv, grid] = await Promise.all([
          getSOC(),
          getPVRealtime(),
          getGridRealtime()
        ]);
        
        if (active) {
          setData({
            ev_soc: soc.data.ev_soc,
            home_battery_soc: soc.data.home_battery_soc,
            pv_power_w: pv.data.power_w,
            pv_power_kw: pv.data.power_kw,
            grid_import_w: grid.data.import_w,
            grid_export_w: grid.data.export_w,
            net_flow_w: grid.data.net_flow_w,
          });
          setError("");
        }
      } catch (err: any) {
        if (active) {
          setError("Backend nicht erreichbar");
          console.error("API error", err);
        }
      }
      setTimeout(poll, 3000);
    };
    poll();
    return () => { active = false; };
  }, []);

  if (error) return <ErrorView message={error} />;
  if (!data) return <LoadingView />;

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", maxWidth: 1200, margin: "0 auto" }}>
  <h1 style={{ marginBottom: 32 }}>⚡ LoopIQ Dashboard</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
        <MetricCard 
          title="🚗 E-Auto SOC" 
          value={`${data.ev_soc.toFixed(1)}%`}
          color="#4CAF50"
        />
        <MetricCard 
          title="🔋 Hausspeicher SOC" 
          value={`${data.home_battery_soc.toFixed(1)}%`}
          color="#2196F3"
        />
        <MetricCard 
          title="☀️ PV-Leistung" 
          value={`${data.pv_power_kw.toFixed(2)} kW`}
          subtitle={`${data.pv_power_w.toFixed(0)} W`}
          color="#FF9800"
        />
        <MetricCard 
          title="📥 Netz Import" 
          value={`${(data.grid_import_w / 1000).toFixed(2)} kW`}
          color="#F44336"
        />
        <MetricCard 
          title="📤 Netz Export" 
          value={`${(data.grid_export_w / 1000).toFixed(2)} kW`}
          color="#8BC34A"
        />
        <MetricCard 
          title="⚖️ Netto-Fluss" 
          value={`${(data.net_flow_w / 1000).toFixed(2)} kW`}
          subtitle={data.net_flow_w > 0 ? "Bezug" : "Einspeisung"}
          color={data.net_flow_w > 0 ? "#F44336" : "#4CAF50"}
        />
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  color 
}: { 
  title: string; 
  value: string; 
  subtitle?: string; 
  color: string;
}) {
  return (
    <div style={{ 
      border: `2px solid ${color}`, 
      padding: 20, 
      borderRadius: 12,
      background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <div style={{ fontSize: 14, color: "#666", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: "bold", color }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{subtitle}</div>}
    </div>
  );
}

function LoadingView() {
  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
      <div style={{ fontSize: 48 }}>⏳</div>
      <div style={{ fontSize: 18, marginTop: 16 }}>Lädt Daten...</div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <div style={{ fontSize: 18, marginTop: 16, color: "#F44336" }}>{message}</div>
      <div style={{ fontSize: 14, marginTop: 8, color: "#666" }}>
  Backend läuft auf http://127.0.0.1:8001?
      </div>
    </div>
  );
}