// Nature Achievement - трава и природа
export function NatureAchievement({ achievement, onClick, isClicked, isAnimating }: any) {
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
          ? "linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)"
          : undefined
      }}
    >
      {/* Grass blades at bottom */}
      {achievement.unlocked && (
        <div className="absolute bottom-0 left-0 right-0 h-24">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 bg-green-700/60"
              style={{
                left: `${i * 5}%`,
                width: "3px",
                height: `${30 + Math.random() * 30}px`,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                animation: `grass-sway ${2 + (i % 5)}s ease-in-out ${i * 0.1}s infinite`,
                transformOrigin: "bottom center"
              }}
            />
          ))}
        </div>
      )}

      {/* Leaves falling */}
      {achievement.unlocked && (
        <div className="absolute inset-0 rounded-xl">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 opacity-70"
              style={{
                left: `${10 + i * 20}%`,
                top: "10%",
                animation: `leaf-fall ${4 + (i % 3) * 2}s ease-in-out ${i * 0.8}s infinite`
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
              </svg>
            </div>
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
          achievement.unlocked ? "bg-green-900/40 backdrop-blur-sm border border-green-400/50" : "bg-muted"
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
    </div>
  );
}
