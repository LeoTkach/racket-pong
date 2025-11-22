import React, { memo } from "react";
import Ellipse20 from "./shapes/Ellipse20";
import Rectangle342 from "./shapes/Rectangle342";
import Rectangle343 from "./shapes/Rectangle343";
import Triangle from "./shapes/Triangle";
import Diamond from "./shapes/Diamond";
import Star from "./shapes/Star";
import { BackgroundParticles } from './BackgroundParticles';

interface SportBackgroundProps {
  variant?: "tournaments" | "profile" | "details" | "leaderboard" | "featured" | "support" | "legal";
  className?: string;
}

// Маппинг вариантов на seed для BackgroundParticles
const VARIANT_SEED_MAP: Record<string, number> = {
  tournaments: 12345,
  leaderboard: 54321,
  profile: 98765,
  featured: 44444,
  support: 22222,
  legal: 33333,
  details: 11111,
};

// Fallback вариант (legacy)
const DefaultBackground = memo(({ className }: { className: string }) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
    <div className="absolute top-[15%] left-[12%] w-10 h-10 opacity-16 rotate-10"><Ellipse20 /></div>
    <div className="absolute top-[10%] right-[15%] w-11 h-11 opacity-16 -rotate-20"><Triangle /></div>
    <div className="absolute top-[25%] left-[25%] w-16 h-8 opacity-16 rotate-40"><Rectangle342 /></div>
    <div className="absolute top-[50%] left-[10%] w-12 h-12 opacity-16 rotate-25"><Star /></div>
    <div className="absolute top-[55%] right-[10%] w-18 h-9 opacity-16 -rotate-30"><Rectangle343 /></div>
    <div className="absolute bottom-[20%] left-[18%] w-11 h-11 opacity-16 rotate-35"><Diamond /></div>
    <div className="absolute bottom-[15%] right-[20%] w-10 h-10 opacity-16 -rotate-15"><Ellipse20 /></div>
    <div className="absolute bottom-[30%] right-[8%] w-20 h-10 opacity-16 rotate-50"><Rectangle342 /></div>
  </div>
));

DefaultBackground.displayName = 'DefaultBackground';

export const SportBackground = memo(function SportBackground({ 
  variant = "tournaments", 
  className = ""
}: SportBackgroundProps) {
  // Для вариантов с BackgroundParticles используем маппинг
  const seed = VARIANT_SEED_MAP[variant];
  if (seed !== undefined) {
    return <BackgroundParticles className={className} seed={seed} />;
  }

  // Default fallback - tournament details page (legacy)
  return <DefaultBackground className={className} />;
});

