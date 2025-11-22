export interface Match {
  id: number;
  player1: string;
  player2: string;
  score?: string;
  winner?: string;
  round?: string;
}

export interface Round {
  name: string;
  matches: Match[];
}

export interface SingleEliminationBracketProps {
  matches: Match[];
  onUpdateMatch: (matchId: number, score: string, winner: string) => void;
  editable?: boolean;
  matchFormat?: "best-of-1" | "best-of-3" | "best-of-5";
}

