import { useMemo } from "react";

// Achievement with Cosmic Nebula background
export function CosmicAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  // Generate fixed star positions based on achievement ID
  const stars = useMemo(() => {
    // Ensure seed is a number - extract numeric part from ID if it's a string
    let seed = 0;
    if (achievement.id) {
      if (typeof achievement.id === 'number') {
        seed = achievement.id;
      } else {
        // Extract number from string ID (e.g., "achievement-1" -> 1)
        const match = String(achievement.id).match(/\d+/);
        seed = match ? parseInt(match[0], 10) : 0;
      }
    }
    
    const random = (index: number) => {
      const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    
    return [...Array(20)].map((_, i) => {
      const opacity = random(i * 3) * 0.6 + 0.4;
      const duration = random(i * 4) * 3 + 2;
      return {
        left: random(i * 2) * 100,
        top: random(i * 2 + 1) * 100,
        opacity: isNaN(opacity) ? 0.5 : opacity,
        duration: isNaN(duration) ? 2.5 : duration
      };
    });
  }, [achievement.id]);
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-purple-500/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "radial-gradient(ellipse at center, #1a1a4e 0%, #0a0a1e 50%, #000000 100%)"
          : undefined
      }}
    >
      {/* Stars background */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
                animation: `twinkle ${star.duration}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
      )}

      {/* Nebula clouds */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl opacity-60">
          <div className="absolute w-24 h-24 rounded-full blur-3xl bg-purple-600/40 top-0 right-0" 
               style={{ animation: "float-nebula 10s ease-in-out infinite" }} />
          <div className="absolute w-28 h-28 rounded-full blur-3xl bg-blue-500/30 bottom-0 left-0" 
               style={{ animation: "float-nebula 12s ease-in-out 2s infinite" }} />
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
          achievement.unlocked ? "bg-purple-500/20 backdrop-blur-sm border border-purple-400/40" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(147,51,234,0.4), inset 0 0 15px rgba(59,130,246,0.3)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}>{achievement.name}</h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-gray-300' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold opacity-80 text-purple-300">
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

