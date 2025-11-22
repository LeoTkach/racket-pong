// Achievement with Giant Glowing Icon background
export function GlowingIconAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-yellow-500/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
          : undefined
      }}
    >
      {/* Giant icon as background */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-15">
          <Icon className="w-40 h-40" 
                style={{
                  filter: "blur(2px) drop-shadow(0 0 40px rgba(251,191,36,0.8))",
                  animation: "float 3s ease-in-out infinite"
                }} />
        </div>
      )}

      {/* Radial glow */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl"
             style={{
               background: "radial-gradient(circle at center, rgba(251,191,36,0.3) 0%, transparent 70%)"
             }} />
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
          achievement.unlocked ? "bg-white/30 backdrop-blur-sm" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(255,255,255,0.5)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(255,255,255,1))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 2px 4px rgba(0,0,0,0.5)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-white' : ''}`}
             style={achievement.unlocked ? { textShadow: "0 1px 2px rgba(0,0,0,0.5)" } : undefined}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-white/90"
               style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
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

