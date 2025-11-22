import React, { useState, useEffect, useRef } from "react";
import { Trophy, Award, TrendingUp, FileText, LucideIcon } from "lucide-react";
import { typography } from "../../../../utils/typography";
import { cn } from "../../../ui/utils";
import { ElevateFeatureCard } from "./ElevateFeatureCard";
import { ElevateCube } from "./shapes/ElevateCube";
import { ElevateDiamond } from "./shapes/ElevateDiamond";
import { ElevateTriangle } from "./shapes/ElevateTriangle";
import { ElevateStar } from "./shapes/ElevateStar";
import { ElevateOrb } from "./shapes/ElevateOrb";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  gradientDark: string;
  position: { x: string; y: string; rotate: number };
  frostClass: string;
  orbClass: string;
  orbPosition: string;
}

interface ElevateYourGameSectionProps {
  // Можно добавить пропсы если нужно
}

export function ElevateYourGameSection({}: ElevateYourGameSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const elevateSectionRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePos({ x: x * 15, y: y * 15 });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Intersection Observer для карточек
  useEffect(() => {
    if (!elevateSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = parseInt(entry.target.getAttribute('data-card-index') || '0');
            setVisibleCards((prev) => new Set([...prev, cardIndex]));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    const cards = elevateSectionRef.current.querySelectorAll('[data-card-index]');
    cards.forEach((card) => observer.observe(card));

    return () => {
      cards.forEach((card) => observer.unobserve(card));
    };
  }, []);

  // Проверяем тему
  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setIsDarkTheme(!isLight);
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const features: Feature[] = [
    {
      icon: Trophy,
      title: "Live Brackets",
      description: "Follow tournament progress in real-time with interactive brackets and live updates",
      gradient: "from-blue-600 to-teal-400",
      gradientDark: "from-blue-700 to-teal-500",
      position: { x: "-10%", y: "10%", rotate: -5 },
      frostClass: "frost-blue",
      orbClass: "bg-blue-500",
      orbPosition: "top-1/4 left-1/4",
    },
    {
      icon: Award,
      title: "Achievements",
      description: "Unlock unique achievements and showcase your progress with badges and rewards",
      gradient: "from-purple-500 to-pink-500",
      gradientDark: "from-purple-600 to-pink-600",
      position: { x: "10%", y: "-5%", rotate: 5 },
      frostClass: "frost-purple",
      orbClass: "bg-purple-500",
      orbPosition: "top-1/3 right-1/4",
    },
    {
      icon: TrendingUp,
      title: "Rankings",
      description: "Track your progress on global leaderboards and see how you rank against others",
      gradient: "from-green-500 to-emerald-400",
      gradientDark: "from-green-600 to-emerald-500",
      position: { x: "-5%", y: "-15%", rotate: -3 },
      frostClass: "frost-green",
      orbClass: "bg-green-500",
      orbPosition: "bottom-1/4 left-1/3",
    },
    {
      icon: FileText,
      title: "Certificates",
      description: "Receive official tournament certificates for your participation and achievements",
      gradient: "from-orange-500 to-amber-400",
      gradientDark: "from-orange-600 to-amber-500",
      position: { x: "5%", y: "15%", rotate: 3 },
      frostClass: "frost-orange",
      orbClass: "bg-orange-500",
      orbPosition: "bottom-1/3 right-1/3",
    },
  ];

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-screen bg-gradient-to-br from-background via-muted/30 to-background" style={{ minHeight: '100vh', paddingTop: '6rem', paddingBottom: '5rem' }}>
      {/* Modern Animated Background with 3D Objects */}
      <div className="absolute inset-0 z-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)]" />
        
        {/* Animated Grid - вертикальные линии с плавным затуханием сверху и снизу */}
        <div className="absolute inset-0" style={{ 
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.5) 22%, rgba(0,0,0,0.7) 28%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.95) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.95) 65%, rgba(0,0,0,0.85) 72%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.3) 92%, rgba(0,0,0,0.1) 98%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.5) 22%, rgba(0,0,0,0.7) 28%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.95) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.95) 65%, rgba(0,0,0,0.85) 72%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.3) 92%, rgba(0,0,0,0.1) 98%, transparent 100%)',
          zIndex: 1,
        }}>
          <div className="absolute inset-0 opacity-50" style={{
            backgroundImage: 'linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1.5px, transparent 1.5px)',
            backgroundSize: '80px 80px'
          }} />
        </div>
        
        {/* Горизонтальные линии с плавным затуханием сверху и снизу */}
        <div className="absolute inset-0" style={{ 
          overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.5) 22%, rgba(0,0,0,0.7) 28%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.95) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.95) 65%, rgba(0,0,0,0.85) 72%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.3) 92%, rgba(0,0,0,0.1) 98%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 8%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.5) 22%, rgba(0,0,0,0.7) 28%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.95) 42%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.95) 65%, rgba(0,0,0,0.85) 72%, rgba(0,0,0,0.7) 78%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.3) 92%, rgba(0,0,0,0.1) 98%, transparent 100%)',
          zIndex: 1,
        }}>
          <div className="absolute inset-0 opacity-50" style={{
            backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.4) 1.5px, transparent 1.5px)',
            backgroundSize: '80px 80px',
            top: '40px',
            bottom: '0'
          }} />
        </div>

        {/* 3D Geometric Objects - перекрывают линии сетки */}
        <div className="absolute inset-0" style={{ zIndex: 10 }}>
          <ElevateCube 
            className="top-[45%] left-[10%]" 
            animationDelay="0s"
          />
          
          <ElevateDiamond 
            className="top-[60%] right-[10%]" 
            animationDelay="1s"
          />
          
          <ElevateTriangle 
            className="right-[25%]" 
            style={{ top: 'calc(22% - 5px)' }}
            animationDelay="0.5s"
          />
          
          <ElevateStar 
            className="bottom-[12%] left-[20%]" 
            animationDelay="2s"
          />
          
          <ElevateOrb 
            className="top-[68%] left-[8%]" 
            animationDelay="0.3s"
            size={50}
            color={{
              gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), transparent)',
              border: 'rgba(59, 130, 246, 0.4)',
            }}
          />
          
          <ElevateOrb 
            className="top-[18%] right-[8%]" 
            animationDelay="1.5s"
            size={60}
            color={{
              gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), transparent)',
              border: 'rgba(147, 51, 234, 0.4)',
            }}
          />
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float-slow-delayed" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl animate-float-medium" />
      </div>
    
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 
            className={cn(
              typography.sectionTitleTournament,
              typography.spacing.titleMargin,
              "text-primary"
            )}
            style={typography.sectionTitleTournamentStyle}
          >
            Elevate Your Game
          </h2>
          <p 
            className={cn(typography.subtitle, "max-w-2xl mx-auto")}
          >
            Experience tournament management reimagined with cutting-edge tools designed for champions
          </p>
        </div>

        {/* Feature Cards Layout */}
        <div ref={elevateSectionRef} className="relative" style={{ height: 'min(1100px, 70vh)' }}>
          {features.map((feature, index) => (
            <ElevateFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              gradientDark={feature.gradientDark}
              frostClass={feature.frostClass}
              index={index}
              isVisible={visibleCards.has(index)}
              mousePos={mousePos}
            />
          ))}
        </div>
      </div>

      {/* Custom Animations Styles */}
      <ElevateSectionStyles />
    </section>
  );
}

