import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tournament } from "./TournamentCard";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "../common/image/ImageWithFallback";
import { TournamentBracketModal } from "./modals/TournamentBracketModal";
import Aurora from "../common/backgrounds/Aurora";
import { HeroBadge } from "../common/home/hero/HeroBadge";
import { typography } from "@/utils/typography";
import { cn } from "../ui/utils";

interface TournamentDetailsPageProps {
  tournament: Tournament;
  onBack: () => void;
  onRegister: () => void;
  onViewResults?: () => void;
}

// Helper functions
const getCompetitionTypeDescription = (format: string): string => {
  const descriptions: Record<string, string> = {
    "single-elimination": "Direct knockout format where players are eliminated after a single loss. Winners advance through brackets until a champion is crowned.",
    "round-robin": "Every player competes against all other participants. Final rankings are determined by total wins and point differential.",
    "group-stage": "Initial group stage followed by knockout playoffs. Top performers from each group advance to the elimination rounds.",
  };
  return descriptions[format] || descriptions["single-elimination"];
};

const getMatchFormatDescription = (matchFormat: string): string => {
  const normalized = matchFormat?.toLowerCase() || "";
  const isBestOf1 = normalized.includes("1") || normalized === "best of 1" || normalized === "best-of-1";
  const isBestOf3 = normalized.includes("3") || normalized === "best of 3" || normalized === "best-of-3";
  
  if (isBestOf1) {
    return "Single game to 11 points. Quick matches ideal for large tournaments with many participants.";
  } else if (isBestOf3) {
    return "First to win 2 games. Balanced format providing fair competition while maintaining reasonable match duration.";
  } else {
    return "First to win 3 games. Full professional format allowing players to demonstrate consistency and adaptability.";
  }
};

const getCompetitionTypeName = (format: string): string => {
  const names: Record<string, string> = {
    "single-elimination": "Single Elimination",
    "round-robin": "Round Robin",
    "group-stage": "Group Stage + Playoffs",
  };
  return names[format] || names["single-elimination"];
};

const formatMatchFormat = (matchFormat?: string): string => {
  if (!matchFormat) return "BEST OF 5";
  const normalized = matchFormat.toLowerCase();
  if (normalized.includes('best-of-') || normalized.includes('best_of_')) {
    const number = normalized.replace('best-of-', '').replace('best_of_', '').replace('-', '');
    return `BEST OF ${number.toUpperCase()}`;
  }
  return matchFormat.toUpperCase();
};

