import type { AppData, ChildStats, Completion, Redemption } from "./types";

export const LEVELS = [
  { level: 1, minXP: 0, maxXP: 99, emoji: "🌱", label: "Anfänger", color: "text-green-400" },
  { level: 2, minXP: 100, maxXP: 249, emoji: "⭐", label: "Helfer", color: "text-yellow-400" },
  { level: 3, minXP: 250, maxXP: 499, emoji: "🔥", label: "Profi", color: "text-orange-400" },
  { level: 4, minXP: 500, maxXP: 999, emoji: "💎", label: "Experte", color: "text-cyan-400" },
  { level: 5, minXP: 1000, maxXP: Infinity, emoji: "👑", label: "Legende", color: "text-yellow-300" },
];

export function getLevelInfo(totalXP: number) {
  const levelData = LEVELS.findLast((l) => totalXP >= l.minXP) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === levelData.level + 1);

  const xpInCurrentLevel = totalXP - levelData.minXP;
  const xpForCurrentRange = nextLevel
    ? nextLevel.minXP - levelData.minXP
    : 1;
  const progressPercent = nextLevel
    ? Math.min(100, Math.round((xpInCurrentLevel / xpForCurrentRange) * 100))
    : 100;

  return {
    ...levelData,
    xpInCurrentLevel,
    xpForNextLevel: nextLevel ? nextLevel.minXP : levelData.minXP,
    xpNeeded: nextLevel ? nextLevel.minXP - totalXP : 0,
    progressPercent,
    isMaxLevel: !nextLevel,
  };
}

export function computeChildStats(
  data: AppData,
  childId: string
): ChildStats {
  const child = data.settings.children.find((c) => c.id === childId);
  if (!child) throw new Error(`Child ${childId} not found`);

  const approvedCompletions = data.completions.filter(
    (c) => c.childId === childId && c.approved
  );
  const pendingCompletions = data.completions.filter(
    (c) => c.childId === childId && !c.approved
  );
  const childRedemptions = data.redemptions.filter(
    (r) => r.childId === childId
  );

  const totalXP = approvedCompletions.reduce((sum, c) => sum + c.xp, 0);
  const spentXP = childRedemptions.reduce((sum, r) => sum + r.cost, 0);
  const availableXP = totalXP - spentXP;

  const levelInfo = getLevelInfo(totalXP);

  const recentCompletions = [...approvedCompletions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    child,
    totalXP,
    spentXP,
    availableXP,
    level: levelInfo.level,
    levelEmoji: levelInfo.emoji,
    xpInCurrentLevel: levelInfo.xpInCurrentLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    progressPercent: levelInfo.progressPercent,
    pendingCompletions,
    recentCompletions,
  };
}

export function hasCompletedChoreToday(
  completions: Completion[],
  choreId: string,
  childId: string
): boolean {
  const today = new Date().toISOString().split("T")[0];
  return completions.some(
    (c) => c.choreId === choreId && c.childId === childId && c.date === today
  );
}
