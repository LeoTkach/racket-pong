import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { CalendarX, UserX } from "lucide-react";
import { EmptyState } from "../../../components/common/EmptyState";
import { Pagination } from "../../../components/common/Pagination";
import { Player, Tournament, Match } from "../../../types/database";

interface CompetitionHistoryProps {
  playerData: Player;
  playerTournamentHistory: Tournament[];
  playerRecentMatches: Match[];
  tournamentStandings: { [key: string]: { rank: number } };
  calculatedRanks: { [key: string]: number };
  opponentsMap: { [key: string]: { id: string; fullName: string } };
  tournamentsMap: { [key: string]: { id: string; name: string } };
  matchesMap: { [key: string]: { tournament_name?: string; tournament_id?: number } };
  itemsPerPage?: number;
}

export function CompetitionHistory({
  playerData,
  playerTournamentHistory,
  playerRecentMatches,
  tournamentStandings,
  calculatedRanks,
  opponentsMap,
  tournamentsMap,
  matchesMap,
  itemsPerPage = 5,
}: CompetitionHistoryProps) {
  const navigate = useNavigate();
  const [historyView, setHistoryView] = useState<"tournaments" | "matches">("tournaments");
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [currentMatchesPage, setCurrentMatchesPage] = useState(1);

  const totalHistoryPages = Math.ceil(playerTournamentHistory.length / itemsPerPage);
  const totalMatchesPages = Math.ceil(playerRecentMatches.length / itemsPerPage);

  const currentHistoryData = useMemo(
    () =>
      playerTournamentHistory.slice(
        (currentHistoryPage - 1) * itemsPerPage,
        currentHistoryPage * itemsPerPage
      ),
    [playerTournamentHistory, currentHistoryPage, itemsPerPage]
  );

  const currentMatchesData = useMemo(
    () =>
      playerRecentMatches.slice(
        (currentMatchesPage - 1) * itemsPerPage,
        currentMatchesPage * itemsPerPage
      ),
    [playerRecentMatches, currentMatchesPage, itemsPerPage]
  );

  // Функция для преобразования ранга в диапазон рангов для single-elimination
  const getRankRangeText = (rank: number, format: string) => {
    // Для group-stage: если ранг 999, значит игрок выбыл на групповом этапе
    if (format === "group-stage" && rank === 999) {
      return "Group Stage";
    }

    if (format !== "single-elimination") {
      // Для других форматов используем точный ранг
      if (rank === 1) return "1st";
      if (rank === 2) return "2nd";
      if (rank === 3) return "3rd";
      const suffix =
        ["th", "st", "nd", "rd"][rank % 100 > 10 && rank % 100 < 14 ? 0 : rank % 10] ||
        "th";
      return `${rank}${suffix}`;
    }

    // Для single-elimination используем диапазоны рангов
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3 || rank === 4) return "3-4th";
    if (rank >= 5 && rank <= 8) return "5-8th";
    if (rank >= 9 && rank <= 16) return "9-16th";
    if (rank >= 17 && rank <= 32) return "17-32th";

    // Fallback для других рангов
    const suffix =
      ["th", "st", "nd", "rd"][rank % 100 > 10 && rank % 100 < 14 ? 0 : rank % 10] || "th";
    return `${rank}${suffix}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition History</CardTitle>
        <CardDescription>Tournaments and match records</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={historyView}
          onValueChange={(value: string) => setHistoryView(value as "tournaments" | "matches")}
        >
          <TabsList className="justify-start">
            <TabsTrigger value="tournaments">Tournament History</TabsTrigger>
            <TabsTrigger value="matches">Recent Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="tournaments" className="mt-6">
            {playerTournamentHistory.length > 0 ? (
              <>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%] text-left">Tournament</TableHead>
                        <TableHead className="w-[25%] text-left">Date</TableHead>
                        <TableHead className="w-[15%] text-left">Format</TableHead>
                        <TableHead className="w-[25%] text-center">Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentHistoryData.map((tournament) => {
                        const playerRank =
                          (tournament as any).playerRank ||
                          tournamentStandings[tournament.id]?.rank ||
                          calculatedRanks[tournament.id];
                        let outcome: { text: string; rank?: number | string };

                        if (playerRank) {
                          const rankText = getRankRangeText(
                            playerRank,
                            tournament.format || "single-elimination"
                          );
                          outcome = { text: rankText, rank: playerRank };
                        } else {
                          // Если нет playerRank, используем calculatedRanks или показываем "N/A"
                          const calculatedRank = calculatedRanks[tournament.id];
                          if (calculatedRank) {
                            const rankText = getRankRangeText(
                              calculatedRank,
                              tournament.format || "single-elimination"
                            );
                            outcome = { text: rankText, rank: calculatedRank };
                          } else {
                            outcome = { text: "N/A", rank: undefined };
                          }
                        }

                        return (
                          <TableRow
                            key={tournament.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/tournaments/${tournament.id}/results`)}
                          >
                            <TableCell className="font-medium text-left">{tournament.name}</TableCell>
                            <TableCell className="text-left">
                              {tournament.date
                                ? new Date(tournament.date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-left">
                              <Badge variant="secondary">{tournament.format}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  outcome.rank === 1
                                    ? "default"
                                    : outcome.rank === 2 || outcome.rank === 3
                                      ? "secondary"
                                      : "outline"
                                }
                                className={
                                  outcome.rank === 1
                                    ? "bg-primary"
                                    : outcome.rank === 2
                                      ? "bg-gray-400"
                                      : outcome.rank === 3
                                        ? "bg-amber-600"
                                        : "bg-gray-500"
                                }
                              >
                                {outcome.text}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  currentPage={currentHistoryPage}
                  totalPages={totalHistoryPages}
                  onPageChange={setCurrentHistoryPage}
                  className="mt-4"
                />
              </>
            ) : (
              <EmptyState icon={CalendarX} text="No tournament history found." />
            )}
          </TabsContent>

          <TabsContent value="matches" className="mt-6">
            {playerRecentMatches.length > 0 ? (
              <>
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[25%] text-left">Opponent</TableHead>
                        <TableHead className="w-[30%] text-left">Tournament</TableHead>
                        <TableHead className="w-[20%] text-left">Date</TableHead>
                        <TableHead className="w-[12%] text-center">Result</TableHead>
                        <TableHead className="w-[13%] text-center">Score (Sets)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentMatchesData.map((match) => {
                        const playerIdStr = playerData.id.toString();
                        const isPlayer1 = match.player1Id === playerIdStr;
                        const opponentId = isPlayer1 ? match.player2Id : match.player1Id;

                        const isDbUser =
                          !playerIdStr.startsWith("player-") &&
                          (!isNaN(parseInt(playerIdStr)) || typeof playerData.id === "number");
                        let opponent;
                        if (opponentsMap[opponentId]) {
                          opponent = { fullName: opponentsMap[opponentId].fullName };
                        } else {
                          opponent = { fullName: `Player ${opponentId}` };
                        }

                        const playerWon = match.winnerId === playerIdStr;
                        const resultText = match.winnerId
                          ? playerWon
                            ? "Win"
                            : "Loss"
                          : "N/A";

                        // Вычисляем счет матча
                        let scoreText = "N/A";
                        if (
                          match.scores &&
                          match.scores.player1 &&
                          match.scores.player2 &&
                          Array.isArray(match.scores.player1) &&
                          Array.isArray(match.scores.player2) &&
                          match.scores.player1.length > 0 &&
                          match.scores.player2.length > 0
                        ) {
                          const player1Scores = match.scores.player1;
                          const player2Scores = match.scores.player2;
                          const playerSets = player1Scores.filter((s, i) => {
                            if (isPlayer1) {
                              return s > (player2Scores[i] || 0);
                            } else {
                              return (player2Scores[i] || 0) > s;
                            }
                          }).length;
                          const opponentSets = player1Scores.filter((s, i) => {
                            if (isPlayer1) {
                              return s < (player2Scores[i] || 0);
                            } else {
                              return (player2Scores[i] || 0) < s;
                            }
                          }).length;
                          scoreText = `${playerSets}-${opponentSets}`;
                        }

                        // Используем tournament_name из API, если доступен
                        let tournamentName: string;
                        let tournamentId: string = match.tournamentId;

                        const matchData = matchesMap[match.id];
                        if (matchData && matchData.tournament_name) {
                          tournamentName = matchData.tournament_name;
                          tournamentId =
                            matchData.tournament_id?.toString() || match.tournamentId;
                        } else {
                          const tournamentData = tournamentsMap[match.tournamentId];
                          if (tournamentData && tournamentData.name) {
                            tournamentName = tournamentData.name;
                          } else if (match.tournamentId) {
                            tournamentName = `Tournament ${match.tournamentId}`;
                          } else {
                            tournamentName = "N/A";
                          }
                        }

                        // Определяем дату матча
                        const matchDate = match.matchDate || match.tournamentDate || "";
                        let dateText = "N/A";
                        if (matchDate) {
                          try {
                            const date = new Date(matchDate);
                            if (!isNaN(date.getTime())) {
                              dateText = date.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                            }
                          } catch (e) {
                            console.error("Error parsing date:", matchDate, e);
                          }
                        }

                        return (
                          <TableRow
                            key={match.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/tournaments/${tournamentId}/results`)}
                          >
                            <TableCell className="font-medium text-left">
                              {opponent?.fullName || `ID: ${opponentId}`}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground text-left">
                              {tournamentName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground text-left">
                              {dateText}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  resultText === "Win"
                                    ? "default"
                                    : resultText === "Loss"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {resultText}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{scoreText}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <Pagination
                  currentPage={currentMatchesPage}
                  totalPages={totalMatchesPages}
                  onPageChange={setCurrentMatchesPage}
                  className="mt-4"
                />
              </>
            ) : (
              <EmptyState icon={UserX} text="No recent matches found." />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

