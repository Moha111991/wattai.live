export default function DashboardHeader3D() {
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        {/* Gradients */}
        <linearGradient id="dashGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
        </linearGradient>
        <linearGradient id="dashGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: '#34d399', stopOpacity: 0.3 }} />
        </linearGradient>
        <linearGradient id="dashGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: '#fbbf24', stopOpacity: 0.4 }} />
        </linearGradient>
        
        {/* Glow Filter */}
        <filter id="dashGlow">
          <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Animated Gradient */}
        <linearGradient id="animGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 0.8 }}>
            <animate attributeName="stop-color" values="#67e8f9;#06b6d4;#0ea5e9;#67e8f9" dur="4s" repeatCount="indefinite"/>
          </stop>
          <stop offset="50%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.6 }}>
            <animate attributeName="stop-color" values="#0ea5e9;#67e8f9;#06b6d4;#0ea5e9" dur="4s" repeatCount="indefinite"/>
          </stop>
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }}>
            <animate attributeName="stop-color" values="#06b6d4;#0ea5e9;#67e8f9;#06b6d4" dur="4s" repeatCount="indefinite"/>
          </stop>
        </linearGradient>
      </defs>

      {/* Background Grid */}
      <rect width="1200" height="400" fill="#020617"/>
      <g opacity="0.15">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="400" stroke="#67e8f9" strokeWidth="1"/>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 100} x2="1200" y2={i * 100} stroke="#67e8f9" strokeWidth="1"/>
        ))}
      </g>

      {/* 3D Cube - Energy Management Center */}
      <g filter="url(#dashGlow)">
        {/* Front Face */}
        <path d="M 500 150 L 700 150 L 700 350 L 500 350 Z" fill="url(#dashGrad1)" opacity="0.9">
          <animateTransform attributeName="transform" type="rotate" values="0 600 250;5 600 250;0 600 250" dur="6s" repeatCount="indefinite"/>
        </path>
        {/* Top Face */}
        <path d="M 500 150 L 600 100 L 800 100 L 700 150 Z" fill="url(#dashGrad2)" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" values="0 600 250;-5 600 250;0 600 250" dur="6s" repeatCount="indefinite"/>
        </path>
        {/* Side Face */}
        <path d="M 700 150 L 800 100 L 800 300 L 700 350 Z" fill="url(#dashGrad3)" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" values="0 600 250;3 600 250;0 600 250" dur="6s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Energy Flow Lines */}
      <g opacity="0.6">
        <path d="M 100 200 Q 300 100 500 180" stroke="url(#animGrad)" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="0 1000;1000 0" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" values="0;-1000" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="M 700 180 Q 900 100 1100 200" stroke="url(#animGrad)" strokeWidth="3" fill="none">
          <animate attributeName="stroke-dasharray" values="0 1000;1000 0" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" values="0;-1000" dur="3s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Floating Particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <circle key={i} r="3" fill="#67e8f9" opacity="0.6">
          <animate attributeName="cx" values={`${200 + i * 60};${250 + i * 60};${200 + i * 60}`} dur={`${4 + i * 0.3}s`} repeatCount="indefinite"/>
          <animate attributeName="cy" values={`${100 + (i % 3) * 100};${150 + (i % 3) * 100};${100 + (i % 3) * 100}`} dur={`${5 + i * 0.2}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${3 + i * 0.15}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Dashboard Icons */}
      <g opacity="0.7">
        {/* Solar Panel Icon */}
        <rect x="250" y="120" width="60" height="60" fill="none" stroke="#34d399" strokeWidth="2">
          <animate attributeName="y" values="120;115;120" dur="2s" repeatCount="indefinite"/>
        </rect>
        <line x1="260" y1="130" x2="300" y2="170" stroke="#34d399" strokeWidth="2"/>
        <line x1="300" y1="130" x2="260" y2="170" stroke="#34d399" strokeWidth="2"/>
        
        {/* Battery Icon */}
        <rect x="890" y="120" width="60" height="60" fill="none" stroke="#fbbf24" strokeWidth="2">
          <animate attributeName="y" values="120;115;120" dur="2.5s" repeatCount="indefinite"/>
        </rect>
        <rect x="900" y="135" width="40" height="30" fill="#fbbf24" opacity="0.5">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
        </rect>
        
        {/* EV Charging Icon */}
        <circle cx="280" cy="320" r="30" fill="none" stroke="#a78bfa" strokeWidth="2">
          <animate attributeName="r" values="30;33;30" dur="3s" repeatCount="indefinite"/>
        </circle>
        <path d="M 270 310 L 280 320 L 275 320 L 290 330" stroke="#a78bfa" strokeWidth="3" fill="none">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
        </path>
      </g>

      {/* Title – Top Left with backdrop (free space, no 3D elements here) */}
      <rect x="0" y="0" width="440" height="108" rx="0" fill="rgba(2,6,23,0.55)"/>
      <text x="48" y="58" fontSize="44" fontWeight="bold" fill="url(#animGrad)" textAnchor="start" filter="url(#dashGlow)">
        <animate attributeName="opacity" values="0;1" dur="1.6s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
        <animate attributeName="y" values="74;58" dur="1.6s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
        Dashboard
      </text>
      <text x="48" y="90" fontSize="17" fill="#67e8f9" textAnchor="start" opacity="0.9">
        <animate attributeName="opacity" values="0;1" dur="1.8s" begin="0.4s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
        <animate attributeName="y" values="106;90" dur="1.8s" begin="0.4s" calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
        Echtzeit-Energiemanagement
      </text>
    </svg>
  );
}
