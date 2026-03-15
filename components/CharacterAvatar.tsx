"use client";

import type { CharacterTheme } from "@/lib/types";

interface CharacterAvatarProps {
  theme: CharacterTheme;
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

  switch (theme) {
    case "evoli":     return <EvoliSVG      level={clamped} px={px} />;
    case "shire":     return <ShireSVG      level={clamped} px={px} />;
    case "pikachu":   return <PikachuSVG    level={clamped} px={px} />;
    case "charmander":return <CharmanderSVG level={clamped} px={px} />;
    case "togepi":    return <TogepiSVG     level={clamped} px={px} />;
    case "jigglypuff":return <JigglypuffSVG level={clamped} px={px} />;
    case "squirtle":  return <SquirtleSVG   level={clamped} px={px} />;
    default:          return null;
  }
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

// ─── Pikachu ──────────────────────────────────────────────────────────────────
function PikachuSVG({ level, px }: { level: number; px: number }) {
  const yellow     = "#F8D030";
  const darkYellow = "#C0A020";
  const dark       = "#3C3C3C";
  const red        = "#C03028";
  const brown      = "#705848";
  const gold       = "#F5C400";

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label={`Pikachu Level ${level}`}>
      {level >= 4 && <ellipse cx="50" cy="60" rx="40" ry="34" fill="none" stroke={yellow} strokeWidth="2.5" opacity="0.45" />}

      {/* Lightning bolt tail */}
      <path d="M64,82 L72,68 L66,68 L76,52 L68,52 L78,36 L60,58 L67,58 L56,74 L63,74 Z" fill={yellow} stroke={brown} strokeWidth="0.8" />
      {/* Tail brown stripe */}
      <path d="M68,82 L74,70 L69,70 L79,54 L71,54" stroke={brown} strokeWidth="2" fill="none" opacity="0.5" />

      {/* Body */}
      <ellipse cx="46" cy="76" rx="20" ry="17" fill={yellow} />
      {/* Belly */}
      <ellipse cx="46" cy="79" rx="11" ry="11" fill={darkYellow} opacity="0.5" />

      {/* HEAD */}
      <circle cx="46" cy="36" r="22" fill={yellow} />

      {/* Left ear — pointy with black tip */}
      <polygon points="28,17 24,0 38,14" fill={yellow} />
      <polygon points="29,14 26,2 37,13" fill={dark} opacity="0.85" />

      {/* Right ear */}
      <polygon points="64,17 68,0 54,14" fill={yellow} />
      <polygon points="63,14 66,2 55,13" fill={dark} opacity="0.85" />

      {/* Eyes */}
      <ellipse cx="39" cy="34" rx="5" ry="5.5" fill={dark} />
      <ellipse cx="53" cy="34" rx="5" ry="5.5" fill={dark} />
      <circle cx="41" cy="31" r={level >= 2 ? 2.2 : 1.4} fill="white" />
      <circle cx="55" cy="31" r={level >= 2 ? 2.2 : 1.4} fill="white" />

      {/* Red cheek circles — Pikachu's signature */}
      <ellipse cx="32" cy="44" rx="6.5" ry="5" fill={red} opacity="0.85" />
      <ellipse cx="60" cy="44" rx="6.5" ry="5" fill={red} opacity="0.85" />

      {/* Nose */}
      <ellipse cx="46" cy="41" rx="2.5" ry="1.8" fill={dark} opacity="0.7" />

      {/* Mouth */}
      <path d="M43,44.5 Q46,48 49,44.5" stroke={dark} strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Tiny front paws */}
      <ellipse cx="34" cy="91" rx="7" ry="4.5" fill={yellow} />
      <ellipse cx="58" cy="91" rx="7" ry="4.5" fill={yellow} />

