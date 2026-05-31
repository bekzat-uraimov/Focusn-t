"use client";

import { motion } from "framer-motion";
import type { Easing, TargetAndTransition } from "framer-motion";

export type DuckMood = "happy" | "studying" | "worried" | "celebrating" | "sleeping";
export type DuckRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

interface DuckSpriteProps {
  mood?: DuckMood;
  size?: number;
  rarity?: DuckRarity;
}

const ease: Easing = "easeInOut";

const rarityOutlineColor: Record<DuckRarity, string> = {
  common:    "#1a1a1a",
  rare:      "#1a3a6e",
  epic:      "#4a1a6e",
  legendary: "#6e3a00",
  mythic:    "#6e0044",
};

const rarityBodyColor: Record<DuckRarity, string> = {
  common:    "#FFD166",
  rare:      "#60CFFF",
  epic:      "#D48CFF",
  legendary: "#FFB347",
  mythic:    "#FF8EC8",
};

const rarityGlow: Record<DuckRarity, string> = {
  common:    "",
  rare:      "drop-shadow(0 0 10px rgba(96,207,255,0.7))",
  epic:      "drop-shadow(0 0 14px rgba(192,132,252,0.7))",
  legendary: "drop-shadow(0 0 18px rgba(255,179,71,0.8))",
  mythic:    "drop-shadow(0 0 24px rgba(255,142,200,0.9))",
};

const bodyAnim: Record<DuckMood, TargetAndTransition> = {
  happy:       { y: [0, -10, 0],          rotate: [0, -4, 4, 0],  transition: { duration: 1.8, repeat: Infinity, ease } },
  studying:    { y: [0, -4, 0],           rotate: [-2, 2, -2],    transition: { duration: 2.5, repeat: Infinity, ease } },
  worried:     { x: [-5, 5, -5, 5, 0],   rotate: [-6, 6, -6],    transition: { duration: 0.35, repeat: Infinity } },
  celebrating: { y: [0, -22, 0, -16, 0], scale: [1, 1.12, 1],    transition: { duration: 0.7, repeat: 4 } },
  sleeping:    { y: [0, 3, 0],            rotate: [0, 3, 0],      transition: { duration: 3, repeat: Infinity, ease } },
};

const eyeAnim: Record<DuckMood, TargetAndTransition> = {
  happy:       { scaleY: [1, 0.1, 1],  transition: { duration: 3.5, repeat: Infinity, repeatDelay: 2.5 } },
  studying:    { scaleY: [1, 0.55, 1], transition: { duration: 4, repeat: Infinity, repeatDelay: 1.5 } },
  worried:     { scaleY: 0.45 },
  celebrating: { scaleY: [1, 0.1, 1],  transition: { duration: 0.25, repeat: 6 } },
  sleeping:    { scaleY: 0.08 },
};

