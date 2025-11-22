// Glitch Achievement - эффект глитча с цифровыми искажениями
export function GlitchAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-cyan-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)"
          : undefined
      }}
    >
      {/* Digital noise blocks */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-cyan-500/20"
              style={{
                width: `${20 + Math.random() * 40}px`,
                height: "8px",
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `glitch-block ${1 + Math.random()}s steps(3, end) ${i * 0.2}s infinite`
              }}
            />
          ))}
        </div>
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
              <Icon className="w-4 h-4 opacity-80 text-cyan-400" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg flex-shrink-0 ${
          achievement.unlocked ? "bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               animation: "glitch-icon 3s steps(4, end) infinite"
             } : undefined}>
          <Icon className={`w-6 h-6 ${achievement.unlocked ? 'text-cyan-400' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(34,211,238,0.8))" } : undefined} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-cyan-300' : ''}`}
              style={achievement.unlocked ? { 
                textShadow: "2px 0 #ff00ff, -2px 0 #00ffff",
                animation: "glitch-text 5s steps(2, end) infinite"
              } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-slate-300' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-cyan-400">
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

