export default function DevicesHeader3D() {
  return (
    <svg viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        {/* Gradients */}
        <linearGradient id="devGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.5 }} />
        </linearGradient>
        <linearGradient id="devGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.4 }} />
        </linearGradient>
        <linearGradient id="devGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.4 }} />
        </linearGradient>
        
        {/* Network Pulse Gradient */}
        <radialGradient id="pulseGrad">
          <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 0.9 }}>
            <animate attributeName="stop-opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0 }}/>
        </radialGradient>

        {/* Glow Filter */}
        <filter id="devGlow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="1200" height="400" fill="#020617"/>
      
      {/* Circuit Board Pattern */}
      <g opacity="0.15">
        <path d="M 100 100 L 300 100 L 300 200 L 500 200" stroke="#67e8f9" strokeWidth="2" fill="none"/>
        <path d="M 700 100 L 900 100 L 900 200 L 1100 200" stroke="#67e8f9" strokeWidth="2" fill="none"/>
        <path d="M 200 300 L 400 300 L 400 250" stroke="#34d399" strokeWidth="2" fill="none"/>
        <path d="M 800 300 L 1000 300 L 1000 250" stroke="#34d399" strokeWidth="2" fill="none"/>
        {Array.from({ length: 20 }).map((_, i) => (
          <circle key={`node${i}`} cx={100 + i * 50} cy={100 + (i % 3) * 100} r="4" fill="#67e8f9"/>
        ))}
      </g>

      {/* Central Hub - 3D Sphere */}
      <g filter="url(#devGlow)">
        <circle cx="600" cy="200" r="80" fill="url(#pulseGrad)">
          <animate attributeName="r" values="80;85;80" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="600" cy="200" r="60" fill="url(#devGrad1)" opacity="0.7">
          <animate attributeName="r" values="60;63;60" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="600" cy="200" r="40" fill="url(#devGrad1)" opacity="0.5">
          <animate attributeName="r" values="40;43;40" dur="3s" repeatCount="indefinite"/>
        </circle>
        
        {/* Center Core */}
        <circle cx="600" cy="200" r="20" fill="#67e8f9" opacity="0.9">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* Device Nodes in Circle */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const radius = 180;
        const cx = 600 + Math.cos(angle) * radius;
        const cy = 200 + Math.sin(angle) * radius;
        const colors = ['#67e8f9', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c', '#67e8f9', '#34d399'];
        
        return (
          <g key={`device${i}`} filter="url(#devGlow)">
            {/* Connection Line */}
            <line x1="600" y1="200" x2={cx} y2={cy} stroke={colors[i]} strokeWidth="2" opacity="0.4">
              <animate 
                attributeName="opacity" 
                values="0.2;0.6;0.2" 
                dur={`${2 + i * 0.3}s`} 
                repeatCount="indefinite"
              />
            </line>
            
            {/* Device Node */}
            <circle cx={cx} cy={cy} r="25" fill="url(#devGrad2)" opacity="0.8">
              <animate 
                attributeName="r" 
                values="25;28;25" 
                dur={`${3 + i * 0.2}s`} 
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={cx} cy={cy} r="15" fill={colors[i]} opacity="0.9">
              <animate 
                attributeName="opacity" 
                values="0.6;1;0.6" 
                dur={`${2 + i * 0.25}s`} 
                repeatCount="indefinite"
              />
            </circle>
            
            {/* Device Icon */}
            <text 
              x={cx} 
              y={cy + 8} 
              fontSize="20" 
              textAnchor="middle" 
              fill="#fff"
            >
              {['📡', '☀️', '🔋', '⚡', '🏠', '💡', '🌡️', '📊'][i]}
            </text>
          </g>
        );
      })}

      {/* Data Flow Particles */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const startRadius = 80;
        const endRadius = 180;
        
        return (
          <circle key={`flow${i}`} r="4" fill="#67e8f9" opacity="0.8">
            <animate 
              attributeName="cx" 
              values={`${600 + Math.cos(angle) * startRadius};${600 + Math.cos(angle) * endRadius}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate 
              attributeName="cy" 
              values={`${200 + Math.sin(angle) * startRadius};${200 + Math.sin(angle) * endRadius}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
        );
      })}

      {/* Floating Device Cards */}
      <g opacity="0.6">
        {/* Smart Meter Card */}
        <rect x="150" y="280" width="100" height="80" rx="8" fill="url(#devGrad1)" opacity="0.7">
          <animate attributeName="y" values="280;275;280" dur="3s" repeatCount="indefinite"/>
        </rect>
        <text x="200" y="315" fontSize="32" textAnchor="middle">📡</text>
        <text x="200" y="345" fontSize="12" fill="#fff" textAnchor="middle">Smart Meter</text>
        
        {/* Wallbox Card */}
        <rect x="950" y="280" width="100" height="80" rx="8" fill="url(#devGrad3)" opacity="0.7">
          <animate attributeName="y" values="280;275;280" dur="3.5s" repeatCount="indefinite"/>
        </rect>
        <text x="1000" y="315" fontSize="32" textAnchor="middle">⚡</text>
        <text x="1000" y="345" fontSize="12" fill="#fff" textAnchor="middle">Wallbox</text>
        
        {/* Battery Card */}
        <rect x="150" y="50" width="100" height="80" rx="8" fill="url(#devGrad2)" opacity="0.7">
          <animate attributeName="y" values="50;45;50" dur="4s" repeatCount="indefinite"/>
        </rect>
        <text x="200" y="85" fontSize="32" textAnchor="middle">🔋</text>
        <text x="200" y="115" fontSize="12" fill="#fff" textAnchor="middle">Heimspeicher</text>
        
        {/* Solar Card */}
        <rect x="950" y="50" width="100" height="80" rx="8" fill="url(#devGrad2)" opacity="0.7">
          <animate attributeName="y" values="50;45;50" dur="3.2s" repeatCount="indefinite"/>
        </rect>
        <text x="1000" y="85" fontSize="32" textAnchor="middle">☀️</text>
        <text x="1000" y="115" fontSize="12" fill="#fff" textAnchor="middle">PV-Inverter</text>
      </g>

      {/* Scan Lines Effect */}
      <g opacity="0.1">
        <rect x="0" y="0" width="1200" height="4" fill="#67e8f9">
          <animate attributeName="y" values="0;400;0" dur="5s" repeatCount="indefinite"/>
        </rect>
      </g>

      {/* Title */}
      <text x="600" y="380" fontSize="48" fontWeight="bold" fill="#67e8f9" textAnchor="middle" filter="url(#devGlow)">
        Geräte
      </text>
      <text x="720" y="380" fontSize="20" fill="#34d399" opacity="0.8">
        Netzwerk
      </text>
    </svg>
  );
}
