import React, { useEffect, useState } from 'react';
import { 
  SolarPanelIcon, 
  BatteryIcon, 
  GridIcon, 
  HouseIcon, 
  EVIcon, 
  EnergyFlowArrow 
} from './icons/EnergyIcons';

// ============================================================================
// Enhanced Energy Flow Diagram
// ============================================================================
// Interaktive, animierte Visualisierung des Energieflusses mit Real-time Updates

interface EnergyFlowData {
  pv_power_kw: number;
  house_load_kw: number;
  ev_power_kw: number;
  battery_power_kw: number;
  battery_soc: number;
  grid_import_kw: number;
  grid_export_kw: number;
  ev_soc?: number;
  ev_charging?: boolean;
}

interface FlowPath {
  from: string;
  to: string;
  power_kw: number;
  color: string;
}

const EnhancedEnergyFlow: React.FC<{ data: EnergyFlowData }> = ({ data }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [flowPaths, setFlowPaths] = useState<FlowPath[]>([]);
  
  // Calculate energy flow paths
  useEffect(() => {
    const paths: FlowPath[] = [];
    
    // PV Generation flows
    if (data.pv_power_kw > 0) {
      const pvToHouse = Math.min(data.pv_power_kw, data.house_load_kw);
      if (pvToHouse > 0.1) {
        paths.push({ from: 'pv', to: 'house', power_kw: pvToHouse, color: '#10B981' });
      }
      
      let remainingPV = data.pv_power_kw - pvToHouse;
      
      // PV to Battery
      if (data.battery_power_kw > 0 && remainingPV > 0) {
        const pvToBattery = Math.min(remainingPV, data.battery_power_kw);
        paths.push({ from: 'pv', to: 'battery', power_kw: pvToBattery, color: '#3B82F6' });
        remainingPV -= pvToBattery;
      }
      
      // PV to EV
      if (data.ev_charging && data.ev_power_kw > 0 && remainingPV > 0) {
        const pvToEV = Math.min(remainingPV, data.ev_power_kw);
        paths.push({ from: 'pv', to: 'ev', power_kw: pvToEV, color: '#6366F1' });
        remainingPV -= pvToEV;
      }
      
      // PV to Grid (export)
      if (remainingPV > 0.1) {
        paths.push({ from: 'pv', to: 'grid', power_kw: remainingPV, color: '#8B5CF6' });
      }
    }
    
    // Battery discharge to house
    if (data.battery_power_kw < 0) {
      const batteryToHouse = Math.abs(data.battery_power_kw);
      paths.push({ from: 'battery', to: 'house', power_kw: batteryToHouse, color: '#F59E0B' });
    }
    
    // Grid import
    if (data.grid_import_kw > 0.1) {
      paths.push({ from: 'grid', to: 'house', power_kw: data.grid_import_kw, color: '#EF4444' });
    }
    
    setFlowPaths(paths);
  }, [data]);
  
  const NodeCard: React.FC<{
    id: string;
    title: string;
    icon: React.ReactNode;
    value: string;
    subtitle?: string;
    color: string;
  }> = ({ id, title, icon, value, subtitle, color }) => {
    const isHovered = hoveredNode === id;
    const isConnected = flowPaths.some(p => p.from === id || p.to === id);
    
    return (
      <div
        className={`
          relative bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer
          ${isHovered ? `border-${color} shadow-xl scale-105 z-10` : 'border-gray-200 shadow-md'}
          ${!isHovered && isConnected ? 'opacity-70' : ''}
        `}
        onMouseEnter={() => setHoveredNode(id)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={isHovered ? 'scale-110 transition-transform' : ''}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500">{title}</div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
          </div>
        </div>
      </div>
    );
  };
  
  // FlowLine component for future SVG path implementation
  // const FlowLine: React.FC<{ path: FlowPath }> = ({ path }) => {
  //   const isRelevant = hoveredNode === null || hoveredNode === path.from || hoveredNode === path.to;
  //   return (
  //     <div className={`absolute transition-opacity duration-300 ${isRelevant ? 'opacity-100' : 'opacity-20'}`}>
  //       <EnergyFlowArrow 
  //         size={40} 
  //         color={path.color} 
  //         direction="right" 
  //         animated={isRelevant}
  //       />
  //       <div 
  //         className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
  //                    bg-white px-2 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap"
  //         style={{ color: path.color }}
  //       >
  //         {path.power_kw.toFixed(2)} kW
  //       </div>
  //     </div>
  //   );
  // };
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        ⚡ Live Energiefluss
        <span className="ml-auto text-sm font-normal text-gray-500">Echtzeit-Visualisierung</span>
      </h3>
      
      {/* Desktop Grid Layout */}
      <div className="hidden md:grid md:grid-cols-5 md:gap-8 items-center relative">
        {/* Row 1: PV */}
        <div className="col-start-3">
          <NodeCard
            id="pv"
            title="PV-Anlage"
            icon={<SolarPanelIcon size={40} generating={data.pv_power_kw > 0} />}
            value={`${data.pv_power_kw.toFixed(2)} kW`}
            subtitle="Erzeugung"
            color="amber-500"
          />
        </div>
        
        {/* Row 2: Battery - Grid */}
        <div className="col-start-1">
          <NodeCard
            id="battery"
            title="Heimspeicher"
            icon={<BatteryIcon size={40} level={data.battery_soc} charging={data.battery_power_kw > 0} />}
            value={`${Math.abs(data.battery_power_kw).toFixed(2)} kW`}
            subtitle={`${data.battery_soc.toFixed(0)}% SOC`}
            color="blue-500"
          />
        </div>
        
        <div className="col-start-3">
          <NodeCard
            id="house"
            title="Hausverbrauch"
            icon={<HouseIcon size={40} consuming={data.house_load_kw > 0} />}
            value={`${data.house_load_kw.toFixed(2)} kW`}
            subtitle="Aktuell"
            color="blue-600"
          />
        </div>
        
        <div className="col-start-5">
          <NodeCard
            id="grid"
            title="Stromnetz"
            icon={<GridIcon size={40} mode={data.grid_import_kw > 0 ? 'import' : data.grid_export_kw > 0 ? 'export' : 'neutral'} />}
            value={`${(data.grid_import_kw || data.grid_export_kw).toFixed(2)} kW`}
            subtitle={data.grid_import_kw > 0 ? 'Import' : data.grid_export_kw > 0 ? 'Export' : 'Neutral'}
            color="red-500"
          />
        </div>
        
        {/* Row 3: EV */}
        <div className="col-start-3">
          <NodeCard
            id="ev"
            title="Elektroauto"
            icon={<EVIcon size={40} status={data.ev_charging ? 'charging' : 'idle'} />}
            value={`${Math.abs(data.ev_power_kw).toFixed(2)} kW`}
            subtitle={data.ev_soc ? `${data.ev_soc.toFixed(0)}% SOC` : undefined}
            color="indigo-600"
          />
        </div>
        
        {/* Flow Arrows - positioned between nodes */}
        {/* These would need proper SVG paths for production */}
      </div>
      
      {/* Mobile Stack Layout */}
      <div className="md:hidden space-y-4">
        <NodeCard
          id="pv"
          title="PV-Anlage"
          icon={<SolarPanelIcon size={36} generating={data.pv_power_kw > 0} />}
          value={`${data.pv_power_kw.toFixed(2)} kW`}
          subtitle="Erzeugung"
          color="amber-500"
        />
        
        <div className="flex justify-center">
          <EnergyFlowArrow direction="down" size={32} color="#10B981" animated />
        </div>
        
        <NodeCard
          id="house"
          title="Hausverbrauch"
          icon={<HouseIcon size={36} consuming={data.house_load_kw > 0} />}
          value={`${data.house_load_kw.toFixed(2)} kW`}
          color="blue-600"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <NodeCard
            id="battery"
            title="Batterie"
            icon={<BatteryIcon size={32} level={data.battery_soc} charging={data.battery_power_kw > 0} />}
            value={`${data.battery_soc.toFixed(0)}%`}
            color="blue-500"
          />
          
          <NodeCard
            id="ev"
            title="E-Auto"
            icon={<EVIcon size={32} status={data.ev_charging ? 'charging' : 'idle'} />}
            value={`${data.ev_soc?.toFixed(0) || 0}%`}
            color="indigo-600"
          />
        </div>
        
        <NodeCard
          id="grid"
          title="Stromnetz"
          icon={<GridIcon size={36} mode={data.grid_import_kw > 0 ? 'import' : 'export'} />}
          value={`${(data.grid_import_kw || data.grid_export_kw).toFixed(2)} kW`}
          subtitle={data.grid_import_kw > 0 ? 'Import' : 'Export'}
          color="red-500"
        />
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-300">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Eigenverbrauch</div>
            <div className="text-lg font-bold text-green-600">
              {((1 - data.grid_import_kw / (data.house_load_kw || 1)) * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Autarkie</div>
            <div className="text-lg font-bold text-blue-600">
              {((data.pv_power_kw / (data.house_load_kw || 1)) * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">PV-Nutzung</div>
            <div className="text-lg font-bold text-amber-600">
              {(((data.pv_power_kw - data.grid_export_kw) / (data.pv_power_kw || 1)) * 100).toFixed(0)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Gesamtfluss</div>
            <div className="text-lg font-bold text-purple-600">
              {(data.pv_power_kw + data.grid_import_kw).toFixed(2)} kW
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEnergyFlow;
