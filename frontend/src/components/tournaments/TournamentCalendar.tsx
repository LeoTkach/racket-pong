import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'; // <-- Добавьте useRef
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isToday, isPast, isFuture, startOfWeek, endOfWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { CalendarCell, CalendarCellTournament } from './CalendarCell';
import { CalendarTournamentSelectionModal } from './modals/CalendarTournamentSelectionModal';

interface Tournament extends CalendarCellTournament {}

interface TournamentCalendarProps {
  tournaments: Tournament[];
  onTournamentClick?: (tournament: Tournament) => void;
  onMonthChange?: (month: Date) => void;
  initialMonth?: Date;
}

// === Основной компонент ===
export function TournamentCalendar({ tournaments, onTournamentClick, onMonthChange, initialMonth }: TournamentCalendarProps) {
  // Нормализуем initialMonth на первое число месяца, если передан
  const normalizedInitialMonth = initialMonth 
    ? new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
    : undefined;
  
  // Используем initialMonth если передан, иначе внутреннее состояние
  const [internalMonth, setInternalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const isControlled = normalizedInitialMonth !== undefined;
  const currentMonth = isControlled ? normalizedInitialMonth : internalMonth;
  
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [monthDirection, setMonthDirection] = useState<'forward' | 'backward'>('forward');
  const prevMonthRef = useRef<Date>(currentMonth);

  const [displayedTournaments, setDisplayedTournaments] = useState<Tournament[]>([]);
  // const [appearIds, setAppearIds] = useState<Set<number>>(new Set());
  // const [disappearIds, setDisappearIds] = useState<Set<number>>(new Set());
  const [isInitialMount, setIsInitialMount] = useState(true);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateTournaments, setSelectedDateTournaments] = useState<CalendarCellTournament[]>([]);
  // Theme detection
  useEffect(() => {
    const check = () => setIsLightTheme(document.documentElement.classList.contains('light'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  // Helper для группировки
    const groupTournamentsByDateKey = (tournaments: Tournament[]): Record<string, Tournament[]> => {
        const map: Record<string, Tournament[]> = {};
        tournaments.forEach(t => {
          if (!t.date) return; // На всякий случай
          const key = format(new Date(t.date), 'yyyy-MM-dd');
          if (!map[key]) map[key] = [];
          map[key].push(t);
        });
        return map;
      };
  // Animation logic
  // Animation logic
    useEffect(() => {
    // 0. Всегда чистим второй таймер, если он был запланирован
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    // Если это первая загрузка, но tournaments пуст, просто устанавливаем isInitialMount в false
    if (isInitialMount && tournaments.length === 0) {
      setIsInitialMount(false);
      return;
    }

    const currentIds = new Set(tournaments.map(t => t.id));
    const displayedIds = new Set(displayedTournaments.map(t => t.id));
  
    const toDisappear = displayedTournaments.filter(t => !currentIds.has(t.id));
    const toAppear = tournaments.filter(t => !displayedIds.has(t.id));
  
    // Проверяем, является ли это первой загрузкой данных
    // НЕ считаем первой загрузкой случай, когда все турниры меняются, но есть отображаемые турниры
    // (это означает изменение фильтра, а не первую загрузку)
    const isFirstLoad = (isInitialMount && tournaments.length > 0 && displayedTournaments.length === 0) || 
                        (!isInitialMount && displayedTournaments.length === 0 && tournaments.length > 0);
    
    let timer: ReturnType<typeof setTimeout> | undefined;
    
    if (isFirstLoad) {
      if (isInitialMount) {
        setIsInitialMount(false);
      }
      
      // При первой загрузке устанавливаем турниры с анимацией появления
      const initialTournaments = tournaments.map(t => ({
        ...t,
        _isAppearing: true,
        _isDisappearing: false,
      }));
      setDisplayedTournaments(initialTournaments);
      
      // Убираем флаги анимации после завершения анимации
      animationTimerRef.current = setTimeout(() => {
        setDisplayedTournaments(prev => 
          prev.map(t => ({ ...t, _isAppearing: false, _isDisappearing: false }))
        );
        animationTimerRef.current = null;
      }, 400); // Длительность анимации появления (0.4s)
      
      // Cleanup функция будет очищать animationTimerRef.current
      return () => {
        if (animationTimerRef.current) {
          clearTimeout(animationTimerRef.current);
          animationTimerRef.current = null;
        }
      };
    }
  
    // Если нет изменений, выходим
    if (toDisappear.length === 0 && toAppear.length === 0) {
      return;
    }
  
    // Группируем текущее состояние для анализа переходов между single/multi
    const groupsBeforeChange = groupTournamentsByDateKey(displayedTournaments);
    const groupsAfterChange = groupTournamentsByDateKey(tournaments);
  
    // Инициализируем список исчезающих турниров
    const toDisappearExtended = [...toDisappear];
  
    // Проверяем, есть ли даты, где изменяется тип карточки (single <-> multi)
    // ИЛИ где меняются турниры (даже если тип карточки не изменился)
    const datesWithTypeChange = new Set<string>();
    const datesWithTournamentChange = new Set<string>();
    const allDates = new Set([
      ...Object.keys(groupsBeforeChange),
      ...Object.keys(groupsAfterChange)
    ]);
    
    allDates.forEach(dateKey => {
      const oldTournaments = groupsBeforeChange[dateKey] || [];
      const newTournaments = groupsAfterChange[dateKey] || [];
      const beforeCount = oldTournaments.length;
      const afterCount = newTournaments.length;
      const beforeWasMulti = beforeCount > 1;
      const afterIsMulti = afterCount > 1;
      
      // Если тип карточки изменился (single <-> multi)
      if (beforeWasMulti !== afterIsMulti && beforeCount > 0 && afterCount > 0) {
        datesWithTypeChange.add(dateKey);
      }
      
      // Проверяем, изменились ли турниры на этой дате (по ID)
      const beforeIds = new Set(oldTournaments.map(t => t.id));
      const afterIds = new Set(newTournaments.map(t => t.id));
      
      // Если набор турниров изменился (есть различия в ID)
      const hasChanges = beforeIds.size !== afterIds.size || 
                         [...beforeIds].some(id => !afterIds.has(id)) ||
                         [...afterIds].some(id => !beforeIds.has(id));
      
      // КРИТИЧНО: Добавляем в datesWithTournamentChange если:
      // 1. Есть изменения в ID И
      // 2. Есть изменения (старые или новые турниры присутствуют)
      // Это важно для правильной обработки фильтров (например, Ongoing → Completed)
      if (hasChanges && (beforeCount > 0 || afterCount > 0)) {
        datesWithTournamentChange.add(dateKey);
        
        // Если на этой дате есть И старые, И новые турниры (например, при смене фильтра),
        // все старые турниры должны исчезнуть
        // Это критично для single → single переходов при фильтрации
        if (beforeCount > 0 && afterCount > 0) {
          oldTournaments.forEach(oldT => {
            if (!toDisappearExtended.some(d => d.id === oldT.id)) {
              toDisappearExtended.push(oldT);
            }
          });
        }
      }
    });

    // Если тип карточки изменился, нужно, чтобы все старые турниры в этой дате исчезли,
    // а все новые (включая оставшиеся) появились заново
    
    // Для дат с изменением типа карточки - все старые должны исчезнуть
    datesWithTypeChange.forEach(dateKey => {
      const oldTournaments = groupsBeforeChange[dateKey] || [];
      oldTournaments.forEach(oldT => {
        if (!toDisappearExtended.some(d => d.id === oldT.id)) {
          toDisappearExtended.push(oldT);
        }
      });
    });
    
    // Для дат с изменением турниров (но без изменения типа) - 
    // все старые турниры, которых нет в новом состоянии, должны исчезнуть
    // Это важно для single → single переходов при фильтрации (например, Ongoing → Completed)
    datesWithTournamentChange.forEach(dateKey => {
      if (!datesWithTypeChange.has(dateKey)) {
        const oldTournaments = groupsBeforeChange[dateKey] || [];
        const newTournaments = groupsAfterChange[dateKey] || [];
        const newIds = new Set(newTournaments.map(t => t.id));
        
        oldTournaments.forEach(oldT => {
          // Если старый турнир не в новом состоянии - он должен исчезнуть
          if (!newIds.has(oldT.id)) {
            // Добавляем в toDisappearExtended если еще не добавлен
            if (!toDisappearExtended.some(d => d.id === oldT.id)) {
              toDisappearExtended.push(oldT);
            }
          }
        });
      }
    });

    // 1. Обновляем старые: помечаем исчезающие (включая те, что должны исчезнуть из-за изменения типа)
    const updatedDisplayed = displayedTournaments.map(t => {
      const shouldDisappear = toDisappearExtended.some(d => d.id === t.id);
      return {
        ...t,
        _isDisappearing: shouldDisappear,
        _isAppearing: false,
      };
    });
  
    // 2. Устанавливаем состояние с исчезающими (но БЕЗ новых пока)
    setDisplayedTournaments(updatedDisplayed);
  
    // 3. Если есть исчезающие, ждем завершения их анимации перед добавлением новых
    if (toDisappearExtended.length > 0) {
      // Ждем завершения анимации исчезновения (250мс)
      timer = setTimeout(() => {
        // 3a. Создаем финальное состояние из tournaments (новое состояние)
        // Все турниры из нового состояния должны быть отображены
        const tournamentsForNextRender = tournaments.map(t => {
          const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
          const isNewTournament = toAppear.some(nt => nt.id === t.id);
          const typeChanged = datesWithTypeChange.has(dateKey);
          const tournamentsChanged = datesWithTournamentChange.has(dateKey);
          
          // Проверяем, были ли на этой дате исчезающие турниры
          const hadDisappearingOnDate = toDisappearExtended.some(d => {
            const dDateKey = format(new Date(d.date), 'yyyy-MM-dd');
            return dDateKey === dateKey;
          });
          
          // Анимация появления нужна для:
          // 1. Новых турниров (из toAppear) - которых не было в старом состоянии
          // 2. Всех турниров в датах, где изменился тип карточки (single <-> multi)
          //    В этом случае даже существующие турниры должны появиться заново
          // 3. Всех турниров в датах, где изменились турниры (single → single с другим турниром)
          //    Это важно для плавной анимации замены
          // 4. Любых турниров на датах, где были исчезающие (для плавного перехода)
          // Важно: для single → single с другим турниром нужно, чтобы новый турнир появился с анимацией
          const shouldAppear = isNewTournament || typeChanged || tournamentsChanged || hadDisappearingOnDate;
          
          return {
            ...t,
            _isDisappearing: false,
            _isAppearing: shouldAppear,
          };
        });
        
        setDisplayedTournaments(tournamentsForNextRender);

        // 3f. Запускаем таймер для сброса флагов анимации после завершения появления
        if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
        
        animationTimerRef.current = setTimeout(() => {
          setDisplayedTournaments(prev => 
            prev.map(t => ({ ...t, _isAppearing: false, _isDisappearing: false }))
          );
          animationTimerRef.current = null;
        }, 400); // Длительность анимации появления (0.4s)
      }, 250); // Длительность анимации исчезновения
    } else {
      // Если нет исчезающих, сразу создаем финальное состояние
      // Но все равно проверяем, нужно ли добавить анимацию для новых турниров
      const tournamentsForNextRender = tournaments.map(t => {
        const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
        const isNewTournament = toAppear.some(nt => nt.id === t.id);
        const typeChanged = datesWithTypeChange.has(dateKey);
        const tournamentsChanged = datesWithTournamentChange.has(dateKey);
        
        // Анимация появления для новых турниров, при изменении типа карточки 
        // или при изменении турниров на дате
        const shouldAppear = isNewTournament || typeChanged || tournamentsChanged;
        
        return {
          ...t,
          _isDisappearing: false,
          _isAppearing: shouldAppear,
        };
      });
      
      setDisplayedTournaments(tournamentsForNextRender);
      
      // Запускаем таймер для сброса флагов
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      
      animationTimerRef.current = setTimeout(() => {
        setDisplayedTournaments(prev => 
          prev.map(t => ({ ...t, _isAppearing: false, _isDisappearing: false }))
        );
        animationTimerRef.current = null;
      }, 400); // Длительность анимации появления (0.4s)
    }
  
    // 6. Функция очистки
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [tournaments, isInitialMount]); // Зависимости не меняем
  // Grouping
  const tournamentsByDate = useMemo(() => {
    const map: Record<string, Tournament[]> = {};
    displayedTournaments.forEach(t => {
      const key = format(new Date(t.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [displayedTournaments]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // 1 = Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // 1 = Monday
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getTournamentsForDate = useCallback((date: Date): Tournament[] => {
    const key = format(date, 'yyyy-MM-dd');
    return tournamentsByDate[key] || [];
  }, [tournamentsByDate]);

  const handleTournamentCardClick = useCallback((tournament: CalendarCellTournament) => {
    // Находим дату турнира
    const tournamentDate = new Date(tournament.date);
    const key = format(tournamentDate, 'yyyy-MM-dd');
    const dateTournaments = tournamentsByDate[key] || [];
    
    // Если турнир один - сразу переходим на страницу турнира
    if (dateTournaments.length === 1) {
      onTournamentClick?.(tournament);
    } else if (dateTournaments.length > 1) {
      // Если турниров несколько - открываем модальное окно
      setSelectedDateTournaments(dateTournaments as CalendarCellTournament[]);
      setIsModalOpen(true);
    }
  }, [tournamentsByDate, onTournamentClick]);

  const handleSelectTournament = useCallback((tournament: CalendarCellTournament) => {
    setIsModalOpen(false);
    onTournamentClick?.(tournament);
  }, [onTournamentClick]);

  // Отслеживаем изменение месяца для анимации
  useEffect(() => {
    const currentTime = currentMonth.getTime();
    const prevTime = prevMonthRef.current.getTime();
    
    // Определяем направление изменения месяца (только если месяц действительно изменился)
    if (currentTime !== prevTime) {
      setMonthDirection(currentTime > prevTime ? 'forward' : 'backward');
      prevMonthRef.current = currentMonth;
    }
  }, [currentMonth]);

  const previousMonth = () => {
    const m = subMonths(currentMonth, 1);
    if (isControlled) {
      // В контролируемом режиме просто вызываем callback
      onMonthChange?.(m);
    } else {
      // В неконтролируемом режиме обновляем внутреннее состояние
      setInternalMonth(m);
      onMonthChange?.(m);
    }
  };

  const nextMonth = () => {
    const m = addMonths(currentMonth, 1);
    if (isControlled) {
      // В контролируемом режиме просто вызываем callback
      onMonthChange?.(m);
    } else {
      // В неконтролируемом режиме обновляем внутреннее состояние
      setInternalMonth(m);
      onMonthChange?.(m);
    }
  };

  return (
    <>
      <style>{`
        @keyframes appear { 
          from { opacity: 0; transform: scale(0.85); filter: brightness(0.7); } 
          to { opacity: 1; transform: scale(1); filter: brightness(1); } 
        }
        @keyframes disappear { 
          from { opacity: 1; transform: scale(1); } 
          to { opacity: 0; transform: scale(1); } 
        }
        @keyframes slideInFromRight { 
          from { opacity: 0; transform: translateX(30px); } 
          to { opacity: 1; transform: translateX(0); } 
        }
        @keyframes slideInFromLeft { 
          from { opacity: 0; transform: translateX(-30px); } 
          to { opacity: 1; transform: translateX(0); } 
        }
        .month-header-slide-forward {
          animation: slideInFromRight 0.4s ease-out forwards;
        }
        .month-header-slide-backward {
          animation: slideInFromLeft 0.4s ease-out forwards;
        }
      `}</style>

      <div className="space-y-6 mb-8">
        {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <h2 
          key={format(currentMonth, 'yyyy-MM')}
          className={`text-2xl font-bold text-foreground flex items-center gap-2 z-10 ${
            monthDirection === 'forward' ? 'month-header-slide-forward' : 'month-header-slide-backward'
          }`}
        >
          <Calendar className="w-6 h-6" />
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        {/* Legend - абсолютно по центру */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-sm font-medium text-foreground">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-sm font-medium text-foreground">Ongoing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-sm font-medium text-foreground">Completed</span>
          </div>
        </div>
        
        <div className="flex gap-2 z-10">
          <Button variant="outline" size="sm" onClick={previousMonth} className="bg-card dark:bg-muted border-border shadow-sm hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth} className="bg-card dark:bg-muted border-border shadow-sm hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>


        {/* Grid */}
        <div className="bg-card border-2 border-border rounded-xl overflow-hidden relative" style={{ 
          backgroundColor: 'var(--card)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          opacity: 1,
          boxShadow: 'none',
          zIndex: 50,
        }}>
        <div className="grid grid-cols-7 border-b-2 border-border bg-card dark:bg-muted" style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          opacity: 1,
        }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, index) => (
              <div key={d} className="p-3 text-center text-sm font-bold text-foreground" style={{
                borderRight: index < 6 ? '2px solid var(--border)' : 'none',
                boxSizing: 'border-box',
              }}>
                {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 p-1 overflow-visible">
          {calendarDays.map((day, index) => {
            const dayTours = getTournamentsForDate(day);
            const isCurrent = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isPastDate = isPast(day) && !isTodayDate;
            
            return (
              <CalendarCell
                key={`calendar-cell-${index}`}
                day={day}
                tournaments={dayTours}
                isLightTheme={isLightTheme}
                isCurrent={isCurrent}
                isTodayDate={isTodayDate}
                isPastDate={isPastDate}
                onTournamentClick={handleTournamentCardClick}
              />
            );
          })}
        </div>
      </div>

      <CalendarTournamentSelectionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        tournaments={selectedDateTournaments}
        onSelectTournament={handleSelectTournament}
      />
    </div>
    </>
  );
}