interface FlowProps {
  data: {
    pv_power_kw: number;
    house_load_w: number;
    ev_power_w: number;
    grid_import_w: number;
    grid_export_w: number;
    battery_power_kw?: number;
    battery_soc?: number;
    ev_soc?: number;
  };
  battery: { soc: number; power_kw: number };
}

function fmtKw(v: number) {
  return v.toFixed(1) + ' kW';
}

export default function FlowDiagram({ data, battery }: FlowProps) {
  const pv = data.pv_power_kw;
  const house = data.house_load_w / 1000;
  const ev = data.ev_power_w / 1000;
  const batt = battery.power_kw; // + laden, - entladen
  const gridOut = data.grid_export_w / 1000;

  const pv_to_house = Math.min(pv, house);
  let remaining_pv = Math.max(0, pv - pv_to_house);
  const pv_to_batt = batt > 0 ? Math.min(remaining_pv, batt) : 0;
  remaining_pv -= pv_to_batt;
  const pv_to_grid = remaining_pv;

  const batt_to_house = batt < 0 ? Math.min(house - pv_to_house, Math.abs(batt)) : 0;
  const grid_to_house = Math.max(0, house - pv_to_house - batt_to_house);

  const ev_load_kw = Math.max(0, ev);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Energiefluss</h3>
      <div className="text-xs text-gray-500 mb-3">Live-Flüsse (vereinfachtes Modell)</div>

      <div className="grid grid-cols-7 gap-2 items-center text-sm font-medium">
        <div className="col-span-1 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold">PV</div>
          <div className="mt-1 text-xs text-gray-600">{fmtKw(pv)}</div>
        </div>
        <div className="col-span-6 space-y-2">
          <FlowRow label="→ Haus" value={pv_to_house} color="bg-green-400" />
          <FlowRow label="→ Batterie" value={pv_to_batt} color="bg-blue-400" />
          <FlowRow label="→ Netz (Einspeisung)" value={pv_to_grid} color="bg-purple-400" />
        </div>

        <div className="col-span-1 flex flex-col items-center mt-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold ${
            batt > 0 ? 'bg-blue-100 text-blue-600' : batt < 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
          }`}>Bat</div>
          <div className="mt-1 text-xs text-gray-600">{battery.soc.toFixed(0)}% / {fmtKw(Math.abs(batt))}</div>
        </div>
        <div className="col-span-6 space-y-2 mt-4">
          <FlowRow label="Batterie → Haus" value={batt_to_house} color="bg-orange-400" />
          <FlowRow label="Netz → Haus (Bezug)" value={grid_to_house} color="bg-red-400" />
          <FlowRow label="Netz ← Einspeisung" value={gridOut} color="bg-purple-400" />
        </div>

        <div className="col-span-1 flex flex-col items-center mt-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold ${
            ev_load_kw > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
          }`}>EV</div>
          <div className="mt-1 text-xs text-gray-600">{data.ev_soc?.toFixed?.(0) ?? '--'}% / {fmtKw(ev_load_kw)}</div>
        </div>
        <div className="col-span-6 space-y-2 mt-4">
          <FlowRow label="Ladung EV (gesamt)" value={ev_load_kw} color="bg-indigo-400" />
        </div>
      </div>
    </div>
  );
}

function FlowRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-gray-700">{label}</div>
      <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
        <div className={`h-4 ${color} transition-all`} style={{ width: `${Math.min(100, value * 15)}%` }} />
      </div>
      <div className="w-16 text-right text-gray-800">{value > 0 ? value.toFixed(1) : '0.0'} kW</div>
    </div>
  );
}