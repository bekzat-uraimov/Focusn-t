"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api";

export interface Session {
  id: string;
  duration_secs: number;
  started_at: string;
  status: "in_progress" | "completed" | "failed" | "abandoned" | "scheduled";
}

export function useSession(roomId: string) {
  const [session, setSession] = useState<Session | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  /** Inject a session fetched externally (e.g. scheduled session on mount). */
  const hydrateSession = useCallback((s: Session) => {
    setSession(s);
    setElapsed(0);
    if (s.status === "in_progress") startTimer();
  }, [startTimer]);

  const fetchCurrentSession = useCallback(async (): Promise<Session | null> => {
    try {
      const s = await api.get<Session>(`/sessions/current?room_id=${roomId}`);
      return s;
    } catch {
      return null;
    }
  }, [roomId]);

  const startSession = useCallback(async (durationSecs: number) => {
    const s = await api.post<Session>("/sessions", { room_id: roomId, duration_secs: durationSecs });
    setSession(s);
    setElapsed(0);
    startTimer();
    return s;
  }, [roomId, startTimer]);

  const endSession = useCallback(async (status: "completed" | "failed" | "abandoned") => {
    if (!session) return;
    stopTimer();
    await api.patch(`/sessions/${session.id}`, { status, elapsed_secs: elapsed });
    setSession((prev) => prev ? { ...prev, status } : null);
  }, [session, elapsed, stopTimer]);

  const remaining = session ? Math.max(0, session.duration_secs - elapsed) : 0;
  const progress = session ? Math.min(1, elapsed / session.duration_secs) : 0;

  return { session, elapsed, remaining, progress, startSession, endSession, hydrateSession, fetchCurrentSession };
}
