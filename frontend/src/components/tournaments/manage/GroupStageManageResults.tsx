import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Network } from "lucide-react";
import { RoundRobinTable } from "../RoundRobinTable";
import { GroupStandingsTable } from "../GroupStandingsTable";
import { SingleEliminationBracket } from "../TournamentBracket";

interface GroupStageManageResultsProps {
  tournamentId: number;
  tournament: any;
  participants: any[];
  matches: any[];
  matchFormat: "best-of-1" | "best-of-3" | "best-of-5";
  groups: { [key: string]: string[] };
  groupResults: { [key: string]: { [key: string]: string } };
  playoffMatches: any[];
  onUpdateGroupResult: (groupName: string, player1: string, player2: string, score: string) => Promise<void>;
  onUpdateGroupAResult?: (player1: string, player2: string, score: string) => Promise<void>;
  onUpdateGroupBResult?: (player1: string, player2: string, score: string) => Promise<void>;
  onUpdatePlayoffMatch: (matchId: number, score: string, winner: string) => Promise<void>;
}

export function GroupStageManageResults({
  tournament,
  participants,
  matchFormat,
  groups,
  groupResults,
  playoffMatches,
  onUpdateGroupResult,
  onUpdateGroupAResult,
  onUpdateGroupBResult,
  onUpdatePlayoffMatch
}: GroupStageManageResultsProps) {
  const [groupStage, setGroupStage] = useState<"groups" | "playoffs">("groups");

  return (
    <div className="space-y-4">
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

      {groupStage === "groups" && (
        <>
          {participants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No matches available. This tournament has no registered participants.
                </p>
              </CardContent>
            </Card>
          ) : Object.keys(groups).length > 0 ? (
            <>
              {Object.keys(groups).sort().map((groupName) => {
                const groupPlayers = groups[groupName] || [];
                const groupResultsForGroup = groupResults[groupName] || {};
                
                // Use old handlers for backward compatibility with A and B
                const handleUpdateResult = groupName === "Group A" || groupName === "A" 
                  ? onUpdateGroupAResult 
                  : groupName === "Group B" || groupName === "B"
                  ? onUpdateGroupBResult
                  : (player1: string, player2: string, score: string) => {
                      // Generic handler for other groups
                      onUpdateGroupResult(groupName, player1, player2, score);
                    };
                
                if (!handleUpdateResult) {
                  return null;
                }
                
                return (
                  <Card key={groupName} className="mb-4">
                    <CardHeader>
                      <CardTitle>{groupName}</CardTitle>
                      <CardDescription>Click on cells to enter results</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RoundRobinTable 
                        players={groupPlayers}
                        results={groupResultsForGroup}
                        onUpdateResult={handleUpdateResult}
                        editable={true}
                        matchFormat={matchFormat}
                      />
                      <GroupStandingsTable
                        players={groupPlayers}
                        results={groupResultsForGroup}
                        groupName={groupName}
                        playersPerGroupAdvance={tournament?.players_per_group_advance || 2}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center mb-4">
                  No groups available. Matches need to be created for this tournament.
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  Tournament has {participants.length} participants but no matches have been generated yet.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {groupStage === "playoffs" && (
        <>
          {participants.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  No matches available. This tournament has no registered participants.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Playoff Bracket</CardTitle>
                <CardDescription>
                  {playoffMatches.length > 0 && playoffMatches[0]?.id < 0 && 
                   playoffMatches.some(m => (m.player1 === "TBD" || m.player2 === "TBD") && m.player2 !== "BYE")
                    ? "Preview bracket - Complete all group stage matches to see actual players"
                    : "Click on matches to enter results. Winners will automatically advance to the next round."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {playoffMatches.length > 0 ? (
                  <SingleEliminationBracket 
                    matches={playoffMatches}
                    onUpdateMatch={onUpdatePlayoffMatch}
                    editable={playoffMatches[0]?.id > 0}
                    matchFormat={matchFormat}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No playoff bracket available yet.</p>
                    <p className="text-sm mt-2">Complete all group stage matches to generate the playoff bracket.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

