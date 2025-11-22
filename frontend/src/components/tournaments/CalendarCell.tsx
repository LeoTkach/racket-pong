import React from 'react';
import { format } from 'date-fns';
import { Ghost } from 'lucide-react';
import { TournamentCalendarCard, TournamentCalendarCardTournament } from './TournamentCalendarCard';

export interface CalendarCellTournament extends TournamentCalendarCardTournament {}

interface CalendarCellProps {
  day: Date;
  tournaments: CalendarCellTournament[];
  isLightTheme: boolean;
  isCurrent: boolean;
  isTodayDate: boolean;
  isPastDate: boolean;
  onTournamentClick?: (tournament: CalendarCellTournament) => void;
}

export function CalendarCell({
  day,
  tournaments,
  isLightTheme,
  isCurrent,
  isTodayDate,
  isPastDate,
  onTournamentClick,
}: CalendarCellProps) {
  return (
    <div
      className={`
        p-2 rounded-lg border-2 flex flex-col relative cell-color-transition
        ${isTodayDate ? '' : 'border-border'}
      `}
      onMouseEnter={(e) => {
        if (isTodayDate) {
          e.currentTarget.style.borderColor = isLightTheme 
            ? 'rgba(59, 130, 246, 0.8)' 
            : 'rgba(234, 179, 8, 0.7)';
        } else if (isCurrent) {
          e.currentTarget.style.borderColor = isLightTheme 
            ? 'rgba(59, 130, 246, 0.6)' 
            : 'rgba(234, 179, 8, 0.7)';
        }
      }}
      onMouseLeave={(e) => {
        if (isTodayDate) {
          e.currentTarget.style.borderColor = isLightTheme 
            ? 'rgba(34, 197, 94, 0.7)' 
            : 'rgba(34, 197, 94, 0.6)';
        } else if (isCurrent) {
          e.currentTarget.style.borderColor = '';
        }
      }}
      style={{
        height: '140px',
        minHeight: '140px',
        background: !isCurrent 
          ? (isLightTheme 
              ? 'rgba(245, 238, 220, 0.5)' 
              : 'rgba(26, 45, 71, 0.25)')
          : isTodayDate 
            ? (isLightTheme 
                ? 'rgba(34, 197, 94, 0.12)' 
                : 'rgba(34, 197, 94, 0.15)')
            : (isLightTheme 
                ? 'rgba(255, 255, 255, 0.5)' 
                : 'rgba(15, 23, 42, 0.4)'),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: 'none',
        position: 'relative',
        zIndex: 60,
        overflow: 'visible',
        transition: 'background 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        ...(isTodayDate && {
          borderColor: isLightTheme 
            ? 'rgba(34, 197, 94, 0.7)' 
            : 'rgba(34, 197, 94, 0.6)',
        }),
      }}
    >
      {/* Дополнительный слой фона для полной непрозрачности */}
      <div 
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          background: !isCurrent 
            ? (isLightTheme 
                ? 'rgba(245, 238, 220, 0.35)' 
                : 'rgba(26, 45, 71, 0.12)')
            : isTodayDate 
              ? (isLightTheme 
                  ? 'rgba(34, 197, 94, 0.06)' 
                  : 'rgba(34, 197, 94, 0.08)')
              : (isLightTheme 
                  ? 'rgba(255, 255, 255, 0.3)' 
                  : 'rgba(15, 23, 42, 0.2)'),
          zIndex: -1,
          transition: 'background 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />
      
      {/* Day + Count */}
      <div className="flex justify-between mb-2 relative" style={{ zIndex: 70 }}>
        <div 
          className={`text-sm font-bold ${
            isTodayDate 
              ? '' 
              : isPastDate 
                ? 'text-muted-foreground' 
                : 'text-foreground'
          }`}
          style={{
            ...(isTodayDate && {
              color: isLightTheme ? 'rgb(22, 163, 74)' : 'rgb(74, 222, 128)'
            })
          }}
        >
          {format(day, 'd')}
        </div>
        {tournaments.length > 0 && (
          <div
            className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold"
            style={{
              animationName: tournaments.some(t => t._isDisappearing)
                ? 'disappear'
                : tournaments.some(t => t._isAppearing)
                  ? 'appear'
                  : 'none',
              animationDuration: tournaments.some(t => t._isAppearing || t._isDisappearing) ? '0.2s' : '0s',
              animationTimingFunction: tournaments.some(t => t._isDisappearing) ? 'ease-in' : 'ease-out',
              animationFillMode: 'forwards',
              animationIterationCount: 1,
              transformOrigin: 'center',
            }}
          >
            {tournaments.length}
          </div>
        )}
      </div>

      {/* Ghost - абсолютно позиционирован относительно всей ячейки */}
      {tournaments.length === 0 && (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isTodayDate 
            ? (isLightTheme ? 'bg-green-500/20' : 'bg-green-500/15')
            : (isLightTheme ? 'bg-muted/40' : 'bg-muted/25')
        }`} style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 70,
          opacity: isTodayDate ? (isLightTheme ? 0.6 : 0.5) : (isLightTheme ? 0.7 : 0.6),
          border: isTodayDate 
            ? (isLightTheme 
                ? '2px solid rgba(148, 163, 184, 0.5)' 
                : '2px solid rgba(148, 163, 184, 0.4)') 
            : (isLightTheme
                ? '2px solid rgba(148, 163, 184, 0.4)'
                : '2px solid rgba(148, 163, 184, 0.3)'),
        }}>
          <Ghost className="w-6 h-6" style={{
            color: isTodayDate 
              ? (isLightTheme 
                  ? 'rgba(148, 163, 184, 0.6)' 
                  : 'rgba(148, 163, 184, 0.5)')
              : isLightTheme
                ? 'rgba(148, 163, 184, 0.5)' 
                : 'rgba(148, 163, 184, 0.4)' 
          }} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-visible relative" style={{ zIndex: 70 }}>
        {tournaments.length === 0 ? null : tournaments.length === 1 ? (
          <TournamentCalendarCard
            tournament={tournaments[0]}
            isLightTheme={isLightTheme}
            onClick={() => onTournamentClick?.(tournaments[0])}
          />
        ) : (
          <TournamentCalendarCard
            tournaments={tournaments}
            isLightTheme={isLightTheme}
            onClick={() => {
              // При клике на мультикарточку вызываем обработчик с первым турниром
              // Родительский компонент получит все турниры на эту дату
              onTournamentClick?.(tournaments[0]);
            }}
          />
        )}
      </div>
    </div>
  );
}

