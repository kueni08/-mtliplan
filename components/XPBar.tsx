"use client";

import type { MemberColor } from "@/lib/types";

interface XPBarProps {
  current: number;
  total: number;
  percent: number;
  color?: MemberColor;
}

const GRADIENT: Record<MemberColor, string> = {
  purple: "from-purple-400 to-violet-600",
  orange: "from-yellow-400 to-orange-500",
  blue:   "from-blue-400 to-cyan-500",
  green:  "from-green-400 to-emerald-500",
  red:    "from-red-400 to-rose-500",
  pink:   "from-pink-400 to-fuchsia-500",
  yellow: "from-yellow-300 to-amber-500",
};

export default function XPBar({ current, total, percent, color = "purple" }: XPBarProps) {
  const gradient = GRADIENT[color];

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-white/60">
        <span>{current} XP</span>
        <span>{total} XP</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradient} rounded-full xp-bar-fill transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
