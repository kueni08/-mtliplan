"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import XPBar from "@/components/XPBar";
import LevelBadge from "@/components/LevelBadge";
import ChoreCard from "@/components/ChoreCard";
import RewardShop from "@/components/RewardShop";
import { useAppStore } from "@/store/useAppStore";
import { computeChildStats, hasCompletedChoreToday, getLevelInfo } from "@/lib/gamification";
import { LEVELS } from "@/lib/gamification";

interface KindClientProps {
  childId: string;
}

export default function KindClient({ childId }: KindClientProps) {
  const { data, markChoreComplete, redeemReward } = useAppStore();
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);
  const router = useRouter();

  if (!data) return null;

  const child = data.settings.children.find((c) => c.id === childId);
  if (!child) {
    router.push("/dashboard");
    return null;
  }

  const stats = computeChildStats(data, childId);
  const activeChores = data.chores.filter((c) => c.active);
  const levelInfo = getLevelInfo(stats.totalXP);
  const xpColor = child.color === "orange" ? "text-orange-300" : "text-purple-300";
  const bgGradient =
    child.color === "orange"
      ? "from-orange-900/30 to-yellow-900/20"
      : "from-purple-900/30 to-violet-900/20";

  const handleChoreComplete = async (choreId: string) => {
    const prevXP = stats.totalXP;
    await markChoreComplete(choreId, childId);

    // XP animation
    const chore = data.chores.find((c) => c.id === choreId);
    if (chore) {
      setXpAnimation(chore.xp);
      setTimeout(() => setXpAnimation(null), 2000);

      // Check level up (approvals pending, but show excitement anyway)
    }
  };

  return (
    <AppShell>
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
            <div
              className={`text-6xl ${justLeveledUp ? "level-up-animate" : ""}`}
              style={{ fontSize: "4rem" }}
            >
              {child.avatar}
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
              <span>XP bis Level {stats.level + 1 <= LEVELS.length ? stats.level + 1 : "MAX"}</span>
              <span>{levelInfo.isMaxLevel ? "Maximum erreicht! 👑" : `noch ${levelInfo.xpNeeded} XP`}</span>
            </div>
            <XPBar
              current={stats.xpInCurrentLevel}
              total={levelInfo.isMaxLevel ? 1 : levelInfo.xpForNextLevel - (LEVELS[stats.level - 1]?.minXP ?? 0)}
              percent={stats.progressPercent}
              color={child.color}
            />
          </div>

          {stats.pendingCompletions.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
              <p className="text-yellow-300 text-sm text-center">
                ⏳ {stats.pendingCompletions.length} Aufgabe(n) warten auf Genehmigung
              </p>
            </div>
          )}
        </div>

        {/* Today's chores */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">
            📋 Aufgaben von heute
          </h2>
          {activeChores.length === 0 ? (
            <p className="text-white/50 text-center py-6">Noch keine Aufgaben eingerichtet</p>
          ) : (
            <div className="space-y-2">
              {activeChores.map((chore) => {
                const completed = hasCompletedChoreToday(
                  data.completions.filter((c) => c.approved),
                  chore.id,
                  childId
                );
                const pending = hasCompletedChoreToday(
                  data.completions.filter((c) => !c.approved),
                  chore.id,
                  childId
                );
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

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Gesamt XP", value: stats.totalXP, emoji: "⭐" },
            {
              label: "Heute erledigt",
              value: data.completions.filter(
                (c) =>
                  c.childId === childId &&
                  c.date === new Date().toISOString().split("T")[0]
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
          rewards={data.rewards}
          availableXP={stats.availableXP}
          onRedeem={(rewardId) => redeemReward(rewardId, childId)}
          childColor={child.color}
        />
      </div>
    </AppShell>
  );
}
