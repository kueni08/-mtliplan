export interface Child {
  id: string;
  name: string;
  avatar: string; // emoji
  color: "purple" | "orange"; // theme color
}

export interface Chore {
  id: string;
  title: string;
  xp: number;
  category: "küche" | "zimmer" | "haus" | "sonstiges";
  emoji: string;
  active: boolean;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  emoji: string;
  active: boolean;
}

export interface Completion {
  id: string;
  choreId: string;
  childId: string;
  date: string; // ISO date string
  xp: number;
  approved: boolean;
  approvedAt?: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  childId: string;
  date: string; // ISO date string
  cost: number;
}

export interface CustodySchedule {
  // ISO date string of the Friday of the next "our" weekend
  nextOurWeekend: string;
}

export interface AppSettings {
  children: Child[];
  custodySchedule: CustodySchedule;
}

export interface AppData {
  version: number;
  settings: AppSettings;
  chores: Chore[];
  rewards: Reward[];
  completions: Completion[];
  redemptions: Redemption[];
}

// Derived / computed types
export interface ChildStats {
  child: Child;
  totalXP: number; // all approved XP ever earned
  spentXP: number; // XP spent on rewards
  availableXP: number; // totalXP - spentXP
  level: number;
  levelEmoji: string;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  pendingCompletions: Completion[];
  recentCompletions: Completion[];
}
