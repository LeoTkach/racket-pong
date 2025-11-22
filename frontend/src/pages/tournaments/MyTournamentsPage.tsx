import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { ArrowLeft, Plus, Trophy, Users, Calendar } from "lucide-react";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { Preloader } from "../../components/common/Preloader";
import { EmptyState } from "../../components/common/EmptyState";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { DeleteTournamentDialog } from "../../components/tournaments/modals/DeleteTournamentDialog";
import { apiClient } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { TournamentCardMyTournaments } from "../../components/tournaments/TournamentCard";
import { StatCard } from "../../components/ui/stat-card";
import { typography } from "../../utils/typography";
import { cn } from "../../components/ui/utils";

interface MyTournamentsPageProps {
  onBack: () => void;
  onCreateTournament: () => void;
  onViewTournament?: (id: number) => void;
  onEditTournament?: (id: number) => void;
  onViewResults?: (id: number) => void;
  onManageResults?: (id: number, format: string) => void;
}


export function MyTournamentsPage({ onBack, onCreateTournament, onViewTournament, onEditTournament, onViewResults, onManageResults }: MyTournamentsPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<{ id: number; name: string } | null>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleEdit = (id: number) => {
    if (onEditTournament) {
      onEditTournament(id);
    } else {
      toast("Edit tournament", { description: `Editing tournament ${id}` });
    }
  };

  useEffect(() => {
    const loadTournaments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await apiClient.getOrganizerTournaments(user.id);
        const tournamentsList = response.tournaments || response || [];
        setTournaments(tournamentsList);
      } catch (err: any) {
        console.error('Error loading tournaments:', err);
        toast.error(err.message || 'Failed to load tournaments');
      } finally {
        setLoading(false);
      }
    };
    
    loadTournaments();
  }, [user]);

  const handleDeleteClick = (id: number, name: string) => {
    setTournamentToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTournament = async () => {
    if (!tournamentToDelete || !user?.id) return;
    try {
      await apiClient.deleteTournament(tournamentToDelete.id);
      toast.success("Tournament deleted successfully!");
      const response = await apiClient.getOrganizerTournaments(user.id);
      const tournamentsList = response.tournaments || response || [];
      setTournaments(tournamentsList);
    } catch (err: any) {
      console.error('Error deleting tournament:', err);
      toast.error(err.message || 'Failed to delete tournament');
    } finally {
      setDeleteDialogOpen(false);
      setTournamentToDelete(null);
    }
  };

  const handleManageResults = (id: number, format: string) => {
    if (onManageResults) {
      onManageResults(id, format);
    } else {
      toast("Manage results", { description: `Managing results for tournament ${id}` });
    }
  };

  const handleViewResultsClick = (id: number) => {
    if (onViewResults) {
      onViewResults(id);
    } else {
      toast("View results", { description: `Viewing results for tournament ${id}` });
    }
  };

  const handleStartTournament = async (id: number) => {
    try {
      // Find tournament to check participant count
      const tournament = tournaments.find(t => t.id === id);
      if (!tournament) {
        toast.error("Tournament not found");
        return;
      }

      const participantCount = tournament.participant_count || tournament.current_participants || tournament.participants || 0;

      // Check if minimum participants are registered (minimum 2 required)
      if (participantCount === 0 || participantCount < 2) {
        toast.error(
          `Tournament cannot be started with ${participantCount} participant${participantCount !== 1 ? 's' : ''}. Minimum 2 participants required.`,
          {
            description: `You can change the maximum number of participants using the Edit button.`,
            duration: 6000,
          }
        );
        return;
      }

      await apiClient.startTournament(id);
      toast.success("Tournament started successfully!");
      // Reload tournaments
      if (user?.id) {
        const response = await apiClient.getOrganizerTournaments(user.id);
        const tournamentsList = response.tournaments || response || [];
        setTournaments(tournamentsList);
      }
    } catch (err: any) {
      console.error('Error starting tournament:', err);
      const errorMessage = err.message || 'Failed to start tournament';
      
      // If error mentions participants, add helpful message
      if (errorMessage.toLowerCase().includes('participant') || errorMessage.toLowerCase().includes('player')) {
        toast.error(errorMessage, {
          description: `You can change the maximum number of participants using the Edit button.`,
          duration: 5000,
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };
  // Convert tournament data to ApiTournament format
  const convertToApiTournament = (tournament: any): ApiTournament => {
    // Normalize status
    let normalizedStatus: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
    if (tournament.status === "scheduled" || tournament.status === "upcoming") {
      normalizedStatus = 'upcoming';
    } else if (tournament.status === "in_progress" || tournament.status === "ongoing") {
      normalizedStatus = 'ongoing';
    } else if (tournament.status === "finished" || tournament.status === "completed") {
      normalizedStatus = 'completed';
    }

    // Normalize format
    let normalizedFormat: 'single-elimination' | 'round-robin' | 'group-stage' = 'single-elimination';
    const format = tournament.tournament_format || tournament.format || 'single-elimination';
    if (format === "single-elimination" || format === "single_elimination") {
      normalizedFormat = 'single-elimination';
    } else if (format === "round-robin" || format === "round_robin") {
      normalizedFormat = 'round-robin';
    } else if (format === "group-stage" || format === "group_stage") {
      normalizedFormat = 'group-stage';
    }

    // Parse date and time
    let dateStr = tournament.date || tournament.start_date || '';
    let timeStr = tournament.time || '';
    
    // If date contains time, split it
    if (dateStr && dateStr.includes('T')) {
      const [date, time] = dateStr.split('T');
      dateStr = date;
      if (time && !timeStr) {
        timeStr = time.split('.')[0]; // Remove milliseconds if present
      }
    }

    return {
      id: tournament.id,
      name: tournament.name || '',
      date: dateStr,
      time: timeStr || '00:00:00',
      location: tournament.location || tournament.venue || '',
      venue: tournament.venue || null,
      status: normalizedStatus,
      format: normalizedFormat,
      match_format: tournament.match_format || tournament.matchFormat || 'best-of-5',
      max_participants: tournament.max_participants || tournament.maxParticipants || 0,
      current_participants: tournament.current_participants || tournament.participants || 0,
      participant_count: tournament.participant_count || tournament.current_participants || tournament.participants || 0,
      description: tournament.description || '',
      organizer_username: tournament.organizer_username || '',
      organizer_name: tournament.organizer_name || '',
      image_url: tournament.image_url || tournament.imageUrl || null,
    };
  };

  const upcomingTournaments = tournaments
    .filter(t => t.status === "upcoming" || t.status === "scheduled")
    .map(convertToApiTournament);
  const ongoingTournaments = tournaments
    .filter(t => t.status === "ongoing" || t.status === "in_progress")
    .map(convertToApiTournament);
  const completedTournaments = tournaments
    .filter(t => t.status === "completed" || t.status === "finished")
    .map(convertToApiTournament);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <style>{`
        /* Custom hover styles for management buttons */
        .my-tournament-edit-btn:hover {
          background-color: rgba(251, 191, 36, 0.3) !important;
          border-color: #fbbf24 !important;
          color: #fbbf24 !important;
        }
        .light .my-tournament-edit-btn:hover {
          background-color: rgba(245, 158, 11, 0.3) !important;
          border-color: #f59e0b !important;
          color: #f59e0b !important;
        }
        .dark .my-tournament-edit-btn:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.6) !important;
          color: white !important;
        }
        .my-tournament-edit-btn:hover svg {
          color: #fbbf24 !important;
        }
        .light .my-tournament-edit-btn:hover svg {
          color: #f59e0b !important;
        }
        .dark .my-tournament-edit-btn:hover svg {
          color: white !important;
        }
        
        .my-tournament-delete-btn:hover {
          background-color: rgba(239, 68, 68, 0.3) !important;
          border-color: rgb(239, 68, 68) !important;
        }
        .dark .my-tournament-delete-btn:hover {
          background-color: rgba(239, 68, 68, 0.25) !important;
          border-color: rgba(239, 68, 68, 0.7) !important;
        }
        .my-tournament-delete-btn:hover svg {
          color: #fbbf24 !important;
        }
        .light .my-tournament-delete-btn:hover svg {
          color: #f59e0b !important;
        }
        .dark .my-tournament-delete-btn:hover svg {
          color: #fbbf24 !important;
        }
      `}</style>
      <SportBackground variant="profile" />
      
      <div className="border-b border-border/40 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:underline -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-8">
          <div className="text-center">
            <h1 
              className={cn(
                typography.sectionTitleTournament,
                typography.spacing.titleMargin,
                "text-foreground"
              )}
              style={typography.sectionTitleTournamentStyle}
            >
              My Tournaments
            </h1>
            <p 
              className={cn(typography.subtitle, "max-w-2xl mx-auto")}
            >
              Manage tournaments you've organized
            </p>
          </div>
        </div>

        {loading && <Preloader />}

        {!loading && tournaments.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Trophy}
                text="No tournaments yet. Create your first tournament to get started"
                actionButton={{
                  label: "Create Tournament",
                  onClick: onCreateTournament,
                  icon: Plus
                }}
              />
            </CardContent>
          </Card>
        )}

        {!loading && tournaments.length > 0 && (
          <>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Tournaments"
            value={tournaments.length}
            description="All time organized"
            icon={Trophy}
            iconColor="default"
          />
          <StatCard
            title="Active Tournaments"
            value={upcomingTournaments.length + ongoingTournaments.length}
            description="Currently running or planned"
            icon={Calendar}
            iconColor="default"
          />
          <StatCard
            title="Total Participants"
            value={tournaments.reduce((sum, t) => {
              const participants = Number(t.participants) || Number(t.participant_count) || 0;
              return sum + participants;
            }, 0).toLocaleString()}
            description="Across all tournaments"
            icon={Users}
            iconColor="default"
          />
        </div>

        {/* Tournaments List */}
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
              <TabsTrigger value="ongoing">Ongoing ({ongoingTournaments.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
            </TabsList>
            <Button onClick={onCreateTournament} className="w-full sm:w-auto">
              <Plus className="w-8 h-8" strokeWidth={2.5} />
              Create Tournament
            </Button>
          </div>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            {upcomingTournaments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={Trophy}
                    text="No upcoming tournaments. Create your first tournament to get started"
                    actionButton={{
                      label: "Create Tournament",
                      onClick: onCreateTournament,
                      icon: Plus
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingTournaments.map((tournament, index) => (
                  <TournamentCardMyTournaments
                    key={tournament.id}
                    tournament={tournament}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onStart={handleStartTournament}
                    index={index}
                    delay={0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ongoing" className="space-y-4 mt-6">
            {ongoingTournaments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={Trophy}
                    text="No ongoing tournaments. Your active tournaments will appear here"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ongoingTournaments.map((tournament, index) => (
                  <TournamentCardMyTournaments
                    key={tournament.id}
                    tournament={tournament}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onManageResults={handleManageResults}
                    index={index}
                    delay={0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedTournaments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    icon={Trophy}
                    text="No completed tournaments. Your tournament history will appear here"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedTournaments.map((tournament, index) => (
                  <TournamentCardMyTournaments
                    key={tournament.id}
                    tournament={tournament}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onViewResults={handleViewResultsClick}
                    index={index}
                    delay={0}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </>
        )}

        {/* Delete Dialog */}
        <DeleteTournamentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          tournamentName={tournamentToDelete?.name || ""}
          onConfirm={confirmDeleteTournament}
        />
      </div>
    </div>
  );
}
