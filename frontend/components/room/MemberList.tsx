"use client";
import type { FocusStatus } from "@/types/ws";

interface Member {
  user_id: string;
  name: string;
  status: FocusStatus;
  tree_alive: boolean;
}

const STATUS_ICON: Record<FocusStatus, string> = {
  focused: "🌳",
  distracted: "⚠️",
  away: "💤",
};

export default function MemberList({ members }: { members: Member[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">In the room</h3>
      {members.length === 0 && <p className="text-sm text-muted-foreground">No one here yet</p>}
      {members.map((m) => (
        <div key={m.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {m.name[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium flex-1 truncate">{m.name}</span>
          <span className="text-base">{m.tree_alive ? STATUS_ICON[m.status] : "💀"}</span>
        </div>
      ))}
    </div>
  );
}
