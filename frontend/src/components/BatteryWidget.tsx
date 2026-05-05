import { Battery, TrendingUp, TrendingDown } from 'lucide-react';

interface BatteryData {
  soc: number;
  power_kw: number;
  capacity_kwh: number;
}

export default function BatteryWidget({ data }: { data: BatteryData }) {
  const safeSoc = Number.isFinite(data.soc) ? Math.max(0, Math.min(100, data.soc)) : 0;
  const safePowerKw = Number.isFinite(data.power_kw) ? data.power_kw : 0;
  const isCharging = safePowerKw > 0;
  const isDischarging = safePowerKw < 0;
  const isIdle = safePowerKw === 0;

  return (
    <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/88 shadow-[0_14px_36px_rgba(2,6,23,0.35)] p-6" style={{ color: '#e2e8f0' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-semibold tracking-wide" style={{ color: '#e0f2fe', fontSize: '1.18rem', lineHeight: 1.25 }}>Heimspeicher (Batterie)</h3>
        <Battery className={`h-6 w-6 ${isCharging ? 'text-green-600' : isDischarging ? 'text-orange-600' : 'text-gray-400'}`} />
      </div>
      
      <div className="space-y-4">
        {/* SOC Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-cyan-100/85" style={{ color: '#c7d2fe', fontWeight: 600 }}>Ladezustand</span>
            <span className="font-semibold text-cyan-50" style={{ color: '#f8fafc', fontWeight: 700 }}>{safeSoc}%</span>
          </div>
          <div className="w-full bg-slate-700/70 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                safeSoc > 70 ? 'bg-green-400' : safeSoc > 30 ? 'bg-amber-400' : 'bg-rose-400'
              }`}
              style={{ width: `${safeSoc}%` }}
            />
          </div>
        </div>

        {/* Power Status */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/70">
          <span className="text-sm text-cyan-100/85" style={{ color: '#c7d2fe', fontWeight: 600 }}>Leistung</span>
          <div className="flex items-center gap-2">
            {isCharging && <TrendingUp className="h-4 w-4 text-green-600" />}
            {isDischarging && <TrendingDown className="h-4 w-4 text-orange-600" />}
            <span className={`font-semibold ${isCharging ? 'text-green-600' : isDischarging ? 'text-orange-600' : 'text-gray-400'}`}>
              {Math.abs(safePowerKw).toFixed(1)} kW
            </span>
          </div>
        </div>

        {/* Status Text */}
  <div className="text-xs text-cyan-100/70 text-center pt-2" style={{ color: '#94a3b8', fontWeight: 600 }}>
          {isCharging && 'Lädt'}
          {isDischarging && 'Entlädt'}
          {isIdle && 'Bereit'}
        </div>
      </div>
    </div>
  );
}