
import React, { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

const API_KEY = "mein_geheimer_schulkey123";

interface FleetRecommendation {
  wallbox_id: string;
  ev_id: string;
  empfohlene_leistung_kw: number;
  grund: string;
  soc?: number;
}

import EVProfileManager from "./EVProfileManager";

const FleetManagementTab: React.FC = () => {
  const [fleet, setFleet] = useState<FleetRecommendation[]>([]);
  const [gesamtleistung, setGesamtleistung] = useState<number>(0);
  const [pvSurplus, setPvSurplus] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // KI-Empfehlung für die Flotte laden
  const loadFleetRecommendation = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/fleet/ai_recommendation`, {
      headers: { "X-API-Key": API_KEY },
    });
    const data = await res.json();
    setFleet(data.fleet_recommendations || []);
    setGesamtleistung(data.gesamtleistung_kw || 0);
    setPvSurplus(data.pv_surplus_kw || 0);
    setLoading(false);
  };

  useEffect(() => {
    loadFleetRecommendation();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Flottenmanagement</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>Verfügbare Gesamtleistung:</strong> {gesamtleistung} kW &nbsp;|
        <strong> PV-Überschuss:</strong> {pvSurplus} kW
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Wallbox</th>
            <th>EV</th>
            <th>SoC</th>
            <th>Empf. Leistung (kW)</th>
            <th>KI-Grund</th>
          </tr>
        </thead>
        <tbody>
          {fleet.map((rec) => (
            <tr key={rec.wallbox_id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{rec.wallbox_id}</td>
              <td>{rec.ev_id}</td>
              <td>{rec.soc !== undefined ? `${rec.soc}%` : "-"}</td>
              <td>{rec.empfohlene_leistung_kw}</td>
              <td>{rec.grund}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div>Lade KI-Empfehlung...</div>}

      {/* E-Auto Hersteller/EV Profile section now in Flottenmanagement */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-2">E-Auto Hersteller</h2>
        <EVProfileManager />
      </div>
    </div>
  );
};

export default FleetManagementTab;
