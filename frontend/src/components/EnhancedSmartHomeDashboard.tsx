import React, { useState } from 'react';

// ============================================================================
// Enhanced Smart Home Dashboard Component
// ============================================================================
// Moderne Visualisierung von Smart Home Geräten mit Priorisierung und Steuerung

interface SmartHomeDevice {
  id: string;
  name: string;
  type: 'washing_machine' | 'dishwasher' | 'dryer' | 'ev_charger' | 'heat_pump' | 'lights' | 'other';
  status: 'active' | 'standby' | 'offline' | 'scheduled';
  power_w: number;
  flexibility: 'high' | 'medium' | 'low';
  priority?: number;
  schedulable?: boolean;
  estimated_runtime_min?: number;
  next_schedule?: Date;
  room?: string;
  manufacturer?: string;
}

interface SmartHomeDashboardProps {
  devices?: SmartHomeDevice[];
  onDeviceControl?: (deviceId: string, action: 'start' | 'stop' | 'schedule') => void;
  onPriorityChange?: (deviceId: string, priority: number) => void;
}

const DEVICE_ICONS: Record<SmartHomeDevice['type'], string> = {
  washing_machine: '🧺',
  dishwasher: '🍽️',
  dryer: '👔',
  ev_charger: '🔌',
  heat_pump: '🌡️',
  lights: '💡',
  other: '📱'
};

const FLEXIBILITY_COLORS = {
  high: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', badge: 'bg-green-100' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-100' },
  low: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100' }
};

const STATUS_COLORS = {
  active: { bg: 'bg-blue-500', text: 'text-blue-500', label: 'Aktiv' },
  standby: { bg: 'bg-gray-400', text: 'text-gray-500', label: 'Bereit' },
  offline: { bg: 'bg-red-500', text: 'text-red-500', label: 'Offline' },
  scheduled: { bg: 'bg-purple-500', text: 'text-purple-500', label: 'Geplant' }
};

