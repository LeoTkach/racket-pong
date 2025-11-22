// Swiss Design Variant 2 - Bauhaus Achievement
export function SwissBauhausAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-4 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-black dark:border-white"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #facc15 100%)"
          : undefined
      }}
    >
      {/* Geometric shapes */}
      {achievement.unlocked && (
        <>
          <div 
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-red-600"
            style={{ opacity: 0.9 }}
          />
          <div 
            className="absolute bottom-4 left-4 w-16 h-16 bg-blue-600"
            style={{ opacity: 0.9 }}
          />
          <div 
            className="absolute top-1/2 left-1/2 w-10 h-10 bg-black rotate-45"
            style={{ 
              opacity: 0.2,
              transform: "translate(-50%, -50%) rotate(45deg)"
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
              <Icon className="w-4 h-4 opacity-80 text-black" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-full ${
          achievement.unlocked ? "bg-red-600 border-4 border-black" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 uppercase tracking-wide ${achievement.unlocked ? 'text-black' : ''}`}
              style={{ 
                fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
                fontWeight: 900
              }}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 ${achievement.unlocked ? 'text-gray-900' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-mono uppercase text-red-600">
              {achievement.date}
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

