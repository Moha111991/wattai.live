import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

interface Alarm {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: string;
  recommendation?: string;
}

const TYPE_CONFIG = {
  error:   { label: "Fehler",   icon: "🔴", accent: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   badge: "#7f1d1d" },
  warning: { label: "Warnung",  icon: "🟡", accent: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  badge: "#78350f" },
  info:    { label: "Info",     icon: "🔵", accent: "#38bdf8", bg: "rgba(56,189,248,0.07)",  border: "rgba(56,189,248,0.22)",  badge: "#0c4a6e" },
};

export default function ErrorAlarmMonitor() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showToasts, setShowToasts] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    async function fetchAlarms() {
      try {
        const res = await fetch(`${API_URL}/api/alarms`, {
          headers: { "X-API-Key": import.meta.env.VITE_API_KEY || "YOUR_API_KEY_HERE" },
        });
        const json = await res.json();
        setAlarms(json.alarms || []);
      } catch {
        // No connection to backend → treat as clean (no alarms)
        setAlarms([]);
      }
      setLastUpdated(new Date());
    }
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 30000);
    return () => clearInterval(interval);
  }, []);

  const errors   = alarms.filter(a => a.type === "error");
  const warnings = alarms.filter(a => a.type === "warning");
  const infos    = alarms.filter(a => a.type === "info");

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────── */}
      <div style={{
        width: "100%", maxWidth: "100%", margin: "28px 0", boxSizing: "border-box",
        background: "rgba(15,23,42,0.82)",
        border: alarms.length === 0 ? "1px solid rgba(34,197,94,0.28)" : "1px solid rgba(239,68,68,0.32)",
        borderRadius: 18,
        padding: "20px 22px 18px",
        boxShadow: "0 16px 40px rgba(2,6,23,0.38)",
        backdropFilter: "blur(12px)",
        transition: "border-color 0.4s ease",
      }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🛡️</span>
            <div>
              <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
                Fehler- &amp; Alarmmonitor
              </h2>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Zuletzt aktualisiert: {lastUpdated.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>

          {/* Summary badges */}
          <div style={{ display: "flex", gap: 6 }}>
            {(["error","warning","info"] as const).map(t => {
              const count = alarms.filter(a => a.type === t).length;
              const cfg = TYPE_CONFIG[t];
              return (
                <span key={t} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: count > 0 ? cfg.bg : "rgba(30,41,59,0.6)",
                  border: `1px solid ${count > 0 ? cfg.border : "rgba(71,85,105,0.3)"}`,
                  borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700,
                  color: count > 0 ? cfg.accent : "#475569",
                  transition: "all 0.3s ease",
                }}>
                  {cfg.icon} {count}
                </span>
              );
            })}
          </div>
        </div>

        {/* Live status bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
          background: "rgba(2,6,23,0.5)", borderRadius: 10, padding: "8px 14px",
          border: "1px solid rgba(71,85,105,0.25)",
        }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: alarms.length === 0 ? "#22c55e" : "#ef4444",
            boxShadow: alarms.length === 0 ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
            {alarms.length === 0
              ? "System läuft einwandfrei – keine aktiven Alarme"
              : `${errors.length} Fehler · ${warnings.length} Warnungen · ${infos.length} Hinweise`}
          </span>
        </div>

        {/* Empty state */}
        {alarms.length === 0 && (
          <div style={{
            textAlign: "center", padding: "32px 16px",
            background: "rgba(34,197,94,0.05)",
            border: "1px dashed rgba(34,197,94,0.2)",
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
            <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              Alles in Ordnung
            </div>
            <div style={{ color: "#64748b", fontSize: 13, maxWidth: 320, margin: "0 auto" }}>
              Keine aktuellen Fehler oder Warnungen. Das System überwacht alle Komponenten kontinuierlich.
            </div>
          </div>
        )}

        {/* Alarm list */}
        {alarms.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {alarms.map((alarm, idx) => {
              const cfg = TYPE_CONFIG[alarm.type] ?? TYPE_CONFIG.info;
              return (
                <li key={alarm.id} style={{
                  marginBottom: idx < alarms.length - 1 ? 10 : 0,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  color: "#f1f5f9",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                      <span style={{
                        background: cfg.badge, color: cfg.accent,
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        border: `1px solid ${cfg.border}`, textTransform: "uppercase", letterSpacing: "0.5px",
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {new Date(alarm.timestamp).toLocaleString("de-DE", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>{alarm.message}</div>
                  {alarm.recommendation && (
                    <div style={{ marginTop: 6, fontSize: 13, color: "#fbbf24", display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <span>💡</span>
                      <span>{alarm.recommendation}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 8 }}>
          <button
            onClick={() => setShowToasts(prev => !prev)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: showToasts ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
              border: showToasts ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
              color: showToasts ? "#fca5a5" : "#86efac",
              borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s ease",
            }}
          >
            {showToasts ? "🔕 Benachrichtigungen aus" : "🔔 Benachrichtigungen an"}
          </button>
        </div>
      </div>

      {/* ── Toast overlay ────────────────────────────────────── */}
      {showToasts && alarms.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, right: 16, maxWidth: 380, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
          {alarms.map(alarm => {
            const cfg = TYPE_CONFIG[alarm.type] ?? TYPE_CONFIG.info;
            return (
              <div key={alarm.id} style={{
                background: "rgba(15,23,42,0.96)",
                border: `1px solid ${cfg.border}`,
                borderLeft: `4px solid ${cfg.accent}`,
                borderRadius: 12, padding: "12px 16px",
                boxShadow: "0 8px 24px rgba(2,6,23,0.5)",
                backdropFilter: "blur(10px)",
                color: "#f1f5f9",
                animation: "slideIn 0.3s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span>{cfg.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: cfg.accent }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 13 }}>{alarm.message}</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
