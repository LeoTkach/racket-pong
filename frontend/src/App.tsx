
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Routes, Route, useNavigate, useParams, Link, useSearchParams, useLocation } from "react-router-dom";
import { Hero } from "./components/common/home/hero/Hero";
import { Preloader } from "./components/common/Preloader";
import { ElevateYourGameSection } from "./components/common/home/elevate-section/ElevateYourGameSection";
import { FeaturedTournamentsSection } from "./components/common/home/FeaturedTournamentsSection";
import { TournamentList } from "./components/tournaments/TournamentList";
import { TournamentDetailsPage } from "./components/tournaments/TournamentDetailsPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { LeaderboardApi } from "./components/common/leaderboard/LeaderboardApi";
import { RegistrationPage } from "./pages/common/RegistrationPage";
import { SettingsPage } from "./pages/profile/SettingsPage";
import { AchievementDesignsPage } from "./pages/profile/AchievementDesignsPage";
import { SupportPages } from "./pages/common/SupportPages";
import { LegalPages } from "./pages/common/LegalPages";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { CreateTournamentPage } from "./pages/tournaments/CreateTournamentPage";
import { MyTournamentsPage } from "./pages/tournaments/MyTournamentsPage";
import { MyTournamentDetailsPage } from "./pages/tournaments/MyTournamentDetailsPage";
import { EditTournamentPage } from "./pages/tournaments/EditTournamentPage";
import { ViewResultsPage } from "./pages/tournaments/ViewResultsPage";
import { ManageResultsPage } from "./pages/tournaments/ManageResultsPage";
import { TournamentResultsPage } from "./pages/tournaments/TournamentResultsPage";
import { TournamentsPage } from "./pages/tournaments/TournamentsPage";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { Tournament, TournamentCard } from "./components/tournaments/TournamentCard";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Trophy, Target, Users, TrendingUp, Calendar as CalendarIcon, Award, FileText, Calendar, Play, CheckCircle } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { SportBackground } from "./components/common/backgrounds/sport-background/SportBackground";
import { Toaster } from "./components/ui/sonner";
import { AchievementUnlockNotification } from "./components/common/achievements/AchievementUnlockNotification";
import { InteractiveHowItWorks } from "./components/common/home/how-it-works/InteractiveHowItWorks";
import { allAchievements, Achievement } from "./types/achievements";
import { Player } from "./types/database";
import { useAuth } from "./contexts/AuthContext";
import { apiClient } from "./api/client";
import { useMinimumLoadingTime } from "./hooks/useMinimumLoadingTime";
import { MapPin, Clock, Users as UsersIcon } from "lucide-react";
import { ImageWithFallback } from "./components/common/image/ImageWithFallback";

// Интерфейс для турнира из API
interface ApiTournament {
  id: number;
  name: string;
  date: string;
  time: string;
  location: string;
  venue: string | null;
  status: 'upcoming' | 'ongoing' | 'completed';
  format: 'single-elimination' | 'round-robin' | 'group-stage';
  match_format: 'best-of-1' | 'best-of-3' | 'best-of-5';
  max_participants: number;
  current_participants: number;
  participant_count: number;
  description: string;
  organizer_username: string;
  organizer_name: string;
  image_url: string | null;
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ КАРТОЧЕК ТУРНИРОВ ---
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming':
      return <Badge className="bg-blue-500 text-white border-0 shadow-lg hover:bg-blue-600"><Clock className="w-3 h-3 mr-1" />Upcoming</Badge>;
    case 'ongoing':
      return <Badge className="bg-green-500 text-white border-0 shadow-lg hover:bg-green-600"><Play className="w-3 h-3 mr-1" />Live</Badge>;
    case 'completed':
      return <Badge className="bg-red-500 text-white border-0 shadow-lg hover:bg-red-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getFormatBadge = (format: string) => {
  switch (format) {
    case 'single-elimination':
      return <Badge className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/60 shadow-lg hover:bg-white/30">Single Elimination</Badge>;
    case 'round-robin':
      return <Badge className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/60 shadow-lg hover:bg-white/30">Round Robin</Badge>;
    case 'group-stage':
      return <Badge className="bg-white/20 backdrop-blur-sm text-white border-2 border-white/60 shadow-lg hover:bg-white/30">Group Stage</Badge>;
    default:
      return <Badge variant="secondary">{format}</Badge>;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeString: string) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getTournamentImage = (tournament: ApiTournament) => {
  if (tournament.image_url && tournament.image_url.trim() !== '' &&
    tournament.image_url !== 'null' && tournament.image_url !== 'undefined') {
    // In development, use full URL to backend to avoid proxy issues
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment && tournament.image_url.startsWith('/uploads')) {
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3003';
      return `${backendUrl}${tournament.image_url}`;
    }
    if (tournament.image_url.startsWith('http')) {
      return tournament.image_url;
    }
    return tournament.image_url;
  }
  return '';
};

