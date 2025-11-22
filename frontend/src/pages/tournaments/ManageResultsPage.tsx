import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { ArrowLeft, Table, Network } from "lucide-react";
import { toast } from "sonner";
import { SingleEliminationBracket } from "../../components/tournaments/TournamentBracket";
import { RoundRobinTable } from "../../components/tournaments/RoundRobinTable";
import { GroupStandingsTable } from "../../components/tournaments/GroupStandingsTable";
import { RoundRobinManageResults } from "../../components/tournaments/manage/RoundRobinManageResults";
import { SingleEliminationManageResults } from "../../components/tournaments/manage/SingleEliminationManageResults";
import { GroupStageManageResults } from "../../components/tournaments/manage/GroupStageManageResults";
import { apiClient } from "../../api/client";
import { WinnerCelebrationModal } from "../../components/tournaments/modals/WinnerCelebrationModal";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { Preloader } from "../../components/common/Preloader";
import { TournamentRankingsTable } from "../../components/common/leaderboard/LeaderboardApi";
import { WarningCard } from "../../components/common/WarningCard";

interface ManageResultsPageProps {
  onBack: () => void;
  tournamentId: number;
  tournamentFormat: "single-elimination" | "round-robin" | "group-stage";
}

export function ManageResultsPage({ onBack, tournamentId, tournamentFormat }: ManageResultsPageProps) {
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchFormat, setMatchFormat] = useState<"best-of-1" | "best-of-3" | "best-of-5">("best-of-5");
  
  const [activeTab, setActiveTab] = useState(tournamentFormat === "group-stage" ? "groups" : "matches");
  const [groupStage, setGroupStage] = useState<"groups" | "playoffs">("groups");
  
  // Single Elimination matches
  const [singleElimMatches, setSingleElimMatches] = useState<any[]>([]);
  
  // Winner celebration modal
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [tournamentWinner, setTournamentWinner] = useState<string>("");
  const [tournamentWinnerAvatar, setTournamentWinnerAvatar] = useState<string | undefined>(undefined);

  // Round Robin data
  const [rrPlayers, setRRPlayers] = useState<string[]>([]);
  const [rrResults, setRRResults] = useState<{ [key: string]: string }>({});
  const [selectedRRPlayer, setSelectedRRPlayer] = useState<string | null>(null);

  // Group Stage data
  const [groups, setGroups] = useState<{ [key: string]: string[] }>({});
  const [groupResults, setGroupResults] = useState<{ [key: string]: { [key: string]: string } }>({});
  // Keep old state for backward compatibility
  const [groupAResults, setGroupAResults] = useState<{ [key: string]: string }>({});
  const [groupBResults, setGroupBResults] = useState<{ [key: string]: string }>({});
  const [playoffMatches, setPlayoffMatches] = useState<any[]>([]);
  const [recommendedMatchToSelect, setRecommendedMatchToSelect] = useState<{ player1: string; player2: string } | null>(null);
  const sidebarCardRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const playoffCreationInProgressRef = useRef(false);

  // Note: Sidebar height sync for Round Robin is now handled in RoundRobinManageResults component

  // Process single elimination matches
  const processSingleEliminationMatches = (matchesList: any[], participantsList: any[]) => {
    console.log('🔄 [BRACKET] Processing matches:', matchesList.length, 'matches');
    
    const processedMatches = matchesList
      .sort((a, b) => {
        // Sort by round first (if round names exist, sort by round order)
        const roundOrder = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Quarter-finals', 'Semifinals', 'Semi-finals', 'Finals', 'Final'];
        const aRound = a.round || '';
        const bRound = b.round || '';
        const aIndex = roundOrder.findIndex(r => aRound.toLowerCase().includes(r.toLowerCase().replace(/[^a-z]/g, '')));
        const bIndex = roundOrder.findIndex(r => bRound.toLowerCase().includes(r.toLowerCase().replace(/[^a-z]/g, '')));
        if (aIndex !== bIndex && aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        // Then by match_number or id
        return (a.match_number || a.id || 0) - (b.match_number || b.id || 0);
      })
      .map(match => {
        // Для player1: если есть player1_id, показываем имя или "Player {id}", иначе "TBD"
        const player1 = (match.player1_id && (match.player1_name || match.player1_username)) 
          ? (match.player1_name || match.player1_username) 
          : (match.player1_id ? `Player ${match.player1_id}` : "TBD");
        
        // Для player2: если есть player2_id, показываем имя
        // BYE только для первого раунда (когда действительно нет соперника из-за нечетного количества игроков)
        // В более поздних раундах (Semifinals, Final) если player2_id = null, это TBD (игрок еще не определен)
        const round = match.round || '';
        // Первый раунд может быть: Quarterfinals, Round of 16, Round of 32, First Round, или Semifinals (для 3-4 участников)
        // Если player2_id = null И player1_id существует, это может быть BYE в первом раунде
        // Проверяем: если раунд - первый раунд ИЛИ матч уже завершен с winner_id = player1_id (это завершенный BYE)
        const isFirstRound = round.includes('Quarter') || round.includes('Round of 16') || round.includes('Round of 32') || round.includes('First Round');
        const isSemifinalsAsFirstRound = round.includes('Semifinals') || round.includes('Semi-finals');
        // Для Semifinals: если player2_id = null и player1_id есть и матч завершен с winner_id = player1_id, это BYE
        const isCompletedBye = !match.player2_id && match.player1_id && match.winner_id === match.player1_id && match.status === 'completed';
        // BYE показываем если: (первый раунд И player1_id есть И player2_id нет) ИЛИ (завершенный BYE матч)
        const isByeMatch = (match.player1_id && !match.player2_id && (isFirstRound || isSemifinalsAsFirstRound)) || isCompletedBye;
        
        const player2 = (match.player2_id && (match.player2_name || match.player2_username)) 
          ? (match.player2_name || match.player2_username)
          : (match.player2_id ? `Player ${match.player2_id}` : (isByeMatch ? "BYE" : "TBD"));
        const winner = match.winner_name || match.winner_username || "";
        const score = formatScore(match.player1_scores, match.player2_scores);
        
        // Debug log for each match
        if (match.winner_id || winner) {
          console.log(`   [BRACKET] Match ${match.id} (${match.round}):`, {
            player1,
            player2,
            winner,
            winner_id: match.winner_id,
            score,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            player1_name: match.player1_name,
            player2_name: match.player2_name,
            winner_name: match.winner_name,
            winner_username: match.winner_username
          });
        }
        
        return {
          id: match.id,
          round: match.round || '', // Include round information
          player1,
          player2,
          score,
          winner,
        };
      });
    
    console.log('✅ [BRACKET] Processed', processedMatches.length, 'matches');
    console.log('   [BRACKET] Matches with winners:', processedMatches.filter(m => m.winner).length);
    
    setSingleElimMatches(prev => {
      // Only update if changed
      if (JSON.stringify(prev) === JSON.stringify(processedMatches)) {
        return prev;
      }
      return processedMatches;
    });
  };

  // Process round robin data
  const processRoundRobinData = (matchesList: any[], participantsList: any[]) => {
    // Use full_name for consistency with RRResults keys
    const playerNames = participantsList.map((p: any) => p.full_name || p.username || `Player ${p.id}`);
    console.log('📊 Processing round-robin data:', playerNames.length, 'players');
    setRRPlayers(prev => {
      // Only update if changed
      if (JSON.stringify(prev) === JSON.stringify(playerNames)) {
        return prev;
      }
      return playerNames;
    });
    
    // Initialize selected player if not already set
    setSelectedRRPlayer(prev => {
      if (!prev || !playerNames.includes(prev)) {
        return playerNames.length > 0 ? playerNames[0] : null;
      }
      return prev;
    });
    
    const results: { [key: string]: string } = {};
    console.log('🔍 Checking matches:', matchesList.length);
    matchesList.forEach((match, idx) => {
      console.log(`   Match ${idx + 1}:`, {
        id: match.id,
        status: match.status,
        p1_name: match.player1_name,
        p2_name: match.player2_name,
        p1_scores: match.player1_scores,
        p2_scores: match.player2_scores
      });
      if (match.status === 'completed' && match.player1_name && match.player2_name) {
        // Use full_name for key consistency (same as rrPlayers)
        const key1 = `${match.player1_name}-${match.player2_name}`;
        const key2 = `${match.player2_name}-${match.player1_name}`;
        const score = formatScore(match.player1_scores, match.player2_scores);
        const reversedScore = reverseScore(score);
        console.log('   ✅ Added result:', key1, '=', score);
        results[key1] = score;
        results[key2] = reversedScore;
      } else {
        console.log('   ⏭️  Skipped:', match.status !== 'completed' ? 'not completed' : 'missing names');
      }
    });
    console.log('✅ Round-robin results processed:', Object.keys(results).length / 2, 'matches');
    setRRResults(prev => {
      // Only update if changed
      if (JSON.stringify(prev) === JSON.stringify(results)) {
        return prev;
      }
      return results;
    });
  };

  // Process group stage data
  const processGroupStageData = (matchesList: any[], participantsList: any[], tournamentData?: any) => {
    const tournamentForGroups = tournament || tournamentData;
    
    // First, try to create groups from tournament settings if we have participants
    const grouped: { [key: string]: Set<string> } = {};
    
    // If we have tournament settings with num_groups, create groups from participants
    if (participantsList.length > 0 && tournamentForGroups?.num_groups) {
      const numGroups = tournamentForGroups.num_groups;
      const baseGroupSize = Math.floor(participantsList.length / numGroups);
      const remainder = participantsList.length % numGroups;
      
      let playerIndex = 0;
      for (let groupIndex = 0; groupIndex < numGroups; groupIndex++) {
        const currentGroupSize = baseGroupSize + (groupIndex < remainder ? 1 : 0);
        const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`; // A, B, C, etc.
        grouped[groupName] = new Set<string>();
        
        for (let i = 0; i < currentGroupSize && playerIndex < participantsList.length; i++) {
          const participant = participantsList[playerIndex];
          const playerName = participant.full_name || participant.username || `Player ${participant.id || participant.player_id}`;
          grouped[groupName].add(playerName);
          playerIndex++;
        }
      }
    }
    
    // Then, extract unique players from matches by group and add them
    // This ensures players from matches are included even if they weren't in initial distribution
    matchesList.forEach((match: any) => {
      if (match.group_name && match.round === 'Group Stage') {
        // Normalize group name (handle both "A" and "Group A")
        let groupName = match.group_name;
        if (!groupName.startsWith('Group ')) {
          groupName = `Group ${groupName}`;
        }
        
        if (!grouped[groupName]) {
          grouped[groupName] = new Set<string>();
        }
        
        // Add both players from the match to the group
        if (match.player1_name) {
          grouped[groupName].add(match.player1_name);
        } else if (match.player1_username) {
          grouped[groupName].add(match.player1_username);
        }
        
        if (match.player2_name) {
          grouped[groupName].add(match.player2_name);
        } else if (match.player2_username) {
          grouped[groupName].add(match.player2_username);
        }
      }
    });
    
    // If still no groups and we have participants, create a single group as fallback
    if (Object.keys(grouped).length === 0 && participantsList.length > 0) {
      const groupName = "Group A";
        grouped[groupName] = new Set<string>();
      participantsList.forEach((participant: any) => {
          const playerName = participant.full_name || participant.username || `Player ${participant.id || participant.player_id}`;
          grouped[groupName].add(playerName);
      });
    }
    
    // Convert Sets to Arrays and sort groups by name
    const groupedArrays: { [key: string]: string[] } = {};
    Object.keys(grouped).sort().forEach(groupName => {
      groupedArrays[groupName] = Array.from(grouped[groupName]).sort();
    });
    
    // Use functional update to preserve existing groups that might not be in matches yet
    setGroups(prevGroups => {
      // Merge: keep existing groups and add/update from new data
      const merged: { [key: string]: string[] } = { ...prevGroups };
      
      // Update or add groups from processed data
      Object.keys(groupedArrays).forEach(groupName => {
        // If group exists, merge players (union), otherwise use new group
        if (merged[groupName]) {
          const existingSet = new Set(merged[groupName]);
          groupedArrays[groupName].forEach(player => existingSet.add(player));
          merged[groupName] = Array.from(existingSet).sort();
        } else {
          merged[groupName] = groupedArrays[groupName];
        }
      });
      
      // Only update if changed
      if (JSON.stringify(prevGroups) === JSON.stringify(merged)) {
        return prevGroups;
      }
      return merged;
    });
    
    // Process group matches for all groups
    const allGroupResults: { [key: string]: { [key: string]: string } } = {};
    
    matchesList.forEach(match => {
      if (match.group_name && match.round === 'Group Stage') {
        // Normalize group name (handle both "A" and "Group A")
        const groupName = match.group_name;
        const normalizedGroupName = groupName.startsWith('Group ') ? groupName : `Group ${groupName}`;
        
        // Store under both normalized and original name for compatibility
        [groupName, normalizedGroupName].forEach(gn => {
          if (!allGroupResults[gn]) {
            allGroupResults[gn] = {};
        }
        
        if (match.status === 'completed') {
          const score = formatScore(match.player1_scores, match.player2_scores);
          const player1Name = match.player1_name || match.player1_username || '';
          const player2Name = match.player2_name || match.player2_username || '';
          const key = `${player1Name}-${player2Name}`;
          const reverseKey = `${player2Name}-${player1Name}`;
          
            allGroupResults[gn][key] = score;
            allGroupResults[gn][reverseKey] = reverseScore(score); // Reverse score for opposite direction
        }
        });
      }
    });
    
    setGroupResults(prev => {
      // Only update if changed
      if (JSON.stringify(prev) === JSON.stringify(allGroupResults)) {
        return prev;
      }
      return allGroupResults;
    });
    
    // Also set old state for backward compatibility
    setGroupAResults(prev => {
      const newVal = allGroupResults["Group A"] || allGroupResults["A"] || {};
      if (JSON.stringify(prev) === JSON.stringify(newVal)) {
        return prev;
      }
      return newVal;
    });
    setGroupBResults(prev => {
      const newVal = allGroupResults["Group B"] || allGroupResults["B"] || {};
      if (JSON.stringify(prev) === JSON.stringify(newVal)) {
        return prev;
      }
      return newVal;
    });
    
    // Check if all group stage matches are completed
    const groupStageMatches = matchesList.filter(m => m.round === 'Group Stage' && m.group_name);
    const allGroupMatchesCompleted = groupStageMatches.length > 0 && 
      groupStageMatches.every(m => m.status === 'completed');
    
    // Process playoff matches (round > group stage)
    let playoffMatchesList = matchesList
      .filter(m => m.round && m.round !== 'Group Stage' && !m.group_name)
      .map(match => {
        // BYE только для первого раунда плейофф (когда действительно нет соперника)
        // В более поздних раундах (Semifinals, Final) если player2_id = null, это TBD (игрок еще не определен)
        const round = match.round || '';
        const isFirstPlayoffRound = round.includes('Quarter') || round.includes('Round of 16') || round.includes('Round of 32') || round.includes('First Round');
        return {
          id: match.id,
          round: match.round || '',
          player1: (match.player1_id && (match.player1_name || match.player1_username)) 
            ? (match.player1_name || match.player1_username)
            : (match.player1_id ? `Player ${match.player1_id}` : "TBD"),
          player2: (match.player2_id && (match.player2_name || match.player2_username))
            ? (match.player2_name || match.player2_username)
            : (match.player2_id ? `Player ${match.player2_id}` : (match.player1_id && isFirstPlayoffRound ? "BYE" : "TBD")),
          score: formatScore(match.player1_scores, match.player2_scores),
          winner: match.winner_name || match.winner_username || "",
        };
      });
    
    // If no playoff matches exist, create preview bracket
    // Also update existing playoff matches if they exist
    if (playoffMatchesList.length === 0 && Object.keys(groupedArrays).length > 0) {
      // Create preview bracket with placeholders
      const numGroups = Object.keys(groupedArrays).length;
      const playersPerGroupAdvance = tournamentForGroups?.players_per_group_advance || 2;
      const totalPlayoffPlayers = numGroups * playersPerGroupAdvance;
      
      // Calculate bracket size (nearest power of 2, minimum 2)
      let bracketSize = 2;
      if (totalPlayoffPlayers > 2) bracketSize = 4;
      if (totalPlayoffPlayers > 4) bracketSize = 8;
      if (totalPlayoffPlayers > 8) bracketSize = 16;
      if (totalPlayoffPlayers > 16) bracketSize = 32;
      
      // Calculate players with bye (they advance directly to next round)
      const playersWithBye = bracketSize - totalPlayoffPlayers;
      
      // Determine which rounds are needed based on bracket size
      const rounds = [];
      let currentSize = bracketSize;
      
      if (currentSize >= 32) {
        rounds.push({ name: "Round of 32", size: 32, matches: 16 });
        currentSize = 16;
      }
      if (currentSize >= 16) {
        rounds.push({ name: "Round of 16", size: 16, matches: 8 });
        currentSize = 8;
      }
      if (currentSize >= 8) {
        rounds.push({ name: "Quarterfinals", size: 8, matches: 4 });
        currentSize = 4;
      }
      if (currentSize >= 4) {
        rounds.push({ name: "Semifinals", size: 4, matches: 2 });
        currentSize = 2;
      }
      if (currentSize >= 2) {
        rounds.push({ name: "Final", size: 2, matches: 1 });
      }
      
      const firstRound = rounds[0];
      const firstRoundMatches = firstRound ? firstRound.matches : 1;
      playoffMatchesList = [];
      
      // If all group matches are completed, we can determine players based on standings
      if (allGroupMatchesCompleted) {
        // Collect all advancing players from all groups with their standings
        const advancingPlayers: Array<{ player: string; group: string; position: number; points: number; pointDifference: number }> = [];
        const groupNames = Object.keys(groupedArrays).sort();
        
        groupNames.forEach(groupName => {
          const groupPlayers = groupedArrays[groupName] || [];
          // Use allGroupResults (just computed) instead of groupResults state which may be stale
          const groupResultsForGroup = allGroupResults[groupName] || allGroupResults[`Group ${groupName}`] || {};
          const standings = calculateStandings(groupPlayers, groupResultsForGroup);
          
          // Take top playersPerGroupAdvance from this group
          standings.slice(0, playersPerGroupAdvance).forEach((standing, index) => {
            advancingPlayers.push({
              player: standing.player,
              group: groupName,
              position: index + 1,
              points: standing.points,
              pointDifference: standing.pointDifference
            });
          });
        });
        
        // Sort all advancing players by points, then by point difference (best first)
        advancingPlayers.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return b.pointDifference - a.pointDifference;
        });
        
        // Distribute players based on standings
        let playerIndex = 0;
        let matchIdCounter = 1;
        
        // Create matches for each round dynamically
        for (const roundInfo of rounds) {
          for (let i = 0; i < roundInfo.matches; i++) {
            let player1 = "TBD";
            let player2 = "TBD";
            
            // Only for the first round, distribute actual players
            if (roundInfo === firstRound) {
              // For final with exactly 2 players, both should play (no BYE)
              if (roundInfo.name === "Final" && advancingPlayers.length === 2) {
                player1 = advancingPlayers[0]?.player || "TBD";
                player2 = advancingPlayers[1]?.player || "TBD";
              } else {
                // First playersWithBye players get bye (based on standings)
                if (playersWithBye > 0 && i < playersWithBye && playerIndex < advancingPlayers.length) {
                  const player = advancingPlayers[playerIndex];
                  player1 = player.player;
                  player2 = "BYE";
                  playerIndex++;
                } else {
                  // Regular match
                  if (playerIndex < advancingPlayers.length) {
                    player1 = advancingPlayers[playerIndex].player;
                    playerIndex++;
                  }
                  
                  if (playerIndex < advancingPlayers.length) {
                    player2 = advancingPlayers[playerIndex].player;
                    playerIndex++;
                  } else {
                    player2 = "BYE";
                  }
                }
              }
            }
            
            playoffMatchesList.push({
              id: -matchIdCounter++, // Negative IDs for preview matches
              round: roundInfo.name,
              player1,
              player2,
              score: "",
              winner: "",
            });
          }
        }
      } else {
        // Groups not all completed - show TBD placeholders
        let matchIdCounter = 1;
        
        // Create matches for each round dynamically with TBD placeholders
        for (const roundInfo of rounds) {
          for (let i = 0; i < roundInfo.matches; i++) {
            let player1 = "TBD";
            let player2 = "TBD";
            
            // Only for the first round, add BYE placeholders if needed
            if (roundInfo === firstRound && i < playersWithBye) {
              player1 = "TBD"; // Will be determined by standings when groups are completed
              player2 = "BYE";
            }
            
            playoffMatchesList.push({
              id: -matchIdCounter++, // Negative IDs for preview matches
              round: roundInfo.name,
              player1,
              player2,
              score: "",
              winner: "",
            });
          }
        }
      }
    }
    
    setPlayoffMatches(prev => {
      // Only update if changed
      if (JSON.stringify(prev) === JSON.stringify(playoffMatchesList)) {
        return prev;
      }
      return playoffMatchesList;
    });

    // Automatically create playoff matches when all group matches are completed
    if (allGroupMatchesCompleted && !playoffCreationInProgressRef.current) {
      // Check if real playoff matches don't exist yet
      const realPlayoffMatches = matchesList.filter(m => 
        m.round && 
        m.round !== 'Group Stage' && 
        !m.group_name &&
        m.id > 0
      );
      
      if (realPlayoffMatches.length === 0) {
        // Prevent multiple calls
        playoffCreationInProgressRef.current = true;
        
        // Automatically create playoff matches with group winners
        console.log('🟢 [PLAYOFF] Auto-creating playoff matches after group stage completion');
        apiClient.createPlayoffMatches(tournamentId)
          .then(() => {
            console.log('✅ [PLAYOFF] Playoff matches created successfully');
            toast.success("Playoff matches created! Group winners are now in the Final.");
            // Reload data after a short delay
            setTimeout(() => {
              playoffCreationInProgressRef.current = false;
              loadData();
            }, 500);
          })
          .catch((err: any) => {
            playoffCreationInProgressRef.current = false;
            console.error('❌ [PLAYOFF] Error creating playoff matches:', err);
            // Don't show error if matches already exist (that's expected)
            if (!err.message?.includes('already exist') && !err.message?.includes('Playoff matches already exist')) {
              toast.error(err.message || 'Failed to create playoff matches');
            }
          });
      }
    }
  };

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

  // Reverse score for display when viewing match from opposite direction
  const reverseScore = (scoreString: string): string => {
    if (!scoreString || scoreString.trim() === "") {
      return "";
    }
    
    const sets = scoreString.split(",").map(set => {
      const [s1, s2] = set.trim().split("-");
      return `${s2}-${s1}`;
    });
    return sets.join(", ");
  };

  // Parse score from display format to API format
  const parseScore = (scoreString: string): { player1_scores: number[], player2_scores: number[] } => {
    if (!scoreString || scoreString.trim() === "") {
      return { player1_scores: [], player2_scores: [] };
    }
    
    const sets = scoreString.split(",").map(s => s.trim());
    const player1_scores: number[] = [];
    const player2_scores: number[] = [];
    
    sets.forEach(set => {
      const [s1, s2] = set.split("-").map(Number);
      if (!isNaN(s1) && !isNaN(s2)) {
        player1_scores.push(s1);
        player2_scores.push(s2);
      }
    });
    
    return { player1_scores, player2_scores };
  };

  // Find player ID by name
  const findPlayerId = (playerName: string): number | null => {
    // Clean the player name: trim and remove any extra text like "Advances BYE"
    const cleanName = playerName.trim().split(/\s+(?:Advances|BYE)/i)[0].trim();
    
    const participant = participants.find((p: any) => {
      const fullName = p.full_name?.trim() || '';
      const username = p.username?.trim() || '';
      return (
        fullName === cleanName || 
        username === cleanName ||
        fullName === playerName.trim() ||
        username === playerName.trim()
      );
    });
    return participant?.id || participant?.player_id || null;
  };

  // Load tournament data
  const loadData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('⏸️ Load data already in progress, skipping...');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      console.log('🔄 Loading tournament data...');
      console.log('   Tournament ID:', tournamentId);
      setLoading(true);
      
      // Load tournament details
      const tournamentData = await apiClient.getTournament(tournamentId);
      const tournament = tournamentData.tournament || tournamentData;
      console.log('   Tournament loaded:', tournament?.name || tournament?.id, 'Status:', tournament?.status);
      setTournament(tournament);
      
      // Set match format from tournament settings
      if (tournament?.match_format || tournamentData.match_format) {
        const format = (tournament?.match_format || tournamentData.match_format || "").toLowerCase();
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
      
      // Load participants - try dedicated endpoint first, fallback to tournament data
      let participantsList = [];
      try {
        const participantsData = await apiClient.getTournamentParticipants(tournamentId);
        participantsList = Array.isArray(participantsData) 
          ? participantsData 
          : (participantsData?.participants || []);
        console.log('   Loaded participants:', participantsList.length);
      } catch (participantsError) {
        console.warn('Failed to load participants from dedicated endpoint, trying tournament data:', participantsError);
        // Fallback: get participants from tournament data
        if (tournamentData.participants && Array.isArray(tournamentData.participants)) {
          participantsList = tournamentData.participants;
        } else if (tournament?.participants && Array.isArray(tournament.participants)) {
          participantsList = tournament.participants;
        }
      }
      
      setParticipants(participantsList);
      
      // Load matches
      console.log('   Requesting matches for tournament ID:', tournamentId);
      const matchesData = await apiClient.getTournamentMatches(tournamentId);
      console.log('   Raw matches data from API:', matchesData);
      const matchesList = matchesData.matches || matchesData || [];
      console.log('✅ Loaded matches:', matchesList.length);
      console.log('   Completed matches:', matchesList.filter(m => m.status === 'completed').length);
      if (matchesList.length > 0) {
        console.log('   First match tournament_id:', matchesList[0].tournament_id);
        console.log('   Match tournament_ids:', [...new Set(matchesList.map(m => m.tournament_id))]);
      } else if (tournament && (tournament.status === 'ongoing' || tournament.status === 'live')) {
        console.warn('   ⚠️ Tournament is ongoing but has no matches. Matches should have been created when tournament status changed to ongoing.');
      }
      setMatches(matchesList);
      
      // Process data based on format
      if (tournamentFormat === "single-elimination") {
        processSingleEliminationMatches(matchesList, participantsList);
      } else if (tournamentFormat === "round-robin") {
        processRoundRobinData(matchesList, participantsList);
        // Check if tournament is completed after loading data
        setTimeout(() => {
          checkTournamentCompletion();
        }, 200);
      } else if (tournamentFormat === "group-stage") {
        processGroupStageData(matchesList, participantsList, tournament);
        
        // Check if all group stage matches are completed and playoff matches don't exist
        // NOTE: Removed automatic playoff match creation to prevent infinite loops
        // Playoff matches should be created manually or through a separate action
      }
      
      console.log('✅ Tournament data loaded');
      
    } catch (err: any) {
      console.error('Error loading tournament data:', err);
      toast.error(err.message || 'Failed to load tournament data');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [tournamentId, tournamentFormat]);
  
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId, tournamentFormat]); // Only reload when id or format changes, not when loadData changes

  const handleUpdateSingleElimMatch = async (matchId: number, score: string, winner: string) => {
    try {
      console.log('🔄 [MATCH UPDATE] Starting update:', { matchId, score, winner });
      
      // Parse score
      const { player1_scores, player2_scores } = parseScore(score);
      const winnerId = findPlayerId(winner);
      
      if (!winnerId && winner) {
        toast.error(`Player "${winner}" not found`);
        return;
      }
      
      console.log('   [MATCH UPDATE] Parsed data:', {
        player1_scores,
        player2_scores,
        winnerId,
        winnerName: winner
      });
      
      // Update match via API
      console.log('   [MATCH UPDATE] Calling API to update match...');
      await apiClient.updateMatch(matchId, {
        winner_id: winnerId,
        status: 'completed'
      });
      console.log('   [MATCH UPDATE] Match updated via API');
      
      // Update scores if provided (for bye matches, scores may be empty or default)
      // For bye matches, we still send scores (even if they're defaults like "11-0, 11-0, 11-0")
      if (player1_scores && player1_scores.length > 0 && player2_scores && player2_scores.length > 0) {
        console.log('   [MATCH UPDATE] Updating scores...');
        try {
          await apiClient.updateMatchScores(matchId, {
            player1_scores,
            player2_scores
          });
          console.log('   [MATCH UPDATE] Scores updated');
        } catch (scoreError) {
          console.warn('   [MATCH UPDATE] Warning: Failed to update scores (this is OK for bye matches):', scoreError);
          // Don't fail the entire update if scores fail - this is OK for bye matches
        }
      } else {
        console.log('   [MATCH UPDATE] No scores provided, skipping score update (this is OK for bye matches)');
      }
      
      toast.success("Match result saved!");
      
      // Reload matches to get updated data from backend
      console.log('   [MATCH UPDATE] Reloading matches from API...');
      const matchesData = await apiClient.getTournamentMatches(tournamentId);
      const matchesList = matchesData.matches || matchesData || [];
      console.log('   [MATCH UPDATE] Received', matchesList.length, 'matches from API');
      
      // ВАЖНО: Логируем ВСЕ матчи, особенно те, которые могут быть затронуты изменением
      console.log('   [MATCH UPDATE] 🔍 Checking all matches after update:');
      
      // Находим обновленный матч
      const updatedMatch = matchesList.find((m: any) => m.id === matchId);
      const updatedRound = updatedMatch?.round;
      
      // Определяем следующий раунд
      const roundProgression: { [key: string]: string } = {
        'Quarterfinals': 'Semifinals',
        'Semifinals': 'Final',
        'Round of 16': 'Quarterfinals',
        'Round of 32': 'Round of 16'
      };
      const nextRound = updatedRound ? roundProgression[updatedRound] : null;
      
      console.log(`   [MATCH UPDATE] 📊 Updated match ${matchId} is in ${updatedRound}, checking ${nextRound || 'Final'}...`);
      
      // Логируем обновленный матч
      if (updatedMatch) {
        console.log(`   [MATCH UPDATE] ✅ UPDATED Match ${updatedMatch.id} (${updatedMatch.round}):`, {
          player1_id: updatedMatch.player1_id,
          player2_id: updatedMatch.player2_id,
          player1_name: updatedMatch.player1_name,
          player2_name: updatedMatch.player2_name,
          winner_id: updatedMatch.winner_id,
          winner_name: updatedMatch.winner_name,
          winner_username: updatedMatch.winner_username,
          status: updatedMatch.status
        });
      }
      
      // Логируем все матчи следующего раунда (которые должны были обновиться)
      if (nextRound) {
        const nextRoundMatches = matchesList.filter((m: any) => m.round === nextRound);
        console.log(`   [MATCH UPDATE] 📊 Matches in ${nextRound} (should be affected):`);
        nextRoundMatches.forEach((m: any) => {
          console.log(`   [MATCH UPDATE]   Match ${m.id}:`, {
            player1_id: m.player1_id,
            player2_id: m.player2_id,
            player1_name: m.player1_name,
            player2_name: m.player2_name,
            winner_id: m.winner_id,
            winner_name: m.winner_name,
            winner_username: m.winner_username,
            status: m.status,
            hasOldWinner: m.winner_id && m.winner_id !== m.player1_id && m.winner_id !== m.player2_id ? '⚠️ OLD WINNER' : ''
          });
        });
      }
      
      // Логируем все матчи текущего раунда (для контекста)
      if (updatedRound) {
        const currentRoundMatches = matchesList.filter((m: any) => m.round === updatedRound);
        console.log(`   [MATCH UPDATE] 📊 All matches in ${updatedRound} (source round):`);
        currentRoundMatches.forEach((m: any) => {
          console.log(`   [MATCH UPDATE]   Match ${m.id}:`, {
            player1_id: m.player1_id,
            player2_id: m.player2_id,
            winner_id: m.winner_id,
            winner_name: m.winner_name,
            status: m.status,
            isUpdated: m.id === matchId ? '✅ UPDATED' : ''
          });
        });
      }
      
      // Process matches to update bracket display
      processSingleEliminationMatches(matchesList, participants);
      
      // Reload tournament data to check if tournament is completed
      const tournamentData = await apiClient.getTournament(tournamentId);
      setTournament(tournamentData);
      
      // Check if this is the final match for winner modal
      const roundName = updatedMatch?.round || '';
      const isFinalMatch = roundName === 'Final' || roundName === 'Finals';
      const finalMatches = matchesList.filter((m: any) => {
        const mRound = m.round || '';
        return mRound === 'Final' || mRound === 'Finals';
      });
      const isLastMatch = finalMatches.length === 1 && finalMatches[0]?.id === matchId;
      
      const shouldShowModal = winner && isFinalMatch && (
        (tournamentData?.status === 'completed') || isLastMatch
      );
      
      if (shouldShowModal) {
        console.log('🏆 [SINGLE-ELIM] Final match completed, completing tournament...');
        
        // Complete tournament if not already completed
        const currentStatus = tournamentData?.tournament?.status || tournamentData?.status;
        if (currentStatus !== 'completed') {
          try {
            await apiClient.updateTournament(tournamentId, { status: 'completed' });
            setTournament({ ...tournament, status: 'completed' });
            console.log('✅ [SINGLE-ELIM] Tournament completed');
          } catch (completeError) {
            console.error('❌ [SINGLE-ELIM] Error completing tournament:', completeError);
          }
        }
        
        // Get winner's avatar
        const winnerId = findPlayerId(winner);
        let winnerAvatar: string | undefined = undefined;
        
        if (winnerId) {
          try {
            const winnerData = await apiClient.getPlayer(winnerId);
            winnerAvatar = winnerData.avatar_url || undefined;
          } catch (err) {
            console.warn('Failed to fetch winner avatar:', err);
          }
        }
        
        setTimeout(() => {
          setTournamentWinner(winner);
          setTournamentWinnerAvatar(winnerAvatar);
          setShowWinnerModal(true);
        }, 500);
      }
      
      console.log('✅ [MATCH UPDATE] Update completed');
      
    } catch (err: any) {
      console.error('❌ [MATCH UPDATE] Error updating match:', err);
      toast.error(err.message || 'Failed to save match result');
    }
  };

  const handleUpdateRRResult = async (player1: string, player2: string, score: string) => {
    try {
      console.log('💾 Saving result:', player1, 'vs', player2, '=', score);
      
      // Find participant IDs for both players
      const p1Participant = participants.find((p: any) => 
        p.full_name === player1 || p.username === player1 || 
        `${p.full_name || p.username}` === player1
      );
      const p2Participant = participants.find((p: any) => 
        p.full_name === player2 || p.username === player2 || 
        `${p.full_name || p.username}` === player2
      );
      
      if (!p1Participant || !p2Participant) {
        console.error('❌ Participants not found:', { player1, player2, p1Found: !!p1Participant, p2Found: !!p2Participant });
        toast.error("One or both players not found");
        return;
      }
      
      const p1Id = p1Participant.id || p1Participant.player_id;
      const p2Id = p2Participant.id || p2Participant.player_id;
      
      console.log('👥 Participant IDs:', { player1, p1Id, player2, p2Id });
      
      // Find the match between these two players using participant IDs
      let match = matches.find(m => 
        (m.player1_id === p1Id && m.player2_id === p2Id) ||
        (m.player1_id === p2Id && m.player2_id === p1Id)
      );
      
      // Fallback to name matching if ID matching fails
      if (!match) {
        console.log('⚠️ ID match failed, trying name matching...');
        const matchByName = matches.find(m => 
          ((m.player1_name === player1 || m.player1_username === player1) && 
           (m.player2_name === player2 || m.player2_username === player2)) ||
          ((m.player1_name === player2 || m.player1_username === player2) && 
           (m.player2_name === player1 || m.player2_username === player1))
        );
        if (matchByName) {
          console.log('✅ Found match by name fallback');
          match = matchByName;
        } else {
          // Match doesn't exist - create it
          console.log('⚠️ Match not found in matches array, creating new match...');
          console.log('🔍 Available matches:', matches.map(m => ({
            id: m.id,
            p1_id: m.player1_id,
            p2_id: m.player2_id,
            p1_name: m.player1_name,
            p1_username: m.player1_username,
            p2_name: m.player2_name,
            p2_username: m.player2_username
          })));
          console.log('🔍 Creating match for:', { player1, player2, p1Id, p2Id, tournamentId });
          
          try {
            const newMatch = await apiClient.createMatch({
              tournament_id: tournamentId,
              player1_id: p1Id,
              player2_id: p2Id,
              round: 'Round Robin',
              status: 'scheduled'
            });
            console.log('✅ Match created:', newMatch);
            match = newMatch;
          } catch (createError: any) {
            console.error('❌ Failed to create match:', createError);
            toast.error(createError.message || 'Failed to create match. Please ensure the tournament has started.');
            return;
          }
        }
      }
      
      console.log('✅ Match found:', match.id, 'p1_id:', match.player1_id, 'p2_id:', match.player2_id);
      
      // Parse score
      const { player1_scores, player2_scores } = parseScore(score);
      console.log('📊 Parsed scores:', player1_scores, 'vs', player2_scores);
      
      // Determine winner
      // Note: player1_scores and player2_scores correspond to player1 and player2 parameters
      // We need to map them to match.player1_id and match.player2_id correctly
      let winnerId = null;
      if (player1_scores.length > 0 && player2_scores.length > 0) {
        const p1Wins = player1_scores.filter((s1, i) => s1 > (player2_scores[i] || 0)).length;
        const p2Wins = player2_scores.filter((s2, i) => s2 > (player1_scores[i] || 0)).length;
        
        // Check if match order matches parameter order
        const isOrderReversed = match.player1_id !== p1Id;
        
        if (p1Wins > p2Wins) {
          // player1 (parameter) won
          winnerId = isOrderReversed ? match.player2_id : match.player1_id;
        } else if (p2Wins > p1Wins) {
          // player2 (parameter) won
          winnerId = isOrderReversed ? match.player1_id : match.player2_id;
        }
        console.log('🏆 Winner determination:', { 
          p1Wins, 
          p2Wins, 
          isOrderReversed, 
          winnerId,
          match_p1_id: match.player1_id,
          match_p2_id: match.player2_id,
          param_p1_id: p1Id,
          param_p2_id: p2Id
        });
      }
      
      // Update match
      console.log('📝 Updating match...');
      await apiClient.updateMatch(match.id, {
        winner_id: winnerId,
        status: 'completed'
      });
      console.log('✅ Match updated');
      
      // Check if the order is reversed by comparing participant IDs
      const isReversed = match.player1_id !== p1Id;
      
      // Update scores
      if (player1_scores.length > 0 && player2_scores.length > 0) {
        // Ensure correct order (player1_id vs player2_id)
        const scores = isReversed ? {
          player1_scores: player2_scores,
          player2_scores: player1_scores
        } : {
          player1_scores,
          player2_scores
        };
        
        console.log('📊 Updating scores:', scores);
        await apiClient.updateMatchScores(match.id, scores);
        console.log('✅ Scores updated');
      }
      
      toast.success("Match result saved!");
      
      // Update local state instead of reloading to avoid flash
      console.log('📝 Updating local state...');
      
      // Update matches array - add the match if it was just created, or update it
      setMatches(prevMatches => {
        const existingIndex = prevMatches.findIndex(m => m.id === match.id);
        const updatedMatch = {
          ...match,
          status: 'completed',
          winner_id: winnerId,
          player1_name: p1Participant.full_name || p1Participant.username,
          player2_name: p2Participant.full_name || p2Participant.username,
          player1_scores: isReversed ? player2_scores : player1_scores,
          player2_scores: isReversed ? player1_scores : player2_scores
        };
        
        if (existingIndex >= 0) {
          // Update existing match
          const updated = [...prevMatches];
          updated[existingIndex] = updatedMatch;
          return updated;
        } else {
          // Add new match
          return [...prevMatches, updatedMatch];
        }
      });
      
      // Update rrResults with the new score (only if scores exist)
      if (player1_scores.length > 0 && player2_scores.length > 0) {
        const p1Name = p1Participant.full_name || p1Participant.username;
        const p2Name = p2Participant.full_name || p2Participant.username;
        // Format score from match perspective (match.player1_id vs match.player2_id)
        const formattedScore = formatScore(
          isReversed ? player2_scores : player1_scores,
          isReversed ? player1_scores : player2_scores
        );
        // For the reverse key, we need to reverse the score
        const reversedScore = reverseScore(formattedScore);
        
        setRRResults(prevResults => ({
          ...prevResults,
          [`${p1Name}-${p2Name}`]: formattedScore,
          [`${p2Name}-${p1Name}`]: reversedScore
        }));
      }
      
      console.log('✅ Local state updated');
      
      // Reload matches from API to ensure we have the latest state
      try {
        const matchesData = await apiClient.getTournamentMatches(tournamentId);
        const matchesList = matchesData.matches || matchesData || [];
        setMatches(matchesList);
        
        // Update round robin data with fresh matches
        processRoundRobinData(matchesList, participants);
        
        // Check if all matches are completed after state update
        // Use longer delay to ensure state is fully updated
        setTimeout(() => {
          // Pass fresh matches list to avoid stale state
          checkTournamentCompletionWithMatches(matchesList);
        }, 500);
      } catch (reloadError) {
        console.warn('Failed to reload matches, checking with current state:', reloadError);
        // Fallback: check with current state
        setTimeout(() => {
          checkTournamentCompletion();
        }, 500);
      }
      
    } catch (err: any) {
      console.error('❌ Error updating round robin result:', err);
      toast.error(err.message || 'Failed to save match result');
    }
  };

  // Wrapper function to check completion with specific matches list
  const checkTournamentCompletionWithMatches = async (matchesList: any[]) => {
    return checkTournamentCompletion(matchesList);
  };

  // Check if tournament is completed (with optional matches parameter to avoid stale state)
  const checkTournamentCompletion = async (matchesToCheck?: any[]) => {
    const matchesToUse = matchesToCheck || matches;
    
    if (rrPlayers.length === 0 || tournamentFormat !== 'round-robin') return;
    
    // Don't check if tournament is already completed or modal is already shown
    if (tournament?.status === 'completed' || showWinnerModal) {
      return;
    }
    
    // Calculate total matches needed (each player plays every other player once)
    const totalMatches = (rrPlayers.length * (rrPlayers.length - 1)) / 2;
    
    // Check completed matches directly from matches state
    // For round robin tournaments, matches typically don't have group_name
    // and may or may not have round set to 'Round Robin'
    const roundRobinMatches = matchesToUse.filter(m => {
      // Exclude group stage matches (they have group_name)
      if (m.group_name) return false;
      // Include matches with round === 'Round Robin' or no round (default round robin)
      // Exclude Group Stage matches explicitly
      return m.round === 'Round Robin' || 
             !m.round || 
             (m.round && m.round !== 'Group Stage');
    });
    
    console.log('🔍 [ROUND-ROBIN] Filtered matches:', {
      totalMatchesInState: matchesToUse.length,
      roundRobinMatches: roundRobinMatches.length,
      sampleMatch: roundRobinMatches[0] ? {
        id: roundRobinMatches[0].id,
        round: roundRobinMatches[0].round,
        group_name: roundRobinMatches[0].group_name,
        status: roundRobinMatches[0].status
      } : null
    });
    
    const completedMatches = roundRobinMatches.filter(m => 
      m.status === 'completed' && 
      m.player1_scores && 
      m.player2_scores && 
      m.player1_scores.length > 0 && 
      m.player2_scores.length > 0
    );
    
    console.log('🏆 [ROUND-ROBIN] Checking tournament completion:', {
      totalMatches,
      completedMatches: completedMatches.length,
      totalRoundRobinMatches: roundRobinMatches.length,
      tournamentStatus: tournament?.status,
      rrPlayersCount: rrPlayers.length,
      showWinnerModal,
      conditionMet: completedMatches.length >= totalMatches
    });
    
    // Check if all matches are completed
    // For round robin: each player plays every other player once
    // So we need exactly totalMatches completed matches
    // We check completedMatches.length >= totalMatches to ensure all required matches are done
    if (completedMatches.length >= totalMatches) {
      console.log('🏆 [ROUND-ROBIN] ✅ All matches completed! Determining winner...');
      console.log('🏆 [ROUND-ROBIN] Completed matches details:', completedMatches.map(m => ({
        id: m.id,
        p1: m.player1_name || m.player1_username,
        p2: m.player2_name || m.player2_username,
        status: m.status,
        scores: { p1: m.player1_scores, p2: m.player2_scores }
      })));
      
      // Rebuild rrResults from matches to ensure accuracy
      const updatedResults: { [key: string]: string } = {};
      completedMatches.forEach(match => {
        const player1 = match.player1_name || match.player1_username;
        const player2 = match.player2_name || match.player2_username;
        if (player1 && player2 && match.player1_scores && match.player2_scores) {
          const score = formatScore(match.player1_scores, match.player2_scores);
          updatedResults[`${player1}-${player2}`] = score;
          updatedResults[`${player2}-${player1}`] = reverseScore(score);
        }
      });
      
      // Calculate standings and get winner
      const standings = calculateStandings(rrPlayers, updatedResults);
      
      if (standings.length > 0) {
        const winnerName = standings[0].player;
        const winnerParticipant = participants.find((p: any) => 
          (p.full_name || p.username) === winnerName
        );
        
        if (winnerParticipant) {
          const winnerId = winnerParticipant.id || winnerParticipant.player_id;
          
          console.log('🏆 [ROUND-ROBIN] Winner determined:', winnerName, 'ID:', winnerId);
          
          // Get winner avatar
          let winnerAvatar: string | undefined = undefined;
          try {
            const winnerData = await apiClient.getPlayer(winnerId);
            winnerAvatar = winnerData.avatar_url || undefined;
          } catch (err) {
            console.warn('Failed to fetch winner avatar:', err);
          }
          
          // Complete tournament first
          try {
            await apiClient.completeTournament(tournamentId);
            // Reload tournament data to get updated status
            const tournamentData = await apiClient.getTournament(tournamentId);
            setTournament(tournamentData.tournament || tournamentData);
            console.log('✅ [ROUND-ROBIN] Tournament completed');
          } catch (completeError: any) {
            console.error('❌ [ROUND-ROBIN] Failed to complete tournament:', completeError);
            // Continue to show modal even if completion fails
          }
          
          // Set winner for modal with a small delay to ensure state is updated
          setTimeout(() => {
            setTournamentWinner(winnerName);
            setTournamentWinnerAvatar(winnerAvatar);
            setShowWinnerModal(true);
            console.log('🎉 [ROUND-ROBIN] Winner modal shown');
          }, 500);
        }
      }
    }
  };

  const handleUpdateGroupAResult = async (player1: string, player2: string, score: string) => {
    try {
      console.log('💾 [GROUP A] Saving result:', { player1, player2, score });
      console.log('💾 [GROUP A] Available matches:', matches.length);
      console.log('💾 [GROUP A] Matches in group A:', matches.filter(m => (m.group_name === "A" || m.group_name === "a")).map(m => ({
        id: m.id,
        p1: m.player1_name || m.player1_username,
        p2: m.player2_name || m.player2_username,
        group: m.group_name
      })));
      
      // Find match in Group A (handle both "A" and "Group A")
      const match = matches.find(m => 
        (m.group_name === "A" || m.group_name === "a" || m.group_name === "Group A") &&
        m.round === 'Group Stage' &&
        (((m.player1_name === player1 || m.player1_username === player1) && 
          (m.player2_name === player2 || m.player2_username === player2)) ||
         ((m.player1_name === player2 || m.player1_username === player2) && 
          (m.player2_name === player1 || m.player2_username === player1)))
      );
      
      if (!match) {
        console.log('⚠️ [GROUP A] Match not found, creating new match...');
        // Find participant IDs
        const p1Participant = participants.find((p: any) => 
          p.full_name === player1 || p.username === player1 || 
          `${p.full_name || p.username}` === player1
        );
        const p2Participant = participants.find((p: any) => 
          p.full_name === player2 || p.username === player2 || 
          `${p.full_name || p.username}` === player2
        );
        
        if (!p1Participant || !p2Participant) {
          console.error('❌ [GROUP A] Participants not found:', { player1, player2, p1Found: !!p1Participant, p2Found: !!p2Participant });
          toast.error("One or both players not found");
          return;
        }
        
        const p1Id = p1Participant.id || p1Participant.player_id;
        const p2Id = p2Participant.id || p2Participant.player_id;
        
        try {
          console.log('📝 [GROUP A] Creating match via API...');
          const newMatch = await apiClient.createMatch({
            tournament_id: tournamentId,
            player1_id: p1Id,
            player2_id: p2Id,
            round: 'Group Stage',
            group_name: 'A',
            status: 'scheduled'
          });
          console.log('✅ [GROUP A] Match created:', newMatch);
          
          // Add to matches state
          setMatches(prev => [...prev, newMatch]);
          
          // Use the newly created match
          const createdMatch = newMatch;
          
          // Continue with update logic
        const { player1_scores, player2_scores } = parseScore(score);
        let winnerId = null;
        
          if (player1_scores.length > 0 && player2_scores.length > 0) {
            const p1Wins = player1_scores.filter((s1, i) => s1 > (player2_scores[i] || 0)).length;
            const p2Wins = player2_scores.filter((s2, i) => s2 > (player1_scores[i] || 0)).length;
            winnerId = p1Wins > p2Wins ? createdMatch.player1_id : (p2Wins > p1Wins ? createdMatch.player2_id : null);
            console.log('🏆 [GROUP A] Winner determined:', { p1Wins, p2Wins, winnerId });
          }
          
          console.log('📝 [GROUP A] Updating match via API...');
          await apiClient.updateMatch(createdMatch.id, { winner_id: winnerId, status: 'completed' });
          console.log('✅ [GROUP A] Match updated via API');
          
          if (player1_scores.length > 0 && player2_scores.length > 0) {
            console.log('📊 [GROUP A] Updating scores via API...');
            await apiClient.updateMatchScores(createdMatch.id, { player1_scores, player2_scores });
            console.log('✅ [GROUP A] Scores updated via API');
          }
          
          // Update local state
          setMatches(prevMatches => {
            const existingIndex = prevMatches.findIndex(m => m.id === createdMatch.id);
            const updatedMatch = {
              ...createdMatch,
              status: 'completed',
              winner_id: winnerId,
              player1_scores,
              player2_scores
            };
            
            if (existingIndex >= 0) {
              const newMatches = [...prevMatches];
              newMatches[existingIndex] = updatedMatch;
              return newMatches;
            } else {
              return [...prevMatches, updatedMatch];
            }
          });
          
          const updatedGroupAResults = {
            [`${player1}-${player2}`]: score,
            [`${player2}-${player1}`]: reverseScore(score)
          };
          
          setGroupAResults(prev => ({
            ...prev,
            ...updatedGroupAResults
          }));
          
          // Also update groupResults for Group A
          setGroupResults(prev => ({
            ...prev,
            "Group A": {
              ...(prev["Group A"] || {}),
              ...updatedGroupAResults
            },
            "A": {
              ...(prev["A"] || {}),
              ...updatedGroupAResults
            }
          }));
          
          toast.success("Match result saved!");
          
          // Don't reload automatically - state is already updated
          return;
        } catch (createError: any) {
          console.error('❌ [GROUP A] Failed to create match:', createError);
          toast.error(createError.message || 'Failed to create match. Please ensure the tournament has started.');
          return;
        }
      }
      
      console.log('✅ [GROUP A] Match found:', { id: match.id, p1_id: match.player1_id, p2_id: match.player2_id });
      
      const { player1_scores, player2_scores } = parseScore(score);
      console.log('📊 [GROUP A] Parsed scores:', { player1_scores, player2_scores });
      
      let winnerId = null;
        if (player1_scores.length > 0 && player2_scores.length > 0) {
          const p1Wins = player1_scores.filter((s1, i) => s1 > (player2_scores[i] || 0)).length;
          const p2Wins = player2_scores.filter((s2, i) => s2 > (player1_scores[i] || 0)).length;
          winnerId = p1Wins > p2Wins ? match.player1_id : (p2Wins > p1Wins ? match.player2_id : null);
        console.log('🏆 [GROUP A] Winner determined:', { p1Wins, p2Wins, winnerId });
        }
        
      console.log('📝 [GROUP A] Updating match via API...');
        await apiClient.updateMatch(match.id, { winner_id: winnerId, status: 'completed' });
      console.log('✅ [GROUP A] Match updated via API');
      
        if (player1_scores.length > 0 && player2_scores.length > 0) {
        console.log('📊 [GROUP A] Updating scores via API...');
          await apiClient.updateMatchScores(match.id, { player1_scores, player2_scores });
        console.log('✅ [GROUP A] Scores updated via API');
      }
      
      // Update local state immediately for UI feedback
      console.log('🔄 [GROUP A] Updating local state...');
      setMatches(prevMatches => {
        const existingIndex = prevMatches.findIndex(m => m.id === match.id);
        const updatedMatch = {
          ...match,
          status: 'completed',
          winner_id: winnerId,
          player1_scores,
          player2_scores
        };
        
        console.log('🔄 [GROUP A] Match state update:', { existingIndex, matchId: match.id, updatedMatch });
        
        if (existingIndex >= 0) {
          const newMatches = [...prevMatches];
          newMatches[existingIndex] = updatedMatch;
          console.log('✅ [GROUP A] Updated existing match in state');
          return newMatches;
        } else {
          console.log('✅ [GROUP A] Added new match to state');
          return [...prevMatches, updatedMatch];
        }
      });
      
      // Update group results state immediately
      console.log('🔄 [GROUP A] Updating group results state...');
      const updatedGroupAResults = {
        [`${player1}-${player2}`]: score,
        [`${player2}-${player1}`]: reverseScore(score)
      };
      
      setGroupAResults(prev => {
        const updated = {
        ...prev,
          ...updatedGroupAResults
        };
        console.log('✅ [GROUP A] Group A results updated:', updated);
        return updated;
      });
      
      // Also update groupResults for Group A
      setGroupResults(prev => {
        const updated = {
          ...prev,
          "Group A": {
            ...(prev["Group A"] || {}),
            ...updatedGroupAResults
          },
          "A": {
            ...(prev["A"] || {}),
            ...updatedGroupAResults
          }
        };
        console.log('✅ [GROUP A] Group results updated:', updated);
        return updated;
      });
      
      toast.success("Match result saved!");
      console.log('✅ [GROUP A] Match result saved');
      
      // Reload matches to check if all group matches are completed
      try {
        const matchesData = await apiClient.getTournamentMatches(tournamentId);
        const matchesList = matchesData.matches || matchesData || [];
        setMatches(matchesList);
        
        // Process group stage data to check completion and auto-create playoff matches
        processGroupStageData(matchesList, participants, tournament);
      } catch (reloadError) {
        console.warn('Failed to reload matches after group match update:', reloadError);
      }
    } catch (err: any) {
      console.error('❌ [GROUP A] Error updating group result:', err);
      console.error('❌ [GROUP A] Error stack:', err.stack);
      toast.error(err.message || 'Failed to save match result');
    }
  };

  const handleUpdateGroupMatch = async (groupName: string, player1: string, player2: string, score: string) => {
    try {
      console.log('💾 [GROUP MATCH] Saving result:', { groupName, player1, player2, score });
      console.log('💾 [GROUP MATCH] Available matches:', matches.length);
      console.log('💾 [GROUP MATCH] Matches in group:', matches.filter(m => 
        (m.group_name === groupName || m.group_name === groupName.replace("Group ", ""))
      ).map(m => ({
        id: m.id,
        p1: m.player1_name || m.player1_username,
        p2: m.player2_name || m.player2_username,
        group: m.group_name
      })));
      
      // Normalize group name for matching
      const normalizedGroupName = groupName.startsWith('Group ') ? groupName.replace("Group ", "") : groupName;
      
      // Find match in the specified group (handle both "A" and "Group A" formats)
      const match = matches.find(m => 
        (m.group_name === groupName || m.group_name === normalizedGroupName || m.group_name === `Group ${normalizedGroupName}`) &&
        m.round === 'Group Stage' &&
        (((m.player1_name === player1 || m.player1_username === player1) && 
          (m.player2_name === player2 || m.player2_username === player2)) ||
         ((m.player1_name === player2 || m.player1_username === player2) && 
          (m.player2_name === player1 || m.player2_username === player1)))
      );
      
      if (!match) {
        console.log('⚠️ [GROUP MATCH] Match not found, creating new match...');
        // Find participant IDs
        const p1Participant = participants.find((p: any) => 
          p.full_name === player1 || p.username === player1 || 
          `${p.full_name || p.username}` === player1
        );
        const p2Participant = participants.find((p: any) => 
          p.full_name === player2 || p.username === player2 || 
          `${p.full_name || p.username}` === player2
        );
        
        if (!p1Participant || !p2Participant) {
          console.error('❌ [GROUP MATCH] Participants not found:', { player1, player2, p1Found: !!p1Participant, p2Found: !!p2Participant });
          toast.error("One or both players not found");
          return;
        }
        
        const p1Id = p1Participant.id || p1Participant.player_id;
        const p2Id = p2Participant.id || p2Participant.player_id;
        // Use normalizedGroupName from above (without "Group " prefix for API)
        const groupNameForAPI = normalizedGroupName;
        
        try {
          console.log('📝 [GROUP MATCH] Creating match via API...');
          const newMatch = await apiClient.createMatch({
            tournament_id: tournamentId,
            player1_id: p1Id,
            player2_id: p2Id,
            round: 'Group Stage',
            group_name: groupNameForAPI,
            status: 'scheduled'
          });
          console.log('✅ [GROUP MATCH] Match created:', newMatch);
          
          // Add to matches state
          setMatches(prev => [...prev, newMatch]);
          
          // Use the newly created match
          const createdMatch = newMatch;
          
          // Continue with update logic
        const { player1_scores, player2_scores } = parseScore(score);
        let winnerId = null;
        
          if (player1_scores.length > 0 && player2_scores.length > 0) {
            const p1Wins = player1_scores.filter((s1, i) => s1 > (player2_scores[i] || 0)).length;
            const p2Wins = player2_scores.filter((s2, i) => s2 > (player1_scores[i] || 0)).length;
            winnerId = p1Wins > p2Wins ? createdMatch.player1_id : (p2Wins > p1Wins ? createdMatch.player2_id : null);
            console.log('🏆 [GROUP MATCH] Winner determined:', { p1Wins, p2Wins, winnerId });
          }
          
          console.log('📝 [GROUP MATCH] Updating match via API...');
          await apiClient.updateMatch(createdMatch.id, { winner_id: winnerId, status: 'completed' });
          console.log('✅ [GROUP MATCH] Match updated via API');
          
          if (player1_scores.length > 0 && player2_scores.length > 0) {
            console.log('📊 [GROUP MATCH] Updating scores via API...');
            await apiClient.updateMatchScores(createdMatch.id, { player1_scores, player2_scores });
            console.log('✅ [GROUP MATCH] Scores updated via API');
          }
          
          // Update local state
          setMatches(prevMatches => {
            const existingIndex = prevMatches.findIndex(m => m.id === createdMatch.id);
            const updatedMatch = {
              ...createdMatch,
              status: 'completed',
              winner_id: winnerId,
              player1_scores,
              player2_scores
            };
            
            if (existingIndex >= 0) {
              const newMatches = [...prevMatches];
              newMatches[existingIndex] = updatedMatch;
              return newMatches;
            } else {
              return [...prevMatches, updatedMatch];
            }
          });
          
          const normalizedGroupName = groupName.startsWith('Group ') ? groupName : `Group ${groupName}`;
          const updatedGroupResults = {
            [`${player1}-${player2}`]: score,
            [`${player2}-${player1}`]: reverseScore(score)
          };
          
          setGroupResults(prev => ({
            ...prev,
            [groupName]: {
              ...(prev[groupName] || {}),
              ...updatedGroupResults
            },
            [normalizedGroupName]: {
              ...(prev[normalizedGroupName] || {}),
              ...updatedGroupResults
            }
          }));
          
          toast.success("Match result saved!");
          
          // Don't reload automatically - state is already updated
          
          return;
        } catch (createError: any) {
          console.error('❌ [GROUP MATCH] Failed to create match:', createError);
          toast.error(createError.message || 'Failed to create match. Please ensure the tournament has started.');
          return;
        }
      }
      
      console.log('✅ [GROUP MATCH] Match found:', { id: match.id, p1_id: match.player1_id, p2_id: match.player2_id });
      
      const { player1_scores, player2_scores } = parseScore(score);
      console.log('📊 [GROUP MATCH] Parsed scores:', { player1_scores, player2_scores });
      
      let winnerId = null;
        if (player1_scores.length > 0 && player2_scores.length > 0) {
          const p1Wins = player1_scores.filter((s1, i) => s1 > (player2_scores[i] || 0)).length;
          const p2Wins = player2_scores.filter((s2, i) => s2 > (player1_scores[i] || 0)).length;
          winnerId = p1Wins > p2Wins ? match.player1_id : (p2Wins > p1Wins ? match.player2_id : null);
        console.log('🏆 [GROUP MATCH] Winner determined:', { p1Wins, p2Wins, winnerId });
        }
        
      console.log('📝 [GROUP MATCH] Updating match via API...');
        await apiClient.updateMatch(match.id, { winner_id: winnerId, status: 'completed' });
      console.log('✅ [GROUP MATCH] Match updated via API');
      
        if (player1_scores.length > 0 && player2_scores.length > 0) {
        console.log('📊 [GROUP MATCH] Updating scores via API...');
          await apiClient.updateMatchScores(match.id, { player1_scores, player2_scores });
        console.log('✅ [GROUP MATCH] Scores updated via API');
      }
      
      // Update local state immediately for UI feedback
      console.log('🔄 [GROUP MATCH] Updating local state...');
      setMatches(prevMatches => {
        const existingIndex = prevMatches.findIndex(m => m.id === match.id);
        const updatedMatch = {
          ...match,
          status: 'completed',
          winner_id: winnerId,
          player1_scores,
          player2_scores
        };
        
        console.log('🔄 [GROUP MATCH] Match state update:', { existingIndex, matchId: match.id });
        
        if (existingIndex >= 0) {
          const newMatches = [...prevMatches];
          newMatches[existingIndex] = updatedMatch;
          console.log('✅ [GROUP MATCH] Updated existing match in state');
          return newMatches;
        } else {
          console.log('✅ [GROUP MATCH] Added new match to state');
          return [...prevMatches, updatedMatch];
        }
      });
      
        // Update group results state immediately
        console.log('🔄 [GROUP MATCH] Updating group results state...');
          // normalizedGroupName already defined above, use it for display name
          const displayGroupName = groupName.startsWith('Group ') ? groupName : `Group ${groupName}`;
          const updatedGroupResults = {
            [`${player1}-${player2}`]: score,
            [`${player2}-${player1}`]: reverseScore(score)
          };
          
          setGroupResults(prev => {
            const updated = {
        ...prev,
        [groupName]: {
          ...(prev[groupName] || {}),
                ...updatedGroupResults
              },
              [displayGroupName]: {
                ...(prev[displayGroupName] || {}),
                ...updatedGroupResults
              }
            };
          console.log('✅ [GROUP MATCH] Group results updated for', groupName, 'and', displayGroupName);
          return updated;
        });
      
      toast.success("Match result saved!");
      console.log('✅ [GROUP MATCH] Match result saved');
      
      // Don't reload automatically - state is already updated
    } catch (err: any) {
      console.error('❌ [GROUP MATCH] Error updating group result:', err);
      console.error('❌ [GROUP MATCH] Error stack:', err.stack);
      toast.error(err.message || 'Failed to save match result');
    }
  };

  const handleUpdateGroupBResult = async (player1: string, player2: string, score: string) => {
    try {
      console.log('💾 [GROUP B] Saving result:', { player1, player2, score });
      console.log('💾 [GROUP B] Available matches:', matches.length);
      console.log('💾 [GROUP B] Matches in group B:', matches.filter(m => (m.group_name === "B" || m.group_name === "b")).map(m => ({
        id: m.id,
        p1: m.player1_name || m.player1_username,
        p2: m.player2_name || m.player2_username,
        group: m.group_name
      })));
      
      // Find match in Group B (handle both "B" and "Group B")
      const match = matches.find(m => 
        (m.group_name === "B" || m.group_name === "b" || m.group_name === "Group B") &&
        m.round === 'Group Stage' &&
        (((m.player1_name === player1 || m.player1_username === player1) && 
          (m.player2_name === player2 || m.player2_username === player2)) ||
         ((m.player1_name === player2 || m.player1_username === player2) && 
          (m.player2_name === player1 || m.player2_username === player1)))
      );
      
      if (!match) {
        console.log('⚠️ [GROUP B] Match not found, creating new match...');
        // Find participant IDs
        const p1Participant = participants.find((p: any) => 
          p.full_name === player1 || p.username === player1 || 
          `${p.full_name || p.username}` === player1
        );
        const p2Participant = participants.find((p: any) => 
          p.full_name === player2 || p.username === player2 || 
          `${p.full_name || p.username}` === player2
        );
        
        if (!p1Participant || !p2Participant) {
          console.error('❌ [GROUP B] Participants not found:', { player1, player2, p1Found: !!p1Participant, p2Found: !!p2Participant });
          toast.error("One or both players not found");
          return;
        }
        
        const p1Id = p1Participant.id || p1Participant.player_id;
        const p2Id = p2Participant.id || p2Participant.player_id;
        
        try {
          console.log('📝 [GROUP B] Creating match via API...');
          const newMatch = await apiClient.createMatch({
            tournament_id: tournamentId,
            player1_id: p1Id,
            player2_id: p2Id,
            round: 'Group Stage',
            group_name: 'B',
            status: 'scheduled'
          });
          console.log('✅ [GROUP B] Match created:', newMatch);
          
          // Add to matches state
          setMatches(prev => [...prev, newMatch]);
          
          // Use the newly created match
          const createdMatch = newMatch;
          
          // Continue with update logic
        const { player1_scores, player2_scores } = parseScore(score);
        let winnerId = null;
        
          if (player1_scores.length > 0 && player2_scores.length > 0) {
            const p1Wins = player1_scores.filter((s1, i) => s1 > (player2_scores[i] || 0)).length;
            const p2Wins = player2_scores.filter((s2, i) => s2 > (player1_scores[i] || 0)).length;
            winnerId = p1Wins > p2Wins ? createdMatch.player1_id : (p2Wins > p1Wins ? createdMatch.player2_id : null);
            console.log('🏆 [GROUP B] Winner determined:', { p1Wins, p2Wins, winnerId });
          }
          
          console.log('📝 [GROUP B] Updating match via API...');
          await apiClient.updateMatch(createdMatch.id, { winner_id: winnerId, status: 'completed' });
          console.log('✅ [GROUP B] Match updated via API');
          
          if (player1_scores.length > 0 && player2_scores.length > 0) {
            console.log('📊 [GROUP B] Updating scores via API...');
            await apiClient.updateMatchScores(createdMatch.id, { player1_scores, player2_scores });
            console.log('✅ [GROUP B] Scores updated via API');
          }
          
          // Update local state
          setMatches(prevMatches => {
            const existingIndex = prevMatches.findIndex(m => m.id === createdMatch.id);
            const updatedMatch = {
              ...createdMatch,
              status: 'completed',
              winner_id: winnerId,
              player1_scores,
              player2_scores
            };
            
            if (existingIndex >= 0) {
              const newMatches = [...prevMatches];
              newMatches[existingIndex] = updatedMatch;
              return newMatches;
            } else {
              return [...prevMatches, updatedMatch];
            }
          });
          
          const updatedGroupBResults = {
            [`${player1}-${player2}`]: score,
            [`${player2}-${player1}`]: reverseScore(score)
          };
          
          setGroupBResults(prev => ({
            ...prev,
            ...updatedGroupBResults
          }));
          
          // Also update groupResults for Group B
          setGroupResults(prev => ({
            ...prev,
            "Group B": {
              ...(prev["Group B"] || {}),
              ...updatedGroupBResults
            },
            "B": {
              ...(prev["B"] || {}),
              ...updatedGroupBResults
            }
          }));
          
          toast.success("Match result saved!");
          
          // Reload matches to check if all group matches are completed
          try {
            const matchesData = await apiClient.getTournamentMatches(tournamentId);
            const matchesList = matchesData.matches || matchesData || [];
            setMatches(matchesList);
            
            // Process group stage data to check completion and auto-create playoff matches
            processGroupStageData(matchesList, participants, tournament);
          } catch (reloadError) {
            console.warn('Failed to reload matches after group match update:', reloadError);
          }
          
          return;
        } catch (createError: any) {
          console.error('❌ [GROUP B] Failed to create match:', createError);
          toast.error(createError.message || 'Failed to create match. Please ensure the tournament has started.');
          return;
        }
      }
      
      console.log('✅ [GROUP B] Match found:', { id: match.id, p1_id: match.player1_id, p2_id: match.player2_id });
      
      const { player1_scores, player2_scores } = parseScore(score);
      console.log('📊 [GROUP B] Parsed scores:', { player1_scores, player2_scores });
      
      let winnerId = null;
        if (player1_scores.length > 0 && player2_scores.length > 0) {
          const p1Wins = player1_scores.filter((s1, i) => s1 > (player2_scores[i] || 0)).length;
          const p2Wins = player2_scores.filter((s2, i) => s2 > (player1_scores[i] || 0)).length;
          winnerId = p1Wins > p2Wins ? match.player1_id : (p2Wins > p1Wins ? match.player2_id : null);
        console.log('🏆 [GROUP B] Winner determined:', { p1Wins, p2Wins, winnerId });
        }
        
      console.log('📝 [GROUP B] Updating match via API...');
        await apiClient.updateMatch(match.id, { winner_id: winnerId, status: 'completed' });
      console.log('✅ [GROUP B] Match updated via API');
      
        if (player1_scores.length > 0 && player2_scores.length > 0) {
        console.log('📊 [GROUP B] Updating scores via API...');
          await apiClient.updateMatchScores(match.id, { player1_scores, player2_scores });
        console.log('✅ [GROUP B] Scores updated via API');
      }
      
      // Update local state immediately for UI feedback
      console.log('🔄 [GROUP B] Updating local state...');
      setMatches(prevMatches => {
        const existingIndex = prevMatches.findIndex(m => m.id === match.id);
        const updatedMatch = {
          ...match,
          status: 'completed',
          winner_id: winnerId,
          player1_scores,
          player2_scores
        };
        
        console.log('🔄 [GROUP B] Match state update:', { existingIndex, matchId: match.id, updatedMatch });
        
        if (existingIndex >= 0) {
          const newMatches = [...prevMatches];
          newMatches[existingIndex] = updatedMatch;
          console.log('✅ [GROUP B] Updated existing match in state');
          return newMatches;
        } else {
          console.log('✅ [GROUP B] Added new match to state');
          return [...prevMatches, updatedMatch];
        }
      });
      
        // Update group results state immediately
        console.log('🔄 [GROUP B] Updating group results state...');
        const updatedGroupBResults = {
          [`${player1}-${player2}`]: score,
          [`${player2}-${player1}`]: reverseScore(score)
        };
        
        setGroupBResults(prev => {
          const updated = {
        ...prev,
            ...updatedGroupBResults
          };
          console.log('✅ [GROUP B] Group B results updated:', updated);
          return updated;
        });
        
        // Also update groupResults for Group B
        setGroupResults(prev => {
          const updated = {
            ...prev,
            "Group B": {
              ...(prev["Group B"] || {}),
              ...updatedGroupBResults
            },
            "B": {
              ...(prev["B"] || {}),
              ...updatedGroupBResults
            }
          };
          console.log('✅ [GROUP B] Group results updated:', updated);
          return updated;
        });
      
      toast.success("Match result saved!");
      console.log('✅ [GROUP B] Match result saved');
      
      // Reload matches to check if all group matches are completed
      try {
        const matchesData = await apiClient.getTournamentMatches(tournamentId);
        const matchesList = matchesData.matches || matchesData || [];
        setMatches(matchesList);
        
        // Process group stage data to check completion and auto-create playoff matches
        processGroupStageData(matchesList, participants, tournament);
      } catch (reloadError) {
        console.warn('Failed to reload matches after group match update:', reloadError);
      }
    } catch (err: any) {
      console.error('❌ [GROUP B] Error updating group result:', err);
      console.error('❌ [GROUP B] Error stack:', err.stack);
      toast.error(err.message || 'Failed to save match result');
    }
  };

  const handleUpdatePlayoffMatch = async (matchId: number, score: string, winner: string) => {
    // Don't allow updating preview matches (negative IDs)
    if (matchId < 0) {
      toast.error("Cannot update preview matches. Complete all group stage matches first.");
      return;
    }
    try {
      const { player1_scores, player2_scores } = parseScore(score);
      const winnerId = findPlayerId(winner);
      
      if (!winnerId && winner) {
        toast.error(`Player "${winner}" not found`);
        return;
      }
      
      await apiClient.updateMatch(matchId, {
        winner_id: winnerId,
        status: 'completed'
      });
      
      if (player1_scores.length > 0 && player2_scores.length > 0) {
        await apiClient.updateMatchScores(matchId, {
          player1_scores,
          player2_scores
        });
      }
      
      toast.success("Match result saved!");
      
      // Small delay to ensure backend has processed the update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reload matches to get updated data from backend
      const matchesData = await apiClient.getTournamentMatches(tournamentId);
      const matchesList = matchesData.matches || matchesData || [];
      
      console.log('🔄 [PLAYOFF UPDATE] Reloaded matches:', matchesList.length);
      console.log('🔄 [PLAYOFF UPDATE] Playoff matches:', matchesList.filter(m => m.round && m.round !== 'Group Stage' && !m.group_name));
      
      // Update matches state
      setMatches(matchesList);
      
      // Process group stage data (this will also update playoff matches)
      processGroupStageData(matchesList, participants, tournament);
      
      // Check if this is the final match
      const updatedMatch = matchesList.find((m: any) => m.id === matchId);
      const roundName = updatedMatch?.round || '';
      const isFinalMatch = roundName === 'Final' || roundName === 'Finals';
      
      if (isFinalMatch && winner) {
        console.log('🏆 [PLAYOFF UPDATE] Final match completed, checking tournament status...');
        
        // Reload tournament data to check if it's completed
        const tournamentData = await apiClient.getTournament(tournamentId);
        const tournamentStatus = tournamentData?.tournament?.status || tournamentData?.status;
        
        // If tournament is not yet completed, complete it
        if (tournamentStatus !== 'completed') {
          console.log('🏆 [PLAYOFF UPDATE] Completing tournament...');
          try {
            await apiClient.updateTournament(tournamentId, { status: 'completed' });
            setTournament({ ...tournament, status: 'completed' });
            console.log('✅ [PLAYOFF UPDATE] Tournament completed');
          } catch (completeError) {
            console.error('❌ [PLAYOFF UPDATE] Error completing tournament:', completeError);
          }
        }
        
        // Get winner's avatar
        let winnerAvatar: string | undefined = undefined;
        if (winnerId) {
          try {
            const winnerData = await apiClient.getPlayer(winnerId);
            winnerAvatar = winnerData.avatar_url || undefined;
          } catch (err) {
            console.warn('Failed to fetch winner avatar:', err);
          }
        }
        
        // Show winner celebration modal
        setTimeout(() => {
          setTournamentWinner(winner);
          setTournamentWinnerAvatar(winnerAvatar);
          setShowWinnerModal(true);
        }, 500);
      }
      
    } catch (err: any) {
      console.error('Error updating playoff match:', err);
      toast.error(err.message || 'Failed to save match result');
    }
  };


  const calculateStandings = (players: string[], results: { [key: string]: string }) => {
    const standings = players.map(player => {
      let wins = 0;
      let losses = 0;
      let pointsFor = 0; // Total points scored by this player
      let pointsAgainst = 0; // Total points scored against this player
      
      // Track processed matches to avoid double counting
      const processedMatches = new Set<string>();
      
      Object.entries(results).forEach(([key, score]) => {
        const [p1, p2] = key.split("-");
        
        // Create a normalized match key (alphabetically sorted) to avoid processing same match twice
        const matchKey = [p1, p2].sort().join("-");
        if (processedMatches.has(matchKey)) {
          return; // Skip if we already processed this match
        }
        processedMatches.add(matchKey);
        
        // Parse set scores (e.g., "11-3, 11-5, 7-11, 11-8")
        const sets = score.split(",");
        let p1Wins = 0;
        let p2Wins = 0;
        sets.forEach(set => {
          const [s1, s2] = set.trim().split("-").map(Number);
          if (s1 > s2) p1Wins++;
          else if (s2 > s1) p2Wins++;
          
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
          else if (p2Wins > p1Wins) losses++;
        } else if (p2 === player) {
          if (p2Wins > p1Wins) wins++;
          else if (p1Wins > p2Wins) losses++;
        }
      });
      
      const pointDifference = pointsFor - pointsAgainst;
      
      return { player, wins, losses, points: wins * 3, pointDifference };
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

  if (loading) {
    return (
      <Preloader />
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="tournaments" />
      
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Manage Results</h1>
          <p className="text-muted-foreground mt-1">{tournament?.name || "Tournament"}</p>
          {tournamentFormat === "group-stage" && tournament?.num_groups && tournament?.players_per_group_advance && (
            <p className="text-sm text-muted-foreground mt-2">
              {tournament.num_groups} {tournament.num_groups === 1 ? 'group' : 'groups'} • {tournament.players_per_group_advance} {tournament.players_per_group_advance === 1 ? 'player' : 'players'} advancing per group
            </p>
          )}
        </div>
        {/* Show message if no participants */}
        {participants.length === 0 && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">No participants registered</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    This tournament has no registered participants yet, so there are no matches to manage.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can change the maximum number of participants using the Edit button on the tournament card.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show warning if tournament is ongoing but has no matches */}
        {participants.length > 0 && matches.length === 0 && (tournament?.status === 'ongoing' || tournament?.status === 'live') && (
          <WarningCard
            title="No matches created"
            description="This tournament is ongoing but has no matches. Matches should have been created automatically when the tournament status was changed from upcoming to ongoing."
            additionalInfo={
              <>
                {tournamentFormat === "group-stage" && (!tournament?.num_groups || !tournament?.players_per_group_advance) && (
                  <p className="mb-0">
                    ⚠️ This tournament is missing group settings (number of groups and players advancing per group). Please update the tournament settings in Edit Tournament page first.
                  </p>
                )}
                {tournamentFormat === "group-stage" && tournament?.num_groups && tournament?.players_per_group_advance && (
                  <p className="mb-0">
                    Tournament settings: {tournament.num_groups} {tournament.num_groups === 1 ? 'group' : 'groups'}, {tournament.players_per_group_advance} {tournament.players_per_group_advance === 1 ? 'player' : 'players'} advancing per group.
                  </p>
                )}
                <p className="mb-0">
                  <strong>Solution:</strong> Change the tournament status back to "upcoming" in Edit Tournament page, then use "Start Tournament" button to automatically create matches.
                </p>
              </>
            }
            variant="error"
          />
        )}

        {/* Single Elimination */}
        {tournamentFormat === "single-elimination" && (
          <SingleEliminationManageResults
            tournamentId={tournamentId}
            tournament={tournament}
            participants={participants}
            matches={matches}
            matchFormat={matchFormat}
            singleElimMatches={singleElimMatches}
            onUpdateMatch={handleUpdateSingleElimMatch}
          />
        )}

        {/* Round Robin */}
        {tournamentFormat === "round-robin" && (
          <RoundRobinManageResults
            tournamentId={tournamentId}
            tournament={tournament}
            participants={participants}
            matches={matches}
            matchFormat={matchFormat}
            rrPlayers={rrPlayers}
            rrResults={rrResults}
            selectedRRPlayer={selectedRRPlayer}
            onUpdateResult={handleUpdateRRResult}
            onSelectedPlayerChange={setSelectedRRPlayer}
            recommendedMatchToSelect={recommendedMatchToSelect}
            onRecommendedMatchClick={(player1, player2) => {
              setRecommendedMatchToSelect({ player1, player2 });
            }}
            onSidebarMatchHandled={() => setRecommendedMatchToSelect(null)}
            sidebarCardRef={sidebarCardRef}
          />
        )}

        {/* Group Stage + Playoffs */}
        {tournamentFormat === "group-stage" && (
          <GroupStageManageResults
            tournamentId={tournamentId}
            tournament={tournament}
            participants={participants}
            matches={matches}
            matchFormat={matchFormat}
            groups={groups}
            groupResults={groupResults}
            playoffMatches={playoffMatches}
            onUpdateGroupResult={handleUpdateGroupMatch}
            onUpdateGroupAResult={handleUpdateGroupAResult}
            onUpdateGroupBResult={handleUpdateGroupBResult}
            onUpdatePlayoffMatch={handleUpdatePlayoffMatch}
          />
        )}
      </div>

      {/* Winner Celebration Modal */}
      <WinnerCelebrationModal
        open={showWinnerModal}
        onOpenChange={(open) => {
          setShowWinnerModal(open);
          // When modal closes, navigate back to my tournaments
          if (!open) {
            setTimeout(() => {
              onBack();
            }, 300);
          }
        }}
        winnerName={tournamentWinner}
        tournamentName={tournament?.name || "Tournament"}
        tournamentImageUrl={tournament?.image_url || undefined}
        winnerAvatarUrl={tournamentWinnerAvatar}
      />
    </div>
  );
}
