// Jungle Achievement - джунгли с лианами, листьями и природой
import React from 'react';

export function JungleAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer border-green-400/50"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked 
          ? "linear-gradient(180deg, #064e3b 0%, #065f46 20%, #047857 40%, #059669 60%, #10b981 80%, #34d399 100%)"
          : undefined
      }}
    >
      {/* Vines hanging from top */}
      {achievement.unlocked && (
        <div className="absolute top-0 left-0 right-0 h-full">
          {[...Array(8)].map((_, i) => (
            <div
              key={`vine-${i}`}
              className="absolute top-0"
              style={{
                left: `${10 + i * 12}%`,
                width: "4px",
                height: "100%",
                background: "linear-gradient(to bottom, #166534 0%, #15803d 50%, #16a34a 100%)",
                borderRadius: "2px",
                boxShadow: "inset 2px 0 4px rgba(0,0,0,0.3)",
                animation: `vine-sway-${i % 3} ${4 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`,
                transformOrigin: "top center"
              }}
            >
              {/* Leaves on vines */}
              {[...Array(3)].map((_, j) => (
                <div
                  key={`vine-leaf-${i}-${j}`}
                  className="absolute"
                  style={{
                    left: "-10px",
                    top: `${25 + j * 30}%`,
                    width: "24px",
                    height: "18px",
                    animation: `leaf-sway-${j % 2} ${3 + j}s ease-in-out ${j * 0.3}s infinite`
                  }}
                >
                  <svg viewBox="0 0 24 18" className="w-full h-full">
                    <defs>
                      <linearGradient id={`vineLeafGradient-${i}-${j}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="50%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#15803d" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12,2 Q8,6 6,10 Q8,14 12,16 Q16,14 18,10 Q16,6 12,2 Z"
                      fill={`url(#vineLeafGradient-${i}-${j})`}
                      stroke="#15803d"
                      strokeWidth="0.5"
                    />
                  </svg>
                </div>
              ))}
              
              {/* Tropical flowers on vines - качаются вместе с лианами */}
              {(i === 0 || i === 2 || i === 4) && (() => {
                const flowerIndex = i === 0 ? 0 : i === 2 ? 1 : 2;
                const colors = [
                  { outer: "#f472b6", inner: "#ec4899", center: "#fbbf24" },
                  { outer: "#fb923c", inner: "#f97316", center: "#fef08a" },
                  { outer: "#c084fc", inner: "#a855f7", center: "#fbbf24" },
                ];
                const colorSet = colors[flowerIndex];
                const topPositions = ["45%", "50%", "47%"];
                return (
                  <div
                    className="absolute"
                    style={{
                      left: "-12px",
                      top: topPositions[flowerIndex],
                      width: "22px",
                      height: "22px",
                      zIndex: 20,
                      pointerEvents: "none"
                    }}
                  >
                    {/* Petals - перекрываются друг другом по кругу */}
                    {/* Рисуем последний лепесток первым, чтобы он был под первым */}
                    <div
                      key={`petal-${i}-5`}
                      className="absolute"
                      style={{
                        left: "50%",
                        top: "50%",
                        width: "10px",
                        height: "15px",
                        background: `radial-gradient(ellipse at center, ${colorSet.outer} 0%, ${colorSet.inner} 70%, ${colorSet.inner}dd 100%)`,
                        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                        transform: `translate(-50%, -50%) rotate(${5 * 60}deg) translateY(-6px)`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        transformOrigin: "center 6px",
                        zIndex: 1
                      }}
                    />
                    {/* Остальные лепестки */}
                    {[...Array(5)].map((_, petalIdx) => {
                      return (
                        <div
                          key={`petal-${i}-${petalIdx}`}
                          className="absolute"
                          style={{
                            left: "50%",
                            top: "50%",
                            width: "10px",
                            height: "15px",
                            background: `radial-gradient(ellipse at center, ${colorSet.outer} 0%, ${colorSet.inner} 70%, ${colorSet.inner}dd 100%)`,
                            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                            transform: `translate(-50%, -50%) rotate(${petalIdx * 60}deg) translateY(-6px)`,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                            transformOrigin: "center 6px",
                            zIndex: petalIdx + 2
                          }}
                        />
                      );
                    })}
                    {/* Center - поверх всех лепестков */}
                    <div
                      className="absolute left-1/2 top-1/2 rounded-full"
                      style={{
                        width: "6px",
                        height: "6px",
                        background: `radial-gradient(circle, ${colorSet.center} 0%, ${colorSet.center}cc 100%)`,
                        transform: "translate(-50%, -50%)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                        zIndex: 10
                      }}
                    />
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Large tropical leaves - тропические листья с прожилками */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(6)].map((_, i) => {
            const sizes = [
              { width: 75, height: 95 },  // большой
              { width: 60, height: 80 },  // средний  
              { width: 75, height: 95 },  // большой
              { width: 50, height: 65 },  // маленький
              { width: 60, height: 80 },  // средний
              { width: 75, height: 95 },  // большой
            ];
            const leafSize = sizes[i];
            const positions = [
              { left: "-10px", top: "15%", rotate: -20 },
              { left: "85%", top: "20%", rotate: 25 },
              { left: "-5px", top: "50%", rotate: -15 },
              { left: "90%", top: "55%", rotate: 30 },
              { left: "-8px", top: "75%", rotate: -25 },
              { left: "85%", top: "80%", rotate: 20 },
            ];
            const pos = positions[i];
            
            return (
              <div
                key={`huge-leaf-${i}`}
                className="absolute bottom-0"
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: `${leafSize.width}px`,
                  height: `${leafSize.height}px`,
                  zIndex: 9 + (i % 2)
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: i % 3 === 0
                      ? "radial-gradient(ellipse at 50% 85%, #10b981 0%, #059669 35%, #047857 70%, #065f46 100%)"
                      : i % 3 === 1
                      ? "radial-gradient(ellipse at 50% 85%, #22c55e 0%, #16a34a 35%, #15803d 70%, #14532d 100%)"
                      : "radial-gradient(ellipse at 50% 85%, #4ade80 0%, #22c55e 35%, #16a34a 70%, #15803d 100%)",
                    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                    transform: `rotate(${pos.rotate}deg)`,
                    boxShadow: "0 6px 14px rgba(0,0,0,0.4), inset -6px -6px 12px rgba(0,0,0,0.3), inset 3px 3px 6px rgba(255,255,255,0.1)",
                    animation: `leaf-wave ${3.5 + i}s ease-in-out ${i * 0.25}s infinite`
                  }}
                >
                  {/* Центральная прожилка */}
                  <div
                    className="absolute"
                    style={{
                      top: "15%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "3px",
                      height: "70%",
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.08) 100%)",
                      borderRadius: "2px"
                    }}
                  />
                  {/* Боковые прожилки слева - первая у основания (внизу), остальные выше */}
                  {[...Array(5)].map((_, veinIdx) => (
                    <div
                      key={`vein-left-${veinIdx}`}
                      className="absolute"
                      style={{
                        top: `${85 - veinIdx * 15}%`,
                        right: "50%",
                        width: `${12 + (4 - veinIdx) * 7}%`,
                        height: "1px",
                        background: `rgba(0,0,0,${0.15 - veinIdx * 0.02})`,
                        transform: `rotate(50deg)`,
                        transformOrigin: "right center"
                      }}
                    />
                  ))}
                  {/* Боковые прожилки справа - первая у основания (внизу), остальные выше */}
                  {[...Array(5)].map((_, veinIdx) => (
                    <div
                      key={`vein-right-${veinIdx}`}
                      className="absolute"
                      style={{
                        top: `${85 - veinIdx * 15}%`,
                        left: "50%",
                        width: `${12 + (4 - veinIdx) * 7}%`,
                        height: "1px",
                        background: `rgba(0,0,0,${0.15 - veinIdx * 0.02})`,
                        transform: `rotate(-50deg)`,
                        transformOrigin: "left center"
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Small leaves floating */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(10)].map((_, i) => (
            <div
              key={`small-leaf-${i}`}
              className="absolute w-4 h-4 opacity-70"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `small-leaf-float-${i % 3} ${6 + Math.random() * 4}s ease-in-out ${i * 0.5}s infinite`
              }}
            >
              <svg viewBox="0 0 24 18" className="w-full h-full">
                <path
                  d="M12,2 Q9,6 7,10 Q6,12 7,14 Q9,16 12,16 Q15,16 17,14 Q18,12 17,10 Q15,6 12,2 Z"
                  fill="#16a34a"
                  stroke="#15803d"
                  strokeWidth="0.5"
                  opacity="0.8"
                />
                <path
                  d="M12,2 L12,10"
                  stroke="#166534"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Ground/grass at bottom */}
      {achievement.unlocked && (
        <div className="absolute bottom-0 left-0 right-0 h-20">
          {[...Array(25)].map((_, i) => (
            <div
              key={`grass-${i}`}
              className="absolute bottom-0 bg-green-800/70"
              style={{
                left: `${i * 4}%`,
                width: "2px",
                height: `${20 + Math.random() * 25}px`,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                animation: `jungle-grass-sway ${2 + (i % 4)}s ease-in-out ${i * 0.1}s infinite`,
                transformOrigin: "bottom center"
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
                animation: `float-up-jungle-${i % 3} 1s ease-out forwards`
              }}
            >
              <Icon className="w-4 h-4 opacity-80 text-green-300" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-green-900/40 backdrop-blur-sm border border-green-400/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(34,197,94,0.4)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-green-100' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(34,197,94,0.8))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold ${achievement.unlocked ? 'text-green-100' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 1px 3px rgba(0,0,0,0.4)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-green-50' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-green-200">
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
        @keyframes vine-sway-0 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes vine-sway-1 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-2deg); }
        }
        @keyframes vine-sway-2 {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2.5deg); }
        }
        @keyframes leaf-sway-0 {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.1); }
        }
        @keyframes leaf-sway-1 {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(-8deg) scale(1.05); }
        }
        @keyframes flower-sway-0 {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(8deg) scale(1.1); }
        }
        @keyframes flower-sway-1 {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(-6deg) scale(1.05); }
        }
        @keyframes flower-sway-2 {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(7deg) scale(1.08); }
        }
        @keyframes flower-bloom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes small-leaf-float-0 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          50% { transform: translate(10px, -15px) rotate(180deg); opacity: 1; }
        }
        @keyframes small-leaf-float-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          50% { transform: translate(-8px, -12px) rotate(-150deg); opacity: 1; }
        }
        @keyframes small-leaf-float-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.7; }
          50% { transform: translate(12px, -10px) rotate(160deg); opacity: 1; }
        }
        @keyframes jungle-grass-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(4deg); }
        }
        @keyframes float-up-jungle-0 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
        }
        @keyframes float-up-jungle-1 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.7); opacity: 0; }
        }
        @keyframes float-up-jungle-2 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-35px) scale(0.75); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

