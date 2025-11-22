import { useState } from "react";
import NewFoil from "./foil/NewFoil";

// Foil Achievement - голографический эффект с движущимся блеском
export function FoilAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-purple-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #667eea 10%, #763ba2 25%, #f093fb 40%, #4fadfe 65%, #00f2fe 80%)"
          : undefined,
        backgroundSize: achievement.unlocked ? "200% 200%" : undefined,
      }}
    >
      {/* Holographic overlay with moving animation */}
      {achievement.unlocked && (
        <div 
          className="absolute inset-0 rounded-xl opacity-40"
          style={{
            animation: "foil-move 8s ease-in-out infinite"
          }}
        >
          <NewFoil />
        </div>
      )}

      {/* Rainbow shine effect */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[foil-shine_4s_ease-in-out_infinite]" />
      )}

      {/* Floating icons on click */}
      {isAnimating && isClicked && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${50 + (Math.random() - 0.5) * 60}%`,
                top: `${50 + (Math.random() - 0.5) * 60}%`,
                animation: `float-up-classic-${i % 3} 1s ease-out forwards`
              }}
            >
              <Icon className="w-4 h-4 opacity-80 text-white" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-white/20 backdrop-blur-sm border border-white/30" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(255,255,255,0.3)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 2px 4px rgba(0,0,0,0.3)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-white' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-white/90">
              Unlocked: {achievement.date}
            </p>
          )}
          {!achievement.unlocked && (
            <p className="text-xs text-muted-foreground font-semibold">
              🔒 Locked
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

