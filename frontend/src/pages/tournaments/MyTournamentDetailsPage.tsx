import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Trophy, Edit } from "lucide-react";
import { SportBackground } from "../../components/common/backgrounds/sport-background/SportBackground";
import { ImageWithFallback } from "../../components/common/image/ImageWithFallback";

interface MyTournamentDetailsPageProps {
  tournamentId: number;
  onBack: () => void;
  onEdit: () => void;
}

export function MyTournamentDetailsPage({ tournamentId, onBack, onEdit }: MyTournamentDetailsPageProps) {
  // Mock tournament data - in real app, fetch based on tournamentId
  const tournament = {
    id: tournamentId,
    name: "City Championship 2025",
    date: "December 15, 2025",
    location: "New York, USA",
    status: "upcoming" as const,
    participants: 45,
    maxParticipants: 64,
    entryFee: 35,
    prizePool: 2500,
    category: "Amateur",
    format: "Single Elimination",
    description: "A fantastic tournament for amateur players looking to compete and improve their skills.",
    imageUrl: "https://images.unsplash.com/photo-1719822566379-7547340da87b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SportBackground variant="details" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Tournaments
          </Button>
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Tournament
          </Button>
        </div>

        {/* Tournament Header */}
        <Card className="mb-6">
          <div className="relative h-64">
            <ImageWithFallback
              src={tournament.imageUrl}
              alt={tournament.name}
              className="w-full h-full object-cover rounded-t-lg"
            />
            <div className="absolute top-4 right-4">
              <div 
                style={{
                  backgroundColor: tournament.status === 'upcoming' ? '#2563eb' : tournament.status === 'ongoing' ? '#16a34a' : '#dc2626',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '0.3125rem 0.75rem',
                  borderRadius: '0.375rem',
                  display: 'inline-block',
                  lineHeight: '1.5'
                }}
              >
                {tournament.status === 'ongoing' ? 'Ongoing' : tournament.status}
              </div>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-3xl">{tournament.name}</CardTitle>
            <CardDescription className="text-lg">{tournament.description}</CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tournament Details */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold">{tournament.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{tournament.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  <p className="font-semibold">{tournament.participants} / {tournament.maxParticipants}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-semibold">{tournament.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <p className="font-semibold">{tournament.entryFee > 0 ? `${tournament.entryFee}` : "Free"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="font-semibold">{tournament.prizePool > 0 ? `${tournament.prizePool.toLocaleString()}` : "No Prize"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Format */}
          <Card>
            <CardHeader>
              <CardTitle>Format & Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tournament Format</p>
                <p className="font-semibold mb-4">{tournament.format}</p>
                <p className="text-sm text-muted-foreground">Rules</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All matches follow ITTF regulations</li>
                  <li>Best of 5 games format</li>
                  <li>Players must arrive 30 minutes early</li>
                  <li>Fair play and sportsmanship expected</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Registration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Registered</span>
                    <span>{tournament.participants} / {tournament.maxParticipants}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(tournament.participants / tournament.maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tournament.maxParticipants - tournament.participants} spots remaining
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
