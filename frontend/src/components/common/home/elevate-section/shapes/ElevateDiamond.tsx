import React from 'react';

export interface ElevateDiamondProps {
  className?: string;
  style?: React.CSSProperties;
  animationDelay?: string;
}

export function ElevateDiamond({ className = '', style, animationDelay = '0s' }: ElevateDiamondProps) {
  return (
    <div 
      className={`absolute animate-3d-spin ${className}`} 
      style={{ animationDelay, ...style }}
    >
      <div 
        className="shape-3d-diamond" 
        style={{ 
          width: '100px', 
          height: '100px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(248, 113, 113, 0.15))',
          border: '2px solid rgba(239, 68, 68, 0.4)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }} 
      />
    </div>
  );
}

