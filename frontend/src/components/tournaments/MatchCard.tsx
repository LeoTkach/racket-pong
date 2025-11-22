import { Match } from "./types";
import { getSetScore } from "./utils/bracketUtils";

interface MatchCardProps {
  match: Match;
  roundIndex: number;
  matchIndex: number;
  roundName: string;
  editable: boolean;
  onMatchClick: (match: Match) => void;
}

export function MatchCard({ match, roundIndex, matchIndex, roundName, editable, onMatchClick }: MatchCardProps) {
  const isByeMatch = (match.player2 === "BYE" || (!match.player2 && match.player1 && match.player1 !== "TBD"));
  const isCompletedByeMatch = isByeMatch && match.winner && match.score;
  const setScore = getSetScore(match.score);
  const isPlayer1Winner = match.winner && (
    match.winner === match.player1 || 
    match.winner.toLowerCase().trim() === match.player1.toLowerCase().trim()
  );
  const isPlayer2Winner = match.winner && (
    match.winner === match.player2 || 
    match.winner.toLowerCase().trim() === match.player2.toLowerCase().trim()
  );
  
  // Debug log for winner highlighting
  if (match.winner && !isPlayer1Winner && !isPlayer2Winner) {
    console.log('⚠️ [BRACKET] Winner mismatch:', {
      matchId: match.id,
      round: roundName,
      winner: match.winner,
      player1: match.player1,
      player2: match.player2,
      player1Match: match.winner === match.player1,
      player2Match: match.winner === match.player2
    });
  }
  
  return (
    <div 
      key={`${roundName}-${match.id}-${matchIndex}`}
      onClick={() => onMatchClick(match)}
      className={`border-2 rounded-lg p-2 sm:p-3 ${
        editable ? 'cursor-pointer hover:border-primary transition-colors' : ''
      } ${match.score ? 'bg-muted/30' : 'bg-card'}`}
      style={{
        width: '220px',
        minWidth: '220px',
        maxWidth: '220px',
        marginTop: roundIndex === 1 ? (matchIndex === 0 ? '72px' : '0') : roundIndex === 2 ? '192px' : '0'
      }}
    >
      <div className={`flex items-center py-1.5 sm:py-2 px-2 sm:px-3 rounded ${
        isPlayer1Winner ? 'bg-primary/20 font-semibold' : ''
      }`}>
        <span className="text-xs sm:text-sm truncate flex-1 min-w-0 pr-2">{match.player1 || 'TBD'}</span>
        {/* Не показываем счет для завершенных bye-матчей, показываем "Advances" */}
        {isCompletedByeMatch ? (
          <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">Advances</span>
        ) : setScore ? (
          <span className="text-xs font-mono flex-shrink-0 whitespace-nowrap">{setScore.split('-')[0]}</span>
        ) : null}
      </div>
      <div className="border-t my-1" />
      <div className={`flex items-center py-1.5 sm:py-2 px-2 sm:px-3 rounded ${
        isPlayer2Winner ? 'bg-primary/20 font-semibold' : ''
      }`}>
        <span className="text-xs sm:text-sm truncate flex-1 min-w-0 pr-2">
          {match.player2 || 'TBD'}
        </span>
        {/* Не показываем счет для завершенных bye-матчей */}
        {!isCompletedByeMatch && setScore && (
          <span className="text-xs font-mono flex-shrink-0 whitespace-nowrap">{setScore.split('-')[1]}</span>
        )}
      </div>
    </div>
  );
}

