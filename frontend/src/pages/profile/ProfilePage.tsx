// src/components/ProfilePage.tsx

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react"; // Добавлен импорт React
import { useParams, useNavigate } from "react-router-dom";
import {
  Player,
  Tournament,
  Match,
  Achievement
} from "../../types/database";
import { apiClient } from "../../api/client";
import { Preloader } from "../../components/common/Preloader";
import { useMinimumLoadingTime } from "../../hooks/useMinimumLoadingTime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Trophy,
  TrendingUp,
  Target,
  Award,
  Calendar,
  MapPin,
  Medal,
  Star,
  Crown,
  Zap,
  Settings,
  Flame,
  // Upload, // Не используется
  Rocket,
  Shield,
  Heart,
  Users,
  Camera,
  Bell,
  CalendarDays,
  Activity,
  PlayCircle,
  Ban,
  XCircle,
  Edit,
  Swords,
  Leaf,
  TreeDeciduous,
  TreePalm,
  Orbit,
  Sparkles
} from "lucide-react";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { EmptyState } from "../../components/common/EmptyState";
import { typography } from "../../utils/typography";
import { cn } from "../../components/ui/utils";
import { EditProfileDialog } from "../../components/common/profile/modals/EditProfileDialog";
import { TournamentBracketModal } from "../../components/tournaments/modals/TournamentBracketModal";
import { MatchDetailsModal } from "../../components/tournaments/modals/MatchDetailsModal";
import { NotificationCenter } from "../../components/common/notifications/NotificationCenter";
import { PointsHistoryChart } from "../../components/common/charts/PointsHistoryChart";
import { CompetitionHistory } from "../../components/common/profile/CompetitionHistory";
// Импорты компонентов достижений
import { FoilAchievement } from "../../components/common/achievements/FoilAchievement";
import { GlassAchievement } from "../../components/common/achievements/GlassAchievement";
import { WaterAchievement } from "../../components/common/achievements/WaterAchievement";
import { HoneycombAchievement } from "../../components/common/achievements/HoneycombAchievement";
import { PixelArtAchievement } from "../../components/common/achievements/PixelArtAchievement";
import { AuroraSkyAchievement } from "../../components/common/achievements/AuroraSkyAchievement";
import { AuroraAsteroidsAchievement } from "../../components/common/achievements/AuroraAsteroidsAchievement";
import { AuroraPlanetsAchievement } from "../../components/common/achievements/AuroraPlanetsAchievement";
import { NatureAchievement } from "../../components/common/achievements/NatureAchievement";
import { TreeAchievement } from "../../components/common/achievements/TreeAchievement";
import { CosmicAchievement } from "../../components/common/achievements/CosmicAchievement";
import { CyberpunkAchievement } from "../../components/common/achievements/CyberpunkAchievement";
import { GlowingIconAchievement } from "../../components/common/achievements/GlowingIconAchievement";
import { GeometricPatternAchievement } from "../../components/common/achievements/GeometricPatternAchievement";
import { MetallicAchievement, BronzeMetallicAchievement, GoldMetallicAchievement } from "../../components/common/achievements/MetallicAchievement";
import { GlitchAchievement } from "../../components/common/achievements/GlitchAchievement";
import { MazeAchievement } from "../../components/common/achievements/MazeAchievement";
import { SwissBauhausAchievement } from "../../components/common/achievements/SwissBauhausAchievement";
import { NeonAchievement } from "../../components/common/achievements/NeonAchievement";
import { OrigamiAchievement } from "../../components/common/achievements/OrigamiAchievement";
import { LavaAchievement } from "../../components/common/achievements/LavaAchievement";
import { MosaicAchievement } from "../../components/common/achievements/MosaicAchievement";
import { JungleAchievement } from "../../components/common/achievements/JungleAchievement";
import { MatrixAchievement } from "../../components/common/achievements/MatrixAchievement";

interface ProfilePageProps {
  playerDataProp: Player; // Теперь обязательно
  isOwnProfileProp: boolean; // Теперь обязательно
  onNavigateToSettings?: () => void;
  onViewMyTournaments?: () => void;
}

