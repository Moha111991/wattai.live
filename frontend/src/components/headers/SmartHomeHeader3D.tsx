export default function SmartHomeHeader3D() {
  return (
    <svg viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        {/* Gradients */}
        <linearGradient id="homeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f472b6', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 0.4 }} />
        </linearGradient>
        <linearGradient id="homeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: '#67e8f9', stopOpacity: 0.4 }} />
        </linearGradient>
        <linearGradient id="homeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.4 }} />
        </linearGradient>

        {/* Animated Sky Gradient */}
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1e40af', stopOpacity: 0.6 }}>
            <animate attributeName="stop-color" values="#1e40af;#3b82f6;#1e40af" dur="10s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 0.3 }}>
            <animate attributeName="stop-color" values="#0c4a6e;#0369a1;#0c4a6e" dur="10s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>

        {/* Glow Filter */}
        <filter id="homeGlow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="1200" height="400" fill="#020617"/>
      
      {/* Sky with Stars */}
      <rect width="1200" height="200" fill="url(#skyGrad)"/>
      {Array.from({ length: 30 }).map((_, i) => (
        <circle 
          key={`star${i}`} 
          cx={Math.random() * 1200} 
          cy={Math.random() * 200} 
          r="2" 
          fill="#fff"
        >
          <animate 
            attributeName="opacity" 
            values="0.3;1;0.3" 
            dur={`${2 + Math.random() * 3}s`} 
            repeatCount="indefinite"
          />
        </circle>
      ))}

      {/* Ground */}
      <ellipse cx="600" cy="380" rx="500" ry="40" fill="#0f172a" opacity="0.6"/>

      {/* 3D Smart Home Building */}
      <g filter="url(#homeGlow)">
        {/* Main House Front */}
        <path 
          d="M 400 280 L 800 280 L 800 380 L 400 380 Z" 
          fill="url(#homeGrad1)" 
          opacity="0.9"
        >
          <animateTransform 
            attributeName="transform" 
            type="scale" 
            values="1 1;1.01 1.01;1 1" 
            dur="5s" 
            repeatCount="indefinite"
            additive="sum"
          />
        </path>
        
        {/* Roof Front */}
        <path 
          d="M 380 280 L 600 180 L 820 280 Z" 
          fill="url(#homeGrad2)" 
          opacity="0.85"
        />
        
        {/* Roof Side */}
        <path 
          d="M 600 180 L 820 280 L 850 260 L 630 160 Z" 
          fill="url(#homeGrad3)" 
          opacity="0.7"
        />
        
        {/* House Side */}
        <path 
          d="M 800 280 L 850 260 L 850 360 L 800 380 Z" 
          fill="url(#homeGrad1)" 
          opacity="0.6"
        />
      </g>

      {/* Windows with Lights */}
      <g>
        {/* Window 1 */}
        <rect x="450" y="310" width="60" height="50" rx="4" fill="#fbbf24" opacity="0.3"/>
        <rect x="450" y="310" width="60" height="50" rx="4" fill="none" stroke="#67e8f9" strokeWidth="2"/>
        <line x1="480" y1="310" x2="480" y2="360" stroke="#67e8f9" strokeWidth="2"/>
        <line x1="450" y1="335" x2="510" y2="335" stroke="#67e8f9" strokeWidth="2"/>
        <circle cx="480" cy="335" r="15" fill="#fbbf24" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite"/>
        </circle>
        
        {/* Window 2 */}
        <rect x="690" y="310" width="60" height="50" rx="4" fill="#34d399" opacity="0.3"/>
        <rect x="690" y="310" width="60" height="50" rx="4" fill="none" stroke="#67e8f9" strokeWidth="2"/>
        <line x1="720" y1="310" x2="720" y2="360" stroke="#67e8f9" strokeWidth="2"/>
        <line x1="690" y1="335" x2="750" y2="335" stroke="#67e8f9" strokeWidth="2"/>
        <circle cx="720" cy="335" r="15" fill="#34d399" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3.5s" repeatCount="indefinite"/>
        </circle>
        
        {/* Door */}
        <rect x="570" y="320" width="60" height="60" rx="6" fill="#1e293b" stroke="#67e8f9" strokeWidth="2"/>
        <circle cx="610" cy="350" r="4" fill="#fbbf24"/>
        
        {/* Solar Panels on Roof */}
        <g>
          <rect x="640" y="220" width="60" height="40" fill="#1e3a8a" stroke="#67e8f9" strokeWidth="2" opacity="0.8"/>
          <line x1="650" y1="220" x2="650" y2="260" stroke="#67e8f9" strokeWidth="1"/>
          <line x1="660" y1="220" x2="660" y2="260" stroke="#67e8f9" strokeWidth="1"/>
          <line x1="670" y1="220" x2="670" y2="260" stroke="#67e8f9" strokeWidth="1"/>
          <line x1="680" y1="220" x2="680" y2="260" stroke="#67e8f9" strokeWidth="1"/>
          <line x1="690" y1="220" x2="690" y2="260" stroke="#67e8f9" strokeWidth="1"/>
          
          {/* Solar Glow */}
          <rect x="640" y="220" width="60" height="40" fill="#fbbf24" opacity="0.2">
            <animate attributeName="opacity" values="0.1;0.3;0.1" dur="4s" repeatCount="indefinite"/>
          </rect>
        </g>
      </g>

      {/* Smart Devices Icons Floating */}
      <g filter="url(#homeGlow)">
        {/* Thermostat */}
        <g>
          <circle cx="300" cy="200" r="30" fill="url(#homeGrad3)" opacity="0.7">
            <animate attributeName="cy" values="200;195;200" dur="3s" repeatCount="indefinite"/>
          </circle>
          <text x="300" y="215" fontSize="28" textAnchor="middle">🌡️</text>
        </g>
        
        {/* Light Bulb */}
        <g>
          <circle cx="900" cy="180" r="30" fill="url(#homeGrad3)" opacity="0.7">
            <animate attributeName="cy" values="180;175;180" dur="3.5s" repeatCount="indefinite"/>
          </circle>
          <text x="900" y="195" fontSize="28" textAnchor="middle">💡</text>
        </g>
        
        {/* Security Camera */}
        <g>
          <circle cx="250" cy="320" r="25" fill="url(#homeGrad2)" opacity="0.7">
            <animate attributeName="cy" values="320;315;320" dur="4s" repeatCount="indefinite"/>
          </circle>
          <text x="250" y="333" fontSize="24" textAnchor="middle">📹</text>
        </g>
        
        {/* WiFi Router */}
        <g>
          <circle cx="950" cy="310" r="25" fill="url(#homeGrad2)" opacity="0.7">
            <animate attributeName="cy" values="310;305;310" dur="3.8s" repeatCount="indefinite"/>
          </circle>
          <text x="950" y="323" fontSize="24" textAnchor="middle">📡</text>
        </g>
      </g>

      {/* Connection Lines */}
      <g opacity="0.3">
        <path d="M 300 200 Q 400 240 570 340" stroke="#67e8f9" strokeWidth="2" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite"/>
        </path>
        <path d="M 900 180 Q 800 240 630 340" stroke="#67e8f9" strokeWidth="2" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite"/>
        </path>
        <path d="M 250 320 Q 350 340 570 350" stroke="#67e8f9" strokeWidth="2" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite"/>
        </path>
        <path d="M 950 310 Q 800 340 630 350" stroke="#67e8f9" strokeWidth="2" fill="none" strokeDasharray="5,5">
          <animate attributeName="stroke-dashoffset" values="0;-10" dur="1s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Energy Flow Particles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <circle key={`energy${i}`} r="3" fill="#34d399" opacity="0.8">
          <animateMotion 
            dur={`${3 + i * 0.3}s`} 
            repeatCount="indefinite"
            path={`M ${670 + i * 5} 240 Q ${600 + i * 10} 280 ${590 + i * 2} 320`}
          />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur={`${3 + i * 0.3}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Battery Storage Unit */}
      <g filter="url(#homeGlow)">
        <rect x="850" y="350" width="40" height="25" rx="3" fill="none" stroke="#fbbf24" strokeWidth="2"/>
        <rect x="855" y="355" width="30" height="15" fill="#34d399">
          <animate attributeName="width" values="30;25;30" dur="5s" repeatCount="indefinite"/>
        </rect>
        <rect x="890" y="360" width="6" height="8" fill="#fbbf24"/>
      </g>

      {/* Title */}
      <text x="600" y="100" fontSize="52" fontWeight="bold" fill="#f472b6" textAnchor="middle" filter="url(#homeGlow)">
        Smart Home
      </text>
      <text x="600" y="135" fontSize="20" fill="#67e8f9" textAnchor="middle" opacity="0.9">
        Intelligente Haussteuerung
      </text>
    </svg>
  );
}
