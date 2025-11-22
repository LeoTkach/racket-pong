// Aurora + Planets Achievement - с планетами, кольцами и орбитальной анимацией
import React from 'react';

export function AuroraPlanetsAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-indigo-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(180deg, #1e1b4b 0%, #312e81 20%, #4338ca 40%, #4f46e5 60%, #6366f1 80%, #818cf8 100%)"
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
              background: "linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.4) 30%, rgba(129,140,248,0.5) 50%, rgba(99,102,241,0.4) 70%, transparent 100%)",
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
              background: "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.3) 40%, rgba(167,139,250,0.4) 60%, rgba(139,92,246,0.3) 80%, transparent 100%)",
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

      {/* Planets with rings and orbital animation */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {/* Planet 1 - Large with rings */}
          <div
            className="absolute"
            style={{
              left: "15%",
              top: "20%",
              width: "50px",
              height: "50px",
              animation: "orbit-planet-1 20s linear infinite"
            }}
          >
            {/* Planet */}
            <div
              className="absolute rounded-full"
              style={{
                width: "50px",
                height: "50px",
                background: "radial-gradient(circle at 30% 30%, #fbbf24, #f59e0b, #d97706)",
                boxShadow: "inset -10px -10px 20px rgba(0,0,0,0.3), 0 0 20px rgba(251,191,36,0.4)"
              }}
            />
            {/* Rings */}
            <div
              className="absolute rounded-full"
              style={{
                left: "-10px",
                top: "-10px",
                width: "70px",
                height: "70px",
                border: "2px solid rgba(251,191,36,0.3)",
                transform: "rotateX(75deg)",
                transformStyle: "preserve-3d"
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                left: "-15px",
                top: "-15px",
                width: "80px",
                height: "80px",
                border: "1px solid rgba(251,191,36,0.2)",
                transform: "rotateX(75deg)",
                transformStyle: "preserve-3d"
              }}
            />
          </div>

          {/* Planet 2 - Medium blue */}
          <div
            className="absolute"
            style={{
              left: "60%",
              top: "60%",
              width: "35px",
              height: "35px",
              animation: "orbit-planet-2 15s linear infinite reverse"
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: "35px",
                height: "35px",
                background: "radial-gradient(circle at 30% 30%, #60a5fa, #3b82f6, #2563eb)",
                boxShadow: "inset -8px -8px 15px rgba(0,0,0,0.3), 0 0 15px rgba(96,165,250,0.4)"
              }}
            />
          </div>

          {/* Planet 3 - Small purple */}
          <div
            className="absolute"
            style={{
              left: "75%",
              top: "30%",
              width: "25px",
              height: "25px",
              animation: "orbit-planet-3 12s linear infinite"
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: "25px",
                height: "25px",
                background: "radial-gradient(circle at 30% 30%, #a78bfa, #8b5cf6, #7c3aed)",
                boxShadow: "inset -5px -5px 10px rgba(0,0,0,0.3), 0 0 10px rgba(167,139,250,0.4)"
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
              <Icon className="w-4 h-4 opacity-80 text-indigo-300" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-indigo-500/30 backdrop-blur-sm border border-indigo-300/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(99,102,241,0.4)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-indigo-100' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(99,102,241,0.8))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 ${achievement.unlocked ? 'text-indigo-100' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 0 10px rgba(99,102,241,0.6)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-indigo-200' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-indigo-300">
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
        @keyframes orbit-planet-1 {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(30px, 20px) rotate(360deg); }
        }
        @keyframes orbit-planet-2 {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-25px, -15px) rotate(-360deg); }
        }
        @keyframes orbit-planet-3 {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(20px, 30px) rotate(360deg); }
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

