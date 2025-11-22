import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Calendar, MapPin, Users as UsersIcon, Clock, Play, CheckCircle, Trophy } from "lucide-react";
import { apiClient } from "../../../api/client";
import { ImageWithFallback } from "../image/ImageWithFallback";
import { TournamentCardApi } from "../../tournaments/TournamentCard";
import { SportBackground } from "../backgrounds/sport-background/SportBackground";
import { typography } from "../../../utils/typography";
import { cn } from "../../ui/utils";

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

interface FeaturedTournamentsSectionProps {
  onBrowseTournaments: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming':
      return <Badge className="bg-blue-500 text-white border-0 shadow-lg hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" />Upcoming</Badge>;
    case 'ongoing':
      return <Badge className="bg-green-500 text-white border-0 shadow-lg hover:bg-green-600"><Play className="w-3 h-3 mr-1" />Ongoing</Badge>;
    case 'completed':
      return <Badge className="bg-red-500 text-white border-0 shadow-lg hover:bg-red-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getFormatBadge = (format: string) => {
  switch (format) {
    case 'single-elimination':
      return <Badge className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/60 shadow-lg hover:bg-white/30">Single Elimination</Badge>;
    case 'round-robin':
      return <Badge className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/60 shadow-lg hover:bg-white/30">Round Robin</Badge>;
    case 'group-stage':
      return <Badge className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/60 shadow-lg hover:bg-white/30">Group Stage</Badge>;
    default:
      return <Badge variant="secondary">{format}</Badge>;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeString: string) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getTournamentImage = (tournament: ApiTournament) => {
  if (tournament.image_url && tournament.image_url.trim() !== '' && 
      tournament.image_url !== 'null' && tournament.image_url !== 'undefined') {
    if (tournament.image_url.startsWith('/')) {
      return tournament.image_url;
    }
    if (tournament.image_url.startsWith('http')) {
      return tournament.image_url;
    }
    return tournament.image_url;
  }
  return '';
};

const TournamentImage = ({ tournament }: { tournament: ApiTournament }) => {
  const imageSrc = getTournamentImage(tournament);
  const hasImage = imageSrc && imageSrc.trim() !== '';
  
  return (
    <div className={`relative h-48 overflow-hidden rounded-t-xl ${hasImage ? 'bg-black' : ''}`}>
      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
        <ImageWithFallback
          src={imageSrc}
          alt={tournament.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          data-tournament-id={tournament.id}
        />
      </div>
      
      {/* Floating Status Badge */}
      <div className="absolute top-3 left-3" style={{ zIndex: 3 }}>
        {getStatusBadge(tournament.status)}
      </div>
      
      {/* Format Badge */}
      <div className="absolute top-3 right-3" style={{ zIndex: 3 }}>
        {getFormatBadge(tournament.format)}
      </div>
      
      {/* Title Overlay at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4" style={{ zIndex: 3 }}>
        <h3 className="text-white font-bold text-xl line-clamp-2 drop-shadow-lg">
          {tournament.name}
        </h3>
      </div>
    </div>
  );
};

export function FeaturedTournamentsSection({ onBrowseTournaments }: FeaturedTournamentsSectionProps) {
  const navigate = useNavigate();
  const [featuredTournaments, setFeaturedTournaments] = useState<ApiTournament[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  // Отслеживаем изменения темы
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = !document.documentElement.classList.contains('light');
      setIsDark(isDarkMode);
    };

    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  // Загружаем реальные турниры
  useEffect(() => {
    const loadFeaturedTournaments = async () => {
      try {
        setIsLoadingFeatured(true);
        const response = await apiClient.getTournaments({ 
          status: 'upcoming',
          limit: '3',
          page: '1'
        });
        
        if (response && response.tournaments && Array.isArray(response.tournaments)) {
          setFeaturedTournaments(response.tournaments.slice(0, 3));
        }
      } catch (error) {
        console.error('Error loading featured tournaments:', error);
        setFeaturedTournaments([]);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    loadFeaturedTournaments();
  }, []);

  // Цвет фона секции в зависимости от темы
  const sectionBgColor = isDark ? '#0a1628' : '#fffbf5';

  return (
    <div 
      className="py-20 relative overflow-hidden"
      style={{ backgroundColor: sectionBgColor }}
    >
      {/* SportBackground with Particles */}
      <SportBackground variant="featured" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 
            className={cn(
              typography.sectionTitleTournament,
              typography.spacing.titleMargin,
              "text-foreground"
            )}
            style={typography.sectionTitleTournamentStyle}
          >
            Featured Tournaments
          </h2>
          <p 
            className={cn(typography.subtitle, "max-w-2xl mx-auto")}
          >
            Check out our most popular upcoming tournaments from around the world
          </p>
        </div>
        {isLoadingFeatured ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden shadow-sm border border-border bg-card rounded-xl">
                <div className="h-48 bg-muted animate-pulse" />
                <CardContent className="pt-4 px-6 pb-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : featuredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTournaments.map((tournament, index) => (
              <TournamentCardApi
                key={tournament.id}
                tournament={tournament}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div 
            className="text-center py-12"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.3s forwards',
              opacity: 0,
            }}
          >
            <p className="text-muted-foreground text-lg">No upcoming tournaments available at the moment.</p>
          </div>
        )}
        <div 
          className="text-center"
          style={{
            marginTop: '2.5rem', // 40px - комфортный отступ между карточками и кнопкой
            animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
            opacity: 0,
          }}
        >
          <Button
            size="lg"
            onClick={onBrowseTournaments}
            variant="outline"
            className="bg-transparent hover:bg-primary/10 text-primary hover:text-primary border-2 border-primary/50 hover:border-primary text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            View All Tournaments
          </Button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

