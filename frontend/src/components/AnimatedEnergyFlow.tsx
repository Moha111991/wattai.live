import { useEffect, useState } from 'react';

interface EnergyFlowProps {
  pvPower: number;      // kW
  housePower: number;   // kW
  batteryPower: number; // kW (+ = charging, - = discharging)
  gridPower: number;    // kW (+ = import, - = export)
  evPower: number;      // kW
}

const AnimatedEnergyFlow = ({
  pvPower = 0,
  housePower = 0,
  batteryPower = 0,
  gridPower = 0,
  evPower = 0
}: EnergyFlowProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Berechne Energieflüsse
  const isPVActive = pvPower > 0.1;
  const isBatteryCharging = batteryPower > 0.1;
  const isBatteryDischarging = batteryPower < -0.1;
  const isGridImport = gridPower > 0.1;
  const isGridExport = gridPower < -0.1;
  const isEVCharging = evPower > 0.1;

  return (
    <div className="tab-modern-card glass-effect animate-page-enter" style={{ padding: '24px' }}>
      <h2 className="tab-section-title neon-glow" style={{ marginBottom: '24px' }}>
        Energiefluss Live
      </h2>

      <div style={{ 
        position: 'relative', 
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        minHeight: '400px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: '20px',
        padding: '20px',
        justifyItems: 'center',
        alignItems: 'center'
      }}>
        
        {/* PV (Oben Mitte) */}
        <div style={{ gridColumn: '2', gridRow: '1', position: 'relative', width: '100%' }}>
          <div 
            className={`energy-node ${isPVActive ? 'energy-glow float-animation' : ''} ${mounted ? 'animate-scale-in' : ''}`}
            style={{
              background: isPVActive 
                ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                : 'rgba(15, 23, 42, 0.7)',
              border: `2px solid ${isPVActive ? '#fbbf24' : 'rgba(103, 232, 249, 0.2)'}`,
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: isPVActive ? '0 0 40px rgba(245, 158, 11, 0.5)' : 'none',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>☀️</div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>Solar</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {pvPower.toFixed(1)} kW
            </div>
          </div>

          {/* Fluss von PV zu Haus */}
          {isPVActive && (
            <div 
              className="energy-flow-arrow"
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '40px',
                background: 'linear-gradient(180deg, #fbbf24, #67e8f9)',
                animation: 'energyFlow 2s linear infinite'
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '12px solid #67e8f9'
              }} />
            </div>
          )}
        </div>

        {/* Netz (Links Mitte) */}
        <div style={{ gridColumn: '1', gridRow: '2', position: 'relative', width: '100%' }}>
          <div 
            className={`energy-node ${isGridImport || isGridExport ? 'energy-pulse' : ''} ${mounted ? 'animate-scale-in delay-100' : ''}`}
            style={{
              background: isGridImport
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                : isGridExport
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'rgba(15, 23, 42, 0.7)',
              border: `2px solid ${isGridImport ? '#60a5fa' : isGridExport ? '#4ade80' : 'rgba(103, 232, 249, 0.2)'}`,
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: isGridImport 
                ? '0 0 40px rgba(59, 130, 246, 0.5)' 
                : isGridExport 
                ? '0 0 40px rgba(34, 197, 94, 0.5)' 
                : 'none',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {isGridImport ? '⚡' : isGridExport ? '💸' : '🔌'}
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>
              {isGridImport ? 'Bezug' : isGridExport ? 'Einspeisung' : 'Netz'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {Math.abs(gridPower).toFixed(1)} kW
            </div>
          </div>

          {/* Fluss vom Netz zum Haus */}
          {isGridImport && (
            <div 
              className="energy-flow-arrow"
              style={{
                position: 'absolute',
                top: '50%',
                left: '100%',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '4px',
                background: 'linear-gradient(90deg, #3b82f6, #67e8f9)',
                animation: 'energyFlow 2s linear infinite'
              }}
            >
              <div style={{
                position: 'absolute',
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '0',
                height: '0',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '12px solid #67e8f9'
              }} />
            </div>
          )}

          {/* Fluss vom Haus zum Netz */}
          {isGridExport && (
            <div 
              className="energy-flow-arrow"
              style={{
                position: 'absolute',
                top: '50%',
                left: '100%',
                transform: 'translateY(-50%) scaleX(-1)',
                width: '40px',
                height: '4px',
                background: 'linear-gradient(90deg, #22c55e, #67e8f9)',
                animation: 'energyFlow 2s linear infinite'
              }}
            >
              <div style={{
                position: 'absolute',
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%) scaleX(-1)',
                width: '0',
                height: '0',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '12px solid #22c55e'
              }} />
            </div>
          )}
        </div>

        {/* Haus (Mitte) */}
        <div style={{ gridColumn: '2', gridRow: '2', width: '100%' }}>
          <div 
            className={`energy-node energy-pulse ${mounted ? 'animate-scale-in delay-200' : ''}`}
            style={{
              background: 'linear-gradient(135deg, #67e8f9, #3b82f6)',
              border: '2px solid #67e8f9',
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 0 40px rgba(103, 232, 249, 0.5)',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏠</div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>Haushalt</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {housePower.toFixed(1)} kW
            </div>
          </div>
        </div>

        {/* Batterie (Rechts Mitte) */}
        <div style={{ gridColumn: '3', gridRow: '2', position: 'relative', width: '100%' }}>
          <div 
            className={`energy-node ${isBatteryCharging || isBatteryDischarging ? 'energy-glow' : ''} ${mounted ? 'animate-scale-in delay-300' : ''}`}
            style={{
              background: isBatteryCharging
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : isBatteryDischarging
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'rgba(15, 23, 42, 0.7)',
              border: `2px solid ${isBatteryCharging ? '#4ade80' : isBatteryDischarging ? '#fbbf24' : 'rgba(103, 232, 249, 0.2)'}`,
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: isBatteryCharging 
                ? '0 0 40px rgba(34, 197, 94, 0.5)' 
                : isBatteryDischarging 
                ? '0 0 40px rgba(245, 158, 11, 0.5)' 
                : 'none',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {isBatteryCharging ? '🔋⚡' : isBatteryDischarging ? '🔋📉' : '🔋'}
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>
              {isBatteryCharging ? 'Laden' : isBatteryDischarging ? 'Entladen' : 'Batterie'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {Math.abs(batteryPower).toFixed(1)} kW
            </div>
          </div>

          {/* Fluss vom Haus zur Batterie (Laden) */}
          {isBatteryCharging && (
            <div 
              className="energy-flow-arrow"
              style={{
                position: 'absolute',
                top: '50%',
                left: '-40px',
                transform: 'translateY(-50%)',
                width: '40px',
                height: '4px',
                background: 'linear-gradient(90deg, #67e8f9, #22c55e)',
                animation: 'energyFlow 2s linear infinite'
              }}
            >
              <div style={{
                position: 'absolute',
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '0',
                height: '0',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '12px solid #22c55e'
              }} />
            </div>
          )}

          {/* Fluss von Batterie zum Haus (Entladen) */}
          {isBatteryDischarging && (
            <div 
              className="energy-flow-arrow"
              style={{
                position: 'absolute',
                top: '50%',
                left: '-40px',
                transform: 'translateY(-50%) scaleX(-1)',
                width: '40px',
                height: '4px',
                background: 'linear-gradient(90deg, #f59e0b, #67e8f9)',
                animation: 'energyFlow 2s linear infinite'
              }}
            >
              <div style={{
                position: 'absolute',
                right: '-8px',
                top: '50%',
                transform: 'translateY(-50%) scaleX(-1)',
                width: '0',
                height: '0',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: '12px solid #f59e0b'
              }} />
            </div>
          )}
        </div>

        {/* EV (Unten Mitte) */}
        <div style={{ gridColumn: '2', gridRow: '3', position: 'relative', width: '100%' }}>
          <div 
            className={`energy-node ${isEVCharging ? 'charging-active' : ''} ${mounted ? 'animate-scale-in delay-400' : ''}`}
            style={{
              background: isEVCharging
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'rgba(15, 23, 42, 0.7)',
              border: `2px solid ${isEVCharging ? '#4ade80' : 'rgba(103, 232, 249, 0.2)'}`,
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: isEVCharging ? '0 0 40px rgba(34, 197, 94, 0.5)' : 'none',
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {isEVCharging ? '🚗⚡' : '🚗'}
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '4px' }}>
              {isEVCharging ? 'Laden' : 'E-Auto'}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
              {evPower.toFixed(1)} kW
            </div>
          </div>

          {/* Fluss vom Haus zum EV */}
          {isEVCharging && (
            <div 
              className="energy-flow-arrow"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '40px',
                background: 'linear-gradient(180deg, #67e8f9, #22c55e)',
                animation: 'energyFlow 2s linear infinite'
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '12px solid #22c55e'
              }} />
            </div>
          )}
        </div>

      </div>

      {/* Legende */}
      <div className="animate-fade-in delay-500" style={{ 
        marginTop: '24px', 
        padding: '16px', 
        background: 'rgba(15, 23, 42, 0.5)',
        borderRadius: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24' }}></div>
          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>PV-Erzeugung</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }}></div>
          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Laden/Einspeisung</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Netzbezug</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }}></div>
          <span style={{ color: '#cbd5e1', fontSize: '12px' }}>Entladen</span>
        </div>
      </div>
    </div>
  );
};

export default AnimatedEnergyFlow;
