// Sky/Nebula Variant - Aurora Sky Achievement
export function AuroraSkyAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
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
          ? "linear-gradient(180deg, #0c4a6e 0%, #075985 25%, #0e7490 50%, #155e75 75%, #164e63 100%)"
          : undefined
      }}
    >
      {/* Aurora waves */}
      {achievement.unlocked && (
        <>
          <div 
            className="absolute top-0 rounded-xl opacity-40"
            style={{
              left: "-20%",
              width: "140%",
              height: "100%",
              background: "linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.4) 30%, rgba(34,211,238,0.5) 50%, rgba(6,182,212,0.4) 70%, transparent 100%)",
              animation: "aurora-wave 6s ease-in-out infinite",
              transform: "skewY(-5deg)"
            }}
          />
          <div 
            className="absolute top-0 rounded-xl opacity-30"
            style={{
              left: "-20%",
              width: "140%",
              height: "100%",
              background: "linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.3) 40%, rgba(52,211,153,0.4) 60%, rgba(16,185,129,0.3) 80%, transparent 100%)",
              animation: "aurora-wave 8s ease-in-out infinite reverse",
              transform: "skewY(5deg)"
            }}
          />
        </>
      )}

      {/* Stars */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${1 + Math.random()}px`,
                height: `${1 + Math.random()}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.4 + Math.random() * 0.6,
                animation: `twinkle ${2 + Math.random() * 2}s ease-in-out ${Math.random()}s infinite`
              }}
            />
          ))}
        </div>
      )}

      {/* Floating icons on click */}
      {isAnimating && isClicked && (
        <>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${50 + (Math.random() - 0.5) * 60}%`,
                top: `${50 + (Math.random() - 0.5) * 60}%`,
                animation: `float-up-classic-${i % 3} 1s ease-out forwards`
              }}
            >
              <Icon className="w-4 h-4 opacity-80 text-cyan-300" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-cyan-500/30 backdrop-blur-sm border border-cyan-300/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(6,182,212,0.4)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-cyan-100' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(6,182,212,0.8))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 ${achievement.unlocked ? 'text-cyan-100' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 0 10px rgba(6,182,212,0.6)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-cyan-200' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-cyan-300">
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

      <style>{`
        @keyframes aurora-wave {
          0%, 100% { transform: translateX(-10%) skewY(-5deg); }
          50% { transform: translateX(10%) skewY(-5deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes float-up-classic-0 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
        }
        @keyframes float-up-classic-1 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.7); opacity: 0; }
        }
        @keyframes float-up-classic-2 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-35px) scale(0.75); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

