import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ArrowLeft, Trophy } from "lucide-react";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";

interface ViewResultsPageProps {
  tournamentId: number;
  onBack: () => void;
  onManageResults?: (id: number) => void;
}

export function ViewResultsPage({ tournamentId, onBack, onManageResults }: ViewResultsPageProps) {
  // Mock data
  const tournament = {
    id: tournamentId,
    name: "City Championship 2025",
    status: "completed"
  };

  const matches = [
    { id: 1, player1: "John Doe", player2: "Jane Smith", score: "3-1", round: "Final" },
    { id: 2, player1: "Mike Johnson", player2: "Sarah Williams", score: "3-2", round: "Semi-final" },
    { id: 3, player1: "John Doe", player2: "Tom Brown", score: "3-0", round: "Semi-final" },
    { id: 4, player1: "Jane Smith", player2: "Emma Davis", score: "3-1", round: "Quarter-final" },
  ];

  const standings = [
    { rank: 1, player: "John Doe", wins: 5, losses: 0, points: 15 },
    { rank: 2, player: "Jane Smith", wins: 4, losses: 1, points: 12 },
    { rank: 3, player: "Mike Johnson", wins: 3, losses: 2, points: 9 },
    { rank: 4, player: "Sarah Williams", wins: 2, losses: 3, points: 6 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="details" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="hover:underline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {onManageResults && (
            <Button onClick={() => onManageResults(tournamentId)} className="hover:underline">
              Manage Results
            </Button>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Tournament Results</h1>
            <Badge className="bg-gray-500 text-xs sm:text-sm">{tournament.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">{tournament.name}</p>
        </div>

        <Tabs defaultValue="standings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="matches">Match Results</TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Final Standings
                </CardTitle>
                <CardDescription>Tournament leaderboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {standings.map((player) => (
                    <div 
                      key={player.rank} 
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        player.rank === 1 ? 'bg-primary/10 border-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          player.rank === 1 ? 'bg-primary text-primary-foreground' :
                          player.rank === 2 ? 'bg-gray-400 text-white' :
                          player.rank === 3 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {player.rank}
                        </div>
                        <span className="font-medium text-sm sm:text-base">{player.player}</span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
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

          <TabsContent value="matches" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Match Results</CardTitle>
                <CardDescription>Complete match history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2 text-xs sm:text-sm">{match.round}</Badge>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="font-medium text-sm sm:text-base">{match.player1}</span>
                          <span className="text-muted-foreground text-xs sm:text-sm">vs</span>
                          <span className="font-medium text-sm sm:text-base">{match.player2}</span>
                        </div>
                      </div>
                      <div className="font-bold text-lg sm:text-xl">{match.score}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
