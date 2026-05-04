import type { CSSProperties } from 'react';

interface WattAILogoProps {
  size?: number;
  animated?: boolean;
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  style?: CSSProperties;
}

/**
 * WattAI.live Logo Component
 * 
 * Design-Konzept:
 * - Kombination aus Energie-Symbol (Blitz) und KI-Gehirn
 * - Moderne, Tech-orientierte Typografie
 * - Gradient-Farbschema: Cyan (#67e8f9) → Blue (#3b82f6)
 * - Optional animiert mit Energiefluss-Effekt
 * 
 * Varianten:
 * - full: Logo + Text
 * - icon: Nur Logo-Symbol
 * - text: Nur Text
 */
const WattAILogo = ({ 
  size = 120, 
  animated = true, 
  variant = 'full',
  className = '',
  style = {}
}: WattAILogoProps) => {
  
  const iconSize = variant === 'full' ? size * 0.4 : size;
  const textHeight = size * 0.3;
  const totalWidth = variant === 'full' ? size * 2.5 : variant === 'icon' ? iconSize : size * 2;
  const totalHeight = variant === 'full' ? size * 0.6 : variant === 'icon' ? iconSize : textHeight;

  return (
    <svg
      width={totalWidth}
      height={totalHeight}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="WattAI.live Logo"
    >
      <defs>
        {/* Gradient Definitions */}
        <linearGradient id="wattai-gradient-main" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id="wattai-gradient-accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#fbbf24', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id="wattai-gradient-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.2 }} />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="wattai-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Animated Energy Flow */}
        {animated && (
          <>
            <linearGradient id="wattai-energy-flow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 0 }}>
                <animate
                  attributeName="stop-opacity"
                  values="0;1;0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }}>
                <animate
                  attributeName="stop-opacity"
                  values="0;1;0"
                  dur="2s"
                  begin="0.5s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 0 }}>
                <animate
                  attributeName="stop-opacity"
                  values="0;1;0"
                  dur="2s"
                  begin="1s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </>
        )}
      </defs>

      {/* Icon/Symbol */}
      {(variant === 'full' || variant === 'icon') && (
        <g transform={variant === 'full' ? `translate(0, ${(totalHeight - iconSize) / 2})` : ''}>
          {/* Outer Circle - Neural Network Ring */}
          <circle
            cx={iconSize / 2}
            cy={iconSize / 2}
            r={iconSize / 2 - 4}
            fill="none"
            stroke="url(#wattai-gradient-main)"
            strokeWidth="3"
            opacity="0.6"
          />

          {/* Neural Network Nodes */}
          <g opacity="0.8">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = iconSize / 2 + Math.cos(rad) * (iconSize / 2 - 12);
              const y = iconSize / 2 + Math.sin(rad) * (iconSize / 2 - 12);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="url(#wattai-gradient-main)"
                  filter={animated ? "url(#wattai-glow)" : undefined}
                >
                  {animated && (
                    <animate
                      attributeName="r"
                      values="3;5;3"
                      dur="2s"
                      begin={`${i * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              );
            })}
          </g>

          {/* Connection Lines */}
          <g opacity="0.3" stroke="url(#wattai-gradient-main)" strokeWidth="1">
            {[0, 120, 240].map((angle, i) => {
              const rad1 = (angle * Math.PI) / 180;
              const rad2 = ((angle + 120) * Math.PI) / 180;
              const x1 = iconSize / 2 + Math.cos(rad1) * (iconSize / 2 - 12);
              const y1 = iconSize / 2 + Math.sin(rad1) * (iconSize / 2 - 12);
              const x2 = iconSize / 2 + Math.cos(rad2) * (iconSize / 2 - 12);
              const y2 = iconSize / 2 + Math.sin(rad2) * (iconSize / 2 - 12);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </g>

          {/* Center Lightning Bolt - Energy Symbol */}
          <g transform={`translate(${iconSize / 2}, ${iconSize / 2})`}>
            <path
              d="M 0,-18 L -8,0 L 0,0 L 0,18 L 8,0 L 0,0 Z"
              fill="url(#wattai-gradient-accent)"
              filter={animated ? "url(#wattai-glow)" : undefined}
            >
              {animated && (
                <>
                  <animate
                    attributeName="opacity"
                    values="1;0.6;1"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="scale"
                    values="1;1.1;1"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </>
              )}
            </path>

            {/* Energy Particles */}
            {animated && (
              <>
                {[0, 1, 2].map((i) => (
                  <circle
                    key={`particle-${i}`}
                    cx="0"
                    cy="-10"
                    r="2"
                    fill="#fbbf24"
                    opacity="0"
                  >
                    <animate
                      attributeName="cy"
                      values="-10;10"
                      dur="1.5s"
                      begin={`${i * 0.5}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;0"
                      dur="1.5s"
                      begin={`${i * 0.5}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </>
            )}
          </g>

          {/* AI Brain Circuit Pattern */}
          <g opacity="0.4">
            <path
              d={`M ${iconSize / 2 - 10} ${iconSize / 2 - 25} 
                  Q ${iconSize / 2} ${iconSize / 2 - 30} ${iconSize / 2 + 10} ${iconSize / 2 - 25}`}
              fill="none"
              stroke="url(#wattai-gradient-main)"
              strokeWidth="1.5"
            />
            <path
              d={`M ${iconSize / 2 - 10} ${iconSize / 2 + 25} 
                  Q ${iconSize / 2} ${iconSize / 2 + 30} ${iconSize / 2 + 10} ${iconSize / 2 + 25}`}
              fill="none"
              stroke="url(#wattai-gradient-main)"
              strokeWidth="1.5"
            />
          </g>
        </g>
      )}

      {/* Text - WattAI.live */}
      {(variant === 'full' || variant === 'text') && (
        <g transform={variant === 'full' ? `translate(${iconSize + 15}, ${totalHeight / 2})` : `translate(0, ${textHeight})`}>
          {/* "Watt" in Bold */}
          <text
            x="0"
            y="0"
            fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
            fontSize={textHeight}
            fontWeight="800"
            fill="url(#wattai-gradient-main)"
            dominantBaseline="middle"
          >
            Watt
            
            {/* "AI" with Gradient */}
            <tspan
              fill="url(#wattai-gradient-accent)"
              fontWeight="900"
              filter={animated ? "url(#wattai-glow)" : undefined}
            >
              AI
            </tspan>

            {/* ".live" in lighter weight */}
            <tspan
              fill="#94a3b8"
              fontWeight="500"
              fontSize={textHeight * 0.85}
            >
              .live
            </tspan>
          </text>

          {/* Underline accent */}
          {animated && (
            <line
              x1="0"
              y1={textHeight * 0.6}
              x2="0"
              y2={textHeight * 0.6}
              stroke="url(#wattai-gradient-accent)"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <animate
                attributeName="x2"
                values="0;60;0"
                dur="3s"
                repeatCount="indefinite"
              />
            </line>
          )}
        </g>
      )}
    </svg>
  );
};

export default WattAILogo;
