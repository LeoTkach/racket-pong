import React, { useState, useMemo, useEffect, useLayoutEffect, useCallback, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Trophy, Medal, Award, Search, Loader2, Users, Star, Activity, UserX } from "lucide-react";
import { SportBackground } from "../../common/backgrounds/sport-background/SportBackground";
import { Pagination } from "../../common/Pagination";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import { typography } from "../../../utils/typography";
import { cn } from "../../ui/utils";
import { StatCard } from "../../ui/stat-card";
import { EmptyState } from "../../common/EmptyState";
import { apiClient } from "../../../api/client";

// Hook for fetching players data
function usePlayers(params = {}) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getPlayers(params);
        setPlayers(response.players);
        setPagination(response.pagination);
      } catch (err) {
        console.error('usePlayers - Error fetching players:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [JSON.stringify(params)]);

  return { players, loading, error, pagination };
}

// Hook for fetching all players statistics
function useAllPlayersStats() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    averageRating: 0,
    averageGames: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        // Получаем всех игроков без пагинации
        const response = await apiClient.getPlayers({ limit: 1000 });
        const allPlayers = response.players;
        
        const totalPlayers = response.pagination?.total || allPlayers.length;
        
        // Безопасное вычисление среднего рейтинга
        const validRatings = allPlayers
          .map(p => {
            const rating = typeof p.rating === 'string' ? parseFloat(p.rating) : (p.rating || 0);
            return isNaN(rating) || rating <= 0 ? null : rating;
          })
          .filter(r => r !== null);
        const averageRating = validRatings.length > 0 
          ? Math.round(validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length)
          : 0;
        
        // Безопасное вычисление среднего количества игр
        const validGames = allPlayers
          .map(p => {
            // games_played может быть строкой из SQL или числом
            const games = typeof p.games_played === 'string' ? parseInt(p.games_played, 10) : (p.games_played || 0);
            return isNaN(games) || games < 0 ? null : games;
          })
          .filter(g => g !== null);
        const averageGames = validGames.length > 0
          ? Math.round(validGames.reduce((sum, g) => sum + g, 0) / validGames.length)
          : 0;

        setStats({
          totalPlayers,
          averageRating,
          averageGames
        });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching all players stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

// Memoized table component to prevent unnecessary re-renders
const LeaderboardTable = memo(({ players, onPlayerClick, currentPage, playersPerPage }: {
  players: any[],
  onPlayerClick: (username: string) => void,
  currentPage: number,
  playersPerPage: number
}) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">{rank}</span>;
  };
  
  // Calculate rank based on position in sorted list (by rating)
  // Players with the same rating should have the same rank
  // Next different rating gets the next sequential rank (not skipping)
  // Example: 1, 2, 2, 3 (not 1, 2, 2, 4)
  const calculateRanks = () => {
    const ranks: number[] = [];
    const baseOffset = (currentPage - 1) * playersPerPage;
    
    for (let i = 0; i < players.length; i++) {
      let rank: number;
      
      if (i === 0) {
        // First player always gets rank 1 (or baseOffset + 1)
        rank = baseOffset + 1;
      } else if (players[i].rating === players[i - 1].rating) {
        // Same rating as previous - use same rank
        rank = ranks[i - 1];
      } else {
        // Different rating - use next sequential rank
        // If previous rank was 2 (shared by multiple players), next rank is 3 (not 4)
        const previousRank = ranks[i - 1];
        rank = previousRank + 1;
      }
      
      ranks.push(rank);
    }
    
    return ranks;
  };
  
  const ranks = calculateRanks();

  return (
    <Table className="w-full" style={{ tableLayout: 'fixed' }}>
      <TableHeader>
        <TableRow>
          <TableHead style={{ width: '64px', minWidth: '64px', maxWidth: '64px', textAlign: 'left' }}>Rank</TableHead>
          <TableHead style={{ width: '192px', minWidth: '192px', maxWidth: '192px', textAlign: 'left' }}>Player</TableHead>
          <TableHead style={{ width: '96px', minWidth: '96px', maxWidth: '96px', textAlign: 'left' }}>Country</TableHead>
          <TableHead style={{ width: '64px', minWidth: '64px', maxWidth: '64px', textAlign: 'center' }} className="text-center">Games</TableHead>
          <TableHead style={{ width: '96px', minWidth: '96px', maxWidth: '96px', textAlign: 'center' }} className="text-center">Wins/Losses</TableHead>
          <TableHead style={{ width: '80px', minWidth: '80px', maxWidth: '80px', textAlign: 'center' }} className="text-center">Win Rate</TableHead>
          <TableHead style={{ width: '80px', minWidth: '80px', maxWidth: '80px', textAlign: 'center' }} className="text-center">Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player, index) => {
          // Get rank from pre-calculated ranks array
          const rank = ranks[index];
          
          return (
          <TableRow
            key={player.id}
            className="hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onPlayerClick(player.username)}
          >
            <TableCell className="font-medium" style={{ textAlign: 'left' }}>
              <div className="flex items-center gap-2">
                {getRankIcon(rank)}
              </div>
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {player.full_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-medium">{player.full_name}</div>
                  <div className="text-sm text-muted-foreground">@{player.username}</div>
                </div>
              </div>
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <Badge variant="outline">{player.country}</Badge>
            </TableCell>
            <TableCell className="text-center" style={{ textAlign: 'center' }}>
              {player.games_played}
            </TableCell>
            <TableCell className="text-center" style={{ textAlign: 'center' }}>
              <div className="flex justify-center items-center">
                <span className="font-medium">
                  <span className="text-green-600">{player.wins}</span>
                  <span className="text-muted-foreground" style={{ margin: '0 4px' }}>/</span>
                  <span className="text-red-600">{player.losses}</span>
                </span>
              </div>
            </TableCell>
            <TableCell className="text-center" style={{ textAlign: 'center' }}>
              <div className="flex items-center justify-center w-full">
                <div className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-muted">
                  <span className="font-medium">{Math.round(player.win_rate)}%</span>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center font-mono" style={{ textAlign: 'center' }}>
              {player.rating.toLocaleString()}
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});

LeaderboardTable.displayName = 'LeaderboardTable';

// Tournament Rankings Table component (used in Manage Results)
interface TournamentRankingsTableProps {
  players: Array<{ 
    player: string; 
    wins: number; 
    losses: number; 
    points: number;
    pointDifference?: number; // Point difference (points for - points against)
    placementRange?: string; // Optional: for ranges like "3-4", "5-8"
  }>;
  participants: Array<{
    id?: number;
    full_name?: string;
    username?: string;
    avatar_url?: string;
    country?: string;
    rating?: number;
  }>;
}

export const TournamentRankingsTable = memo(({ players, participants }: TournamentRankingsTableProps) => {
  const getRankDisplay = (placementRange: string | undefined, index: number) => {
    // Use placementRange if provided, otherwise use index + 1
    const rankText = placementRange || (index + 1).toString();
    
    // Extract first number from range (e.g., "3-4" -> 3, "5-8" -> 5)
    const firstNum = parseInt(rankText.split('-')[0]);
    
    if (firstNum === 1) {
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    }
    if (firstNum === 2) {
      return <span className="text-sm font-medium text-gray-400">{rankText}</span>;
    }
    if (firstNum === 3) {
      return <span className="text-sm font-medium text-amber-600">{rankText}</span>;
    }
    return <span className="text-sm font-medium text-muted-foreground">{rankText}</span>;
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No standings available yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full" style={{ tableLayout: 'fixed' }}>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: '80px', minWidth: '80px', maxWidth: '80px', textAlign: 'left' }} className="text-left">Rank</TableHead>
            <TableHead style={{ width: '200px', minWidth: '200px', maxWidth: '200px', textAlign: 'left' }} className="text-left">Player</TableHead>
            <TableHead style={{ width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center' }} className="text-center">Games</TableHead>
            <TableHead style={{ width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center' }} className="text-center">Wins</TableHead>
            <TableHead style={{ width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center' }} className="text-center">Losses</TableHead>
            <TableHead style={{ width: '100px', minWidth: '100px', maxWidth: '100px', textAlign: 'center' }} className="text-center">Score Diff</TableHead>
            <TableHead style={{ width: '90px', minWidth: '90px', maxWidth: '90px', textAlign: 'center' }} className="text-center">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>Win Rate</div>
            </TableHead>
            <TableHead style={{ width: '80px', minWidth: '80px', maxWidth: '80px', textAlign: 'center' }} className="text-center">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => {
            const gamesPlayed = player.wins + player.losses;
            const winRate = gamesPlayed > 0 ? Math.round((player.wins / gamesPlayed) * 100) : 0;
            
            // Find participant data for avatar and country
            const participant = participants.find(p => 
              (p.full_name === player.player || p.username === player.player) ||
              `${p.full_name || p.username}` === player.player
            );
            
            return (
              <TableRow key={player.player} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium text-left">
                  <div className="flex items-center gap-2 justify-start">
                    {getRankDisplay(player.placementRange, index)}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center gap-3 justify-start">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {participant?.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={player.player}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {player.player.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{player.player}</div>
                      {participant?.username && participant?.full_name && participant.full_name !== participant.username && (
                        <div className="text-sm text-muted-foreground">@{participant.username}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {gamesPlayed}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-green-600">{player.wins}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-red-600">{player.losses}</span>
                </TableCell>
                <TableCell className="text-center font-mono">
                  {player.pointDifference !== undefined ? (
                    <span className={player.pointDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {player.pointDifference > 0 ? '+' : ''}{player.pointDifference}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center" style={{ textAlign: 'center' }}>
                  <div className="flex items-center justify-center w-full">
                    <div className="flex items-center justify-center w-14 px-1.5 py-1 rounded-md bg-muted mx-auto">
                      <span className="font-medium text-center text-sm">{winRate}%</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {player.points}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

TournamentRankingsTable.displayName = 'TournamentRankingsTable';

export function LeaderboardApi() {
  const navigate = useNavigate();
  
  // Прокручиваем страницу вверх при открытии (без анимации, до рендера)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });
  const playersPerPage = 10;

  // Get all players stats for the cards
  const { stats: allStats, loading: statsLoading } = useAllPlayersStats();

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

  // Debounce search query - only reset page when search actually changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1); // Reset to first page when search changes
      }
      setDebouncedSearchQuery(searchQuery);
    }, 300); // Reduced delay for better UX

    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearchQuery]);

  // Use API hook to fetch players
  const { players, loading, error, pagination } = usePlayers({
    page: currentPage,
    limit: playersPerPage,
    sort: 'rating',
    order: 'DESC',
    search: debouncedSearchQuery || undefined
  });

  const totalPages = (pagination as any)?.pages || 1;

  // Отслеживаем загрузку при смене страницы
  useEffect(() => {
    if (loading) {
      setIsPageChanging(true);
    } else {
      // Увеличенная задержка перед скрытием скелетона для плавности
      const timer = setTimeout(() => {
        setIsPageChanging(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePageChange = useCallback((page: number) => {
    setIsPageChanging(true);
    setCurrentPage(page);
  }, []);

  const handlePlayerClick = useCallback((username: string) => {
    navigate(`/profile/${username}`);
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading leaderboard: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
        <SportBackground variant="leaderboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-20">
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
            Leaderboard
          </h1>
          <p 
            className={cn(typography.subtitle, "max-w-2xl mx-auto")}
          >
            See how you stack up against the world's best table tennis players
          </p>
        </div>

        {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Players"
              value={allStats.totalPlayers}
              description="Active community members"
              icon={Users}
              iconColor="blue"
              isLoading={statsLoading}
            />
            <StatCard
              title="Average Rating"
              value={allStats.averageRating}
              description="Each point earned through hard work"
              icon={Star}
              iconColor="yellow"
              isLoading={statsLoading}
            />
            <StatCard
              title="Average Games"
              value={isFinite(allStats.averageGames) ? allStats.averageGames.toLocaleString() : '0'}
              description="Every game is a challenge to yourself"
              icon={Activity}
              iconColor="green"
              isLoading={statsLoading}
            />
          </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={handleSearch}
                variant="outline"
                className="pl-10"
              />
            </div>
            
            <div className={cn("flex items-center gap-4", typography.infoText)}>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>1st Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-gray-400" />
                <span>2nd Place</span>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-amber-600" />
                <span>3rd Place</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="pb-20">
          {isPageChanging ? (
            <LeaderboardSkeleton />
          ) : (
            <Card>
            <CardHeader>
              <CardTitle>
                Rankings
              </CardTitle>
              <CardDescription>
                Current player rankings based on rating and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {debouncedSearchQuery && (!players || players.length === 0) ? (
                <div className="py-6">
                  <EmptyState
                    icon={UserX}
                    text="No players found matching your search"
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto min-h-[600px]">
                    <LeaderboardTable
                      players={players || []}
                      onPlayerClick={handlePlayerClick}
                      currentPage={currentPage}
                      playersPerPage={playersPerPage}
                    />
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-4 mt-6">
                      <div className={typography.infoText}>
                        Showing {((currentPage - 1) * playersPerPage) + 1} to {Math.min(currentPage * playersPerPage, (pagination as any)?.total || 0)} of {(pagination as any)?.total || 0} players
                      </div>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
