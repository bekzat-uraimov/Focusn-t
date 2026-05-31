"use client";
import { motion } from "framer-motion";
import type { TreeType, TreeStage } from "@/types/ws";

interface Props {
  treeType: TreeType;
  stage: TreeStage;
  isAlive: boolean;
  size?: number;
}

const STAGE_SIZE: Record<TreeStage, [number, number]> = {
  small:  [64,  77],
  medium: [96, 115],
  large:  [128, 154],
};

type SwayProps = {
  children: React.ReactNode;
  pivotX?: number;
  pivotY?: number;
  angle: number;
  duration: number;
  delay?: number;
};

function Sway({ children, pivotX = 50, pivotY = 118, angle, duration, delay = 0 }: SwayProps) {
  return (
    <motion.g
      style={{ transformOrigin: `${pivotX}px ${pivotY}px` }}
      animate={{ rotate: [angle, -angle] }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
        delay,
      }}
    >
      {children}
    </motion.g>
  );
}

// Common — Oak
function CommonOak() {
  return (
    <Sway angle={1.8} duration={3.2}>
      <rect x="44" y="80" width="12" height="38" rx="3" fill="#7A4E2A" />
      <ellipse cx="50" cy="116" rx="14" ry="4" fill="#5A3A1A" opacity="0.4" />
      <Sway angle={1.2} duration={2.7} delay={0.5} pivotY={80}>
        <ellipse cx="50" cy="62" rx="36" ry="28" fill="#2B6E27" />
        <ellipse cx="28" cy="66" rx="22" ry="19" fill="#3A9035" />
        <ellipse cx="72" cy="66" rx="22" ry="19" fill="#3A9035" />
        <ellipse cx="50" cy="52" rx="30" ry="24" fill="#3E9A38" />
        <ellipse cx="36" cy="54" rx="16" ry="14" fill="#45A83F" />
        <ellipse cx="64" cy="54" rx="16" ry="14" fill="#45A83F" />
        <ellipse cx="50" cy="40" rx="20" ry="17" fill="#54BF4C" />
      </Sway>
    </Sway>
  );
}

// Uncommon — Layered Pine / Spruce
function UncommonPine() {
  return (
    <Sway angle={1.2} duration={2.8}>
      <rect x="46" y="88" width="8" height="30" rx="2" fill="#6B4226" />
      <polygon points="50,65 14,96 86,96" fill="#1B5E20" />
      <polygon points="50,50 18,78 82,78" fill="#2E7D32" />
      <Sway angle={1.0} duration={2.4} delay={0.4} pivotY={65}>
        <polygon points="50,35 22,63 78,63" fill="#388E3C" />
        <polygon points="50,20 26,48 74,48" fill="#43A047" />
        <polygon points="50,6 30,34 70,34" fill="#4CAF50" />
      </Sway>
    </Sway>
  );
}

// Epic — Baobab (rare African tree, iconic bottle trunk)
function EpicBaobab() {
  return (
    <Sway angle={0.6} duration={5.5}>
      {/* Bottle-shaped trunk */}
      <path
        d="M38,118 Q24,102 22,80 Q20,55 50,28 Q80,55 78,80 Q76,102 62,118 Z"
        fill="#9B7B50"
      />
      {/* Highlights on trunk */}
      <path
        d="M42,118 Q30,100 30,80 Q32,60 50,36 Q68,60 70,80 Q70,100 58,118 Z"
        fill="#B09060"
        opacity="0.3"
      />
      {/* Bark texture */}
      <path d="M38,105 Q50,102 62,105" stroke="#7A6040" strokeWidth="1.5" fill="none" opacity="0.45" />
      <path d="M35,90 Q50,86 65,90" stroke="#7A6040" strokeWidth="1.5" fill="none" opacity="0.35" />
      {/* Tiny crown at the top */}
      <Sway angle={1.0} duration={3.5} delay={0.6} pivotY={30}>
        <line x1="50" y1="30" x2="30" y2="18" stroke="#5A3A1A" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="30" x2="70" y2="18" stroke="#5A3A1A" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="30" x2="50" y2="12" stroke="#5A3A1A" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="30" y1="18" x2="20" y2="8" stroke="#5A3A1A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="70" y1="18" x2="80" y2="8" stroke="#5A3A1A" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="28" cy="14" rx="12" ry="9" fill="#2E7D32" />
        <ellipse cx="72" cy="14" rx="12" ry="9" fill="#2E7D32" />
        <ellipse cx="50" cy="8" rx="11" ry="8" fill="#388E34" />
        <ellipse cx="18" cy="8" rx="7" ry="6" fill="#2E7D32" />
        <ellipse cx="82" cy="8" rx="7" ry="6" fill="#2E7D32" />
      </Sway>
    </Sway>
  );
}

