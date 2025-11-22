import React, { useId } from 'react';

export interface ElevateTriangleProps {
  className?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
}

export function ElevateTriangle({ className = '', style, animationDelay = '0s' }: ElevateTriangleProps) {
  const gradientId = useId();
  
  return (
    <div 
      className={`absolute animate-3d-float ${className}`} 
      style={{ animationDelay, ...style }}
    >
      <svg 
        width="120" 
        height="104" 
        viewBox="-2 -2 124 108" 
        style={{ shapeRendering: 'geometricPrecision', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="1.6%" y1="98%" x2="98.4%" y2="1.9%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
            <stop offset="100%" stopColor="rgba(147, 197, 253, 0.1)" />
          </linearGradient>
        </defs>
        <polygon
          points="60,2 2,104 118,104"
          fill={`url(#${gradientId})`}
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

