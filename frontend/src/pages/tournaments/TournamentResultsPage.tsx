import React, { useState, useEffect, useRef, useLayoutEffect } from "react";

import { Button } from "../../components/ui/button";
import { Preloader } from "../../components/common/Preloader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "../../components/ui/card";
import { ArrowLeft, Trophy, Download, FileText, Loader2, Award, Table, Network } from "lucide-react";
import { SingleEliminationBracket } from "../../components/tournaments/TournamentBracket";
import { RoundRobinTable } from "../../components/tournaments/RoundRobinTable";
import { GroupStandingsTable } from "../../components/tournaments/GroupStandingsTable";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { apiClient } from "../../api/client";
import { TournamentRankingsTable } from "../../components/common/leaderboard/LeaderboardApi";
import { EmptyState } from "../../components/common/EmptyState";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
// 2. Старый генератор PDF нам больше не нужен
// import { generateStandingsPdf } from "../../utils/resultsPdfGenerator";

interface TournamentResultsPageProps {
  onBack: () => void;
  tournamentId: number;
  tournamentFormat: "single-elimination" | "round-robin" | "group-stage";
}

export function TournamentResultsPage({ onBack, tournamentId, tournamentFormat }: TournamentResultsPageProps) {
  // Add spin animation to the component
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [selectedPlayerForCertificate, setSelectedPlayerForCertificate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // 3. Состояние для загрузки PDF
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false); // Состояние для загрузки сертификата
  const [tournament, setTournament] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [matchFormat, setMatchFormat] = useState<"best-of-1" | "best-of-3" | "best-of-5">("best-of-5");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [groupStage, setGroupStage] = useState<"groups" | "playoffs">("groups");
  
  // 4. Ref для таблицы, которую будем "скриншотить"
  const standingsTableRef = useRef<HTMLDivElement>(null);
  // 5. Ref для Card, чтобы получить ее цвет фона
  const standingsCardRef = useRef<HTMLDivElement>(null);

  // 6. Определяем тему для html2canvas
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkTheme();
    const obs = new MutationObserver(checkTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  
  // Format score from API format to display format
  const formatScore = (player1Scores: number[] | null, player2Scores: number[] | null): string => {
    if (!player1Scores || !player2Scores || player1Scores.length === 0 || player2Scores.length === 0) {
      return "";
    }
    return player1Scores.map((s1, i) => {
      const s2 = player2Scores[i] || 0;
      return `${s1}-${s2}`;
    }).join(", ");
  };

  // Process matches for bracket display
  const processMatches = (matchesList: any[]) => {
    return matchesList
      .sort((a, b) => {
        const roundOrder = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Quarter-finals', 'Semifinals', 'Semi-finals', 'Finals', 'Final'];
        const aRound = a.round || '';
        const bRound = b.round || '';
        const aIndex = roundOrder.findIndex(r => aRound.toLowerCase().includes(r.toLowerCase().replace(/[^a-z]/g, '')));
        const bIndex = roundOrder.findIndex(r => bRound.toLowerCase().includes(r.toLowerCase().replace(/[^a-z]/g, '')));
        if (aIndex !== bIndex && aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        return (a.match_number || a.id || 0) - (b.match_number || b.id || 0);
      })
      .map(match => {
        const player1 = (match.player1_id && (match.player1_name || match.player1_username)) 
          ? (match.player1_name || match.player1_username) 
          : (match.player1_id ? `Player ${match.player1_id}` : "TBD");
        
        // BYE только для первого раунда (когда действительно нет соперника из-за нечетного количества игроков)
        // В более поздних раундах (Semifinals, Final) если player2_id = null, это TBD (игрок еще не определен)
        const round = match.round || '';
        const isFirstRound = round.includes('Quarter') || round.includes('Round of 16') || round.includes('Round of 32') || round.includes('First Round');
        const player2 = (match.player2_id && (match.player2_name || match.player2_username)) 
          ? (match.player2_name || match.player2_username)
          : (match.player2_id ? `Player ${match.player2_id}` : (match.player1_id && isFirstRound ? "BYE" : "TBD"));
        const winner = match.winner_name || match.winner_username || "";
        const score = formatScore(match.player1_scores, match.player2_scores);
        
        return {
          id: match.id,
          round: match.round || '',
          player1,
          player2,
          score,
          winner,
        };
      });
  };

  // Load tournament data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load tournament details
        const tournamentData = await apiClient.getTournament(tournamentId);
        const tournamentInfo = tournamentData.tournament || tournamentData;
        setTournament(tournamentInfo);
        
        // For live/ongoing tournaments, set active tab to overview
        if (tournamentInfo?.status === "live" || tournamentInfo?.status === "ongoing") {
          setActiveTab("overview");
        }
        
        // Set match format
        if (tournamentInfo?.match_format) {
          const format = (tournamentInfo.match_format || "").toLowerCase();
          if (format === "best-of-1" || format === "best_of_1" || format === "1") {
            setMatchFormat("best-of-1");
          } else if (format === "best-of-3" || format === "best_of_3" || format === "3") {
            setMatchFormat("best-of-3");
          } else if (format === "best-of-5" || format === "best_of_5" || format === "5") {
            setMatchFormat("best-of-5");
          } else {
            // Default fallback
            setMatchFormat("best-of-5");
          }
        }
        
        // Load matches
        const matchesData = await apiClient.getTournamentMatches(tournamentId);
        const matchesList = matchesData.matches || matchesData || [];
        setMatches(matchesList);
        
        // Load participants to get full player data (country, avatar, etc.)
        let participantsList: any[] = [];
        try {
          const participantsData = await apiClient.getTournamentParticipants(tournamentId);
          participantsList = Array.isArray(participantsData) 
            ? participantsData 
            : (participantsData?.participants || []);
        } catch (err) {
          console.warn('Failed to load participants:', err);
        }
        
        // Load standings
        let standingsList: any[] = [];
        try {
          const standingsData = await apiClient.getTournamentStandings(tournamentId);
          standingsList = standingsData.standings || standingsData || [];
          setStandings(standingsList);
        } catch (err) {
          console.warn('No standings available:', err);
          setStandings([]);
        }
        
        // If standings are empty, calculate from matches or participants
        if (standingsList.length === 0) {
          // For round-robin and group-stage, calculate from matches
          if (matchesList.length > 0 && (tournamentFormat === "round-robin" || tournamentFormat === "group-stage")) {
            // Get unique players from matches
            const playerSet = new Set<string>();
            matchesList.forEach((match: any) => {
              if (match.player1_name || match.player1_username) {
                playerSet.add(match.player1_name || match.player1_username);
              }
              if (match.player2_name || match.player2_username) {
                playerSet.add(match.player2_name || match.player2_username);
              }
            });
            const players = Array.from(playerSet);
            
            // Build results object
            const results: { [key: string]: string } = {};
            matchesList.forEach((match: any) => {
              if (match.status === 'completed' && match.player1_scores && match.player2_scores) {
                const player1 = match.player1_name || match.player1_username;
                const player2 = match.player2_name || match.player2_username;
                if (player1 && player2) {
                  const score = formatScore(match.player1_scores, match.player2_scores);
                  results[`${player1}-${player2}`] = score;
                }
              }
            });
            
            // Calculate standings from results
            if (Object.keys(results).length > 0 || players.length > 0) {
              const calculatedStandings = players.map(player => {
                let wins = 0;
                let losses = 0;
                let pointsFor = 0; // Total points scored by this player
                let pointsAgainst = 0; // Total points scored against this player
                
                Object.entries(results).forEach(([key, score]) => {
                  const [p1, p2] = key.split("-");
                  const sets = score.split(",");
                  let p1Wins = 0;
                  let p2Wins = 0;
                  sets.forEach(set => {
                    const [s1, s2] = set.trim().split("-").map(Number);
                    if (s1 > s2) p1Wins++;
                    else p2Wins++;
                    
                    // Accumulate points
                    if (p1 === player) {
                      pointsFor += s1;
                      pointsAgainst += s2;
                    } else if (p2 === player) {
                      pointsFor += s2;
                      pointsAgainst += s1;
                    }
                  });
                  
                  if (p1 === player) {
                    if (p1Wins > p2Wins) wins++;
                    else losses++;
                  } else if (p2 === player) {
                    if (p2Wins > p1Wins) wins++;
                    else losses++;
                  }
                });
                
                const pointDifference = pointsFor - pointsAgainst;
                
                return { 
                  player, 
                  wins, 
                  losses, 
                  points: wins * 3,
                  pointDifference,
                  rank: 0 // Will be calculated after sorting
                };
              });
              
              // Sort by points first, then by point difference if points are equal
              calculatedStandings.sort((a, b) => {
                // First sort by points
                if (b.points !== a.points) {
                  return b.points - a.points;
                }
                // If points are equal, sort by point difference
                return b.pointDifference - a.pointDifference;
              });
              
              // Assign ranks based on sorted order
              calculatedStandings.forEach((standing, index) => {
                standing.rank = index + 1;
              });
              
              // Convert to format expected by TournamentRankingsTable
              // Match player names with participant data to get country, avatar, etc.
              const formattedStandings = calculatedStandings.map(standing => {
                // Find participant data by matching name or username
                const participant = participantsList.find((p: any) => 
                  (p.full_name && p.full_name === standing.player) ||
                  (p.username && p.username === standing.player) ||
                  (p.full_name && standing.player.includes(p.full_name)) ||
                  (p.username && standing.player.includes(p.username))
                );
                
                return {
                  rank: standing.rank,
                  full_name: participant?.full_name || standing.player,
                  username: participant?.username || standing.player,
                  wins: standing.wins,
                  losses: standing.losses,
                  points: standing.points,
                  pointDifference: standing.pointDifference,
                  avatar_url: participant?.avatar_url,
                  country: participant?.country,
                  id: participant?.id
                };
              });
              
              if (formattedStandings.length > 0) {
                console.log('📊 Calculated standings from matches:', formattedStandings);
                setStandings(formattedStandings);
              }
            }
          } else if (participantsList.length > 0) {
            // Fallback: create basic standings from participants
            console.log('📊 Creating basic standings from participants:', participantsList.length);
            const basicStandings = participantsList.map((participant: any, index: number) => ({
              rank: index + 1,
              full_name: participant.full_name,
              username: participant.username,
              wins: 0,
              losses: 0,
              points: 0,
              avatar_url: participant.avatar_url,
              country: participant.country,
              id: participant.id
            }));
            setStandings(basicStandings);
          }
        }
        
      } catch (err: any) {
        console.error('Error loading tournament data:', err);
        toast.error(err.message || 'Failed to load tournament data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [tournamentId]);

  // Process matches for display
  const processedMatches = processMatches(matches);

  // Calculate tournament placements based on match results
  const calculatePlacements = () => {
    if (matches.length === 0) {
      return standings.map(s => ({ ...s, placement: s.rank, placementRange: s.rank.toString() }));
    }

    // For group-stage, determine placement based on playoff participation
    if (tournamentFormat === "group-stage") {
      const placements: { [key: string]: { placement: number, placementRange: string } } = {};
      
      // Get all players who participated in playoff matches
      const playoffPlayers = new Set<string>();
      const playoffMatches = matches.filter(m => !m.group_name && m.round);
      
      playoffMatches.forEach(match => {
        const player1Name = match.player1_name || match.player1_username;
        const player2Name = match.player2_name || match.player2_username;
        if (player1Name) playoffPlayers.add(player1Name);
        if (player2Name && player2Name !== "BYE") playoffPlayers.add(player2Name);
      });
      
      // Find final match
      const finalMatch = playoffMatches.find(m => 
        (m.round === 'Final' || m.round === 'Finals') && m.status === 'completed' && m.winner_id
      );
      
      if (finalMatch) {
        // Winner of final = 1st place
        const winnerId = finalMatch.winner_id;
        const winnerName = finalMatch.winner_name || finalMatch.winner_username;
        if (winnerId && winnerName) {
          placements[winnerName] = { placement: 1, placementRange: "1" };
        }
        
        // Loser of final = 2nd place
        const loserId = finalMatch.player1_id === winnerId ? finalMatch.player2_id : finalMatch.player1_id;
        const loserName = finalMatch.player1_id === winnerId 
          ? (finalMatch.player2_name || finalMatch.player2_username)
          : (finalMatch.player1_name || finalMatch.player1_username);
        if (loserId && loserName) {
          placements[loserName] = { placement: 2, placementRange: "2" };
        }
      }
      
      // Find semifinal matches
      const semifinalMatches = playoffMatches.filter(m => 
        (m.round === 'Semifinals' || m.round === 'Semi-finals') && m.status === 'completed' && m.winner_id
      );
      
      const semifinalLosers: string[] = [];
      semifinalMatches.forEach(match => {
        const winnerId = match.winner_id;
        if (!match.player2_id) return;
        
        const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;
        const loserName = match.player1_id === winnerId 
          ? (match.player2_name || match.player2_username)
          : (match.player1_name || match.player1_username);
        if (loserId && loserName && !placements[loserName]) {
          semifinalLosers.push(loserName);
        }
      });
      
      if (semifinalLosers.length > 0) {
        semifinalLosers.forEach(loser => {
          placements[loser] = { 
            placement: 3, 
            placementRange: semifinalLosers.length === 2 ? "3-4" : "3" 
          };
        });
      }
      
      // Find quarterfinal matches
      const quarterfinalMatches = playoffMatches.filter(m => 
        (m.round === 'Quarterfinals' || m.round === 'Quarter-finals') && m.status === 'completed' && m.winner_id
      );
      
      const quarterfinalLosers: string[] = [];
      quarterfinalMatches.forEach(match => {
        const winnerId = match.winner_id;
        if (!match.player2_id) return;
        
        const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;
        const loserName = match.player1_id === winnerId 
          ? (match.player2_name || match.player2_username)
          : (match.player1_name || match.player1_username);
        if (loserId && loserName && !placements[loserName]) {
          quarterfinalLosers.push(loserName);
        }
      });
      
      if (quarterfinalLosers.length > 0) {
        const placementRange = quarterfinalLosers.length === 2 ? "5-6" : 
                              quarterfinalLosers.length === 4 ? "5-8" : 
                              quarterfinalLosers.length === 3 ? "5-7" :
                              `5-${4 + quarterfinalLosers.length}`;
        quarterfinalLosers.forEach(loser => {
          placements[loser] = { 
            placement: 5, 
            placementRange 
          };
        });
      }
      
      // For all players, determine if they were in playoffs or not
      return standings.map(s => {
        const playerName = s.full_name || s.username;
        const placement = placements[playerName];
        
        if (placement) {
          // Player participated in playoffs and got a place
          return { ...s, placement: placement.placement, placementRange: placement.placementRange };
        } else if (playoffPlayers.has(playerName)) {
          // Player participated in playoffs but place not determined (fallback)
          return { ...s, placement: s.rank, placementRange: s.rank.toString() };
        } else {
          // Player did not advance to playoffs - show "Group Stage"
          return { ...s, placement: 999, placementRange: "Group Stage" };
        }
      });
    }

    // For single-elimination, determine placement based on elimination round
    if (tournamentFormat !== "single-elimination") {
      // For round-robin, use standings as is
      return standings.map(s => ({ ...s, placement: s.rank, placementRange: s.rank.toString() }));
    }

    const placements: { [key: string]: { placement: number, placementRange: string } } = {};
    
    // Find final match
    const finalMatch = matches.find(m => 
      (m.round === 'Final' || m.round === 'Finals') && m.status === 'completed' && m.winner_id
    );
    
    if (finalMatch) {
      // Winner of final = 1st place
      const winnerId = finalMatch.winner_id;
      const winnerName = finalMatch.winner_name || finalMatch.winner_username;
      if (winnerId && winnerName) {
        placements[winnerName] = { placement: 1, placementRange: "1" };
      }
      
      // Loser of final = 2nd place
      const loserId = finalMatch.player1_id === winnerId ? finalMatch.player2_id : finalMatch.player1_id;
      const loserName = finalMatch.player1_id === winnerId 
        ? (finalMatch.player2_name || finalMatch.player2_username)
        : (finalMatch.player1_name || finalMatch.player1_username);
      if (loserId && loserName) {
        placements[loserName] = { placement: 2, placementRange: "2" };
      }
    }
    
    // Find semifinal matches
    const semifinalMatches = matches.filter(m => 
      (m.round === 'Semifinals' || m.round === 'Semi-finals') && m.status === 'completed' && m.winner_id
    );
    
    // Players who lost in semifinals = 3-4 place
    const semifinalLosers: string[] = [];
    semifinalMatches.forEach(match => {
      const winnerId = match.winner_id;
      // Skip bye matches (player2_id is null)
      if (!match.player2_id) return;
      
      const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;
      const loserName = match.player1_id === winnerId 
        ? (match.player2_name || match.player2_username)
        : (match.player1_name || match.player1_username);
      if (loserId && loserName && !placements[loserName]) {
        semifinalLosers.push(loserName);
      }
    });
    
    if (semifinalLosers.length > 0) {
      semifinalLosers.forEach(loser => {
        placements[loser] = { 
          placement: 3, 
          placementRange: semifinalLosers.length === 2 ? "3-4" : "3" 
        };
      });
    }
    
    // Find quarterfinal matches
    const quarterfinalMatches = matches.filter(m => 
      (m.round === 'Quarterfinals' || m.round === 'Quarter-finals') && m.status === 'completed' && m.winner_id
    );
    
    // Players who lost in quarterfinals = 5-8 place (or 5-6 if 6 players)
    const quarterfinalLosers: string[] = [];
    quarterfinalMatches.forEach(match => {
      const winnerId = match.winner_id;
      // Skip bye matches (player2_id is null)
      if (!match.player2_id) return;
      
      const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;
      const loserName = match.player1_id === winnerId 
        ? (match.player2_name || match.player2_username)
        : (match.player1_name || match.player1_username);
      if (loserId && loserName && !placements[loserName]) {
        quarterfinalLosers.push(loserName);
      }
    });
    
    if (quarterfinalLosers.length > 0) {
      // Determine placement range based on number of losers
      const placementRange = quarterfinalLosers.length === 2 ? "5-6" : 
                            quarterfinalLosers.length === 4 ? "5-8" : 
                            quarterfinalLosers.length === 3 ? "5-7" :
                            `5-${4 + quarterfinalLosers.length}`;
      quarterfinalLosers.forEach(loser => {
        placements[loser] = { 
          placement: 5, 
          placementRange 
        };
      });
    }
    
    // Find Round of 16 matches
    const roundOf16Matches = matches.filter(m => 
      (m.round === 'Round of 16') && m.status === 'completed' && m.winner_id
    );
    
    const roundOf16Losers: string[] = [];
    roundOf16Matches.forEach(match => {
      const winnerId = match.winner_id;
      if (!match.player2_id) return;
      
      const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;
      const loserName = match.player1_id === winnerId 
        ? (match.player2_name || match.player2_username)
        : (match.player1_name || match.player1_username);
      if (loserId && loserName && !placements[loserName]) {
        roundOf16Losers.push(loserName);
      }
    });
    
    if (roundOf16Losers.length > 0) {
      const placementRange = roundOf16Losers.length === 8 ? "9-16" : 
                            `9-${8 + roundOf16Losers.length}`;
      roundOf16Losers.forEach(loser => {
        placements[loser] = { 
          placement: 9, 
          placementRange 
        };
      });
    }
    
    // For players not found in matches, use standings rank
    return standings.map(s => {
      const playerName = s.full_name || s.username;
      const placement = placements[playerName];
      if (placement) {
        return { ...s, placement: placement.placement, placementRange: placement.placementRange };
      }
      // Fallback to rank from standings
      return { ...s, placement: s.rank, placementRange: s.rank.toString() };
    });
  };

  const placements = calculatePlacements().sort((a, b) => {
    // Sort by placement: lower placement first, then by points/wins
    if (a.placement !== b.placement) {
      return a.placement - b.placement;
    }
    // If same placement, sort by points
    if (a.points !== b.points) {
      return (b.points || 0) - (a.points || 0);
    }
    // If same points, sort by point difference (for round-robin)
    if (tournamentFormat === "round-robin") {
      const aPointDiff = (a as any).pointDifference || 0;
      const bPointDiff = (b as any).pointDifference || 0;
      if (aPointDiff !== bPointDiff) {
        return bPointDiff - aPointDiff;
      }
    }
    // If same points (and same point difference for round-robin), sort by wins
    return (b.wins || 0) - (a.wins || 0);
  });

  // Process round-robin data from matches
  const processRoundRobinData = () => {
    if (tournamentFormat !== "round-robin" || matches.length === 0) {
      return { players: [], results: {} };
    }

    // Get unique players from matches
    const playerSet = new Set<string>();
    matches.forEach(match => {
      if (match.player1_name || match.player1_username) {
        playerSet.add(match.player1_name || match.player1_username);
      }
      if (match.player2_name || match.player2_username) {
        playerSet.add(match.player2_name || match.player2_username);
      }
    });
    const players = Array.from(playerSet);

    // Build results object
    const results: { [key: string]: string } = {};
    matches.forEach(match => {
      if (match.status === 'completed' && match.player1_scores && match.player2_scores) {
        const player1 = match.player1_name || match.player1_username;
        const player2 = match.player2_name || match.player2_username;
        if (player1 && player2) {
          const score = formatScore(match.player1_scores, match.player2_scores);
          results[`${player1}-${player2}`] = score;
        }
      }
    });

    return { players, results };
  };

  // Process group-stage data from matches
  const processGroupStageData = () => {
    if (tournamentFormat !== "group-stage" || matches.length === 0) {
      return { groups: {}, groupResults: {}, playoffMatches: [] };
    }

    // Group matches by group_name
    const groupMatches: { [key: string]: any[] } = {};
    const playoffMatchesList: any[] = [];

    matches.forEach(match => {
      if (match.group_name) {
        if (!groupMatches[match.group_name]) {
          groupMatches[match.group_name] = [];
        }
        groupMatches[match.group_name].push(match);
      } else {
        // Playoff matches don't have group_name
        playoffMatchesList.push(match);
      }
    });

    // Process each group
    const groups: { [key: string]: string[] } = {};
    const groupResults: { [key: string]: { [key: string]: string } } = {};

    Object.keys(groupMatches).forEach(groupName => {
      const groupMatchList = groupMatches[groupName];
      const playerSet = new Set<string>();
      
      groupMatchList.forEach(match => {
        if (match.player1_name || match.player1_username) {
          playerSet.add(match.player1_name || match.player1_username);
        }
        if (match.player2_name || match.player2_username) {
          playerSet.add(match.player2_name || match.player2_username);
        }
      });
      
      groups[groupName] = Array.from(playerSet);
      groupResults[groupName] = {};

      groupMatchList.forEach(match => {
        if (match.status === 'completed' && match.player1_scores && match.player2_scores) {
          const player1 = match.player1_name || match.player1_username;
          const player2 = match.player2_name || match.player2_username;
          if (player1 && player2) {
            const score = formatScore(match.player1_scores, match.player2_scores);
            groupResults[groupName][`${player1}-${player2}`] = score;
          }
        }
      });
    });

    // Process playoff matches
    const processedPlayoffMatches = processMatches(playoffMatchesList);

    return { groups, groupResults, playoffMatches: processedPlayoffMatches };
  };

  // Calculate point difference for a player based on their matches
  const calculatePointDifference = (playerName: string): number => {
    let pointsFor = 0;
    let pointsAgainst = 0;
    
    matches.forEach(match => {
      if (match.status !== 'completed' || !match.player1_scores || !match.player2_scores) {
        return;
      }
      
      const player1Name = match.player1_name || match.player1_username;
      const player2Name = match.player2_name || match.player2_username;
      
      if (!player1Name || !player2Name) return;
      
      // Check if this player is in the match
      const isPlayer1 = player1Name === playerName;
      const isPlayer2 = player2Name === playerName;
      
      if (isPlayer1) {
        // Player is player1, accumulate their scores and opponent's scores
        match.player1_scores.forEach(score => pointsFor += score);
        match.player2_scores.forEach(score => pointsAgainst += score);
      } else if (isPlayer2) {
        // Player is player2, accumulate their scores and opponent's scores
        match.player2_scores.forEach(score => pointsFor += score);
        match.player1_scores.forEach(score => pointsAgainst += score);
      }
    });
    
    return pointsFor - pointsAgainst;
  };

  // Calculate standings from results
  const calculateStandings = (players: string[], results: { [key: string]: string }) => {
    const standings = players.map(player => {
      let wins = 0;
      let losses = 0;
      let pointsFor = 0; // Total points scored by this player
      let pointsAgainst = 0; // Total points scored against this player
      
      Object.entries(results).forEach(([key, score]) => {
        const [p1, p2] = key.split("-");
        const sets = score.split(",");
        let p1Wins = 0;
        let p2Wins = 0;
        sets.forEach(set => {
          const [s1, s2] = set.trim().split("-").map(Number);
          if (s1 > s2) p1Wins++;
          else p2Wins++;
          
          // Accumulate points
          if (p1 === player) {
            pointsFor += s1;
            pointsAgainst += s2;
          } else if (p2 === player) {
            pointsFor += s2;
            pointsAgainst += s1;
          }
        });
        
        if (p1 === player) {
          if (p1Wins > p2Wins) wins++;
          else losses++;
        } else if (p2 === player) {
          if (p2Wins > p1Wins) wins++;
          else losses++;
        }
      });
      
      const pointDifference = pointsFor - pointsAgainst;
      const games = wins + losses; // Total games played
      
      return { player, wins, losses, games, points: wins * 3, pointDifference };
    });
    
    return standings.sort((a, b) => {
      // First sort by points
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // If points are equal, sort by point difference
      return b.pointDifference - a.pointDifference;
    });
  };

  const roundRobinData = processRoundRobinData();
  const groupStageData = processGroupStageData();

  if (loading) {
    return <Preloader />;
  }

  const tournamentName = tournament?.name || "Tournament";
  const tournamentDate = tournament?.date ? new Date(tournament.date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : "";
  const tournamentLocation = tournament?.location || "";
  const tournamentTime = tournament?.time || "";

  // 7. ФУНКЦИЯ handleExportPDF с серверной генерацией через Puppeteer
  const handleExportPDF = async () => {
    if (placements.length === 0) {
      toast.error("No tournament results available to export");
      return;
    }

    setIsGeneratingPdf(true);
    toast.info("Generating PDF, please wait...", {
      duration: 20000,
    });

    try {
      // Форматируем время, убирая секунды
      const formatTime = (time: string) => {
        if (!time) return "";
        // Если время в формате HH:MM:SS, убираем секунды
        const timeMatch = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
        if (timeMatch) {
          return `${timeMatch[1]}:${timeMatch[2]}`;
        }
        return time;
      };

      const formattedTime = formatTime(tournamentTime);
      const organizerName = tournament?.organizer_name || tournament?.organizer_username || '';

      // Подготавливаем данные для отправки на сервер
      const pdfData = {
        tournamentId: tournamentId,
        tournamentName: tournamentName,
        tournamentDate: formattedTime ? `${tournamentDate} • ${formattedTime}` : tournamentDate,
        tournamentLocation: tournamentLocation || "Unknown location",
        organizerName: organizerName,
        standings: placements.map(p => ({
          rank: p.placement ?? p.rank ?? 999,
          placement: p.placement,
          placementRange: p.placementRange,
          full_name: p.full_name,
          username: p.username,
          country: p.country || "-",
          wins: p.wins ?? 0,
          losses: p.losses ?? 0,
          pointDifference: (p as any).pointDifference ?? 0,
          points: p.points ?? 0,
          avatar_url: p.avatar_url || "",
        }))
      };

      // Отправляем запрос на сервер для генерации PDF
      const pdfBlob = await apiClient.generateTournamentStandingsPDF(pdfData);

      // Проверяем, что blob валидный
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Received empty PDF file");
      }

      console.log("PDF blob received, size:", pdfBlob.size, "type:", pdfBlob.type);

      // Проверяем первые байты PDF для валидации
      const firstBytes = await pdfBlob.slice(0, 4).text();
      console.log("PDF first bytes:", firstBytes);
      
      if (firstBytes !== '%PDF') {
        throw new Error("Received file is not a valid PDF");
      }

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `Standings_${tournamentName.replace(/\s+/g, "_")}.pdf`;
      link.download = filename;
      link.style.display = 'none';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      
      try {
        // Используем setTimeout для надежности
        setTimeout(() => {
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 200);
        }, 0);
        
        toast.success("Standings PDF downloaded!");
      } catch (downloadError) {
        console.error("Error triggering download:", downloadError);
        // Альтернативный способ: создаем blob URL и открываем
        const blobUrl = window.URL.createObjectURL(pdfBlob);
        const newWindow = window.open(blobUrl, '_blank');
        if (newWindow) {
          toast.info("PDF opened in new window. Please use browser's download button.");
        } else {
          toast.error("Please allow pop-ups to download the PDF");
        }
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 2000);
      }

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", {
        description: error instanceof Error ? error.message : "Please try again."
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };


  const handleGenerateCertificate = async () => {
    if (!selectedPlayerForCertificate) {
      toast.error("Please select a participant");
      return;
    }

    setIsGeneratingCertificate(true);

    // Use placements instead of standings to get placementRange
    const participant = placements.find(p => (p.full_name || p.username) === selectedPlayerForCertificate);
    if (!participant) {
      setIsGeneratingCertificate(false);
      return;
    }

    // Use placementRange if available, otherwise format rank
    let placeText: string;
    if (participant.placementRange) {
      // If placementRange is "Group Stage" or contains text, use as is
      if (participant.placementRange === "Group Stage" || isNaN(Number(participant.placementRange))) {
        placeText = participant.placementRange;
      } else {
        // Format numeric placement ranges like "3-4" as "3rd-4th"
        if (participant.placementRange.includes('-')) {
          const [start, end] = participant.placementRange.split('-');
          const formatPlace = (num: string) => {
            const n = parseInt(num);
            if (n === 1) return '1st';
            if (n === 2) return '2nd';
            if (n === 3) return '3rd';
            return `${n}th`;
          };
          placeText = `${formatPlace(start)}-${formatPlace(end)}`;
        } else {
          // Single number like "1", "2", "3"
          const n = parseInt(participant.placementRange);
          if (n === 1) placeText = '1st';
          else if (n === 2) placeText = '2nd';
          else if (n === 3) placeText = '3rd';
          else placeText = `${n}th`;
        }
      }
    } else {
      // Fallback to rank
      const places = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
      placeText = places[participant.rank - 1] || `${participant.rank}th`;
    }

    const playerName = participant.full_name || participant.username || 'Unknown';
    const organizerName = tournament?.organizer_name || tournament?.organizer_username || 'Tournament Director';

    try {
      toast.info("Generating certificate, please wait...", {
        duration: 20000,
      });

      // Отправляем запрос на сервер для генерации PDF сертификата
      const pdfBlob = await apiClient.generatePlayerCertificatePDF({
        playerName,
        tournamentName,
        placement: placeText,
        date: tournamentDate,
        organizerName,
        imageUrl: tournament?.image_url || undefined,
      });

      // Проверяем, что blob валидный
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error("Received empty certificate PDF file");
      }

      console.log("Certificate PDF blob received, size:", pdfBlob.size, "type:", pdfBlob.type);

      // Проверяем первые байты PDF для валидации
      const firstBytes = await pdfBlob.slice(0, 4).text();
      console.log("Certificate PDF first bytes:", firstBytes);
      
      if (firstBytes !== '%PDF') {
        throw new Error("Received file is not a valid PDF");
      }

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `Certificate_${playerName.replace(/\s+/g, "_")}.pdf`;
      link.download = filename;
      link.style.display = 'none';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      
      try {
        // Используем setTimeout для надежности
        setTimeout(() => {
          link.click();
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 200);
        }, 0);
        
        toast.success("Certificate Generated!", {
          description: `Certificate for ${playerName} has been downloaded`
        });
      } catch (downloadError) {
        console.error("Error triggering download:", downloadError);
        // Альтернативный способ: создаем blob URL и открываем
        const blobUrl = window.URL.createObjectURL(pdfBlob);
        const newWindow = window.open(blobUrl, '_blank');
        if (newWindow) {
          toast.info("Certificate opened in new window. Please use browser's download button.");
        } else {
          toast.error("Please allow pop-ups to download the certificate");
        }
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 2000);
      }

    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error("Failed to generate certificate", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsGeneratingCertificate(false);
    }
  };


  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="details" />
      
      {/* Header with Back button */}
      <div className="border-b border-border/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="hover:underline -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Title Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
          {tournament?.status === "live" || tournament?.status === "ongoing" ? "Live Results" : "Tournament Results"}
        </h1>
        <p className="text-muted-foreground">{tournamentName} - {tournamentDate}</p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8 relative z-10">
        {tournament?.status === "live" || tournament?.status === "ongoing" ? (
          // For live/ongoing tournaments, show content directly without tabs
          <div className="space-y-6">
            {tournamentFormat === "single-elimination" && (
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Bracket</CardTitle>
                  <CardDescription>Final tournament bracket with all results</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto -mx-4 sm:mx-0">
                  <SingleEliminationBracket 
                    matches={processedMatches}
                    onUpdateMatch={() => {}}
                    editable={false}
                    matchFormat={matchFormat}
                  />
                </CardContent>
              </Card>
            )}

            {tournamentFormat === "round-robin" && (
              <>
                {roundRobinData.players.length > 0 ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Results Table</CardTitle>
                        <CardDescription>Complete round-robin results matrix</CardDescription>
                      </CardHeader>
                      <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6">
                        <div className="min-w-[600px]">
                          <RoundRobinTable 
                            players={roundRobinData.players}
                            results={roundRobinData.results}
                            onUpdateResult={() => {}}
                            editable={false}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No round-robin data available
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {tournamentFormat === "group-stage" && (
              <>
                {Object.keys(groupStageData.groups).length > 0 || groupStageData.playoffMatches.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant={groupStage === "groups" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupStage("groups")}
                        className="flex items-center gap-2"
                      >
                        <Table className="w-4 h-4" />
                        Group Stage
                      </Button>
                      <Button
                        variant={groupStage === "playoffs" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupStage("playoffs")}
                        className="flex items-center gap-2"
                      >
                        <Network className="w-4 h-4" />
                        Playoffs
                      </Button>
                    </div>
                    {groupStage === "groups" ? (
                      <div className="space-y-4 sm:space-y-6">
                        {Object.keys(groupStageData.groups).map(groupName => (
                          <Card key={groupName}>
                            <CardHeader>
                              <CardTitle className="text-base sm:text-lg">Group {groupName} Results</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6">
                              <RoundRobinTable 
                                players={groupStageData.groups[groupName]}
                                results={groupStageData.groupResults[groupName] || {}}
                                onUpdateResult={() => {}}
                                editable={false}
                              />
                              <GroupStandingsTable
                                players={groupStageData.groups[groupName]}
                                results={groupStageData.groupResults[groupName] || {}}
                                groupName={groupName}
                                playersPerGroupAdvance={tournament?.players_per_group_advance || 2}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Playoff Bracket</CardTitle>
                          <CardDescription>Final playoff matches</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto -mx-4 sm:mx-0">
                          <SingleEliminationBracket
                            matches={groupStageData.playoffMatches}
                            onUpdateMatch={() => {}}
                            editable={false}
                            matchFormat={matchFormat}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No group-stage data available
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        ) : (
          // For completed tournaments, show tabs
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-8">
              <TabsList className="inline-flex">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="participants" className="text-xs sm:text-sm">Standings</TabsTrigger>
              </TabsList>
            {standings.length > 0 && activeTab === "participants" && (
              <Button 
                variant="outline" 
                onClick={handleExportPDF}
                className="hover:underline"
                size="sm"
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 
                    className="w-4 h-4 mr-2" 
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isGeneratingPdf ? "Generating..." : "Export PDF"}
              </Button>
            )}
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {tournamentFormat === "single-elimination" && (
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Bracket</CardTitle>
                  <CardDescription>Final tournament bracket with all results</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto -mx-4 sm:mx-0">
                  <SingleEliminationBracket 
                    matches={processedMatches}
                    onUpdateMatch={() => {}}
                    editable={false}
                    matchFormat={matchFormat}
                  />
                </CardContent>
              </Card>
            )}

            {tournamentFormat === "round-robin" && (
              <>
                {roundRobinData.players.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                <CardTitle>Results Table</CardTitle>
                <CardDescription>Complete round-robin results matrix</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6">
                    <div className="min-w-[600px]">
                      <RoundRobinTable 
                            players={roundRobinData.players}
                            results={roundRobinData.results}
                        onUpdateResult={() => {}}
                        editable={false}
                      />
                    </div>
                  </CardContent>
                </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No round-robin data available
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {tournamentFormat === "group-stage" && (
              <>
                {Object.keys(groupStageData.groups).length > 0 || groupStageData.playoffMatches.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant={groupStage === "groups" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupStage("groups")}
                        className="flex items-center gap-2"
                      >
                        <Table className="w-4 h-4" />
                        Group Stage
                      </Button>
                      <Button
                        variant={groupStage === "playoffs" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupStage("playoffs")}
                        className="flex items-center gap-2"
                      >
                        <Network className="w-4 h-4" />
                        Playoffs
                      </Button>
                    </div>

                    {groupStage === "groups" && Object.keys(groupStageData.groups).length > 0 && (
                      <div className="space-y-4 sm:space-y-6">
                        {Object.keys(groupStageData.groups).map(groupName => (
                          <Card key={groupName}>
                            <CardHeader>
                              <CardTitle className="text-base sm:text-lg">Group {groupName} Results</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6">
                              <RoundRobinTable 
                                players={groupStageData.groups[groupName]}
                                results={groupStageData.groupResults[groupName] || {}}
                                onUpdateResult={() => {}}
                                editable={false}
                              />
                              <GroupStandingsTable
                                players={groupStageData.groups[groupName]}
                                results={groupStageData.groupResults[groupName] || {}}
                                groupName={groupName}
                                playersPerGroupAdvance={tournament?.players_per_group_advance || 2}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {groupStage === "playoffs" && groupStageData.playoffMatches.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base sm:text-lg">Playoff Bracket</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Knockout stage results</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto -mx-4 sm:mx-0">
                          <SingleEliminationBracket 
                            matches={groupStageData.playoffMatches}
                            onUpdateMatch={() => {}}
                            editable={false}
                            matchFormat={matchFormat}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {groupStage === "groups" && Object.keys(groupStageData.groups).length === 0 && (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          No group stage data available
                        </CardContent>
                      </Card>
                    )}

                    {groupStage === "playoffs" && groupStageData.playoffMatches.length === 0 && (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          No playoff bracket available yet
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No group-stage data available
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants">
            {/* 9. Оборачиваем Card в ref */}
            <Card ref={standingsCardRef}>
              <CardHeader>
                <CardTitle>Standings</CardTitle>
                <CardDescription>Current tournament standings based on match results</CardDescription>
                {standings.length > 0 && (
                  <CardAction>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto" data-slot="certificate-button">
                      <Select value={selectedPlayerForCertificate} onValueChange={setSelectedPlayerForCertificate}>
                        <SelectTrigger className="w-full sm:w-[200px]">
                          <SelectValue placeholder="Select participant" />
                        </SelectTrigger>
                        <SelectContent>
                            {standings.map((p, idx) => (
                              <SelectItem key={p.id || p.username || p.full_name || `select-${idx}`} value={p.full_name || p.username}>
                                {p.full_name || p.username} (#{p.rank})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleGenerateCertificate} 
                        className="hover:underline whitespace-nowrap"
                        disabled={isGeneratingCertificate}
                      >
                        {isGeneratingCertificate ? (
                          <Loader2 
                            className="w-4 h-4 mr-2" 
                            style={{ animation: 'spin 1s linear infinite' }}
                          />
                        ) : (
                          <FileText className="w-4 h-4 mr-2" />
                        )}
                        {isGeneratingCertificate ? "Generating..." : "Download Certificate"}
                      </Button>
                    </div>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-6">
                {standings.length === 0 ? (
                  <EmptyState
                    icon={Trophy}
                    text="No standings available yet"
                  />
                ) : (
                  <TournamentRankingsTable 
                    players={(() => {
                      // For round-robin tournaments, use calculated standings with pointDifference
                      if (tournamentFormat === "round-robin" && roundRobinData.players.length > 0) {
                        const calculatedStandings = calculateStandings(roundRobinData.players, roundRobinData.results);
                        return calculatedStandings.map((s, index) => {
                          // Find placement info from placements
                          const placement = placements.find(p => 
                            (p.full_name || p.username) === s.player
                          );
                          // Use rank from sorted standings (index + 1) or from placement
                          const rank = index + 1;
                          return {
                            player: s.player,
                            wins: s.wins,
                            losses: s.losses,
                            points: s.points,
                            pointDifference: s.pointDifference,
                            placementRange: placement?.placementRange || rank.toString()
                          };
                        });
                      }
                      // For other formats, use placements data and calculate pointDifference from matches
                      return placements.map((p) => {
                        const playerName = p.full_name || p.username || '';
                        return {
                          player: playerName,
                          wins: p.wins || 0,
                          losses: p.losses || 0,
                          points: p.points || 0,
                          pointDifference: calculatePointDifference(playerName),
                          placementRange: p.placementRange
                        };
                      });
                    })()}
                    participants={placements}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
