import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Achievement } from "../../../types/achievements";

interface AchievementUnlockNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementUnlockNotification({ 
  achievement, 
  onClose 
}: AchievementUnlockNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!achievement) return null;

  const getRarityColor = (rarity: Achievement["rarity"]): {
    border: string;
    bg: string;
    glow: string;
    text: string;
  } => {
    switch (rarity) {
      case "common":
        return {
          border: "border-gray-400",
          bg: "bg-gray-500/20",
          glow: "shadow-gray-400/50",
          text: "text-gray-300"
        };
      case "rare":
        return {
          border: "border-blue-400",
          bg: "bg-blue-500/20",
          glow: "shadow-blue-400/50",
          text: "text-blue-300"
        };
      case "epic":
        return {
          border: "border-purple-400",
          bg: "bg-purple-500/20",
          glow: "shadow-purple-400/50",
          text: "text-purple-300"
        };
      case "legendary":
        return {
          border: "border-yellow-400",
          bg: "bg-yellow-500/20",
          glow: "shadow-yellow-400/50",
          text: "text-yellow-300"
        };
      case "mythic":
        return {
          border: "border-pink-400",
          bg: "bg-pink-500/20",
          glow: "shadow-pink-400/50",
          text: "text-pink-300"
        };
      default:
        return {
          border: "border-gray-400",
          bg: "bg-gray-500/20",
          glow: "shadow-gray-400/50",
          text: "text-gray-300"
        };
    }
  };

  const colors = getRarityColor(achievement.rarity);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.5 }}
          transition={{ 
            type: "spring", 
            stiffness: 260,
            damping: 20 
          }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
        >
          <motion.div
            className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} backdrop-blur-xl p-6 shadow-2xl ${colors.glow}`}
            animate={{
              boxShadow: [
                `0 0 20px ${colors.glow}`,
                `0 0 40px ${colors.glow}`,
                `0 0 20px ${colors.glow}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{
                    x: Math.random() * 100 + "%",
                    y: Math.random() * 100 + "%",
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{
                    x: [
                      Math.random() * 100 + "%",
                      Math.random() * 100 + "%",
                    ],
                    y: [
                      Math.random() * 100 + "%",
                      Math.random() * 100 + "%",
                    ],
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              ))}
            </div>

            <div className="flex items-start gap-4 relative z-10">
              {/* Achievement icon with animation */}
              <motion.div
                className={`flex-shrink-0 w-20 h-20 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center text-4xl relative`}
                animate={{
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1],
                }}
                transition={{
                  duration: 0.6,
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                }}
              >
                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 rounded-xl ${colors.bg} blur-xl`}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
                <span className="relative z-10">{achievement.icon}</span>
              </motion.div>

              {/* Achievement details */}
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-white/80 uppercase tracking-wider">
                      Achievement Unlocked!
                    </p>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  </div>
                  
                  <h3 className="text-white mb-1 line-clamp-1">
                    {achievement.name}
                  </h3>
                  
                  <p className="text-sm text-white/70 line-clamp-2 mb-2">
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.border} ${colors.bg} ${colors.text} uppercase tracking-wide`}>
                      {achievement.rarity}
                    </span>
                    {achievement.category && (
                      <span className="text-xs text-white/50">
                        {achievement.category}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Progress bar animation */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden"
            >
              <motion.div
                className={`h-full ${colors.bg} ${colors.border} border-t`}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 5, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
