// Tree Achievement - дерево и природа
import React from 'react';

export function TreeAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
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
          ? "linear-gradient(135deg, #166534 0%, #22c55e 30%, #4ade80 60%, #86efac 100%)"
          : undefined
      }}
    >
      {/* Tree trunk - full height, brown, with texture and volume - behind crown */}
      {achievement.unlocked && (
        <div className="absolute bottom-0 right-4 z-[1] w-full h-full">
          {/* Main trunk - brown with subtle gradient for volume - larger and positioned right */}
          <div
            className="absolute bottom-0"
            style={{
              right: "0",
              width: "58px",
              height: "100%",
              background: "linear-gradient(90deg, #4a2f1a 0%, #654321 15%, #8B4513 35%, #A0522D 50%, #8B4513 65%, #654321 85%, #4a2f1a 100%)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.4), inset -5px 0 10px rgba(0,0,0,0.35), inset 5px 0 10px rgba(255,255,255,0.2)"
            }}
          />
          {/* Enhanced bark texture - central vertical line */}
          <div
            className="absolute bottom-0"
            style={{
              right: "29px",
              width: "2px",
              height: "100%",
              background: "linear-gradient(to bottom, rgba(101,67,33,0.6) 0%, rgba(139,69,19,0.8) 15%, rgba(101,67,33,0.5) 30%, rgba(139,69,19,0.8) 45%, rgba(101,67,33,0.6) 60%, rgba(139,69,19,0.8) 75%, rgba(101,67,33,0.5) 90%, rgba(139,69,19,0.8) 100%)",
              borderRadius: "1px"
            }}
          />
          {/* Bark texture - left side dark edge */}
          <div
            className="absolute bottom-0"
            style={{
              right: "48px",
              width: "3px",
              height: "100%",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.4) 100%)",
              borderRadius: "1.5px"
            }}
          />
          {/* Bark texture - right side light edge */}
          <div
            className="absolute bottom-0"
            style={{
              right: "10px",
              width: "3px",
              height: "100%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.1) 100%)",
              borderRadius: "1.5px"
            }}
          />
          {/* Additional bark details - horizontal cracks */}
          {[20, 35, 55, 75].map((position, i) => (
            <div
              key={`crack-${i}`}
              className="absolute"
              style={{
                right: "8px",
                width: "42px",
                height: "1.5px",
                top: `${position}%`,
                background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.4) 80%, transparent 100%)",
                borderRadius: "0.5px"
              }}
            />
          ))}
          {/* Bark knots */}
          {[25, 50, 80].map((position, i) => (
            <div
              key={`knot-${i}`}
              className="absolute rounded-full"
              style={{
                right: `${15 + i * 8}px`,
                top: `${position}%`,
                width: "8px",
                height: "12px",
                background: "radial-gradient(circle, #5a3825 0%, #4a2f1a 70%)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
                opacity: 0.7
              }}
            />
          ))}
        </div>
      )}

      {/* Tree crown/foliage - appearing from top edge, overlapping trunk */}
      {achievement.unlocked && (
        <div className="absolute right-0 z-[10]" style={{ top: "-80px", right: "16px", width: "200px", height: "200px" }}>
          {/* First circle - large green - насыщенный зеленый */}
          <div
            className="absolute rounded-full"
            style={{
              left: "138.4315px",
              top: "66.5685px",
              width: "66px",
              height: "66px",
              background: "radial-gradient(circle, #4ade80 0%, #22c55e 60%, #16a34a 100%)",
              transform: "translate(-50%, -50%)",
              animation: "tree-sway 5s ease-in-out 1s infinite",
              transformOrigin: "center center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.35), inset -3px -3px 6px rgba(0,0,0,0.25)",
              zIndex: 15
            }}
          />
          
          {/* Second circle - medium - чуть светлее */}
          <div
            className="absolute rounded-full"
            style={{
              left: "195px",
              top: "75px",
              width: "52px",
              height: "52px",
              background: "radial-gradient(circle, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
              transform: "translate(-50%, -50%)",
              animation: "tree-sway 4s ease-in-out 0.8s infinite",
              transformOrigin: "center center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.35), inset -3px -3px 6px rgba(0,0,0,0.25)",
              zIndex: 14
            }}
          />
          
          {/* Circle between them - затемненный, под остальными */}
          <div
            className="absolute rounded-full"
            style={{
              left: "166.7157px",
              top: "72.7843px",
              width: "40px",
              height: "40px",
              background: "radial-gradient(circle, #22c55e 0%, #16a34a 60%, #15803d 100%)",
              transform: "translate(-50%, -50%)",
              animation: "tree-sway 4.5s ease-in-out 0.9s infinite",
              transformOrigin: "center center",
              boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
              zIndex: 14.5
            }}
          />
        </div>
      )}

      {/* Falling leaves */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 opacity-70"
              style={{
                left: `${15 + i * 15}%`,
                top: "5%",
                animation: `leaf-fall ${5 + (i % 3) * 2}s ease-in-out ${i * 0.6}s infinite`
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-600">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Grass at bottom */}
      {achievement.unlocked && (
        <div className="absolute bottom-0 left-0 right-0 h-16">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 bg-green-800/50"
              style={{
                left: `${i * 6.5}%`,
                width: "2px",
                height: `${20 + Math.random() * 20}px`,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                animation: `grass-sway ${2 + (i % 4)}s ease-in-out ${i * 0.15}s infinite`,
                transformOrigin: "bottom center"
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
          achievement.unlocked ? "bg-green-900/40 backdrop-blur-sm border border-amber-400/50" : "bg-muted"
        }`}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-white' : ''}`} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-white' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 1px 3px rgba(0,0,0,0.4)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-green-50' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-green-100">
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
        @keyframes tree-sway {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(-2deg); }
          75% { transform: translate(-50%, -50%) rotate(2deg); }
        }
        @keyframes leaf-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
          100% { transform: translateY(200px) rotate(360deg); opacity: 0; }
        }
        @keyframes grass-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
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

