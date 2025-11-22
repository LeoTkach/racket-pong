import React from "react";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, MapPin, Users, Trophy, Clock, Edit, Trash2, Play, Eye } from "lucide-react";
import { ImageWithFallback } from "../common/image/ImageWithFallback";
import { typography } from "@/utils/typography";
import { cn } from "../ui/utils";

export interface Tournament {
  id: number;
  name: string;
  date: string;
  location: string;
  category: "Professional" | "Amateur";
  status: "upcoming" | "ongoing" | "completed";
  participants: number;
  maxParticipants: number;
  description: string;
  skillLevelRestriction: string[];
  ageRestriction: { min?: number; max?: number };
  tournamentFormat: "single-elimination" | "round-robin" | "group-stage";
  imageUrl: string;
  entryFee?: number;
  prizePool?: number;
  matchFormat?: "best-of-1" | "best-of-3" | "best-of-5" | string;
  organizerName?: string;
  organizerUsername?: string;
  // Support for API fields
  participant_count?: number;
  current_participants?: number;
}

// API Tournament interface (from backend)
export interface ApiTournament {
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

interface TournamentCardProps {
  tournament: Tournament;
  onViewDetails: (tournament: Tournament) => void;
  index?: number;
  delay?: number;
}

interface TournamentCardApiProps {
  tournament: ApiTournament;
  onViewDetails?: (tournament: ApiTournament) => void;
  onClick?: () => void;
  index?: number;
  delay?: number;
  showDate?: boolean;
}

// Helper function to create status badge with correct styling
const createStatusBadge = (status: "upcoming" | "ongoing" | "completed" | string, text: string) => {
  let backgroundColor = '';
  let paddingValue = '';
  
  switch (status) {
    case "upcoming":
      backgroundColor = '#2563eb'; // blue-600
      paddingValue = '0.3125rem 0.75rem';
      break;
    case "ongoing":
      backgroundColor = '#16a34a'; // green-600
      paddingValue = '0.3125rem 0.75rem';
      break;
    case "completed":
      backgroundColor = '#dc2626'; // red-600
      paddingValue = '0.3125rem 0.75rem';
      break;
    default:
      backgroundColor = 'hsl(var(--primary))';
      paddingValue = '0.3125rem 0.75rem';
      break;
  }

  // Разбиваем paddingValue на части
  const paddingParts = paddingValue.split(' ');
  const paddingTopBottom = paddingParts[0];
  const paddingLeftRight = paddingParts[1] || paddingParts[0];

  return (
    <div 
      style={{ 
        backgroundColor: backgroundColor,
        color: 'white',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderTopLeftRadius: 0,
        borderTopRightRadius: '1rem', // Совпадает с rounded-2xl карточки (1rem)
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: '0.875rem', // Скругление левого нижнего угла
        margin: 0,
        padding: paddingValue,
        display: 'inline-block',
        borderLeft: '4px solid var(--primary)',
        borderBottom: '4px solid var(--primary)',
        borderTop: 'none',
        borderRight: 'none',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        lineHeight: '1.5',
        boxSizing: 'border-box'
      }}>
      {text}
    </div>
  );
};

// Magazine Cover Variation 2K2: Corner Notch - Double Cut
export function TournamentCard({ tournament, onViewDetails, index = 0, delay = 0 }: TournamentCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  // Запускаем анимацию с задержкой для каскадного эффекта
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, (delay * 1000) + (index * 100)); // 0.3 секунды (300мс) между карточками

