"use client";

import { useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import type { Chore, MemberColor } from "@/lib/types";
import { COLOR_MAP } from "@/lib/colors";

interface ChoreCardProps {
  chore: Chore;
  completed: boolean;
  pending: boolean;
  onComplete: () => void;
  childColor?: MemberColor;
}

const categoryColors: Record<string, string> = {
  küche: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  zimmer: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  haus: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  sonstiges: "from-gray-500/20 to-slate-500/20 border-gray-500/30",
};

export default function ChoreCard({
  chore,
  completed,
  pending,
  onComplete,
  childColor = "purple",
}: ChoreCardProps) {
  const [pressed, setPressed] = useState(false);
  const colorClass = categoryColors[chore.category] ?? categoryColors.sonstiges;
  const { text: xpColor, bg: btnColor } = COLOR_MAP[childColor];

  const handlePress = () => {
    if (completed || pending) return;
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      onComplete();
    }, 200);
  };

  return (
    <div
      className={`glass rounded-2xl p-4 bg-gradient-to-br ${colorClass} transition-all duration-200 ${
        pressed ? "scale-95" : "scale-100"
      } ${completed || pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-3xl">{chore.emoji}</span>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{chore.title}</p>
            <p className={`text-sm font-bold ${xpColor}`}>+{chore.xp} XP</p>
          </div>
        </div>

        {completed ? (
          <CheckCircleIcon className="w-8 h-8 text-green-400 shrink-0" />
        ) : pending ? (
          <div className="text-xs text-yellow-300 bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1 shrink-0">
            Wartet...
          </div>
        ) : (
          <button
            onClick={handlePress}
            className={`${btnColor} text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-90 transition-all shrink-0`}
          >
            Erledigt!
          </button>
        )}
      </div>
    </div>
  );
}
