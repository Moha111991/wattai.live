import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

const Metric = ({ label, value, unit, icon }: { label: string; value: string | number | null; unit: string; icon: string }) => (
  <div style={{
    background: "rgba(2,6,23,0.6)", borderRadius: 10, padding: "10px 14px",
    border: "1px solid rgba(71,85,105,0.3)", minWidth: 0,
  }}>
    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
      <span>{icon}</span>{label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>
      {value !== null ? (
        <>
          <span>{typeof value === "number" ? value.toLocaleString("de-DE", { maximumFractionDigits: 2 }) : value}</span>
          <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginLeft: 4 }}>{unit}</span>
        </>
      ) : (
        <span style={{ color: "#475569", fontSize: 16 }}>—</span>
      )}
    </div>
  </div>
);

export default function SmartMeterEnergyWidget() {
  const [importKwh, setImportKwh] = useState<number | null>(null);
  const [exportKwh, setExportKwh] = useState<number | null>(null);
  const [powerW, setPowerW] = useState<number | null>(null);
  const [voltageV, setVoltageV] = useState<number | null>(null);
  const [currentA, setCurrentA] = useState<number | null>(null);
  const [energyTodayKwh, setEnergyTodayKwh] = useState<number | null>(null);
  const [energyTotalKwh, setEnergyTotalKwh] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/smartmeter/energy`)
      .then(res => res.json())
      .then(data => {
        setImportKwh(typeof data.import_kwh === "number" ? data.import_kwh : null);
        setExportKwh(typeof data.export_kwh === "number" ? data.export_kwh : null);
        setPowerW(typeof data.power_w === "number" ? data.power_w : null);
        setVoltageV(typeof data.voltage_v === "number" ? data.voltage_v : null);
        setCurrentA(typeof data.current_a === "number" ? data.current_a : null);
        setEnergyTodayKwh(typeof data.energy_today_kwh === "number" ? data.energy_today_kwh : null);
        setEnergyTotalKwh(typeof data.energy_total_kwh === "number" ? data.energy_total_kwh : null);
        setLoading(false);
      })
      .catch(() => {
        setError("not_connected");
        setLoading(false);
      });
  }, []);

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) return (
    <div style={{
      background: "rgba(15,23,42,0.7)", borderRadius: 14, padding: "24px 20px",
      border: "1px solid rgba(56,189,248,0.2)", textAlign: "center",
    }}>
      <div style={{ fontSize: 28, marginBottom: 10, animation: "spin 1.2s linear infinite", display: "inline-block" }}>⚡</div>
      <div style={{ color: "#94a3b8", fontSize: 14, fontWeight: 500 }}>Verbinde mit Smart Meter…</div>
    </div>
  );

  /* ── Not connected / Error ───────────────────────────────── */
  if (error) return (
    <div style={{
      background: "rgba(15,23,42,0.75)",
      border: "1px dashed rgba(56,189,248,0.3)",
      borderRadius: 16, padding: "28px 20px",
      backdropFilter: "blur(10px)",
      textAlign: "center",
    }}>
      {/* Icon */}
      <div style={{
        width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
        background: "rgba(56,189,248,0.08)",
        border: "1.5px solid rgba(56,189,248,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
      }}>
        🔌
      </div>

      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
        Kein Smart Meter verbunden
      </div>
      <div style={{ color: "#64748b", fontSize: 13, maxWidth: 280, margin: "0 auto 20px", lineHeight: 1.6 }}>
        Sobald Ihr Wechselrichter oder Smart Meter verbunden ist, erscheinen hier alle Echtzeit-Energiedaten automatisch.
      </div>

      {/* Steps */}
      <div style={{
        background: "rgba(2,6,23,0.6)", borderRadius: 12, padding: "14px 16px",
        border: "1px solid rgba(71,85,105,0.25)", textAlign: "left", marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          🚀 Erste Schritte
        </div>
        {[
          { step: "1", text: "Wechselrichter oder Smart Meter einschalten" },
          { step: "2", text: "Gerät im selben Netzwerk wie dieses System betreiben" },
          { step: "3", text: "Verbindung über Geräte-Tab herstellen" },
        ].map(({ step, text }) => (
          <div key={step} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{
              minWidth: 20, height: 20, borderRadius: "50%", background: "rgba(56,189,248,0.15)",
              border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8",
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
            }}>{step}</span>
            <span style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#475569" }}>
        Diese Karte aktualisiert sich automatisch nach der Verbindung
      </div>
    </div>
  );

  /* ── Connected / Data view ───────────────────────────────── */
  return (
    <div style={{
      background: "rgba(15,23,42,0.75)", borderRadius: 14, padding: "16px 18px",
      border: "1px solid rgba(56,189,248,0.22)", backdropFilter: "blur(10px)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{
          background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)",
          borderRadius: 8, padding: "5px 8px", fontSize: 16,
        }}>⚡</span>
        <div>
          <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: 15 }}>Smart Meter Energie</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e", display: "inline-block" }} />
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 500 }}>Live</span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <Metric icon="📥" label="Bezogen" value={importKwh} unit="kWh" />
        <Metric icon="📤" label="Eingespeist" value={exportKwh} unit="kWh" />
        <Metric icon="⚡" label="Leistung" value={powerW} unit="W" />
        <Metric icon="🔋" label="Spannung" value={voltageV} unit="V" />
        <Metric icon="〰️" label="Strom" value={currentA} unit="A" />
        <Metric icon="🌤️" label="Heute" value={energyTodayKwh} unit="kWh" />
      </div>

      <div style={{
        background: "rgba(2,6,23,0.6)", borderRadius: 10, padding: "10px 14px",
        border: "1px solid rgba(71,85,105,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, color: "#64748b" }}>⚡ Energie gesamt</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
          {energyTotalKwh !== null ? energyTotalKwh.toLocaleString("de-DE", { maximumFractionDigits: 2 }) : "—"}
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>kWh</span>
        </span>
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
        Voraussetzung für Smart-Home-Features: Ihr Smart-Home-System muss mit demselben MQTT-Broker verbunden sein wie dieses EMS.
      </p>
    </div>
  );
}

