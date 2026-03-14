"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LevelBadge from "@/components/LevelBadge";
import XPBar from "@/components/XPBar";
import { useAppStore } from "@/store/useAppStore";
import { computeChildStats } from "@/lib/gamification";
import { isKidPresentNow } from "@/lib/custody";
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

interface DashboardClientProps {
  userName: string;
}

function DashboardContent({ userName }: DashboardClientProps) {
  const { data, approveCompletion, rejectCompletion } = useAppStore();

  if (!data) return null;

  const kidsPresent = isKidPresentNow(data.settings.custodySchedule.nextOurWeekend);
  const childStats = data.settings.children.map((c) =>
    computeChildStats(data, c.id)
  );

  const allPending = data.completions.filter((c) => !c.approved);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Hallo! 👋</h1>
            <p className="text-purple-300 text-sm">{userName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`text-xs px-3 py-1.5 rounded-full border ${
                kidsPresent
                  ? "bg-green-500/20 border-green-500/40 text-green-300"
                  : "bg-gray-500/20 border-gray-500/40 text-gray-400"
              }`}
            >
              {kidsPresent ? "🏠 Kinder da" : "📅 Kinder weg"}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Pending approvals */}
        {allPending.length > 0 && (
          <div className="glass rounded-2xl p-4 space-y-3 border border-yellow-500/30">
            <h2 className="text-base font-bold text-yellow-300 flex items-center gap-2">
              <span>⏳</span> Genehmigungen ({allPending.length})
            </h2>
            <div className="space-y-2">
              {allPending.map((completion) => {
                const chore = data.chores.find((c) => c.id === completion.choreId);
                const child = data.settings.children.find(
                  (c) => c.id === completion.childId
                );
                if (!chore || !child) return null;
                return (
                  <div
                    key={completion.id}
                    className="flex items-center justify-between gap-3 bg-white/5 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span>{child.avatar}</span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {child.name}: {chore.title}
                        </p>
                        <p className="text-green-400 text-xs">+{chore.xp} XP</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => approveCompletion(completion.id)}
                        className="bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg p-1.5 transition-colors"
                        title="Genehmigen"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => rejectCompletion(completion.id)}
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg p-1.5 transition-colors"
                        title="Ablehnen"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Child cards */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white">Kinder-Übersicht</h2>
          {childStats.map((stats) => (
            <Link
              key={stats.child.id}
              href={`/kind/${stats.child.id}`}
              className="glass rounded-2xl p-4 block hover:bg-white/10 transition-all active:scale-98"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{stats.child.avatar}</span>
                  <div>
                    <p className="font-bold text-white text-lg">{stats.child.name}</p>
                    <LevelBadge level={stats.level} size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${stats.child.color === "orange" ? "text-orange-300" : "text-purple-300"}`}>
                    {stats.totalXP}
                  </p>
                  <p className="text-xs text-white/50">Gesamt-XP</p>
                  {stats.pendingCompletions.length > 0 && (
                    <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded-full">
                      {stats.pendingCompletions.length} ausstehend
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <XPBar
                  current={stats.xpInCurrentLevel}
                  total={stats.xpForNextLevel - (stats.level > 1 ? [0,0,100,250,500,1000][stats.level] : 0)}
                  percent={stats.progressPercent}
                  color={stats.child.color}
                />
              </div>
              <div className="flex items-center justify-end mt-2 text-white/40 text-xs gap-1">
                <span>Ansicht öffnen</span>
                <ArrowRightIcon className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>

        {/* Redemptions today */}
        {data.redemptions.length > 0 && (
          <div className="glass rounded-2xl p-4 space-y-2">
            <h2 className="text-base font-bold text-white">🎁 Letzte Einlösungen</h2>
            {data.redemptions.slice(-3).reverse().map((r) => {
              const reward = data.rewards.find((rw) => rw.id === r.rewardId);
              const child = data.settings.children.find((c) => c.id === r.childId);
              if (!reward || !child) return null;
              return (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span>{reward.emoji}</span>
                  <span className="text-white/70">
                    {child.name} hat <strong className="text-white">{reward.title}</strong> eingelöst
                  </span>
                  <span className="text-orange-300 ml-auto">−{r.cost} XP</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}

export default function DashboardClient({ userName }: DashboardClientProps) {
  return (
    <AppShell>
      <DashboardContent userName={userName} />
    </AppShell>
  );
}
