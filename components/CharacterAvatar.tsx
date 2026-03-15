"use client";

interface CharacterAvatarProps {
  theme: "evoli" | "shire";
  level: number;
  size?: "sm" | "md" | "lg";
}

const SIZE_SM = [40, 48, 56, 64, 72];
const SIZE_MD = [64, 82, 100, 120, 140];
const SIZE_LG = [80, 100, 120, 140, 160];

export default function CharacterAvatar({ theme, level, size = "md" }: CharacterAvatarProps) {
  const idx = Math.min(Math.max(level, 1), 5) - 1;
  const px =
    size === "sm" ? SIZE_SM[idx]
    : size === "lg" ? SIZE_LG[idx]
    : SIZE_MD[idx];
  const clamped = idx + 1;

  if (theme === "evoli") return <EvoliSVG level={clamped} px={px} />;
  if (theme === "shire") return <ShireSVG level={clamped} px={px} />;
  return null;
}

// ─── Eevee / Evoli ────────────────────────────────────────────────────────────
// Accurate to the original: large round head, fluffy cream collar (3-layer ruff),
// pointed ears with cream inner, pink nose, dark expressive eyes, bushy fan tail.
function EvoliSVG({ level, px }: { level: number; px: number }) {
  const tan       = "#C49A52"; // main body tan
  const lightTan  = "#D4B870"; // lighter highlight
  const darkBrown = "#4A2A10"; // outlines / mouth
  const cream     = "#EDE0B8"; // collar, inner ear, tail tip
  const eyeColor  = "#1A0E08"; // very dark eyes
  const noseColor = "#D06070"; // pink nose
  const purple    = "#9B59B6"; // level-4 aura
  const gold      = "#F5C400"; // level-5 crown / sparkles

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label={`Evoli Level ${level}`}>

      {/* L4+: purple evolution aura */}
      {level >= 4 && (
        <ellipse cx="50" cy="58" rx="40" ry="34" fill="none" stroke={purple} strokeWidth="2.5" opacity="0.45" />
      )}

      {/* ── TAIL: fan shape on right side, behind body ── */}
      <path d="M58,74 C70,62 82,48 81,32 C80,18 68,20 66,32 C64,46 62,60 60,73 Z" fill={tan} />
      {/* Cream tail tip — the distinctive white/cream band of Eevee's tail */}
      <ellipse cx="73" cy="25" rx="9" ry="7" transform="rotate(-20 73 25)" fill={cream} />
      <path d="M61,74 C72,63 82,50 80,34" stroke={darkBrown} strokeWidth="0.6" fill="none" opacity="0.18" />

      {/* ── BODY ── */}
      <ellipse cx="50" cy="79" rx="19" ry="15" fill={tan} />
      <ellipse cx="50" cy="81" rx="11" ry="10" fill={lightTan} opacity="0.7" />

      {/* ── FLUFFY COLLAR / RUFF — Eevee's most iconic feature ──
          Three layers of creamy puffs surround the neck. */}
      <ellipse cx="50" cy="64" rx="27" ry="9"  fill={cream} />   {/* wide base */}
      <ellipse cx="33" cy="59" rx="13" ry="10" fill={cream} />   {/* left puff */}
      <ellipse cx="67" cy="59" rx="13" ry="10" fill={cream} />   {/* right puff */}
      <ellipse cx="50" cy="55" rx="18" ry="11" fill={cream} />   {/* front centre puff */}
      <ellipse cx="50" cy="55" rx="9"  ry="7"  fill={tan}   />   {/* neck (tan over collar) */}

      {/* ── HEAD — large and round ── */}
      <circle cx="50" cy="34" r="21" fill={tan} />
      <ellipse cx="50" cy="24" rx="12" ry="8" fill={lightTan} opacity="0.45" />

      {/* ── EARS: tall pointed, cream inner ── */}
      <polygon points="29,18 20,1 42,14"  fill={tan}   />
      <polygon points="30,18 23,4 41,14"  fill={cream}  />
      <polygon points="71,18 80,1 58,14"  fill={tan}   />
      <polygon points="70,18 77,4 59,14"  fill={cream}  />

      {/* ── EYES — large, dark, expressive ── */}
      <ellipse cx="42" cy="34" rx="5.5" ry="6"   fill={eyeColor} />
      <ellipse cx="58" cy="34" rx="5.5" ry="6"   fill={eyeColor} />
      {/* Main eye shine (bigger at L2+) */}
      <circle cx="44" cy="31" r={level >= 2 ? 2.3 : 1.5} fill="white" />
      <circle cx="60" cy="31" r={level >= 2 ? 2.3 : 1.5} fill="white" />
      {/* Lower micro-reflection (L2+) */}
      {level >= 2 && (
        <>
          <circle cx="43"   cy="37.5" r="1.2" fill="white" opacity="0.4" />
          <circle cx="59"   cy="37.5" r="1.2" fill="white" opacity="0.4" />
        </>
      )}

      {/* ── NOSE — small pink oval ── */}
      <ellipse cx="50" cy="41" rx="2.8" ry="2.2" fill={noseColor} />
      <ellipse cx="49.5" cy="40.3" rx="1" ry="0.8" fill="white" opacity="0.45" />

      {/* ── MOUTH ── */}
      <path d="M47,44 Q50,47.5 53,44" stroke={darkBrown} strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* ── FRONT PAWS ── */}
      <ellipse cx="38" cy="92" rx="8" ry="5" fill={tan} />
      <ellipse cx="62" cy="92" rx="8" ry="5" fill={tan} />
      <path d="M35,92 Q38,94 41,92" stroke={darkBrown} strokeWidth="0.8" fill="none" opacity="0.32" />
      <path d="M59,92 Q62,94 65,92" stroke={darkBrown} strokeWidth="0.8" fill="none" opacity="0.32" />

      {/* ── L3+: sparkles ── */}
      {level >= 3 && (
        <>
          <text x="7"  y="25" fontSize="9" fill={gold}>✦</text>
          <text x="80" y="17" fontSize="7" fill={gold}>✦</text>
          <text x="5"  y="72" fontSize="6" fill={gold}>✦</text>
          <text x="80" y="77" fontSize="7" fill={gold}>✦</text>
        </>
      )}

      {/* ── L5: golden crown ── */}
      {level >= 5 && (
        <>
          <path d="M37,15 L40,6 L45,13 L50,4 L55,13 L60,6 L63,15 Z" fill={gold} stroke="#C8A000" strokeWidth="0.8" />
          <rect x="37" y="14" width="26" height="3" rx="1.5" fill={gold} />
        </>
      )}
    </svg>
  );
}

