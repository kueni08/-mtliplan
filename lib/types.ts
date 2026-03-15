export type MemberRole = "child" | "adult";
export type MemberColor = "purple" | "orange";

export interface HouseholdMember {
  id: string;
  name: string;
  avatar: string;
  color: MemberColor;
  role: MemberRole;
  characterTheme?: "evoli" | "shire";
  email?: string; // optional, for adult members
}

// Keep Child as alias for backward compatibility
export type Child = HouseholdMember;

export interface LevelConfig {
  level: number;
  minXP: number;
  label: string;
  emoji: string;
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
  children: HouseholdMember[];
  custodySchedule: CustodySchedule;
  levelConfig?: LevelConfig[]; // custom level thresholds; uses defaults if missing
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
  child: HouseholdMember;
  totalXP: number;
  spentXP: number;
  availableXP: number;
  level: number;
  levelEmoji: string;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  pendingCompletions: Completion[];
  recentCompletions: Completion[];
}
