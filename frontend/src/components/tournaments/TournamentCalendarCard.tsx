import React from 'react';
import { Trophy, Users, Clock } from 'lucide-react';
import { typography } from '@/utils/typography';
import { cn } from '../ui/utils';

export interface TournamentCalendarCardTournament {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  format: 'single-elimination' | 'round-robin' | 'group-stage';
  match_format: 'best-of-1' | 'best-of-3' | 'best-of-5';
  max_participants: number;
  current_participants: number;
  description: string;
  organizer_username: string;
  organizer_name: string;
  participant_count: number;
  image_url?: string | null;
  _isAppearing?: boolean;
  _isDisappearing?: boolean;
}

export interface TournamentCalendarCardProps {
  tournament?: TournamentCalendarCardTournament;
  tournaments?: TournamentCalendarCardTournament[];
  isLightTheme: boolean;
  onClick?: (tournament: TournamentCalendarCardTournament) => void;
}

export function TournamentCalendarCard({ tournament, tournaments, isLightTheme, onClick }: TournamentCalendarCardProps) {
  // Если передан массив турниров и их больше одного, показываем MultiCard вид
  if (tournaments && tournaments.length > 1) {
    const hasAppearing = tournaments.some(t => t._isAppearing ?? false);
    const hasDisappearing = tournaments.some(t => t._isDisappearing ?? false);
    const isAnimating = hasAppearing || hasDisappearing;

    const statuses: string[] = Array.from(new Set(tournaments.map(t => t.status))).sort((a, b) => {
      const order: Record<string, number> = { upcoming: 1, ongoing: 2, completed: 3 };
      return (order[a] ?? 9) - (order[b] ?? 9);
    });

    // Динамический градиент в зависимости от статусов
    const getGradientColors = () => {
      const hasUpcoming = statuses.includes('upcoming');
      const hasOngoing = statuses.includes('ongoing');
      const hasCompleted = statuses.includes('completed');
      
      // Если только один статус
      if (statuses.length === 1) {
        if (hasUpcoming) {
          return isLightTheme
            ? { gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(79, 70, 229) 50%, rgb(147, 51, 234) 100%)', border: 'rgb(147, 51, 234)', shadowHover: 'rgba(147, 51, 234, 0.65)' }
            : { gradient: 'linear-gradient(135deg, rgb(30, 64, 175) 0%, rgb(67, 56, 202) 50%, rgb(107, 33, 168) 100%)', border: 'rgb(107, 33, 168)', shadowHover: 'rgba(107, 33, 168, 0.9)' };
        } else if (hasOngoing) {
          return isLightTheme
            ? { gradient: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(16, 185, 129) 50%, rgb(20, 184, 166) 100%)', border: 'rgb(20, 184, 166)', shadowHover: 'rgba(20, 184, 166, 0.65)' }
            : { gradient: 'linear-gradient(135deg, rgb(21, 128, 61) 0%, rgb(15, 118, 110) 50%, rgb(13, 148, 136) 100%)', border: 'rgb(13, 148, 136)', shadowHover: 'rgba(13, 148, 136, 0.9)' };
        } else if (hasCompleted) {
          return isLightTheme
            ? { gradient: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(244, 63, 94) 50%, rgb(249, 115, 22) 100%)', border: 'rgb(249, 115, 22)', shadowHover: 'rgba(249, 115, 22, 0.65)' }
            : { gradient: 'linear-gradient(135deg, rgb(185, 28, 28) 0%, rgb(190, 24, 93) 50%, rgb(194, 65, 12) 100%)', border: 'rgb(194, 65, 12)', shadowHover: 'rgba(194, 65, 12, 0.9)' };
        }
      }
      
      // Если два статуса
      if (statuses.length === 2) {
        if (hasUpcoming && hasOngoing) {
          return isLightTheme
            ? { gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(59, 130, 246) 30%, rgb(20, 184, 166) 50%, rgb(34, 197, 94) 70%, rgb(34, 197, 94) 100%)', border: 'rgb(20, 184, 166)', shadowHover: 'rgba(20, 184, 166, 0.65)' }
            : { gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(59, 130, 246) 30%, rgb(20, 184, 166) 50%, rgb(34, 197, 94) 70%, rgb(34, 197, 94) 100%)', border: 'rgb(20, 184, 166)', shadowHover: 'rgba(20, 184, 166, 0.9)' };
        } else if (hasUpcoming && hasCompleted) {
          return isLightTheme
            ? { gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(59, 130, 246) 30%, rgb(147, 51, 234) 50%, rgb(239, 68, 68) 70%, rgb(239, 68, 68) 100%)', border: 'rgb(147, 51, 234)', shadowHover: 'rgba(147, 51, 234, 0.65)' }
            : { gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(59, 130, 246) 30%, rgb(107, 33, 168) 50%, rgb(185, 28, 28) 70%, rgb(185, 28, 28) 100%)', border: 'rgb(107, 33, 168)', shadowHover: 'rgba(107, 33, 168, 0.9)' };
        } else if (hasOngoing && hasCompleted) {
          return isLightTheme
            ? { gradient: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(34, 197, 94) 30%, rgb(234, 179, 8) 50%, rgb(239, 68, 68) 70%, rgb(239, 68, 68) 100%)', border: 'rgb(234, 179, 8)', shadowHover: 'rgba(234, 179, 8, 0.65)' }
            : { gradient: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(34, 197, 94) 30%, rgb(234, 179, 8) 50%, rgb(239, 68, 68) 70%, rgb(239, 68, 68) 100%)', border: 'rgb(234, 179, 8)', shadowHover: 'rgba(234, 179, 8, 0.9)' };
        }
      }
      
      // Если все три статуса
      if (statuses.length === 3) {
        return isLightTheme
          ? { gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(59, 130, 246) 23%, rgb(20, 184, 166) 33%, rgb(34, 197, 94) 43%, rgb(34, 197, 94) 56%, rgb(234, 179, 8) 66%, rgb(239, 68, 68) 76%, rgb(239, 68, 68) 100%)', border: 'rgb(234, 179, 8)', shadowHover: 'rgba(234, 179, 8, 0.65)' }
          : { gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(59, 130, 246) 23%, rgb(20, 184, 166) 33%, rgb(34, 197, 94) 43%, rgb(34, 197, 94) 56%, rgb(234, 179, 8) 66%, rgb(239, 68, 68) 76%, rgb(239, 68, 68) 100%)', border: 'rgb(234, 179, 8)', shadowHover: 'rgba(234, 179, 8, 0.9)' };
      }
      
      // Fallback
      return isLightTheme
        ? { gradient: 'linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(99, 102, 241) 100%)', border: 'rgba(255, 255, 255, 0.5)', shadowHover: 'rgba(126, 34, 206, 0.65)' }
        : { gradient: 'linear-gradient(135deg, rgb(107, 33, 168) 0%, rgb(67, 56, 202) 100%)', border: 'rgb(107, 33, 168)', shadowHover: 'rgba(67, 56, 202, 0.9)' };
    };

    const colors = getGradientColors();

    return (
      <div
        className="w-full h-full p-3 rounded-xl cursor-pointer text-white relative flex flex-col justify-center items-center"
        style={{
          background: colors.gradient,
          backgroundColor: colors.border,
          border: `3px solid ${colors.border}`,
          boxSizing: 'border-box',
          animationName: hasDisappearing ? 'disappear' : hasAppearing ? 'appear' : 'none',
          animationDuration: hasDisappearing ? '0.25s' : hasAppearing ? '0.4s' : '0s',
          animationTimingFunction: hasDisappearing ? 'ease-in' : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          animationFillMode: isAnimating ? 'both' : 'forwards',
          animationIterationCount: 1,
          boxShadow: 'none',
          transformOrigin: 'center',
          willChange: isAnimating ? 'transform, opacity, filter' : 'auto',
          zIndex: 100,
          isolation: 'isolate',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = isLightTheme 
            ? `0 4px 12px ${colors.shadowHover}` 
            : `0 3px 10px ${colors.shadowHover}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
        onClick={() => onClick?.(tournaments[0])}
        title={`${tournaments.length} tournaments on this date - Click to see all`}
      >
        <div className="space-y-1.5">
          {statuses.map((status: string) => {
            const count = tournaments.filter(t => t.status === status).length;
            const statusLabel = status === 'ongoing' ? 'Ongoing' : status.charAt(0).toUpperCase() + status.slice(1);
            return (
              <div key={status} className="flex items-center justify-center gap-2">
                <div
                  title={`${count} ${statusLabel} tournament${count > 1 ? 's' : ''}`}
                  className={`
                    w-2.5 h-2.5 rounded-full shadow-lg
                    ${status === 'upcoming' ? 'bg-blue-400' : ''}
                    ${status === 'ongoing' ? 'bg-green-400' : ''}
                    ${status === 'completed' ? 'bg-red-400' : ''}
                  `}
                  style={{
                    boxShadow: status === 'upcoming' ? '0 0 8px rgba(96, 165, 250, 0.8)' : 
                               status === 'ongoing' ? '0 0 8px rgba(74, 222, 128, 0.8)' :
                               '0 0 8px rgba(248, 113, 113, 0.8)'
                  }}
                />
                <span className="text-white text-sm font-semibold drop-shadow-lg">
                  {count} {statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Одиночный турнир (оригинальная логика)
  if (!tournament) return null;

  const isAppearing = tournament._isAppearing ?? false;
  const isDisappearing = tournament._isDisappearing ?? false;
  const isAnimating = isAppearing || isDisappearing;
  
  const statusColor = {
    upcoming: 'bg-blue-600 hover:bg-blue-700',
    ongoing: 'bg-green-600 hover:bg-green-700',
    completed: 'bg-red-600 hover:bg-red-700',
  }[tournament.status] ?? 'bg-gray-500';

  // Цвета теней под цвет статуса - увеличенная яркость для соответствия мультикарточкам
  const shadowColor = {
    upcoming: { 
      light: 'rgba(37, 99, 235, 0.25)', 
      lightHover: 'rgba(37, 99, 235, 0.65)', 
      dark: 'rgba(37, 99, 235, 0.8)', 
      darkHover: 'rgba(37, 99, 235, 0.9)' 
    },
    ongoing: { 
      light: 'rgba(22, 163, 74, 0.25)', 
      lightHover: 'rgba(22, 163, 74, 0.65)', 
      dark: 'rgba(22, 163, 74, 0.8)', 
      darkHover: 'rgba(22, 163, 74, 0.9)' 
    },
    completed: { 
      light: 'rgba(220, 38, 38, 0.25)', 
      lightHover: 'rgba(220, 38, 38, 0.65)', 
      dark: 'rgba(220, 38, 38, 0.8)', 
      darkHover: 'rgba(220, 38, 38, 0.9)' 
    },
  }[tournament.status] ?? { 
    light: 'rgba(107, 114, 128, 0.25)', 
    lightHover: 'rgba(107, 114, 128, 0.65)', 
    dark: 'rgba(107, 114, 128, 0.8)', 
    darkHover: 'rgba(107, 114, 128, 0.9)' 
  };

  return (
    <div
      className={`w-full h-full p-2 rounded-xl text-white flex flex-col justify-between cursor-pointer ${statusColor} hover:border-white/70`}
      style={{
        border: '3px solid rgba(255, 255, 255, 0.3)',
        animationName: isDisappearing ? 'disappear' : isAppearing ? 'appear' : 'none',
        animationDuration: isDisappearing ? '0.25s' : isAppearing ? '0.4s' : '0s',
        animationTimingFunction: isDisappearing ? 'ease-in' : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        animationFillMode: isAnimating ? 'both' : 'forwards',
        animationIterationCount: 1,
        boxShadow: 'none',
        transformOrigin: 'center',
        willChange: isAnimating ? 'transform, opacity, filter' : 'auto',
        transition: 'border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isLightTheme 
          ? `0 4px 12px ${shadowColor.lightHover}` 
          : `0 3px 10px ${shadowColor.darkHover}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={() => onClick?.(tournament)}
      title={`${tournament.name} - ${tournament.time} - ${tournament.participant_count || tournament.current_participants || 0}/${tournament.max_participants}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-3 h-3 flex-shrink-0" />
        <span className={typography.tournamentCalendarCardTitle}>{tournament.name}</span>
      </div>
      <div className="space-y-1">
        <div className={cn("flex items-center gap-2", typography.tournamentCalendarCardInfo)}>
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{tournament.time}</span>
        </div>
        <div className={cn("flex items-center gap-2", typography.tournamentCalendarCardInfo)}>
          <Users className="w-3 h-3 flex-shrink-0" />
          <span>{tournament.participant_count || tournament.current_participants || 0}/${tournament.max_participants}</span>
        </div>
      </div>
    </div>
  );
}

