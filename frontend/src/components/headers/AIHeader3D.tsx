export default function AIHeader3D() {
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        {/* Gradients */}
        <linearGradient id="aiGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.5 }} />
        </linearGradient>
        <linearGradient id="aiGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 0.4 }} />
        </linearGradient>
        <linearGradient id="aiGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ec4899', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#f472b6', stopOpacity: 0.4 }} />
        </linearGradient>

        {/* Neural Network Gradient */}
        <radialGradient id="neuralGrad">
          <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 1 }}>
            <animate attributeName="stop-opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }}/>
        </radialGradient>

        {/* Brain Pulse Gradient */}
        <radialGradient id="brainPulse">
          <stop offset="0%" style={{ stopColor: '#a78bfa', stopOpacity: 0.9 }}>
            <animate attributeName="stop-opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0 }}/>
        </radialGradient>

        {/* Glow Filter */}
        <filter id="aiGlow">
          <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Strong Glow */}
        <filter id="aiStrongGlow">
          <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="1200" height="400" fill="#020617"/>
      
      {/* Digital Grid */}
      <g opacity="0.2">
        {Array.from({ length: 25 }).map((_, i) => (
          <line 
            key={`gridV${i}`} 
            x1={i * 50} 
            y1="0" 
            x2={i * 50} 
            y2="400" 
            stroke="#67e8f9" 
            strokeWidth="1"
          >
            <animate 
              attributeName="opacity" 
              values="0.1;0.3;0.1" 
              dur={`${3 + i * 0.2}s`} 
              repeatCount="indefinite"
            />
          </line>
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line 
            key={`gridH${i}`} 
            x1="0" 
            y1={i * 50} 
            x2="1200" 
            y2={i * 50} 
            stroke="#67e8f9" 
            strokeWidth="1"
          >
            <animate 
              attributeName="opacity" 
              values="0.1;0.3;0.1" 
              dur={`${3 + i * 0.2}s`} 
              repeatCount="indefinite"
            />
          </line>
        ))}
      </g>

      {/* Central AI Brain */}
      <g filter="url(#aiStrongGlow)">
        {/* Outer Pulse Ring */}
        <circle cx="600" cy="200" r="120" fill="url(#brainPulse)">
          <animate attributeName="r" values="120;130;120" dur="3s" repeatCount="indefinite"/>
        </circle>
        
        {/* Brain Hemisphere Left */}
        <ellipse cx="560" cy="200" rx="60" ry="80" fill="url(#aiGrad1)" opacity="0.8">
          <animate attributeName="rx" values="60;63;60" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        
        {/* Brain Hemisphere Right */}
        <ellipse cx="640" cy="200" rx="60" ry="80" fill="url(#aiGrad2)" opacity="0.8">
          <animate attributeName="rx" values="60;63;60" dur="4s" repeatCount="indefinite"/>
        </ellipse>
        
        {/* Brain Connection Bridge */}
        <rect x="590" y="180" width="20" height="40" fill="url(#aiGrad3)" opacity="0.7">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
        </rect>
        
        {/* Neural Pathways on Brain */}
        <g stroke="#67e8f9" strokeWidth="2" fill="none" opacity="0.6">
          <path d="M 540 160 Q 560 180 540 200">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite"/>
          </path>
          <path d="M 660 160 Q 640 180 660 200">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite"/>
          </path>
          <path d="M 550 220 Q 570 240 550 260">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite"/>
          </path>
        </g>
        
        {/* Central AI Core */}
        <circle cx="600" cy="200" r="25" fill="#67e8f9" opacity="0.9">
          <animate attributeName="r" values="25;28;25" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* Neural Network Nodes */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 200;
        const cx = 600 + Math.cos(angle) * radius;
        const cy = 200 + Math.sin(angle) * radius;
        
        return (
          <g key={`neuron${i}`} filter="url(#aiGlow)">
            {/* Connection to Center */}
            <line 
              x1="600" 
              y1="200" 
              x2={cx} 
              y2={cy} 
              stroke="#67e8f9" 
              strokeWidth="2" 
              opacity="0.3"
            >
              <animate 
                attributeName="opacity" 
                values="0.2;0.5;0.2" 
                dur={`${2 + i * 0.3}s`} 
                repeatCount="indefinite"
              />
            </line>
            
            {/* Neuron Node */}
            <circle cx={cx} cy={cy} r="20" fill="url(#neuralGrad)">
              <animate 
                attributeName="r" 
                values="20;23;20" 
                dur={`${3 + i * 0.2}s`} 
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={cx} cy={cy} r="10" fill="#67e8f9" opacity="0.8">
              <animate 
                attributeName="opacity" 
                values="0.5;1;0.5" 
                dur={`${2.5 + i * 0.25}s`} 
                repeatCount="indefinite"
              />
            </circle>
          </g>
        );
      })}

      {/* Data Streams */}
      {Array.from({ length: 20 }).map((_, i) => (
        <g key={`stream${i}`}>
          <circle r="3" fill="#a78bfa" opacity="0.8">
            <animateMotion 
              dur={`${2 + i * 0.2}s`} 
              repeatCount="indefinite"
              path={`M ${100 + i * 50} 0 L ${600} 200`}
            />
            <animate 
              attributeName="opacity" 
              values="0;0.8;0" 
              dur={`${2 + i * 0.2}s`} 
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* AI Processing Indicators */}
      <g>
        {/* Left Processing Panel */}
        <rect x="100" y="150" width="120" height="100" rx="8" fill="url(#aiGrad1)" opacity="0.3" filter="url(#aiGlow)">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite"/>
        </rect>
        <g>
          {Array.from({ length: 5 }).map((_, i) => (
            <rect 
              key={`bar1${i}`} 
              x={110 + i * 22} 
              y={240 - i * 15} 
              width="18" 
              height={10 + i * 15} 
              fill="#67e8f9" 
              opacity="0.7"
            >
              <animate 
                attributeName="height" 
                values={`${10 + i * 15};${20 + i * 15};${10 + i * 15}`} 
                dur={`${1.5 + i * 0.2}s`} 
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>
        <text x="160" y="180" fontSize="14" fill="#67e8f9" textAnchor="middle" opacity="0.8">
          Analyse
        </text>
        
        {/* Right Processing Panel */}
        <rect x="980" y="150" width="120" height="100" rx="8" fill="url(#aiGrad2)" opacity="0.3" filter="url(#aiGlow)">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3.5s" repeatCount="indefinite"/>
        </rect>
        <g>
          {Array.from({ length: 5 }).map((_, i) => (
            <rect 
              key={`bar2${i}`} 
              x={990 + i * 22} 
              y={240 - i * 12} 
              width="18" 
              height={10 + i * 12} 
              fill="#a78bfa" 
              opacity="0.7"
            >
              <animate 
                attributeName="height" 
                values={`${10 + i * 12};${20 + i * 12};${10 + i * 12}`} 
                dur={`${1.5 + i * 0.3}s`} 
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </g>
        <text x="1040" y="180" fontSize="14" fill="#a78bfa" textAnchor="middle" opacity="0.8">
          Empfehlung
        </text>
      </g>

      {/* Code Symbols Floating */}
      <g opacity="0.4" fontSize="16" fill="#67e8f9" fontFamily="monospace">
        <text x="150" y="80">{'{ }'}<animate attributeName="y" values="80;75;80" dur="3s" repeatCount="indefinite"/></text>
        <text x="1000" y="100">{'< />'}<animate attributeName="y" values="100;95;100" dur="3.5s" repeatCount="indefinite"/></text>
        <text x="200" y="350">{'[ ]'}<animate attributeName="y" values="350;345;350" dur="4s" repeatCount="indefinite"/></text>
        <text x="950" y="330">{'( )'}<animate attributeName="y" values="330;325;330" dur="3.2s" repeatCount="indefinite"/></text>
      </g>

      {/* Scan Line Effect */}
      <rect x="0" y="0" width="1200" height="6" fill="#67e8f9" opacity="0.2">
        <animate attributeName="y" values="-6;400" dur="4s" repeatCount="indefinite"/>
      </rect>

      {/* Title – Bottom Left */}
      <text x="48" y="355" fontSize="48" fontWeight="bold" fill="#67e8f9" textAnchor="start" filter="url(#aiStrongGlow)">
        KI-Empfehlung
      </text>
      <text x="48" y="385" fontSize="18" fill="#a78bfa" textAnchor="start" opacity="0.9">
        Intelligente Energieoptimierung
      </text>
    </svg>
  );
}
