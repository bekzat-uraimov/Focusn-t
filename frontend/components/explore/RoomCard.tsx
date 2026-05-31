"use client";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScheduledRoom } from "@/app/explore/page";

interface Props {
  room: ScheduledRoom;
  now: Date;
  onJoin: (room: ScheduledRoom) => void;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function countdownLabel(targetIso: string, now: Date): string {
  const diffMs = new Date(targetIso).getTime() - now.getTime();
  if (diffMs <= 0) return "Starting now";
  const totalSecs = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `Starts in ${h}h ${m}m`;
  if (m > 0) return `Starts in ${m}m`;
  return `Starts in <1m`;
}

export default function RoomCard({ room, now, onJoin }: Props) {
  const isStartingSoon = new Date(room.scheduled_at).getTime() - now.getTime() < 5 * 60_000;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{room.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isStartingSoon ? "bg-yellow-500/20 text-yellow-500" : "bg-primary/10 text-primary"}`}>
            {isStartingSoon ? "Soon" : "Scheduled"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />{room.member_count}
          </span>
          <span className="font-mono">
            {fmtTime(room.scheduled_at)} → {fmtTime(room.scheduled_ends_at)}
          </span>
          <span className={isStartingSoon ? "text-yellow-500 font-medium" : ""}>
            {countdownLabel(room.scheduled_at, now)}
          </span>
        </div>
      </div>
      <Button size="sm" onClick={() => onJoin(room)}>Join</Button>
    </div>
  );
}