// ─── Shire Horse ──────────────────────────────────────────────────────────────
function ShireSVG({ level, px }: { level: number; px: number }) {
  const brown      = "#3C2010";
  const midBrown   = "#5C3420";
  const lightBrown = "#7A4A28";
  const white      = "#F4F0E8";
  const maneColor  = level >= 5 ? "#C8960A" : "#1A0C04";
  const gold       = "#F5C400";
  const feather    = "#EDE8D8";
  const hoof       = "#140A04";

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label={`Shire Horse Level ${level}`}>

      {/* L5: golden aura */}
      {level >= 5 && (
        <ellipse cx="48" cy="62" rx="34" ry="28" fill="none" stroke={gold} strokeWidth="2" opacity="0.4" />
      )}

      {/* Tail */}
      <path d="M22,58 Q10,52 8,40 Q6,28 14,32 Q20,36 22,50 Z" fill={maneColor} opacity={level >= 4 ? 1 : 0.85} />

      {/* Body */}
      <ellipse cx="48" cy="64" rx="27" ry="21" fill={midBrown} />
      <ellipse cx="34" cy="58" rx="14" ry="10" fill={brown} opacity="0.5" />

      {/* Neck */}
      <path d="M58,44 Q62,34 68,28 Q72,24 74,30 Q72,38 66,46 Q62,52 58,54 Z" fill={lightBrown} />

      {/* Head */}
      <ellipse cx="74" cy="26" rx="12" ry="15" fill={lightBrown} />
      <ellipse cx="80" cy="34" rx="8"  ry="6"  fill={midBrown} />

      {/* Eye */}
      <circle cx="70" cy="22" r="3.5" fill="#0E0804" />
      <circle cx="71" cy="21" r="1.2" fill="white" />

      {/* Blaze (white forehead marking) */}
      <ellipse cx="75" cy="27" rx="3" ry="6" fill={white} />

      {/* Nostril */}
      <ellipse cx="82" cy="36" rx="2" ry="1.5" fill={brown} />

      {/* Ear */}
      <polygon points="66,14 64,6 72,12"  fill={midBrown}   />
      <polygon points="67,14 65,8 71,13"  fill="#8B5E38"    />

      {/* Legs */}
      <rect x="28" y="80" width="9" height="16" rx="3" fill={midBrown}   />
      <rect x="40" y="82" width="9" height="14" rx="3" fill={midBrown}   />
      <rect x="55" y="82" width="9" height="14" rx="3" fill={lightBrown} />
      <rect x="67" y="80" width="9" height="16" rx="3" fill={lightBrown} />

      {/* Hooves */}
      <rect x="28" y="92" width="9" height="4" rx="2" fill={hoof} />
      <rect x="40" y="92" width="9" height="4" rx="2" fill={hoof} />
      <rect x="55" y="92" width="9" height="4" rx="2" fill={hoof} />
      <rect x="67" y="92" width="9" height="4" rx="2" fill={hoof} />

      {/* L2+: simple mane */}
      {level >= 2 && (
        <>
          <path d="M63,18 Q65,26 63,36 Q61,44 60,50" stroke={maneColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M66,19 Q69,27 67,38 Q65,46 64,52" stroke={maneColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* L3+: white feathering at hooves */}
      {level >= 3 && (
        <>
          <ellipse cx="32" cy="94" rx="7" ry="3" fill={feather} />
          <ellipse cx="44" cy="94" rx="7" ry="3" fill={feather} />
          <ellipse cx="59" cy="94" rx="7" ry="3" fill={feather} />
          <ellipse cx="71" cy="94" rx="7" ry="3" fill={feather} />
        </>
      )}

      {/* L4+: full flowing mane */}
      {level >= 4 && (
        <>
          <path d="M61,16 Q56,28 54,42 Q53,54 55,62" stroke={maneColor} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M64,17 Q60,30 58,44 Q57,56 59,63" stroke={maneColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M67,18 Q64,31 62,45 Q61,57 63,63" stroke={maneColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* L5: golden sparkles */}
      {level >= 5 && (
        <>
          <text x="6"  y="22" fontSize="9" fill={gold}>✦</text>
          <text x="86" y="44" fontSize="7" fill={gold}>✦</text>
          <text x="8"  y="72" fontSize="6" fill={gold}>✦</text>
          <text x="80" y="72" fontSize="7" fill={gold}>✦</text>
        </>
      )}
    </svg>
  );
}
