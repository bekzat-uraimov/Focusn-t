"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import RoomCard from "@/components/explore/RoomCard";
import JoinModal from "@/components/explore/JoinModal";
import { Button } from "@/components/ui/button";

interface Room {
  id: string;
  name: string;
  is_open: boolean;
  scheduled_at: string | null;
  member_count: number;
}

export default function ExplorePage() {
  const { user, loading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<Room | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) api.get<Room[]>("/rooms/explore").then(setRooms).catch(() => {});
  }, [user]);

  const handleJoin = async (code: string) => {
    if (!selected) return;
    await api.post(`/rooms/${selected.id}/join`, { invite_code: code });
    router.push(`/rooms/${selected.id}`);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/home"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <span className="font-bold text-lg">Explore Rooms</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-muted-foreground">No open rooms right now.</p>
            <Link href="/rooms/new" className="mt-4 inline-block">
              <Button className="mt-4">Create one</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rooms.map((r) => (
              <RoomCard key={r.id} room={r} onJoin={setSelected} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/rooms/new"><Button variant="outline">+ Create your own room</Button></Link>
        </div>
      </main>

      {selected && (
        <JoinModal
          roomName={selected.name}
          open={!!selected}
          onClose={() => setSelected(null)}
          onJoin={handleJoin}
        />
      )}
    </div>
  );
}