      {level >= 3 && (
        <>
          <text x="6"  y="24" fontSize="9" fill={gold}>✦</text>
          <text x="80" y="18" fontSize="7" fill={gold}>✦</text>
          <text x="5"  y="74" fontSize="6" fill={gold}>✦</text>
        </>
      )}
      {level >= 5 && (
        <>
          <path d="M35,15 L38,6 L43,13 L46,4 L49,13 L54,6 L57,15 Z" fill={gold} stroke="#C8A000" strokeWidth="0.8" />
          <rect x="35" y="14" width="22" height="3" rx="1.5" fill={gold} />
        </>
      )}
    </svg>
  );
}

// ─── Charmander / Glumanda ────────────────────────────────────────────────────
function CharmanderSVG({ level, px }: { level: number; px: number }) {
  const orange      = "#F08030";
  const lightOrange = "#FAC060";
  const dark        = "#3C2010";
  const eyeBlue     = "#6890F0";
  const flameYellow = "#F8D030";
  const flameRed    = "#F03030";
  const gold        = "#F5C400";

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label={`Glumanda Level ${level}`}>
      {level >= 4 && <ellipse cx="50" cy="60" rx="40" ry="34" fill="none" stroke={orange} strokeWidth="2.5" opacity="0.45" />}

      {/* Flame tail */}
      <path d="M62,78 C70,68 72,56 68,44" stroke={orange} strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Flame at tip */}
      <ellipse cx="66" cy="40" rx="7" ry="9" fill={flameYellow} />
      <ellipse cx="66" cy="38" rx="4.5" ry="6" fill={flameRed} />
      <ellipse cx="66" cy="36" rx="2.5" ry="3.5" fill="white" opacity="0.7" />
      {level >= 3 && (
        <>
          <ellipse cx="60" cy="42" rx="5" ry="7" fill={flameYellow} opacity="0.6" />
          <ellipse cx="72" cy="42" rx="4" ry="6" fill={flameYellow} opacity="0.6" />
        </>
      )}

      {/* Body */}
      <ellipse cx="46" cy="76" rx="19" ry="16" fill={orange} />
      {/* Lighter belly */}
      <ellipse cx="46" cy="79" rx="11" ry="11" fill={lightOrange} opacity="0.7" />

      {/* Neck */}
      <ellipse cx="46" cy="58" rx="10" ry="8" fill={orange} />

      {/* HEAD */}
      <circle cx="46" cy="36" r="20" fill={orange} />
      <ellipse cx="46" cy="46" rx="11" ry="7" fill={lightOrange} opacity="0.7" />

      {/* Eyes — blue-green */}
      <ellipse cx="40" cy="33" rx="5" ry="5.5" fill={eyeBlue} />
      <ellipse cx="52" cy="33" rx="5" ry="5.5" fill={eyeBlue} />
      <circle cx="42" cy="30" r={level >= 2 ? 2.2 : 1.5} fill="white" />
      <circle cx="54" cy="30" r={level >= 2 ? 2.2 : 1.5} fill="white" />
      {/* Dark pupil */}
      <circle cx="41" cy="34" r="1.8" fill={dark} opacity="0.5" />
      <circle cx="53" cy="34" r="1.8" fill={dark} opacity="0.5" />

      {/* Nose */}
      <ellipse cx="46" cy="41" rx="2.5" ry="1.8" fill={dark} opacity="0.5" />
      {/* Mouth */}
      <path d="M43,44 Q46,47.5 49,44" stroke={dark} strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Tiny claws / paws */}
      <ellipse cx="33" cy="91" rx="7" ry="4.5" fill={orange} />
      <ellipse cx="58" cy="91" rx="7" ry="4.5" fill={orange} />

      {level >= 3 && (
        <>
          <text x="7"  y="22" fontSize="9" fill={gold}>✦</text>
          <text x="78" y="16" fontSize="7" fill={gold}>✦</text>
          <text x="6"  y="72" fontSize="6" fill={gold}>✦</text>
        </>
      )}
      {level >= 5 && (
        <>
          <path d="M35,16 L38,7 L43,14 L46,5 L49,14 L54,7 L57,16 Z" fill={gold} stroke="#C8A000" strokeWidth="0.8" />
          <rect x="35" y="15" width="22" height="3" rx="1.5" fill={gold} />
        </>
      )}
    </svg>
  );
}

