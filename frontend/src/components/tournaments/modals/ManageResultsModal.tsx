import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Save, Table, Network } from "lucide-react";
import { toast } from "sonner";
import { SingleEliminationBracket } from "./TournamentBracket";
import { RoundRobinTable } from "./RoundRobinTable";

interface ManageResultsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
  tournamentFormat: "single-elimination" | "round-robin" | "group-stage";
}

export function ManageResultsModal({ open, onOpenChange, tournamentName, tournamentFormat }: ManageResultsModalProps) {
  const [activeTab, setActiveTab] = useState(tournamentFormat === "group-stage" ? "groups" : "matches");
  const [groupStage, setGroupStage] = useState<"groups" | "playoffs">("groups");
  
  // Single Elimination matches
  const [singleElimMatches, setSingleElimMatches] = useState([
    { id: 1, player1: "John Doe", player2: "Jane Smith", score: "", winner: "" },
    { id: 2, player1: "Mike Johnson", player2: "Sarah Williams", score: "", winner: "" },
    { id: 3, player1: "Tom Brown", player2: "Emma Davis", score: "", winner: "" },
    { id: 4, player1: "Alex Wilson", player2: "Lisa Martinez", score: "", winner: "" },
    { id: 5, player1: "TBD", player2: "TBD", score: "", winner: "" },
    { id: 6, player1: "TBD", player2: "TBD", score: "", winner: "" },
    { id: 7, player1: "TBD", player2: "TBD", score: "", winner: "" },
  ]);

  // Round Robin data
  const [rrPlayers] = useState(["John Doe", "Jane Smith", "Mike Johnson", "Sarah Williams"]);
  const [rrResults, setRRResults] = useState<{ [key: string]: string }>({
    "John Doe-Jane Smith": "3-1",
    "John Doe-Mike Johnson": "3-2",
  });

  // Group Stage data
  const [groups] = useState({
    A: ["Player 1", "Player 2", "Player 3", "Player 4"],
    B: ["Player 5", "Player 6", "Player 7", "Player 8"],
  });
  const [groupAResults, setGroupAResults] = useState<{ [key: string]: string }>({});
  const [groupBResults, setGroupBResults] = useState<{ [key: string]: string }>({});
  const [playoffMatches, setPlayoffMatches] = useState([
    { id: 1, player1: "Winner Group A", player2: "Runner-up Group B", score: "", winner: "" },
    { id: 2, player1: "Winner Group B", player2: "Runner-up Group A", score: "", winner: "" },
    { id: 3, player1: "TBD", player2: "TBD", score: "", winner: "" },
  ]);

  const handleUpdateSingleElimMatch = (matchId: number, score: string, winner: string) => {
    setSingleElimMatches(matches => 
      matches.map(m => m.id === matchId ? { ...m, score, winner } : m)
    );
  };

  const handleUpdateRRResult = (player1: string, player2: string, score: string) => {
    setRRResults(prev => ({
      ...prev,
      [`${player1}-${player2}`]: score
    }));
  };

  const handleUpdateGroupAResult = (player1: string, player2: string, score: string) => {
    setGroupAResults(prev => ({
      ...prev,
      [`${player1}-${player2}`]: score
    }));
  };

  const handleUpdateGroupBResult = (player1: string, player2: string, score: string) => {
    setGroupBResults(prev => ({
      ...prev,
      [`${player1}-${player2}`]: score
    }));
  };

  const handleUpdatePlayoffMatch = (matchId: number, score: string, winner: string) => {
    setPlayoffMatches(matches => 
      matches.map(m => m.id === matchId ? { ...m, score, winner } : m)
    );
  };

  const handleSave = () => {
    toast.success("Results saved successfully!");
    onOpenChange(false);
  };

  const calculateStandings = (players: string[], results: { [key: string]: string }) => {
    const standings = players.map(player => {
      let wins = 0;
      let losses = 0;
      
      Object.entries(results).forEach(([key, score]) => {
        const [p1, p2] = key.split("-");
        const [score1, score2] = score.split("-").map(Number);
        
        if (p1 === player) {
          if (score1 > score2) wins++;
          else losses++;
        } else if (p2 === player) {
          if (score2 > score1) wins++;
          else losses++;
        }
      });
      
      return { player, wins, losses, points: wins * 3 };
    });
    
    return standings.sort((a, b) => b.points - a.points);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Manage Results - {tournamentName}
          </DialogTitle>
          <DialogDescription>
            {tournamentFormat === "single-elimination" && "Update match results in the elimination bracket"}
            {tournamentFormat === "round-robin" && "Update match results in the round-robin table"}
            {tournamentFormat === "group-stage" && "Manage group stage matches and playoff results"}
          </DialogDescription>
        </DialogHeader>

        {/* Single Elimination */}
        {tournamentFormat === "single-elimination" && (
          <div className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Bracket</CardTitle>
                <CardDescription>Click on any match to enter results</CardDescription>
              </CardHeader>
              <CardContent>
                <SingleEliminationBracket 
                  matches={singleElimMatches}
                  onUpdateMatch={handleUpdateSingleElimMatch}
                  editable={true}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Round Robin */}
        {tournamentFormat === "round-robin" && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="matches">Match Results</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
            </TabsList>

            <TabsContent value="matches" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Results Table</CardTitle>
                  <CardDescription>Click on any cell to enter a match result</CardDescription>
                </CardHeader>
                <CardContent>
                  <RoundRobinTable 
                    players={rrPlayers}
                    results={rrResults}
                    onUpdateResult={handleUpdateRRResult}
                    editable={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Match List</CardTitle>
                  <CardDescription>All matches in order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(rrResults).map(([key, score]) => {
                      const [player1, player2] = key.split("-");
                      return (
                        <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{player1}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="font-medium">{player2}</span>
                          </div>
                          <span className="font-bold font-mono">{score}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="standings" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Standings</CardTitle>
                  <CardDescription>Tournament leaderboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {calculateStandings(rrPlayers, rrResults).map((player, index) => (
                      <div key={player.player} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg w-8">{index + 1}</span>
                          <span className="font-medium">{player.player}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-muted-foreground text-xs">Wins</div>
                            <div className="font-semibold">{player.wins}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground text-xs">Losses</div>
                            <div className="font-semibold">{player.losses}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground text-xs">Points</div>
                            <div className="font-semibold text-primary">{player.points}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Group Stage + Playoffs */}
        {tournamentFormat === "group-stage" && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={groupStage === "groups" ? "default" : "outline"}
                onClick={() => setGroupStage("groups")}
                className="flex items-center gap-2"
              >
                <Table className="w-4 h-4" />
                Group Stage
              </Button>
              <Button
                variant={groupStage === "playoffs" ? "default" : "outline"}
                onClick={() => setGroupStage("playoffs")}
                className="flex items-center gap-2"
              >
                <Network className="w-4 h-4" />
                Playoffs
              </Button>
            </div>

            {groupStage === "groups" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Group A</CardTitle>
                    <CardDescription>Click on cells to enter results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoundRobinTable 
                      players={groups.A}
                      results={groupAResults}
                      onUpdateResult={handleUpdateGroupAResult}
                      editable={true}
                    />
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Group A Standings</h4>
                      <div className="space-y-1">
                        {calculateStandings(groups.A, groupAResults).slice(0, 3).map((player, index) => (
                          <div key={player.player} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span>{index + 1}. {player.player}</span>
                            <span className="font-semibold">{player.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Group B</CardTitle>
                    <CardDescription>Click on cells to enter results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RoundRobinTable 
                      players={groups.B}
                      results={groupBResults}
                      onUpdateResult={handleUpdateGroupBResult}
                      editable={true}
                    />
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Group B Standings</h4>
                      <div className="space-y-1">
                        {calculateStandings(groups.B, groupBResults).slice(0, 3).map((player, index) => (
                          <div key={player.player} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                            <span>{index + 1}. {player.player}</span>
                            <span className="font-semibold">{player.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {groupStage === "playoffs" && (
              <Card>
                <CardHeader>
                  <CardTitle>Playoff Bracket</CardTitle>
                  <CardDescription>Click on matches to enter results</CardDescription>
                </CardHeader>
                <CardContent>
                  <SingleEliminationBracket 
                    matches={playoffMatches}
                    onUpdateMatch={handleUpdatePlayoffMatch}
                    editable={true}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save All Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
