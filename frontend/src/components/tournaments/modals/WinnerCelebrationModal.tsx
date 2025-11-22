import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trophy, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageWithFallback } from "@/components/common/image/ImageWithFallback";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface WinnerCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winnerName: string;
  tournamentName: string;
  tournamentImageUrl?: string;
  winnerAvatarUrl?: string;
}

export function WinnerCelebrationModal({
  open,
  onOpenChange,
  winnerName,
  tournamentName,
  tournamentImageUrl,
  winnerAvatarUrl,
}: WinnerCelebrationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      // Останавливаем конфетти через 3 секунды
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Функция для создания бейджа победителя в стиле карточки турнира
  const createWinnerBadge = () => {
    return (
      <div 
        style={{ 
          backgroundColor: '#dc2626', // red-600
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
          padding: '0.375rem 1rem',
          display: 'inline-block',
          borderLeft: '4px solid var(--primary)',
          borderBottom: '4px solid var(--primary)',
          borderTop: 'none',
          borderRight: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          lineHeight: '1.5',
          boxSizing: 'border-box'
        }}>
        WINNER
      </div>
    );
  };

  // Используем изображение турнира или градиент
  const backgroundImage = tournamentImageUrl || '';
  const hasImage = backgroundImage && backgroundImage.trim() !== '' && 
                   backgroundImage !== 'null' && backgroundImage !== 'undefined';

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

  // Анимация в стиле карточки турнира (без поднятия)
  const cardVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      scale: 1,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    }
  };

  const cardTransition = {
    duration: 0.25,
    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-transparent shadow-none">
        {/* Confetti эффект */}
        <AnimatePresence>
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-[100]">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: "-10px",
                    backgroundColor: [
                      "#FFD700",
                      "#FF6B6B",
                      "#4ECDC4",
                      "#45B7D1",
                      "#FFA07A",
                      "#98D8C8",
                    ][Math.floor(Math.random() * 6)],
                  }}
                  initial={{ y: -10, opacity: 1, rotate: 0 }}
                  animate={{
                    y: window.innerHeight + 100,
                    opacity: [1, 1, 0],
                    rotate: 360,
                    x: (Math.random() - 0.5) * 200,
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Основной контент в стиле карточки турнира */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={cardTransition}
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
            {hasImage ? (
              <>
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
                      src={backgroundImage}
                      alt={tournamentName}
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
                      src={backgroundImage}
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
              </>
            ) : (
              <>
                {/* Градиентный фон - верхняя часть */}
                <div 
                  className="absolute top-0 left-0 right-0"
                  style={{
                    height: '55%',
                    zIndex: 1,
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #dc2626 100%)',
                    overflow: 'hidden'
                  }}
                />
                {/* Градиентный фон - нижняя часть (размытый эффект) */}
                <div 
                  className="absolute left-0 right-0 bottom-0"
                  style={{
                    top: '55%',
                    height: '45%',
                    zIndex: 2,
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #dc2626 100%)',
                    filter: 'blur(20px)',
                    opacity: 0.8,
                    overflow: 'hidden'
                  }}
                />
              </>
            )}
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

          {/* Бейдж WINNER в правом верхнем углу */}
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
            {createWinnerBadge()}
          </div>

          {/* Контент внизу в стиле карточки турнира */}
          <div 
            className="relative h-full flex flex-col justify-end p-6"
            style={{
              zIndex: 50
            }}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                {/* Бейджи */}
                <div className="flex gap-2">
                  <div className="inline-block bg-red-600 text-white px-3 py-1 text-xs uppercase tracking-wider rounded">
                    Winner
                  </div>
                  <div className="inline-block bg-primary text-black px-3 py-1 text-xs uppercase tracking-wider rounded">
                    🏆 Champion
                  </div>
                </div>
                
                {/* Аватар и имя победителя */}
                <div className="flex items-center gap-4">
                  {/* Аватар победителя с градиентной рамкой */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      ...cardTransition,
                      delay: 0.1,
                    }}
                    className="relative group flex-shrink-0"
                  >
                    {/* Размытый эффект */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-500 to-purple-500 dark:from-primary dark:via-blue-500 dark:to-purple-500 rounded-full blur-lg opacity-50 animate-pulse" />
                    {/* Градиентная рамка */}
                    <div className="relative p-1 bg-gradient-to-br from-primary via-blue-500 to-purple-500 dark:from-primary dark:via-blue-500 dark:to-purple-500 rounded-full">
                      <div className="bg-white rounded-full overflow-hidden dark:hidden">
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                          {winnerAvatarUrl ? (
                            <AvatarImage src={winnerAvatarUrl} alt={winnerName} className="scale-110" />
                          ) : null}
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-blue-500/20">
                            {winnerName.split(' ').map(n => n[0]).join('') || 'W'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="rounded-full overflow-hidden hidden dark:block">
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                          {winnerAvatarUrl ? (
                            <AvatarImage src={winnerAvatarUrl} alt={winnerName} className="scale-110" />
                          ) : null}
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-blue-500/20">
                            {winnerName.split(' ').map(n => n[0]).join('') || 'W'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Имя победителя */}
                  <div className="flex-1 min-w-0">
                    <motion.h3
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        ...cardTransition,
                        delay: 0.15,
                      }}
                      className="text-white text-2xl sm:text-3xl line-clamp-2 font-bold"
                    >
                      {winnerName}
                    </motion.h3>
                  </div>
                </div>
              </div>

              {/* Информация о турнире */}
              <div className="space-y-2 text-sm text-white">
                <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">
                  Winner of {tournamentName}
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="line-clamp-1 font-medium">{tournamentName}</span>
                </div>
                <div className="text-xs text-white/60 italic">
                  Here is the champion! 🏆
                </div>
              </div>

              {/* Кнопка закрытия */}
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  ...cardTransition,
                  delay: 0.15,
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: {
                    duration: 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
                  }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenChange(false)}
                className="w-full bg-primary text-black hover:bg-primary/90 transition-colors font-semibold py-3 rounded-lg"
              >
                Close
              </motion.button>
            </div>
          </div>

          {/* Блестящие частицы для эффекта */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 30 }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