// ─── Togepi ───────────────────────────────────────────────────────────────────
function TogepiSVG({ level, px }: { level: number; px: number }) {
  const white   = "#F8F8F0";
  const cream   = "#EEE8D0";
  const red     = "#E83030";
  const blue    = "#3050C0";
  const dark    = "#303030";
  const gold    = "#F5C400";

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label={`Togepi Level ${level}`}>
      {level >= 4 && <ellipse cx="50" cy="62" rx="36" ry="30" fill="none" stroke="#F0C040" strokeWidth="2.5" opacity="0.4" />}

      {/* Egg body — wide oval */}
      <ellipse cx="50" cy="68" rx="24" ry="27" fill={white} />

      {/* Coloured triangle pattern on lower half */}
      <ellipse cx="50" cy="82" rx="24" ry="14" fill={cream} />
      {/* Red triangles */}
      <polygon points="34,90 42,72 50,90" fill={red} opacity="0.8" />
      <polygon points="62,88 70,70 78,88" fill={red} opacity="0.7" />
      {/* Blue triangles */}
      <polygon points="48,90 56,74 64,90" fill={blue} opacity="0.8" />
      <polygon points="26,92 34,78 42,92" fill={blue} opacity="0.6" />

      {/* Tiny arms sticking out */}
      <ellipse cx="26" cy="64" rx="6" ry="4" fill={white} transform="rotate(-30 26 64)" />
      <ellipse cx="74" cy="64" rx="6" ry="4" fill={white} transform="rotate(30 74 64)" />

      {/* HEAD area (top of egg) */}
      <ellipse cx="50" cy="48" rx="18" ry="16" fill={white} />

      {/* Spikes on top */}
      <polygon points="40,36 38,22 46,32" fill={white} stroke={cream} strokeWidth="0.5" />
      <polygon points="50,34 49,18 55,30" fill={white} stroke={cream} strokeWidth="0.5" />
      <polygon points="60,36 62,22 54,32" fill={white} stroke={cream} strokeWidth="0.5" />

      {/* Eyes — large, round */}
      <ellipse cx="43" cy="48" rx="5.5" ry="6" fill={dark} />
      <ellipse cx="57" cy="48" rx="5.5" ry="6" fill={dark} />
      <circle cx="45" cy="45" r={level >= 2 ? 2.2 : 1.5} fill="white" />
      <circle cx="59" cy="45" r={level >= 2 ? 2.2 : 1.5} fill="white" />

      {/* Small teeth */}
      <rect x="47" y="55" width="3" height="3" rx="1" fill="white" />
      <rect x="51" y="55" width="3" height="3" rx="1" fill="white" />
      <path d="M43,55 Q50,60 57,55" stroke={dark} strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Tiny feet */}
      <ellipse cx="40" cy="94" rx="7" ry="4" fill={cream} />
      <ellipse cx="60" cy="94" rx="7" ry="4" fill={cream} />

      {level >= 3 && (
        <>
          <text x="8"  y="30" fontSize="9" fill={gold}>✦</text>
          <text x="80" y="28" fontSize="7" fill={gold}>✦</text>
          <text x="7"  y="76" fontSize="6" fill={gold}>✦</text>
        </>
      )}
      {level >= 5 && (
        <>
          <path d="M37,20 L40,11 L45,18 L50,9 L55,18 L60,11 L63,20 Z" fill={gold} stroke="#C8A000" strokeWidth="0.8" />
          <rect x="37" y="19" width="26" height="3" rx="1.5" fill={gold} />
        </>
      )}
    </svg>
  );
}

