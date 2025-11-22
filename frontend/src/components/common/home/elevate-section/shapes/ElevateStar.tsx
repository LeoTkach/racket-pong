import React, { useId } from 'react';

export interface ElevateStarProps {
  className?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
}

export function ElevateStar({ className = '', style, animationDelay = '0s' }: ElevateStarProps) {
  const gradientId = useId();
  
  return (
    <div 
      className={`absolute animate-star-rotate ${className}`} 
      style={{ animationDelay, ...style }}
    >
      <svg 
        width="100" 
        height="100" 
        viewBox="-3 -3 106 106" 
        style={{ 
          shapeRendering: 'geometricPrecision', 
          overflow: 'visible', 
          filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.4))' 
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="2.8%" y1="1.9%" x2="97.2%" y2="98.1%">
            <stop offset="0%" stopColor="rgba(249, 115, 22, 0.2)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0.1)" />
          </linearGradient>
        </defs>
        <polygon
          points="50,3 61,36 97,36 68,58 79,92 50,71 21,92 32,58 3,36 39,36"
          fill={`url(#${gradientId})`}
          stroke="rgba(249, 115, 22, 0.3)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

