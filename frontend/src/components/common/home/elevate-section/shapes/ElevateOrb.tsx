import React from 'react';

export interface ElevateOrbProps {
  className?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
  size?: number;
  color?: {
    gradient: string;
    border: string;
  };
}

const defaultColor = {
  gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), transparent)',
  border: 'rgba(59, 130, 246, 0.4)',
};

export function ElevateOrb({ 
  className = '', 
  style, 
  animationDelay = '0s',
  size = 50,
  color = defaultColor
}: ElevateOrbProps) {
  return (
    <div 
      className={`absolute animate-3d-orbit ${className}`} 
      style={{ animationDelay, ...style }}
    >
      <div 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          borderRadius: '50%',
          background: color.gradient,
          border: `2px solid ${color.border}`,
        }} 
      />
    </div>
  );
}