// ─── Jigglypuff / Pummeluff ───────────────────────────────────────────────────
function JigglypuffSVG({ level, px }: { level: number; px: number }) {
  const pink     = "#F080A0";
  const lightPink= "#F8B8C8";
  const eyeBlue  = "#60A8F0";
  const dark     = "#302040";
  const gold     = "#F5C400";
  const mic      = "#C0C0C0";

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label={`Pummeluff Level ${level}`}>
      {level >= 4 && <ellipse cx="50" cy="58" rx="40" ry="36" fill="none" stroke={pink} strokeWidth="2.5" opacity="0.45" />}

      {/* BODY — very round */}
      <circle cx="50" cy="60" r="32" fill={pink} />
      {/* Belly lighter area */}
      <ellipse cx="50" cy="68" rx="18" ry="16" fill={lightPink} opacity="0.6" />

      {/* Tiny feet */}
      <ellipse cx="38" cy="91" rx="9" ry="5.5" fill={pink} />
      <ellipse cx="62" cy="91" rx="9" ry="5.5" fill={pink} />

      {/* Tiny arms */}
      <ellipse cx="22" cy="64" rx="8" ry="5" fill={pink} transform="rotate(-20 22 64)" />
      <ellipse cx="78" cy="64" rx="8" ry="5" fill={pink} transform="rotate(20 78 64)" />

      {/* Microphone in right hand */}
      <rect x="74" y="68" width="5" height="12" rx="2" fill={mic} />
      <circle cx="76.5" cy="67" r="4" fill={dark} opacity="0.7" />

      {/* HEAD area */}
      <circle cx="50" cy="40" r="26" fill={pink} />

      {/* Curly hair on top */}
      <path d="M46,16 Q42,8 48,12 Q44,4 52,10 Q56,4 58,12 Q64,8 60,16" stroke={pink} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M50,15 Q48,7 52,11" stroke={lightPink} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Eyes — HUGE, blue */}
      <ellipse cx="41" cy="38" rx="8" ry="9" fill={eyeBlue} />
      <ellipse cx="59" cy="38" rx="8" ry="9" fill={eyeBlue} />
      {/* Eye highlights */}
      <circle cx="44" cy="34" r={level >= 2 ? 3 : 2} fill="white" />
      <circle cx="62" cy="34" r={level >= 2 ? 3 : 2} fill="white" />
      <circle cx="38" cy="40" r="1.5" fill="white" opacity="0.5" />
      <circle cx="56" cy="40" r="1.5" fill="white" opacity="0.5" />
      {/* Dark pupil rim */}
      <ellipse cx="41" cy="38" rx="8" ry="9" fill="none" stroke={dark} strokeWidth="0.8" opacity="0.3" />
      <ellipse cx="59" cy="38" rx="8" ry="9" fill="none" stroke={dark} strokeWidth="0.8" opacity="0.3" />

      {/* Nose */}
      <ellipse cx="50" cy="47" rx="2.5" ry="2" fill={dark} opacity="0.4" />
      {/* Mouth */}
      <path d="M45,51 Q50,55 55,51" stroke={dark} strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {level >= 3 && (
        <>
          <text x="6"  y="22" fontSize="9" fill={gold}>✦</text>
          <text x="80" y="18" fontSize="7" fill={gold}>✦</text>
          <text x="5"  y="80" fontSize="6" fill={gold}>✦</text>
          <text x="80" y="82" fontSize="7" fill={gold}>✦</text>
        </>
      )}
      {level >= 5 && (
        <>
          <path d="M37,15 L40,6 L45,13 L50,4 L55,13 L60,6 L63,15 Z" fill={gold} stroke="#C8A000" strokeWidth="0.8" />
          <rect x="37" y="14" width="26" height="3" rx="1.5" fill={gold} />
        </>
      )}
    </svg>
  );
}

