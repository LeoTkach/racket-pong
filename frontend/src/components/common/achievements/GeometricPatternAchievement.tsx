// Achievement with Geometric Pattern background
export function GeometricPatternAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
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
          ? "linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #ef4444 100%)"
          : undefined
      }}
    >
      {/* Geometric pattern overlay */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`geo-${achievement.id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="3" fill="white" />
                <circle cx="45" cy="15" r="3" fill="white" />
                <circle cx="15" cy="45" r="3" fill="white" />
                <circle cx="45" cy="45" r="3" fill="white" />
                <circle cx="30" cy="30" r="20" stroke="white" strokeWidth="2" fill="none" />
                <line x1="0" y1="30" x2="60" y2="30" stroke="white" strokeWidth="1" />
                <line x1="30" y1="0" x2="30" y2="60" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#geo-${achievement.id})`} />
          </svg>
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
              <Icon className="w-4 h-4 opacity-80 text-white" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-white/20 backdrop-blur-sm" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}>{achievement.name}</h4>
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

