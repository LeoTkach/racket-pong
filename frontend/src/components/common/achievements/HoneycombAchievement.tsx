import Group34 from "./honeycomb/Group34";

// Honeycomb Achievement - эффект пчелиных сот
export function HoneycombAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-amber-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
          : undefined
      }}
    >
      {/* Honeycomb pattern from Figma - smaller hexagons */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl opacity-30 overflow-hidden">
          {/* Create a tiled pattern of smaller honeycombs */}
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="absolute" 
              style={{ 
                width: "80px",
                height: "120px",
                left: `${(i % 3) * 35}%`,
                top: `${Math.floor(i / 3) * 45}%`,
              }}
            >
              <Group34 />
            </div>
          ))}
        </div>
      )}

      {/* Golden sparkles */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-200 rounded-full"
              style={{
                left: `${10 + i * 16}%`,
                top: `${20 + (i % 3) * 20}%`,
                opacity: 0.6,
                animation: `twinkle ${2 + Math.random()}s ease-in-out ${Math.random() * 2}s infinite`
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
          achievement.unlocked ? "bg-amber-900/30 backdrop-blur-sm border border-amber-300/40" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 1px 2px rgba(0,0,0,0.3)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-amber-50' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-amber-100">
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

