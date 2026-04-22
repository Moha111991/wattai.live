import React, { useState } from "react";

export default function EVControlBox({ activeEV }) 

{/* <EVControlBox activeEV={activeEV} /> */}


  const [v2hConfirm, setV2hConfirm] = useState(false);

  const handleCharge = async () => {
    await fetch("/api/ev/charge", { method: "POST" });
  };

  const handleStop = async () => {
    await fetch("/api/ev/stop", { method: "POST" });
  };

  const handleV2H = async () => {
    if (!v2hConfirm) {
      setV2hConfirm(true);
      setTimeout(() => setV2hConfirm(false), 4000);
      return;
    }
    await fetch("/api/ev/v2h", { method: "POST" });
    setV2hConfirm(false);
  };

  return (
    <div className="ev-card">
      <h2>🚗 Aktivierung & Steuerung</h2>
      {activeEV ? (
        <div className="ev-profile-details mt-4">
          <div>
            <strong>Status:</strong>{" "}
            <span className={activeEV.active ? "text-green-600" : "text-red-600"}>
              {activeEV.active ? "Aktiv" : "Nicht aktiv"}
            </span>
          </div>
          <div>
            <strong>Fahrzeug:</strong> {activeEV.manufacturer} {activeEV.model}
          </div>
          <div>Batterie: {activeEV.battery_capacity_kwh} kWh</div>
          <div>Reichweite: {activeEV.typical_range_km} km</div>
          <div className="flex gap-4 mt-4">
            <button className="button" onClick={handleCharge}>Laden starten</button>
            <button className="button" onClick={handleStop}>Laden stoppen</button>
            <button
              className="button"
              style={{ background: v2hConfirm ? "#f59e0b" : undefined }}
              onClick={handleV2H}
            >
              {v2hConfirm ? "Nochmal V2H bestätigen" : "V2H aktivieren"}
            </button>
          </div>
        </div>
      ) : (
        <div className="ev-profile-details mt-4">Kein Fahrzeug zugewiesen</div>
      )}
    </div>
  );
}