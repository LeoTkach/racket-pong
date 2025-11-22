// Glass Achievement - эффект стекла с фоновым рисунком
export function GlassAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-amber-700/50 dark:border-amber-500/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #d97706 0%, #ea580c 50%, #dc2626 100%)"
          : undefined
      }}
    >
      {/* Background pattern/image */}
      {achievement.unlocked && (
        <>
          {/* Decorative background pattern */}
          <div 
            className="absolute inset-0 rounded-xl opacity-50"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(251,191,36,0.8) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(245,158,11,0.8) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(217,119,6,0.6) 0%, transparent 50%)
              `
            }}
          />
          {/* Geometric pattern overlay */}
          <svg className="absolute inset-0 rounded-xl w-full h-full opacity-30">
            <defs>
              <pattern id={`glass-pattern-${achievement.id}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="20" fill="rgba(255,255,255,0.3)" />
                <circle cx="30" cy="30" r="10" fill="rgba(255,255,255,0.5)" />
                <path d="M0,30 L60,30 M30,0 L30,60" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#glass-pattern-${achievement.id})`} />
          </svg>
        </>
      )}

      {/* Glass overlay effect */}
      {achievement.unlocked && (
        <>
          {/* Frosted glass effect on top */}
          <div 
            className="absolute inset-0 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3) 100%)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)"
            }}
          />
          {/* Glass reflections */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/50 to-transparent" />
          <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-white/20 to-transparent" />
          {/* Specular highlights */}
          <div 
            className="absolute top-4 right-8 w-24 h-24 rounded-full opacity-60"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)",
              filter: "blur(20px)"
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
              <Icon className="w-4 h-4 opacity-80 text-amber-800 dark:text-amber-300" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-amber-700/20 dark:bg-amber-500/20 backdrop-blur-md border border-amber-700/40 dark:border-amber-500/40" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 4px 16px rgba(180,83,9,0.4)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-amber-900 dark:text-amber-200' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-amber-950 dark:text-amber-100' : ''}`}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-amber-900 dark:text-amber-200' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
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

