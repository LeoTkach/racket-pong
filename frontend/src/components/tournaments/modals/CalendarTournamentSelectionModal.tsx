import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, Trophy } from "lucide-react";
import { ImageWithFallback } from "@/components/common/image/ImageWithFallback";
import { CalendarCellTournament } from "../CalendarCell";
import { format } from "date-fns";
import apiClient from "@/api/client";

type ParticipantsStatus = "idle" | "loading" | "success" | "error";

interface TournamentParticipant {
  id: number;
  username?: string;
  full_name?: string;
  country?: string;
  avatar_url?: string;
  rating?: number;
  registered_at?: string;
}

interface ParticipantsEntry {
  status: ParticipantsStatus;
  players: TournamentParticipant[];
  error?: string;
}

interface CalendarTournamentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournaments: CalendarCellTournament[];
  onSelectTournament: (tournament: CalendarCellTournament) => void;
}

export function CalendarTournamentSelectionModal({
  open,
  onOpenChange,
  tournaments,
  onSelectTournament
}: CalendarTournamentSelectionModalProps) {
  const [participantsMap, setParticipantsMap] = useState<Record<number, ParticipantsEntry>>({});

  useEffect(() => {
    if (!open || tournaments.length === 0) {
      return;
    }

    const tournamentIdsNeedingFetch = tournaments
      .map(t => t.id)
      .filter(id => {
        const entry = participantsMap[id];
        return !entry || entry.status === "idle" || entry.status === "error";
      });

    if (tournamentIdsNeedingFetch.length === 0) {
      return;
    }

    let cancelled = false;

    setParticipantsMap(prev => {
      const updated = { ...prev };
      tournamentIdsNeedingFetch.forEach(id => {
        updated[id] = {
          players: prev[id]?.players ?? [],
          status: "loading",
        };
      });
      return updated;
    });

    const fetchParticipants = async () => {
      const results = await Promise.all(
        tournamentIdsNeedingFetch.map(async (id) => {
          try {
            const response = await apiClient.getTournamentParticipants(id);
            return {
              id,
              players: (response?.participants as TournamentParticipant[]) || [],
              status: "success" as const,
            };
          } catch (error) {
            console.error(`Failed to load participants for tournament ${id}:`, error);
            return {
              id,
              players: [],
              status: "error" as const,
              error: error instanceof Error ? error.message : "Failed to load players",
            };
          }
        })
      );

      if (cancelled) return;

      setParticipantsMap(prev => {
        const updated = { ...prev };
        results.forEach(({ id, players, status, error }) => {
          updated[id] = {
            players,
            status,
            error,
          };
        });
        return updated;
      });
    };

    void fetchParticipants();

    return () => {
      cancelled = true;
    };
  }, [open, tournaments, participantsMap]);

  const getParticipantsEntry = (tournamentId: number): ParticipantsEntry => {
    return participantsMap[tournamentId] ?? { status: "idle", players: [] };
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-red-600";
      case "ongoing":
        return "bg-green-600";
      case "upcoming":
        return "bg-blue-600";
      default:
        return "bg-gray-500";
    }
  };

  const getFormatBadgeText = (format: string) => {
    switch (format) {
      case "single-elimination":
        return "Single Elimination";
      case "round-robin":
        return "Round Robin";
      case "group-stage":
        return "Group Stage";
      default:
        return format;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto w-[95vw] p-4 sm:p-6"
        style={{ maxWidth: '500px' }}
      >
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Select Tournament
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {tournaments.length === 1
              ? "Tournament details"
              : `${tournaments.length} tournaments on this date. Choose one to view details.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {tournaments.map(tournament => {
            const imageUrl = tournament.image_url || null;
            const participantCount = tournament.participant_count || tournament.current_participants || 0;

            return (
              <div
                key={tournament.id}
                className="p-3 sm:p-4 border-2 border-border rounded-lg bg-card hover:bg-muted/50 cursor-pointer transition-colors shadow-sm"
                onClick={() => {
                  onSelectTournament(tournament);
                  onOpenChange(false);
                }}
              >
                <div className="flex gap-3 mb-3">
                  {/* Tournament Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <ImageWithFallback
                      src={imageUrl || ''}
                      alt={tournament.name}
                      className="w-full h-full object-cover"
                      data-tournament-id={tournament.id}
                    />
                  </div>

                  {/* Tournament Name and Badges */}
                  <div className="flex-1 min-w-0">
                    <h4 className="mb-2 text-sm sm:text-base font-semibold line-clamp-2">{tournament.name}</h4>

                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={`text-xs ${getStatusBadgeColor(tournament.status)}`}>
                        {tournament.status === 'ongoing' ? 'Ongoing' : tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getFormatBadgeText(tournament.format)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Tournament Details - Grid Layout */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>{format(new Date(tournament.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{tournament.time}</span>
                  </div>
                  {(tournament.location || tournament.venue) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{tournament.venue || tournament.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>{participantCount}/{tournament.max_participants} participants</span>
                  </div>
                </div>

                {/* View Details Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTournament(tournament);
                    onOpenChange(false);
                  }}
                >
                  View Details
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

