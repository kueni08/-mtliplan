"use client";

import AppShell from "@/components/AppShell";
import StatistikView from "@/components/StatistikView";
import { useAppStore } from "@/store/useAppStore";

export default function StatistikClient() {
  const { data } = useAppStore();
  if (!data) return null;
  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        <h1 className="text-2xl font-black text-white">📊 Statistik</h1>
        <StatistikView
          chores={data.chores}
          members={data.settings.children}
          completions={data.completions.filter((c) => c.approved)}
        />
      </div>
    </AppShell>
  );
}
