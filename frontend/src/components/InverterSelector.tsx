import React, { useState } from "react";

const inverterList = [
  { id: "fronius", name: "Fronius Symo", protocol: "HTTP" },
  { id: "sma", name: "SMA Sunny Boy", protocol: "Modbus" },
  { id: "huawei", name: "Huawei SUN2000", protocol: "Cloud" },
  { id: "kostal", name: "Kostal Plenticore", protocol: "Modbus" },
];

export default function InverterSelector({ onSelect }: { onSelect: (inverter: any) => void }) {
  const [selected, setSelected] = useState<string>("");

  return (
    <div className="inverter-selector">
      <h2>Wechselrichter auswählen</h2>
      <select
        value={selected}
        onChange={e => {
          setSelected(e.target.value);
          const inv = inverterList.find(i => i.id === e.target.value);
          if (inv) onSelect(inv);
        }}
      >
        <option value="">Bitte wählen...</option>
        {inverterList.map(inv => (
          <option key={inv.id} value={inv.id}>
            {inv.name} ({inv.protocol})
          </option>
        ))}
      </select>
    </div>
  );
}
