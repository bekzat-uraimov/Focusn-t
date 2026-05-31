"use client";
import { motion } from "framer-motion";
import { TREE_META } from "@/lib/treeAssets";
import TreeSVG from "./TreeSVG";
import type { TreeType, TreeStage } from "@/types/ws";

interface Props {
  treeType: TreeType;
  stage: TreeStage;
  isAlive: boolean;
  date: string;
}

export default function TreeCard({ treeType, stage, isAlive, date }: Props) {
  const meta = TREE_META[treeType];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card"
    >
      <div
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          isAlive ? meta.badgeClass : "bg-zinc-800 text-zinc-400"
        }`}
      >
        {isAlive ? `${meta.emoji} ${meta.label}` : "💀 Dead"}
      </div>
      <TreeSVG treeType={treeType} stage={stage} isAlive={isAlive} size={80} />
      <p className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</p>
    </motion.div>
  );
}
