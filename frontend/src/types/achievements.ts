// All achievement types and data in one place
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  progress?: number;
  maxProgress?: number;
  unlocked: boolean;
  unlockedDate?: string;
  category?: string;
  effect?: string;
}

export const achievementCategories = {
  tournaments: "Tournaments",
  matches: "Matches",
  skills: "Skills",
  special: "Special",
  social: "Social",
  milestones: "Milestones"
};

// All achievements data
export const allAchievements: Achievement[] = [
  // Tournament Achievements
  {
    id: "first-tournament",
    name: "First Steps",
    description: "Participate in your first tournament",
    icon: "🎯",
    rarity: "common",
    unlocked: true,
    unlockedDate: "2024-03-15",
    category: "tournaments",
    effect: "glow"
  },
  {
    id: "tournament-winner",
    name: "Champion",
    description: "Win your first tournament",
    icon: "🏆",
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-04-20",
    category: "tournaments",
    effect: "bounce"
  },
  {
    id: "5-tournaments",
    name: "Tournament Veteran",
    description: "Complete 5 tournaments",
    icon: "⭐",
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-05-10",
    category: "tournaments",
    progress: 5,
    maxProgress: 5,
    effect: "pulse"
  },
  {
    id: "10-tournaments",
    name: "Tournament Master",
    description: "Complete 10 tournaments",
    icon: "🌟",
    rarity: "epic",
    unlocked: true,
    unlockedDate: "2024-06-01",
    category: "tournaments",
    progress: 10,
    maxProgress: 10,
    effect: "sparkle"
  },
  {
    id: "3-wins",
    name: "Hat Trick",
    description: "Win 3 tournaments",
    icon: "🎩",
    rarity: "epic",
    unlocked: false,
    category: "tournaments",
    progress: 2,
    maxProgress: 3,
    effect: "rotate"
  },
  {
    id: "perfect-tournament",
    name: "Flawless Victory",
    description: "Win a tournament without losing a single set",
    icon: "💎",
    rarity: "legendary",
    unlocked: false,
    category: "tournaments",
    effect: "diamond-shine"
  },
  {
    id: "comeback-king",
    name: "Comeback King",
    description: "Win after being 0-2 down in matches 5 times",
    icon: "👑",
    rarity: "legendary",
    unlocked: false,
    category: "matches",
    progress: 2,
    maxProgress: 5,
    effect: "crown-glow"
  },
  {
    id: "grand-slam",
    name: "Grand Slam",
    description: "Win 4 major tournaments in a season",
    icon: "🔥",
    rarity: "mythic",
    unlocked: false,
    category: "tournaments",
    progress: 1,
    maxProgress: 4,
    effect: "fire"
  },

  // Match Achievements
  {
    id: "first-win",
    name: "First Victory",
    description: "Win your first match",
    icon: "✅",
    rarity: "common",
    unlocked: true,
    unlockedDate: "2024-03-15",
    category: "matches",
    effect: "glow"
  },
  {
    id: "10-wins",
    name: "Winning Streak",
    description: "Win 10 matches in a row",
    icon: "🔥",
    rarity: "rare",
    unlocked: false,
    category: "matches",
    progress: 6,
    maxProgress: 10,
    effect: "streak"
  },
  {
    id: "50-wins",
    name: "Match Master",
    description: "Win 50 matches total",
    icon: "🎖️",
    rarity: "epic",
    unlocked: false,
    category: "matches",
    progress: 32,
    maxProgress: 50,
    effect: "shine"
  },
  {
    id: "100-wins",
    name: "Century",
    description: "Win 100 matches total",
    icon: "💯",
    rarity: "legendary",
    unlocked: false,
    category: "matches",
    progress: 32,
    maxProgress: 100,
    effect: "rainbow"
  },
  {
    id: "ace-server",
    name: "Ace Server",
    description: "Win 20 points directly from serves",
    icon: "🎾",
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-05-22",
    category: "skills",
    progress: 20,
    maxProgress: 20,
    effect: "bounce"
  },
  {
    id: "deuce-master",
    name: "Deuce Master",
    description: "Win 10 games that went to deuce",
    icon: "⚡",
    rarity: "epic",
    unlocked: false,
    category: "matches",
    progress: 7,
    maxProgress: 10,
    effect: "electric"
  },

  // Skill Achievements
  {
    id: "smash-specialist",
    name: "Smash Specialist",
    description: "Execute 50 successful smashes",
    icon: "💥",
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-04-18",
    category: "skills",
    progress: 50,
    maxProgress: 50,
    effect: "impact"
  },
  {
    id: "spin-doctor",
    name: "Spin Doctor",
    description: "Master all spin techniques",
    icon: "🌀",
    rarity: "epic",
    unlocked: false,
    category: "skills",
    progress: 3,
    maxProgress: 5,
    effect: "spiral"
  },
  {
    id: "lightning-reflexes",
    name: "Lightning Reflexes",
    description: "Return 100 fast shots successfully",
    icon: "⚡",
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-05-30",
    category: "skills",
    progress: 100,
    maxProgress: 100,
    effect: "pulse"
  },
  {
    id: "perfect-placement",
    name: "Perfect Placement",
    description: "Hit all 4 table corners in a single match",
    icon: "🎯",
    rarity: "epic",
    unlocked: false,
    category: "skills",
    effect: "target"
  },

  // Social Achievements
  {
    id: "team-player",
    name: "Team Player",
    description: "Participate in 5 doubles matches",
    icon: "🤝",
    rarity: "common",
    unlocked: true,
    unlockedDate: "2024-04-05",
    category: "social",
    progress: 5,
    maxProgress: 5,
    effect: "glow"
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Help 3 new players improve their game",
    icon: "🎓",
    rarity: "rare",
    unlocked: false,
    category: "social",
    progress: 1,
    maxProgress: 3,
    effect: "wisdom"
  },
  {
    id: "social-butterfly",
    name: "Social Butterfly",
    description: "Play against 50 different opponents",
    icon: "🦋",
    rarity: "epic",
    unlocked: false,
    category: "social",
    progress: 28,
    maxProgress: 50,
    effect: "flutter"
  },

  // Special & Milestone Achievements
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Register for a tournament on launch day",
    icon: "🐦",
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-03-15",
    category: "special",
    effect: "glow"
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Play 10 matches after midnight",
    icon: "🦉",
    rarity: "rare",
    unlocked: false,
    category: "special",
    progress: 4,
    maxProgress: 10,
    effect: "moon"
  },
  {
    id: "dedication",
    name: "Dedication",
    description: "Log in for 30 consecutive days",
    icon: "📅",
    rarity: "epic",
    unlocked: false,
    category: "special",
    progress: 15,
    maxProgress: 30,
    effect: "calendar"
  },
  {
    id: "legend",
    name: "Legend",
    description: "Reach the top of the leaderboard",
    icon: "👑",
    rarity: "mythic",
    unlocked: false,
    category: "milestones",
    effect: "legendary-aura"
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Unlock all other achievements",
    icon: "✨",
    rarity: "mythic",
    unlocked: false,
    category: "milestones",
    progress: 18,
    maxProgress: 28,
    effect: "cosmic"
  },
  {
    id: "world-traveler",
    name: "World Traveler",
    description: "Compete in tournaments across 5 countries",
    icon: "🌍",
    rarity: "legendary",
    unlocked: false,
    category: "special",
    progress: 2,
    maxProgress: 5,
    effect: "globe"
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Win a match in under 10 minutes",
    icon: "⏱️",
    rarity: "epic",
    unlocked: true,
    unlockedDate: "2024-05-15",
    category: "matches",
    effect: "fast"
  },
  {
    id: "marathon-player",
    name: "Marathon Player",
    description: "Complete a match lasting over 90 minutes",
    icon: "🏃",
    rarity: "epic",
    unlocked: false,
    category: "matches",
    effect: "endurance"
  },
  {
    id: "lucky-13",
    name: "Lucky 13",
    description: "Win with exactly 13-11 score in a game",
    icon: "🍀",
    rarity: "rare",
    unlocked: true,
    unlockedDate: "2024-06-03",
    category: "special",
    effect: "luck"
  }
];

// Helper functions
export const getAchievementsByCategory = (category: string) => {
  return allAchievements.filter(a => a.category === category);
};

export const getUnlockedAchievements = () => {
  return allAchievements.filter(a => a.unlocked);
};

export const getLockedAchievements = () => {
  return allAchievements.filter(a => !a.unlocked);
};

export const getAchievementsByRarity = (rarity: Achievement["rarity"]) => {
  return allAchievements.filter(a => a.rarity === rarity);
};

export const getTotalAchievements = () => allAchievements.length;
export const getUnlockedCount = () => getUnlockedAchievements().length;
export const getCompletionPercentage = () => {
  return Math.round((getUnlockedCount() / getTotalAchievements()) * 100);
};
