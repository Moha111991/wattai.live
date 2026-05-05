// EVProfileForm.tsx
import { useEffect, useState } from "react";

type EVModelEntry = {
  manufacturer: string;
  model: string;
  efficiency_kwh_per_100km?: Record<string, number>;
  battery_capacity_kwh?: number;
  max_dc_charge_kw?: number;
  typical_range_km?: number;
};

type CarInfoLike = {
  efficiency_kwh_per_100km?: Record<string, number>;
  battery_capacity_kwh?: number;
  max_dc_charge_kw?: number;
  typical_range_km?: number;
} & Record<string, unknown>;

export default function EVProfileForm() {
  const [evModels, setEvModels] = useState<EVModelEntry[]>([]);

  useEffect(() => {
    import("../data/cars.json").then((data) => {
      // Falls die Struktur ein Objekt ist, in ein Array umwandeln
      const arr: EVModelEntry[] = [];
      Object.entries(data.default).forEach(([manufacturer, models]) => {
        Object.entries(models as Record<string, unknown>).forEach(([model, info]) => {
          const infoObj: CarInfoLike =
            info && typeof info === "object" ? (info as CarInfoLike) : {};
          arr.push({ manufacturer, model, ...infoObj });
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
