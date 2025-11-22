import { useState } from "react";
import { MatchScoreEntryDialog } from "./modals/MatchScoreEntryDialog";
import { ByeMatchInfoModal } from "./modals/ByeMatchInfoModal";
import { Match, SingleEliminationBracketProps } from "./types";
import { getRounds } from "./utils/bracketUtils";
import { MatchCard } from "./MatchCard";

export function SingleEliminationBracket({ matches, onUpdateMatch, editable = false, matchFormat = "best-of-5" }: SingleEliminationBracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedByeMatch, setSelectedByeMatch] = useState<Match | null>(null);

  const rounds = getRounds(matches);

  const handleMatchClick = (match: Match) => {
    if (!editable) return;
    // Разрешаем редактирование если:
    // 1. Оба игрока определены (не TBD)
    // 2. ИЛИ это матч с bye (player2 = "BYE" или player2 отсутствует, но player1 есть)
    const isByeMatch = (match.player2 === "BYE" || (!match.player2 && match.player1 && match.player1 !== "TBD"));
    const hasBothPlayers = match.player1 !== "TBD" && match.player2 !== "TBD" && match.player2 !== "BYE";
    const isCompletedByeMatch = isByeMatch && match.winner && match.score;
    
    if (!hasBothPlayers && !isByeMatch) {
      return; // Нельзя редактировать матчи где оба игрока TBD
    }
    
    // Если это завершенный bye-матч, показываем информационную модалку
    if (isCompletedByeMatch) {
      setSelectedByeMatch(match);
      return;
    }
    
    // Если это незавершенный bye-матч, показываем модалку завершения
    if (isByeMatch && !match.winner) {
      setSelectedMatch(match);
      return;
    }
    
    // Обычный матч
    setSelectedMatch(match);
  };

  const handleSaveScore = (score: string, winner: string) => {
    if (!selectedMatch) return;
    
    onUpdateMatch(selectedMatch.id, score, winner);
    setSelectedMatch(null);
  };

  return (
    <>
      <div className="flex gap-6 sm:gap-8 overflow-x-auto pb-4 px-2">
        {rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="flex-shrink-0">
            <h4 className="mb-3 sm:mb-4 text-center font-semibold text-sm sm:text-base">{round.name}</h4>
            <div className="flex flex-col" style={{ gap: roundIndex === 0 ? '24px' : roundIndex === 1 ? '120px' : '0' }}>
              {round.matches.map((match, matchIndex) => (
                <MatchCard
                  key={`${round.name}-${match.id}-${matchIndex}`}
                  match={match}
                  roundIndex={roundIndex}
                  matchIndex={matchIndex}
                  roundName={round.name}
                  editable={editable}
                  onMatchClick={handleMatchClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Match Dialog */}
      {selectedMatch && (
        <MatchScoreEntryDialog
          open={!!selectedMatch}
          onOpenChange={(open) => !open && setSelectedMatch(null)}
          player1={selectedMatch.player1}
          player2={selectedMatch.player2}
          matchFormat={matchFormat}
          existingScore={selectedMatch.score}
          onSave={handleSaveScore}
        />
      )}

      {/* Bye Match Info Modal */}
      {selectedByeMatch && (
        <ByeMatchInfoModal
          open={!!selectedByeMatch}
          onOpenChange={(open) => !open && setSelectedByeMatch(null)}
          playerName={selectedByeMatch.player1}
        />
      )}
    </>
  );
}
