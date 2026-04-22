import { Battery, TrendingUp, TrendingDown } from 'lucide-react';

interface BatteryData {
  soc: number;
  power_kw: number;
  capacity_kwh: number;
}

export default function BatteryWidget({ data }: { data: BatteryData }) {
  const isCharging = data.power_kw > 0;
  const isDischarging = data.power_kw < 0;
  const isIdle = data.power_kw === 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Heimspeicher (Batterie)</h3>
        <Battery className={`h-6 w-6 ${isCharging ? 'text-green-600' : isDischarging ? 'text-orange-600' : 'text-gray-400'}`} />
      </div>
      
      <div className="space-y-4">
        {/* SOC Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Ladezustand</span>
            <span className="font-semibold text-gray-900">{data.soc}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                data.soc > 70 ? 'bg-green-500' : data.soc > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.soc}%` }}
            />
          </div>
        </div>

        {/* Power Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-600">Leistung</span>
          <div className="flex items-center gap-2">
            {isCharging && <TrendingUp className="h-4 w-4 text-green-600" />}
            {isDischarging && <TrendingDown className="h-4 w-4 text-orange-600" />}
            <span className={`font-semibold ${isCharging ? 'text-green-600' : isDischarging ? 'text-orange-600' : 'text-gray-400'}`}>
              {Math.abs(data.power_kw).toFixed(1)} kW
            </span>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-xs text-gray-500 text-center pt-2">
          {isCharging && 'Lädt'}
          {isDischarging && 'Entlädt'}
          {isIdle && 'Bereit'}
        </div>
      </div>
    </div>
  );
}