// Compact Hero - Photo right, main info left, details below
export function TournamentDetailsPage({ 
  tournament, 
  onBack, 
  onRegister, 
  onViewResults 
}: TournamentDetailsPageProps) {
  const [showBracket, setShowBracket] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [badgesAnimated, setBadgesAnimated] = useState<Set<number>>(new Set());
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  // Bracket button removed - only show action buttons based on status
  
  // Определяем тему для Aurora
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true; // Default для SSR
  });

  const CONTAINER_HEIGHT = 600;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Отслеживание изменений темы
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = !document.documentElement.classList.contains('light');
      setIsDark(isDarkMode);
    };
    
    checkTheme();
    
    // Создаем MutationObserver для отслеживания изменений класса на documentElement
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Track window size for responsive grid and container width
  useEffect(() => {
    const checkSize = () => {
      setIsDesktop(window.innerWidth >= 768);
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    
    // Also check after a short delay to ensure container is rendered
    const timeoutId = setTimeout(checkSize, 100);
    
    return () => {
      window.removeEventListener('resize', checkSize);
      clearTimeout(timeoutId);
    };
  }, [tournament.imageUrl]); // Re-check when image URL changes

  // Handle image load to get actual dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  };

  // Calculate layout based on image dimensions and container
  const getImageLayout = () => {
    // Always use blur blocks on top and bottom for consistent design
    // Default layout: 10% top blur, 55% sharp middle, 35% bottom blur
    const TOP_BLUR_PERCENT = 0.10; // 10% of container height
    const SHARP_PERCENT = 0.55; // 55% of container height
    const BOTTOM_BLUR_PERCENT = 0.35; // 35% of container height

    if (!imageDimensions || !containerWidth || containerWidth === 0) {
      return {
        topBlurHeight: CONTAINER_HEIGHT * TOP_BLUR_PERCENT,
        sharpHeight: CONTAINER_HEIGHT * SHARP_PERCENT,
        bottomBlurHeight: CONTAINER_HEIGHT * BOTTOM_BLUR_PERCENT,
        useObjectFit: 'cover' as const,
      };
    }

    // Calculate what height the image will have when fitted to container width
    // Aspect ratio: imageHeight / imageWidth
    const aspectRatio = imageDimensions.height / imageDimensions.width;
    const fittedHeight = containerWidth * aspectRatio;

    // If fitted height is less than container height, image needs blur blocks
    // Use proportional blur blocks to fill the space
    if (fittedHeight < CONTAINER_HEIGHT) {
      const diff = CONTAINER_HEIGHT - fittedHeight;
      const blurHeight = diff / 2;

      return {
        topBlurHeight: blurHeight,
        sharpHeight: fittedHeight,
        bottomBlurHeight: blurHeight,
        useObjectFit: 'contain' as const,
      };
    }

    // Image is tall enough (height >= width), use default layout with cover
    // Always show blur blocks on top and bottom
    return {
      topBlurHeight: CONTAINER_HEIGHT * TOP_BLUR_PERCENT,
      sharpHeight: CONTAINER_HEIGHT * SHARP_PERCENT,
      bottomBlurHeight: CONTAINER_HEIGHT * BOTTOM_BLUR_PERCENT,
      useObjectFit: 'cover' as const,
    };
  };

  const layout = getImageLayout();

  const getStatusBadge = () => {
    const baseStyle = {
      color: 'white',
      padding: '0.3125rem 0.75rem',
      fontSize: '0.75rem', // text-xs
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      display: 'inline-block',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    };
    
    switch (tournament.status) {
      case "upcoming":
        return (
          <motion.div 
            className="bg-blue-600"
            style={{
              ...baseStyle,
              padding: '0.4375rem 1rem',
              fontSize: '0.875rem',
              borderTopLeftRadius: '0',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
              borderBottomLeftRadius: '1rem',
              borderLeft: '4px solid #fbbf24',
              borderBottom: '4px solid #fbbf24',
              borderTop: 'none',
              borderRight: 'none',
              boxSizing: 'border-box',
              fontWeight: 'bold',
              lineHeight: '20px',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            Upcoming
          </motion.div>
        );
      case "ongoing":
        return (
          <motion.div 
            className="bg-green-600"
            style={{
              ...baseStyle,
              padding: '0.4375rem 1rem',
              fontSize: '0.875rem',
              borderTopLeftRadius: '0',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
              borderBottomLeftRadius: '1rem',
              borderLeft: '4px solid #FACC15',
              borderBottom: '4px solid #FACC15',
              borderTop: 'none',
              borderRight: 'none',
              fontWeight: 'bold',
              lineHeight: '20px',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            ONGOING
          </motion.div>
        );
      case "completed":
        return (
          <motion.div 
            className="bg-red-600"
            style={{
              ...baseStyle,
              padding: '0.4375rem 1rem',
              fontSize: '0.875rem',
              borderTopLeftRadius: '0',
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0',
              borderBottomLeftRadius: '1rem',
              borderLeft: '4px solid #fbbf24',
              borderBottom: '4px solid #fbbf24',
              borderTop: 'none',
              borderRight: 'none',
              boxSizing: 'border-box',
              fontWeight: 'bold',
              lineHeight: '20px',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            Completed
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (dateString.includes(" at ")) {
      const datePart = dateString.split(" at ")[0];
      try {
        return new Date(datePart).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch {
        return datePart;
      }
    }
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    if (dateString.includes(" at ")) {
      const timePart = dateString.split(" at ")[1];
      if (timePart) {
        try {
          if (timePart.includes(':')) {
            const [hours, minutes] = timePart.split(':');
            const date = new Date(`2000-01-01T${hours}:${minutes}`);
            return date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          }
          return timePart;
        } catch {
          return timePart;
        }
      }
      return "TBA";
    }
    return "TBA";
  };

  const matchFormatDisplay = formatMatchFormat(tournament.matchFormat);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Aurora 
          key={`aurora-${isDark ? 'dark' : 'light'}`}
          isDarkTheme={isDark}
          amplitude={1.5}
          blend={0.8}
          speed={0.6}
        />
      </div>
      
      {/* Header */}
      <motion.div 
        className="border-b border-border/40 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="hover:underline -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </motion.div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-8 py-16 relative z-10" style={{ overflowX: 'hidden' }}>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1.4fr 1fr' : '1fr',
            gap: '48px',
            alignItems: 'start',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Main Info - 7 columns (58.33%) */}
          <motion.div 
            className="space-y-8"
            style={{
              width: '100%',
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badges */}
            <div className="flex gap-3 flex-wrap mb-4">
              {[
                { 
                  text: tournament.tournamentFormat.split("-")[0].toUpperCase(), 
                  bg: "bg-red-600",
                  textColor: "text-white"
                },
                { 
                  text: `${tournament.participants} PLAYERS`, 
                  bg: "bg-primary",
                  textColor: "text-black"
                },
                { 
                  text: (tournament.matchFormat || "BEST OF 5").toUpperCase().replace(/-/g, ' '), 
                  bg: "bg-blue-600",
                  textColor: "text-white"
                }
              ].map((badge, index) => (
                <HeroBadge
                  key={index}
                  text={badge.text}
                  index={index}
                  bgColor={badge.bg}
                  textColor={badge.textColor}
                />
              ))}
            </div>

            {/* Title */}
            <div>
              <h1 
                style={{
                  fontSize: '3.75rem', // text-6xl (60px)
                  lineHeight: '57px', // 57px (0.95 от 60px)
                  fontWeight: 500,
                  letterSpacing: '-0.025em', // tracking-tight
                  marginBottom: '1.5rem'
                }}
              >
                {tournament.name}
              </h1>
              <motion.div 
                className="h-1.5 rounded-full"
                style={{
                  background: 'linear-gradient(to right, var(--primary) 0%, rgb(59, 130, 246) 33%, rgb(239, 68, 68) 66%, rgb(220, 38, 38) 100%)'
                }}
                initial={{ width: 0 }}
                animate={{ width: '160px' }}
                transition={{ delay: 0.5, duration: 0.6 }}
              />
            </div>

            {/* Description */}
            <p 
              className={cn(typography.tournamentDetailDescription, "mt-6")}
              style={typography.tournamentDetailDescriptionStyle}
            >
              {tournament.description}
            </p>

            {/* Info Grid */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px 40px', // gap-y-5 (20px) gap-x-10 (40px)
                marginTop: '2rem'
              }}
            >
              <div>
                <p 
                  className={cn(typography.tournamentDetailLabel, "mb-2")}
                  style={typography.tournamentDetailLabelStyle}
                >
                  Date
                </p>
                <p 
                  className={typography.tournamentDetailValue}
                  style={typography.tournamentDetailValueStyle}
                >
                  {formatDate(tournament.date)}
                </p>
              </div>
              <div>
                <p 
                  className={cn(typography.tournamentDetailLabel, "mb-2")}
                  style={typography.tournamentDetailLabelStyle}
                >
                  Time
                </p>
                <p 
                  className={typography.tournamentDetailValue}
                  style={typography.tournamentDetailValueStyle}
                >
                  {formatTime(tournament.date)}
                </p>
              </div>
              <div>
                <p 
                  className={cn(typography.tournamentDetailLabel, "mb-2")}
                  style={typography.tournamentDetailLabelStyle}
                >
                  Location
                </p>
                <p 
                  className={typography.tournamentDetailValue}
                  style={typography.tournamentDetailValueStyle}
                >
                  {tournament.location}
                </p>
              </div>
              <div>
                <p 
                  className={cn(typography.tournamentDetailLabel, "mb-2")}
                  style={typography.tournamentDetailLabelStyle}
                >
                  Players
                </p>
                <p 
                  className={typography.tournamentDetailValue}
                  style={typography.tournamentDetailValueStyle}
                >
                  {tournament.participants} / {tournament.maxParticipants}
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6 mt-8 flex flex-wrap gap-4">
              {tournament.status === "upcoming" && (
                <Button 
                  onClick={onRegister}
                  className="bg-gradient-to-r from-primary to-primary/80 text-black hover:from-primary/75 hover:to-primary/55 h-14 text-lg shadow-xl hover:shadow-2xl"
                  style={{
                    paddingLeft: '2.5rem', // 40px
                    paddingRight: '2.5rem', // 40px
                  }}
                >
                  Register Now
                </Button>
              )}
              {(tournament.status === "ongoing" || tournament.status === "live") && onViewResults && (
                <Button 
                  onClick={onViewResults}
                  className="bg-gradient-to-r from-primary to-primary/80 text-black hover:from-primary/75 hover:to-primary/55 h-14 text-lg shadow-xl hover:shadow-2xl"
                  style={{
                    paddingLeft: '2.5rem', // 40px
                    paddingRight: '2.5rem', // 40px
                  }}
                >
                  View Live
                </Button>
              )}
              {tournament.status === "completed" && onViewResults && (
                <Button 
                  onClick={onViewResults}
                  className="bg-gradient-to-r from-primary to-primary/80 text-black hover:from-primary/75 hover:to-primary/55 h-14 text-lg shadow-xl hover:shadow-2xl"
                  style={{
                    paddingLeft: '2.5rem', // 40px
                    paddingRight: '2.5rem', // 40px
                  }}
                >
                  Results
                </Button>
              )}
            </div>
          </motion.div>

          {/* Right: Image - 5 columns (41.67%) */}
          <motion.div 
            style={{
              width: '100%',
              maxWidth: '100%',
              position: isDesktop ? 'sticky' : 'relative',
              top: isDesktop ? '32px' : 'auto',
              boxSizing: 'border-box',
            }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              ref={imageContainerRef}
              className="relative w-full rounded-3xl shadow-2xl overflow-hidden bg-muted"
              style={{ 
                height: `${CONTAINER_HEIGHT}px`, 
                minHeight: `${CONTAINER_HEIGHT}px`, 
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Background Image - Full Container (for sharp middle section) */}
              <div 
                className="absolute inset-0 z-10"
                style={{
                  overflow: 'hidden',
                  width: '100%',
                  height: '100%'
                }}
              >
                <motion.div
                  animate={{ scale: isHovered ? 1.15 : 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                  style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <ImageWithFallback
                    src={tournament.imageUrl || ""}
                    alt={tournament.name}
                    className="w-full h-full"
                    style={{ 
                      objectFit: layout.useObjectFit,
                      objectPosition: 'center',
                      width: '100%',
                      height: '100%'
                    }}
                    data-tournament-id={tournament.id}
                    onLoad={handleImageLoad}
                  />
                </motion.div>
              </div>

              {/* Top Blur Block - always visible, overlays on top */}
              <div 
                className="absolute top-0 left-0 right-0 z-20"
                style={{
                  height: `${layout.topBlurHeight}px`,
                  overflow: 'hidden',
                  width: '100%'
                }}
              >
                <motion.div
                  animate={{ scale: isHovered ? 1.15 : 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                  style={{ 
                    filter: 'blur(20px)',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <ImageWithFallback
                    src={tournament.imageUrl || ""}
                    alt=""
                    className="w-full h-full"
                    style={{ objectFit: 'cover', objectPosition: 'top', width: '100%', height: '100%' }}
                    data-tournament-id={tournament.id}
                  />
                </motion.div>
              </div>

              {/* Gradient Overlay on Top Blur */}
              <div 
                className="absolute top-0 left-0 right-0 z-30"
                style={{
                  height: `${layout.topBlurHeight}px`,
                  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.58) 35%, rgba(0, 0, 0, 0.42) 60%, rgba(0, 0, 0, 0.28) 80%, rgba(0, 0, 0, 0.14) 92%, rgba(0, 0, 0, 0.05) 98%, transparent 100%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Bottom Blur Block - overlays on bottom */}
              <div 
                className="absolute bottom-0 left-0 right-0 z-20"
                style={{
                  height: `${layout.bottomBlurHeight}px`,
                  overflow: 'hidden',
                  width: '100%'
                }}
              >
                <motion.div
                  animate={{ scale: isHovered ? 1.15 : 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                  style={{ 
                    filter: 'blur(20px)',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <ImageWithFallback
                    src={tournament.imageUrl || ""}
                    alt=""
                    className="w-full h-full"
                    style={{ objectFit: 'cover', objectPosition: 'bottom', width: '100%', height: '100%' }}
                    data-tournament-id={tournament.id}
                  />
                </motion.div>
              </div>

              {/* Gradient Overlay on Bottom Blur */}
              <div 
                className="absolute bottom-0 left-0 right-0 z-30"
                style={{
                  height: `${layout.bottomBlurHeight}px`,
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.58) 35%, rgba(0, 0, 0, 0.42) 60%, rgba(0, 0, 0, 0.28) 80%, rgba(0, 0, 0, 0.14) 92%, rgba(0, 0, 0, 0.05) 98%, transparent 100%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Corner Notch Badge */}
              <div className="absolute top-0 right-0 z-50">
                {getStatusBadge()}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Details Section - Two Column */}
      <div className="border-t border-border/40 relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr',
              gap: isDesktop ? '0 80px' : '48px 0', // gap-x-20 на desktop, gap-y-12 на mobile
              alignItems: 'start',
            }}
          >
            {/* Column 1 */}
            <div className="space-y-8">
              <div>
                <p 
                  className={cn(typography.tournamentDetailSectionTitle, "mb-6 pb-2 border-b border-border/40")}
                  style={typography.tournamentDetailSectionTitleStyle}
                >
                  Tournament Format
                </p>
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px', // space-y-5 (20px)
                  }}
                >
                  <div>
                    <p 
                      className={cn(typography.tournamentDetailSubLabel, "mb-2")}
                      style={typography.tournamentDetailSubLabelStyle}
                    >
                      Competition Type
                    </p>
                    <p 
                      className={cn(typography.tournamentDetailSubValue, "mb-2")}
                      style={typography.tournamentDetailSubValueStyle}
                    >
                      {getCompetitionTypeName(tournament.tournamentFormat)}
                    </p>
                    <p 
                      className={typography.tournamentDetailDescriptionText}
                      style={typography.tournamentDetailDescriptionTextStyle}
                    >
                      {getCompetitionTypeDescription(tournament.tournamentFormat)}
                    </p>
                  </div>
                  <div>
                    <p 
                      className={cn(typography.tournamentDetailSubLabel, "mb-2")}
                      style={typography.tournamentDetailSubLabelStyle}
                    >
                      Match Format
                    </p>
                    <p 
                      className={cn(typography.tournamentDetailSubValue, "mb-2")}
                      style={typography.tournamentDetailSubValueStyle}
                    >
                      {matchFormatDisplay}
                    </p>
                    <p 
                      className={typography.tournamentDetailDescriptionText}
                      style={typography.tournamentDetailDescriptionTextStyle}
                    >
                      {getMatchFormatDescription(tournament.matchFormat || "Best of 5")}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <p 
                  className={cn(typography.tournamentDetailSectionTitle, "mb-6 pb-2 border-b border-border/40")}
                  style={typography.tournamentDetailSectionTitleStyle}
                >
                  Organizer
                </p>
                <div>
                  <button 
                    className={cn(typography.tournamentDetailOrganizerName, "hover:text-primary transition-colors hover:underline")}
                    style={typography.tournamentDetailOrganizerNameStyle}
                  >
                    {tournament.organizerName || tournament.organizerUsername || "Tournament Organizer"}
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-8">
              <div>
                <p 
                  className={cn(typography.tournamentDetailSectionTitle, "mb-6 pb-2 border-b border-border/40")}
                  style={typography.tournamentDetailSectionTitleStyle}
                >
                  Rules & Guidelines
                </p>
                <ul 
                  className={cn(typography.tournamentDetailRulesList, "space-y-2")}
                  style={typography.tournamentDetailRulesListStyle}
                >
                  <li>Official ITTF regulations apply</li>
                  <li>Games played to 11 points, win by 2</li>
                  <li>Players must arrive 30 minutes early</li>
                  <li>Fair play and sportsmanship expected</li>
                </ul>
              </div>
              <div>
                <p 
                  className={cn(typography.tournamentDetailSectionTitle, "mb-6 pb-2 border-b border-border/40")}
                  style={typography.tournamentDetailSectionTitleStyle}
                >
                  Certificate
                </p>
                <div>
                  <p 
                    className={cn(typography.tournamentDetailSubValue, "mb-2")}
                    style={typography.tournamentDetailSubValueStyle}
                  >
                    PDF Certificate Available
                  </p>
                  <p 
                    className={typography.tournamentDetailDescriptionText}
                    style={typography.tournamentDetailDescriptionTextStyle}
                  >
                    All participants will receive a digital certificate of participation after the tournament concludes. Winners and top performers will receive special recognition certificates with their final placement and achievement details. Certificates can be downloaded from your profile page within 24 hours of tournament completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBracket && (
        <TournamentBracketModal
          open={showBracket}
          onOpenChange={setShowBracket}
          tournamentName={tournament.name}
          format={tournament.tournamentFormat}
        />
      )}
    </div>
  );
}