const SmartHomeDeviceCard: React.FC<{
  device: SmartHomeDevice;
  onControl?: (action: 'start' | 'stop' | 'schedule') => void;
  onPriorityChange?: (priority: number) => void;
}> = ({ device, onControl, onPriorityChange }) => {
  const flexColors = FLEXIBILITY_COLORS[device.flexibility];
  const statusInfo = STATUS_COLORS[device.status];
  const [showScheduler, setShowScheduler] = useState(false);
  
  return (
    <div className={`
      relative rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg group
      ${flexColors.bg} ${flexColors.border}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{DEVICE_ICONS[device.type]}</span>
          <div>
            <h4 className="font-bold text-gray-900">{device.name}</h4>
            {device.room && <p className="text-xs text-gray-500">{device.room}</p>}
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusInfo.bg} ${device.status === 'active' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white bg-opacity-60 rounded-lg p-2">
          <div className="text-xs text-gray-600">Leistung</div>
          <div className="text-lg font-bold text-gray-900">
            {device.power_w.toFixed(0)} <span className="text-xs font-normal">W</span>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-60 rounded-lg p-2">
          <div className="text-xs text-gray-600">Flexibilität</div>
          <div className={`text-sm font-bold ${flexColors.text} capitalize`}>
            {device.flexibility === 'high' ? 'Hoch' : device.flexibility === 'medium' ? 'Mittel' : 'Niedrig'}
          </div>
        </div>
      </div>
      
      {/* Runtime & Schedule */}
      {device.estimated_runtime_min && (
        <div className="mb-3 text-sm text-gray-700">
          <span className="font-medium">Laufzeit:</span> ~{device.estimated_runtime_min} min
        </div>
      )}
      
      {device.next_schedule && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-purple-600">📅</span>
          <span className="text-gray-700">
            Geplant: {new Date(device.next_schedule).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
      
      {/* Priority Slider */}
      {device.flexibility !== 'low' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Priorität</span>
            <span className="font-bold">{device.priority || 5}/10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={device.priority || 5}
            onChange={(e) => onPriorityChange?.(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        {device.status === 'standby' && (
          <button
            onClick={() => onControl?.('start')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            ▶️ Starten
          </button>
        )}
        
        {device.status === 'active' && (
          <button
            onClick={() => onControl?.('stop')}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            ⏸️ Stoppen
          </button>
        )}
        
        {device.schedulable && (
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className={`flex-1 ${showScheduler ? 'bg-purple-600' : 'bg-purple-500'} hover:bg-purple-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors`}
          >
            📅 {showScheduler ? 'Schließen' : 'Planen'}
          </button>
        )}
      </div>
      
      {/* Scheduler UI */}
      {showScheduler && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Start-Zeit wählen
          </label>
          <input
            type="time"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            onChange={(e) => {
              // Handle scheduling logic
              console.log('Schedule for:', e.target.value);
            }}
          />
          <button
            onClick={() => {
              onControl?.('schedule');
              setShowScheduler(false);
            }}
            className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Zeitplan bestätigen
          </button>
        </div>
      )}
    </div>
  );
};

const EnhancedSmartHomeDashboard: React.FC<SmartHomeDashboardProps> = ({
  devices = [],
  onDeviceControl,
  onPriorityChange
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'flexible' | 'scheduled'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'power' | 'priority'>('priority');
  
  // Summary statistics
  const stats = {
    total: devices.length,
    active: devices.filter(d => d.status === 'active').length,
    flexible: devices.filter(d => d.flexibility === 'high').length,
    totalPower: devices.reduce((sum, d) => sum + (d.status === 'active' ? d.power_w : 0), 0),
    scheduled: devices.filter(d => d.status === 'scheduled').length
  };
  
  // Filter and sort devices
  const filteredDevices = devices
    .filter(d => {
      if (filter === 'all') return true;
      if (filter === 'active') return d.status === 'active';
      if (filter === 'flexible') return d.flexibility === 'high';
      if (filter === 'scheduled') return d.status === 'scheduled';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'power') return b.power_w - a.power_w;
      if (sortBy === 'priority') return (b.priority || 0) - (a.priority || 0);
      return 0;
    });
  
  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4">🏠 Smart Home Dashboard</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
            <div className="text-xs opacity-90">Geräte gesamt</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
            <div className="text-xs opacity-90">Aktiv</div>
            <div className="text-2xl font-bold">{stats.active}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
            <div className="text-xs opacity-90">Flexibel</div>
            <div className="text-2xl font-bold">{stats.flexible}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
            <div className="text-xs opacity-90">Geplant</div>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-3">
            <div className="text-xs opacity-90">Gesamtlast</div>
            <div className="text-2xl font-bold">
              {(stats.totalPower / 1000).toFixed(1)} <span className="text-sm">kW</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters & Sorting */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white rounded-lg p-4 shadow">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aktiv ({stats.active})
          </button>
          <button
            onClick={() => setFilter('flexible')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'flexible' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Flexibel ({stats.flexible})
          </button>
          <button
            onClick={() => setFilter('scheduled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Geplant ({stats.scheduled})
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Sortieren:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'power' | 'priority')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="priority">Priorität</option>
            <option value="power">Leistung</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      
      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map(device => (
          <SmartHomeDeviceCard
            key={device.id}
            device={device}
            onControl={(action) => onDeviceControl?.(device.id, action)}
            onPriorityChange={(priority) => onPriorityChange?.(device.id, priority)}
          />
        ))}
      </div>
      
      {filteredDevices.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">Keine Geräte gefunden</p>
          <p className="text-gray-400 text-sm mt-2">Ändern Sie die Filter oder fügen Sie neue Geräte hinzu</p>
        </div>
      )}
      
      {/* AI Optimization Hint */}
      {stats.flexible > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🤖</span>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">KI-Optimierung verfügbar</h4>
              <p className="text-sm text-gray-700 mb-3">
                {stats.flexible} flexible Geräte können automatisch optimiert werden, 
                um Kosten zu sparen und PV-Überschuss zu nutzen.
              </p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                KI-Optimierung starten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSmartHomeDashboard;
