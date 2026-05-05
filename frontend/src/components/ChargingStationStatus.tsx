import React, { useEffect, useState } from 'react';
import { ChargingStationIcon, BatteryIcon, EnergyFlowArrow, StatusBadge } from './icons/EnergyIcons';

// ============================================================================
// Ladestation Status Komponente
// ============================================================================
// Zeigt detaillierte Informationen über Ladestationen mit visuellen Indikatoren

interface ChargingStationStatusProps {
  stationId?: string;
  name?: string;
  power_kw?: number;
  voltage_v?: number;
  current_a?: number;
  ev_soc?: number;
  ev_range_km?: number;
  charging?: boolean;
  v2h?: boolean;
  max_power_kw?: number;
  estimated_time_remaining_min?: number;
  energy_delivered_kwh?: number;
  session_cost_eur?: number;
}

const ChargingStationStatus: React.FC<ChargingStationStatusProps> = ({
  name = 'Ladestation',
  power_kw = 0,
  voltage_v = 0,
  current_a = 0,
  ev_soc = 0,
  ev_range_km = 0,
  charging = false,
  v2h = false,
  max_power_kw = 11,
  estimated_time_remaining_min,
  energy_delivered_kwh = 0,
  session_cost_eur = 0
}) => {
  const [animatedPower, setAnimatedPower] = useState(0);
  
  // Smooth power animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPower(prev => {
        const diff = power_kw - prev;
        if (Math.abs(diff) < 0.1) return power_kw;
        return prev + diff * 0.2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [power_kw]);
  
  const getStatus = (): 'idle' | 'charging' | 'error' | 'v2h' => {
    if (v2h) return 'v2h';
    if (charging) return 'charging';
    return 'idle';
  };
  
  const status = getStatus();
  
  const formatTime = (minutes?: number) => {
    if (!minutes || minutes <= 0) return '--';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };
  
  const powerPercent = Math.min((animatedPower / max_power_kw) * 100, 100);
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ChargingStationIcon size={40} status={status} animated={charging || v2h} />
          <div>
            <h3 className="text-lg font-bold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">Max. {max_power_kw} kW</p>
          </div>
        </div>
        
        <div>
          {status === 'charging' && (
            <StatusBadge status="success" label="Lädt" icon="⚡" pulse />
          )}
          {status === 'v2h' && (
            <StatusBadge status="warning" label="V2H aktiv" icon="🏠" pulse />
          )}
          {status === 'idle' && (
            <StatusBadge status="info" label="Bereit" icon="⏸️" />
          )}
        </div>
      </div>
      
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Current Power */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-xs text-blue-600 font-medium mb-1">Aktuelle Leistung</div>
          <div className="text-2xl font-bold text-blue-900">
            {animatedPower.toFixed(2)} <span className="text-sm font-normal">kW</span>
          </div>
          {charging && (
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${powerPercent}%` }}
              />
            </div>
          )}
        </div>
        
        {/* Voltage */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="text-xs text-purple-600 font-medium mb-1">Spannung</div>
          <div className="text-2xl font-bold text-purple-900">
            {voltage_v.toFixed(0)} <span className="text-sm font-normal">V</span>
          </div>
        </div>
        
        {/* Current */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
          <div className="text-xs text-amber-600 font-medium mb-1">Stromstärke</div>
          <div className="text-2xl font-bold text-amber-900">
            {current_a.toFixed(1)} <span className="text-sm font-normal">A</span>
          </div>
        </div>
        
        {/* Energy Delivered */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div className="text-xs text-green-600 font-medium mb-1">Geladene Energie</div>
          <div className="text-2xl font-bold text-green-900">
            {energy_delivered_kwh.toFixed(2)} <span className="text-sm font-normal">kWh</span>
          </div>
        </div>
      </div>
      
      {/* EV Status */}
      {ev_soc > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">🚗 Fahrzeugstatus</h4>
            <BatteryIcon size={32} level={ev_soc} charging={charging} />
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Ladestand</div>
              <div className="font-bold text-gray-900">{ev_soc.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-500">Reichweite</div>
              <div className="font-bold text-gray-900">{ev_range_km.toFixed(0)} km</div>
            </div>
            <div>
              <div className="text-gray-500">Verbleibend</div>
              <div className="font-bold text-gray-900">{formatTime(estimated_time_remaining_min)}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Session Info */}
      {(charging || v2h) && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <EnergyFlowArrow 
                direction={v2h ? 'left' : 'right'} 
                size={20} 
                color={v2h ? '#F59E0B' : '#10B981'}
                animated 
              />
              <span className="text-gray-600">
                {v2h ? 'Entlädt ins Haus' : 'Lädt vom Netz/PV'}
              </span>
            </div>
            <div className="font-semibold text-gray-900">
              {session_cost_eur.toFixed(2)} €
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingStationStatus;
