import React from 'react';

// ============================================================================
// Icon System für EnergyFlowHub_EV
// ============================================================================
// Konsistente, skalierbare Icons für Ladestationen, Energiefluss, und Status

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  animated?: boolean;
}

// ============================================================================
// Ladestation Status Icons
// ============================================================================

export const ChargingStationIcon: React.FC<IconProps & { status?: 'idle' | 'charging' | 'error' | 'v2h' }> = ({ 
  size = 24, 
  color,
  status = 'idle',
  className = '' 
}) => {
  const statusColors = {
    idle: '#9CA3AF',      // gray-400
    charging: '#10B981',  // green-500
    error: '#EF4444',     // red-500
    v2h: '#F59E0B'        // amber-500
  };
  
  const fillColor = color || statusColors[status];
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Ladestation Body */}
      <rect x="6" y="4" width="12" height="16" rx="2" stroke={fillColor} strokeWidth="2" fill={status === 'charging' ? `${fillColor}20` : 'transparent'} />
      
      {/* Display */}
      <rect x="8" y="6" width="8" height="4" rx="1" fill={fillColor} opacity="0.3" />
      
      {/* Ladepunkte */}
      <circle cx="10" cy="14" r="1.5" fill={fillColor} />
      <circle cx="14" cy="14" r="1.5" fill={fillColor} />
      
      {/* Kabel */}
      <path d="M 10 17 Q 10 19, 8 20" stroke={fillColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      
      {/* Status Indicator */}
      {status === 'charging' && (
        <g className="animate-pulse">
          <path d="M 12 8 L 11 11 L 13 11 L 12 14" fill={fillColor} />
        </g>
      )}
      
      {status === 'error' && (
        <g>
          <circle cx="18" cy="6" r="3" fill="#EF4444" />
          <path d="M 18 5 L 18 7 M 18 8 L 18 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      
      {status === 'v2h' && (
        <g className="animate-pulse">
          <path d="M 16 10 L 14 12 L 16 12 L 14 14" fill={fillColor} />
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// Energiefluss-Pfeile (animiert)
// ============================================================================

export const EnergyFlowArrow: React.FC<IconProps & { direction: 'up' | 'down' | 'left' | 'right' | 'bidirectional' }> = ({
  size = 24,
  color = '#10B981',
  direction = 'right',
  animated = true,
  className = ''
}) => {
  const rotations = {
    up: -90,
    down: 90,
    left: 180,
    right: 0,
    bidirectional: 0
  };
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      {direction === 'bidirectional' ? (
        <>
          <path d="M 4 12 L 20 12" stroke={color} strokeWidth="2" strokeLinecap="round" className={animated ? 'animate-pulse' : ''} />
          <path d="M 17 8 L 20 12 L 17 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 7 8 L 4 12 L 7 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M 4 12 L 20 12" stroke={color} strokeWidth="2" strokeLinecap="round" className={animated ? 'animate-pulse' : ''} />
          <path d="M 16 8 L 20 12 L 16 16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {animated && (
            <>
              <circle cx="8" cy="12" r="2" fill={color} className="animate-ping" opacity="0.6" />
              <circle cx="14" cy="12" r="2" fill={color} className="animate-ping" style={{ animationDelay: '0.3s' }} opacity="0.6" />
            </>
          )}
        </>
      )}
    </svg>
  );
};

// ============================================================================
// Batterie Status Icon
// ============================================================================

export const BatteryIcon: React.FC<IconProps & { level: number; charging?: boolean }> = ({
  size = 24,
  color,
  level = 50,
  charging = false,
  className = ''
}) => {
  const getColor = () => {
    if (color) return color;
    if (level > 60) return '#10B981'; // green
    if (level > 20) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };
  
  const fillColor = getColor();
  const fillHeight = (level / 100) * 14;
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Battery Body */}
      <rect x="4" y="7" width="14" height="16" rx="2" stroke={fillColor} strokeWidth="2" fill="transparent" />
      
      {/* Battery Terminal */}
      <rect x="9" y="4" width="4" height="3" rx="1" fill={fillColor} />
      
      {/* Battery Level */}
      <rect 
        x="6" 
        y={21 - fillHeight} 
        width="10" 
        height={fillHeight} 
        rx="1" 
        fill={fillColor}
        className={charging ? 'animate-pulse' : ''}
      />
      
      {/* Charging Indicator */}
      {charging && (
        <g className="animate-pulse">
          <path d="M 11 11 L 10 14 L 12 14 L 11 17" fill="white" />
        </g>
      )}
      
      {/* Percentage Text */}
      <text x="11" y="32" fontSize="6" fill={fillColor} textAnchor="middle" fontWeight="bold">
        {Math.round(level)}%
      </text>
    </svg>
  );
};

// ============================================================================
// Solar Panel Icon
// ============================================================================

