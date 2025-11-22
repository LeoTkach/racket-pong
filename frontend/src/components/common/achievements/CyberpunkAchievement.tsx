// Achievement with Neon Cyberpunk background
export function CyberpunkAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-green-400"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "#000000"
          : undefined,
        boxShadow: achievement.unlocked 
          ? "0 0 40px rgba(34,211,238,0.6), inset 0 0 20px rgba(6,182,212,0.2)"
          : undefined
      }}
    >
      {/* Grid pattern */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl opacity-20"
             style={{
               backgroundImage: `
                 linear-gradient(#06b6d4 1px, transparent 1px),
                 linear-gradient(90deg, #06b6d4 1px, transparent 1px)
               `,
               backgroundSize: '20px 20px'
             }}
        />
      )}

      {/* Scanline effect */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-[scan_2s_linear_infinite]" />
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
              <Icon className="w-4 h-4 opacity-80 text-green-400" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-green-500/20 border-2 border-green-400" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(34,211,238,0.8)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-green-300' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 10px rgba(34,211,238,1))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-green-300' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 0 10px rgba(34,211,238,0.8)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-green-100' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold opacity-80 text-green-400 font-mono">
              UNLOCKED: {achievement.date}
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

