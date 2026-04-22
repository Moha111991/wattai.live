import React, { useState } from "react";

const consumerList = [
  { id: "heatpump", name: "Wärmepumpe", capacity: 8, power: 2.5 },
  { id: "ev", name: "E-Auto", capacity: 60, power: 11 },
  { id: "battery", name: "Heimspeicher", capacity: 10, power: 5 },
];

export default function ConsumerProfileSelector({ onSelect }: { onSelect: (profile: any) => void }) {
  const [selected, setSelected] = useState<string>("");

  return (
    <div className="consumer-profile-selector">
      <h2>Verbraucherprofil auswählen</h2>
      <select
        value={selected}
        onChange={e => {
          setSelected(e.target.value);
          const profile = consumerList.find(c => c.id === e.target.value);
          if (profile) onSelect(profile);
        }}
      >
        <option value="">Bitte wählen...</option>
        {consumerList.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} (Kapazität: {c.capacity} kWh, Leistung: {c.power} kW)
          </option>
        ))}
      </select>
    </div>
  );
}
