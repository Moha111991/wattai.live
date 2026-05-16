export default function EVHeader3D() {
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        {/* Gradients */}
        <linearGradient id="evGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#a78bfa', stopOpacity: 0.5 }} />
        </linearGradient>
        <linearGradient id="evGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: '#67e8f9', stopOpacity: 0.4 }} />
        </linearGradient>
        <linearGradient id="evGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#34d399', stopOpacity: 0.4 }} />
        </linearGradient>
        
        {/* Lightning Gradient */}
        <linearGradient id="lightningGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }}>
            <animate attributeName="stop-opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.8 }}>
            <animate attributeName="stop-opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>

        {/* Glow Filter */}
        <filter id="evGlow">
          <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Strong Glow */}
        <filter id="strongGlow">
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
      
      {/* Perspective Grid */}
      <g opacity="0.2">
        {Array.from({ length: 20 }).map((_, i) => (
          <line 
            key={`grid${i}`} 
            x1={i * 60} 
            y1="400" 
            x2={600 + (i - 10) * 20} 
            y2="0" 
            stroke="#a78bfa" 
            strokeWidth="1"
          />
        ))}
      </g>

      {/* 3D EV Car Body */}
      <g filter="url(#evGlow)">
        {/* Main Body - Front */}
        <ellipse cx="600" cy="250" rx="200" ry="80" fill="url(#evGrad1)" opacity="0.9">
          <animateTransform 
            attributeName="transform" 
            type="scale" 
            values="1 1;1.02 1.02;1 1" 
            dur="4s" 
            repeatCount="indefinite"
            additive="sum"
          />
        </ellipse>
        
        {/* Top Cabin */}
        <ellipse cx="600" cy="200" rx="120" ry="50" fill="url(#evGrad2)" opacity="0.8">
          <animateTransform 
            attributeName="transform" 
            type="scale" 
            values="1 1;1.03 1.03;1 1" 
            dur="4s" 
            repeatCount="indefinite"
            additive="sum"
          />
        </ellipse>

        {/* Side Panel */}
        <path d="M 450 250 Q 500 200 600 200 Q 700 200 750 250 L 750 260 Q 700 210 600 210 Q 500 210 450 260 Z" 
              fill="url(#evGrad3)" opacity="0.6"/>
      </g>

      {/* Charging Port - Animated */}
      <g filter="url(#strongGlow)">
        <circle cx="750" cy="250" r="20" fill="none" stroke="#34d399" strokeWidth="3">
          <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="750" cy="250" r="10" fill="#34d399" opacity="0.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>

      {/* Lightning Bolt - Charging Animation */}
      <g filter="url(#strongGlow)">
        <path 
          d="M 850 180 L 820 240 L 840 240 L 810 300" 
          stroke="url(#lightningGrad)" 
          strokeWidth="6" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
        </path>
        <path 
          d="M 850 180 L 820 240 L 840 240 L 810 300" 
          fill="url(#lightningGrad)" 
          opacity="0.6"
        >
          <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Energy Flow Particles from Charging Port */}
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={`particle${i}`} r="4" fill="#34d399" opacity="0.8">
          <animate 
            attributeName="cx" 
            values={`750;${800 + i * 10}`} 
            dur={`${2 + i * 0.2}s`} 
            repeatCount="indefinite"
          />
          <animate 
            attributeName="cy" 
            values={`250;${200 + i * 12}`} 
            dur={`${2 + i * 0.2}s`} 
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.8;0;0.8" dur={`${2 + i * 0.2}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Wheels */}
      <g>
        <circle cx="480" cy="280" r="35" fill="#1e293b" stroke="#67e8f9" strokeWidth="3">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 480 280" 
            to="360 480 280" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="480" cy="280" r="20" fill="none" stroke="#67e8f9" strokeWidth="2" opacity="0.6">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 480 280" 
            to="-360 480 280" 
            dur="2s" 
            repeatCount="indefinite"
          />
        </circle>
        
        <circle cx="720" cy="280" r="35" fill="#1e293b" stroke="#67e8f9" strokeWidth="3">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 720 280" 
            to="360 720 280" 
            dur="3s" 
            repeatCount="indefinite"
          />
        </circle>
        <circle cx="720" cy="280" r="20" fill="none" stroke="#67e8f9" strokeWidth="2" opacity="0.6">
          <animateTransform 
            attributeName="transform" 
            type="rotate" 
            from="0 720 280" 
            to="-360 720 280" 
            dur="2s" 
            repeatCount="indefinite"
          />
        </circle>
      </g>

      {/* Battery Level Indicator */}
      <g filter="url(#evGlow)">
        <rect x="350" y="240" width="80" height="40" rx="5" fill="none" stroke="#fbbf24" strokeWidth="3"/>
        <rect x="355" y="245" width="70" height="30" fill="#fbbf24" opacity="0.3"/>
        <rect x="355" y="245" width="52" height="30" fill="#34d399">
          <animate attributeName="width" values="52;70;52" dur="4s" repeatCount="indefinite"/>
        </rect>
        <rect x="430" y="255" width="8" height="10" fill="#fbbf24"/>
        <text x="395" y="265" fontSize="16" fill="#fff" fontWeight="bold" textAnchor="middle">75%</text>
      </g>

      {/* Road Line Animation */}
      <g opacity="0.4">
        {Array.from({ length: 10 }).map((_, i) => (
          <rect 
            key={`road${i}`} 
            x={i * 120} 
            y="340" 
            width="60" 
            height="8" 
            fill="#67e8f9"
            opacity="0.6"
          >
            <animate attributeName="x" values={`${i * 120};${i * 120 - 1200}`} dur="3s" repeatCount="indefinite"/>
          </rect>
        ))}
      </g>

      {/* Freely floating title block – starts right */}
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="750,15; 540,100; 280,220; 80,280; 20,160; 180,60; 420,190; 660,100; 750,15"
          keyTimes="0;0.13;0.26;0.38;0.52;0.64;0.76;0.90;1"
          dur="28s" repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"/>
        <rect x="0" y="0" width="370" height="100" rx="10" fill="rgba(2,6,23,0.62)"/>
        <text x="28" y="52" fontSize="44" fontWeight="bold" fill="#a78bfa" textAnchor="start" filter="url(#evGlow)">
          <animate attributeName="opacity" values="0;1" dur="1.2s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
          <animate attributeName="y" values="70;52" dur="1.2s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
          Elektroauto
        </text>
        <text x="28" y="82" fontSize="16" fill="#67e8f9" textAnchor="start" opacity="0.9">
          <animate attributeName="opacity" values="0;1" dur="1.4s" begin="0.35s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
          <animate attributeName="y" values="100;82" dur="1.4s" begin="0.35s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
          Intelligentes Lademanagement
        </text>
      </g>
    </svg>
  );
}
