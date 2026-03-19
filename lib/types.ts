export type MemberRole = "child" | "adult";
export type MemberColor = "purple" | "orange" | "blue" | "green" | "red" | "pink" | "yellow";
export type CharacterTheme = "evoli" | "shire" | "pikachu" | "charmander" | "togepi" | "jigglypuff" | "squirtle" | "tupac" | "hermione";
export type PresenceType = "absent" | "halbtag" | "ganztag";
export type ChoreFrequency = "daily" | "weekly" | "multiple_daily" | "manual";

export interface HouseholdMember {
  id: string;
  name: string;
  avatar: string;
  color: MemberColor;
  role: MemberRole;
  characterTheme?: CharacterTheme;
  email?: string;
  passwordHash?: string; // bcryptjs hash for credential login (non-Google accounts)
  favoriteChoreIds?: string[];  // pinned chores for adult view
  unlockedSkins?: string[];     // e.g. ["golden"]
}

// Backward-compat alias
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
  frequency?: ChoreFrequency; // default "daily"
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  emoji: string;
  active: boolean;
  targetAudience?: "child" | "adult" | "all"; // default: "child"
}

export interface Completion {
  id: string;
  choreId: string | null; // null for ad-hoc "Zusatzaufgabe" suggestions
  childId: string;
  date: string; // ISO date string
  xp: number;
  approved: boolean;
  approvedAt?: string;
  note?: string; // description for ad-hoc tasks, or optional remark
}

export interface Redemption {
  id: string;
  rewardId: string;
  childId: string;
  date: string; // ISO date string
  cost: number;
}

export interface CustodySchedule {
  nextOurWeekend: string; // ISO date string (Friday)
}

export interface PresencePattern {
  childId: string;
  days: PresenceType[]; // length=14; index 0=Mon week1 … 6=Sun week1, 7=Mon week2 … 13=Sun week2
}

export interface PresenceSchedule {
  cycleStartDate: string; // ISO date of the Monday of week 1
  patterns: PresencePattern[];
}

export interface ChoreAssignment {
  id: string;
  choreId: string;
  childId: string;
  date: string;           // ISO date
  source: "suggested" | "manual";
}

export interface SkinUnlockConfig {
  requiredDays: number;  // consecutive days (default 10)
  minXpPerDay:  number;  // minimum XP per day to count (default 20)
}

export interface AppSettings {
  children: HouseholdMember[];
  custodySchedule: CustodySchedule;
  levelConfig?: LevelConfig[];
  presenceSchedule?: PresenceSchedule;
  skinUnlockConfig?: SkinUnlockConfig;
}

export interface AppData {
  version: number;
  settings: AppSettings;
  chores: Chore[];
  rewards: Reward[];
  completions: Completion[];
  redemptions: Redemption[];
  assignments: ChoreAssignment[]; // planned chore assignments
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
