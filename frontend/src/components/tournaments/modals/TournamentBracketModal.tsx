import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

interface BracketMatch {
  round: number;
  player1: string;
  player2: string;
  score1?: number;
  score2?: number;
  winner?: string;
}

interface TournamentBracketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
  format: "single-elimination" | "round-robin" | "group-stage";
}

export function TournamentBracketModal({
  open,
  onOpenChange,
  tournamentName,
  format,
}: TournamentBracketModalProps) {
  // Mock bracket data
  const singleEliminationMatches: BracketMatch[] = [
    // Finals
    { round: 3, player1: "Alex Johnson", player2: "Maria Chen", score1: 3, score2: 1, winner: "Alex Johnson" },
    // Semi-finals
    { round: 2, player1: "Alex Johnson", player2: "John Smith", score1: 3, score2: 0, winner: "Alex Johnson" },
    { round: 2, player1: "Maria Chen", player2: "Sarah Lee", score1: 3, score2: 2, winner: "Maria Chen" },
    // Quarter-finals
    { round: 1, player1: "Alex Johnson", player2: "Tom Brown", score1: 3, score2: 1, winner: "Alex Johnson" },
    { round: 1, player1: "John Smith", player2: "Lisa Wang", score1: 3, score2: 0, winner: "John Smith" },
    { round: 1, player1: "Maria Chen", player2: "David Kim", score1: 3, score2: 1, winner: "Maria Chen" },
    { round: 1, player1: "Sarah Lee", player2: "Mike Taylor", score1: 3, score2: 2, winner: "Sarah Lee" },
  ];

  const roundRobinResults = [
    { player: "Alex Johnson", wins: 7, losses: 0, points: 21 },
    { player: "Maria Chen", wins: 6, losses: 1, points: 18 },
    { player: "John Smith", wins: 5, losses: 2, points: 15 },
    { player: "Sarah Lee", wins: 4, losses: 3, points: 12 },
    { player: "Tom Brown", wins: 3, losses: 4, points: 9 },
    { player: "Lisa Wang", wins: 2, losses: 5, points: 6 },
    { player: "David Kim", wins: 1, losses: 6, points: 3 },
    { player: "Mike Taylor", wins: 0, losses: 7, points: 0 },
  ];

  const groupStageResults = [
    { group: "A", players: [
      { player: "Alex Johnson", wins: 3, losses: 0, points: 9, qualified: true },
      { player: "Maria Chen", wins: 2, losses: 1, points: 6, qualified: true },
      { player: "Tom Brown", wins: 1, losses: 2, points: 3, qualified: false },
      { player: "Lisa Wang", wins: 0, losses: 3, points: 0, qualified: false },
    ]},
    { group: "B", players: [
      { player: "John Smith", wins: 3, losses: 0, points: 9, qualified: true },
      { player: "Sarah Lee", wins: 2, losses: 1, points: 6, qualified: true },
      { player: "David Kim", wins: 1, losses: 2, points: 3, qualified: false },
      { player: "Mike Taylor", wins: 0, losses: 3, points: 0, qualified: false },
    ]},
  ];

  const renderSingleElimination = () => {
    const rounds = [
      { name: "Quarter-Finals", matches: singleEliminationMatches.filter(m => m.round === 1) },
      { name: "Semi-Finals", matches: singleEliminationMatches.filter(m => m.round === 2) },
      { name: "Finals", matches: singleEliminationMatches.filter(m => m.round === 3) },
    ];

    return (
      <div className="space-y-8">
        {rounds.map((round, roundIdx) => (
          <div key={roundIdx}>
            <h3 className="mb-4 flex items-center gap-2">
              {round.name}
              {roundIdx === rounds.length - 1 && <Trophy className="w-5 h-5 text-primary" />}
            </h3>
            <div className="grid gap-3">
              {round.matches.map((match, matchIdx) => (
                <div
                  key={matchIdx}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className={match.winner === match.player1 ? "font-semibold" : ""}>
                        {match.player1}
                      </span>
                      {match.winner === match.player1 && (
                        <Trophy className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-lg font-semibold min-w-[2rem] text-center">
                      {match.score1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className={match.winner === match.player2 ? "font-semibold" : ""}>
                        {match.player2}
                      </span>
                      {match.winner === match.player2 && (
                        <Trophy className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-lg font-semibold min-w-[2rem] text-center">
                      {match.score2}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Tournament Champion</p>
              <p className="font-semibold">Alex Johnson</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRoundRobin = () => {
    return (
      <div className="space-y-4">
        <h3 className="mb-4">Final Standings</h3>
        <div className="space-y-2">
          {roundRobinResults.map((result, idx) => (
            <div
              key={idx}
              className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{result.player}</span>
                    {idx === 0 && <Trophy className="w-4 h-4 text-primary" />}
                    {idx === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                    {idx === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">W: </span>
                    <span className="font-semibold">{result.wins}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">L: </span>
                    <span className="font-semibold">{result.losses}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pts: </span>
                    <span className="font-semibold">{result.points}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGroupStage = () => {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="mb-6">Group Stage</h3>
          <div className="space-y-6">
            {groupStageResults.map((group, groupIdx) => (
              <div key={groupIdx} className="border rounded-lg p-4 md:p-6 bg-card">
                <h4 className="mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {group.group}
                  </div>
                  Group {group.group}
                </h4>
                <div className="space-y-2">
                  {group.players.map((player, playerIdx) => (
                    <div
                      key={playerIdx}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        player.qualified 
                          ? 'bg-primary/10 border-2 border-primary/40 shadow-sm' 
                          : 'bg-muted/50 border border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                          playerIdx === 0 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                          playerIdx === 1 ? 'bg-gray-400/20 text-gray-700 dark:text-gray-400' :
                          playerIdx === 2 ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {playerIdx + 1}
                        </div>
                        <span className={`truncate text-sm md:text-base ${player.qualified ? 'font-semibold' : ''}`}>
                          {player.player}
                        </span>
                        {player.qualified && (
                          <Badge variant="default" className="text-xs ml-auto flex-shrink-0">✓ Qualified</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm ml-2 md:ml-4 flex-shrink-0">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">W-L</p>
                          <p className="font-semibold">
                            {player.wins}-{player.losses}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Pts</p>
                          <p className="font-semibold text-primary">{player.points}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-8">
          <h3 className="mb-6 flex items-center gap-2 text-lg">
            <Trophy className="w-6 h-6 text-primary" />
            Playoff Bracket
          </h3>
          {renderSingleElimination()}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {tournamentName}
          </DialogTitle>
          <DialogDescription>
            View the tournament bracket and final standings
          </DialogDescription>
          <Badge variant="outline" className="w-fit mt-2">
            {format === "single-elimination" && "Single Elimination"}
            {format === "round-robin" && "Round Robin"}
            {format === "group-stage" && "Group Stage + Playoffs"}
          </Badge>
        </DialogHeader>
        
        <div className="mt-4">
          {format === "single-elimination" && renderSingleElimination()}
          {format === "round-robin" && renderRoundRobin()}
          {format === "group-stage" && renderGroupStage()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