// ─── Squirtle / Schiggy ───────────────────────────────────────────────────────
function SquirtleSVG({ level, px }: { level: number; px: number }) {
  const blue      = "#6890F0";
  const lightBlue = "#98C8F0";
  const shell     = "#B87830";
  const shellDark = "#785018";
  const dark      = "#182838";
  const gold      = "#F5C400";

  return (
    <svg width={px} height={px} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label={`Schiggy Level ${level}`}>
      {level >= 4 && <ellipse cx="50" cy="58" rx="40" ry="34" fill="none" stroke={lightBlue} strokeWidth="2.5" opacity="0.45" />}

      {/* Shell on back (behind body) */}
      <ellipse cx="50" cy="66" rx="26" ry="22" fill={shell} />
      {/* Shell pattern */}
      <ellipse cx="50" cy="66" rx="20" ry="17" fill={shellDark} opacity="0.3" />
      <path d="M50,48 L50,84" stroke={shellDark} strokeWidth="1.5" opacity="0.4" />
      <path d="M34,58 Q50,60 66,58" stroke={shellDark} strokeWidth="1.5" opacity="0.4" />
      <path d="M36,70 Q50,72 64,70" stroke={shellDark} strokeWidth="1.5" opacity="0.4" />

      {/* Body (lighter, in front of shell) */}
      <ellipse cx="50" cy="72" rx="18" ry="16" fill={blue} />
      {/* Belly */}
      <ellipse cx="50" cy="75" rx="11" ry="11" fill={lightBlue} opacity="0.7" />

      {/* Tail (curly) */}
      <path d="M62,76 C70,72 74,64 70,58 C66,52 60,54 62,60" stroke={blue} strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* HEAD */}
      <circle cx="50" cy="36" r="22" fill={blue} />
      {/* Face lighter area */}
      <ellipse cx="50" cy="44" rx="14" ry="9" fill={lightBlue} opacity="0.6" />

      {/* Ear bumps */}
      <ellipse cx="32" cy="26" rx="6" ry="8" fill={blue} transform="rotate(-10 32 26)" />
      <ellipse cx="68" cy="26" rx="6" ry="8" fill={blue} transform="rotate(10 68 26)" />

      {/* Eyes — round, large */}
      <ellipse cx="42" cy="33" rx="6" ry="6.5" fill={dark} />
      <ellipse cx="58" cy="33" rx="6" ry="6.5" fill={dark} />
      <circle cx="44" cy="30" r={level >= 2 ? 2.4 : 1.6} fill="white" />
      <circle cx="60" cy="30" r={level >= 2 ? 2.4 : 1.6} fill="white" />
      {level >= 2 && (
        <>
          <circle cx="43" cy="36" r="1.2" fill="white" opacity="0.4" />
          <circle cx="59" cy="36" r="1.2" fill="white" opacity="0.4" />
        </>
      )}

      {/* Nose */}
      <ellipse cx="50" cy="40" rx="2.5" ry="2" fill={dark} opacity="0.5" />
      {/* Mouth */}
      <path d="M45,43.5 Q50,47.5 55,43.5" stroke={dark} strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* Feet */}
      <ellipse cx="37" cy="91" rx="8" ry="5" fill={blue} />
      <ellipse cx="63" cy="91" rx="8" ry="5" fill={blue} />

      {level >= 3 && (
        <>
          <text x="7"  y="22" fontSize="9" fill={gold}>✦</text>
          <text x="80" y="18" fontSize="7" fill={gold}>✦</text>
          <text x="6"  y="78" fontSize="6" fill={gold}>✦</text>
          <text x="80" y="80" fontSize="7" fill={gold}>✦</text>
        </>
      )}
      {level >= 5 && (
        <>
          <path d="M37,14 L40,5 L45,12 L50,3 L55,12 L60,5 L63,14 Z" fill={gold} stroke="#C8A000" strokeWidth="0.8" />
          <rect x="37" y="13" width="26" height="3" rx="1.5" fill={gold} />
        </>
      )}
    </svg>
  );
}
