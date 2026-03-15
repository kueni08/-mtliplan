"use client";

interface CharacterAvatarProps {
  theme: "evoli" | "shire";
  level: number;
  size?: "sm" | "md";
}

/**
 * Level-based SVG character avatars.
 * Evoli (Eevee) for Nils, Shire Horse for Lou.
 * Each level makes the character visibly bigger with added details.
 */
export default function CharacterAvatar({ theme, level, size = "md" }: CharacterAvatarProps) {
  const clampedLevel = Math.min(Math.max(level, 1), 5);
  // sm = dashboard cards (smaller), md = kind profile (full size)
  const smSizes = [40, 48, 56, 64, 72];
  const mdSizes = [64, 82, 100, 120, 140];
  const px = size === "sm" ? smSizes[clampedLevel - 1] : mdSizes[clampedLevel - 1];

  if (theme === "evoli") return <EvoliSVG level={clampedLevel} px={px} />;
  if (theme === "shire") return <ShireSVG level={clampedLevel} px={px} />;
  return null;
}

function EvoliSVG({ level, px }: { level: number; px: number }) {
  const tan = "#C8A870";
  const dark = "#7A5030";
  const cream = "#F2E4C4";
  const eye = "#1E1008";
  const purple = "#9B59B6";
  const gold = "#F5C400";

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Evoli Level ${level}`}
    >
      {/* L4+: purple glow ring */}
      {level >= 4 && (
        <circle cx="50" cy="36" r="22" fill="none" stroke={purple} strokeWidth="3" opacity="0.5" />
      )}

      {/* Tail (behind body) */}
      <path
        d="M63,68 Q82,58 87,42 Q92,28 78,33 Q68,37 65,55 Z"
        fill={tan}
      />
      {/* Tail cream tip */}
      <ellipse cx="80" cy="33" rx="5" ry="4" fill={cream} />

      {/* Body */}
      <ellipse cx="50" cy="67" rx="21" ry="18" fill={tan} />

      {/* Cream ruff/collar */}
      <ellipse cx="50" cy="52" rx="21" ry="13" fill={cream} />
      <ellipse cx="42" cy="55" rx="8" ry="7" fill={cream} />
      <ellipse cx="58" cy="55" rx="8" ry="7" fill={cream} />
      <ellipse cx="50" cy="57" rx="10" ry="7" fill={cream} />

      {/* Neck connecting piece */}
      <ellipse cx="50" cy="51" rx="8" ry="7" fill={tan} />

      {/* Head */}
      <circle cx="50" cy="34" r="18" fill={tan} />

      {/* Left ear */}
      <polygon points="36,21 29,5 44,17" fill={dark} />
      <polygon points="37,21 32,10 43,18" fill={cream} />

      {/* Right ear */}
      <polygon points="64,21 71,5 56,17" fill={dark} />
      <polygon points="63,21 68,10 57,18" fill={cream} />

      {/* Eyes */}
      <circle cx="43" cy="33" r="5.5" fill={eye} />
      <circle cx="57" cy="33" r="5.5" fill={eye} />

      {/* Eye shine (L2+) */}
      {level >= 2 ? (
        <>
          <circle cx="45" cy="31" r="2" fill="white" />
          <circle cx="59" cy="31" r="2" fill="white" />
        </>
      ) : (
        <>
          <circle cx="44.5" cy="31.5" r="1.2" fill="white" />
          <circle cx="58.5" cy="31.5" r="1.2" fill="white" />
        </>
      )}

      {/* Nose */}
      <ellipse cx="50" cy="41" rx="2.5" ry="1.8" fill={dark} />

      {/* Mouth */}
      <path
        d="M46.5,44 Q50,48 53.5,44"
        stroke={dark}
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Front paws */}
      <ellipse cx="38" cy="81" rx="7" ry="5" fill={tan} />
      <ellipse cx="62" cy="81" rx="7" ry="5" fill={tan} />

      {/* Paw toes */}
      <ellipse cx="34" cy="83" rx="2" ry="1.5" fill={dark} opacity="0.4" />
      <ellipse cx="38" cy="84" rx="2" ry="1.5" fill={dark} opacity="0.4" />
      <ellipse cx="42" cy="83" rx="2" ry="1.5" fill={dark} opacity="0.4" />

      {/* L3+: sparkles */}
      {level >= 3 && (
        <>
          <text x="14" y="28" fontSize="9" fill={gold}>✦</text>
          <text x="77" y="22" fontSize="7" fill={gold}>✦</text>
          <text x="18" y="72" fontSize="6" fill={gold}>✦</text>
          <text x="74" y="70" fontSize="7" fill={gold}>✦</text>
        </>
      )}

      {/* L5: golden crown */}
      {level >= 5 && (
        <>
          <path
            d="M38,17 L41,8 L46,15 L50,6 L54,15 L59,8 L62,17 Z"
            fill={gold}
            stroke="#D4A800"
            strokeWidth="0.8"
          />
          <rect x="38" y="16" width="24" height="3" rx="1.5" fill={gold} />
        </>
      )}
    </svg>
  );
}

function ShireSVG({ level, px }: { level: number; px: number }) {
  const brown = "#3C2010";
  const midBrown = "#5C3420";
  const lightBrown = "#7A4A28";
  const white = "#F4F0E8";
  const maneColor = level >= 5 ? "#C8960A" : "#1A0C04";
  const gold = "#F5C400";
  const feather = "#EDE8D8";
  const hoof = "#140A04";

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Shire Horse Level ${level}`}
    >
      {/* L5: golden aura */}
      {level >= 5 && (
        <ellipse cx="48" cy="62" rx="34" ry="28" fill="none" stroke={gold} strokeWidth="2" opacity="0.4" />
      )}

      {/* Tail (left side) */}
      <path
        d="M22,58 Q10,52 8,40 Q6,28 14,32 Q20,36 22,50 Z"
        fill={maneColor}
        opacity={level >= 4 ? 1 : 0.85}
      />

      {/* Body */}
      <ellipse cx="48" cy="64" rx="27" ry="21" fill={midBrown} />

      {/* Rump highlight */}
      <ellipse cx="34" cy="58" rx="14" ry="10" fill={brown} opacity="0.5" />

      {/* Neck */}
      <path
        d="M58,44 Q62,34 68,28 Q72,24 74,30 Q72,38 66,46 Q62,52 58,54 Z"
        fill={lightBrown}
      />

      {/* Head */}
      <ellipse cx="74" cy="26" rx="12" ry="15" fill={lightBrown} />

      {/* Muzzle */}
      <ellipse cx="80" cy="34" rx="8" ry="6" fill={midBrown} />

      {/* Eye */}
      <circle cx="70" cy="22" r="3.5" fill="#0E0804" />
      <circle cx="71" cy="21" r="1.2" fill="white" />

      {/* Blaze (white marking) */}
      <ellipse cx="75" cy="27" rx="3" ry="6" fill={white} />

      {/* Nostril */}
      <ellipse cx="82" cy="36" rx="2" ry="1.5" fill={brown} />

      {/* Ear */}
      <polygon points="66,14 64,6 72,12" fill={midBrown} />
      <polygon points="67,14 65,8 71,13" fill="#8B5E38" />

      {/* Legs */}
      <rect x="28" y="80" width="9" height="16" rx="3" fill={midBrown} />
      <rect x="40" y="82" width="9" height="14" rx="3" fill={midBrown} />
      <rect x="55" y="82" width="9" height="14" rx="3" fill={lightBrown} />
      <rect x="67" y="80" width="9" height="16" rx="3" fill={lightBrown} />

      {/* Hooves */}
      <rect x="28" y="92" width="9" height="4" rx="2" fill={hoof} />
      <rect x="40" y="92" width="9" height="4" rx="2" fill={hoof} />
      <rect x="55" y="92" width="9" height="4" rx="2" fill={hoof} />
      <rect x="67" y="92" width="9" height="4" rx="2" fill={hoof} />

      {/* L2+: simple mane strokes */}
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
          <text x="6" y="22" fontSize="9" fill={gold}>✦</text>
          <text x="86" y="44" fontSize="7" fill={gold}>✦</text>
          <text x="8" y="72" fontSize="6" fill={gold}>✦</text>
          <text x="80" y="72" fontSize="7" fill={gold}>✦</text>
        </>
      )}
    </svg>
  );
}
