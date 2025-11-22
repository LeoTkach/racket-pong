// Origami Achievement - складные бумажные формы
export function OrigamiAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-rose-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)"
          : undefined
      }}
    >
      {/* Origami fold lines */}
      {achievement.unlocked && (
        <svg className="absolute inset-0 rounded-xl w-full h-full opacity-20" preserveAspectRatio="none">
          <defs>
            <pattern id={`origami-${achievement.id}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 0 0 L 100 100 M 100 0 L 0 100" stroke="rgba(180,83,9,0.3)" strokeWidth="1" fill="none"/>
              <path d="M 50 0 L 50 100 M 0 50 L 100 50" stroke="rgba(180,83,9,0.2)" strokeWidth="1" fill="none"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#origami-${achievement.id})`} />
        </svg>
      )}

      {/* Paper folding shadows */}
      {achievement.unlocked && (
        <>
          <div 
            className="absolute top-0 left-0 w-1/3 h-1/3"
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, transparent 100%)",
            }}
          />
          <div 
            className="absolute bottom-0 right-0 w-1/2 h-1/2"
            style={{
              background: "linear-gradient(-45deg, rgba(0,0,0,0.08) 0%, transparent 100%)",
            }}
          />
        </>
      )}

      {/* Decorative corner folds */}
      {achievement.unlocked && (
        <>
          <div 
            className="absolute top-0 right-0 w-8 h-8"
            style={{
              background: "linear-gradient(-135deg, rgba(251,191,36,0.5) 50%, transparent 50%)",
              borderLeft: "1px solid rgba(180,83,9,0.3)",
              borderBottom: "1px solid rgba(180,83,9,0.3)",
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
              <Icon className="w-4 h-4 opacity-80 text-amber-700" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-amber-500/30 border border-amber-600/40" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.1), 2px 2px 4px rgba(0,0,0,0.05)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-amber-800' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 ${achievement.unlocked ? 'text-amber-900' : ''}`}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 ${achievement.unlocked ? 'text-amber-800' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-amber-700">
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

