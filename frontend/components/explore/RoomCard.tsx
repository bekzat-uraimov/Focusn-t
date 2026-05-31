"use client";
import { Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Room {
  id: string;
  name: string;
  is_open: boolean;
  scheduled_at: string | null;
  member_count: number;
}

interface Props {
  room: Room;
  onJoin: (room: Room) => void;
}

export default function RoomCard({ room, onJoin }: Props) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-foreground">{room.name}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.member_count}</span>
          {room.scheduled_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(room.scheduled_at).toLocaleString()}
            </span>
          )}
          {room.is_open && <span className="text-green-500 font-medium">Open</span>}
        </div>
      </div>
      <Button size="sm" onClick={() => onJoin(room)}>Join</Button>
    </div>
  );
}
