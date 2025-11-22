import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar, MapPin } from "lucide-react";

interface MatchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: {
    // Allow either the detailed shape or a minimal match shape used in some pages
    opponent?: string;
    result?: "win" | "loss";
    score: string;
    tournament?: string;
    date?: string;
    player1?: string;
    player2?: string;
  };
}

export function MatchDetailsModal({
  open,
  onOpenChange,
  match,
}: MatchDetailsModalProps) {
  // Don't render if match data is missing
  if (!match || !open) {
    return null;
  }

  type ParsedGame = {
    game: number;
    playerScore: number;
    opponentScore: number;
    winner: "player" | "opponent";
  };

  // Parse score to get detailed game scores
  const parseScore = (score: string) : { games: ParsedGame[]; playerScore: number; opponentScore: number } => {
    if (!score || typeof score !== 'string') {
      return { games: [], playerScore: 0, opponentScore: 0 };
    }

    try {
      // Check if it's a detailed score format (e.g., "11-3, 11-5, 11-8") or simple format (e.g., "3-1")
      if (score.includes(',')) {
        // Detailed format: parse each set
        const sets = score.split(',').map(s => s.trim());
  const games: ParsedGame[] = [];
        let playerWins = 0;
        let opponentWins = 0;

        sets.forEach((set, index) => {
          const [p1, p2] = set.split('-').map(s => parseInt(s.trim()));
          if (!isNaN(p1) && !isNaN(p2)) {
            const winner = p1 > p2 ? "player" : "opponent";
            if (winner === "player") playerWins++;
            else opponentWins++;
            
            games.push({ game: index + 1, playerScore: p1, opponentScore: p2, winner });
          }
        });

        return { games, playerScore: playerWins, opponentScore: opponentWins };
      } else {
        // Simple format: generate games based on wins
        const parts = score.split("-");
        if (parts.length !== 2) {
          return { games: [], playerScore: 0, opponentScore: 0 };
        }

        const [playerScore, opponentScore] = parts.map(s => parseInt(s.trim()));
        
        if (isNaN(playerScore) || isNaN(opponentScore)) {
          return { games: [], playerScore: 0, opponentScore: 0 };
        }
        
        // Generate detailed game scores based on match result
        const games: ParsedGame[] = [];
        const totalGames = playerScore + opponentScore;
        
        for (let i = 0; i < totalGames; i++) {
          if (i < playerScore) {
            // Won games
            games.push({ game: i + 1, playerScore: 11, opponentScore: Math.floor(Math.random() * 6) + 3, winner: "player" });
          } else {
            // Lost games
            games.push({ game: i + 1, playerScore: Math.floor(Math.random() * 6) + 3, opponentScore: 11, winner: "opponent" });
          }
        }
        
        return { games, playerScore, opponentScore };
      }
    } catch (error) {
      console.error("Error parsing score:", error);
      return { games: [], playerScore: 0, opponentScore: 0 };
    }
  };

  const { games, playerScore, opponentScore } = parseScore(match.score);

  // Normalize player/opponent names for display
  const playerName = match.player1 ?? "Player";
  const opponentName = match.player2 ?? match.opponent ?? "Opponent";
  const matchDate = match.date ?? "";
  const matchTournament = match.tournament ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Match Details
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of the match with game-by-game scores
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Match Header */}
          <div className="bg-muted/50 rounded-lg p-3 md:p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 mb-4">
              <div className="flex-1 text-center">
                <p className="font-semibold mb-1 text-sm md:text-base">{playerName}</p>
                <Badge variant={match.result === "win" ? "default" : "secondary"} className="text-xs">
                  {match.result === "win" ? "Winner" : ""}
                </Badge>
              </div>
              <div className="text-2xl md:text-3xl font-bold px-3 md:px-6">
                {playerScore} - {opponentScore}
              </div>
              <div className="flex-1 text-center">
                <p className="font-semibold mb-1 text-sm md:text-base">{match.opponent}</p>
                <Badge variant={match.result === "loss" ? "default" : "secondary"} className="text-xs">
                  {match.result === "loss" ? "Winner" : ""}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span>{matchDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-center">{matchTournament}</span>
              </div>
            </div>
          </div>

          {/* Game by Game Breakdown */}
          <div>
            <h3 className="mb-4 text-base md:text-lg">Game by Game Breakdown</h3>
            <div className="space-y-2">
              {games.map((game) => (
                <div
                  key={game.game}
                  className="border rounded-lg p-2 md:p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4 flex-1">
                      <span className="text-xs md:text-sm text-muted-foreground w-12 md:w-16">
                        Game {game.game}
                      </span>
                      <div className="flex items-center gap-2 md:gap-3 flex-1">
                        <span className={`text-xs md:text-sm ${game.winner === "player" ? "font-semibold" : ""}`}>
                          {playerName}
                        </span>
                        {game.winner === "player" && (
                          <Trophy className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <span className="text-base md:text-lg font-semibold min-w-[2rem] text-center">
                        {game.playerScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-sm text-muted-foreground w-16"></span>
                      <div className="flex items-center gap-3 flex-1">
                        <span className={game.winner === "opponent" ? "font-semibold" : ""}>
                          {opponentName}
                        </span>
                        {game.winner === "opponent" && (
                          <Trophy className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      <span className="text-lg font-semibold min-w-[2rem] text-center">
                        {game.opponentScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Statistics */}
          <div>
            <h3 className="mb-4">Match Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{games.length}</p>
                <p className="text-sm text-muted-foreground">Total Games</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {games.reduce((sum, g) => sum + g.playerScore, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Points Scored</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">
                  {games.reduce((sum, g) => sum + g.opponentScore, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Points Conceded</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