const TournamentImage = ({ tournament }: { tournament: ApiTournament }) => {
  const imageSrc = getTournamentImage(tournament);
  const hasImage = imageSrc && imageSrc.trim() !== '';

  return (
    <div className={`relative h-48 overflow-hidden rounded-t-xl ${hasImage ? 'bg-black' : ''}`}>
      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
        <ImageWithFallback
          src={imageSrc}
          alt={tournament.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          data-tournament-id={tournament.id}
        />
      </div>

      {/* Floating Status Badge */}
      <div className="absolute top-3 left-3" style={{ zIndex: 3 }}>
        {getStatusBadge(tournament.status)}
      </div>

      {/* Format Badge */}
      <div className="absolute top-3 right-3" style={{ zIndex: 3 }}>
        {getFormatBadge(tournament.format)}
      </div>

      {/* Title Overlay at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4" style={{ zIndex: 3 }}>
        <h3 className="text-white font-bold text-xl line-clamp-2 drop-shadow-lg">
          {tournament.name}
        </h3>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ HOMEPAGE ---
function HomePage({ onBrowseTournaments, onShowAchievement }: { onBrowseTournaments: () => void, onShowAchievement: (ach: Achievement) => void }) {
  // Прокручиваем страницу вверх при открытии (без анимации, до рендера)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Hero onBrowseTournaments={onBrowseTournaments} />

      <ElevateYourGameSection />

      <FeaturedTournamentsSection onBrowseTournaments={onBrowseTournaments} />

      <InteractiveHowItWorks />
    </>
  );
}

// --- КОМПОНЕНТЫ-ОБЕРТКИ (WRAPPERS) ---
function TournamentDetailsWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldShowLoading = useMinimumLoadingTime(isLoading);

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) {
        setError("Invalid tournament ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch from API first
        try {
          const response = await apiClient.getTournament(parseInt(id));
          const apiTournament = response.tournament || response;

          // Convert ApiTournament to Tournament format
          // Format date and time
          let formattedDate = apiTournament.date || new Date().toISOString();
          if (apiTournament.time) {
            // Remove seconds if present (HH:MM:SS -> HH:MM)
            const timePart = apiTournament.time.length > 5
              ? apiTournament.time.substring(0, 5)
              : apiTournament.time;
            formattedDate = `${formattedDate} at ${timePart}`;
          }

          // Format match_format
          let matchFormat = "best-of-5";
          if (apiTournament.match_format) {
            const format = apiTournament.match_format.toLowerCase();
            if (format === "best_of_1" || format === "best-of-1" || format === "1") {
              matchFormat = "best-of-1";
            } else if (format === "best_of_3" || format === "best-of-3" || format === "3") {
              matchFormat = "best-of-3";
            } else if (format === "best_of_5" || format === "best-of-5" || format === "5") {
              matchFormat = "best-of-5";
            }
          }

          // Get image URL
          let imageUrl = "";
          if (apiTournament.image_url && apiTournament.image_url.trim() !== '' &&
            apiTournament.image_url !== 'null' && apiTournament.image_url !== 'undefined') {
            if (apiTournament.image_url.startsWith('http')) {
              imageUrl = apiTournament.image_url;
            } else if (apiTournament.image_url.startsWith('/')) {
              imageUrl = apiTournament.image_url;
            } else {
              imageUrl = `/${apiTournament.image_url}`;
            }
          }

          const convertedTournament: Tournament = {
            id: apiTournament.id,
            name: apiTournament.name,
            date: formattedDate,
            location: apiTournament.location || apiTournament.venue || "TBA",
            category: "Professional" as const,
            status: apiTournament.status,
            participants: apiTournament.participant_count || apiTournament.current_participants || 0,
            maxParticipants: apiTournament.max_participants,
            description: apiTournament.description || "",
            skillLevelRestriction: [],
            ageRestriction: {},
            tournamentFormat: apiTournament.format,
            imageUrl: imageUrl,
            matchFormat: matchFormat,
            organizerName: apiTournament.organizer_name,
            organizerUsername: apiTournament.organizer_username,
          };

          setTournament(convertedTournament);
        } catch (apiError) {
          console.error("Error fetching tournament from API:", apiError);
          setError("Tournament not found");
        }
      } catch (err) {
        console.error("Error loading tournament:", err);
        setError("Failed to load tournament");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  if (shouldShowLoading) {
    return <Preloader />;
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-lg mb-4">{error || "Tournament not found"}</p>
        <Button variant="link" onClick={() => navigate('/tournaments')}>Go back to Tournaments</Button>
      </div>
    );
  }

  return (
    <TournamentDetailsPage
      tournament={tournament}
      onBack={() => navigate(-1)}
      onRegister={() => navigate(`/tournaments/${id}/register`)}
      onViewResults={() => navigate(`/tournaments/${id}/results`)}
    />
  );
}

function RegistrationPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isLoggedIn = !!user;

  useEffect(() => {
    const fetchTournament = async () => {
      if (!id) {
        setError("Invalid tournament ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.getTournament(parseInt(id));
        const apiTournament = response.tournament || response;

        // Convert ApiTournament to Tournament format
        let formattedDate = apiTournament.date || new Date().toISOString();
        if (apiTournament.time) {
          const timePart = apiTournament.time.length > 5
            ? apiTournament.time.substring(0, 5)
            : apiTournament.time;
          formattedDate = `${formattedDate} at ${timePart}`;
        }

        let matchFormat = "best-of-5";
        if (apiTournament.match_format) {
          const format = apiTournament.match_format.toLowerCase();
          if (format === "best_of_1" || format === "best-of-1" || format === "1") {
            matchFormat = "best-of-1";
          } else if (format === "best_of_3" || format === "best-of-3" || format === "3") {
            matchFormat = "best-of-3";
          } else if (format === "best_of_5" || format === "best-of-5" || format === "5") {
            matchFormat = "best-of-5";
          }
        }

        let imageUrl = "";
        if (apiTournament.image_url && apiTournament.image_url.trim() !== '' &&
          apiTournament.image_url !== 'null' && apiTournament.image_url !== 'undefined') {
          if (apiTournament.image_url.startsWith('http')) {
            imageUrl = apiTournament.image_url;
          } else if (apiTournament.image_url.startsWith('/')) {
            imageUrl = apiTournament.image_url;
          } else {
            imageUrl = `/${apiTournament.image_url}`;
          }
        }

        const convertedTournament: Tournament = {
          id: apiTournament.id,
          name: apiTournament.name,
          date: formattedDate,
          location: apiTournament.location || apiTournament.venue || "TBA",
          category: "Professional" as const,
          status: apiTournament.status,
          participants: apiTournament.participant_count || apiTournament.current_participants || 0,
          maxParticipants: apiTournament.max_participants,
          description: apiTournament.description || "",
          skillLevelRestriction: [],
          ageRestriction: {},
          tournamentFormat: apiTournament.format,
          imageUrl: imageUrl,
          matchFormat: matchFormat,
          organizerName: apiTournament.organizer_name,
          organizerUsername: apiTournament.organizer_username,
        };

        setTournament(convertedTournament);
      } catch (err: any) {
        console.error("Error loading tournament:", err);
        setError(err.message || "Failed to load tournament");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournament();
  }, [id]);

  if (isLoading) {
    return <Preloader />;
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-lg mb-4">{error || "Tournament not found"}</p>
        <Button variant="link" onClick={() => navigate('/tournaments')}>Go back to Tournaments</Button>
      </div>
    );
  }

  return (
    <RegistrationPage
      tournament={tournament}
      onBack={() => navigate(-1)}
      isLoggedIn={isLoggedIn}
    />
  );
}

function ProfilePageWrapper() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentAuthUser, isLoading: authLoading } = useAuth();
  const [profileToShow, setProfileToShow] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const shouldShowLoading = useMinimumLoadingTime(authLoading || isLoading);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        let targetUsername = username;

        // If no username provided, use current authenticated user
        if (!targetUsername && location.pathname === "/profile") {
          if (currentAuthUser) {
            targetUsername = currentAuthUser.username;
          } else {
            // Not authenticated, redirect to sign in
            navigate('/signin');
            return;
          }
        }

        if (targetUsername) {
          // Try to fetch from API first
          try {
            const apiUser = await apiClient.getPlayerByUsername(targetUsername);

            // Convert API user to Player format
            const convertedUser: Player = {
              id: apiUser.id.toString(),
              username: apiUser.username,
              fullName: apiUser.full_name,
              email: apiUser.email,
              country: apiUser.country,
              avatar: apiUser.avatar_url,
              rating: apiUser.rating || 1000,
              rank: apiUser.rank || 0,
              ranking: apiUser.ranking || 0,
              gamesPlayed: parseInt(apiUser.games_played) || 0,
              wins: parseInt(apiUser.wins) || 0,
              losses: parseInt(apiUser.losses) || 0,
              winRate: typeof apiUser.win_rate === 'string' ? parseFloat(apiUser.win_rate) : (apiUser.win_rate || 0),
              maxPoints: apiUser.max_points || 0,
              bestRanking: apiUser.best_ranking || null,
              currentStreak: apiUser.current_streak !== null && apiUser.current_streak !== undefined ? apiUser.current_streak : 0,
              bestStreak: apiUser.best_streak !== null && apiUser.best_streak !== undefined ? apiUser.best_streak : 0,
              joinDate: apiUser.join_date ? new Date(apiUser.join_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              bio: apiUser.bio,
              playingStyle: apiUser.playing_style,
              favoriteShot: apiUser.favorite_shot,
              achievements: [],
              tournamentHistory: []
            };

            setProfileToShow(convertedUser);
          } catch (error) {
            console.error('Error fetching profile:', error);
            setProfileToShow(null);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [username, location.pathname, currentAuthUser, authLoading, navigate]);

  if (shouldShowLoading) {
    return <Preloader />;
  }

  if (!profileToShow) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-lg">Player profile not found!</p>
        <Button variant="link" onClick={() => navigate('/leaderboard')}>Go back to Leaderboard</Button>
      </div>
    );
  }

  const isOwnProfile = Boolean(currentAuthUser && profileToShow.username === currentAuthUser.username);

  return (
    <ProfilePage
      playerDataProp={profileToShow}
      isOwnProfileProp={isOwnProfile}
      onNavigateToSettings={() => navigate("/settings")}
      onViewMyTournaments={() => navigate("/my-tournaments")}
    />
  );
}

function TournamentResultsPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTournament = async () => {
      if (!id) {
        setError("Invalid Tournament ID");
        setLoading(false);
        return;
      }

      try {
        const tournamentData = await apiClient.getTournament(parseInt(id));
        const tournamentInfo = tournamentData.tournament || tournamentData;

        if (!tournamentInfo) {
          setError("Tournament not found");
          setLoading(false);
          return;
        }

        setTournament(tournamentInfo);
      } catch (err: any) {
        console.error('Error loading tournament:', err);
        setError(err.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [id]);

  if (loading) {
    return <Preloader />;
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-4">{error || "Tournament not found"}</div>
          <Button variant="link" onClick={() => navigate('/tournaments')}>Go back</Button>
        </div>
      </div>
    );
  }

  // Map API format to component format
  const format = tournament.format || 'single-elimination';
  const tournamentFormat = format === 'single-elimination' ? 'single-elimination'
    : format === 'round-robin' ? 'round-robin'
      : format === 'group-stage' ? 'group-stage'
        : 'single-elimination';

  return (
    <TournamentResultsPage
      tournamentId={parseInt(id!)}
      tournamentFormat={tournamentFormat}
      onBack={() => navigate(-1)}
    />
  );
}

function MyTournamentDetailsPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <div>Invalid Tournament ID</div>;
  return <MyTournamentDetailsPage tournamentId={parseInt(id)} onBack={() => navigate('/my-tournaments')} onEdit={() => navigate(`/my-tournaments/edit/${id}`)} />;
}

function EditTournamentPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) return <div>Invalid Tournament ID</div>;
  return <EditTournamentPage tournamentId={parseInt(id)} onBack={() => navigate(-1)} />;
}

function ViewResultsPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTournament = async () => {
      if (!id) {
        setError("Invalid Tournament ID");
        setLoading(false);
        return;
      }

      try {
        const tournamentData = await apiClient.getTournament(parseInt(id));
        const tournamentInfo = tournamentData.tournament || tournamentData;

        if (!tournamentInfo) {
          setError("Tournament not found");
          setLoading(false);
          return;
        }

        setTournament(tournamentInfo);
      } catch (err: any) {
        console.error('Error loading tournament:', err);
        setError(err.message || 'Failed to load tournament');
      } finally {
        setLoading(false);
      }
    };

    loadTournament();
  }, [id]);

  if (loading) {
    return <Preloader />;
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-destructive mb-4">{error || "Invalid Tournament ID"}</div>
          <Button variant="link" onClick={() => navigate('/my-tournaments')}>Go back</Button>
        </div>
      </div>
    );
  }

  // Map API format to component format
  const format = tournament.format || 'single-elimination';
  const tournamentFormat = format === 'single-elimination' ? 'single-elimination'
    : format === 'round-robin' ? 'round-robin'
      : format === 'group-stage' ? 'group-stage'
        : 'single-elimination';

  return (
    <TournamentResultsPage
      tournamentId={parseInt(id!)}
      tournamentFormat={tournamentFormat}
      onBack={() => navigate(-1)}
    />
  );
}

function ManageResultsPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const format = searchParams.get('format') || 'single-elimination';
  const validFormats = ["single-elimination", "round-robin", "group-stage"];
  const tournamentFormat = validFormats.includes(format) ? format as "single-elimination" | "round-robin" | "group-stage" : "single-elimination";

  if (!id) return <div>Invalid Tournament ID</div>;
  return <ManageResultsPage tournamentId={parseInt(id)} tournamentFormat={tournamentFormat} onBack={() => navigate(-1)} />;
}

// --- КОМПОНЕНТ APP ---
export default function App() {
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [selectedTournamentFormat, setSelectedTournamentFormat] = useState<"single-elimination" | "round-robin" | "group-stage">("single-elimination");
  const [supportPage, setSupportPage] = useState<"help" | "contact" | "faq">("help");
  const [legalPage, setLegalPage] = useState<"terms" | "privacy" | "cookies">("terms");
  const [isLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Отключаем автоматическое восстановление прокрутки браузера
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Прокручиваем страницу вверх при изменении маршрута (без анимации, до рендера)
  useLayoutEffect(() => {
    // Устанавливаем прокрутку напрямую на все возможные элементы
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (document.documentElement.scrollTop !== 0 || document.body.scrollTop !== 0) {
      // Если не сработало, пробуем еще раз
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }
  }, [location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Preloader />;
  }

  return (
    <div className="min-h-screen bg-background">
      <style>
        {`
          /* Фон для overscroll - совпадает с header/footer */
          html {
            background-color: var(--card);
            overflow-x: hidden;
          }
          
          body {
            background-color: var(--card);
            scrollbar-gutter: stable;
          }
          
          @keyframes flicker {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1.0; }
          }
          .animate-flicker {
            animation: flicker 2s ease-in-out infinite;
          }

          /* --- НОВЫЕ СТИЛИ ДЛЯ КАРТОЧЕК --- */
          :root {
            --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
            --frost-blue: 59, 130, 246;   /* blue-500 */
            --frost-purple: 168, 85, 247; /* purple-500 */
            --frost-green: 34, 197, 94;   /* green-500 */
            --frost-orange: 249, 115, 22;  /* orange-500 */
          }

          /* Base glass-card styles - применяются только если нет стилей из секции Elevate Your Game */
          .glass-card {
            position: relative;
            overflow: hidden;
            transition: all 0.5s var(--ease-out-expo);
            /* Base glassmorphism - увеличенное размытие для большей матовости */
            background-color: rgba(255, 255, 255, 0.15) !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            backdrop-filter: blur(40px) !important;
            -webkit-backdrop-filter: blur(40px) !important;
          }
          
          .dark .glass-card {
            background-color: rgba(0, 0, 0, 0.25) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(40px) !important;
            -webkit-backdrop-filter: blur(40px) !important;
          }

          /* Shine Effect (Блик) */
          .glass-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              to right,
              transparent 0%,
              rgba(255, 255, 255, 0.3) 50%,
              transparent 100%
            );
            transform: skewX(-25deg);
            transition: left 0.8s var(--ease-out-expo);
            z-index: 10;
          }

          .group:hover .glass-card::before {
            left: 150%;
          }

          /* Frost "Иней" Effect */
          .glass-card::after {
            content: '';
            position: absolute;
            inset: -1px; /* Чуть больше, чтобы покрыть border */
            border-radius: inherit;
            z-index: 5;
            transition: all 0.5s var(--ease-out-expo);
            /* Тень для "инея" с использованием CSS-переменных */
            box-shadow: 
              inset 4px 0 12px -4px rgba(var(--frost-color-rgb), 0.5), /* left */
              inset 0 4px 12px -4px rgba(var(--frost-color-rgb), 0.5), /* top */
              inset 0 -4px 12px -4px rgba(var(--frost-color-rgb), 0.5); /* bottom */
            opacity: 0.8;
          }
          
          .group:hover .glass-card::after {
            opacity: 1;
            box-shadow: 
              inset 6px 0 16px -4px rgba(var(--frost-color-rgb), 0.7),
              inset 0 6px 16px -4px rgba(var(--frost-color-rgb), 0.7),
              inset 0 -6px 16px -4px rgba(var(--frost-color-rgb), 0.7);
          }

          /* Определение цветов "инея" */
          .frost-blue { --frost-color-rgb: var(--frost-blue); }
          .frost-purple { --frost-color-rgb: var(--frost-purple); }
          .frost-green { --frost-color-rgb: var(--frost-green); }
          .frost-orange { --frost-color-rgb: var(--frost-orange); }

          /* 3D-анимации */
          .transition-expo {
            transition-property: all;
            transition-duration: 500ms;
            transition-timing-function: var(--ease-out-expo);
          }
          
          /* Background Orbs (Орбы) */
          @keyframes float {
            0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
            50% { transform: translate(25px, -35px) scale(1.1); opacity: 0.7; }
            100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          }
          .orb {
            position: absolute;
            border-radius: 9999px;
            filter: blur(100px); /* Сильное размытие */
            animation: float 10s ease-in-out infinite;
          }
          
          /* Fix для сохранения rounded углов в Featured Tournaments при hover и анимации */
          [data-tournament-index] {
            border-radius: 0.75rem !important;
            overflow: hidden !important;
          }
          [data-tournament-index]:hover {
            border-radius: 0.75rem !important;
            overflow: hidden !important;
          }
          [data-tournament-index] .rounded-t-xl {
            border-top-left-radius: 0.75rem !important;
            border-top-right-radius: 0.75rem !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          /* --- КОНЕЦ НОВЫХ СТИЛЕЙ --- */
        `}
      </style>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage onBrowseTournaments={() => navigate('/tournaments')} onShowAchievement={setUnlockedAchievement} />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailsWrapper />} />
        <Route path="/tournaments/:id/register" element={<RegistrationPageWrapper />} />
        <Route path="/tournaments/:id/results" element={<TournamentResultsPageWrapper />} />
        <Route path="/leaderboard" element={<LeaderboardApi />} />
        <Route path="/profile/:username" element={<ProfilePageWrapper />} />
        <Route path="/profile" element={<ProfilePageWrapper />} />
        <Route path="/achievement-designs" element={<AchievementDesignsPage />} />
        <Route path="/settings" element={<SettingsPage onNavigateToResetPassword={() => navigate('/reset-password')} />} />
        <Route path="/support/help" element={<SupportPages page="help" onBack={() => navigate(-1)} />} />
        <Route path="/support/contact" element={<SupportPages page="contact" onBack={() => navigate(-1)} />} />
        <Route path="/support/faq" element={<SupportPages page="faq" onBack={() => navigate(-1)} />} />
        <Route path="/legal/terms" element={<LegalPages page="terms" onBack={() => navigate(-1)} />} />
        <Route path="/legal/privacy" element={<LegalPages page="privacy" onBack={() => navigate(-1)} />} />
        <Route path="/legal/cookies" element={<LegalPages page="cookies" onBack={() => navigate(-1)} />} />
        <Route path="/signin" element={<SignInPage onBack={() => navigate('/')} onResetPassword={() => navigate('/reset-password')} onSignUp={() => navigate('/signup')} />} />
        <Route path="/signup" element={<SignUpPage onBack={() => navigate('/')} onSignIn={() => navigate('/signin')} />} />
        <Route path="/reset-password" element={<ResetPasswordPage onBack={() => navigate('/signin')} />} />
        <Route path="/create-tournament" element={<CreateTournamentPage onBack={() => navigate(-1)} />} />
        <Route
          path="/my-tournaments"
          element={
            <MyTournamentsPage
              onBack={() => navigate('/profile')}
              onCreateTournament={() => navigate('/create-tournament')}
              onViewTournament={(id) => navigate(`/my-tournaments/view/${id}`)}
              onViewResults={(id) => navigate(`/my-tournaments/results/${id}`)}
              onEditTournament={(id) => navigate(`/my-tournaments/edit/${id}`)}
              onManageResults={(id, format) => navigate(`/my-tournaments/manage/${id}?format=${format || 'single-elimination'}`)}
            />
          }
        />
        <Route path="/my-tournaments/view/:id" element={<MyTournamentDetailsPageWrapper />} />
        <Route path="/my-tournaments/edit/:id" element={<EditTournamentPageWrapper />} />
        <Route path="/my-tournaments/results/:id" element={<ViewResultsPageWrapper />} />
        <Route path="/my-tournaments/manage/:id" element={<ManageResultsPageWrapper />} />
        <Route path="*" element={<div><h1>404 - Page Not Found</h1><Link to="/">Go Home</Link></div>} />
      </Routes>
      <Footer />
      <Toaster />
      <AchievementUnlockNotification
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />
    </div>
  );
}