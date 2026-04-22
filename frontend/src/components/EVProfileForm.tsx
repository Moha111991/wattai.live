// EVProfileForm.tsx
import React, { useEffect, useState } from "react";

export default function EVProfileForm() {
  const [evModels, setEvModels] = useState<any[]>([]);

  useEffect(() => {
    import("../data/cars.json").then((data) => {
      // Falls die Struktur ein Objekt ist, in ein Array umwandeln
      const arr: any[] = [];
      Object.entries(data.default).forEach(([manufacturer, models]) => {
        Object.entries(models as any).forEach(([model, info]) => {
          arr.push({ manufacturer, model, ...info });
        });
      });
      setEvModels(arr);
    });
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 24, fontWeight: "bold" }}>E-Auto Profile</h2>
      {evModels.map((item, idx) => (
        <div key={idx} style={{ margin: "10px 0", padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
          <div>🚗 {item.manufacturer} {item.model}</div>
          <div>Verbrauch: {item.efficiency_kwh_per_100km?.["100"] ?? "-"} kWh/100 km</div>
          <div>Batterie: {item.battery_capacity_kwh} kWh</div>
          <div>Ladeleistung: bis {item.max_dc_charge_kw} kW</div>
          <div>Reichweite: ca. {item.typical_range_km ?? "-"} km</div>
        </div>
      ))}
    </div>
  );
}
