// Matrix Achievement - в стиле матрицы с падающими символами
import React from 'react';

export function MatrixAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
  const Icon = achievement.icon;
  
  // Генерируем случайные символы для матрицы
  const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  
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
          ? "#000000"
          : undefined
      }}
    >
      {/* Matrix rain effect - падающие символы */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(16)].map((_, i) => {
            const delay = i * 0.2;
            const speed = 3 + Math.random() * 2;
            const left = (i * 6) + Math.random() * 3;
            return (
              <div
                key={`column-${i}`}
                className="absolute top-0"
                style={{
                  left: `${left}%`,
                  width: "1px",
                  height: "100%",
                  animation: `matrix-rain-${i % 3} ${speed}s linear ${delay}s infinite`
                }}
              >
                {[...Array(30)].map((_, j) => (
                  <div
                    key={`char-${j}`}
                    className="absolute text-green-400 font-mono opacity-80"
                    style={{
                      fontSize: '8px',
                      lineHeight: '1',
                      top: `${j * 3.5}%`,
                      color: j === 0 ? '#ffffff' : j === 1 ? '#00ff00' : '#00cc00',
                      textShadow: j === 0 ? '0 0 8px rgba(0,255,0,0.8)' : '0 0 4px rgba(0,255,0,0.4)',
                      animation: `matrix-fade ${speed}s linear ${delay + j * 0.05}s infinite`
                    }}
                  >
                    {matrixChars[Math.floor(Math.random() * matrixChars.length)]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid pattern */}
      {achievement.unlocked && (
        <div 
          className="absolute inset-0 rounded-xl opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(#00ff00 1px, transparent 1px),
              linear-gradient(90deg, #00ff00 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
      )}

      {/* Scanline effect */}
      {achievement.unlocked && (
        <div 
          className="absolute inset-0 rounded-xl"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(0,255,0,0.05) 50%, transparent 100%)",
            animation: "matrix-scan 3s linear infinite"
          }}
        />
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
                animation: `float-up-matrix-${i % 3} 1s ease-out forwards`
              }}
            >
              <Icon className="w-4 h-4 opacity-80 text-green-400" />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`p-3 rounded-lg ${
          achievement.unlocked ? "bg-green-500/20 backdrop-blur-sm border border-green-400/50" : "bg-muted"
        }`}
             style={achievement.unlocked ? {
               boxShadow: "0 0 20px rgba(0,255,0,0.4)"
             } : undefined}>
          <Icon className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? 'text-green-300' : ''}`} 
                style={achievement.unlocked ? { filter: "drop-shadow(0 0 8px rgba(0,255,0,0.8))" } : undefined} />
        </div>
        <div className="flex-1">
          <h4 className={`mb-1 font-bold font-mono ${achievement.unlocked ? 'text-green-300' : ''}`}
              style={achievement.unlocked ? { textShadow: "0 0 10px rgba(0,255,0,0.6)" } : undefined}>
            {achievement.name}
          </h4>
          <p className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? 'text-green-200' : ''}`}>
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold text-green-400 font-mono">
              UNLOCKED: {achievement.date}
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
        @keyframes matrix-rain-0 {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes matrix-rain-1 {
          0% { transform: translateY(-150%); }
          100% { transform: translateY(200%); }
        }
        @keyframes matrix-rain-2 {
          0% { transform: translateY(-120%); }
          100% { transform: translateY(200%); }
        }
        @keyframes matrix-fade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes matrix-scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes float-up-matrix-0 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(0.8); opacity: 0; }
        }
        @keyframes float-up-matrix-1 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-40px) scale(0.7); opacity: 0; }
        }
        @keyframes float-up-matrix-2 {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-35px) scale(0.75); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

