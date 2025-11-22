// Pixel Art Achievement - пиксельный стиль
export function PixelArtAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
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
          ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)"
          : undefined,
        imageRendering: "pixelated"
      }}
    >
      {/* Pixel grid pattern */}
      {achievement.unlocked && (
        <div 
          className="absolute inset-0 rounded-xl opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 8px, transparent 8px, transparent 16px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 8px, transparent 8px, transparent 16px)
            `,
            backgroundSize: "16px 16px"
          }}
        />
      )}

      {/* Pixelated blocks */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/20"
              style={{
                width: "16px",
                height: "16px",
                left: `${(i * 15) % 90}%`,
                top: `${(i * 20) % 80}%`,
                animation: `pixel-float ${2 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`
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
                animation: `float-up-classic-${i % 3} 1s ease-out forwards`,
                imageRendering: "pixelated"
              }}
            >
              <Icon className="w-4 h-4 opacity-80 text-white" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-purple-900/40 border-2 border-purple-400/50" : "bg-muted"
        }`}
             style={{ imageRendering: "pixelated" }}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "2px 2px 0 rgba(0,0,0,0.5)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-purple-50' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-purple-200">
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