export const SolarPanelIcon: React.FC<IconProps & { generating?: boolean }> = ({
  size = 24,
  color = '#F59E0B',
  generating = false,
  className = ''
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Sun Rays */}
      {generating && (
        <g className="animate-pulse" opacity="0.6">
          <path d="M 12 2 L 12 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M 19 5 L 17.5 6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 12 L 20 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M 5 5 L 6.5 6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <path d="M 2 12 L 4 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      
      {/* Solar Panel Grid */}
      <rect x="5" y="9" width="14" height="10" rx="1" stroke={color} strokeWidth="2" fill={generating ? `${color}20` : 'transparent'} />
      <path d="M 5 14 L 19 14" stroke={color} strokeWidth="1.5" />
      <path d="M 12 9 L 12 19" stroke={color} strokeWidth="1.5" />
      <path d="M 8.5 9 L 8.5 19" stroke={color} strokeWidth="1" opacity="0.5" />
      <path d="M 15.5 9 L 15.5 19" stroke={color} strokeWidth="1" opacity="0.5" />
      
      {/* Stand */}
      <path d="M 8 19 L 6 22 M 16 19 L 18 22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M 6 22 L 18 22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// ============================================================================
// Grid/House Icons
// ============================================================================

export const GridIcon: React.FC<IconProps & { mode?: 'import' | 'export' | 'neutral' }> = ({
  size = 24,
  color,
  mode = 'neutral',
  className = ''
}) => {
  const modeColors = {
    import: '#EF4444',  // red - importing from grid
    export: '#10B981',  // green - exporting to grid
    neutral: '#6B7280' // gray
  };
  
  const fillColor = color || modeColors[mode];
  
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Power Lines */}
      <path d="M 4 8 L 20 8" stroke={fillColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M 4 12 L 20 12" stroke={fillColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M 4 16 L 20 16" stroke={fillColor} strokeWidth="2" strokeLinecap="round" />
      
      {/* Power Poles */}
      <rect x="7" y="6" width="1" height="12" fill={fillColor} />
      <rect x="16" y="6" width="1" height="12" fill={fillColor} />
      
      {/* Import/Export Indicator */}
      {mode === 'import' && (
        <path d="M 12 19 L 10 21 L 12 21 L 10 23" fill={fillColor} className="animate-pulse" />
      )}
      {mode === 'export' && (
        <path d="M 12 5 L 10 3 L 12 3 L 10 1" fill={fillColor} className="animate-pulse" />
      )}
    </svg>
  );
};

export const HouseIcon: React.FC<IconProps & { consuming?: boolean }> = ({
  size = 24,
  color = '#3B82F6',
  consuming = false,
  className = ''
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* House */}
      <path d="M 3 12 L 12 3 L 21 12 L 21 21 L 3 21 Z" stroke={color} strokeWidth="2" fill={consuming ? `${color}20` : 'transparent'} strokeLinejoin="round" />
      
      {/* Roof */}
      <path d="M 12 3 L 21 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      
      {/* Door */}
      <rect x="10" y="14" width="4" height="7" stroke={color} strokeWidth="1.5" fill="transparent" />
      
      {/* Window */}
      <rect x="6" y="13" width="3" height="3" stroke={color} strokeWidth="1.5" fill="transparent" />
      
      {/* Consuming Indicator */}
      {consuming && (
        <g className="animate-pulse">
          <circle cx="17" cy="15" r="1.5" fill={color} />
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// EV Icon
// ============================================================================

export const EVIcon: React.FC<IconProps & { status?: 'idle' | 'charging' | 'driving' }> = ({
  size = 24,
  color = '#6366F1',
  status = 'idle',
  className = ''
}) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Car Body */}
      <path 
        d="M 5 10 L 7 6 L 17 6 L 19 10 L 19 17 L 5 17 Z" 
        stroke={color} 
        strokeWidth="2" 
        fill={status === 'charging' ? `${color}20` : 'transparent'}
        strokeLinejoin="round"
      />
      
      {/* Windshield */}
      <path d="M 8 10 L 9 7 L 15 7 L 16 10" stroke={color} strokeWidth="1.5" fill="transparent" />
      
      {/* Wheels */}
      <circle cx="8" cy="17" r="2" stroke={color} strokeWidth="2" fill="transparent" />
      <circle cx="16" cy="17" r="2" stroke={color} strokeWidth="2" fill="transparent" />
      
      {/* Status Indicator */}
      {status === 'charging' && (
        <g className="animate-pulse">
          <path d="M 12 11 L 11 13 L 13 13 L 12 15" fill={color} />
        </g>
      )}
      
      {status === 'driving' && (
        <g>
          <path d="M 20 10 L 22 10 L 22 12 L 20 12" fill={color} className="animate-pulse" />
        </g>
      )}
    </svg>
  );
};

// ============================================================================
// Status Badge Component
// ============================================================================

export const StatusBadge: React.FC<{
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}> = ({ status, label, icon, pulse = false }) => {
  const styles = {
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-amber-100 text-amber-800 border-amber-300',
    error: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-blue-100 text-blue-800 border-blue-300'
  };
  
  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles[status]} ${pulse ? 'animate-pulse' : ''}`}
    >
      {icon}
      {label}
    </span>
  );
};
