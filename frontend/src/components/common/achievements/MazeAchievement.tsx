// Maze Achievement - лабиринт на фоне
export function MazeAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-indigo-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)"
          : undefined
      }}
    >
      {/* Maze pattern SVG */}
      {achievement.unlocked && (
        <svg className="absolute inset-0 rounded-xl w-full h-full opacity-30" preserveAspectRatio="none">
          <defs>
            <pattern id={`maze-${achievement.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              {/* Horizontal lines */}
              <line x1="0" y1="0" x2="40" y2="0" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              <line x1="0" y1="20" x2="20" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              <line x1="20" y1="40" x2="40" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              {/* Vertical lines */}
              <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              <line x1="20" y1="0" x2="20" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              <line x1="40" y1="20" x2="40" y2="40" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#maze-${achievement.id})`} />
        </svg>
      )}

      {/* Moving light effect through maze */}
      {achievement.unlocked && (
        <div 
          className="absolute w-16 h-16 rounded-full blur-xl opacity-40"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)",
            animation: "maze-light 6s ease-in-out infinite"
          }}
        />
      )}

      {/* Corner markers */}
      {achievement.unlocked && (
        <>
          <div className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-white/60" />
          <div className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-white/60" />
          <div className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-white/60" />
          <div className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-white/60" />
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
              <Icon className="w-4 h-4 opacity-80 text-white" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg flex-shrink-0 ${
          achievement.unlocked ? "bg-indigo-900/40 backdrop-blur-sm border border-indigo-400/50" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 ${achievement.unlocked ? 'text-white' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(199,210,254,0.6))" } : undefined} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 2px 4px rgba(0,0,0,0.4)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-indigo-100' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-indigo-200">
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

