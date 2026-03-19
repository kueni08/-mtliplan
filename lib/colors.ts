import type { MemberColor } from "./types";

export const COLOR_MAP: Record<MemberColor, {
  text:     string; // XP number color
  bg:       string; // solid bg for buttons / badges
  gradient: string; // profile header gradient classes
  ring:     string; // focus ring
}> = {
  purple: { text: "text-purple-300", bg: "bg-purple-600",  gradient: "from-purple-900/30 to-violet-900/20",   ring: "focus:ring-purple-500/50" },
  orange: { text: "text-orange-300", bg: "bg-orange-500",  gradient: "from-orange-900/30 to-yellow-900/20",   ring: "focus:ring-orange-500/50" },
  blue:   { text: "text-blue-300",   bg: "bg-blue-600",    gradient: "from-blue-900/30 to-cyan-900/20",       ring: "focus:ring-blue-500/50"   },
  green:  { text: "text-green-300",  bg: "bg-green-600",   gradient: "from-green-900/30 to-emerald-900/20",   ring: "focus:ring-green-500/50"  },
  red:    { text: "text-red-300",    bg: "bg-red-500",     gradient: "from-red-900/30 to-rose-900/20",        ring: "focus:ring-red-500/50"    },
  pink:   { text: "text-pink-300",   bg: "bg-pink-500",    gradient: "from-pink-900/30 to-fuchsia-900/20",    ring: "focus:ring-pink-500/50"   },
  yellow: { text: "text-yellow-300", bg: "bg-yellow-500",  gradient: "from-yellow-900/30 to-amber-900/20",    ring: "focus:ring-yellow-500/50" },
};

export const COLOR_PICKER_OPTIONS: { value: MemberColor; label: string }[] = [
  { value: "purple", label: "🟣 Lila"   },
  { value: "orange", label: "🟠 Orange" },
  { value: "blue",   label: "🔵 Blau"   },
  { value: "green",  label: "🟢 Grün"   },
  { value: "red",    label: "🔴 Rot"    },
  { value: "pink",   label: "🩷 Pink"   },
  { value: "yellow", label: "🟡 Gelb"   },
];