    return () => clearTimeout(timer);
  }, [index, delay]);

  const getStatusBadge = () => {
    switch (tournament.status) {
      case "upcoming":
        return createStatusBadge("upcoming", tournament.status);
      case "ongoing":
        return createStatusBadge("ongoing", "ONGOING");
      case "completed":
        return createStatusBadge("completed", tournament.status);
      default:
        return createStatusBadge("default", tournament.status);
    }
  };

  // Parse date - handle both "date at time" format and plain date format
  const parseDate = (dateString: string) => {
    if (dateString.includes(" at ")) {
      const [date, time] = dateString.split(" at ");
      return { date, time };
    }
    return { date: dateString, time: null };
  };

  const { date: displayDate, time: displayTime } = parseDate(tournament.date);

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50, // Увеличено начальное смещение для более заметного эффекта
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }
  };

  const imageVariants = {
    rest: {
      scale: 1
    },
    hover: {
      scale: 1.1
    }
  };

  const imageTransition = {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
  };

  return (
    <motion.div
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      variants={cardVariants}
      transition={{
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        y: -8,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        transition: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
        }
      }}
      className="group relative overflow-hidden rounded-2xl w-full"
      style={{ 
        height: '520px', 
        minHeight: '520px',
        maxHeight: '520px',
        margin: 0,
        padding: 0,
        border: 'none'
      }}
    >
      <div className="absolute inset-0 w-full h-full">
        {/* Основное изображение - четкое в верхней части */}
        <div 
          className="absolute top-0 left-0 right-0"
          style={{
            height: '55%',
            zIndex: 1,
            overflow: 'hidden'
          }}
        >
          <motion.div
            className="w-full h-full"
            variants={imageVariants}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            transition={imageTransition}
            style={{ overflow: 'hidden' }}
          >
            <ImageWithFallback
              src={tournament.imageUrl}
              alt={tournament.name}
              className="w-full h-full object-cover"
              style={{ 
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block'
              }}
            />
          </motion.div>
        </div>
        {/* Размытое изображение - нижняя часть */}
        <div 
          className="absolute left-0 right-0 bottom-0"
          style={{
            top: '55%',
            height: '45%',
            zIndex: 2,
            overflow: 'hidden'
          }}
        >
          <motion.div
            className="w-full h-full"
            variants={imageVariants}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            transition={imageTransition}
            style={{ overflow: 'hidden' }}
          >
            <ImageWithFallback
              src={tournament.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ 
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                filter: 'blur(20px)',
                display: 'block'
              }}
            />
          </motion.div>
        </div>
        {/* Градиентное затемнение для читаемости текста */}
        <div 
          className="absolute left-0 right-0 bottom-0"
          style={{
            top: '55%',
            height: '45%',
            zIndex: 3,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.58) 35%, rgba(0, 0, 0, 0.42) 60%, rgba(0, 0, 0, 0.28) 80%, rgba(0, 0, 0, 0.14) 92%, rgba(0, 0, 0, 0.05) 98%, transparent 100%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      <div 
        style={{ 
          position: 'absolute',
          top: 0, 
          right: 0,
          margin: 0,
          padding: 0,
          lineHeight: 0,
          fontSize: 0,
          zIndex: 40,
          transform: 'translate(0, 0)'
        }}
      >
        {getStatusBadge()}
      </div>

      <div className="relative h-full flex flex-col justify-end p-6 z-20">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className={cn(typography.tournamentCardBadge, "inline-block bg-red-600 text-white px-3 py-1 rounded")}>
                {tournament.tournamentFormat.split("-")[0]}
              </div>
              <div className={cn(typography.tournamentCardBadge, "inline-block bg-primary text-black px-3 py-1 rounded")}>
                {tournament.participant_count || tournament.current_participants || tournament.participants || 0} Players
              </div>
            </div>
            <h3 className={typography.tournamentCardTitle}>
              {tournament.name}
            </h3>
          </div>

          <div className={cn("grid grid-cols-2 gap-3", typography.tournamentCardInfo)}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="line-clamp-1">{displayDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{displayTime || "TBA"}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="line-clamp-1">{tournament.location}</span>
            </div>
          </div>

          <Button 
            onClick={() => onViewDetails(tournament)}
            className="w-full text-black"
          >
            Register Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Magazine Cover Variation 2K2 for API Tournaments
export function TournamentCardApi({ tournament, onViewDetails, onClick, index = 0, delay = 0, showDate = true }: TournamentCardApiProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  // Запускаем анимацию с задержкой для каскадного эффекта
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, (delay * 1000) + (index * 100)); // 0.3 секунды (300мс) между карточками

    return () => clearTimeout(timer);
  }, [index, delay]);

  const getStatusBadge = () => {
    switch (tournament.status) {
      case "upcoming":
        return createStatusBadge("upcoming", tournament.status);
      case "ongoing":
        return createStatusBadge("ongoing", "ONGOING");
      case "completed":
        return createStatusBadge("completed", tournament.status);
      default:
        return createStatusBadge("default", tournament.status);
    }
  };

  // Format date and time
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString || "TBA";
    }
  };

  // Get tournament image URL
  const getImageUrl = () => {
    if (tournament.image_url && tournament.image_url.trim() !== '' && 
        tournament.image_url !== 'null' && tournament.image_url !== 'undefined') {
      if (tournament.image_url.startsWith('/')) {
        return tournament.image_url;
      }
      if (tournament.image_url.startsWith('http')) {
        return tournament.image_url;
      }
      return tournament.image_url;
    }
    return '';
  };

  const imageUrl = getImageUrl();
  const participants = tournament.participant_count || tournament.current_participants || 0;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onViewDetails) {
      onViewDetails(tournament);
    }
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50, // Увеличено начальное смещение для более заметного эффекта
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }
  };

  const imageVariants = {
    rest: {
      scale: 1
    },
    hover: {
      scale: 1.1
    }
  };

  const imageTransition = {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
  };

  return (
    <motion.div
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      variants={cardVariants}
      transition={{
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        y: -8,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        transition: {
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
        }
      }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer w-full"
      style={{ 
        height: '520px', 
        minHeight: '520px',
        maxHeight: '520px',
        margin: 0,
        padding: 0,
        border: 'none'
      }}
      onClick={handleClick}
    >
      <div className="absolute inset-0 w-full h-full">
        {/* Основное изображение - четкое в верхней части */}
        <div 
          className="absolute top-0 left-0 right-0"
          style={{
            height: '55%',
            zIndex: 1,
            overflow: 'hidden'
          }}
        >
          <motion.div
            className="w-full h-full"
            variants={imageVariants}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            transition={imageTransition}
            style={{ overflow: 'hidden' }}
          >
            <ImageWithFallback
              src={imageUrl}
              alt={tournament.name}
              className="w-full h-full object-cover"
              style={{ 
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block'
              }}
            />
          </motion.div>
        </div>
        {/* Размытое изображение - нижняя часть */}
        <div 
          className="absolute left-0 right-0 bottom-0"
          style={{
            top: '55%',
            height: '45%',
            zIndex: 2,
            overflow: 'hidden'
          }}
        >
          <motion.div
            className="w-full h-full"
            variants={imageVariants}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            transition={imageTransition}
            style={{ overflow: 'hidden' }}
          >
            <ImageWithFallback
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ 
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                filter: 'blur(20px)',
                display: 'block'
              }}
            />
          </motion.div>
        </div>
        {/* Градиентное затемнение для читаемости текста */}
        <div 
          className="absolute left-0 right-0 bottom-0"
          style={{
            top: '55%',
            height: '45%',
            zIndex: 3,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.58) 35%, rgba(0, 0, 0, 0.42) 60%, rgba(0, 0, 0, 0.28) 80%, rgba(0, 0, 0, 0.14) 92%, rgba(0, 0, 0, 0.05) 98%, transparent 100%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          margin: 0,
          padding: 0,
          lineHeight: 0,
          fontSize: 0,
          zIndex: 40,
          transform: 'translate(0, 0)'
        }}
      >
        {getStatusBadge()}
      </div>

      <div 
        className="relative h-full flex flex-col justify-end p-6"
        style={{
          zIndex: 50
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <div className={cn(typography.tournamentCardBadge, "inline-block bg-red-600 text-white px-3 py-1 rounded")}>
                {tournament.format ? tournament.format.split("-")[0] : 'Tournament'}
              </div>
              <div className={cn(typography.tournamentCardBadge, "inline-block bg-primary text-black px-3 py-1 rounded")}>
                {participants} {participants === 1 ? 'Player' : 'Players'}
              </div>
            </div>
            <h3 className={typography.tournamentCardTitle}>
              {tournament.name}
            </h3>
          </div>

          <div className={cn(`grid ${showDate ? 'grid-cols-2' : 'grid-cols-1'} gap-3`, typography.tournamentCardInfo)}>
            {showDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="line-clamp-1">{formatDate(tournament.date)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{formatTime(tournament.time)}</span>
            </div>
            {tournament.location && (
              <div className={`flex items-center gap-2 ${showDate ? 'col-span-2' : ''}`}>
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="line-clamp-1">{tournament.location}</span>
              </div>
            )}
          </div>

          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full text-black"
          >
            {tournament.status === 'upcoming' ? 'Register Now' : tournament.status === 'ongoing' ? 'View Live' : 'View Details'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// Tournament Card for My Tournaments page with management buttons
export interface MyTournamentCardProps {
  tournament: ApiTournament;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onStart?: (id: number) => void;
  onManageResults?: (id: number, format: string) => void;
  onViewResults?: (id: number) => void;
  index?: number;
  delay?: number;
}

export function TournamentCardMyTournaments({ 
  tournament, 
  onEdit, 
  onDelete, 
  onStart,
  onManageResults,
  onViewResults,
  index = 0,
  delay = 0
}: MyTournamentCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, (delay * 1000) + (index * 100));
    return () => clearTimeout(timer);
  }, [index, delay]);

  // Format date and time
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString || "TBA";
    }
  };

  const getImageUrl = () => {
    if (tournament.image_url && tournament.image_url.trim() !== '' && 
        tournament.image_url !== 'null' && tournament.image_url !== 'undefined') {
      // Normalize URL for development/production
      const isDevelopment = import.meta.env.DEV;
      if (isDevelopment && tournament.image_url.startsWith('/uploads')) {
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3003';
        return `${backendUrl}${tournament.image_url}`;
      }
      return tournament.image_url;
    }
    return '';
  };

  const imageUrl = getImageUrl();
  const participants = tournament.participant_count || tournament.current_participants || 0;

  // Status badge helper
  const createStatusBadge = (status: string, text: string) => {
    let backgroundColor = '';
    switch (status) {
      case "upcoming":
        backgroundColor = '#2563eb'; // blue-600
        break;
      case "ongoing":
        backgroundColor = '#16a34a'; // green-600
        break;
      case "completed":
        backgroundColor = '#dc2626'; // red-600
        break;
      default:
        backgroundColor = 'hsl(var(--primary))';
        break;
    }

    return (
      <div 
        style={{ 
          backgroundColor: backgroundColor,
          color: 'white',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderTopLeftRadius: 0,
          borderTopRightRadius: '1rem',
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: '0.75rem',
          margin: 0,
          padding: status === 'ongoing' ? '0.375rem 1rem' : '0.25rem 0.75rem',
          display: 'inline-block',
          borderLeft: '4px solid var(--primary)',
          borderBottom: '4px solid var(--primary)',
          borderTop: 'none',
          borderRight: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          lineHeight: '1.5',
          boxSizing: 'border-box'
        }}>
        {text}
      </div>
    );
  };

  const getStatusBadge = () => {
    switch (tournament.status) {
      case "upcoming":
        return createStatusBadge("upcoming", tournament.status);
      case "ongoing":
        return createStatusBadge("ongoing", "ONGOING");
      case "completed":
        return createStatusBadge("completed", tournament.status);
      default:
        return createStatusBadge("default", tournament.status);
    }
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }
  };

  const imageVariants = {
    rest: {
      scale: 1
    },
    hover: {
      scale: 1.1
    }
  };

  const imageTransition = {
    duration: 0.3,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
  };

  return (
    <motion.div
        initial="hidden"
        animate={shouldAnimate ? "visible" : "hidden"}
        variants={cardVariants}
        transition={{
          duration: 0.25,
          ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ 
          y: -8,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
          }
        }}
        className="group relative overflow-hidden rounded-2xl w-full"
        style={{ 
          height: '520px', 
          minHeight: '520px',
          maxHeight: '520px',
          margin: 0,
          padding: 0,
          border: 'none'
        }}
      >
      <div className="absolute inset-0 w-full h-full">
        {/* Main image - sharp top part */}
        <div 
          className="absolute top-0 left-0 right-0"
          style={{
            height: '55%',
            zIndex: 1,
            overflow: 'hidden'
          }}
        >
          <motion.div
            className="w-full h-full"
            variants={imageVariants}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            transition={imageTransition}
            style={{ overflow: 'hidden' }}
          >
            <ImageWithFallback
              src={imageUrl}
              alt={tournament.name}
              className="w-full h-full object-cover"
              style={{ 
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block'
              }}
            />
          </motion.div>
        </div>
        {/* Blurred image - bottom part */}
        <div 
          className="absolute left-0 right-0 bottom-0"
          style={{
            top: '55%',
            height: '45%',
            zIndex: 2,
            overflow: 'hidden'
          }}
        >
          <motion.div
            className="w-full h-full"
            variants={imageVariants}
            initial="rest"
            animate={isHovered ? "hover" : "rest"}
            transition={imageTransition}
            style={{ overflow: 'hidden' }}
          >
            <ImageWithFallback
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ 
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                filter: 'blur(20px)',
                display: 'block'
              }}
            />
          </motion.div>
        </div>
        {/* Gradient overlay for text readability */}
        <div 
          className="absolute left-0 right-0 bottom-0"
          style={{
            top: '55%',
            height: '45%',
            zIndex: 3,
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.58) 35%, rgba(0, 0, 0, 0.42) 60%, rgba(0, 0, 0, 0.28) 80%, rgba(0, 0, 0, 0.14) 92%, rgba(0, 0, 0, 0.05) 98%, transparent 100%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Status Badge */}
      <div 
        style={{ 
          position: 'absolute',
          top: 0,
          right: 0,
          margin: 0,
          padding: 0,
          lineHeight: 0,
          fontSize: 0,
          zIndex: 40,
          transform: 'translate(0, 0)'
        }}
      >
        {getStatusBadge()}
      </div>

      {/* Content */}
      <div 
        className="relative h-full flex flex-col justify-end p-6"
        style={{
          zIndex: 50
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <div className={cn(typography.tournamentCardBadge, "inline-block bg-red-600 text-white px-3 py-1 rounded")}>
                {tournament.format ? tournament.format.split("-")[0] : 'Tournament'}
              </div>
              <div className={cn(typography.tournamentCardBadge, "inline-block bg-primary text-black px-3 py-1 rounded")}>
                {participants} {participants === 1 ? 'Player' : 'Players'}
              </div>
            </div>
            <h3 className={typography.tournamentCardTitle}>
              {tournament.name}
            </h3>
          </div>

          <div className={cn("grid grid-cols-2 gap-3", typography.tournamentCardInfo)}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="line-clamp-1">{formatDate(tournament.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{formatTime(tournament.time)}</span>
            </div>
            {tournament.location && (
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="line-clamp-1">{tournament.location}</span>
              </div>
            )}
          </div>

          {/* Management Buttons */}
          <div className="space-y-2 pt-2">
            {tournament.status === 'upcoming' && (
              <div className="flex gap-2">
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(tournament.id);
                  }}
                  variant="outline"
                  size="sm"
                  className="my-tournament-edit-btn flex-1 bg-white/10 dark:bg-white/10 text-white border-white/50 transition-all duration-200"
                >
                  <Edit className="w-4 h-4 mr-2 text-white transition-colors duration-200" />
                  Edit
                </Button>
                {onStart && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onStart(tournament.id);
                    }}
                    size="sm"
                    className="flex-1 bg-primary text-black hover:bg-primary/90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                )}
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(tournament.id, tournament.name);
                  }}
                  variant="outline"
                  size="sm"
                  className="my-tournament-delete-btn bg-white/10 dark:bg-white/10 text-white border-white/50 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 text-white transition-colors duration-200" />
                </Button>
              </div>
            )}
            {tournament.status === 'ongoing' && (
              <div className="flex gap-2">
                {onManageResults && (
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onManageResults(tournament.id, tournament.format);
                    }}
                    size="sm"
                    className="flex-1 bg-primary text-black hover:bg-primary/90"
                  >
                    Manage Results
                  </Button>
                )}
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(tournament.id, tournament.name);
                  }}
                  variant="outline"
                  size="sm"
                  className="my-tournament-delete-btn bg-white/10 dark:bg-white/10 text-white border-white/50 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4 text-white transition-colors duration-200" />
                </Button>
              </div>
            )}
            {tournament.status === 'completed' && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewResults) {
                      onViewResults(tournament.id);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="my-tournament-edit-btn w-full bg-white/10 dark:bg-white/10 text-white border-white/50 transition-all duration-200"
                >
                  <Eye className="w-4 h-4 mr-2 text-white transition-colors duration-200" />
                  View Results
                </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
