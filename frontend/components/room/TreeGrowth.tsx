"use client";
import { motion, AnimatePresence } from "framer-motion";
import { TREE_META } from "@/lib/treeAssets";
import TreeSVG from "@/components/forest/TreeSVG";
import type { TreeType, TreeStage } from "@/types/ws";

interface Props {
  treeType: TreeType;
  stage: TreeStage;
  isAlive: boolean;
}

export default function TreeGrowth({ treeType, stage, isAlive }: Props) {
  const meta = TREE_META[treeType];
  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${stage}-${isAlive}`}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
        >
          <TreeSVG treeType={treeType} stage={stage} isAlive={isAlive} />
        </motion.div>
      </AnimatePresence>
      <div
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          isAlive ? meta.badgeClass : "bg-zinc-800 text-zinc-400"
        }`}
      >
        {isAlive ? `${meta.emoji} ${meta.label} · ${stage}` : "💀 Tree died"}
      </div>
    </div>
  );
}
