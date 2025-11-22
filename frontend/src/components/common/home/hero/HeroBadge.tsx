import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface HeroBadgeProps {
  text: string;
  index?: number;
  className?: string;
  bgColor?: string;
  textColor?: string;
  fontWeight?: number;
}

export function HeroBadge({ 
  text, 
  index = 0, 
  className = '', 
  bgColor,
  textColor,
  fontWeight = 400
}: HeroBadgeProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  return (
    <motion.div
      className={`${bgColor || 'bg-primary'} ${textColor || 'text-black'} rounded-lg shadow-lg whitespace-nowrap ${className}`}
      style={{
        padding: '0.625rem 1.25rem',
        fontSize: '0.75rem',
        fontWeight: fontWeight,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.5',
        cursor: 'default',
      }}
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={isAnimated 
        ? {
            scale: { duration: 0.15, ease: "easeOut" },
            rotate: { duration: 0.15, ease: "easeOut" }
          }
        : {
            opacity: { delay: 0.2 + (index * 0.1), duration: 0.3, ease: "easeOut" },
            scale: { 
              delay: 0.2 + (index * 0.1), 
              type: "spring", 
              stiffness: 200,
              damping: 20
            },
            rotate: { 
              delay: 0.2 + (index * 0.1), 
              type: "spring", 
              stiffness: 200,
              damping: 20
            }
          }
      }
      onAnimationComplete={() => {
        if (!isAnimated) {
          setIsAnimated(true);
        }
      }}
      whileHover={{ 
        scale: 1.1, 
        rotate: 2,
        transition: { 
          scale: { duration: 0.15, ease: "easeOut" },
          rotate: { duration: 0.15, ease: "easeOut" }
        }
      }}
    >
      {text}
    </motion.div>
  );
}



