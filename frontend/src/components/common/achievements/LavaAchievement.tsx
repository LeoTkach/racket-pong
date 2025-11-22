// Lava Achievement - лава и огонь
export function LavaAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-orange-500/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #7f1d1d 0%, #dc2626 30%, #ea580c 60%, #f59e0b 100%)"
          : undefined
      }}
    >
      {/* Lava flow animation */}
      {achievement.unlocked && (
        <>
          {/* Lava bubbles */}
          <div className="absolute inset-0 rounded-xl">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-orange-400/60 blur-sm"
                style={{
                  width: `${20 + Math.random() * 30}px`,
                  height: `${20 + Math.random() * 30}px`,
                  left: `${Math.random() * 90}%`,
                  bottom: "0%",
                  animation: `lava-bubble ${3 + (i % 4) * 2}s ease-in-out ${i * 0.4}s infinite`
                }}
              />
            ))}
          </div>

          {/* Fire particles */}
          <div className="absolute inset-0 rounded-xl">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-3 opacity-70"
                style={{
                  left: `${10 + i * 7}%`,
                  bottom: "10%",
                  animation: `fire-rise ${2 + Math.random()}s ease-in-out ${i * 0.15}s infinite`
                }}
              >
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: `linear-gradient(to top, #f59e0b, #ef4444, transparent)`
                  }}
                />
              </div>
            ))}
          </div>

          {/* Glow overlay */}
          <div 
            className="absolute inset-0 rounded-xl opacity-40"
            style={{
              background: "radial-gradient(circle at 50% 100%, rgba(249,115,22,0.6) 0%, transparent 70%)",
              animation: "fire-glow 2s ease-in-out infinite"
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
              <Icon className="w-4 h-4 opacity-80 text-orange-200" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-orange-900/40 backdrop-blur-sm border border-orange-500/50" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 0 10px rgba(249,115,22,0.8)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-orange-50' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-orange-200">
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
