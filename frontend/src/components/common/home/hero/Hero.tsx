import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../../../ui/button";
import { Zap, ChevronDown } from "lucide-react";
import Aurora from "../../backgrounds/Aurora";
import { apiClient } from "../../../../api/client";
import { TournamentCardApi } from "../../../tournaments/TournamentCard";
import { useNavigate } from "react-router-dom";
import { HeroBadge } from "./HeroBadge";
import { typography } from "../../../../utils/typography";

interface HeroProps {
  onBrowseTournaments: () => void;
}

interface ApiTournament {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  venue: string | null;
  status: 'upcoming' | 'ongoing' | 'completed';
  format: 'single-elimination' | 'round-robin' | 'group-stage';
  match_format: 'best-of-1' | 'best-of-3' | 'best-of-5';
  max_participants: number;
  current_participants: number;
  participant_count: number;
  description: string;
  organizer_username: string;
  organizer_name: string;
  image_url: string | null;
}

export function Hero({ onBrowseTournaments }: HeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  // Определяем начальное значение темы правильно
  // Темная тема - это когда НЕТ класса 'light' (по умолчанию темная)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true; // Default для SSR
  });
  const [tournaments, setTournaments] = useState<ApiTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTheme = () => {
      // Темная тема - это когда НЕТ класса 'light'
      const isDarkMode = !document.documentElement.classList.contains('light');
      setIsDark(isDarkMode);
    };

    // Проверяем сразу при монтировании
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getTournaments({ 
          limit: 4,
          status: 'upcoming',
          sort: 'date',
          order: 'asc'
        });
        setTournaments(response.tournaments || []);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Позиции для плавающих карточек
  const floatingPositions = [
    { x: 10, y: 20, rotation: -12, scale: 0.6 },
    { x: 75, y: 15, rotation: 8, scale: 0.65 },
    { x: 15, y: 65, rotation: 15, scale: 0.55 },
    { x: 80, y: 58, rotation: -8, scale: 0.6 },
  ];

  const handleTournamentClick = (tournament: ApiTournament) => {
    navigate(`/tournaments/${tournament.id}`);
  };

  return (
    <div className="relative flex justify-center overflow-hidden" style={{ height: '1000px', paddingTop: '180px' }}>
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 bg-background">
        <Aurora 
          key={`aurora-${isDark ? 'dark' : 'light'}`}
          isDarkTheme={isDark}
          amplitude={1.8}
          blend={1.0}
          speed={0.7}
        />
        {/* Градиент затемнения снизу для плавного перехода */}
        <div 
          className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            height: '40%',
            background: isDark 
              ? 'linear-gradient(to bottom, transparent 0%, rgba(10, 22, 40, 0.15) 40%, rgba(10, 22, 40, 0.4) 70%, rgba(10, 22, 40, 0.75) 90%, rgba(10, 22, 40, 1) 100%)'
              : 'linear-gradient(to bottom, transparent 0%, rgba(255, 251, 245, 0.15) 40%, rgba(255, 251, 245, 0.4) 70%, rgba(255, 251, 245, 0.75) 90%, rgba(255, 251, 245, 1) 100%)',
          }}
        />
      </div>

      {/* Floating tournament cards */}
      {!loading && tournaments.slice(0, 4).map((tournament, index) => {
        const position = floatingPositions[index] || floatingPositions[0];
        return (
          <motion.div
            key={tournament.id}
            className="absolute rounded-2xl shadow-2xl overflow-hidden pointer-events-none"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${400 * position.scale}px`,
              height: `${520 * position.scale}px`,
              transform: `rotate(${position.rotation}deg)`,
              zIndex: 1,
              opacity: isDark ? 0.15 : 0.2,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [position.rotation, position.rotation + 5, position.rotation],
              x: mousePosition.x ? (mousePosition.x - window.innerWidth / 2) / (50 - index * 10) : 0,
            }}
            transition={{
              y: { duration: 3 + index, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 4 + index, repeat: Infinity, ease: "easeInOut" },
              x: { duration: 0.3 },
            }}
          >
            <div style={{ 
              transform: `scale(${position.scale})`,
              transformOrigin: 'top left',
              width: '400px',
              height: '520px',
            }}>
              <TournamentCardApi
                tournament={tournament}
                onClick={() => handleTournamentClick(tournament)}
                showDate={false}
                index={index}
                delay={0}
              />
            </div>
          </motion.div>
        );
      })}

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {["COMPETITIVE", "GLOBAL", "RANKED"].map((text, index) => (
              <HeroBadge 
                key={index} 
                text={text} 
                index={index}
                bgColor="bg-primary"
                textColor="text-black"
                fontWeight={500}
              />
            ))}
          </div>

          {/* Title */}
          <h1 
            className="text-foreground mb-6"
            style={typography.heroTitle}
          >
            Join The Ultimate
            <br />
            <span className="bg-clip-text text-transparent">
              Table Tennis League
            </span>
          </h1>

          {/* Gradient line */}
          <motion.div
            className="rounded-full mx-auto mb-8 relative"
            style={{
              height: '10px',
              width: '240px',
              background: isDark 
                ? 'linear-gradient(90deg, #fbbf24 0%, #3b82f6 35%, #ef4444 65%, #dc2626 100%)'
                : 'linear-gradient(90deg, #ea580c 0%, #2563eb 35%, #dc2626 65%, #ef4444 100%)',
              boxShadow: 'none',
              filter: isDark 
                ? 'none'
                : 'none',
              border: 'none',
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '240px', opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          />

          {/* Description */}
          <p 
            className={`mb-12 max-w-2xl mx-auto ${isDark ? 'text-muted-foreground' : ''}`}
            style={{ 
              ...typography.heroDescription,
              ...(isDark ? {} : {
                color: '#1f2937',
              }),
            }}
          >
            Compete with players worldwide in real-time tournaments.
            Track your progress and climb the global rankings.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onBrowseTournaments}
                  size={undefined}
                  className="bg-gradient-to-r from-primary to-yellow-400 text-black hover:shadow-2xl h-14 !px-12 text-lg gap-3 [&:has(>svg)]:!px-12 transition-all duration-200 rounded-xl"
                >
                  <Zap className="w-5 h-5" />
                  Explore Tournaments
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size={undefined}
                  className="border-2 hover:bg-accent backdrop-blur-sm h-14 !px-12 text-lg hover:shadow-2xl transition-all duration-200 rounded-xl"
                  onClick={() => {
                    const element = document.getElementById('how-it-works');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  How It Works
                </Button>
              </motion.div>
            </div>
            
            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

