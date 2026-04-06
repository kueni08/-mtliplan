"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LevelBadge from "@/components/LevelBadge";
import XPBar from "@/components/XPBar";
import CharacterAvatar from "@/components/CharacterAvatar";
import { useAppStore } from "@/store/useAppStore";
import { computeChildStats } from "@/lib/gamification";
import { isKidPresentNow } from "@/lib/custody";
import { COLOR_MAP } from "@/lib/colors";
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

interface DashboardClientProps {
  userName: string;
  role: "admin" | "adult" | "child" | "pending";
  memberId?: string;
}

function DashboardContent({ userName, role, memberId }: DashboardClientProps) {
  const { data, approveCompletionWithXp, rejectCompletion } = useAppStore();

  if (!data) return null;

  const kidsPresent = isKidPresentNow(data.settings.custodySchedule.nextOurWeekend);
  // Show ALL household members in Haushaltsübersicht
  const allMemberStats = data.settings.children.map((c) => computeChildStats(data, c.id));

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
                const chore = completion.choreId
                  ? data.chores.find((c) => c.id === completion.choreId)
                  : null;
                const child = data.settings.children.find(
                  (c) => c.id === completion.childId
                );
                // Skip if neither a known chore nor an ad-hoc note
                if (!child || (!chore && !completion.note)) return null;
                const isAdHoc = !chore;
                return (
                  <PendingRow
                    key={completion.id}
                    completion={completion}
                    chore={chore ?? null}
                    child={child}
                    isAdHoc={isAdHoc}
                    onApprove={(xp) => approveCompletionWithXp(completion.id, xp)}
                    onReject={() => rejectCompletion(completion.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Haushaltsübersicht – all members */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white">👥 Haushaltsübersicht</h2>
          {allMemberStats.map((stats) => (
            <Link
              key={stats.child.id}
              href={`/kind/${stats.child.id}`}
              className="glass rounded-2xl p-4 block hover:bg-white/10 transition-all active:scale-98"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {stats.child.characterTheme ? (
                    <CharacterAvatar theme={stats.child.characterTheme} level={stats.level} size="sm" />
                  ) : (
                    <span className="text-4xl">{stats.child.avatar}</span>
                  )}
                  <div>
                    <p className="font-bold text-white text-lg">{stats.child.name}</p>
                    <div className="flex items-center gap-2">
                      <LevelBadge level={stats.level} size="sm" />
                      {stats.child.role === "adult" && (
                        <span className="text-xs text-blue-300/70">Erwachsen</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${COLOR_MAP[stats.child.color ?? "purple"].text}`}>
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

        {/* Statistik link */}
        <Link
          href="/statistik"
          className="glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition-all active:scale-98 border border-purple-500/20"
        >
          <span className="text-3xl">📊</span>
          <div className="flex-1">
            <p className="font-bold text-white">Statistik</p>
            <p className="text-white/50 text-sm">Wer hat welche Aufgabe wie oft erledigt</p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-white/40" />
        </Link>

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

// ─── Pending approval row (needs own state for XP editing) ───────────────────

import type { Completion, Chore, HouseholdMember } from "@/lib/types";

function PendingRow({
  completion,
  chore,
  child,
  isAdHoc,
  onApprove,
  onReject,
}: {
  completion: Completion;
  chore: Chore | null;
  child: HouseholdMember;
  isAdHoc: boolean;
  onApprove: (xp: number) => void;
  onReject: () => void;
}) {
  const [editXp, setEditXp] = useState(completion.xp);

  return (
    <div className={`rounded-xl p-3 ${isAdHoc ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-xl shrink-0 mt-0.5">{child.avatar}</span>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium">
              {child.name}
              {isAdHoc
                ? <span className="text-purple-300 ml-1 text-xs">(Zusatzaufgabe)</span>
                : null
              }
            </p>
            <p className="text-white/60 text-xs truncate">
              {isAdHoc ? `✏️ ${completion.note}` : `${chore!.emoji} ${chore!.title}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* XP input — editable for all completions, required for ad-hoc */}
          <input
            type="number"
            value={editXp}
            onChange={(e) => setEditXp(Math.max(0, parseInt(e.target.value) || 0))}
            min={0}
            className="w-14 bg-white/10 text-green-400 text-xs text-center rounded-lg px-1 py-1 outline-none focus:ring-1 focus:ring-green-500/50"
            title="XP anpassen"
          />
          <span className="text-green-400 text-xs">XP</span>
          <button
            onClick={() => onApprove(editXp)}
            className="bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg p-1.5 transition-colors"
            title="Genehmigen"
          >
            <CheckCircleIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onReject}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg p-1.5 transition-colors"
            title="Ablehnen"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({ userName, role, memberId }: DashboardClientProps) {
  return (
    <AppShell>
      <DashboardContent userName={userName} role={role} memberId={memberId} />
    </AppShell>
  );
}
