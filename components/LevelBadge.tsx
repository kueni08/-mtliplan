"use client";

import { LEVELS } from "@/lib/gamification";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

export default function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const info = LEVELS.find((l) => l.level === level) ?? LEVELS[0];

  const sizes = {
    sm: { emoji: "text-lg", text: "text-xs", padding: "px-2 py-1" },
    md: { emoji: "text-2xl", text: "text-sm", padding: "px-3 py-1.5" },
    lg: { emoji: "text-4xl", text: "text-base", padding: "px-4 py-2" },
  };

  const s = sizes[size];

  return (
    <div className={`inline-flex items-center gap-1.5 bg-white/10 rounded-full ${s.padding} border border-white/20`}>
      <span className={s.emoji}>{info.emoji}</span>
      <div>
        <div className={`${s.text} font-bold text-white`}>Level {level}</div>
        <div className={`text-xs ${info.color} leading-none`}>{info.label}</div>
      </div>
    </div>
  );
}
