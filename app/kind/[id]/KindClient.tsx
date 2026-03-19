"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import XPBar from "@/components/XPBar";
import LevelBadge from "@/components/LevelBadge";
import ChoreCard from "@/components/ChoreCard";
import RewardShop from "@/components/RewardShop";
import CharacterAvatar from "@/components/CharacterAvatar";
import { useAppStore } from "@/store/useAppStore";
import { computeChildStats, hasCompletedChoreToday, getLevelInfo, CHARACTER_SKILLS, DEFAULT_LEVELS, computeStreak } from "@/lib/gamification";
import { COLOR_MAP } from "@/lib/colors";

interface KindClientProps {
  childId: string;
}

/** ISO date string for today ± offset days */
function offsetDate(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

/** Human-readable label for a date relative to today */
function relativeLabel(dateStr: string, today: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round(
    (new Date(dateStr + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000
  );
  const dayName = d.toLocaleDateString("de-CH", { weekday: "long" });
  const datePart = d.toLocaleDateString("de-CH", { day: "numeric", month: "long" });
  if (diff === -1) return `Gestern · ${dayName}, ${datePart}`;
  if (diff === -2) return `Vorgestern · ${dayName}, ${datePart}`;
  if (diff < 0)    return `${Math.abs(diff)} Tage zurück · ${dayName}, ${datePart}`;
  if (diff === 1)  return `Morgen · ${dayName}, ${datePart}`;
  if (diff === 2)  return `Übermorgen · ${dayName}, ${datePart}`;
  return `${dayName}, ${datePart}`;
}

function KindContent({ childId }: KindClientProps) {
  const { data, markChoreComplete, redeemReward, suggestAdHocTask, toggleFavoriteChore, updateChild } = useAppStore();
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);
  const [adhocNote, setAdhocNote]   = useState("");
  const [adhocXp,   setAdhocXp]    = useState(5);
  const [adhocSent, setAdhocSent]   = useState(false);
  const router = useRouter();

  if (!data) return null;

  const child = data.settings.children.find((c) => c.id === childId);
  if (!child) {
    router.push("/dashboard");
    return null;
  }

  const stats           = computeChildStats(data, childId);
  const today           = offsetDate(0);
  const effectiveLevels = data.settings.levelConfig ?? DEFAULT_LEVELS;
  const levelInfo       = getLevelInfo(stats.totalXP, effectiveLevels);
  const colorStyle = COLOR_MAP[child.color ?? "purple"];
  const xpColor    = colorStyle.text;
  const bgGradient = colorStyle.gradient;

  // Streak & skin unlock
  const streak       = computeStreak(data, childId);
  const requiredDays = data.settings.skinUnlockConfig?.requiredDays ?? 10;
  const hasGolden    = child.unlockedSkins?.includes("golden") ?? false;
  const skin         = hasGolden ? "golden" : "default";

  // Auto-unlock golden skin when streak threshold reached
  useEffect(() => {
    if (!hasGolden && streak >= requiredDays) {
      updateChild(childId, { unlockedSkins: [...(child.unlockedSkins ?? []), "golden"] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak, requiredDays, hasGolden]);

  // Assignments for this child
  const allAssignments = (data.assignments ?? []).filter((a) => a.childId === childId);
  const hasAnyAssignments = allAssignments.length > 0;

  // ±3-day window (indices: -3 … 0 … +3)
  const windowStart = offsetDate(-3);
  const windowEnd   = offsetDate(+3);
  const windowAssignments = allAssignments.filter(
    (a) => a.date >= windowStart && a.date <= windowEnd
  );

  // Build date groups for past, today, future — only include dates with assignments
  const pastDates    = [-3, -2, -1].map(offsetDate).filter((d) => d < today);
  const futureDates  = [1, 2, 3].map(offsetDate).filter((d) => d > today);

  const assignmentsOn = (dateStr: string) =>
    windowAssignments.filter((a) => a.date === dateStr);

  const todayAssignments = assignmentsOn(today);

  // Today's chores (or fallback to all active when no assignments at all)
  const todayChores = todayAssignments
    .map((a) => data.chores.find((c) => c.id === a.choreId))
    .filter((c): c is NonNullable<typeof c> => c !== undefined && c.active);
  const choresToShow = hasAnyAssignments ? todayChores : data.chores.filter((c) => c.active);

  const approvedToday = data.completions.filter((c) => c.approved);
  const pendingToday  = data.completions.filter((c) => !c.approved);

  const handleChoreComplete = async (choreId: string) => {
    await markChoreComplete(choreId, childId);
    const chore = data.chores.find((c) => c.id === choreId);
    if (chore) {
      setXpAnimation(chore.xp);
      setTimeout(() => setXpAnimation(null), 2000);
    }
  };

  const handleAdhocSubmit = async () => {
    const note = adhocNote.trim();
    if (!note || adhocXp < 1) return;
    await suggestAdHocTask(childId, note, adhocXp);
    setAdhocNote("");
    setAdhocXp(5);
    setAdhocSent(true);
    setTimeout(() => setAdhocSent(false), 3000);
  };

  /** Render one date group (past or future) */
  const renderDateGroup = (dateStr: string) => {
    const assignments = assignmentsOn(dateStr);
    if (assignments.length === 0) return null;
    const isPast = dateStr < today;

    return (
      <div key={dateStr} className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-wider pl-1 ${
          isPast ? "text-orange-300/70" : "text-blue-300/70"
        }`}>
          {relativeLabel(dateStr, today)}
        </p>
        {assignments.map((assignment) => {
          const chore = data.chores.find((c) => c.id === assignment.choreId && c.active);
          if (!chore) return null;
          const isMultiDaily = chore.frequency === "multiple_daily";
          const completed = !isMultiDaily && hasCompletedChoreToday(approvedToday, chore.id, childId);
          const pending   = !isMultiDaily && hasCompletedChoreToday(pendingToday,  chore.id, childId);
          return (
            <ChoreCard
              key={assignment.id}
              chore={chore}
              completed={completed}
              pending={pending}
              onComplete={() => handleChoreComplete(chore.id)}
              childColor={child.color}
            />
          );
        })}
      </div>
    );
  };

  const pastGroups   = pastDates.reverse().map(renderDateGroup).filter(Boolean);
  const futureGroups = futureDates.map(renderDateGroup).filter(Boolean);

  // ── Adult view ────────────────────────────────────────────────────────────
  if (child.role === "adult") {
    const favIds     = child.favoriteChoreIds ?? [];
    const allActive  = data.chores.filter((c) => c.active).sort((a, b) => a.title.localeCompare(b.title));
    const favorites  = allActive.filter((c) => favIds.includes(c.id));
    const rest       = allActive.filter((c) => !favIds.includes(c.id));

    return (
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Profile header */}
        <div className={`glass rounded-3xl p-5 bg-gradient-to-br ${bgGradient} space-y-4`}>
          <div className="flex items-center gap-4">
            <div>
              {child.characterTheme ? (
                <CharacterAvatar theme={child.characterTheme} level={stats.level} size="md" skin={skin} />
              ) : (
                <span style={{ fontSize: "4rem" }}>{child.avatar}</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-white">{child.name}</h1>
              <LevelBadge level={stats.level} size="md" />
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${xpColor}`}>{stats.availableXP}</p>
              <p className="text-xs text-white/50">verfügbare XP</p>
            </div>
          </div>
          {streak > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-orange-300 text-sm">🔥 {streak} Tage Streak</span>
              {streak >= requiredDays
                ? <span className="text-yellow-300 text-xs">✨ Goldener Skin freigeschaltet!</span>
                : <span className="text-white/40 text-xs">Noch {requiredDays - streak} Tage bis zum Skin</span>
              }
            </div>
          )}
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide">⭐ Favoriten</h2>
            {favorites.map((chore) => (
              <div key={chore.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <ChoreCard
                    chore={chore}
                    completed={hasCompletedChoreToday(data.completions.filter((c) => c.approved), chore.id, childId)}
                    pending={false}
                    onComplete={() => markChoreComplete(chore.id, childId)}
                    childColor={child.color}
                  />
                </div>
                <button
                  onClick={() => toggleFavoriteChore(childId, chore.id)}
                  className="text-yellow-400 hover:text-white/50 text-xl transition-colors shrink-0"
                  title="Aus Favoriten entfernen"
                >
                  📌
                </button>
              </div>
            ))}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </div>
        )}

        {/* All chores */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide">📋 Alle Aufgaben</h2>
          {rest.map((chore) => (
            <div key={chore.id} className="flex items-center gap-2">
              <div className="flex-1">
                <ChoreCard
                  chore={chore}
                  completed={hasCompletedChoreToday(data.completions.filter((c) => c.approved), chore.id, childId)}
                  pending={false}
                  onComplete={() => markChoreComplete(chore.id, childId)}
                  childColor={child.color}
                />
              </div>
              <button
                onClick={() => toggleFavoriteChore(childId, chore.id)}
                className="text-white/30 hover:text-yellow-400 text-xl transition-colors shrink-0"
                title="Zu Favoriten hinzufügen"
              >
                📌
              </button>
            </div>
          ))}
        </div>

        {/* Adhoc */}
        <div className="glass rounded-3xl p-4 space-y-3 border border-white/10">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide">✏️ Zusatzaufgabe eintragen</h2>
          {adhocSent ? (
            <p className="text-green-400 text-sm text-center py-2">✅ Aufgabe eingetragen!</p>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={adhocNote}
                onChange={(e) => setAdhocNote(e.target.value)}
                placeholder="Was hast du gemacht? z.B. Garage aufgeräumt"
                className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                maxLength={120}
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/50 shrink-0">XP:</label>
                <input
                  type="number"
                  value={adhocXp}
                  onChange={(e) => setAdhocXp(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={500}
                  className="w-20 bg-white/10 text-white rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  onClick={handleAdhocSubmit}
                  disabled={!adhocNote.trim()}
                  className={`flex-1 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    adhocNote.trim() ? `${colorStyle.bg} text-white` : "bg-white/10 text-white/30 cursor-not-allowed"
                  }`}
                >
                  Eintragen
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reward shop */}
        <RewardShop
          rewards={data.rewards.filter((r) => {
            const ta = r.targetAudience ?? "child";
            return ta === "all" || ta === "adult";
          })}
          availableXP={stats.availableXP}
          onRedeem={(rewardId) => redeemReward(rewardId, childId)}
          childColor={child.color}
        />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
      {/* XP animation overlay */}
      {xpAnimation !== null && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-green-500 text-white font-bold text-2xl px-6 py-3 rounded-2xl shadow-lg animate-bounce">
            +{xpAnimation} XP 🎉
          </div>
        </div>
      )}

      {/* Level up overlay */}
      {justLeveledUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setJustLeveledUp(false)}
        >
          <div className="text-center space-y-4 p-8 animate-bounce-slow">
            <div className="text-8xl">{levelInfo.emoji}</div>
            <h2 className="text-4xl font-black text-white">LEVEL UP!</h2>
            <p className="text-2xl text-yellow-300">Level {levelInfo.level} – {levelInfo.label}</p>
            <p className="text-white/60">Tippe um fortzufahren</p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className={`glass rounded-3xl p-5 bg-gradient-to-br ${bgGradient} space-y-4`}>
        <div className="flex items-center gap-4">
          <div className={justLeveledUp ? "level-up-animate" : ""}>
            {child.characterTheme ? (
              <CharacterAvatar theme={child.characterTheme} level={stats.level} size="md" skin={skin} />
            ) : (
              <span style={{ fontSize: "4rem" }}>{child.avatar}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">{child.name}</h1>
            <LevelBadge level={stats.level} size="md" />
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${xpColor}`}>{stats.availableXP}</p>
            <p className="text-xs text-white/50">verfügbare XP</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/60">
            <span>XP bis Level {stats.level + 1 <= effectiveLevels.length ? stats.level + 1 : "MAX"}</span>
            <span>{levelInfo.isMaxLevel ? "Maximum erreicht! 👑" : `noch ${levelInfo.xpNeeded} XP`}</span>
          </div>
          <XPBar
            current={stats.xpInCurrentLevel}
            total={levelInfo.isMaxLevel ? 1 : levelInfo.xpForNextLevel - (effectiveLevels[stats.level - 1]?.minXP ?? 0)}
            percent={stats.progressPercent}
            color={child.color}
          />
        </div>

        {streak > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-orange-300 text-sm">🔥 {streak} Tage Streak</span>
            {streak >= requiredDays
              ? <span className="text-yellow-300 text-xs">✨ Goldener Skin freigeschaltet!</span>
              : <span className="text-white/40 text-xs">Noch {requiredDays - streak} Tage bis zum Skin</span>
            }
          </div>
        )}

        {stats.pendingCompletions.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
            <p className="text-yellow-300 text-sm text-center">
              ⏳ {stats.pendingCompletions.length} Aufgabe(n) warten auf Genehmigung
            </p>
          </div>
        )}
      </div>

      {/* Character skills */}
      {child.characterTheme && (
        <div className="glass rounded-3xl p-4 space-y-3">
          <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide">⚔️ Fähigkeiten</h2>
          <div className="grid grid-cols-1 gap-2">
            {CHARACTER_SKILLS[child.characterTheme].map((skill) => {
              const unlocked = skill.level <= stats.level;
              return (
                <div
                  key={skill.level}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                    unlocked
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/3 border border-white/5 opacity-50"
                  }`}
                >
                  <span className="text-2xl">{unlocked ? skill.emoji : "🔒"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${unlocked ? "text-white" : "text-white/40"}`}>
                      {skill.name}
                    </p>
                    <p className={`text-xs ${unlocked ? "text-white/60" : "text-white/30"}`}>
                      {unlocked ? skill.desc : `Level ${skill.level} erforderlich`}
                    </p>
                  </div>
                  {unlocked && <span className="text-xs text-green-400 font-bold shrink-0">✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HEUTE ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">📋 Heute</h2>
          {hasAnyAssignments && todayChores.length > 0 && (
            <span className="text-xs text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full">📆 Zugeteilt</span>
          )}
        </div>
        {choresToShow.length === 0 ? (
          <p className="text-white/50 text-center py-6">Keine Aufgaben für heute</p>
        ) : (
          <div className="space-y-2">
            {choresToShow.map((chore) => {
              const isMultiDaily = chore.frequency === "multiple_daily";
              const completed = !isMultiDaily && hasCompletedChoreToday(approvedToday, chore.id, childId);
              const pending   = !isMultiDaily && hasCompletedChoreToday(pendingToday,  chore.id, childId);
              return (
                <ChoreCard
                  key={chore.id}
                  chore={chore}
                  completed={completed}
                  pending={pending}
                  onComplete={() => handleChoreComplete(chore.id)}
                  childColor={child.color}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── NACHZUHOLEN (vergangene ≤3 Tage) ─────────────── */}
      {pastGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-orange-500/30" />
            <span className="text-xs font-semibold text-orange-300/80 uppercase tracking-wider whitespace-nowrap">
              ↩️ Nachzuholen
            </span>
            <div className="flex-1 h-px bg-orange-500/30" />
          </div>
          <div className="space-y-4">
            {pastGroups}
          </div>
        </div>
      )}

      {/* ── KOMMEND (nächste ≤3 Tage) ─────────────────────── */}
      {futureGroups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-blue-500/30" />
            <span className="text-xs font-semibold text-blue-300/80 uppercase tracking-wider whitespace-nowrap">
              ▶️ Kommend · vorziehbar
            </span>
            <div className="flex-1 h-px bg-blue-500/30" />
          </div>
          <div className="space-y-4">
            {futureGroups}
          </div>
        </div>
      )}

      {/* ── ZUSATZAUFGABE VORSCHLAGEN ─────────────────────── */}
      <div className="glass rounded-3xl p-4 space-y-3 border border-white/10">
        <h2 className="text-sm font-bold text-white/70 uppercase tracking-wide">
          ✏️ Zusatzaufgabe eintragen
        </h2>
        {adhocSent ? (
          <p className="text-green-400 text-sm text-center py-2">
            ✅ Aufgabe eingereicht – wartet auf Genehmigung!
          </p>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={adhocNote}
              onChange={(e) => setAdhocNote(e.target.value)}
              placeholder="Was hast du gemacht? z.B. Auto gewaschen"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
              maxLength={120}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50 shrink-0">XP-Vorschlag:</label>
              <input
                type="number"
                value={adhocXp}
                onChange={(e) => setAdhocXp(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={100}
                className="w-20 bg-white/10 text-white rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <span className="text-xs text-white/40">XP</span>
              <button
                onClick={handleAdhocSubmit}
                disabled={!adhocNote.trim()}
                className={`flex-1 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  adhocNote.trim()
                    ? `${colorStyle.bg} text-white`
                    : "bg-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                Einreichen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Gesamt XP",    value: stats.totalXP,    emoji: "⭐" },
          {
            label: "Heute erledigt",
            value: data.completions.filter(
              (c) => c.childId === childId && c.date === today
            ).length,
            emoji: "✅",
          },
          { label: "Eingelöst", value: stats.spentXP, emoji: "🎁" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-3 text-center">
            <div className="text-xl">{s.emoji}</div>
            <div className={`text-xl font-black ${xpColor}`}>{s.value}</div>
            <div className="text-xs text-white/50">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Reward shop */}
      <RewardShop
        rewards={data.rewards.filter((r) => {
          const ta = r.targetAudience ?? "child";
          return ta === "all" || ta === (child.role ?? "child");
        })}
        availableXP={stats.availableXP}
        onRedeem={(rewardId) => redeemReward(rewardId, childId)}
        childColor={child.color}
      />
    </div>
  );
}

export default function KindClient({ childId }: KindClientProps) {
  return (
    <AppShell>
      <KindContent childId={childId} />
    </AppShell>
  );
}
