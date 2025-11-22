import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select-simple";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
import { Trophy, Calendar, MapPin, Clock, Search, Filter, Play, CheckCircle, AlertCircle, Grid, List, CalendarDays } from "lucide-react";
import { EmptyState } from "../../components/common/EmptyState";
import { format } from "date-fns";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { TournamentCalendar } from "../../components/tournaments/TournamentCalendar";
import { Pagination } from "../../components/common/Pagination";
import { apiClient } from "../../api/client";
import { TournamentCardApi } from "../../components/tournaments/TournamentCard";
import { TournamentCardSkeleton } from "../../components/tournaments/TournamentCardSkeleton";
import { typography } from "../../utils/typography";
import { cn } from "../../components/ui/utils";

interface Tournament {
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
  image_url?: string;
}

interface TournamentsResponse {
  tournaments: Tournament[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface FiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  formatFilter: string;
  setFormatFilter: (format: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  setDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  viewMode: 'grid' | 'calendar' | 'calendar-grid';
  setViewMode: (mode: 'grid' | 'calendar' | 'calendar-grid') => void;
  applyDateFilter: () => void;
}

const Filters = React.memo(({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  formatFilter,
  setFormatFilter,
  dateRange,
  setDateRange,
  viewMode,
  setViewMode,
  applyDateFilter
}: FiltersProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  // Sync local state with external state
  useEffect(() => {
    setLocalDateRange(dateRange);
  }, [dateRange]);

  return (
    <div className="mb-8 space-y-6">
      {/* Status Tabs and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Status Tabs - Left */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
            className="flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            All Tournaments
          </Button>
          <Button
            variant={statusFilter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("upcoming")}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Upcoming
          </Button>
          <Button
            variant={statusFilter === "ongoing" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ongoing")}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Ongoing
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Completed
          </Button>
        </div>

        {/* View Mode Toggle - Right */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground dark:text-muted-foreground">View:</span>
          <div className="flex gap-1 bg-card dark:bg-muted rounded-lg p-1 border border-border shadow-sm">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="px-3"
            >
              <Calendar className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar-grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar-grid')}
              className="px-3"
            >
              <CalendarDays className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters - Hidden when calendar-grid view is active */}
      {viewMode !== 'calendar-grid' && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              variant="outline"
              className="pl-10"
            />
          </div>

          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger variant="outline">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formats</SelectItem>
              <SelectItem value="single-elimination">Single Elimination</SelectItem>
              <SelectItem value="round-robin">Round Robin</SelectItem>
              <SelectItem value="group-stage">Group Stage</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <div className="flex gap-2 items-center">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-64 justify-start text-left font-normal"
                >
                  {localDateRange.from ? (
                    localDateRange.to ? (
                      <>
                        {format(localDateRange.from, "LLL dd, y")} -{" "}
                        {format(localDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(localDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={localDateRange.from}
                  selected={localDateRange}
                  onSelect={(range: { from: Date | undefined; to: Date | undefined } | undefined) => {
                    // Immediately apply changes to external state
                    if (range) {
                      setLocalDateRange(range);
                      setDateRange(range);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Clear button - only shown when date range is selected */}
            {(dateRange.from || dateRange.to) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLocalDateRange({ from: undefined, to: undefined });
                  setDateRange({ from: undefined, to: undefined });
                }}
                className="px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

interface TournamentsDisplayProps {
  tournaments: Tournament[];
  viewMode: 'grid' | 'calendar' | 'calendar-grid';
  getStatusBadge: (status: string) => React.ReactNode;
  getFormatBadge: (format: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  formatTime: (timeString: string) => string;
  calendarTournaments?: Tournament[];
  calendarMonth?: Date;
  onCalendarMonthChange?: (month: Date) => void;
  onTournamentClick?: (tournamentId: number) => void;
  loading?: boolean;
  searchQuery?: string;
  debouncedSearchQuery?: string;
}

const TournamentsDisplay = React.memo(({
  tournaments,
  viewMode,
  getStatusBadge,
  getFormatBadge,
  formatDate,
  formatTime,
  calendarTournaments = [],
  calendarMonth,
  onCalendarMonthChange,
  onTournamentClick,
  loading = false,
  searchQuery = "",
  debouncedSearchQuery = ""
}: TournamentsDisplayProps) => {
  // Group tournaments by date for calendar view
  const groupTournamentsByDate = useCallback((tournaments: Tournament[]) => {
    const grouped: { [key: string]: Tournament[] } = {};

    tournaments.forEach(tournament => {
      const dateKey = tournament.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(tournament);
    });

    return grouped;
  }, []);

  const groupedTournaments = useMemo(() => groupTournamentsByDate(tournaments), [tournaments, groupTournamentsByDate]);
  const sortedDates = useMemo(() => Object.keys(groupedTournaments).sort(), [groupedTournaments]);

  // Определяем, нужно ли показывать скелетоны (когда идет поиск)
  const showSkeletons = loading || (searchQuery.length > 0 && debouncedSearchQuery.length === 0);
  // Определяем, нужно ли показывать сообщение "No results"
  const showNoResults = !loading && debouncedSearchQuery.length > 0 && tournaments.length === 0;

  if (viewMode === 'grid') {
    if (showNoResults) {
      // Show empty state when no results found - outside grid for proper centering
      return (
        <div className="mb-8 py-12 flex justify-center items-center">
          <EmptyState
            icon={Search}
            text={`No tournaments found for "${debouncedSearchQuery}"`}
          />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {showSkeletons ? (
          // Show 12 skeleton cards while loading/searching
          Array.from({ length: 12 }).map((_, index) => (
            <TournamentCardSkeleton key={`skeleton-${index}`} index={index} />
          ))
        ) : (
          tournaments.map((tournament, index) => {
            // Convert Tournament to ApiTournament format
            const apiTournament = {
              ...tournament,
              image_url: tournament.image_url || null,
              format: tournament.format,
              time: tournament.time,
              venue: null,
              organizer_username: tournament.organizer_username || '',
              organizer_name: tournament.organizer_name || '',
            };
            return (
              <TournamentCardApi
                key={tournament.id}
                tournament={apiTournament}
                onClick={() => onTournamentClick?.(tournament.id)}
                index={index}
              />
            );
          })
        )}
      </div>
    );
  }

  if (viewMode === 'calendar-grid') {
    return (
      <TournamentCalendar
        tournaments={calendarTournaments}
        onTournamentClick={(tournament) => {
          onTournamentClick?.(tournament.id);
        }}
        onMonthChange={onCalendarMonthChange}
        initialMonth={calendarMonth}
      />
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {showSkeletons ? (
        // Show skeleton cards in a single date group while loading/searching
        <div className="rounded-lg border border-border overflow-hidden relative z-10 shadow-md bg-background">
          <div className="px-6 py-4 border-b border-border bg-muted">
            <div className="h-7 w-48 bg-muted-foreground/20 rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse mt-2" />
          </div>
          <div className="p-6 bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <TournamentCardSkeleton key={`skeleton-calendar-${index}`} index={index} />
              ))}
            </div>
          </div>
        </div>
      ) : showNoResults ? (
        // Show empty state when no results found
        <div className="py-12 flex justify-center items-center">
          <EmptyState
            icon={Search}
            text={`No tournaments found for "${debouncedSearchQuery}"`}
          />
        </div>
      ) : sortedDates.length > 0 ? (
        sortedDates.map((date) => (
          <div key={date} className="rounded-lg border border-border overflow-hidden relative z-10 shadow-md bg-background">
            <div className="px-6 py-4 border-b border-border bg-muted">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {formatDate(date)}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {groupedTournaments[date].length} tournament{groupedTournaments[date].length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="p-6 bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedTournaments[date].map((tournament, index) => {
                  // Convert Tournament to ApiTournament format
                  const apiTournament = {
                    ...tournament,
                    image_url: tournament.image_url || null,
                    format: tournament.format,
                    time: tournament.time,
                    venue: null,
                    organizer_username: tournament.organizer_username || '',
                    organizer_name: tournament.organizer_name || '',
                  };
                  return (
                    <TournamentCardApi
                      key={tournament.id}
                      tournament={apiTournament}
                      onClick={() => onTournamentClick?.(tournament.id)}
                      index={index}
                      showDate={false}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))
      ) : null}
    </div>
  );
});

export function TournamentsPage() {
  const navigate = useNavigate();

  // Прокручиваем страницу вверх при открытии (без анимации, до рендера)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Флаг первой загрузки
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'calendar-grid'>('grid');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [debouncedDateRange, setDebouncedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  // Инициализируем calendarMonth на первое число текущего месяца для консистентности
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarTournaments, setCalendarTournaments] = useState<Tournament[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Load tournaments for calendar month
  const loadCalendarTournaments = async (month: Date) => {
    if (viewMode !== 'calendar-grid') return;

    try {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const params: any = {
        date_from: monthStart.toISOString().split('T')[0],
        date_to: monthEnd.toISOString().split('T')[0],
        limit: '1000' // Load all tournaments for the month
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (formatFilter !== 'all') {
        params.format = formatFilter;
      }

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      const data = await apiClient.getTournaments(params);
      // Ensure participant_count is a number
      const normalizedTournaments = (data.tournaments || []).map((t: any) => ({
        ...t,
        participant_count: typeof t.participant_count === 'string' ? parseInt(t.participant_count, 10) : (t.participant_count || 0),
        current_participants: typeof t.current_participants === 'string' ? parseInt(t.current_participants, 10) : (t.current_participants || 0)
      }));
      setCalendarTournaments(normalizedTournaments);
      console.log(`📅 Loaded ${normalizedTournaments.length} tournaments for ${format(month, 'MMMM yyyy')}`);
    } catch (error) {
      console.error('Error loading calendar tournaments:', error);
      setError('Failed to load calendar tournaments');
    }
  };

  // Load calendar tournaments when month changes
  useEffect(() => {
    if (viewMode === 'calendar-grid') {
      loadCalendarTournaments(calendarMonth);
    }
  }, [calendarMonth, viewMode]);

  // Reload calendar tournaments when filters change
  useEffect(() => {
    if (viewMode === 'calendar-grid') {
      loadCalendarTournaments(calendarMonth);
    }
  }, [statusFilter, formatFilter, debouncedSearchQuery, viewMode]);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 600);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Debounce date range
  useEffect(() => {
    if (dateTimeoutRef.current) {
      clearTimeout(dateTimeoutRef.current);
    }

    dateTimeoutRef.current = setTimeout(() => {
      setDebouncedDateRange(dateRange);
    }, 500);

    return () => {
      if (dateTimeoutRef.current) {
        clearTimeout(dateTimeoutRef.current);
      }
    };
  }, [dateRange]);

  const fetchTournaments = useCallback(async () => {
    try {
      // Показываем скелетоны только если есть поисковый запрос (не при первой загрузке без поиска)
      const isSearching = debouncedSearchQuery.length > 0;
      if (isSearching) {
        setTournamentsLoading(true);
      }
      setError(null);

      const params: any = {
        page: currentPage.toString(),
        limit: "12",
        sort: "date",
        order: "DESC"
      };

      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (statusFilter !== "all") params.status = statusFilter;
      if (formatFilter !== "all") params.format = formatFilter;
      if (debouncedDateRange.from) params.date_from = debouncedDateRange.from.toISOString().split('T')[0];
      if (debouncedDateRange.to) params.date_to = debouncedDateRange.to.toISOString().split('T')[0];

      const data: TournamentsResponse = await apiClient.getTournaments(params);
      // Ensure participant_count is a number
      const normalizedTournaments = (data.tournaments || []).map(t => ({
        ...t,
        participant_count: typeof t.participant_count === 'string' ? parseInt(t.participant_count, 10) : (t.participant_count || 0),
        current_participants: typeof t.current_participants === 'string' ? parseInt(t.current_participants, 10) : (t.current_participants || 0)
      }));
      setTournaments(normalizedTournaments);
      setPagination(data.pagination);

      // После первой загрузки устанавливаем флаг в false
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tournaments");
    } finally {
      setTournamentsLoading(false);
    }
  }, [currentPage, debouncedSearchQuery, statusFilter, formatFilter, debouncedDateRange, isInitialLoad]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  const getFormatBadge = useCallback((format: string) => {
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
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const formatTime = useCallback((timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  // Function to immediately apply date filter
  const applyDateFilter = useCallback(() => {
    setDebouncedDateRange(dateRange);
  }, [dateRange]);



  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <SportBackground variant="tournaments" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white mt-4">Error Loading Tournaments</h2>
            <p className="text-gray-300 mt-2">{error}</p>
            <Button onClick={fetchTournaments} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <SportBackground variant="tournaments" />

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className={cn(
              typography.sectionTitleTournament,
              typography.spacing.titleMargin,
              "text-foreground"
            )}
            style={typography.sectionTitleTournamentStyle}
          >
            Tournaments
          </h1>
          <p
            className={cn(typography.subtitle, "max-w-2xl mx-auto")}
          >
            Compete in exciting table tennis tournaments and climb the rankings
          </p>
        </div>

        {/* Filters and View Controls */}
        <Filters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          formatFilter={formatFilter}
          setFormatFilter={setFormatFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          viewMode={viewMode}
          setViewMode={setViewMode}
          applyDateFilter={applyDateFilter}
        />

        {/* Tournaments Display */}
        <div className="relative z-10">
          <TournamentsDisplay
            tournaments={tournaments}
            viewMode={viewMode}
            getStatusBadge={getStatusBadge}
            getFormatBadge={getFormatBadge}
            formatDate={formatDate}
            formatTime={formatTime}
            calendarTournaments={calendarTournaments}
            calendarMonth={calendarMonth}
            onCalendarMonthChange={(month) => {
              // Нормализуем месяц на первое число для консистентности
              const normalizedMonth = new Date(month.getFullYear(), month.getMonth(), 1);
              setCalendarMonth(normalizedMonth);
            }}
            onTournamentClick={(tournamentId) => navigate(`/tournaments/${tournamentId}`)}
            loading={tournamentsLoading && debouncedSearchQuery.length > 0}
            searchQuery={searchQuery}
            debouncedSearchQuery={debouncedSearchQuery}
          />
        </div>

        {/* Pagination - hidden for calendar view */}
        {viewMode !== 'calendar-grid' && pagination && pagination.pages > 1 && (
          <div className="flex flex-col items-center gap-4 bg-card/80 backdrop-blur-sm rounded-lg p-4 border border-border">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              onPageChange={setCurrentPage}
              showPageInfo={true}
            />
          </div>
        )}

      </div>
    </div>
  );
}
