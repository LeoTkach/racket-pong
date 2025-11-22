// src/data/database.ts
// Type definitions only - no mock data

export interface Player {
  id: string;
  username: string;
  fullName: string;
  email: string;
  country: string;
  avatar?: string;
  rating: number;
  rank: number;
  ranking: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  maxPoints?: number;
  bestRanking?: number | null;
  currentStreak?: number;
  bestStreak?: number;
  joinDate: string;
  bio?: string;
  playingStyle?: string;
  favoriteShot?: string;
  achievements: string[];
  tournamentHistory: string[];
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  status: "upcoming" | "ongoing" | "completed";
  format: "single-elimination" | "round-robin" | "group-stage";
  matchFormat: "best-of-1" | "best-of-3" | "best-of-5";
  maxParticipants: number;
  currentParticipants: number;
  participants: string[];
  description: string;
  imageUrl?: string;
  organizerId: string;
  createdAt: string;
  registrationDeadline: string;
  playerRank?: number | null;
  tournamentFormat?: "single-elimination" | "round-robin" | "group-stage";
  organizerName?: string;
  organizerUsername?: string;
  category?: "Professional" | "Amateur";
  skillLevelRestriction?: string[];
  ageRestriction?: { min?: number; max?: number };
}

export interface Match {
  id: string;
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  winnerId: string | null;
  status: "scheduled" | "ongoing" | "completed" | "cancelled";
  round?: string;
  group?: string;
  startTime?: string;
  endTime?: string;
  matchDate?: string;
  tournamentDate?: string;
  scores?: {
    player1: number[];
    player2: number[];
  };
}

export interface TournamentStanding {
  tournamentId: string;
  playerId: string;
  rank: number;
  wins: number;
  losses: number;
  points: number;
  pointDifference?: number;
}
