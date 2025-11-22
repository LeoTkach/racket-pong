// Water Achievement - эффект воды с волнами
export function WaterAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
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
          ? "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #22d3ee 100%)"
          : undefined
      }}
    >
      {/* Water waves */}
      {achievement.unlocked && (
        <svg className="absolute inset-0 rounded-xl w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`water-grad-${achievement.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q25,45 50,60 T100,60 L100,100 L0,100 Z"
            fill={`url(#water-grad-${achievement.id})`}
            style={{ animation: "water-wave 4s ease-in-out infinite" }}
          />
          <path
            d="M0,70 Q25,55 50,70 T100,70 L100,100 L0,100 Z"
            fill="rgba(255,255,255,0.2)"
            style={{ animation: "water-wave 5s ease-in-out 0.5s infinite" }}
          />
        </svg>
      )}

      {/* Bubbles */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/40 rounded-full"
              style={{
                left: `${20 + i * 10}%`,
                bottom: "10%",
                animation: `bubble-${i % 4} ${4 + ((i + 1) % 5) * 2}s ease-in-out ${((i + 2) % 6) * 2}s infinite`
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
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}>
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

