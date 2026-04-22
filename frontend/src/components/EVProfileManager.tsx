
import { useEffect, useState } from "react";
import carDataRaw from "../data/cars.json";

// Add type for carData to allow dynamic string indexing
type CarDataType = {
  [manufacturer: string]: {
    [model: string]: {
      battery_capacity_kwh: number;
      max_dc_charge_kw: number;
      [key: string]: any;
    };
  };
};

// Cast via unknown so TypeScript accepts the JSON shape while we use a flexible index signature
const carData: CarDataType = carDataRaw as unknown as CarDataType;

const API_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== ""
    ? import.meta.env.VITE_API_URL
  : import.meta.env.VITE_API_URL || 'http://localhost:8000';

type EVProfile = {
  manufacturer: string;
  model: string;
  capacity_kwh: number;
  max_charge_kw?: number;
  connector?: string;
  data_source?: "wallbox" | "cloud" | "phone";
  notes?: string;
};

export default function EVProfileManager({
  evSoc,
  evPowerKw,
}: {
  evSoc?: number;
  evPowerKw?: number;
}) {
  const [profiles, setProfiles] = useState<Record<string, EVProfile>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dropdown-Auswahl für Hersteller & Modell
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // Listen aus JSON
  const manufacturerList = Object.keys(carData);
  const modelList = selectedManufacturer
    ? Object.keys(carData[selectedManufacturer])
    : [];

  // Aktuell gewähltes Fahrzeug aus JSON
  const selectedCar =
    selectedManufacturer && selectedModel
      ? carData[selectedManufacturer][selectedModel]
      : null;

  // Formularzustand
  const [form, setForm] = useState<EVProfile>({
    manufacturer: "",
    model: "",
    capacity_kwh: 0,
    max_charge_kw: 0,
    connector: "type2",
    data_source: "wallbox",
    notes: "",
  });

  // Bei Modellwechsel: Fahrzeugdaten übernehmen
  useEffect(() => {
    if (selectedCar) {
      setForm({
        manufacturer: selectedManufacturer,
        model: selectedModel,
        capacity_kwh: selectedCar.battery_capacity_kwh,
        max_charge_kw: selectedCar.max_dc_charge_kw,
        connector: "type2",
        data_source: "wallbox",
        notes: "",
      });
    }
  }, [selectedManufacturer, selectedModel]);

  // Profile laden
  const load = async () => {
    try {
      const res = await fetch(`${API_URL}/ev/profiles`); // Fetch profiles from API
      const data = await res.json();
      setProfiles(data.ev_profiles || {});
      setActiveId(data.active_ev_id || null);
    } catch (err) {
      console.error("EVProfileManager load error:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Profil speichern
  const addProfile = async () => {
    if (!selectedManufacturer || !selectedModel) {
      alert("Bitte Hersteller und Modell auswählen!");
      return;
    }
    setSaving(true);
    try {
      // Use manufacturer+model as id
      const id = `${selectedManufacturer}_${selectedModel}`;
      const res = await fetch(`${API_URL}/ev/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": 'mein_geheimer_schulkey123'
        },
        body: JSON.stringify({ id, profile: form }),
      });
      if (res.ok) {
        setSelectedManufacturer("");
        setSelectedModel("");
        setForm({
          manufacturer: "",
          model: "",
          capacity_kwh: 0,
          max_charge_kw: 0,
          connector: "type2",
          data_source: "wallbox",
          notes: "",
        });
        await load();
      } else {
        alert("Fehler beim Speichern");
      }
    } catch (err) {
      console.error("Add profile error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Profil aktivieren
  const setActive = async (id: string | null) => {
    try {
      // If id is null, deactivate all
      const res = await fetch(`${API_URL}/ev/profiles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": 'mein_geheimer_schulkey123'
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setActiveId(id);
        await load();
      }
    } catch (err) {
      console.error("Set active error:", err);
    }
  };

  // Profil löschen
  const remove = async (id: string) => {
    if (!confirm("Profil löschen?")) return;
    try {
      await fetch(`${API_URL}/ev/profiles`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": 'mein_geheimer_schulkey123'
        },
        body: JSON.stringify({ id }),
      });
      await load();
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  // Ladeanalyse
  const active = activeId ? profiles[activeId] : undefined;
  const soc = Math.max(0, Math.min(100, evSoc ?? 0));
  const capacity = active?.capacity_kwh ?? 0;
  const energyMissingKwh = capacity * (1 - soc / 100);
  const power = Math.max(0, evPowerKw ?? 0);
  const etaHours = power > 0 ? energyMissingKwh / power : undefined;

  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #eee",
      }}
    >
      <h3>🚗 E-Auto Profil</h3>

      {/* Aktives Fahrzeug */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <strong>Aktives Fahrzeug</strong>
          {active ? (
            <div
              style={{
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 8,
                marginTop: 8,
              }}
            >
              <div>
                {active.manufacturer} {active.model}
              </div>
              <div style={{ color: "#666", fontSize: 13 }}>
                {capacity} kWh · max {active.max_charge_kw ?? 11} kW ·{" "}
                {active.connector?.toUpperCase()}
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                Datenquelle: {active.data_source}
              </div>
              <button
                onClick={() => setActive(null)}
                style={{
                  marginTop: 10,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Zuweisung aufheben
              </button>
            </div>
          ) : (
            <div style={{ color: "#999" }}>Kein Fahrzeug zugewiesen</div>
          )}
        </div>

        {/* Batterieanalyse */}
        <div>
          <strong>Batterie-Analyse</strong>
          <div
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <div>SOC: {soc.toFixed(1)}%</div>
            <div>Ladeleistung: {power.toFixed(2)} kW</div>
            <div>Kapazität: {capacity.toFixed(1)} kWh</div>
            <div>
              Rest bis 100%: {energyMissingKwh.toFixed(2)} kWh · ETA:{" "}
              {etaHours !== undefined ? `${etaHours.toFixed(2)} h` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Neue Auswahl */}
      <div style={{ marginTop: 20 }}>
        <strong>Neues EV-Profil</strong>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addProfile();
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginTop: 8,
          }}
        >
          <select
            value={selectedManufacturer}
            onChange={(e) => {
              setSelectedManufacturer(e.target.value);
              setSelectedModel("");
            }}
            style={{ padding: 8 }}
          >
            <option value="">Hersteller wählen</option>
            {manufacturerList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!selectedManufacturer}
            style={{ padding: 8 }}
          >
            <option value="">Modell wählen</option>
            {modelList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Kapazität (kWh)"
            value={form.capacity_kwh}
            disabled
            style={{ padding: 8 }}
          />
          <input
            type="number"
            placeholder="max. Ladeleistung (kW)"
            value={form.max_charge_kw}
            disabled
            style={{ padding: 8 }}
          />

          <select
            value={form.connector}
            onChange={(e) => setForm({ ...form, connector: e.target.value })}
            style={{ padding: 8 }}
          >
            <option value="type2">Type 2</option>
            <option value="ccs">CCS</option>
            <option value="chademo">CHAdeMO</option>
          </select>

          <select
            value={form.data_source}
            onChange={(e) =>
              setForm({ ...form, data_source: e.target.value as any })
            }
            style={{ padding: 8 }}
          >
            <option value="wallbox">Wallbox</option>
            <option value="cloud">Hersteller-Cloud</option>
            <option value="phone">Phone-Relay</option>
          </select>

          <textarea
            placeholder="Notizen (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ gridColumn: "1 / span 2", padding: 8 }}
          />

          <button
            type="submit"
            disabled={saving || !selectedManufacturer || !selectedModel}
            style={{ gridColumn: "1 / span 2", padding: "8px 16px" }}
          >
            {saving ? "Speichere..." : "Speichern"}
          </button>
        </form>
      </div>

      {/* Profileliste */}
      <div style={{ marginTop: 20 }}>
        <strong>Profile</strong>
        {Object.keys(profiles).length === 0 && (
          <div style={{ color: "#999" }}>Keine EV-Profile</div>
        )}
        {Object.entries(profiles).map(([id, p]) => (
          <div
            key={id}
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              marginTop: 8,
              background: activeId === id ? "#f0fff0" : "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>
                  {p.manufacturer} {p.model}
                </strong>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {p.capacity_kwh} kWh · max {p.max_charge_kw ?? 11} kW ·{" "}
                  {p.connector?.toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Quelle: {p.data_source}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setActive(id)}
                  style={{ padding: "6px 12px", cursor: "pointer" }}
                >
                  {activeId === id ? "Aktiv" : "Aktivieren"}
                </button>
                <button
                  onClick={() => remove(id)}
                  style={{
                    padding: "6px 12px",
                    cursor: "pointer",
                    color: "#b00020",
                  }}
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
