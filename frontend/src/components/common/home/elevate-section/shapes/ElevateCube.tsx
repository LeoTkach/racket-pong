import React from 'react';

export interface ElevateCubeProps {
  className?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
}

export function ElevateCube({ className = '', style, animationDelay = '0s' }: ElevateCubeProps) {
  return (
    <div 
      className={`absolute animate-3d-rotate ${className}`} 
      style={{ animationDelay, ...style }}
    >
      <div 
        className="shape-3d-cube" 
        style={{ 
          width: '80px', 
          height: '80px',
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(250, 204, 21, 0.15))',
          border: '2px solid rgba(234, 179, 8, 0.4)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }} 
      />
    </div>
  );
}

