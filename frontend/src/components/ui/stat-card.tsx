import * as React from "react";
import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "./utils";

interface StatCardProps {
  title: string;
  value: number | string | React.ReactNode;
  description: string;
  icon: LucideIcon;
  isLoading?: boolean;
  iconColor?: "blue" | "yellow" | "green" | "purple" | "default";
  hoverBorderColor?: string;
  hoverGradient?: string;
  loadingColor?: string;
  className?: string;
}

const iconColorStyles = {
  blue: {
    gradient: "linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)",
    hoverGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.1) 100%)",
    hoverBorder: "rgba(59, 130, 246, 0.5)",
    loadingColor: "text-blue-500",
  },
  yellow: {
    gradient: "linear-gradient(135deg, rgb(234, 179, 8) 0%, rgb(202, 138, 4) 100%)",
    hoverGradient: "linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(250, 204, 21, 0.1) 100%)",
    hoverBorder: "rgba(234, 179, 8, 0.5)",
    loadingColor: "text-yellow-500",
  },
  green: {
    gradient: "linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 100%)",
    hoverGradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(134, 239, 172, 0.1) 100%)",
    hoverBorder: "rgba(34, 197, 94, 0.5)",
    loadingColor: "text-green-500",
  },
  purple: {
    gradient: "linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(147, 51, 234) 100%)",
    hoverGradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(196, 181, 253, 0.1) 100%)",
    hoverBorder: "rgba(168, 85, 247, 0.5)",
    loadingColor: "text-purple-500",
  },
  default: {
    gradient: "",
    hoverGradient: "",
    hoverBorder: "",
    loadingColor: "text-foreground",
  },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading = false,
  iconColor = "default",
  hoverBorderColor,
  hoverGradient,
  loadingColor,
  className,
}: StatCardProps) {
  const isDark = document.documentElement.classList.contains("dark");
  const colorStyle = iconColorStyles[iconColor];
  
  // Для yellow цвета используем разные градиенты для светлой и темной темы
  const iconGradient = iconColor === "yellow" && !isDark
    ? "linear-gradient(135deg, rgb(251, 191, 36) 0%, rgb(245, 158, 11) 100%)"
    : colorStyle.gradient;
  
  const finalHoverBorder = hoverBorderColor || colorStyle.hoverBorder;
  const finalHoverGradient = hoverGradient || colorStyle.hoverGradient;
  const finalLoadingColor = loadingColor || colorStyle.loadingColor;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 cursor-default bg-card border border-border shadow-sm",
        className
      )}
      onMouseEnter={(e) => {
        if (finalHoverBorder) {
          e.currentTarget.style.borderColor = finalHoverBorder;
        }
      }}
      onMouseLeave={(e) => {
        if (finalHoverBorder) {
          e.currentTarget.style.borderColor = "";
        }
      }}
    >
      {/* Gradient overlay on hover */}
      {finalHoverGradient && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: finalHoverGradient,
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          {iconColor !== "default" && iconGradient ? (
            <div
              className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-lg"
              style={{
                background: iconGradient,
              }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-muted border border-border transition-all duration-300">
              <Icon className="w-5 h-5 text-foreground" />
            </div>
          )}
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        <div className={cn("text-4xl font-bold text-foreground mb-2")}>
          {isLoading ? (
            <Loader2 className={cn("w-8 h-8 animate-spin", finalLoadingColor)} />
          ) : (
            value
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}





