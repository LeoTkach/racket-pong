// Aurora + Asteroids Achievement - с астероидами и кратерами, дрейфующими в пространстве
import React from 'react';

export function AuroraAsteroidsAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-slate-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(180deg, #0f172a 0%, #1e293b 25%, #334155 45%, #475569 65%, #64748b 85%, #94a3b8 100%)"
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
              background: "linear-gradient(180deg, transparent 0%, rgba(100,116,139,0.4) 30%, rgba(148,163,184,0.5) 50%, rgba(100,116,139,0.4) 70%, transparent 100%)",
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
              background: "linear-gradient(180deg, transparent 0%, rgba(71,85,105,0.3) 40%, rgba(100,116,139,0.4) 60%, rgba(71,85,105,0.3) 80%, transparent 100%)",
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

      {/* Asteroids with craters drifting in space */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {/* Asteroid 1 - Large - помятый */}
          <div
            className="absolute"
            style={{
              left: "20%",
              top: "15%",
              width: "45px",
              height: "45px",
              animation: "drift-asteroid-1 25s linear infinite"
            }}
          >
            <div
              className="absolute"
              style={{
                width: "45px",
                height: "45px",
                background: "radial-gradient(circle at 40% 40%, #78716c, #57534e, #44403c)",
                boxShadow: "inset -8px -8px 15px rgba(0,0,0,0.5), 0 0 10px rgba(120,113,108,0.3)",
                borderRadius: "45% 35% 50% 40%",
                transform: "rotate(45deg)"
              }}
            >
              {/* Craters */}
              <div className="absolute rounded-full bg-black/40" style={{ width: "8px", height: "8px", left: "25%", top: "30%" }} />
              <div className="absolute rounded-full bg-black/50" style={{ width: "6px", height: "6px", left: "60%", top: "50%" }} />
              <div className="absolute rounded-full bg-black/30" style={{ width: "5px", height: "5px", left: "40%", top: "70%" }} />
            </div>
          </div>

          {/* Asteroid 2 - Medium - помятый */}
          <div
            className="absolute"
            style={{
              left: "65%",
              top: "50%",
              width: "30px",
              height: "30px",
              animation: "drift-asteroid-2 20s linear infinite reverse"
            }}
          >
            <div
              className="absolute"
              style={{
                width: "30px",
                height: "30px",
                background: "radial-gradient(circle at 35% 35%, #6b7280, #4b5563, #374151)",
                boxShadow: "inset -5px -5px 10px rgba(0,0,0,0.5), 0 0 8px rgba(107,114,128,0.3)",
                borderRadius: "40% 50% 35% 45%",
                transform: "rotate(30deg)"
              }}
            >
              {/* Craters */}
              <div className="absolute rounded-full bg-black/40" style={{ width: "5px", height: "5px", left: "30%", top: "40%" }} />
              <div className="absolute rounded-full bg-black/50" style={{ width: "4px", height: "4px", left: "55%", top: "60%" }} />
            </div>
          </div>

          {/* Asteroid 3 - Small - помятый */}
          <div
            className="absolute"
            style={{
              left: "80%",
              top: "25%",
              width: "20px",
              height: "20px",
              animation: "drift-asteroid-3 15s linear infinite"
            }}
          >
            <div
              className="absolute"
              style={{
                width: "20px",
                height: "20px",
                background: "radial-gradient(circle at 30% 30%, #9ca3af, #6b7280, #4b5563)",
                boxShadow: "inset -4px -4px 8px rgba(0,0,0,0.5), 0 0 6px rgba(156,163,175,0.3)",
                borderRadius: "50% 40% 45% 35%",
                transform: "rotate(60deg)"
              }}
            >
              {/* Craters */}
              <div className="absolute rounded-full bg-black/40" style={{ width: "3px", height: "3px", left: "35%", top: "45%" }} />
            </div>
          </div>

          {/* Asteroid 4 - Tiny - помятый */}
          <div
            className="absolute"
            style={{
              left: "10%",
              top: "70%",
              width: "15px",
              height: "15px",
              animation: "drift-asteroid-4 18s linear infinite reverse"
            }}
          >
            <div
              className="absolute"
              style={{
                width: "15px",
                height: "15px",
                background: "radial-gradient(circle at 35% 35%, #a1a1aa, #71717a, #52525b)",
                boxShadow: "inset -3px -3px 6px rgba(0,0,0,0.5), 0 0 5px rgba(161,161,170,0.3)",
                borderRadius: "35% 45% 40% 50%",
                transform: "rotate(20deg)"
              }}
            />
          </div>
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
              <Icon className="w-4 h-4 opacity-80 text-slate-300" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-slate-500/30 backdrop-blur-sm border border-slate-300/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(100,116,139,0.4)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-slate-100' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(100,116,139,0.8))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 ${achievement.unlocked ? 'text-slate-100' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 0 10px rgba(100,116,139,0.6)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-slate-200' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-slate-300">
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
        @keyframes drift-asteroid-1 {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(40px, 30px) rotate(90deg); }
          50% { transform: translate(80px, 10px) rotate(180deg); }
          75% { transform: translate(40px, -20px) rotate(270deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes drift-asteroid-2 {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-30px, 25px) rotate(-90deg); }
          50% { transform: translate(-60px, 5px) rotate(-180deg); }
          75% { transform: translate(-30px, -15px) rotate(-270deg); }
          100% { transform: translate(0, 0) rotate(-360deg); }
        }
        @keyframes drift-asteroid-3 {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(25px, 20px) rotate(120deg); }
          66% { transform: translate(50px, 5px) rotate(240deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
        @keyframes drift-asteroid-4 {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(-20px, 15px) rotate(-120deg); }
          66% { transform: translate(-40px, 3px) rotate(-240deg); }
          100% { transform: translate(0, 0) rotate(-360deg); }
        }
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

