// Neon Achievement - неоновая вывеска с эффектом свечения
export function NeonAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-pink-500/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #2a0a3e 100%)"
          : undefined
      }}
    >
      {/* Neon glow effect */}
      {achievement.unlocked && (
        <>
          <div 
            className="absolute inset-0 rounded-xl opacity-30"
            style={{
              background: "radial-gradient(circle at 30% 30%, rgba(255,0,255,0.3) 0%, transparent 50%)",
              animation: "pulse 2s ease-in-out infinite"
            }}
          />
          <div 
            className="absolute inset-0 rounded-xl opacity-30"
            style={{
              background: "radial-gradient(circle at 70% 70%, rgba(0,255,255,0.3) 0%, transparent 50%)",
              animation: "pulse 2s ease-in-out infinite reverse"
            }}
          />
        </>
      )}

      {/* Neon border lines */}
      {achievement.unlocked && (
        <>
          <div 
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,0,255,0.8) 50%, transparent 100%)",
              boxShadow: "0 0 10px rgba(255,0,255,0.8)",
              animation: "neon-flicker 3s ease-in-out infinite"
            }}
          />
          <div 
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.8) 50%, transparent 100%)",
              boxShadow: "0 0 10px rgba(0,255,255,0.8)",
              animation: "neon-flicker 3s ease-in-out infinite reverse"
            }}
          />
        </>
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
              <Icon className="w-4 h-4 opacity-80 text-pink-400" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-pink-500/20 backdrop-blur-sm border border-pink-500/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(255,0,255,0.5)",
               animation: "neon-flicker 3s ease-in-out infinite"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-pink-400' : ''}`} 
                style={achievement.unlocked ? { 
                  filter: "drop-shadow(0 0 10px rgba(255,0,255,0.8))",
                  animation: "neon-pulse 2s ease-in-out infinite"
                } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 ${achievement.unlocked ? 'text-pink-300' : ''}`}
              style={achievement.unlocked ? { 
                textShadow: "0 0 10px rgba(255,0,255,0.8), 0 0 20px rgba(255,0,255,0.5)",
                animation: "neon-text 3s ease-in-out infinite"
              } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-purple-200' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-cyan-400"
               style={{ textShadow: "0 0 8px rgba(0,255,255,0.8)" }}>
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

