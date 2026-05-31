"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DurationPicker from "@/components/room/DurationPicker";

export default function NewRoomPage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduledDuration, setScheduledDuration] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (loading) return null;
  if (!user) { router.replace("/login"); return null; }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (scheduled && !scheduledAt) {
      setError("Please pick a start date and time.");
      return;
    }
    if (scheduled && !scheduledDuration) {
      setError("Please choose a session duration.");
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = { name, is_open: isOpen };
      if (scheduled && scheduledAt && scheduledDuration) {
        body.scheduled_at = new Date(scheduledAt).toISOString();
        body.scheduled_duration_secs = scheduledDuration;
      }
      const room = await api.post<{ id: string; invite_code: string }>("/rooms", body);
      setCreated(room);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const copyCode = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold">Room Created!</h2>
        <p className="text-muted-foreground">Share this code with your friends to let them join.</p>
        <div className="flex items-center gap-2 justify-center">
          <code className="text-2xl font-mono font-bold tracking-widest bg-card border border-border px-4 py-2 rounded-lg">
            {created.invite_code}
          </code>
          <Button variant="outline" size="icon" onClick={copyCode}>
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <Button className="w-full" onClick={() => router.push(`/rooms/${created.id}`)}>
          Enter Room →
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/home"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <span className="font-bold text-lg">Create Room</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={submit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Name</label>
            <Input
              placeholder="e.g. Finals Week Sprint"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div>
              <p className="font-medium text-sm">Public Room</p>
              <p className="text-xs text-muted-foreground">Visible on the Explore page</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-11 h-6 rounded-full transition-colors ${isOpen ? "bg-primary" : "bg-zinc-700"}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${isOpen ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border">
            <div>
              <p className="font-medium text-sm">Schedule for later</p>
              <p className="text-xs text-muted-foreground">Set a future start time for your session</p>
            </div>
            <button
              type="button"
              onClick={() => { setScheduled(!scheduled); setScheduledAt(""); setScheduledDuration(null); }}
              className={`w-11 h-6 rounded-full transition-colors ${scheduled ? "bg-primary" : "bg-zinc-700"}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${scheduled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {scheduled && (
            <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date & Time</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  required={scheduled}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Session Duration</label>
                <DurationPicker onSelect={setScheduledDuration} selected={scheduledDuration} />
              </div>
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </main>
    </div>
  );
}
