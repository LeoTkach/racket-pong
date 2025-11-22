import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "./utils";

interface AnimatedShinyButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  url?: string;
}

export function AnimatedShinyButton({
  children,
  className = "",
  onClick,
  url,
}: AnimatedShinyButtonProps) {
  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,500&display=swap");

        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: white;
          inherits: false;
        }

        .shiny-cta,
        .shiny-cta-link {
          --shiny-cta-bg: color-mix(in oklab, var(--primary) 10%, var(--card));
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--primary) 20%, var(--muted));
          --shiny-cta-fg: var(--primary);
          --shiny-cta-highlight: #fbbf24;
          --shiny-cta-highlight-subtle: #f59e0b;
          --shiny-cta-border-width: 1px;
          --animation: gradient-angle linear infinite;
          --duration: 6s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
          isolation: isolate;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          outline-offset: 4px;
          padding: 0.75rem 1.5rem;
          font-family: "Inter", sans-serif;
          font-size: 1rem;
          line-height: 1.2;
          font-weight: 500;
          border: var(--shiny-cta-border-width) solid var(--shiny-cta-highlight) !important;
          border-radius: 0.5rem;
          color: var(--shiny-cta-fg);
          background: var(--shiny-cta-bg) padding-box;
          box-shadow: 
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            var(--shiny-cta-extra-shadow, none);
          transition: var(--transition);
          transition-property: border-color, box-shadow;
        }

        /* Для темной темы - немного больше желтого оттенка */
        .dark .shiny-cta,
        .dark .shiny-cta-link {
          --shiny-cta-bg: color-mix(in oklab, var(--primary) 12%, var(--card));
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--primary) 25%, var(--muted));
        }

        /* Для светлой темы - еще более приглушенный */
        .light .shiny-cta,
        .light .shiny-cta-link {
          --shiny-cta-bg: color-mix(in oklab, var(--primary) 8%, var(--card));
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--primary) 18%, var(--muted));
        }

        /* Варианты фона для выделения кнопки */
        .shiny-cta.bg-primary,
        .shiny-cta-link.bg-primary {
          --shiny-cta-bg: var(--primary);
          --shiny-cta-fg: var(--primary-foreground);
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--primary) 80%, black);
        }

        .shiny-cta.bg-primary-light,
        .shiny-cta-link.bg-primary-light {
          --shiny-cta-bg: color-mix(in oklab, var(--primary) 15%, transparent);
          --shiny-cta-fg: var(--primary);
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--primary) 30%, transparent);
        }

        .shiny-cta.bg-accent,
        .shiny-cta-link.bg-accent {
          --shiny-cta-bg: var(--accent);
          --shiny-cta-fg: var(--accent-foreground);
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--accent) 80%, black);
        }

        .shiny-cta.bg-secondary,
        .shiny-cta-link.bg-secondary {
          --shiny-cta-bg: var(--secondary);
          --shiny-cta-fg: var(--secondary-foreground);
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--secondary) 80%, black);
        }

        .shiny-cta.bg-muted,
        .shiny-cta-link.bg-muted {
          --shiny-cta-bg: var(--muted);
          --shiny-cta-fg: var(--muted-foreground);
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--muted) 80%, black);
        }

        /* Темная тема - яркий фон */
        .dark .shiny-cta.bg-primary-light,
        .dark .shiny-cta-link.bg-primary-light {
          --shiny-cta-bg: color-mix(in oklab, var(--primary) 20%, transparent);
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--primary) 40%, transparent);
        }

        /* Светлая тема - более светлый фон */
        .light .shiny-cta.bg-primary-light,
        .light .shiny-cta-link.bg-primary-light {
          --shiny-cta-bg: color-mix(in oklab, var(--primary) 10%, transparent);
          --shiny-cta-bg-subtle: color-mix(in oklab, var(--primary) 25%, transparent);
        }

        /* Allow border width override via CSS variable */
        .shiny-cta[style*="--shiny-cta-border-width"],
        .shiny-cta-link[style*="--shiny-cta-border-width"] {
          border-width: var(--shiny-cta-border-width) !important;
        }

        /* Support for custom border via outline (doesn't interfere with gradient) */
        .shiny-cta.has-outline-border,
        .shiny-cta-link.has-outline-border {
          outline: 2px solid var(--border, var(--shiny-cta-bg-subtle));
          outline-offset: 2px;
        }

        /* Link-specific styles */
        .shiny-cta-link {
          display: inline-block;
          text-decoration: none;
        }

        .shiny-cta::before,
        .shiny-cta::after,
        .shiny-cta span::before,
        .shiny-cta-link::before,
        .shiny-cta-link::after,
        .shiny-cta-link span::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        .shiny-cta:active,
        .shiny-cta-link:active {
          translate: 0 1px;
        }

        /* Dots pattern */
        .shiny-cta::before,
        .shiny-cta-link::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
              circle at var(--position) var(--position),
              white calc(var(--position) / 4),
              transparent 0
            )
            padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from 45deg,
            black,
            transparent 10% 90%,
            black
          );
          border-radius: 0.5rem;
          opacity: 0.4;
          z-index: -1;
        }

        /* Inner shimmer */
        .shiny-cta::after,
        .shiny-cta-link::after {
          --animation: shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-cta-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.6;
        }

        .shiny-cta span,
        .shiny-cta-link span {
          z-index: 1;
        }

        .shiny-cta span::before,
        .shiny-cta-link span::before {
          --size: calc(100% + 1rem);
          width: var(--size);
          height: var(--size);
          box-shadow: inset 0 -1ex 2rem 4px var(--shiny-cta-highlight);
          opacity: 0;
          transition: opacity var(--transition);
          animation: calc(var(--duration) * 1.5) breathe linear infinite;
        }

        /* Внутренние анимации (shimmer для ::after, dots для ::before) */
        .shiny-cta::after,
        .shiny-cta-link::after {
          animation:
            var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-cta:is(:hover, :focus-visible),
        .shiny-cta-link:is(:hover, :focus-visible) {
          border-color: var(--shiny-cta-highlight-subtle) !important;
          box-shadow: 
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            0 0 0 2px color-mix(in oklab, var(--shiny-cta-highlight) 30%, transparent),
            var(--shiny-cta-extra-shadow, none);
        }

        .shiny-cta:is(:hover, :focus-visible)::after,
        .shiny-cta-link:is(:hover, :focus-visible)::after {
          animation-play-state: running;
        }

        .shiny-cta:is(:hover, :focus-visible) span::before,
        .shiny-cta-link:is(:hover, :focus-visible) span::before {
          opacity: 1;
        }

        /* Статичный градиентный border (без анимации) */
        .shiny-cta.static-border,
        .shiny-cta-link.static-border {
          --gradient-angle: 0deg;
          --gradient-angle-offset: 0deg;
          --gradient-percent: 30%;
          background:
            linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg))
              padding-box,
            conic-gradient(
                from 0deg,
                transparent 0%,
                var(--shiny-cta-highlight) 15%,
                var(--shiny-cta-highlight-subtle) 30%,
                var(--shiny-cta-highlight) 45%,
                transparent 60%
              )
              border-box;
        }

        .shiny-cta.static-border,
        .shiny-cta.static-border::before,
        .shiny-cta.static-border::after,
        .shiny-cta-link.static-border,
        .shiny-cta-link.static-border::before,
        .shiny-cta-link.static-border::after {
          animation: none !important;
        }

        .shiny-cta.static-border:is(:hover, :focus-visible),
        .shiny-cta-link.static-border:is(:hover, :focus-visible) {
          background:
            linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg))
              padding-box,
            conic-gradient(
                from 0deg,
                transparent 0%,
                var(--shiny-cta-highlight) 20%,
                var(--shiny-cta-highlight-subtle) 40%,
                var(--shiny-cta-highlight) 60%,
                transparent 80%
              )
              border-box;
        }

        .shiny-cta.static-border:is(:hover, :focus-visible) span::before,
        .shiny-cta-link.static-border:is(:hover, :focus-visible) span::before {
          opacity: 0.5;
        }

        /* Анимированный градиентный border (опциональный класс) */
        .shiny-cta.animated-border,
        .shiny-cta-link.animated-border {
          border: var(--shiny-cta-border-width) solid transparent !important;
          background:
            linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg))
              padding-box,
            conic-gradient(
                from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
                transparent,
                var(--shiny-cta-highlight) var(--gradient-percent),
                var(--gradient-shine) calc(var(--gradient-percent) * 2),
                var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
                transparent calc(var(--gradient-percent) * 4)
              )
              border-box;
          transition-property:
            --gradient-angle-offset, --gradient-percent, --gradient-shine, border-color, box-shadow;
        }

        .shiny-cta.animated-border,
        .shiny-cta-link.animated-border {
          animation:
            var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-cta.animated-border:is(:hover, :focus-visible),
        .shiny-cta-link.animated-border:is(:hover, :focus-visible) {
          --gradient-percent: 20%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
          animation-play-state: running;
        }

        .shiny-cta:is(:hover, :focus-visible) span::before,
        .shiny-cta-link:is(:hover, :focus-visible) span::before {
          opacity: 1;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes shimmer {
          to {
            rotate: 360deg;
          }
        }

        @keyframes breathe {
          from,
          to {
            scale: 1;
          }
          50% {
            scale: 1.2;
          }
        }

        /* Light theme overrides - uses theme variables automatically */
        .light .shiny-cta,
        .light .shiny-cta-link {
          --shiny-cta-highlight: #f59e0b;
          --shiny-cta-highlight-subtle: #d97706;
        }

      `}</style>
      {url ? (
        <a href={url} className={cn("shiny-cta-link group", className)}>
          <span className="flex items-center">
            {children}
            <ChevronRight className="ml-1 size-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-1" />
          </span>
        </a>
      ) : (
        <button 
          className={cn("shiny-cta group", className)}
          onClick={onClick}
        >
          <span className="flex items-center">
            {children}
            <ChevronRight className="ml-1 size-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-1" />
          </span>
        </button>
      )}
    </>
  );
}

