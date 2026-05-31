"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ForestGrid from "@/components/forest/ForestGrid";
import { Button } from "@/components/ui/button";
import type { TreeType, TreeStage } from "@/types/ws";

interface Tree {
  id: string;
  tree_type: TreeType;
  stage: TreeStage;
  is_alive: boolean;
  created_at: string;
}

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const [trees, setTrees] = useState<Tree[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      api.get<Tree[]>("/users/me/trees").then(setTrees).catch(() => {});
    }
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">🌳 FocusForest</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Hi, {user.name}</span>
            <Button variant="ghost" size="sm" onClick={logout}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Forest</h1>
            <p className="text-muted-foreground text-sm mt-1">{trees.length} tree{trees.length !== 1 ? "s" : ""} grown</p>
          </div>
          <div className="flex gap-2">
            <Link href="/explore"><Button variant="outline">Explore Rooms</Button></Link>
            <Link href="/rooms/new"><Button>+ Create Room</Button></Link>
          </div>
        </div>

        <ForestGrid trees={trees} />
      </main>
    </div>
  );
}
