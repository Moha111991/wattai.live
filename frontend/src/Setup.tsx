import { useState, useEffect } from "react";
import "./Setup.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Presets {
  pv_systems: any[];
  wallboxes: any[];
  home_batteries: any[];
  evs: any[];
}

interface HouseholdPreset {
  persons: number;
  annual_consumption_kwh: number;
  daily_avg_kwh: number;
  description: string;
}

export default function Setup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [presets, setPresets] = useState<Presets | null>(null);
  const [householdPresets, setHouseholdPresets] = useState<HouseholdPreset[]>([]);
  
  const [config, setConfig] = useState({
    pv_system: {
      manufacturer: "",
      model: "",
      peak_power_kw: 10,
      panel_count: 30
    },
    wallbox: {
      manufacturer: "",
      model: "",
      max_power_kw: 11,
      phases: 3
    },
    home_battery: {
      manufacturer: "",
      model: "",
      capacity_kwh: 10,
      max_charge_kw: 5,
      max_discharge_kw: 5
    },
    ev: {
      manufacturer: "",
      model: "",
      battery_capacity_kwh: 60,
      max_charge_kw: 11,
      v2h_capable: false
    },
    household: {
      persons: 2,
      annual_consumption_kwh: 3470,
      heating_type: "heatpump",
      has_heatpump: true
    },
    location: "Germany",
    timezone: "Europe/Berlin"
  });

  useEffect(() => {
    fetch(`${API_URL}/setup/presets/manufacturers`)
      .then(res => res.json())
      .then(data => setPresets(data));
    
    fetch(`${API_URL}/setup/presets/household`)
      .then(res => res.json())
      .then(data => setHouseholdPresets(data.presets));
  }, []);

  const handleSubmit = async () => {
    try {
      const res = await fetch(`${API_URL}/setup/configure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const result = await res.json();
      
      if (result.status === "success") {
        alert("✅ Konfiguration gespeichert!");
        onComplete();
      }
    } catch (err) {
      alert(`❌ Fehler: ${err}`);
    }
  };

  const selectPreset = (type: string, item: any) => {
    if (type === "pv") {
      setConfig({
        ...config,
        pv_system: {
          ...config.pv_system,
          manufacturer: item.manufacturer,
          model: item.models[0],
          peak_power_kw: item.typical_power_kw[0]
        }
      });
    } else if (type === "wallbox") {
      setConfig({
        ...config,
        wallbox: {
          manufacturer: item.manufacturer,
          model: item.model,
          max_power_kw: item.power_kw,
          phases: item.phases
        }
      });
    } else if (type === "battery") {
      setConfig({
        ...config,
        home_battery: {
          manufacturer: item.manufacturer,
          model: item.model,
          capacity_kwh: item.capacity_kwh,
          max_charge_kw: item.power_kw,
          max_discharge_kw: item.power_kw
        }
      });
    } else if (type === "ev") {
      setConfig({
        ...config,
        ev: {
          manufacturer: item.manufacturer,
          model: item.model,
          battery_capacity_kwh: item.capacity_kwh,
          max_charge_kw: item.max_charge_ac_kw,
          v2h_capable: item.v2h
        }
      });
    }
  };

  const selectHousehold = (preset: HouseholdPreset) => {
    setConfig({
      ...config,
      household: {
        ...config.household,
        persons: preset.persons,
        annual_consumption_kwh: preset.annual_consumption_kwh
      }
    });
  };

  if (!presets) return <div className="loading">Lade Vorlagen...</div>;

  return (
    <div className="setup-wizard">
    <div className="setup-card">
		<h1>⚡ LoopIQ Setup</h1>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(step / 5) * 100}%` }}></div>
        </div>
        <p className="step-indicator">Schritt {step} von 5</p>

        {step === 1 && (
          <div className="setup-step">
            <h2>☀️ PV-Anlage</h2>
            <div className="preset-grid">
              {presets.pv_systems.map((item, i) => (
                <div
                  key={i}
                  className={`preset-card ${config.pv_system.manufacturer === item.manufacturer ? 'selected' : ''}`}
                  onClick={() => selectPreset("pv", item)}
                >
                  <div className="preset-name">{item.manufacturer}</div>
                  <div className="preset-detail">{item.models.join(", ")}</div>
                  <div className="preset-power">{item.typical_power_kw[0]} - {item.typical_power_kw[item.typical_power_kw.length - 1]} kW</div>
                </div>
              ))}
            </div>
            
            {config.pv_system.manufacturer && (
              <div className="custom-inputs">
                <label>
                  Nennleistung (kW):
                  <input
                    type="number"
                    value={config.pv_system.peak_power_kw}
                    onChange={e => setConfig({
                      ...config,
                      pv_system: { ...config.pv_system, peak_power_kw: parseFloat(e.target.value) }
                    })}
                    min="1"
                    max="50"
                    step="0.5"
                  />
                </label>
                <label>
                  Anzahl Module:
                  <input
                    type="number"
                    value={config.pv_system.panel_count}
                    onChange={e => setConfig({
                      ...config,
                      pv_system: { ...config.pv_system, panel_count: parseInt(e.target.value) }
                    })}
                    min="1"
                    max="100"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="setup-step">
            <h2>🔌 Wallbox</h2>
            <div className="preset-grid">
              {presets.wallboxes.map((item, i) => (
                <div
                  key={i}
                  className={`preset-card ${config.wallbox.manufacturer === item.manufacturer ? 'selected' : ''}`}
                  onClick={() => selectPreset("wallbox", item)}
                >
                  <div className="preset-name">{item.manufacturer}</div>
                  <div className="preset-detail">{item.model}</div>
                  <div className="preset-power">{item.power_kw} kW · {item.phases}-phasig</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step">
            <h2>🔋 Heimspeicher (optional)</h2>
            <div className="preset-grid">
              <div
                className={`preset-card ${!config.home_battery.manufacturer ? 'selected' : ''}`}
                onClick={() => setConfig({ ...config, home_battery: { manufacturer: "", model: "", capacity_kwh: 0, max_charge_kw: 0, max_discharge_kw: 0 } })}
              >
                <div className="preset-name">Kein Speicher</div>
                <div className="preset-detail">Ohne Heimspeicher betreiben</div>
              </div>
              {presets.home_batteries.map((item, i) => (
                <div
                  key={i}
                  className={`preset-card ${config.home_battery.manufacturer === item.manufacturer ? 'selected' : ''}`}
                  onClick={() => selectPreset("battery", item)}
                >
                  <div className="preset-name">{item.manufacturer}</div>
                  <div className="preset-detail">{item.model}</div>
                  <div className="preset-power">{item.capacity_kwh} kWh · {item.power_kw} kW</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="setup-step">
            <h2>🚗 E-Auto</h2>
            <div className="preset-grid">
              {presets.evs.map((item, i) => (
                <div
                  key={i}
                  className={`preset-card ${config.ev.manufacturer === item.manufacturer && config.ev.model === item.model ? 'selected' : ''}`}
                  onClick={() => selectPreset("ev", item)}
                >
                  <div className="preset-name">{item.manufacturer} {item.model}</div>
                  <div className="preset-detail">{item.capacity_kwh} kWh · {item.max_charge_ac_kw} kW AC</div>
                  {item.v2h && <div className="badge">V2H fähig</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="setup-step">
            <h2>🏠 Haushalt</h2>
            <p className="info-text">Daten vom Statistischen Bundesamt (Stromverbrauch privater Haushalte)</p>
            <div className="preset-grid">
              {householdPresets.map((preset, i) => (
                <div
                  key={i}
                  className={`preset-card ${config.household.persons === preset.persons ? 'selected' : ''}`}
                  onClick={() => selectHousehold(preset)}
                >
                  <div className="preset-name">{preset.persons} {preset.persons === 1 ? 'Person' : 'Personen'}</div>
                  <div className="preset-detail">{preset.annual_consumption_kwh.toLocaleString()} kWh/Jahr</div>
                  <div className="preset-power">Ø {preset.daily_avg_kwh.toFixed(1)} kWh/Tag</div>
                </div>
              ))}
            </div>
            
            <div className="custom-inputs">
              <label>
                <input
                  type="checkbox"
                  checked={config.household.has_heatpump}
                  onChange={e => setConfig({
                    ...config,
                    household: { ...config.household, has_heatpump: e.target.checked }
                  })}
                />
                Wärmepumpe vorhanden
              </label>
            </div>
          </div>
        )}

        <div className="setup-actions">
          {step > 1 && (
            <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
              ← Zurück
            </button>
          )}
          {step < 5 ? (
            <button 
              className="btn btn-primary" 
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !config.pv_system.manufacturer) ||
                (step === 2 && !config.wallbox.manufacturer) ||
                (step === 4 && !config.ev.manufacturer)
              }
            >
              Weiter →
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSubmit}>
              ✅ Konfiguration abschließen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}