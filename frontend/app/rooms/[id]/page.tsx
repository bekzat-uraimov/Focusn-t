"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSession } from "@/hooks/useSession";
import { elapsedToStage, DURATION_TO_TYPE } from "@/lib/treeAssets";
import MemberList from "@/components/room/MemberList";
import SessionTimer from "@/components/room/SessionTimer";
import TreeGrowth from "@/components/room/TreeGrowth";
import DurationPicker from "@/components/room/DurationPicker";
import DistractionOverlay from "@/components/room/DistractionOverlay";
import TreeSVG from "@/components/forest/TreeSVG";
import { Button } from "@/components/ui/button";
import type { ServerMessage, FocusStatus, TreeType } from "@/types/ws";

interface Member {
  user_id: string;
  name: string;
  status: FocusStatus;
  tree_alive: boolean;
}

interface RoomInfo {
  name: string;
  owner_id: string;
  scheduled_at: string | null;
  scheduled_duration_secs: number | null;
}

const GRACE_SECS = 15;

function useCountdown(targetIso: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!targetIso) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return secondsLeft;
}

function formatCountdown(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [treeAlive, setTreeAlive] = useState(true);
  const [missedSession, setMissedSession] = useState(false);

  // Distraction state
  const [distracted, setDistracted] = useState(false);
  const [countdown, setCountdown] = useState(GRACE_SECS);
  const graceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { session, elapsed, remaining, progress, startSession, endSession, hydrateSession, fetchCurrentSession } = useSession(roomId);

  const treeType: TreeType = session ? DURATION_TO_TYPE[session.duration_secs] ?? "common" : "common";
  const treeStage = session ? elapsedToStage(elapsed, session.duration_secs) : "small";

  const scheduledCountdown = useCountdown(
    session?.status === "scheduled" ? room?.scheduled_at ?? null : null
  );

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (session?.status === "in_progress" && remaining === 0) {
      endSession("completed").then(() => setTreeAlive(true));
    }
  }, [remaining, session, endSession]);

  // Grace period countdown
  const startGrace = useCallback(() => {
    setDistracted(true);
    setCountdown(GRACE_SECS);
    graceRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(graceRef.current!);
          setDistracted(false);
          setTreeAlive(false);
          endSession("failed");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, [endSession]);

  const clearGrace = useCallback(() => {
    if (graceRef.current) clearInterval(graceRef.current);
    setDistracted(false);
    setCountdown(GRACE_SECS);
  }, []);

  // WebSocket message handler
  const handleMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === "room_state") {
      setMembers(msg.members);
    } else if (msg.type === "member_joined") {
      setMembers((prev) => {
        if (prev.find((m) => m.user_id === msg.user_id)) return prev;
        return [...prev, { user_id: msg.user_id, name: msg.name, status: "focused", tree_alive: true }];
      });
    } else if (msg.type === "member_left") {
      setMembers((prev) => prev.filter((m) => m.user_id !== msg.user_id));
    } else if (msg.type === "member_update") {
      setMembers((prev) =>
        prev.map((m) => m.user_id === msg.user_id ? { ...m, status: msg.status, tree_alive: msg.tree_alive } : m)
      );
    } else if (msg.type === "session_end") {
      setMembers((prev) =>
        prev.map((m) => m.user_id === msg.user_id ? { ...m, tree_alive: msg.tree_alive } : m)
      );
    } else if (msg.type === "session_started" && user && msg.user_id === user.id) {
      // Background scheduler started our scheduled session
      hydrateSession({
        id: msg.session_id,
        duration_secs: msg.duration_secs,
        started_at: new Date().toISOString(),
        status: "in_progress",
      });
      setTreeAlive(true);
    } else if (msg.type === "session_dead" && user && msg.user_id === user.id) {
      setMissedSession(true);
    }
  }, [user, hydrateSession]);

  const { sendFocusUpdate } = useWebSocket(roomId, handleMessage);

  const sendRef = useRef(sendFocusUpdate);
  useEffect(() => { sendRef.current = sendFocusUpdate; }, [sendFocusUpdate]);

  // Fetch room info and hydrate any existing session on mount
  useEffect(() => {
    if (!loading && !user) { router.replace("/login"); return; }
    if (!user) return;

    api.get<RoomInfo>(`/rooms/${roomId}`).then(setRoom).catch(() => {});
    fetchCurrentSession().then((s) => {
      if (s) hydrateSession(s);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const handleFocusChange = useCallback((status: FocusStatus) => {
    if (!session || session.status !== "in_progress") return;
    sendRef.current(status);
    if ((status === "distracted" || status === "away") && !distracted) {
      startGrace();
    } else if (status === "focused" && distracted) {
      clearGrace();
    }
  }, [session, distracted, startGrace, clearGrace]);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!session || session.status !== "in_progress" || !videoRef.current) return;
    let active = true;
    let stopFn: (() => void) | null = null;

    (async () => {
      const { startFocusDetection } = await import("@/lib/focusDetector");
      stopFn = await startFocusDetection(videoRef.current!, (status) => {
        if (active) handleFocusChange(status);
      });
    })();

    return () => { active = false; stopFn?.(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status, handleFocusChange]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/home"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <span className="font-bold">{room?.name || "Loading..."}</span>
          {session?.status === "in_progress" && (
            <span className="ml-auto text-xs text-green-500 font-medium animate-pulse">● LIVE</span>
          )}
          {session?.status === "scheduled" && (
            <span className="ml-auto text-xs text-yellow-500 font-medium">⏰ SCHEDULED</span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-[220px_1fr_180px] gap-6">
        {/* Left: Member list */}
        <aside><MemberList members={members} /></aside>

        {/* Center: Tree + session */}
        <section className="flex flex-col items-center justify-center gap-8">
          {session?.status === "in_progress" ? (
            <>
              <TreeGrowth treeType={treeType} stage={treeStage} isAlive={treeAlive} />
              <SessionTimer remaining={remaining} duration={session.duration_secs} progress={progress} />
              <Button variant="outline" size="sm" onClick={() => { setTreeAlive(false); endSession("abandoned"); }}>
                End Early
              </Button>
            </>
          ) : session?.status === "scheduled" ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">⏰</div>
              <h2 className="text-xl font-bold">Session Scheduled</h2>
              <p className="text-muted-foreground text-sm">
                Starting in <span className="font-mono font-semibold text-foreground">{formatCountdown(scheduledCountdown)}</span>
              </p>
              <p className="text-xs text-muted-foreground">Stay in the room — your session will start automatically.</p>
              <TreeSVG treeType={treeType} stage="small" isAlive size={80} />
            </div>
          ) : session?.status === "completed" ? (
            <div className="text-center space-y-3">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold">Session Complete!</h2>
              <p className="text-muted-foreground text-sm">Your tree was added to your forest.</p>
              <Link href="/home"><Button>View Forest</Button></Link>
            </div>
          ) : session?.status === "abandoned" ? (
            <div className="text-center space-y-3">
              <TreeSVG treeType={treeType} stage={treeStage} isAlive={false} size={96} />
              <h2 className="text-xl font-bold">Session Ended Early</h2>
              <p className="text-muted-foreground text-sm">A dead tree was saved to your forest.</p>
              <Link href="/home"><Button>View Forest</Button></Link>
            </div>
          ) : session?.status === "failed" ? (
            <div className="text-center space-y-3">
              <div className="text-5xl">💀</div>
              <h2 className="text-xl font-bold text-destructive">Session Failed</h2>
              <p className="text-muted-foreground text-sm">Your tree died. Try again!</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : missedSession ? (
            <div className="text-center space-y-3">
              <TreeSVG treeType={treeType} stage="small" isAlive={false} size={96} />
              <h2 className="text-xl font-bold text-destructive">You Missed the Session</h2>
              <p className="text-muted-foreground text-sm">A dead tree was saved to your forest.</p>
              <Link href="/home"><Button>View Forest</Button></Link>
            </div>
          ) : (
            <DurationPicker onSelect={(secs) => startSession(secs)} />
          )}
        </section>

        {/* Right: Webcam PiP */}
        <aside className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Webcam</p>
          <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-zinc-900">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          {session?.status === "in_progress" && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${distracted ? "bg-destructive animate-pulse" : "bg-green-500"}`} />
              <span className="text-muted-foreground">{distracted ? "Distracted" : "Focused"}</span>
            </div>
          )}
        </aside>
      </main>

      {/* Distraction overlay */}
      <AnimatePresence>
        {distracted && <DistractionOverlay countdown={countdown} />}
      </AnimatePresence>
    </div>
  );
}
