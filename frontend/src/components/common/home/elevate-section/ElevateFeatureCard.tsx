import React, { useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import { typography } from "../../../../utils/typography";
import { cn } from "../../../ui/utils";

export interface ElevateFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  gradientDark: string;
  frostClass: string;
  index: number;
  isVisible: boolean;
  mousePos: { x: number; y: number };
}

// Extract border color from gradient and return CSS color value
const getBorderColor = (gradient: string): string => {
  const colorMap: Record<string, string> = {
    'blue-600': 'rgb(37, 99, 235)',
    'blue-700': 'rgb(29, 78, 216)',
    'purple-500': 'rgb(168, 85, 247)',
    'purple-600': 'rgb(147, 51, 234)',
    'green-500': 'rgb(34, 197, 94)',
    'green-600': 'rgb(22, 163, 74)',
    'orange-500': 'rgb(249, 115, 22)',
    'orange-600': 'rgb(234, 88, 12)',
  };
  
  const match = gradient.match(/from-(\w+-\d+)/);
  if (match && colorMap[match[1]]) {
    return colorMap[match[1]];
  }
  return 'rgb(var(--border))'; // fallback
};

export function ElevateFeatureCard({
  icon: IconComponent,
  title,
  description,
  gradient,
  gradientDark,
  frostClass,
  index,
  isVisible,
  mousePos,
}: ElevateFeatureCardProps) {
  const borderColor = getBorderColor(gradient);
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

  return (
    <div
      data-card-index={index}
      className="absolute group animate-card-float"
      style={{
        opacity: 0,
        animation: isVisible
          ? `fadeInUp 0.8s ease-out forwards, cardFloat ${8 + index}s ease-in-out ${index * 0.5}s infinite`
          : `cardFloat ${8 + index}s ease-in-out ${index * 0.5}s infinite`,
        animationDelay: isVisible
          ? `${index * 150}ms, ${index * 0.5}s`
          : `${index * 0.5}s`,
        width: "min(400px, 90vw)",
        top: index % 2 === 0 ? "10%" : "52%",
        left: index < 2 ? "max(5%, calc(50% - 440px))" : "min(95%, calc(50% + 40px))",
        transform: index < 2 ? 'translateX(0)' : 'translateX(-100%)',
        zIndex: 10 + index,
      }}
    >
      {/* Frost Glow Effect */}
      <div className={`absolute -inset-4 bg-gradient-to-br ${gradient} dark:${gradientDark} opacity-0 group-hover:opacity-60 blur-2xl rounded-3xl transition-opacity duration-500`} />

      {/* Glass Card with Frost Effect */}
      <div
        className={`relative glass-card ${frostClass} border-2 border-border hover:border-primary rounded-2xl p-8 shadow-xl group-hover:shadow-2xl transform-gpu transition-all duration-300`}
        style={{
          transform: `rotateX(${mousePos.y * 0.3}deg) rotateY(${mousePos.x * 0.3}deg)`,
          transition: 'transform 0.3s ease-out, box-shadow 0.5s ease, border-color 0.3s ease',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          backgroundColor: isDark ? undefined : 'rgba(255, 255, 255, 0.85)',
        }}
      >
        {/* Icon and Title in one row */}
        <div className="flex items-center gap-4 mb-4 transition-expo group-hover:-translate-y-1">
          <div className="relative w-16 h-16 flex-shrink-0 transition-expo group-hover:-translate-y-2.5 group-hover:scale-110">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} dark:${gradientDark} blur-xl rounded-xl`}
              style={{
                opacity: isDark ? 0.2 : 0.03,
              }}
            />
            {/* Icon container with transparent glass effect and border */}
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center dark:bg-background/30 border-2 transform group-hover:rotate-12 transition-all duration-500 ${isDark ? 'shadow-lg' : 'shadow-sm'}`}
              style={{
                borderColor: borderColor,
                backdropFilter: isDark ? 'blur(12px)' : 'blur(1px)',
                WebkitBackdropFilter: isDark ? 'blur(12px)' : 'blur(1px)',
              }}
            >
              <IconComponent 
                className={`w-8 h-8 text-primary`}
                style={isDark ? {
                  filter: `drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))`,
                } : undefined}
              />
            </div>
          </div>
          <h3 className={cn(
            typography.cardTitle,
            "text-foreground group-hover:text-primary transition-colors duration-300 flex-1"
          )}>
            {title}
          </h3>
        </div>

        {/* Description */}
        <div className="transition-expo group-hover:-translate-y-1">
          <p className={cn(
            typography.description,
            typography.lineHeight.relaxed
          )}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}



