"use client";
import { DURATIONS, TREE_META } from "@/lib/treeAssets";

interface Props {
  onSelect: (secs: number) => void;
  disabled?: boolean;
  selected?: number | null;
}

export default function DurationPicker({ onSelect, disabled, selected }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-muted-foreground text-sm">Choose your session length to start growing</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-sm">
        {DURATIONS.map(({ secs, label, type }) => {
          const meta = TREE_META[type];
          const isSelected = selected === secs;
          return (
            <button
              key={secs}
              onClick={() => onSelect(secs)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border bg-card hover:border-primary/60 hover:bg-card/80 transition-colors disabled:opacity-50 ${isSelected ? "border-primary ring-1 ring-primary" : "border-border"}`}
            >
              <span className="text-lg">{meta.emoji}</span>
              <span className="text-sm font-semibold">{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${meta.badgeClass}`}>{meta.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
