import type { TreeType, TreeStage } from "@/types/ws";

export const TREE_META: Record<TreeType, { label: string; badgeClass: string; tintClass: string; emoji: string }> = {
  common:   { label: "Common",   badgeClass: "bg-zinc-600 text-zinc-200",           tintClass: "text-zinc-400",    emoji: "🌱" },
  uncommon: { label: "Uncommon", badgeClass: "bg-green-700 text-green-100",          tintClass: "text-green-400",   emoji: "🌿" },
  epic:     { label: "Epic",     badgeClass: "bg-blue-700 text-blue-100",            tintClass: "text-blue-400",    emoji: "🌳" },
  arcane:   { label: "Arcane",   badgeClass: "bg-purple-700 text-purple-100",        tintClass: "text-purple-400",  emoji: "✨" },
  diamond:  { label: "Diamond",  badgeClass: "bg-cyan-700 text-cyan-100",            tintClass: "text-cyan-400",    emoji: "💎" },
};

export const DURATION_TO_TYPE: Record<number, TreeType> = {
  1800: "common",
  2700: "uncommon",
  3600: "epic",
  5400: "arcane",
  7200: "diamond",
};

export const DURATIONS = [
  { secs: 1800, label: "30 min",  type: "common"   as TreeType },
  { secs: 2700, label: "45 min",  type: "uncommon" as TreeType },
  { secs: 3600, label: "1 hour",  type: "epic"     as TreeType },
  { secs: 5400, label: "1.5 hrs", type: "arcane"   as TreeType },
  { secs: 7200, label: "2 hours", type: "diamond"  as TreeType },
];

export function elapsedToStage(elapsed: number, duration: number): TreeStage {
  const r = elapsed / duration;
  if (r < 0.33) return "small";
  if (r < 0.66) return "medium";
  return "large";
}