export function ProfilePage({
  playerDataProp,
  isOwnProfileProp,
  onNavigateToSettings,
  onViewMyTournaments
}: ProfilePageProps) {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();

  // Прокручиваем страницу вверх при открытии (без анимации, до рендера)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [username]);
  // const [playerData, setPlayerData] = useState<Player | null | undefined>(undefined);
  // const [isOwnProfile, setIsOwnProfile] = useState(false);

  const playerData = playerDataProp;
  const isOwnProfile = isOwnProfileProp;

  // Стабилизируем playerId для предотвращения лишних ре-рендеров
  const playerId = useMemo(() => {
    if (!playerData?.id) return null;
    return typeof playerData.id === 'number' ? playerData.id : parseInt(String(playerData.id));
  }, [playerData?.id]);

  // Отслеживаем предыдущий ID для предотвращения повторных загрузок
  const prevPlayerIdRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const shouldShowLoading = useMinimumLoadingTime(isLoading);

  const [playerTournamentHistory, setPlayerTournamentHistory] = useState<Tournament[]>([]);
  const [playerRecentMatches, setPlayerRecentMatches] = useState<Match[]>([]);
  const [playerRatingHistory, setPlayerRatingHistory] = useState<Array<{ rating: number; recorded_at: string; match_id?: number }>>([]);
  const [playerAchievements, setPlayerAchievements] = useState<Achievement[]>([]);
  const [createdTournaments, setCreatedTournaments] = useState<any[]>([]);
  const [opponentsMap, setOpponentsMap] = useState<{ [key: string]: { id: string; fullName: string } }>({});
  const [tournamentsMap, setTournamentsMap] = useState<{ [key: string]: { id: string; name: string } }>({});
  const [tournamentStandings, setTournamentStandings] = useState<{ [key: string]: { rank: number } }>({});
  const [matchesMap, setMatchesMap] = useState<{ [key: string]: { tournament_name?: string; tournament_id?: number } }>({});
  const [calculatedRanks, setCalculatedRanks] = useState<{ [key: string]: number }>({});
  const [leaderboardPosition, setLeaderboardPosition] = useState<number | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<{
    name: string;
    format: Tournament["format"];
  } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const itemsPerPage = 5;

  const [clickedAchievement, setClickedAchievement] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState<{
    profile_visibility: boolean;
    stats_visibility: boolean;
    match_history_visibility: boolean;
    achievements_visibility: boolean;
  } | null>(null);


  useEffect(() => {
    // Предотвращаем повторную загрузку, если ID не изменился
    if (playerId === null || playerId === prevPlayerIdRef.current) {
      return;
    }

    prevPlayerIdRef.current = playerId;
    setIsLoading(true);

    const loadData = async () => {
      if (!playerData || playerId === null) {
        setIsLoading(false);
        return;
      }

      // Проверяем, является ли ID числом (пользователь из БД) или строкой начинающейся с "player-" (mock data)
      const playerIdStr = String(playerData.id);
      const isDbUser = !playerIdStr.startsWith('player-') && (!isNaN(parseInt(playerIdStr)) || typeof playerData.id === 'number');

      if (isDbUser) {
        // Загружаем данные из API для пользователей из БД
        try {
          console.log('Loading achievements for DB user ID:', playerId);

          // Загружаем настройки приватности (только для чужих профилей)
          if (!isOwnProfileProp) {
            try {
              const settings = await apiClient.getUserSettings(playerId);
              setPrivacySettings({
                profile_visibility: settings.profile_visibility ?? true,
                stats_visibility: settings.stats_visibility ?? true,
                match_history_visibility: settings.match_history_visibility ?? false,
                achievements_visibility: settings.achievements_visibility ?? true,
              });
              console.log('Privacy settings loaded:', settings);
            } catch (error) {
              console.error('Error loading privacy settings:', error);
              // Используем значения по умолчанию
              setPrivacySettings({
                profile_visibility: true,
                stats_visibility: true,
                match_history_visibility: false,
                achievements_visibility: true,
              });
            }
          } else {
            // Для собственного профиля показываем все
            setPrivacySettings({
              profile_visibility: true,
              stats_visibility: true,
              match_history_visibility: true,
              achievements_visibility: true,
            });
          }

          // Загружаем достижения из API
          const apiAchievements = await apiClient.getPlayerAchievements(playerId);
          console.log('API achievements received:', apiAchievements.length);

          // Конвертируем формат из API в формат компонента
          // Маппинг icon_name на иконки
          // Custom Planet icon component
          const PlanetIcon = (props: any) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
              <circle cx="12" cy="12" r="8" />
              <path d="M4.05 13c-1.7 1.8-2.5 3.5-1.8 4.5 1.1 1.9 6.4 1 11.8-2s8.9-7.1 7.7-9c-.6-1-2.4-1.2-4.7-.7" />
            </svg>
          );

          // Custom Bubbles icon component (smooth organic asteroid-like shapes)
          const BubblesIcon = (props: any) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
              {/* Large irregular organic shape top-left */}
              <path d="M 4 6 C 3.5 4.5 4.5 3 6 3 C 7.5 2.8 9 3.5 9.5 5 C 10 6.5 9.5 8 8 8.5 C 6.5 9 4.5 8.5 4 6 Z" />
              {/* Medium irregular organic shape top-right */}
              <path d="M 16 5.5 C 15.5 4.5 16.5 3.5 17.5 3.8 C 18.5 4 19.5 5 19.5 6.5 C 19.5 7.5 18.5 8.5 17 8.5 C 16 8.5 15.5 7.5 16 5.5 Z" />
              {/* Large irregular organic shape bottom-center */}
              <path d="M 9 14.5 C 8.5 13 9.5 12 11 12 C 12.5 11.8 14 12.5 14.5 14 C 15 15.5 14.5 17.5 13 18.5 C 11.5 19.5 9.5 19 9 17 C 8.5 16 8.5 15.5 9 14.5 Z" />
              {/* Small irregular organic shape bottom-right */}
              <path d="M 18.5 16.5 C 18 15.5 18.5 15 19.5 15 C 20.5 15 21 16 21 17 C 21 18 20 19 19 19 C 18 19 17.5 18 18.5 16.5 Z" />
            </svg>
          );

          const iconMap: { [key: string]: any } = {
            'Trophy': Trophy,
            'Flame': Flame,
            'Medal': Medal,
            'Crown': Crown,
            'Star': Star,
            'Zap': Zap,
            'Rocket': Rocket,
            'Shield': Shield,
            'Award': Award,
            'Users': Users,
            'Heart': Heart,
            'Target': Target,
            'Leaf': Leaf,
            'Tree': TreeDeciduous,
            'TreePalm': TreePalm,
            'Orbit': Orbit,
            'Sparkles': Sparkles,
            'Planet': PlanetIcon,
            'Bubbles': BubblesIcon
          };

          const convertedAchievements: Achievement[] = apiAchievements.map((ach: any) => ({
            id: `achievement-${ach.id}`,
            name: ach.name,
            description: ach.description || '',
            icon: iconMap[ach.icon_name] || Trophy,
            rarity: (ach.rarity || 'common') as Achievement['rarity'],
            unlocked: !!ach.unlocked_at,
            date: ach.unlocked_at ? new Date(ach.unlocked_at).toISOString().split('T')[0] : undefined
          }));

          console.log('Converted achievements:', convertedAchievements.length);
          setPlayerAchievements(convertedAchievements);

          // Загружаем созданные турниры пользователя из API
          try {
            const organizerResponse = await apiClient.getOrganizerTournaments(playerId);
            const organizerTournaments = organizerResponse.tournaments || organizerResponse || [];
            console.log('Created tournaments received:', organizerTournaments.length);
            setCreatedTournaments(organizerTournaments);
          } catch (error) {
            console.error('Error loading created tournaments from API:', error);
            setCreatedTournaments([]);
          }

          // Загружаем турниры пользователя из API
          try {
            const apiTournaments = await apiClient.getPlayerTournaments(playerId);
            console.log('API tournaments received:', apiTournaments.length);

            // Показываем все турниры в истории (upcoming, ongoing, completed, cancelled)
            // Сохраняем standings для каждого турнира
            const standingsMap: { [key: string]: { rank: number } } = {};
            apiTournaments.forEach((t: any) => {
              if (t.player_rank) {
                standingsMap[t.id.toString()] = { rank: t.player_rank };
              }
            });
            setTournamentStandings(standingsMap);

            // Используем все турниры для истории
            setPlayerTournamentHistory(apiTournaments.map((t: any) => ({
              id: t.id.toString(),
              name: t.name,
              date: t.date,
              location: t.location,
              status: t.status,
              format: t.format as Tournament['format'],
              tournamentFormat: t.format as Tournament['format'],
              participants: t.current_participants || 0,
              maxParticipants: t.max_participants || 0,
              playerRank: t.player_rank || null
            })));

            // Для завершенных турниров без player_rank загружаем данные и рассчитываем результат
            const completedTournaments = apiTournaments.filter((t: any) =>
              (t.status === 'completed' || t.status === 'cancelled') && !t.player_rank
            );

            const tournamentsWithoutRank = completedTournaments;

            if (tournamentsWithoutRank.length > 0) {
              console.log(`Calculating ranks for ${tournamentsWithoutRank.length} tournaments without player_rank...`);

              // Загружаем данные для каждого турнира и рассчитываем результат
              Promise.all(tournamentsWithoutRank.map(async (tournament: any) => {
                try {
                  const tournamentData = await apiClient.getTournament(tournament.id);
                  const tournamentInfo = tournamentData.tournament || tournamentData;
                  const matchesData = await apiClient.getTournamentMatches(tournament.id);
                  const matches = Array.isArray(matchesData) ? matchesData : (matchesData?.matches || []);

                  const completedMatches = matches.filter((m: any) => m.status === 'completed');

                  if (completedMatches.length === 0) {
                    return { tournamentId: tournament.id, rank: null };
                  }

                  let rank: number | null = null;

                  // Рассчитываем результат в зависимости от формата
                  if (tournament.format === 'round-robin') {
                    // Подсчитываем победы для каждого игрока
                    const playerStats = new Map<number, { wins: number; losses: number; pointDifference: number }>();

                    completedMatches.forEach((match: any) => {
                      if (!match.player1_id || !match.player2_id || !match.winner_id) return;

                      const loser = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;

                      if (!playerStats.has(match.winner_id)) {
                        playerStats.set(match.winner_id, { wins: 0, losses: 0, pointDifference: 0 });
                      }
                      if (!playerStats.has(loser)) {
                        playerStats.set(loser, { wins: 0, losses: 0, pointDifference: 0 });
                      }

                      const winnerStats = playerStats.get(match.winner_id)!;
                      winnerStats.wins++;

                      const loserStats = playerStats.get(loser)!;
                      loserStats.losses++;

                      // Подсчитываем разницу очков, если есть счета
                      if (match.player1_scores && match.player2_scores &&
                        Array.isArray(match.player1_scores) && Array.isArray(match.player2_scores)) {
                        let p1Points = 0, p2Points = 0;
                        for (let i = 0; i < Math.max(match.player1_scores.length, match.player2_scores.length); i++) {
                          p1Points += (match.player1_scores[i] || 0);
                          p2Points += (match.player2_scores[i] || 0);
                        }

                        if (match.winner_id === match.player1_id) {
                          winnerStats.pointDifference += (p1Points - p2Points);
                          loserStats.pointDifference += (p2Points - p1Points);
                        } else {
                          winnerStats.pointDifference += (p2Points - p1Points);
                          loserStats.pointDifference += (p1Points - p2Points);
                        }
                      }
                    });

                    // Сортируем и находим ранг текущего игрока
                    const standingsArray = Array.from(playerStats.entries()).map(([playerId, stats]) => ({
                      playerId,
                      wins: stats.wins,
                      losses: stats.losses,
                      points: stats.wins * 3,
                      pointDifference: stats.pointDifference
                    }));

                    standingsArray.sort((a, b) => {
                      if (b.points !== a.points) return b.points - a.points;
                      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
                      return b.wins - a.wins;
                    });

                    const playerIndex = standingsArray.findIndex(s => s.playerId === playerId);
                    if (playerIndex >= 0) {
                      rank = playerIndex + 1;
                    }
                  } else if (tournament.format === 'group-stage') {
                    // Определяем, прошел ли игрок в плей-офф
                    const playoffMatches = completedMatches.filter((m: any) =>
                      !m.group_name && m.round && m.round !== 'Group Stage'
                    );

                    const playoffPlayers = new Set<number>();
                    playoffMatches.forEach((match: any) => {
                      if (match.player1_id) playoffPlayers.add(match.player1_id);
                      if (match.player2_id && match.player2_id !== null) playoffPlayers.add(match.player2_id);
                    });

                    if (playoffPlayers.has(playerId)) {
                      // Игрок прошел в плей-офф - определяем результат плей-офф
                      const finalMatch = playoffMatches.find((m: any) =>
                        (m.round === 'Final' || m.round === 'Finals') && m.winner_id
                      );

                      if (finalMatch) {
                        if (finalMatch.winner_id === playerId) {
                          rank = 1;
                        } else if ((finalMatch.player1_id === playerId || finalMatch.player2_id === playerId)) {
                          rank = 2;
                        }
                      }

                      if (!rank) {
                        // Определяем раунд выбытия
                        const roundsOrder = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
                        for (const round of roundsOrder) {
                          const roundMatches = playoffMatches.filter((m: any) => m.round === round);
                          for (const match of roundMatches) {
                            if (match.winner_id && match.player1_id && match.player2_id) {
                              const loser = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
                              if (loser === playerId) {
                                if (round === 'Semifinals') rank = 3;
                                else if (round === 'Quarterfinals') rank = 5;
                                else if (round === 'Round of 16') rank = 9;
                                else if (round === 'Round of 32') rank = 17;
                                break;
                              }
                            }
                          }
                          if (rank) break;
                        }
                      }
                    } else {
                      // Игрок не прошел в плей-офф - выбыл на групповом этапе
                      rank = 999;
                    }
                  } else if (tournament.format === 'single-elimination') {
                    // Логика для single-elimination
                    const finalMatch = completedMatches.find((m: any) =>
                      (m.round === 'Final' || m.round === 'Finals') && m.winner_id
                    );

                    if (finalMatch) {
                      if (finalMatch.winner_id === playerId) {
                        rank = 1;
                      } else if ((finalMatch.player1_id === playerId || finalMatch.player2_id === playerId)) {
                        rank = 2;
                      }
                    }

                    if (!rank) {
                      // Определяем раунд выбытия
                      const roundsOrder = ['Final', 'Semifinals', 'Quarterfinals', 'Round of 16', 'Round of 32'];
                      for (const round of roundsOrder) {
                        const roundMatches = completedMatches.filter((m: any) => m.round === round);
                        for (const match of roundMatches) {
                          if (match.winner_id && match.player1_id && match.player2_id) {
                            const loser = match.player1_id === match.winner_id ? match.player2_id : match.player1_id;
                            if (loser === playerId) {
                              if (round === 'Semifinals') rank = 3;
                              else if (round === 'Quarterfinals') rank = 5;
                              else if (round === 'Round of 16') rank = 9;
                              else if (round === 'Round of 32') rank = 17;
                              break;
                            }
                          }
                        }
                        if (rank) break;
                      }
                    }
                  }

                  return { tournamentId: tournament.id, rank };
                } catch (err) {
                  console.error(`Error calculating rank for tournament ${tournament.id}:`, err);
                  return { tournamentId: tournament.id, rank: null };
                }
              })).then((results) => {
                const ranksMap: { [key: string]: number } = {};
                results.forEach((result) => {
                  if (result.rank !== null) {
                    ranksMap[result.tournamentId.toString()] = result.rank;
                  }
                });

                if (Object.keys(ranksMap).length > 0) {
                  console.log('Calculated ranks:', ranksMap);
                  setCalculatedRanks(prev => ({ ...prev, ...ranksMap }));
                  // Обновляем standings
                  setTournamentStandings(prev => {
                    const updated = { ...prev };
                    Object.entries(ranksMap).forEach(([tournamentId, rank]) => {
                      updated[tournamentId] = { rank };
                    });
                    return updated;
                  });
                }
              }).catch((err) => {
                console.error('Error calculating ranks:', err);
              });
            }
          } catch (error) {
            console.error('Error loading tournaments from API:', error);
            setPlayerTournamentHistory([]);
          }

          // Загружаем историю рейтинга из API
          try {
            const ratingHistory = await apiClient.getPlayerRatingHistory(playerId);
            console.log('[ProfilePage] ========================================');
            console.log('[ProfilePage] API rating history received:', ratingHistory.length, 'points');

            // Анализ tournament_id в полученных данных
            const tournamentIds = ratingHistory.map((r: any) => r.tournament_id).filter((id: any) => id != null);
            const uniqueTournamentIds = [...new Set(tournamentIds)];
            const nullTournamentCount = ratingHistory.filter((r: any) => r.tournament_id == null).length;

            console.log('[ProfilePage] Rating history analysis:');
            console.log('  Total points from API:', ratingHistory.length);
            console.log('  Points with tournament_id:', tournamentIds.length);
            console.log('  Points without tournament_id (null):', nullTournamentCount);
            console.log('  Unique tournament IDs:', uniqueTournamentIds);
            console.log('  Number of unique tournaments:', uniqueTournamentIds.length);

            // Сравнение с количеством турниров игрока
            console.log('[ProfilePage] Player tournament history length:', playerTournamentHistory.length);
            const tournamentIdsFromHistory = playerTournamentHistory.map(t => t.id);
            console.log('[ProfilePage] Tournament IDs from player history:', tournamentIdsFromHistory);

            // Находим турниры без записей рейтинга
            const tournamentsWithoutRating = tournamentIdsFromHistory.filter(tid => !uniqueTournamentIds.includes(tid));
            if (tournamentsWithoutRating.length > 0) {
              console.warn('[ProfilePage] ⚠️  Tournaments without rating history:', tournamentsWithoutRating);
            }

            console.log('[ProfilePage] API rating history data (first 5):', ratingHistory.slice(0, 5));

            if (ratingHistory && ratingHistory.length > 0) {
              const ratings = ratingHistory.map(r => r.rating);
              const uniqueRatings = new Set(ratings);
              const minRating = Math.min(...ratings);
              const maxRating = Math.max(...ratings);
              console.log('Rating stats:', {
                min: minRating,
                max: maxRating,
                unique: uniqueRatings.size,
                allSame: uniqueRatings.size === 1
              });

              if (uniqueRatings.size === 1) {
                console.warn('⚠️ WARNING: All ratings are the same!', Array.from(uniqueRatings)[0]);
              }
            }

            setPlayerRatingHistory(ratingHistory || []);
          } catch (error) {
            console.error('Error loading rating history from API:', error);
            setPlayerRatingHistory([]);
          }

          // Загружаем матчи пользователя из API
          try {
            const apiMatches = await apiClient.getPlayerMatches(playerId);
            console.log('API matches received:', apiMatches.length);

            // Сохраняем tournament_name и tournament_id из API для каждого матча
            const matchesDataMap: { [key: string]: { tournament_name?: string; tournament_id?: number } } = {};
            apiMatches.forEach((m: any) => {
              if (m.id && m.tournament_name) {
                matchesDataMap[m.id.toString()] = {
                  tournament_name: m.tournament_name,
                  tournament_id: m.tournament_id
                };
              }
            });
            setMatchesMap(matchesDataMap);

            const convertedMatches = apiMatches.map((m: any) => ({
              id: m.id.toString(),
              tournamentId: m.tournament_id?.toString() || m.tournament_id?.toString() || '',
              player1Id: m.player1_id?.toString() || '',
              player2Id: m.player2_id?.toString() || '',
              winnerId: m.winner_id?.toString() || null,
              // Дата матча = дата турнира
              matchDate: m.match_date || m.tournament_date || '',
              tournamentDate: m.tournament_date || '',
              status: m.status || 'scheduled',
              round: m.round || '',
              scores: m.scores && m.scores.player1 && m.scores.player2
                ? m.scores
                : {
                  player1: Array.isArray(m.player1_scores)
                    ? m.player1_scores
                    : (m.player1_scores ? [m.player1_scores] : []),
                  player2: Array.isArray(m.player2_scores)
                    ? m.player2_scores
                    : (m.player2_scores ? [m.player2_scores] : [])
                }
            })).sort((a, b) => {
              // Сортируем по дате турнира, затем по ID матча
              const timeA = a.matchDate || a.tournamentDate ? new Date(a.matchDate || a.tournamentDate).getTime() : 0;
              const timeB = b.matchDate || b.tournamentDate ? new Date(b.matchDate || b.tournamentDate).getTime() : 0;
              
              if (timeA !== timeB) {
                return timeB - timeA; // Новые турниры первыми
              }
              
              // При одинаковой дате сортируем по ID матча (большие ID = более поздние матчи)
              const idA = parseInt(a.id) || 0;
              const idB = parseInt(b.id) || 0;
              return idB - idA;
            });

            setPlayerRecentMatches(convertedMatches);

            // Загружаем данные оппонентов из API
            const opponentIds = new Set<string>();
            const tournamentIds = new Set<string>();

            convertedMatches.forEach((match) => {
              if (match.player1Id && match.player1Id !== playerData.id.toString()) {
                opponentIds.add(match.player1Id);
              }
              if (match.player2Id && match.player2Id !== playerData.id.toString()) {
                opponentIds.add(match.player2Id);
              }
              if (match.tournamentId) {
                tournamentIds.add(match.tournamentId);
              }
            });

            // Загружаем оппонентов
            const opponentsData: { [key: string]: { id: string; fullName: string } } = {};
            for (const oppId of opponentIds) {
              try {
                const opponent = await apiClient.getPlayer(parseInt(oppId));
                opponentsData[oppId] = {
                  id: oppId,
                  fullName: opponent.full_name || `Player ${oppId}`
                };
              } catch (error) {
                console.error(`Error loading opponent ${oppId}:`, error);
                opponentsData[oppId] = {
                  id: oppId,
                  fullName: `Player ${oppId}`
                };
              }
            }
            setOpponentsMap(opponentsData);

            // Загружаем турниры из API (используем tournament_name из матчей, но загружаем дополнительную информацию)
            const tournamentsData: { [key: string]: { id: string; name: string } } = {};

            // Сначала извлекаем tournament_name из матчей
            apiMatches.forEach((m: any) => {
              if (m.tournament_id && m.tournament_name) {
                tournamentsData[m.tournament_id.toString()] = {
                  id: m.tournament_id.toString(),
                  name: m.tournament_name
                };
              }
            });

            // Затем загружаем недостающие турниры
            for (const tourId of tournamentIds) {
              if (!tournamentsData[tourId]) {
                try {
                  const tournament = await apiClient.getTournament(parseInt(tourId));
                  console.log(`Loaded tournament ${tourId}:`, tournament.name);
                  tournamentsData[tourId] = {
                    id: tourId,
                    name: tournament.name || `Tournament ${tourId}`
                  };
                } catch (error) {
                  console.error(`Error loading tournament ${tourId}:`, error);
                  tournamentsData[tourId] = {
                    id: tourId,
                    name: `Tournament ${tourId}`
                  };
                }
              }
            }
            console.log('Tournaments map:', tournamentsData);
            setTournamentsMap(tournamentsData);
          } catch (error) {
            console.error('Error loading matches from API:', error);
            setPlayerRecentMatches([]);
          }

          // Load leaderboard position
          try {
            const allPlayersResponse = await apiClient.getPlayers({
              sort: 'rating',
              order: 'DESC',
              limit: 10000
            });
            const allPlayers = allPlayersResponse.players || allPlayersResponse || [];

            // Find current player's position in leaderboard
            const playerIndex = allPlayers.findIndex((p: any) => p.id === playerId);
            if (playerIndex >= 0) {
              // Calculate rank (handle ties - players with same rating get same rank)
              let rank = 1;
              for (let i = 0; i < allPlayers.length; i++) {
                if (i === playerIndex) {
                  // Found the player, calculate their rank
                  if (i === 0) {
                    rank = 1;
                  } else {
                    // Count how many players have higher rating
                    let higherRatingCount = 0;
                    for (let j = 0; j < i; j++) {
                      if (allPlayers[j].rating > allPlayers[i].rating) {
                        higherRatingCount++;
                      }
                    }
                    rank = higherRatingCount + 1;
                  }
                  break;
                }
              }
              setLeaderboardPosition(rank);
              console.log(`Leaderboard position for player ${playerId}: ${rank}`);
            }
          } catch (error) {
            console.error('Error loading leaderboard position:', error);
          }
        } catch (error) {
          console.error('Error loading achievements from API:', error);
          setPlayerAchievements([]);
          setPlayerTournamentHistory([]);
          setPlayerRecentMatches([]);
        }
      } else {
        // Если нет playerId, очищаем данные
        setPlayerTournamentHistory([]);
        setPlayerRecentMatches([]);
        setPlayerAchievements([]);
        setCreatedTournaments([]);
      }

      setIsLoading(false);
    };

    loadData().catch((error) => {
      console.error('Error in loadData:', error);
      setIsLoading(false);
    });
  }, [playerId, isOwnProfileProp]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isOwnProfile || !playerData) return;

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/i)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    try {
      // Upload avatar
      const uploadResult = await apiClient.uploadUserAvatar(file);

      if (!uploadResult.imageUrl) {
        throw new Error('Failed to get image URL from server');
      }

      // Update player's avatar_url in database
      await apiClient.updatePlayer(parseInt(playerData.id), {
        username: playerData.username,
        full_name: playerData.fullName,
        email: playerData.email,
        country: playerData.country,
        avatar_url: uploadResult.imageUrl,
        bio: playerData.bio || null,
        playing_style: playerData.playingStyle || null,
        favorite_shot: playerData.favoriteShot || null,
      });

      // Reload page to show updated avatar
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Failed to upload avatar. Please try again.');
    }

    // Reset input
    e.target.value = '';
  };

  const handleSave = async (data: { username: string; name: string; country: string; bio: string }) => {
    if (!isOwnProfile || !playerData) return;

    try {
      // Проверяем, является ли пользователь пользователем из БД
      const playerIdStr = String(playerData.id);
      const isDbUser = !playerIdStr.startsWith('player-') && (!isNaN(parseInt(playerIdStr)) || typeof playerData.id === 'number');

      if (isDbUser) {
        // Сохраняем изменения через API
        const playerId = typeof playerData.id === 'number' ? playerData.id : parseInt(playerIdStr);

        await apiClient.updatePlayer(playerId, {
          username: data.username,
          full_name: data.name,
          email: playerData.email || '', // Используем существующий email
          country: data.country,
          avatar_url: playerData.avatar || null, // Сохраняем существующий аватар
          bio: data.bio || null,
          playing_style: playerData.playingStyle || null,
          favorite_shot: playerData.favoriteShot || null,
        });

        // Перезагружаем страницу, чтобы показать обновленные данные
        window.location.reload();
      } else {
        // Для mock пользователей просто показываем сообщение
        alert("Profile updated (mock user - changes are not persisted)");
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    }
  };

  // Calculate wins and losses from actual matches data (fallback if DB stats are outdated)
  // MUST be before any conditional returns to follow Rules of Hooks
  const calculatedStats = useMemo(() => {
    const playerIdStr = playerData?.id?.toString() || '';
    let wins = 0;
    let losses = 0;

    playerRecentMatches.forEach((match) => {
      if (match.winnerId && match.winnerId === playerIdStr) {
        wins++;
      } else if (match.winnerId && match.winnerId !== playerIdStr) {
        losses++;
      }
    });

    return { wins, losses };
  }, [playerRecentMatches, playerData?.id]);

  // Prefer DB stats (they should be up-to-date thanks to trigger),
  // but use calculated stats as fallback if DB stats seem incorrect
  const dbWins = playerData?.wins || 0;
  const dbLosses = playerData?.losses || 0;
  const calculatedWins = calculatedStats.wins;
  const calculatedLosses = calculatedStats.losses;

  // Use calculated stats if they differ significantly from DB (DB might be outdated)
  // Otherwise trust the DB (it's faster and should be accurate with trigger)
  const useCalculated = playerRecentMatches.length > 0 &&
    (Math.abs(calculatedWins - dbWins) > 0 || Math.abs(calculatedLosses - dbLosses) > 0);

  const totalWins = useCalculated ? calculatedWins : dbWins;
  const totalLosses = useCalculated ? calculatedLosses : dbLosses;
  const totalGames = totalWins + totalLosses;
  const winRate = totalGames > 0
    ? (totalWins / totalGames) * 100
    : (playerData?.winRate || 0);

  // Streaks are stored in DB and updated by trigger, use DB values with fallback to 0
  const currentStreak = playerData?.currentStreak ?? 0;
  const bestStreak = playerData?.bestStreak ?? 0;

  // Calculate Best Ranking from all completed tournaments
  // Best Ranking = minimum rank (lower number is better)
  const bestRanking = useMemo(() => {
    const ranks: number[] = [];

    // Get ranks from tournament standings
    playerTournamentHistory.forEach((tournament) => {
      // Only count completed tournaments
      if (tournament.status === 'completed' || tournament.status === 'cancelled') {
        const playerRank =
          (tournament as any).playerRank ||
          tournamentStandings[tournament.id]?.rank ||
          calculatedRanks[tournament.id];

        if (playerRank && playerRank > 0 && playerRank !== 999) {
          ranks.push(playerRank);
        }
      }
    });

    // Return minimum rank (best ranking), or fallback to DB value
    if (ranks.length > 0) {
      return Math.min(...ranks);
    }

    // Fallback to DB value if no tournament ranks found
    return playerData?.bestRanking ?? null;
  }, [playerTournamentHistory, tournamentStandings, calculatedRanks, playerData?.bestRanking]);

  // Calculate number of tournaments won (rank = 1)
  const tournamentsWon = useMemo(() => {
    let wonCount = 0;

    playerTournamentHistory.forEach((tournament) => {
      // Only count completed tournaments
      if (tournament.status === 'completed' || tournament.status === 'cancelled') {
        const playerRank =
          (tournament as any).playerRank ||
          tournamentStandings[tournament.id]?.rank ||
          calculatedRanks[tournament.id];

        // Count tournaments where player got 1st place
        if (playerRank === 1) {
          wonCount++;
        }
      }
    });

    return wonCount;
  }, [playerTournamentHistory, tournamentStandings, calculatedRanks]);

  if (shouldShowLoading) {
    return <Preloader />;
  }

  if (!playerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Player profile not found.</p>
        <Button variant="link" onClick={() => navigate('/leaderboard')}>Go to Leaderboard</Button>
      </div>
    );
  }

  // Проверка приватности профиля (только для чужих профилей)
  const isProfilePrivate = !isOwnProfile && privacySettings && !privacySettings.profile_visibility;
  const canViewStats = isOwnProfile || (privacySettings?.stats_visibility ?? true);
  // История матчей всегда видна для всех игроков
  const canViewMatchHistory = true;
  const canViewAchievements = isOwnProfile || (privacySettings?.achievements_visibility ?? true);


  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-gray-100 shadow-lg shadow-gray-400/50 dark:shadow-gray-600/50";
      case "uncommon": return "bg-gradient-to-br from-emerald-300 via-green-400 to-emerald-300 dark:from-emerald-600 dark:via-green-500 dark:to-emerald-600 border-green-500 dark:border-green-400 text-green-950 dark:text-green-50 shadow-lg shadow-green-500/50";
      case "rare": return "bg-gradient-to-br from-blue-300 via-cyan-400 to-blue-300 dark:from-blue-600 dark:via-cyan-500 dark:to-blue-600 border-blue-500 dark:border-cyan-400 text-blue-950 dark:text-blue-50 shadow-lg shadow-blue-500/50";
      case "epic": return "bg-gradient-to-br from-purple-400 via-pink-500 to-purple-400 dark:from-purple-600 dark:via-pink-600 dark:to-purple-600 border-purple-600 dark:border-pink-500 text-purple-950 dark:text-purple-50 shadow-lg shadow-purple-500/50";
      case "legendary": return "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-300 dark:from-amber-500 dark:via-yellow-500 dark:to-amber-500 border-amber-600 dark:border-yellow-400 text-amber-950 dark:text-yellow-50 shadow-xl shadow-amber-500/60";
      default: return "";
    }
  };

  const handleAchievementClick = (id: string, unlocked: boolean) => {
    if (unlocked && !isAnimating) {
      const numericId = parseInt(id.split('-')[1] || '0');
      setClickedAchievement(numericId);
      setIsAnimating(true);
      setTimeout(() => {
        setClickedAchievement(null);
        setIsAnimating(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="profile" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start md:items-center">
              <div className="relative group mx-auto md:mx-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-500 to-purple-500 dark:from-primary dark:via-blue-500 dark:to-purple-500 light:from-amber-500 light:via-orange-500 light:to-rose-500 rounded-full blur-lg opacity-50 animate-pulse" />
                <div className="relative p-1 bg-gradient-to-br from-primary via-blue-500 to-purple-500 dark:p-0 dark:from-primary dark:via-blue-500 dark:to-purple-500 light:from-amber-500 light:via-orange-500 light:to-rose-500 rounded-full">
                  <div className=" bg-white rounded-full overflow-hidden dark:hidden">
                    <Avatar className="w-32 h-32">
                      {playerData.avatar && <AvatarImage src={playerData.avatar} alt={playerData.fullName} className="scale-110" />}
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-blue-500/20">{playerData.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="rounded-full overflow-hidden hidden dark:block">
                    <Avatar className="w-32 h-32">
                      {playerData.avatar && <AvatarImage src={playerData.avatar} alt={playerData.fullName} className="scale-110" />}
                      <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/20 to-blue-500/20">{playerData.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                {isOwnProfile && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                )}
                <div className={cn("absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-semibold shadow-lg", typography.infoText.replace("text-muted-foreground", "text-primary-foreground"))}>#{leaderboardPosition !== null ? leaderboardPosition : (playerData.rank > 0 ? playerData.rank : (playerData.ranking > 0 ? playerData.ranking : 'N/A'))}</div>
              </div>
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="mx-auto md:mx-0">
                    <h1 className={cn(typography.profileName, "mb-2")}>{playerData.fullName}</h1>
                    <p className={cn(typography.profileUsername, "mb-3")}>@{playerData.username}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <Badge variant="outline" className="flex items-center gap-1"><MapPin className="w-3 h-3" />{playerData.country}</Badge>
                      <Badge variant="secondary" className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {playerData.joinDate ? (playerData.joinDate.includes('T') ? playerData.joinDate.split('T')[0] : playerData.joinDate) : 'N/A'}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {isOwnProfile ? (
                      <>
                        <Button onClick={() => setIsEditDialogOpen(true)} className="w-full sm:w-auto"><Edit className="w-4 h-4 mr-2" />Edit Profile</Button>
                        {onViewMyTournaments && <Button variant="outline" onClick={onViewMyTournaments} className="w-full sm:w-auto hover:underline"><Trophy className="w-4 h-4 mr-2" />My Tournaments</Button>}
                        {onNavigateToSettings && <Button variant="outline" onClick={onNavigateToSettings} className="w-full sm:w-auto hover:underline"><Settings className="w-4 h-4 mr-2" />Settings</Button>}
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => navigate('/leaderboard')} className="w-full sm:w-auto hover:underline">Back to Leaderboard</Button>
                    )}
                  </div>
                </div>
                {playerData.bio && <p className={cn(typography.profileBio, "mt-4")}>{playerData.bio}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Проверка приватности профиля */}
        {isProfilePrivate ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Private Profile</h3>
              <p className="text-muted-foreground">
                This player has set their profile to private. Profile information is not available.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger value="notifications">
                    Notifications
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Performance Overview */}
                {canViewStats ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Overview</CardTitle>
                      <CardDescription>Competitive statistics for {playerData.fullName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        <div className="text-center p-4 rounded-lg bg-input-background "><Swords className="w-8 h-8 text-purple-500 mx-auto mb-2" /><div className={typography.profileStatValue}>{totalWins}</div><p className={typography.profileStatLabel}>Match Wins</p></div>
                        <div className="text-center p-4 rounded-lg bg-input-background "><Target className="w-8 h-8 text-blue-500 mx-auto mb-2" /><div className={typography.profileStatValue}>{Math.round(winRate)}%</div><p className={typography.profileStatLabel}>Win Rate</p></div>
                        <div className="text-center p-4 rounded-lg bg-input-background "><Trophy className="w-8 h-8 text-primary mx-auto mb-2" /><div className={typography.profileStatValue}>{tournamentsWon}</div><p className={typography.profileStatLabel}>Tournaments Won</p></div>
                        <div className="text-center p-4 rounded-lg bg-primary/10 border-2 border-primary/30"><Star className="w-8 h-8 text-primary mx-auto mb-2" /><div className={cn(typography.profileStatValue, "text-primary")}>{playerData.rating}</div><p className={typography.profileStatLabel}>Current Rating</p></div>
                        <div className="text-center p-4 rounded-lg bg-input-background "><Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" /><div className={typography.profileStatValue}>{currentStreak}</div><p className={typography.profileStatLabel}>Current Streak</p></div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                        <div className="text-center p-4 rounded-lg border"><div className={typography.profileStatValueLarge}>{bestStreak}</div><p className={typography.profileStatLabel}>Best Win Streak</p></div>
                        <div className="text-center p-4 rounded-lg border"><div className={typography.profileStatValueLarge}>{playerTournamentHistory.length}</div><p className={typography.profileStatLabel}>Tournaments Played</p></div>
                        <div className="text-center p-4 rounded-lg border"><div className={typography.profileStatValueLarge}>{totalGames || playerData.gamesPlayed || 0}</div><p className={typography.profileStatLabel}>Games Played</p></div>
                        <div className="text-center p-4 rounded-lg border"><div className={typography.profileStatValueLarge}>{bestRanking !== null && bestRanking !== undefined ? bestRanking : 'N/A'}</div><p className={typography.profileStatLabel}>Best Ranking</p></div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2 cursor-default">Statistics Hidden</h3>
                      <p className={typography.profileBio}>
                        This player has chosen to keep their statistics private.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Points History Chart */}
                {canViewStats && (
                  <PointsHistoryChart
                    matches={playerRecentMatches}
                    currentRating={playerData.rating}
                    playerId={String(playerData.id)}
                    ratingHistory={playerRatingHistory}
                  />
                )}

                {/* Competition History */}
                {canViewMatchHistory ? (
                  <CompetitionHistory
                    playerData={playerData}
                    playerTournamentHistory={playerTournamentHistory}
                    playerRecentMatches={playerRecentMatches}
                    tournamentStandings={tournamentStandings}
                    calculatedRanks={calculatedRanks}
                    opponentsMap={opponentsMap}
                    tournamentsMap={tournamentsMap}
                    matchesMap={matchesMap}
                    itemsPerPage={itemsPerPage}
                  />
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2 cursor-default">Match History Hidden</h3>
                      <p className={typography.profileBio}>
                        This player has chosen to keep their match history private.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6 mt-6">
                {canViewAchievements ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle>Achievements</CardTitle>
                            <Badge variant="secondary">{playerAchievements.filter(a => a.unlocked).length} of {playerAchievements.length}</Badge>
                          </div>
                          <CardDescription>Your accomplishments and milestones</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/achievement-designs')}
                          className="shrink-0"
                        >
                          View Designs
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className={playerAchievements.length === 0 ? "pt-6" : ""}>
                      {/* ---> ИСПРАВЛЕННЫЙ ТЕРНАРНЫЙ ОПЕРАТОР <--- */}
                      {playerAchievements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(() => {
                            const displayOrderMap: Record<string, number> = {
                              'Nature Walker': 1,
                              'Forest Guardian': 2,
                              'Jungle Explorer': 3,
                              'First Victory': 4,
                              'Legend': 5,
                              'Match Master': 6,
                              'Regular Player': 7,
                              'Community Member': 8,
                              'Tournament Enthusiast': 9
                            };

                            const orderedAchievements = [...playerAchievements].sort((a, b) => {
                              const orderA = displayOrderMap[a.name] ?? 1000;
                              const orderB = displayOrderMap[b.name] ?? 1000;
                              if (orderA !== orderB) return orderA - orderB;
                              return a.name.localeCompare(b.name);
                            });

                            return orderedAchievements.map((achievement, index) => {
                              const isClicked = clickedAchievement === parseInt(achievement.id.split('-')[1] || '0');
                              // Use NatureAchievement (style 6) for Newcomer, TreeAchievement for Veteran, otherwise use index-based style
                              const specialStyles: Record<string, number> = {
                                'Nature Walker': 6,
                                'Forest Guardian': 19,
                                'Jungle Explorer': 23,
                                'First Victory': 5,
                                'Legend': 24,
                                'Match Master': 25,
                                'Regular Player': 21,
                                'Community Member': 11,
                                'Tournament Enthusiast': 22,
                                'Path Finder': 20,
                                'Scout': 26,
                                'Champion': 2,
                                'Paper Champion': 16,
                                'Undefeated': 15
                              };
                              const style = specialStyles[achievement.name] ?? index % 18;
                              const onClickHandler = () => handleAchievementClick(achievement.id, achievement.unlocked ?? false);

                              switch (style) {
                                case 0: return <FoilAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 1: return <GlassAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 2: return <WaterAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 3: return <HoneycombAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 4: return <PixelArtAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 5: return <AuroraSkyAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 6: return <NatureAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 7: return <CosmicAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 8: return <CyberpunkAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 9: return <GlowingIconAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 10: return <GeometricPatternAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 11: return <MetallicAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 12: return <GlitchAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 13: return <MazeAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 14: return <SwissBauhausAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 15: return <NeonAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 16: return <OrigamiAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 17: return <LavaAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 19: return <TreeAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 20: return <MatrixAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 21: return <BronzeMetallicAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 22: return <GoldMetallicAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 23: return <JungleAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 24: return <AuroraAsteroidsAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 25: return <AuroraPlanetsAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                case 26: return <MosaicAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                                default: return <MosaicAchievement key={achievement.id} achievement={achievement} onClick={onClickHandler} isClicked={isClicked} isAnimating={isAnimating} />;
                              }
                            });
                          })()}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Award}
                          text="No achievements found for this player."
                        />
                      )}
                      {/* ---> КОНЕЦ ИСПРАВЛЕНИЯ <--- */}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Achievements Hidden</h3>
                      <p className="text-muted-foreground">
                        This player has chosen to keep their achievements private.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Notifications Tab - только для собственного профиля */}
              {isOwnProfile && (
                <TabsContent value="notifications" className="space-y-6 mt-6">
                  <NotificationCenter
                    userId={typeof playerData.id === 'number' ? playerData.id : parseInt(String(playerData.id))}
                  />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </div>

      {/* Модальные окна */}
      {isOwnProfile && (
        <EditProfileDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          currentData={{
            username: playerData.username,
            name: playerData.fullName,
            country: playerData.country,
            bio: playerData.bio || "",
          }}
          onSave={handleSave}
        />
      )}
      {selectedTournament && (
        <TournamentBracketModal
          open={!!selectedTournament}
          onOpenChange={(open) => !open && setSelectedTournament(null)}
          tournamentName={selectedTournament.name}
          format={selectedTournament.format}
        />
      )}
      {/* ---> ИСПРАВЛЕНА ПРОВЕРКА ДАТЫ И ДОБАВЛЕНЫ ?. <--- */}
      {selectedMatch && (
        <MatchDetailsModal
          open={!!selectedMatch}
          onOpenChange={(open) => !open && setSelectedMatch(null)}
          match={{
            opponent: selectedMatch ? (opponentsMap[selectedMatch.player1Id === playerData.id ? selectedMatch.player2Id : selectedMatch.player1Id]?.fullName || 'Opponent') : 'Opponent',
            result: selectedMatch?.winnerId ? (selectedMatch?.winnerId === playerData.id ? 'win' : 'loss') : 'loss',
            score: selectedMatch?.scores?.player1?.map((s1, i) => {
              const s2 = selectedMatch?.scores?.player2?.[i];
              if (s2 === undefined) return '';
              return selectedMatch?.player1Id === playerData.id ? `${s1}-${s2}` : `${s2}-${s1}`;
            }).join(', ') ?? 'N/A',
            tournament: selectedMatch?.tournamentId ? (tournamentsMap[selectedMatch.tournamentId]?.name || matchesMap[selectedMatch.id]?.tournament_name || 'Tournament') : 'Tournament',
            date: selectedMatch?.matchDate || selectedMatch?.tournamentDate ? new Date(selectedMatch.matchDate || selectedMatch.tournamentDate).toLocaleDateString() : 'Date N/A'
          }}
        />
      )}
      {/* ---> КОНЕЦ ИСПРАВЛЕНИЯ <--- */}
    </div>
  );
}