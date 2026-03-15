import type { AppData, ChildStats, Completion, LevelConfig, CharacterTheme } from "./types";

export interface CharacterSkill {
  level: number;
  name: string;
  emoji: string;
  desc: string;
}

export const CHARACTER_SKILLS: Record<CharacterTheme, CharacterSkill[]> = {
  evoli: [
    { level: 1, name: "Ruff",           emoji: "💫", desc: "Einfacher, aber treuer Angriff" },
    { level: 2, name: "Sandwolke",      emoji: "🌪️", desc: "Wirbelt Sand auf und verwirrt Gegner" },
    { level: 3, name: "Blitzattacke",   emoji: "⚡", desc: "Immer zuerst – blitzschnell!" },
    { level: 4, name: "Biss",           emoji: "🦷", desc: "Kraftvoller Biss, macht Angst" },
    { level: 5, name: "Letzter Ausweg", emoji: "🌟", desc: "Die stärkste Attacke – maximale Kraft" },
  ],
  shire: [
    { level: 1, name: "Schritt",            emoji: "🐾", desc: "Ruhig und sicher – kein Hindernis zu groß" },
    { level: 2, name: "Trab",               emoji: "🏃", desc: "Gleichmäßig und ausdauernd" },
    { level: 3, name: "Galopp",             emoji: "💨", desc: "Volle Fahrt voraus!" },
    { level: 4, name: "Sprung",             emoji: "🦘", desc: "Überwindet jedes Hindernis mit Leichtigkeit" },
    { level: 5, name: "Fliegender Galopp",  emoji: "🌟", desc: "Unaufhaltbar – Legende des Stalls" },
  ],
  pikachu: [
    { level: 1, name: "Donnerblitz",   emoji: "⚡", desc: "Ein schwacher Elektroschock" },
    { level: 2, name: "Ruckzuckhieb",  emoji: "💥", desc: "Trifft immer zuerst" },
    { level: 3, name: "Eisenschweif",  emoji: "🔩", desc: "Schweifhieb – senkt Verteidigung" },
    { level: 4, name: "Donnerwelle",   emoji: "🌊", desc: "Elektrische Welle trifft alle" },
    { level: 5, name: "Voltakker",     emoji: "🌟", desc: "Die mächtigste Elektro-Attacke" },
  ],
  charmander: [
    { level: 1, name: "Glut",          emoji: "🔥", desc: "Kleiner Feuerball – der Anfang" },
    { level: 2, name: "Kratzer",       emoji: "🐾", desc: "Scharfe Klauen – senkt Verteidigung" },
    { level: 3, name: "Flammenwurf",   emoji: "🌋", desc: "Feuerstrahl mit Verbrennungschance" },
    { level: 4, name: "Drachenklauen", emoji: "🐉", desc: "Kraftvolle Drachenattacke" },
    { level: 5, name: "Inferno",       emoji: "🌟", desc: "Alles vernichtende Flammen" },
  ],
  togepi: [
    { level: 1, name: "Schlag",        emoji: "👊", desc: "Ein einfacher, aber treuer Schlag" },
    { level: 2, name: "Metronom",      emoji: "🎵", desc: "Zufällige Attacke – immer überraschend!" },
    { level: 3, name: "Schwerttanz",   emoji: "⚔️", desc: "Erhöht stark den Angriff" },
    { level: 4, name: "Zauberschein",  emoji: "✨", desc: "Blendend schöner Angriff" },
    { level: 5, name: "Wunschtraum",   emoji: "🌟", desc: "Heilende Glückskraft – legendär" },
  ],
  jigglypuff: [
    { level: 1, name: "Pfund",         emoji: "🎤", desc: "Sanfter Schlag mit dem Mikro" },
    { level: 2, name: "Gesang",        emoji: "🎶", desc: "Schläfert den Gegner ein" },
    { level: 3, name: "Tränentropfer", emoji: "💧", desc: "Riesige Augen – senkt Spezial-Angriff" },
    { level: 4, name: "Mondangriff",   emoji: "🌙", desc: "Mondkraft schlägt zu" },
    { level: 5, name: "Hyperstrahl",   emoji: "🌟", desc: "Der stärkste Normalangriff" },
  ],
  squirtle: [
    { level: 1, name: "Blubber",       emoji: "💦", desc: "Kleine Wasserblasen – schwächt Angriff" },
    { level: 2, name: "Aquaknarre",    emoji: "🔫", desc: "Gezielter Wasserstrahl" },
    { level: 3, name: "Surfer",        emoji: "🏄", desc: "Riesige Welle überrollt alles" },
    { level: 4, name: "Wasserring",    emoji: "💎", desc: "Schützender Wasserring" },
    { level: 5, name: "Hydropumpe",    emoji: "🌟", desc: "Gewaltiger Hochdruckstrahl" },
  ],
};

export function getCharacterSkills(theme: CharacterTheme, level: number): CharacterSkill[] {
  return CHARACTER_SKILLS[theme].filter((s) => s.level <= level);
}

export const DEFAULT_LEVELS: LevelConfig[] = [
  { level: 1, minXP: 0,    label: "Anfänger", emoji: "🌱" },
  { level: 2, minXP: 100,  label: "Helfer",   emoji: "⭐" },
  { level: 3, minXP: 250,  label: "Profi",    emoji: "🔥" },
  { level: 4, minXP: 500,  label: "Experte",  emoji: "💎" },
  { level: 5, minXP: 1000, label: "Legende",  emoji: "👑" },
];

// Keep LEVELS as alias for backward compat with KindClient
export const LEVELS = DEFAULT_LEVELS.map((l, i) => ({
  ...l,
  maxXP: DEFAULT_LEVELS[i + 1] ? DEFAULT_LEVELS[i + 1].minXP - 1 : Infinity,
  color:
    i === 0 ? "text-green-400"
    : i === 1 ? "text-yellow-400"
    : i === 2 ? "text-orange-400"
    : i === 3 ? "text-cyan-400"
    : "text-yellow-300",
}));

export function getLevelInfo(totalXP: number, customLevels?: LevelConfig[]) {
  const levels = customLevels ?? DEFAULT_LEVELS;

  // Find current level (last level whose minXP <= totalXP)
  let levelData = levels[0];
  for (const l of levels) {
    if (totalXP >= l.minXP) levelData = l;
  }

  const levelIndex = levels.findIndex((l) => l.level === levelData.level);
  const nextLevel = levels[levelIndex + 1] ?? null;

  const xpInCurrentLevel = totalXP - levelData.minXP;
  const xpForCurrentRange = nextLevel ? nextLevel.minXP - levelData.minXP : 1;
  const progressPercent = nextLevel
    ? Math.min(100, Math.round((xpInCurrentLevel / xpForCurrentRange) * 100))
    : 100;

  const colorMap = [
    "text-green-400",
    "text-yellow-400",
    "text-orange-400",
    "text-cyan-400",
    "text-yellow-300",
  ];
  const color = colorMap[Math.min(levelIndex, colorMap.length - 1)];

  return {
    ...levelData,
    color,
    maxXP: nextLevel ? nextLevel.minXP - 1 : Infinity,
    xpInCurrentLevel,
    xpForNextLevel: nextLevel ? nextLevel.minXP : levelData.minXP,
    xpNeeded: nextLevel ? nextLevel.minXP - totalXP : 0,
    progressPercent,
    isMaxLevel: !nextLevel,
  };
}

export function computeChildStats(data: AppData, childId: string): ChildStats {
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

  const levelInfo = getLevelInfo(totalXP, data.settings.levelConfig);

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
