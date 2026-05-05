interface CO2CostWidgetProps {
  co2SavedKg: number;
  costEur: number;
  autarky: number;
  period?: string;
  co2DeltaPercent?: number; // z.B. +12
  costDeltaPercent?: number; // z.B. -8
}

export default function CO2CostWidget({
  co2SavedKg,
  costEur,
  autarky,
  period,
  co2DeltaPercent = 12,
  costDeltaPercent = -8,
}: CO2CostWidgetProps) {
  // Farben und Icons je nach Entwicklung
  const co2DeltaColor = co2DeltaPercent >= 0 ? "#4CAF50" : "#F44336";
  const costDeltaColor = costDeltaPercent <= 0 ? "#2196F3" : "#F44336";
  const co2DeltaSign = co2DeltaPercent > 0 ? "+" : "";
  const costDeltaSign = costDeltaPercent > 0 ? "+" : "";

  return (
    <div
      className="co2-cost-widget"
      style={{
        background: "linear-gradient(135deg, #23272F 70%, #263238 100%)",
        borderRadius: 20,
        padding: 28,
        color: "#F5F7FA",
        boxShadow: "0 4px 24px rgba(33,150,243,0.13)",
        width: "100%",
        maxWidth: "100%",
        margin: "28px 0",
        boxSizing: "border-box",
        fontFamily: "Inter, Arial, sans-serif",
        transition: "box-shadow 0.2s"
      }}
    >
      <h3 style={{ color: "#FF9800", marginBottom: 18, fontWeight: 700, fontSize: 22 }}>
        CO₂ & Kosten Übersicht {period ? `(${period})` : ""}
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16, flexWrap: "wrap" }}>
        <div title="CO₂-Einsparung" style={{ fontSize: 32, display: "flex", alignItems: "center", gap: 8 }}>
          <span role="img" aria-label="CO2">🌱</span>
          <b>{co2SavedKg.toFixed(1)}</b>
          <span style={{ fontSize: 16, marginLeft: 2 }}>kg CO₂</span>
        </div>
        <div title="Stromkosten" style={{ fontSize: 32, display: "flex", alignItems: "center", gap: 8 }}>
          <span role="img" aria-label="Euro">💰</span>
          <b>{costEur.toFixed(2)}</b>
          <span style={{ fontSize: 16, marginLeft: 2 }}>€</span>
        </div>
        <div title="Autarkiegrad" style={{ fontSize: 28, display: "flex", alignItems: "center", gap: 8 }}>
          <span role="img" aria-label="Autarkie">🔋</span>
          <b>{autarky.toFixed(1)}%</b>
        </div>
      </div>
      <div style={{ fontSize: 15, opacity: 0.8, marginTop: 8, marginBottom: 2 }}>
        Im Vergleich zum Vorjahr:
        <span style={{ color: co2DeltaColor, fontWeight: 600, marginLeft: 8 }}>
          {co2DeltaSign}
          {co2DeltaPercent.toFixed(1)}% CO₂-Ersparnis
        </span>
        ,
        <span style={{ color: costDeltaColor, fontWeight: 600, marginLeft: 8 }}>
          {costDeltaSign}
          {costDeltaPercent.toFixed(1)}% Kosten
        </span>
      </div>
    </div>
  );
}
