import React, { useState } from "react";
import { Tournament, TournamentCard } from "./TournamentCard";
import { TournamentFilters, FilterState } from "./TournamentFilters";
import { SportBackground } from "../../common/backgrounds/sport-background/SportBackground";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ImageWithFallback } from "../common/image/ImageWithFallback";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { TournamentSelectionModal } from "./modals/TournamentSelectionModal";

interface TournamentListProps {
  tournaments: Tournament[];
  onViewDetails: (tournament: Tournament) => void;
  initialView?: "list" | "calendar";
}

export function TournamentList({ tournaments, onViewDetails, initialView = "list" }: TournamentListProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">(initialView);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedDayTournaments, setSelectedDayTournaments] = useState<Tournament[]>([]);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    location: "all",
    format: "all",
    search: ""
  });

  // Apply filters to tournaments
  const applyFilters = (tournamentList: Tournament[]) => {
    return tournamentList.filter(tournament => {
      // Category filter
      if (filters.category !== "all" && tournament.category !== filters.category) {
        return false;
      }

      // Location filter (continent-based)
      if (filters.location !== "all") {
        const locationMap: { [key: string]: string[] } = {
          "Asia": ["Tokyo", "Shanghai", "Beijing", "Seoul"],
          "Europe": ["Berlin", "Paris", "London", "Oslo"],
          "North America": ["New York", "Toronto"],
          "South America": ["São Paulo", "Buenos Aires"],
          "Oceania": ["Sydney", "Melbourne"]
        };
        const citiesInRegion = locationMap[filters.location] || [];
        if (!citiesInRegion.some(city => tournament.location.includes(city))) {
          return false;
        }
      }

      // Format filter
      if (filters.format !== "all" && tournament.tournamentFormat !== filters.format) {
        return false;
      }

      // Search filter
      if (filters.search && !tournament.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !tournament.location.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      return true;
    });
  };
  
  // Filter tournaments by status
  const upcomingTournaments = applyFilters(tournaments.filter(t => t.status === "upcoming"));
  const ongoingTournaments = applyFilters(tournaments.filter(t => t.status === "ongoing"));
  const completedTournaments = applyFilters(tournaments.filter(t => t.status === "completed"));

  // Apply date range filter
  const applyDateFilter = (tournamentList: Tournament[]) => {
    if (!dateRange.from) return tournamentList;
    
    return tournamentList.filter(t => {
      const tournamentDate = parseTournamentDate(t.date);
      if (!tournamentDate) return false;
      
      const isAfterStart = tournamentDate >= dateRange.from!;
      const isBeforeEnd = !dateRange.to || tournamentDate <= dateRange.to;
      
      return isAfterStart && isBeforeEnd;
    });
  };

  const parseTournamentDate = (dateStr: string): Date | null => {
    try {
      const parts = dateStr.split(' ');
      const month = parts[0];
      const day = parseInt(parts[1].replace(',', ''));
      const year = parseInt(parts[2]);
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(month);
      
      if (monthIndex === -1) return null;
      return new Date(year, monthIndex, day);
    } catch {
      return null;
    }
  };
  
  // Parse dates and organize tournaments by date
  const getTournamentsByDate = () => {
    const byDate: { [key: string]: Tournament[] } = {};
    
    tournaments.forEach(tournament => {
      const dateStr = tournament.date;
      if (!byDate[dateStr]) {
        byDate[dateStr] = [];
      }
      byDate[dateStr].push(tournament);
    });
    
    return byDate;
  };

  const tournamentsByDate = getTournamentsByDate();

  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getTournamentsForDate = (date: Date | null) => {
    if (!date) return [];
    
    // Find tournaments matching this date
    const matchingTournaments: Tournament[] = [];
    Object.keys(tournamentsByDate).forEach(dateStr => {
      const parts = dateStr.split(' ');
      const month = parts[0];
      const day = parseInt(parts[1].replace(',', ''));
      const year = parseInt(parts[2]);
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthIndex = monthNames.indexOf(month);
      
      if (monthIndex === date.getMonth() && day === date.getDate() && year === date.getFullYear()) {
        matchingTournaments.push(...tournamentsByDate[dateStr]);
      }
    });
    
    return matchingTournaments;
  };

  const handleDayClick = (date: Date) => {
    const dayTournaments = getTournamentsForDate(date);
    if (dayTournaments.length === 0) return;
    
    if (dayTournaments.length === 1) {
      onViewDetails(dayTournaments[0]);
    } else {
      setSelectedDayTournaments(dayTournaments);
      setShowTournamentModal(true);
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const clearDateRange = () => {
    setDateRange({});
  };

  const calendarDays = getCalendarDays();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="tournaments" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Tournament Directory</h1>
          <p className="text-muted-foreground">
            Find and register for table tennis tournaments worldwide
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => setViewMode("list")}
            className="gap-2"
          >
            <List className="w-4 h-4" />
            List View
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={() => setViewMode("calendar")}
            className="gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar View
          </Button>
        </div>

        {viewMode === "list" ? (
          <>
            {/* Filters */}
            <TournamentFilters onFilterChange={(newFilters: FilterState) => setFilters(newFilters)} />

            {/* Date Range Filter */}
            <div className="mb-6 flex items-end gap-4">
              <div className="flex-1 max-w-md">
                <Label className="mb-2 block">Filter by Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                          </>
                        ) : (
                          dateRange.from.toLocaleDateString()
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range: { from?: Date; to?: Date } | null | undefined) => setDateRange(range || {})}
                      numberOfMonths={1}
                      className="max-h-[350px] overflow-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {dateRange.from && (
                <Button variant="ghost" size="sm" onClick={clearDateRange}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Status Tabs */}
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="upcoming">
                  Upcoming ({applyDateFilter(upcomingTournaments).length})
                </TabsTrigger>
                <TabsTrigger value="ongoing">
                  Ongoing ({applyDateFilter(ongoingTournaments).length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({applyDateFilter(completedTournaments).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {applyDateFilter(upcomingTournaments).map((tournament, index) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onViewDetails={onViewDetails}
                      index={index}
                    />
                  ))}
                </div>
                {applyDateFilter(upcomingTournaments).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No upcoming tournaments found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ongoing">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {applyDateFilter(ongoingTournaments).map((tournament, index) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onViewDetails={onViewDetails}
                      index={index}
                    />
                  ))}
                </div>
                {applyDateFilter(ongoingTournaments).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No ongoing tournaments found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {applyDateFilter(completedTournaments).map((tournament, index) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      onViewDetails={onViewDetails}
                      index={index}
                    />
                  ))}
                </div>
                {applyDateFilter(completedTournaments).length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No completed tournaments found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            {/* Calendar View */}
            <Card className="p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl">{formatMonthYear(currentMonth)}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {calendarDays.map((date, index) => {
                  const dayTournaments = getTournamentsForDate(date);
                  const hasEvents = dayTournaments.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className={`h-[60px] md:h-[80px] border rounded-lg p-1 flex flex-col ${
                        !date ? 'bg-muted/30' : 
                        isToday(date) ? 'border-green-500 border-2 bg-green-500/10 ring-2 ring-green-500/20' :
                        hasEvents ? 'bg-card hover:bg-muted/50 cursor-pointer hover:border-primary/50' :
                        'bg-card'
                      } transition-all`}
                      onClick={() => date && handleDayClick(date)}
                    >
                      {date && (
                        <>
                          <div className="text-xs md:text-sm font-semibold mb-0.5">
                            {date.getDate()}
                          </div>
                          {hasEvents && (
                            <>
                              {/* Desktop view - show name */}
                              <div className="hidden md:flex flex-1 flex-col gap-0.5 overflow-hidden">
                                {dayTournaments.slice(0, 1).map(tournament => (
                                  <div 
                                    key={tournament.id} 
                                    className="relative flex-shrink-0"
                                  >
                                    <Badge 
                                      variant="secondary"
                                      className={`w-full text-[10px] px-1 py-0 h-5 justify-start truncate ${
                                        tournament.status === 'completed' ? 'bg-gray-500/80 text-white' :
                                        tournament.status === 'ongoing' ? 'bg-green-500/80 text-white' :
                                        'bg-primary/80 text-primary-foreground'
                                      }`}
                                    >
                                      {tournament.name}
                                    </Badge>
                                  </div>
                                ))}
                                {dayTournaments.length > 1 && (
                                  <div className="text-[10px] text-center text-muted-foreground font-semibold">
                                    +{dayTournaments.length - 1} more
                                  </div>
                                )}
                              </div>
                              
                              {/* Mobile view - show dots */}
                              <div className="flex md:hidden items-center justify-center gap-0.5 flex-wrap flex-1">
                                {dayTournaments.slice(0, 3).map((tournament, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      tournament.status === 'completed' ? 'bg-gray-500' :
                                      tournament.status === 'ongoing' ? 'bg-green-500' :
                                      'bg-primary'
                                    }`}
                                  />
                                ))}
                                {dayTournaments.length > 3 && (
                                  <span className="text-[8px] ml-0.5 font-bold">+{dayTournaments.length - 3}</span>
                                )}
                              </div>
                              
                              {/* Count badge for mobile */}
                              <div className="flex md:hidden justify-center">
                                <span className="text-[8px] font-semibold text-muted-foreground">
                                  {dayTournaments.length} {dayTournaments.length === 1 ? 'event' : 'events'}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Upcoming</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Ongoing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>Completed</span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Tournament Selection Modal */}
      <TournamentSelectionModal
        open={showTournamentModal}
        onOpenChange={setShowTournamentModal}
        tournaments={selectedDayTournaments}
        onSelectTournament={onViewDetails}
      />
    </div>
  );
}