// Arcane — Dragon Blood Tree (Socotra Island, mushroom umbrella)
function ArcaneDragonBlood() {
  return (
    <Sway angle={2.0} duration={2.2}>
      {/* Short stout trunk */}
      <rect x="46" y="76" width="8" height="42" rx="3" fill="#6B3A1A" />
      {/* Branching arms */}
      <line x1="50" y1="80" x2="22" y2="54" stroke="#6B3A1A" strokeWidth="6.5" strokeLinecap="round" />
      <line x1="50" y1="80" x2="78" y2="54" stroke="#6B3A1A" strokeWidth="6.5" strokeLinecap="round" />
      <line x1="50" y1="77" x2="50" y2="46" stroke="#6B3A1A" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="22" y1="54" x2="8" y2="38" stroke="#6B3A1A" strokeWidth="4" strokeLinecap="round" />
      <line x1="22" y1="54" x2="26" y2="36" stroke="#6B3A1A" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="78" y1="54" x2="92" y2="38" stroke="#6B3A1A" strokeWidth="4" strokeLinecap="round" />
      <line x1="78" y1="54" x2="74" y2="36" stroke="#6B3A1A" strokeWidth="3.5" strokeLinecap="round" />
      {/* Flat mushroom canopy */}
      <Sway angle={1.5} duration={1.9} delay={0.3} pivotY={42}>
        <ellipse cx="50" cy="34" rx="48" ry="14" fill="#194F36" opacity="0.9" />
        <ellipse cx="50" cy="27" rx="44" ry="14" fill="#1E6B46" />
        <ellipse cx="50" cy="21" rx="40" ry="13" fill="#277D52" />
        <ellipse cx="50" cy="16" rx="34" ry="12" fill="#30924F" />
        <ellipse cx="50" cy="12" rx="26" ry="9" fill="#3AA855" />
      </Sway>
    </Sway>
  );
}

// Diamond — Cherry Blossom (Sakura)
function DiamondCherryBlossom() {
  return (
    <Sway angle={1.2} duration={4.2}>
      {/* Elegant curved trunk */}
      <path
        d="M46,118 C44,106 43,92 45,78 C47,66 50,58 50,52"
        stroke="#3D2010" strokeWidth="8" strokeLinecap="round" fill="none"
      />
      {/* Main branches */}
      <path d="M50,68 C44,60 34,52 22,40" stroke="#3D2010" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50,70 C56,62 66,54 78,40" stroke="#3D2010" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50,60 L50,28" stroke="#3D2010" strokeWidth="4" strokeLinecap="round" />
      {/* Secondary branches */}
      <path d="M22,40 C15,32 10,24 7,16" stroke="#3D2010" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M78,40 C85,32 90,24 93,16" stroke="#3D2010" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Blossom clouds */}
      <Sway angle={1.8} duration={3.6} delay={0.6} pivotY={52}>
        <ellipse cx="22" cy="34" rx="18" ry="14" fill="#F48FB1" opacity="0.92" />
        <ellipse cx="78" cy="34" rx="18" ry="14" fill="#F48FB1" opacity="0.92" />
        <ellipse cx="50" cy="20" rx="17" ry="13" fill="#F8BBD9" opacity="0.9" />
        <ellipse cx="8" cy="14" rx="11" ry="9" fill="#F06292" opacity="0.85" />
        <ellipse cx="92" cy="14" rx="11" ry="9" fill="#F06292" opacity="0.85" />
        <ellipse cx="50" cy="36" rx="16" ry="12" fill="#FDE8F4" opacity="0.78" />
        <ellipse cx="32" cy="44" rx="10" ry="8" fill="#F9C8DC" opacity="0.85" />
        <ellipse cx="68" cy="44" rx="10" ry="8" fill="#F9C8DC" opacity="0.85" />
      </Sway>
    </Sway>
  );
}

// Dead Tree — bare branches, eerie sway
function DeadTree() {
  return (
    <Sway angle={1.5} duration={5.0}>
      <rect x="45" y="52" width="10" height="66" rx="3" fill="#3A2E28" />
      <ellipse cx="50" cy="116" rx="14" ry="4" fill="#2A1E18" opacity="0.5" />
      <path d="M50,72 C44,64 34,54 20,42" stroke="#3A2E28" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50,75 C56,67 66,57 80,44" stroke="#3A2E28" strokeWidth="5" strokeLinecap="round" fill="none" />
      <line x1="50" y1="63" x2="50" y2="32" stroke="#3A2E28" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="20" y1="42" x2="8" y2="28" stroke="#3A2E28" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="42" x2="25" y2="26" stroke="#3A2E28" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="80" y1="44" x2="92" y2="30" stroke="#3A2E28" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="44" x2="75" y2="28" stroke="#3A2E28" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="32" x2="37" y2="18" stroke="#3A2E28" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="32" x2="63" y2="18" stroke="#3A2E28" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="37" y1="18" x2="30" y2="9" stroke="#3A2E28" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="63" y1="18" x2="70" y2="9" stroke="#3A2E28" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="28" x2="3" y2="19" stroke="#3A2E28" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="92" y1="30" x2="97" y2="21" stroke="#3A2E28" strokeWidth="1.5" strokeLinecap="round" />
    </Sway>
  );
}

const TREES: Record<TreeType, React.FC> = {
  common:   CommonOak,
  uncommon: UncommonPine,
  epic:     EpicBaobab,
  arcane:   ArcaneDragonBlood,
  diamond:  DiamondCherryBlossom,
};

export default function TreeSVG({ treeType, stage, isAlive, size }: Props) {
  const [w, h] = size ? [size, Math.round(size * 1.2)] : STAGE_SIZE[stage];
  const TreeComp = isAlive ? TREES[treeType] : DeadTree;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      <TreeComp />
    </svg>
  );
}
