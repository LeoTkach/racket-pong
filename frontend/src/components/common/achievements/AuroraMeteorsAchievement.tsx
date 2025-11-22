// Aurora + Meteors Achievement - с падающими метеорами и их светящимися хвостами
import React from 'react';

export function AuroraMeteorsAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-purple-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(180deg, #0a0e27 0%, #1a1f3a 20%, #2d1b4e 40%, #3b2a5e 60%, #4a3a6e 80%, #5a4a7e 100%)"
          : undefined
      }}
    >
      {/* Aurora waves */}
      {achievement.unlocked && (
        <>
          <div 
            className="absolute inset-0 rounded-xl opacity-40"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.4) 30%, rgba(167,139,250,0.5) 50%, rgba(139,92,246,0.4) 70%, transparent 100%)",
              animation: "aurora-wave 6s ease-in-out infinite",
              transform: "skewY(-5deg)"
            }}
          />
          <div 
            className="absolute inset-0 rounded-xl opacity-30"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(236,72,153,0.3) 40%, rgba(244,114,182,0.4) 60%, rgba(236,72,153,0.3) 80%, transparent 100%)",
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

      {/* Meteors with glowing tails */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {/* Meteor 1 */}
          <div
            className="absolute"
            style={{
              left: "15%",
              top: "-10%",
              animation: "meteor-fall-1 3s linear infinite"
            }}
          >
            {/* Tail */}
            <div
              className="absolute"
              style={{
                width: "2px",
                height: "60px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(6,182,212,0.8), rgba(34,211,238,0.6), transparent)",
                transform: "rotate(45deg)",
                transformOrigin: "top center",
                boxShadow: "0 0 10px rgba(6,182,212,0.8), 0 0 20px rgba(34,211,238,0.6)"
              }}
            />
            {/* Meteor body */}
            <div
              className="absolute rounded-full"
              style={{
                width: "4px",
                height: "4px",
                background: "radial-gradient(circle, #ffffff, #06b6d4)",
                boxShadow: "0 0 8px rgba(255,255,255,0.9), 0 0 15px rgba(6,182,212,0.8)",
                top: "0px"
              }}
            />
          </div>

          {/* Meteor 2 */}
          <div
            className="absolute"
            style={{
              left: "45%",
              top: "-15%",
              animation: "meteor-fall-2 4s linear infinite 0.5s"
            }}
          >
            {/* Tail */}
            <div
              className="absolute"
              style={{
                width: "2px",
                height: "80px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(16,185,129,0.8), rgba(52,211,153,0.6), transparent)",
                transform: "rotate(55deg)",
                transformOrigin: "top center",
                boxShadow: "0 0 12px rgba(16,185,129,0.8), 0 0 25px rgba(52,211,153,0.6)"
              }}
            />
            {/* Meteor body */}
            <div
              className="absolute rounded-full"
              style={{
                width: "5px",
                height: "5px",
                background: "radial-gradient(circle, #ffffff, #10b981)",
                boxShadow: "0 0 10px rgba(255,255,255,0.9), 0 0 18px rgba(16,185,129,0.8)",
                top: "0px"
              }}
            />
          </div>

          {/* Meteor 3 */}
          <div
            className="absolute"
            style={{
              left: "75%",
              top: "-20%",
              animation: "meteor-fall-3 3.5s linear infinite 1s"
            }}
          >
            {/* Tail */}
            <div
              className="absolute"
              style={{
                width: "1.5px",
                height: "50px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(139,92,246,0.8), rgba(167,139,250,0.6), transparent)",
                transform: "rotate(50deg)",
                transformOrigin: "top center",
                boxShadow: "0 0 8px rgba(139,92,246,0.8), 0 0 18px rgba(167,139,250,0.6)"
              }}
            />
            {/* Meteor body */}
            <div
              className="absolute rounded-full"
              style={{
                width: "3px",
                height: "3px",
                background: "radial-gradient(circle, #ffffff, #8b5cf6)",
                boxShadow: "0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(139,92,246,0.8)",
                top: "0px"
              }}
            />
          </div>

          {/* Meteor 4 */}
          <div
            className="absolute"
            style={{
              left: "30%",
              top: "-12%",
              animation: "meteor-fall-4 4.5s linear infinite 1.5s"
            }}
          >
            {/* Tail */}
            <div
              className="absolute"
              style={{
                width: "1.5px",
                height: "70px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(236,72,153,0.8), rgba(244,114,182,0.6), transparent)",
                transform: "rotate(60deg)",
                transformOrigin: "top center",
                boxShadow: "0 0 10px rgba(236,72,153,0.8), 0 0 20px rgba(244,114,182,0.6)"
              }}
            />
            {/* Meteor body */}
            <div
              className="absolute rounded-full"
              style={{
                width: "4px",
                height: "4px",
                background: "radial-gradient(circle, #ffffff, #ec4899)",
                boxShadow: "0 0 8px rgba(255,255,255,0.9), 0 0 15px rgba(236,72,153,0.8)",
                top: "0px"
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
              <Icon className="w-4 h-4 opacity-80 text-purple-300" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-purple-500/30 backdrop-blur-sm border border-purple-300/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(139,92,246,0.4)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-purple-100' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(139,92,246,0.8))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 ${achievement.unlocked ? 'text-purple-100' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 0 10px rgba(139,92,246,0.6)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-purple-200' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-purple-300">
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
        @keyframes meteor-fall-1 {
          0% { transform: translate(0, 0) rotate(45deg); opacity: 1; }
          100% { transform: translate(150px, 400px) rotate(45deg); opacity: 0; }
        }
        @keyframes meteor-fall-2 {
          0% { transform: translate(0, 0) rotate(55deg); opacity: 1; }
          100% { transform: translate(180px, 450px) rotate(55deg); opacity: 0; }
        }
        @keyframes meteor-fall-3 {
          0% { transform: translate(0, 0) rotate(50deg); opacity: 1; }
          100% { transform: translate(120px, 380px) rotate(50deg); opacity: 0; }
        }
        @keyframes meteor-fall-4 {
          0% { transform: translate(0, 0) rotate(60deg); opacity: 1; }
          100% { transform: translate(200px, 500px) rotate(60deg); opacity: 0; }
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

