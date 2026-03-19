"use client";

import { useState } from "react";
import type { Chore, HouseholdMember, Completion } from "@/lib/types";

const PERIODS = [
  { label: "Alle",    days: 0  },
  { label: "30 Tage", days: 30 },
  { label: "14 Tage", days: 14 },
  { label: "7 Tage",  days: 7  },
] as const;

export default function StatistikView({
  chores,
  members,
  completions,
}: {
  chores: Chore[];
  members: HouseholdMember[];
  completions: Completion[];
}) {
  const [periodDays, setPeriodDays] = useState<number>(0);

  const cutoff = periodDays > 0
    ? new Date(Date.now() - periodDays * 86400000).toISOString().split("T")[0]
    : null;

  const filtered = cutoff ? completions.filter((c) => c.date >= cutoff) : completions;

  const counts: Record<string, Record<string, number>> = {};
  for (const c of filtered) {
    if (!c.choreId) continue;
    if (!counts[c.choreId]) counts[c.choreId] = {};
    counts[c.choreId][c.childId] = (counts[c.choreId][c.childId] ?? 0) + 1;
  }

  const activeChoreIdSet = new Set(Object.keys(counts));
  const relevantChores = chores.filter((ch) => activeChoreIdSet.has(ch.id));

  const memberTotals: Record<string, number> = {};
  members.forEach((m) => {
    memberTotals[m.id] = Object.values(counts).reduce((s, map) => s + (map[m.id] ?? 0), 0);
  });

  const choreTotal: Record<string, number> = {};
  relevantChores.forEach((chore) => {
    choreTotal[chore.id] = members.reduce((s, m) => s + (counts[chore.id]?.[m.id] ?? 0), 0);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {PERIODS.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => setPeriodDays(days)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              periodDays === days ? "bg-purple-600 text-white" : "bg-white/10 text-white/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        {members.map((m) => (
          <div key={m.id} className="flex-1 glass rounded-2xl p-3 text-center">
            <span className="text-2xl">{m.avatar}</span>
            <p className="text-white font-bold mt-1 text-sm">{m.name}</p>
            <p className="text-2xl font-black text-purple-300">{memberTotals[m.id] ?? 0}</p>
            <p className="text-white/40 text-xs">Erledigungen</p>
          </div>
        ))}
      </div>

      {relevantChores.length === 0 ? (
        <p className="text-white/40 text-center py-8">Noch keine Erledigungen im gewählten Zeitraum</p>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/10">
            <span className="flex-1 text-xs font-semibold text-white/50 uppercase tracking-wider">Aufgabe</span>
            {members.map((m) => (
              <span key={m.id} className="w-12 text-center text-base" title={m.name}>{m.avatar}</span>
            ))}
            <span className="w-10 text-center text-xs font-semibold text-white/30 uppercase">∑</span>
          </div>
          {relevantChores
            .slice()
            .sort((a, b) => choreTotal[b.id] - choreTotal[a.id])
            .map((chore) => {
              const total  = choreTotal[chore.id];
              const maxCnt = members.reduce((max, m) => Math.max(max, counts[chore.id]?.[m.id] ?? 0), 0);
              return (
                <div key={chore.id} className="flex items-center gap-2 px-4 py-3 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-lg shrink-0">{chore.emoji}</span>
                    <span className="text-white/80 text-sm truncate">{chore.title}</span>
                  </div>
                  {members.map((m) => {
                    const cnt = counts[chore.id]?.[m.id] ?? 0;
                    return (
                      <span
                        key={m.id}
                        className={`w-12 text-center text-sm font-bold ${
                          cnt === maxCnt && cnt > 0 ? "text-green-300" : cnt > 0 ? "text-white/70" : "text-white/20"
                        }`}
                      >
                        {cnt || "–"}
                      </span>
                    );
                  })}
                  <span className="w-10 text-center text-xs text-white/40">{total}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
