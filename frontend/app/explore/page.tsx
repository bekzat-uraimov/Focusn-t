"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import RoomCard from "@/components/explore/RoomCard";
import JoinModal from "@/components/explore/JoinModal";
import { Button } from "@/components/ui/button";

export interface ScheduledRoom {
  id: string;
  name: string;
  is_open: boolean;
  scheduled_at: string;
  scheduled_ends_at: string;
  scheduled_duration_secs: number;
  member_count: number;
}

function useLiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState<ScheduledRoom[]>([]);
  const [selected, setSelected] = useState<ScheduledRoom | null>(null);
  const [joinError, setJoinError] = useState("");
  const router = useRouter();
  const now = useLiveClock();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) api.get<ScheduledRoom[]>("/rooms/explore").then(setRooms).catch(() => {});
  }, [user]);

  const handleJoin = async (code: string) => {
    if (!selected) return;
    setJoinError("");
    try {
      await api.post(`/rooms/${selected.id}/join`, { invite_code: code });
      router.push(`/rooms/${selected.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not join";
      setJoinError(msg);
      throw err;
    }
  };

  if (loading || !user) return null;

  const clockLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground min-w-[80px]">
            <Clock className="w-3 h-3" />
            {clockLabel}
          </div>
          <Link href="/home"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <span className="font-bold text-lg">Scheduled Sessions</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-muted-foreground">No scheduled sessions right now.</p>
            <Link href="/rooms/new" className="mt-4 inline-block">
              <Button className="mt-4">Schedule one</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rooms.map((r) => (
              <RoomCard key={r.id} room={r} now={now} onJoin={setSelected} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/rooms/new"><Button variant="outline">+ Schedule your own session</Button></Link>
        </div>
      </main>

      {selected && (
        <JoinModal
          roomName={selected.name}
          open={!!selected}
          onClose={() => { setSelected(null); setJoinError(""); }}
          onJoin={handleJoin}
          externalError={joinError}
        />
      )}
    </div>
  );
}