export function DuckSprite({ mood = "happy", size = 120, rarity = "common" }: DuckSpriteProps) {
  const body = rarityBodyColor[rarity];
  const outline = rarityOutlineColor[rarity];
  const wing = rarity === "common" ? "#F4C430" : body;
  const lookLeft = mood === "worried";
  const strokeW = Math.max(2.5, size / 48); // scales with size

  return (
    <motion.div
      animate={bodyAnim[mood]}
      style={{ width: size, height: size, position: "relative", filter: rarityGlow[rarity] || undefined, display: "inline-block" }}
    >
      <svg viewBox="0 0 130 130" width={size} height={size} overflow="visible">

        {/* Drop shadow */}
        <ellipse cx="65" cy="122" rx="32" ry="6" fill="rgba(0,0,0,0.18)" />

        {/* ── Wings (behind body) ── */}
        <ellipse cx="35" cy="83" rx="16" ry="22" fill={wing} stroke={outline} strokeWidth={strokeW} strokeLinejoin="round" />
        <ellipse cx="95" cy="83" rx="16" ry="22" fill={wing} stroke={outline} strokeWidth={strokeW} strokeLinejoin="round" />

        {/* ── Body ── */}
        <ellipse cx="65" cy="82" rx="36" ry="30" fill={body} stroke={outline} strokeWidth={strokeW} strokeLinejoin="round" />

        {/* ── Belly patch ── */}
        <ellipse cx="65" cy="88" rx="20" ry="18" fill="rgba(255,255,255,0.22)" />

        {/* ── Neck ── */}
        <path d={`M55 58 Q50 52 55 46 Q65 42 75 46 Q80 52 75 58 Z`} fill={body} />

        {/* ── Head ── */}
        <circle cx="65" cy="42" r="28" fill={body} stroke={outline} strokeWidth={strokeW} />

        {/* ── Cheeks ── */}
        <circle cx="46" cy="50" r="9" fill="rgba(255,160,120,0.45)" />
        <circle cx="84" cy="50" r="9" fill="rgba(255,160,120,0.45)" />

        {/* ── Eyes ── */}
        <motion.g animate={eyeAnim[mood]} style={{ originX: "52px", originY: "40px" }}>
          <circle cx="52" cy="40" r="9"  fill="white" stroke={outline} strokeWidth={strokeW * 0.7} />
          <circle cx={lookLeft ? 49 : 53} cy="42" r="5.5" fill={outline} />
          <circle cx={lookLeft ? 50 : 54} cy="40" r="2"   fill="white" />
        </motion.g>
        <motion.g animate={eyeAnim[mood]} style={{ originX: "78px", originY: "40px" }}>
          <circle cx="78" cy="40" r="9"  fill="white" stroke={outline} strokeWidth={strokeW * 0.7} />
          <circle cx={lookLeft ? 75 : 79} cy="42" r="5.5" fill={outline} />
          <circle cx={lookLeft ? 76 : 80} cy="40" r="2"   fill="white" />
        </motion.g>

        {/* ── Eyebrow (worried) ── */}
        {mood === "worried" && (
          <>
            <path d="M44 31 Q52 27 58 31" fill="none" stroke={outline} strokeWidth={strokeW * 1.2} strokeLinecap="round" />
            <path d="M72 31 Q78 27 86 31" fill="none" stroke={outline} strokeWidth={strokeW * 1.2} strokeLinecap="round" />
          </>
        )}

        {/* ── Beak ── */}
        <ellipse
          cx="65" cy="58"
          rx="10" ry={mood === "worried" ? 4 : 6.5}
          fill="#F4845F" stroke={outline} strokeWidth={strokeW * 0.8}
        />
        {/* Beak mouth line */}
        <path d={`M58 ${mood === "worried" ? "58" : "60"} Q65 ${mood === "worried" ? "61" : "63"} 72 ${mood === "worried" ? "58" : "60"}`}
          fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} />

        {/* ── Book (studying) ── */}
        {mood === "studying" && (
          <motion.g animate={{ rotate: [-3, 3, -3] } as TargetAndTransition} style={{ originX: "65px", originY: "100px" }}>
            <rect x="45" y="98" width="40" height="24" rx="4" fill="#4A90D9" stroke="#1a3a6e" strokeWidth={strokeW * 0.8} />
            <rect x="47" y="100" width="17" height="20" rx="2" fill="#5BA0E9" />
            <rect x="66" y="100" width="17" height="20" rx="2" fill="#3A80C9" />
            {/* Pages lines */}
            {[103, 107, 111].map(y => <line key={y} x1="49" y1={y} x2="62" y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />)}
          </motion.g>
        )}

        {/* ── Zzz (sleeping) ── */}
        {mood === "sleeping" && (
          <>
            <motion.text x="90" y="28" fontSize="14" fontWeight="bold" fill="rgba(100,120,220,0.7)" fontFamily="sans-serif"
              animate={{ opacity: [0, 1, 0], y: [28, 15] } as TargetAndTransition}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.3 }}>z</motion.text>
            <motion.text x="100" y="20" fontSize="18" fontWeight="bold" fill="rgba(100,120,220,0.6)" fontFamily="sans-serif"
              animate={{ opacity: [0, 1, 0], y: [20, 5] } as TargetAndTransition}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3, repeatDelay: 0.3 }}>z</motion.text>
          </>
        )}

        {/* ── Stars (celebrating) ── */}
        {mood === "celebrating" && [[-26, -10], [26, -10], [0, -26], [-14, -22], [14, -22]].map(([dx, dy], i) => (
          <motion.text key={i} x={65 + dx} y={42 + dy} fontSize="13" textAnchor="middle"
            animate={{ opacity: [0, 1, 0], y: [42 + dy, 42 + dy - 16] } as TargetAndTransition}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}>
            {["⭐", "✨", "🌟", "💛", "⭐"][i]}
          </motion.text>
        ))}

        {/* ── Crown (legendary/mythic) ── */}
        {(rarity === "legendary" || rarity === "mythic") && (
          <motion.text x="65" y="14" fontSize="20" textAnchor="middle"
            animate={{ y: [14, 10, 14] } as TargetAndTransition}
            transition={{ duration: 2, repeat: Infinity, ease }}>
            {rarity === "mythic" ? "✨" : "👑"}
          </motion.text>
        )}

        {/* ── Feet ── */}
        <ellipse cx="52" cy="112" rx="12" ry="6"  fill="#F4845F" stroke={outline} strokeWidth={strokeW * 0.7} />
        <ellipse cx="78" cy="112" rx="12" ry="6"  fill="#F4845F" stroke={outline} strokeWidth={strokeW * 0.7} />
      </svg>

      {/* Rarity ring pulse */}
      {(rarity === "epic" || rarity === "legendary" || rarity === "mythic") && (
        <motion.div
          style={{
            position: "absolute", inset: -8, borderRadius: "50%",
            border: `2.5px solid ${rarity === "mythic" ? "#FF8EC8" : rarity === "legendary" ? "#FFB347" : "#D48CFF"}`,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] } as TargetAndTransition}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