// Выносим стили в отдельный компонент
function ElevateSectionStyles() {
  return (
    <style>{`
      :not(.dark) .opacity-18 { opacity: 0.7 !important; }
      :not(.dark) .opacity-17 { opacity: 0.7 !important; }
      :not(.dark) .opacity-16 { opacity: 0.65 !important; }
      :not(.dark) .opacity-15 { opacity: 0.6 !important; }
      :not(.dark) .opacity-14 { opacity: 0.55 !important; }
      :not(.dark) .opacity-13 { opacity: 0.5 !important; }
      :not(.dark) .opacity-12 { opacity: 0.45 !important; }
      
      @keyframes gridPulse {
        0%, 100% { opacity: 0.35; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.02); }
      }
      @keyframes float-slow {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(30px, -30px); }
      }
      @keyframes float-slow-delayed {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(-30px, 30px); }
      }
      @keyframes float-medium {
        0%, 100% { transform: translate(-50%, -50%); }
        33% { transform: translate(calc(-50% + 20px), calc(-50% - 20px)); }
        66% { transform: translate(calc(-50% - 20px), calc(-50% + 20px)); }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes flicker {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1.0; }
      }
      @keyframes cardFloat {
        0%, 100% { 
          transform: translateY(0) translateX(0) rotate(0deg);
        }
        25% { 
          transform: translateY(-15px) translateX(8px) rotate(1deg);
        }
        50% { 
          transform: translateY(-8px) translateX(-5px) rotate(-0.5deg);
        }
        75% { 
          transform: translateY(-12px) translateX(10px) rotate(0.8deg);
        }
      }
      
      @keyframes rotate3d {
        0% { 
          transform: perspective(1000px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
        }
        33% { 
          transform: perspective(1000px) rotateX(15deg) rotateY(180deg) rotateZ(5deg);
        }
        66% { 
          transform: perspective(1000px) rotateX(-10deg) rotateY(270deg) rotateZ(-5deg);
        }
        100% { 
          transform: perspective(1000px) rotateX(0deg) rotateY(360deg) rotateZ(0deg);
        }
      }
      
      @keyframes spin3d {
        0% { 
          transform: perspective(1000px) rotateY(0deg) rotateX(45deg) translateZ(0);
        }
        50% { 
          transform: perspective(1000px) rotateY(180deg) rotateX(45deg) translateZ(30px);
        }
        100% { 
          transform: perspective(1000px) rotateY(360deg) rotateX(45deg) translateZ(0);
        }
      }
      
      @keyframes float3d {
        0%, 100% { 
          transform: perspective(1000px) translateY(0) translateZ(0) rotateZ(0deg);
        }
        25% { 
          transform: perspective(1000px) translateY(-30px) translateZ(20px) rotateZ(10deg);
        }
        50% { 
          transform: perspective(1000px) translateY(-15px) translateZ(40px) rotateZ(-5deg);
        }
        75% { 
          transform: perspective(1000px) translateY(-25px) translateZ(20px) rotateZ(15deg);
        }
      }
      
      @keyframes pulse3d {
        0%, 100% { 
          transform: perspective(1000px) scale(1) rotateZ(0deg);
          opacity: 0.6;
        }
        50% { 
          transform: perspective(1000px) scale(1.2) rotateZ(180deg);
          opacity: 0.9;
        }
      }
      
      @keyframes orbit3d {
        0% { 
          transform: perspective(1000px) rotate(0deg) translateX(0) translateY(0);
        }
        25% { 
          transform: perspective(1000px) rotate(90deg) translateX(30px) translateY(-20px);
        }
        50% { 
          transform: perspective(1000px) rotate(180deg) translateX(0) translateY(0);
        }
        75% { 
          transform: perspective(1000px) rotate(270deg) translateX(-30px) translateY(20px);
        }
        100% { 
          transform: perspective(1000px) rotate(360deg) translateX(0) translateY(0);
        }
      }
      
      @keyframes star-rotate {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.1); }
        100% { transform: rotate(360deg) scale(1); }
      }
      
      .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
      .animate-float-slow-delayed { animation: float-slow-delayed 25s ease-in-out infinite; }
      .animate-float-medium { animation: float-medium 15s ease-in-out infinite; }
      .animate-flicker { animation: flicker 2s ease-in-out infinite; }
      .animate-card-float { 
        animation-fill-mode: forwards;
      }
      .animate-card-float:hover {
        animation-play-state: paused;
      }
      
      .animate-3d-rotate { animation: rotate3d 12s ease-in-out infinite; }
      .animate-3d-spin { animation: spin3d 15s linear infinite; }
      .animate-3d-float { animation: float3d 10s ease-in-out infinite; }
      .animate-3d-pulse { animation: pulse3d 8s ease-in-out infinite; }
      .animate-3d-orbit { animation: orbit3d 14s ease-in-out infinite; }
      .animate-star-rotate { animation: star-rotate 20s linear infinite; }
      
      .shape-3d-cube,
      .shape-3d-diamond,
      .shape-3d-triangle,
      .shape-3d-star {
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.15) !important;
        border: 1px solid rgba(255, 255, 255, 0.25) !important;
        backdrop-filter: blur(40px) !important;
        -webkit-backdrop-filter: blur(40px) !important;
      }
      
      .dark .glass-card {
        background: rgba(0, 0, 0, 0.25) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        backdrop-filter: blur(40px) !important;
        -webkit-backdrop-filter: blur(40px) !important;
      }
      
      .frost-blue,
      .glass-card.frost-blue {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.12)) !important;
        border: 1px solid rgba(59, 130, 246, 0.35) !important;
        backdrop-filter: blur(40px) !important;
        -webkit-backdrop-filter: blur(40px) !important;
      }
      
      .frost-purple,
      .glass-card.frost-purple {
        background: linear-gradient(135deg, rgba(147, 51, 234, 0.2), rgba(196, 181, 253, 0.12)) !important;
        border: 1px solid rgba(147, 51, 234, 0.35) !important;
        backdrop-filter: blur(40px) !important;
        -webkit-backdrop-filter: blur(40px) !important;
      }
      
      .frost-green,
      .glass-card.frost-green {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(134, 239, 172, 0.12)) !important;
        border: 1px solid rgba(34, 197, 94, 0.35) !important;
        backdrop-filter: blur(40px) !important;
        -webkit-backdrop-filter: blur(40px) !important;
      }
      
      .frost-orange,
      .glass-card.frost-orange {
        background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.12)) !important;
        border: 1px solid rgba(249, 115, 22, 0.35) !important;
        backdrop-filter: blur(40px) !important;
        -webkit-backdrop-filter: blur(40px) !important;
      }
      
      .transition-expo {
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .transform-gpu {
        transform: translateZ(0);
        will-change: transform;
      }
    `}</style>
  );
}

