export default function V2HAnimated3D() {
  return (
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: '100%' }}>
      <defs>
        {/* Day/Night Sky Gradient */}
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#87CEEB' }}>
            <animate 
              attributeName="stop-color" 
              values="#87CEEB;#1a1a2e;#87CEEB" 
              dur="10s" 
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" style={{ stopColor: '#E0F6FF' }}>
            <animate 
              attributeName="stop-color" 
              values="#E0F6FF;#0f0f1e;#E0F6FF" 
              dur="10s" 
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>

        {/* Sun Gradient */}
        <radialGradient id="sunGradient">
          <stop offset="0%" style={{ stopColor: '#FDB813', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FFED4E', stopOpacity: 0.3 }} />
        </radialGradient>

        {/* Moon Gradient */}
        <radialGradient id="moonGradient">
          <stop offset="0%" style={{ stopColor: '#F0F0F0', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#D0D0D0', stopOpacity: 0.8 }} />
        </radialGradient>

        {/* Solar Panel Gradient */}
        <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1e3a8a', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.7 }} />
        </linearGradient>

        {/* House Gradient */}
        <linearGradient id="houseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#f97316', stopOpacity: 0.6 }} />
        </linearGradient>

        {/* EV Gradient */}
        <linearGradient id="evGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 0.6 }} />
        </linearGradient>

        {/* Energy Flow - Charging (Day) */}
        <linearGradient id="energyCharge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#34d399', stopOpacity: 0.6 }} />
        </linearGradient>

        {/* Energy Flow - Discharging (Night) */}
        <linearGradient id="energyDischarge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 0.6 }} />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Strong Glow */}
        <filter id="strongGlow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background Sky */}
      <rect width="800" height="500" fill="url(#skyGradient)"/>

      {/* Sun (Day) */}
      <g opacity="1">
        <animate attributeName="opacity" values="1;0;1" dur="10s" repeatCount="indefinite"/>
        <circle cx="150" cy="100" r="40" fill="url(#sunGradient)" filter="url(#strongGlow)">
          <animate attributeName="cy" values="100;120;100" dur="10s" repeatCount="indefinite"/>
        </circle>
        {/* Sun Rays */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = 150 + Math.cos(angle) * 50;
          const y1 = 100 + Math.sin(angle) * 50;
          const x2 = 150 + Math.cos(angle) * 70;
          const y2 = 100 + Math.sin(angle) * 70;
          return (
            <line 
              key={`ray${i}`} 
              x1={x1} 
              y1={y1} 
              x2={x2} 
              y2={y2} 
              stroke="#FDB813" 
              strokeWidth="3" 
              opacity="0.7"
            >
              <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
            </line>
          );
        })}
      </g>

      {/* Moon (Night) */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="10s" repeatCount="indefinite"/>
        <circle cx="150" cy="100" r="35" fill="url(#moonGradient)" filter="url(#glow)">
          <animate attributeName="cy" values="100;120;100" dur="10s" repeatCount="indefinite"/>
        </circle>
        {/* Moon Craters */}
        <circle cx="140" cy="95" r="8" fill="#C0C0C0" opacity="0.4"/>
        <circle cx="160" cy="110" r="6" fill="#C0C0C0" opacity="0.4"/>
        <circle cx="155" cy="90" r="5" fill="#C0C0C0" opacity="0.4"/>
      </g>

      {/* Ground */}
      <rect x="0" y="400" width="800" height="100" fill="#2d5016"/>
      <ellipse cx="400" cy="400" rx="400" ry="20" fill="#1a3010" opacity="0.5"/>

      {/* House with Solar Panels */}
      <g transform="translate(250, 250)">
        {/* House Body */}
        <rect x="0" y="50" width="120" height="100" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
        
        {/* Roof */}
        <path d="M -10 50 L 60 10 L 130 50 Z" fill="#A0522D" stroke="#654321" strokeWidth="2"/>
        
        {/* Solar Panels on Roof */}
        <g>
          <rect x="20" y="20" width="80" height="25" fill="url(#solarGrad)" stroke="#1e40af" strokeWidth="2"/>
          {/* Panel Grid Lines */}
          <line x1="40" y1="20" x2="40" y2="45" stroke="#1e40af" strokeWidth="1"/>
          <line x1="60" y1="20" x2="60" y2="45" stroke="#1e40af" strokeWidth="1"/>
          <line x1="80" y1="20" x2="80" y2="45" stroke="#1e40af" strokeWidth="1"/>
          
          {/* Solar Panel Glow (Day only) */}
          <rect x="20" y="20" width="80" height="25" fill="#fbbf24" opacity="0">
            <animate attributeName="opacity" values="0;0.3;0" dur="10s" repeatCount="indefinite"/>
          </rect>
        </g>
        
        {/* Window */}
        <rect x="30" y="80" width="25" height="30" fill="#FFD700" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="10s" repeatCount="indefinite"/>
        </rect>
        <line x1="42.5" y1="80" x2="42.5" y2="110" stroke="#654321" strokeWidth="2"/>
        <line x1="30" y1="95" x2="55" y2="95" stroke="#654321" strokeWidth="2"/>
        
        {/* Door */}
        <rect x="70" y="95" width="30" height="55" fill="#654321" rx="2"/>
        <circle cx="92" cy="125" r="2" fill="#FFD700"/>
      </g>

      {/* Electric Vehicle */}
      <g transform="translate(500, 320)">
        {/* EV Body */}
        <ellipse cx="0" cy="0" rx="80" ry="35" fill="url(#evGrad)" filter="url(#glow)"/>
        
        {/* EV Top/Cabin */}
        <ellipse cx="0" cy="-20" rx="50" ry="20" fill="#a78bfa" opacity="0.8"/>
        
        {/* Wheels */}
        <circle cx="-40" cy="25" r="15" fill="#1e293b" stroke="#67e8f9" strokeWidth="2"/>
        <circle cx="-40" cy="25" r="8" fill="#334155" stroke="#67e8f9" strokeWidth="1"/>
        
        <circle cx="40" cy="25" r="15" fill="#1e293b" stroke="#67e8f9" strokeWidth="2"/>
        <circle cx="40" cy="25" r="8" fill="#334155" stroke="#67e8f9" strokeWidth="1"/>
        
        {/* Battery Indicator */}
        <rect x="-30" y="-5" width="40" height="20" rx="3" fill="none" stroke="#fbbf24" strokeWidth="2"/>
        <rect x="-27" y="-2" width="34" height="14" fill="#34d399">
          <animate attributeName="width" values="34;20;34" dur="10s" repeatCount="indefinite"/>
        </rect>
        <rect x="10" y="3" width="5" height="8" fill="#fbbf24"/>
        
        {/* Charging Port with Animation */}
        <circle cx="-60" cy="0" r="8" fill="#34d399" opacity="0.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* Energy Flow Arrows - DAY (Solar → EV Charging) */}
      <g opacity="1">
        <animate attributeName="opacity" values="1;0;1" dur="10s" repeatCount="indefinite"/>
        
        {/* Arrow from Solar to EV */}
        <path 
          d="M 330 270 Q 400 250 440 320" 
          stroke="url(#energyCharge)" 
          strokeWidth="4" 
          fill="none"
          strokeDasharray="10 5"
          filter="url(#glow)"
        >
          <animate attributeName="stroke-dashoffset" values="0;-15" dur="1s" repeatCount="indefinite"/>
        </path>
        
        {/* Energy Particles */}
        {Array.from({ length: 5 }).map((_, i) => (
          <circle key={`charge${i}`} r="4" fill="#10b981">
            <animateMotion 
              dur="3s" 
              repeatCount="indefinite"
              begin={`${i * 0.6}s`}
              path="M 330 270 Q 400 250 440 320"
            />
          </circle>
        ))}
        
        {/* Lightning Bolt (Charging Symbol) */}
        <path 
          d="M 390 260 L 375 280 L 385 280 L 370 300" 
          fill="#fbbf24" 
          filter="url(#strongGlow)"
        >
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Energy Flow Arrows - NIGHT (EV → House Discharging) */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;1;0" dur="10s" repeatCount="indefinite"/>
        
        {/* Arrow from EV to House */}
        <path 
          d="M 440 320 Q 400 300 330 300" 
          stroke="url(#energyDischarge)" 
          strokeWidth="4" 
          fill="none"
          strokeDasharray="10 5"
          filter="url(#glow)"
        >
          <animate attributeName="stroke-dashoffset" values="0;-15" dur="1s" repeatCount="indefinite"/>
        </path>
        
        {/* Energy Particles */}
        {Array.from({ length: 5 }).map((_, i) => (
          <circle key={`discharge${i}`} r="4" fill="#f59e0b">
            <animateMotion 
              dur="3s" 
              repeatCount="indefinite"
              begin={`${i * 0.6}s`}
              path="M 440 320 Q 400 300 330 300"
            />
          </circle>
        ))}
        
        {/* Reverse Lightning (Discharging Symbol) */}
        <path 
          d="M 380 290 L 395 310 L 385 310 L 400 330" 
          fill="#fbbf24" 
          filter="url(#strongGlow)"
        >
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Labels */}
      <g fontSize="16" fontWeight="bold" fill="#fff" textAnchor="middle" filter="url(#glow)">
        {/* Day Label */}
        <text x="150" y="180" opacity="1">
          <animate attributeName="opacity" values="1;0;1" dur="10s" repeatCount="indefinite"/>
          TAG: Laden
        </text>
        <text x="150" y="200" fontSize="12" opacity="1" fill="#10b981">
          <animate attributeName="opacity" values="1;0;1" dur="10s" repeatCount="indefinite"/>
          ☀️ Solar → EV
        </text>
        
        {/* Night Label */}
        <text x="650" y="180" opacity="0">
          <animate attributeName="opacity" values="0;1;0" dur="10s" repeatCount="indefinite"/>
          NACHT: Entladen
        </text>
        <text x="650" y="200" fontSize="12" opacity="0" fill="#f59e0b">
          <animate attributeName="opacity" values="0;1;0" dur="10s" repeatCount="indefinite"/>
          🌙 EV → Haus
        </text>
      </g>

      {/* Title */}
      <text x="400" y="30" fontSize="24" fontWeight="bold" fill="#1e293b" textAnchor="middle" filter="url(#glow)">
        Vehicle-to-Home (V2H)
      </text>
      <text x="400" y="55" fontSize="14" fill="#475569" textAnchor="middle">
        Intelligente Energieflüsse über den Tag
      </text>
    </svg>
  );
}
