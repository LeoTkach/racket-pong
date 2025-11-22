import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SingleEliminationBracket } from "../TournamentBracket";

interface SingleEliminationManageResultsProps {
  tournamentId: number;
  tournament: any;
  participants: any[];
  matches: any[];
  matchFormat: "best-of-1" | "best-of-3" | "best-of-5";
  singleElimMatches: any[];
  onUpdateMatch: (matchId: number, score: string, winner: string) => Promise<void>;
}

export function SingleEliminationManageResults({
  participants,
  matchFormat,
  singleElimMatches,
  onUpdateMatch
}: SingleEliminationManageResultsProps) {
  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No matches available. This tournament has no registered participants.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Bracket</CardTitle>
          <CardDescription>
            Click on any match to enter results. Winners will automatically advance to the next round.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SingleEliminationBracket 
            matches={singleElimMatches}
            onUpdateMatch={onUpdateMatch}
            editable={true}
            matchFormat={matchFormat}
          />
        </CardContent>
      </Card>
    </div>
  );
}

