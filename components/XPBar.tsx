"use client";

interface XPBarProps {
  current: number;
  total: number;
  percent: number;
  color?: "purple" | "orange";
}

export default function XPBar({ current, total, percent, color = "purple" }: XPBarProps) {
  const gradient =
    color === "orange"
      ? "from-yellow-400 to-orange-500"
      : "from-purple-400 to-violet-600";

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
