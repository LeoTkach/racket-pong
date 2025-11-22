import React from 'react';

type MetallicVariant = 'silver' | 'bronze' | 'gold';

interface MetallicAchievementProps {
  achievement: any;
  onClick: (id: string, unlocked: boolean) => void;
  isClicked: boolean;
  isAnimating: boolean;
  variant?: MetallicVariant;
}

const metallicVariants: Record<MetallicVariant, {
  gradient: string;
  borderColor: string;
  iconColor: string;
  iconGlow: string;
  floatingIconColor: string;
  textColor: string;
  overlayTop: string;
  overlayBottom: string;
  panelBackground: string;
  panelBorder: string;
  panelShadow: string;
  brushedLineColor: string;
}> = {
  silver: {
    gradient: "linear-gradient(135deg, #d1d5db 0%, #9ca3af 25%, #6b7280 50%, #9ca3af 75%, #d1d5db 100%)",
    borderColor: "rgba(209,213,219,0.8)",
    iconColor: "#111827",
    iconGlow: "drop-shadow(0 0 10px rgba(229,231,235,0.9))",
    floatingIconColor: "#e5e7eb",
    textColor: "#0f172a",
    overlayTop: "linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)",
    overlayBottom: "linear-gradient(to top, rgba(15,23,42,0.6), transparent)",
    panelBackground: "rgba(255,255,255,0.25)",
    panelBorder: "rgba(255,255,255,0.5)",
    panelShadow: "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(15,23,42,0.35)",
    brushedLineColor: "rgba(255,255,255,0.25)"
  },
  bronze: {
    gradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 25%, #92400e 50%, #b45309 75%, #f59e0b 100%)",
    borderColor: "rgba(180,83,9,0.9)",
    iconColor: "#78350f",
    iconGlow: "drop-shadow(0 0 10px rgba(251,191,36,0.6))",
    floatingIconColor: "#fde68a",
    textColor: "#451a03",
    overlayTop: "linear-gradient(to bottom, rgba(253,230,138,0.8), transparent)",
    overlayBottom: "linear-gradient(to top, rgba(69,26,3,0.65), transparent)",
    panelBackground: "rgba(253,230,138,0.2)",
    panelBorder: "rgba(252,211,77,0.6)",
    panelShadow: "inset 0 2px 4px rgba(253,230,138,0.4), inset 0 -4px 10px rgba(69,26,3,0.4)",
    brushedLineColor: "rgba(253,230,138,0.35)"
  },
  gold: {
    gradient: "linear-gradient(135deg, #fde68a 0%, #fbbf24 25%, #f59e0b 50%, #d97706 75%, #fbbf24 100%)",
    borderColor: "rgba(251,191,36,0.9)",
    iconColor: "#7c2d12",
    iconGlow: "drop-shadow(0 0 14px rgba(251,191,36,0.8))",
    floatingIconColor: "#fef3c7",
    textColor: "#4c1d95",
    overlayTop: "linear-gradient(to bottom, rgba(254,249,195,0.85), transparent)",
    overlayBottom: "linear-gradient(to top, rgba(124,45,18,0.5), transparent)",
    panelBackground: "rgba(254,243,199,0.25)",
    panelBorder: "rgba(251,191,36,0.6)",
    panelShadow: "inset 0 2px 4px rgba(254,243,199,0.6), inset 0 -4px 10px rgba(124,45,18,0.4)",
    brushedLineColor: "rgba(254,243,199,0.35)"
  }
};

function MetallicAchievementBase({
  achievement,
  onClick,
  isClicked,
  isAnimating,
  variant = 'silver'
}: MetallicAchievementProps) {
  const Icon = achievement.icon;
  const palette = metallicVariants[variant];
  
  return (
    <div
      onClick={() => onClick(achievement.id, achievement.unlocked)}
      className={`relative p-6 rounded-xl border-2 transition-all overflow-hidden ${
        achievement.unlocked
          ? "hover:scale-105 cursor-pointer"
          : "opacity-50 grayscale border-muted bg-muted/30"
      }`}
      style={{
        background: achievement.unlocked ? palette.gradient : undefined,
        borderColor: achievement.unlocked ? palette.borderColor : undefined
      }}
    >
      {/* Metallic reflections */}
      {achievement.unlocked && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1/2" style={{ background: palette.overlayTop }} />
          <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: palette.overlayBottom }} />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 via-transparent to-black/30" />
          
          {/* Brushed metal texture */}
          <div
            className="absolute inset-0 rounded-xl opacity-40"
            style={{
              backgroundImage: `repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                ${palette.brushedLineColor} 2px,
                ${palette.brushedLineColor} 4px
              )`
            }}
          />
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
              <Icon className="w-4 h-4 opacity-80" style={{ color: palette.floatingIconColor }} />
            </div>
          ))}
        </>
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div
          className={`p-3 rounded-lg ${achievement.unlocked ? "backdrop-blur-sm border" : "bg-muted"}`}
          style={achievement.unlocked ? {
            background: palette.panelBackground,
            borderColor: palette.panelBorder,
            boxShadow: palette.panelShadow
          } : undefined}
        >
          <Icon
            className={`w-6 h-6 transition-transform duration-150 ${isClicked && !isAnimating ? 'scale-125' : ''} ${achievement.unlocked ? '' : ''}`}
            style={achievement.unlocked ? { color: palette.iconColor, filter: palette.iconGlow } : undefined}
          />
        </div>
        <div className="flex-1">
          <h4
            className={`mb-1 font-bold ${achievement.unlocked ? '' : ''}`}
            style={achievement.unlocked ? { color: palette.textColor } : undefined}
          >
            {achievement.name}
          </h4>
          <p
            className={`text-sm mb-2 opacity-90 ${achievement.unlocked ? '' : ''}`}
            style={achievement.unlocked ? { color: palette.textColor } : undefined}
          >
            {achievement.description}
          </p>
          {achievement.unlocked && achievement.date && (
            <p className="text-xs font-semibold" style={{ color: palette.textColor }}>
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

// Achievement with Realistic Metal background (default silver)
export function MetallicAchievement(props: MetallicAchievementProps) {
  return <MetallicAchievementBase {...props} variant="silver" />;
}

export function BronzeMetallicAchievement(props: MetallicAchievementProps) {
  return <MetallicAchievementBase {...props} variant="bronze" />;
}

export function GoldMetallicAchievement(props: MetallicAchievementProps) {
  return <MetallicAchievementBase {...props} variant="gold" />;
}

