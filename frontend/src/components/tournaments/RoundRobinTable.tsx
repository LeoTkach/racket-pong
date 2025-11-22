import { useState, useEffect, useMemo } from "react";
import { MatchScoreEntryDialog } from "./modals/MatchScoreEntryDialog";

interface RoundRobinTableProps {
  players: string[];
  results: { [key: string]: string }; // key: "player1-player2", value: "11-3, 11-5, 7-11, 11-8"
  onUpdateResult: (player1: string, player2: string, score: string) => void;
  editable?: boolean;
  matchFormat?: "best-of-1" | "best-of-3" | "best-of-5";
  onRecommendedMatchClick?: (player1: string, player2: string) => void;
  selectedMatchFromSidebar?: { player1: string; player2: string } | null;
  onSidebarMatchHandled?: () => void;
  selectedPlayer?: string | null;
  onSelectedPlayerChange?: (player: string | null) => void;
}

export function RoundRobinTable({ players, results, onUpdateResult, editable = false, matchFormat = "best-of-5", onRecommendedMatchClick, selectedMatchFromSidebar, onSidebarMatchHandled, selectedPlayer: controlledSelectedPlayer, onSelectedPlayerChange }: RoundRobinTableProps) {
  const [internalSelectedPlayer, setInternalSelectedPlayer] = useState<string | null>(players.length > 0 ? players[0] : null);
  const [selectedCell, setSelectedCell] = useState<{ player1: string; player2: string } | null>(null);
  
  // Use controlled selectedPlayer if provided, otherwise use internal state
  const selectedPlayer = controlledSelectedPlayer !== undefined ? controlledSelectedPlayer : internalSelectedPlayer;
  const setSelectedPlayer = (player: string | null) => {
    if (onSelectedPlayerChange) {
      onSelectedPlayerChange(player);
    } else {
      setInternalSelectedPlayer(player);
    }
  };

  // Handle match selection from sidebar
  useEffect(() => {
    if (selectedMatchFromSidebar) {
      setSelectedCell(selectedMatchFromSidebar);
      // Auto-select one of the players
      if (selectedPlayer !== selectedMatchFromSidebar.player1 && selectedPlayer !== selectedMatchFromSidebar.player2) {
        setSelectedPlayer(selectedMatchFromSidebar.player1);
      }
      // Notify parent that we've handled it
      if (onSidebarMatchHandled) {
        onSidebarMatchHandled();
      }
    }
  }, [selectedMatchFromSidebar]);

  // Update selected player when players list changes
  // Only do this if using internal state (not controlled)
  useEffect(() => {
    if (controlledSelectedPlayer === undefined) {
      if (players.length > 0) {
        setInternalSelectedPlayer(prev => {
          if (!prev || !players.includes(prev)) {
            return players[0];
          }
          return prev;
        });
      } else {
        setInternalSelectedPlayer(null);
      }
    } else {
      // If controlled, just ensure the selected player is valid
      if (players.length > 0 && controlledSelectedPlayer && !players.includes(controlledSelectedPlayer)) {
        // Selected player is not in the list, but don't change if controlled
        // Parent should handle this
      }
    }
  }, [players, controlledSelectedPlayer]);

  const handleCellClick = (player1: string, player2: string) => {
    if (!editable || player1 === player2) return;
    setSelectedCell({ player1, player2 });
  };
  
  // Get matches for selected player
  const getPlayerMatches = (player: string) => {
    return players
      .filter(p => p !== player)
      .map(opponent => {
        const key = `${player}-${opponent}`;
        const reverseKey = `${opponent}-${player}`;
        const rawScore = results[key] || results[reverseKey];
        const isReversed = !results[key] && results[reverseKey];
        
        // Calculate set wins and reverse score for display if needed
        // Note: For reverse keys, the score is already reversed in results, so we treat it as direct
        let playerWins = 0;
        let opponentWins = 0;
        let displayScore = rawScore;
        
        if (rawScore) {
          const sets = rawScore.split(",");
          sets.forEach(set => {
            const [s1, s2] = set.trim().split("-").map(Number);
            // For direct key: s1 = player, s2 = opponent
            // For reverse key: score is already reversed, so s1 = player, s2 = opponent
            if (s1 > s2) playerWins++;
            else if (s2 > s1) opponentWins++;
          });
          // No need to reverse display score - it's already correct in both cases
        }
        
        return {
          opponent,
          score: displayScore, // Use reversed score for display if needed
          playerWins,
          opponentWins,
          key: rawScore ? key : reverseKey
        };
      });
  };

  const handleSaveScore = (score: string, winner: string) => {
    if (!selectedCell) return;
    
    onUpdateResult(selectedCell.player1, selectedCell.player2, score);
    setSelectedCell(null);
  };

  const getExistingScore = () => {
    if (!selectedCell) return undefined;
    const key = `${selectedCell.player1}-${selectedCell.player2}`;
    const reverseKey = `${selectedCell.player2}-${selectedCell.player1}`;
    return results[key] || results[reverseKey];
  };

  const getResult = (player1: string, player2: string) => {
    if (player1 === player2) return "-";
    
    const key = `${player1}-${player2}`;
    const reverseKey = `${player2}-${player1}`;
    
    // Get the score
    let scoreString = "";
    if (results[key]) {
      scoreString = results[key];
    } else if (results[reverseKey]) {
      // Reverse the scores for display
      const sets = results[reverseKey].split(",").map(set => {
        const [p2Score, p1Score] = set.trim().split("-");
        return `${p1Score}-${p2Score}`;
      });
      scoreString = sets.join(", ");
    }
    
    // For display in table, show just the set count (e.g., "3-1")
    if (scoreString) {
      const sets = scoreString.split(",");
      let p1Wins = 0;
      let p2Wins = 0;
      sets.forEach(set => {
        const [s1, s2] = set.trim().split("-").map(Number);
        if (s1 > s2) p1Wins++;
        else p2Wins++;
      });
      return `${p1Wins}-${p2Wins}`;
    }
    
    return "";
  };

  // Get recommended next matches (not completed, prioritized by player match count balance)
  const recommendedMatches = useMemo(() => {
    // Calculate matches played per player
    const matchesPlayed: { [key: string]: number } = {};
    players.forEach(player => {
      matchesPlayed[player] = 0;
      players.forEach(opponent => {
        if (player !== opponent) {
          const key = `${player}-${opponent}`;
          const reverseKey = `${opponent}-${player}`;
          if (results[key] || results[reverseKey]) {
            matchesPlayed[player]++;
          }
        }
      });
    });

    // Get all possible matches
    const allMatches: Array<{ player1: string; player2: string; priority: number }> = [];
    
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const player1 = players[i];
        const player2 = players[j];
        const key = `${player1}-${player2}`;
        const reverseKey = `${player2}-${player1}`;
        
        // Skip if match already completed
        if (results[key] || results[reverseKey]) {
          continue;
        }
        
        // Calculate priority: lower difference in matches played = higher priority
        // Also prioritize players who have played fewer matches overall
        const matchDiff = Math.abs(matchesPlayed[player1] - matchesPlayed[player2]);
        const totalMatches = matchesPlayed[player1] + matchesPlayed[player2];
        
        // Priority: lower is better
        // First priority: balance (minimize difference)
        // Second priority: overall progress (maximize total matches)
        const priority = matchDiff * 1000 - totalMatches;
        
        allMatches.push({ player1, player2, priority });
      }
    }
    
    // Sort by priority (lower is better)
    allMatches.sort((a, b) => a.priority - b.priority);
    
    return allMatches.slice(0, 10); // Return top 10 recommended matches
  }, [players, results]);

  const selectedPlayerMatches = selectedPlayer ? getPlayerMatches(selectedPlayer) : [];

  // Handle recommended match click
  const handleRecommendedMatchClickInternal = (player1: string, player2: string) => {
    if (!editable) return;
    setSelectedCell({ player1, player2 });
    // Optionally auto-select one of the players
    if (selectedPlayer !== player1 && selectedPlayer !== player2) {
      setSelectedPlayer(player1);
    }
    // Also call parent callback if provided
    if (onRecommendedMatchClick) {
      onRecommendedMatchClick(player1, player2);
    }
  };
  
  // Expose recommended matches calculation for parent
  const getRecommendedMatches = () => {
    return recommendedMatches;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Results Table - слева */}
      <div className="w-full flex flex-col flex-1 min-h-0">
        {/* Player selector */}
        <div className="mb-4 flex-shrink-0">
          <label className="text-sm font-medium mb-2 block">Select Player:</label>
          <div className="flex flex-wrap gap-2">
            {players.map((player) => (
              <button
                key={player}
                onClick={() => setSelectedPlayer(player)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedPlayer === player
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {player}
              </button>
            ))}
          </div>
        </div>

        {/* Player matches list */}
        <div className="flex flex-col flex-1 min-h-0">
          {selectedPlayer ? (
            <>
              <h3 className="text-lg font-semibold flex-shrink-0 mb-3">
                {selectedPlayer}'s Matches
              </h3>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedPlayerMatches.map((match) => (
                    <div
                      key={match.opponent}
                      onClick={() => editable && handleCellClick(selectedPlayer, match.opponent)}
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        editable
                          ? 'cursor-pointer hover:border-primary hover:shadow-md active:scale-[0.98]'
                          : ''
                      } ${
                        match.score
                          ? 'bg-accent/20 border-accent/50'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{selectedPlayer}</div>
                          <div className="text-xs text-muted-foreground">vs</div>
                          <div className="font-medium text-sm">{match.opponent}</div>
                        </div>
                        {match.score ? (
                          <div className="text-center">
                            <div className="text-lg font-bold font-mono">
                              {`${match.playerWins}-${match.opponentWins}`}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Sets
                            </div>
                          </div>
                        ) : editable ? (
                          <div className="text-xs text-muted-foreground">Click to add</div>
                        ) : (
                          <div className="text-xs text-muted-foreground">—</div>
                        )}
                      </div>
                      {/* Всегда резервируем место под сеты для одинаковой высоты карточек */}
                      <div className="text-xs text-muted-foreground font-mono border-t pt-2 mt-2 min-h-[1.5rem]">
                        {match.score ? match.score : '\u00A0'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a player to view their matches
            </div>
          )}
        </div>
      </div>


      {/* Edit Result Dialog */}
      {selectedCell && (
        <MatchScoreEntryDialog
          open={!!selectedCell}
          onOpenChange={(open) => !open && setSelectedCell(null)}
          player1={selectedCell.player1}
          player2={selectedCell.player2}
          matchFormat={matchFormat}
          existingScore={getExistingScore()}
          onSave={handleSaveScore}
        />
      )}
    </div>
  );
}
