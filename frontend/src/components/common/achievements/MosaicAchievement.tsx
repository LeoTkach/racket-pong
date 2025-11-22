// Mosaic Achievement - мозаичный паттерн
export function MosaicAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-teal-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #14b8a6 100%)"
          : undefined
      }}
    >
      {/* Mosaic tiles */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: `${15 + Math.random() * 10}px`,
                height: `${15 + Math.random() * 10}px`,
                left: `${(i % 8) * 12.5}%`,
                top: `${Math.floor(i / 8) * 20}%`,
                background: `rgba(${20 + Math.random() * 80}, ${180 + Math.random() * 75}, ${160 + Math.random() * 95}, ${0.1 + Math.random() * 0.2})`,
                border: "1px solid rgba(255,255,255,0.1)",
                transform: `rotate(${Math.random() * 10 - 5}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Grout lines */}
      {achievement.unlocked && (
        <div 
          className="absolute inset-0 rounded-xl opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent 0px, transparent 24px, rgba(255,255,255,0.3) 24px, rgba(255,255,255,0.3) 26px),
              repeating-linear-gradient(90deg, transparent 0px, transparent 24px, rgba(255,255,255,0.3) 24px, rgba(255,255,255,0.3) 26px)
            `,
          }}
        />
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
              <Icon className="w-4 h-4 opacity-80 text-teal-200" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-teal-500/30 backdrop-blur-sm border border-teal-300/50" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-teal-100' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 ${achievement.unlocked ? 'text-teal-50' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 2px 4px rgba(0,0,0,0.3)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-teal-100' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-teal-200">
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

