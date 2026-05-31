"use client";
import TreeCard from "./TreeCard";
import type { TreeType, TreeStage } from "@/types/ws";

interface Tree {
  id: string;
  tree_type: TreeType;
  stage: TreeStage;
  is_alive: boolean;
  created_at: string;
}

export default function ForestGrid({ trees }: { trees: Tree[] }) {
  if (trees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Your forest is empty</h2>
        <p className="text-muted-foreground">Complete a focus session to grow your first tree.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {trees.map((t) => (
        <TreeCard
          key={t.id}
          treeType={t.tree_type}
          stage={t.stage}
          isAlive={t.is_alive}
          date={t.created_at}
        />
      ))}
    </div>
  );
}
