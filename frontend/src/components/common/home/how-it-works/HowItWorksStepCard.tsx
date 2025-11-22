import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { typography } from '../../../../utils/typography';
import { cn } from '../../../ui/utils';

export interface HowItWorksStepCardProps {
  step: {
    id: number;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  };
  isVisible: boolean;
  isLeft: boolean;
  index: number;
  isLast: boolean;
  shouldShowArrow?: boolean;
  circleRef?: ((el: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement | null>;
}

const getColorStyles = (color: string, isDark: boolean) => {
  const colorMap: Record<string, { from: string; to: string }> = {
    blue: { from: 'rgb(59, 130, 246)', to: 'rgb(37, 99, 235)' }, // blue-500 to blue-600
    purple: { from: 'rgb(168, 85, 247)', to: 'rgb(147, 51, 234)' }, // purple-500 to purple-600
    green: { from: 'rgb(34, 197, 94)', to: 'rgb(22, 163, 74)' }, // green-500 to green-600
    yellow: isDark 
      ? { from: 'rgb(234, 179, 8)', to: 'rgb(202, 138, 4)' } // yellow-500 to yellow-600 (dark)
      : { from: 'rgb(251, 191, 36)', to: 'rgb(245, 158, 11)' }, // yellow-400 to yellow-500 (light) - как в Average Rating
    red: { from: 'rgb(239, 68, 68)', to: 'rgb(220, 38, 38)' }, // red-500 to red-600
  };
  return colorMap[color] || colorMap.blue;
};

export function HowItWorksStepCard({ 
  step, 
  isVisible, 
  isLeft, 
  index,
  isLast,
  shouldShowArrow = false,
  circleRef
}: HowItWorksStepCardProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = !document.documentElement.classList.contains('light');
      setIsDark(isDarkMode);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const gradientColors = getColorStyles(step.color, isDark);
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientColors.from} 0%, ${gradientColors.to} 100%)`,
  };
  const Icon = step.icon;

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Для левых карточек: карточка, кружок, спейсер */}
        {/* Для правых карточек: спейсер, кружок, карточка */}
        
        {isLeft ? (
          <>
            {/* Content - слева от кружка */}
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: -100 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.2 }}
            >
              <div className="bg-card border-2 border-border hover:border-primary rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 md:text-right">
                <div className="flex items-center gap-4 mb-4 md:flex-row-reverse">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                    style={gradientStyle}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={cn(typography.subsectionTitle, "flex-1")}>{step.title}</h3>
                </div>
                <p className={cn(typography.description, typography.lineHeight.relaxed)}>
                  {step.description}
                </p>
              </div>
            </motion.div>

            {/* Center node container */}
            <div className="flex-shrink-0 relative z-10 flex flex-col items-center">
              {/* Circle */}
              <motion.div 
                ref={typeof circleRef === 'function' ? circleRef : circleRef}
                initial={{ scale: 0, rotate: -180 }}
                animate={isVisible ? { scale: 1, rotate: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center border-4"
                  style={{
                    ...gradientStyle,
                    borderColor: 'var(--background)'
                  }}
                >
                  <span className="text-2xl font-bold text-white">{step.id}</span>
                </div>
              </motion.div>
              
              {/* Arrow connector for non-last items - растет сверху вниз как линия */}
              {!isLast && (
                <motion.div
                  className="mt-4 hidden md:block origin-top overflow-hidden"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={shouldShowArrow ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  style={{ height: '48px' }}
                >
                  <ArrowDown className="w-12 h-12 text-primary animate-bounce" />
                </motion.div>
              )}
            </div>

            {/* Right spacer */}
            <div className="flex-1 hidden md:block"></div>
          </>
        ) : (
          <>
            {/* Left spacer */}
            <div className="flex-1 hidden md:block"></div>

            {/* Center node container */}
            <div className="flex-shrink-0 relative z-10 flex flex-col items-center">
              {/* Circle */}
              <motion.div 
                ref={typeof circleRef === 'function' ? circleRef : circleRef}
                initial={{ scale: 0, rotate: -180 }}
                animate={isVisible ? { scale: 1, rotate: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center border-4"
                  style={{
                    ...gradientStyle,
                    borderColor: 'var(--background)'
                  }}
                >
                  <span className="text-2xl font-bold text-white">{step.id}</span>
                </div>
              </motion.div>
              
              {/* Arrow connector for non-last items - растет сверху вниз как линия */}
              {!isLast && (
                <motion.div
                  className="mt-4 hidden md:block origin-top overflow-hidden"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={shouldShowArrow ? { scaleY: 1, opacity: 1 } : { scaleY: 0, opacity: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  style={{ height: '48px' }}
                >
                  <ArrowDown className="w-12 h-12 text-primary animate-bounce" />
                </motion.div>
              )}
            </div>

            {/* Content - справа от кружка */}
            <motion.div 
              className="flex-1"
              initial={{ opacity: 0, x: 100 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.2 }}
            >
              <div className="bg-card border-2 border-border hover:border-primary rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 md:text-left">
                <div className="flex items-center gap-4 mb-4 md:flex-row">
                  <div 
                    className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                    style={gradientStyle}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={cn(typography.subsectionTitle, "flex-1")}>{step.title}</h3>
                </div>
                <p className={cn(typography.description, typography.lineHeight.relaxed)}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}



