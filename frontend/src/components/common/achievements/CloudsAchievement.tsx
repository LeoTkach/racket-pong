// Clouds Achievement - облака и дым
export function CloudsAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-sky-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 50%, #bae6fd 100%)"
          : undefined
      }}
    >
      {/* Cloud shapes */}
      {achievement.unlocked && (
        <>
          <div className="absolute inset-0 rounded-xl">
            {/* Cloud 1 */}
            <div 
              className="absolute bg-white/30 rounded-full blur-xl"
              style={{
                width: "120px",
                height: "60px",
                top: "10%",
                left: "10%",
                animation: "cloud-drift-1 8s ease-in-out infinite"
              }}
            />
            {/* Cloud 2 */}
            <div 
              className="absolute bg-white/25 rounded-full blur-xl"
              style={{
                width: "100px",
                height: "50px",
                top: "40%",
                right: "15%",
                animation: "cloud-drift-2 10s ease-in-out infinite"
              }}
            />
            {/* Cloud 3 */}
            <div 
              className="absolute bg-white/20 rounded-full blur-xl"
              style={{
                width: "90px",
                height: "45px",
                bottom: "20%",
                left: "20%",
                animation: "cloud-drift-3 12s ease-in-out infinite"
              }}
            />
          </div>

          {/* Smoke particles */}
          <div className="absolute inset-0 rounded-xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-white/20 rounded-full blur-sm"
                style={{
                  left: `${20 + i * 12}%`,
                  bottom: "10%",
                  animation: `smoke-rise ${4 + (i % 3) * 2}s ease-in-out ${i * 0.5}s infinite`
                }}
              />
            ))}
          </div>
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
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-white/30 backdrop-blur-sm" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 1px 3px rgba(0,0,0,0.3)" } : undefined}>
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
