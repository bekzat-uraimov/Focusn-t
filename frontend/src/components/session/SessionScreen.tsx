"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { CircularTimer } from "./CircularTimer";
import { DuckSprite } from "@/components/ducks/DuckSprite";
import { DistractionAlert, SessionFailed, SessionComplete } from "./DistractionAlert";
import { MOCK_DUCKS, MOCK_ROOMS } from "@/lib/mock-data";

const DuckSanctuary = dynamic(
  () => import("@/components/3d/DuckSanctuary").then(m => m.DuckSanctuary),
  { ssr: false, loading: () => <div style={{ width: 520, height: 440 }} /> }
);

const WebcamPip = dynamic(
  () => import("./WebcamPip").then(m => m.WebcamPip),
  { ssr: false }
);

type SessionMode = "idle" | "running" | "failed" | "complete";
type FocusStatus = "focused" | "questionable" | "distracted" | "away" | "recovering";

const DURATIONS = [
  { label: "25 min", seconds: 25 * 60, emoji: "🌱" },
  { label: "50 min", seconds: 50 * 60, emoji: "🌿" },
  { label: "90 min", seconds: 90 * 60, emoji: "🌳" },
];

const DUCK = MOCK_DUCKS[0];
const ROOM = MOCK_ROOMS[0];

function useSimulatedFocus(running: boolean) {
  const [score, setScore] = useState(94);
  const [status, setStatus] = useState<FocusStatus>("focused");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setScore(s => {
        const next = Math.max(0, Math.min(100, s + (Math.random() - 0.44) * 9));
        if (next >= 75)      { setStatus("focused");     setWarnings([]);                          setCountdown(null); }
        else if (next >= 50) { setStatus("questionable"); setWarnings(["looking away"]);           setCountdown(20); }
        else                 { setStatus("distracted");  setWarnings(["looking away","eyes closing"]); setCountdown(10); }
        return Math.round(next);
      });
    }, 800);
    return () => clearInterval(interval);
  }, [running]);

  return { score, status, warnings, countdown };
}

const duckMoodMap: Record<FocusStatus, "studying" | "worried" | "happy" | "celebrating" | "sleeping"> = {
  focused:     "studying",
  questionable:"worried",
  distracted:  "worried",
  away:        "sleeping",
  recovering:  "happy",
};

const statusLabel: Record<FocusStatus, string> = {
  focused:     "Focused 🟢",
  questionable:"⚠️ Questionable",
  distracted:  "🔴 Distracted!",
  away:        "Away 🔵",
  recovering:  "↩ Recovering",
};

const statusBg: Record<FocusStatus, string> = {
  focused:     "rgba(34,197,94,0.12)",
  questionable:"rgba(251,191,36,0.12)",
  distracted:  "rgba(239,68,68,0.12)",
  away:        "rgba(129,140,248,0.12)",
  recovering:  "rgba(103,232,249,0.12)",
};

const statusTextColor: Record<FocusStatus, string> = {
  focused:     "#16a34a",
  questionable:"#d97706",
  distracted:  "#dc2626",
  away:        "#6366f1",
  recovering:  "#0891b2",
};

export function SessionScreen() {
  const [mode, setMode]         = useState<SessionMode>("idle");
  const [duration, setDuration] = useState(DURATIONS[0].seconds);
  const [remaining, setRemaining] = useState(DURATIONS[0].seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { score, status, warnings, countdown } = useSimulatedFocus(mode === "running");

  const start = useCallback((secs: number) => {
    setRemaining(secs);
    setMode("running");
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current!); setMode("complete"); return 0; }
        return r - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f8fc", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Link href="/" className="flex items-center gap-2 font-black text-xl text-gray-800" style={{ fontFamily: "'Nunito', sans-serif" }}>
          🦆 FocusDuck
        </Link>
        <div className="flex items-center gap-3">
          {mode === "running" && (
            <motion.div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: statusBg[status], color: statusTextColor[status], border: `1px solid ${statusTextColor[status]}30` }}
              animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusTextColor[status] }} />
              {statusLabel[status]}
            </motion.div>
          )}
          <Link href="/room" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">Rooms</Link>
        </div>
      </nav>

      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {mode === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex items-center justify-center px-8 py-8 gap-16">

            {/* Island preview */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <DuckSanctuary width={480} height={420} showOrbit />
            </motion.div>

            {/* Setup card */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="w-80 flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 pb-2">
                <DuckSprite mood="happy" size={100} rarity={DUCK.rarity} />
                <div className="text-center">
                  <h1 className="font-black text-2xl text-gray-800" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {DUCK.name}
                  </h1>
                  <p className="text-gray-400 text-sm mt-0.5 capitalize">{DUCK.rarity} · Lv.{DUCK.level}</p>
                </div>
              </div>

              {/* XP bar */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between text-xs text-gray-400 font-medium mb-2">
                  <span>XP</span>
                  <span>{DUCK.xp} / {DUCK.xpMax}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #FFD166, #F4845F)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(DUCK.xp / DUCK.xpMax) * 100}%` }}
                    transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }} />
                </div>
              </div>

              {/* Duration picker */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-3">Session Length</p>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map(opt => (
                    <motion.button key={opt.seconds} onClick={() => setDuration(opt.seconds)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      className="py-3 px-2 rounded-xl text-sm font-black flex flex-col items-center gap-0.5 transition-all"
                      style={{
                        fontFamily: "'Nunito', sans-serif",
                        background: duration === opt.seconds ? "linear-gradient(135deg, #FFD166, #F4845F)" : "transparent",
                        color: duration === opt.seconds ? "#1a0a00" : "#9ca3af",
                        border: duration === opt.seconds ? "none" : "1.5px solid #e5e7eb",
                      }}>
                      <span className="text-base">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <motion.button onClick={() => start(duration)}
                whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(255,209,102,0.4)" }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-black text-xl transition-all"
                style={{ fontFamily: "'Nunito', sans-serif", background: "linear-gradient(135deg, #FFD166, #F4845F)", color: "#1a0a00", boxShadow: "0 4px 20px rgba(255,209,102,0.3)" }}>
                Let's Focus 🦆
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* ── RUNNING ── */}
        {mode === "running" && (
          <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex gap-0 overflow-hidden">

            {/* LEFT — island + duck companion */}
            <div className="flex-1 flex flex-col items-center justify-center relative" style={{ minWidth: 0 }}>

              {/* Status HUD overlay */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10">
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="px-5 py-2 rounded-full text-sm font-black shadow-lg"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: status === "distracted" ? "linear-gradient(135deg,#fee2e2,#fecaca)" : status === "questionable" ? "linear-gradient(135deg,#fef9c3,#fde68a)" : "linear-gradient(135deg,#dcfce7,#bbf7d0)",
                    color: statusTextColor[status],
                    border: `1.5px solid ${statusTextColor[status]}40`,
                  }}>
                  {statusLabel[status]}
                </motion.div>
              </div>

              {/* 3D island */}
              <div className="relative">
                <DuckSanctuary width={520} height={440} />
              </div>

              {/* Duck companion below island */}
              <div className="flex flex-col items-center -mt-4 z-10 relative">
                <motion.div
                  animate={status === "distracted" ? { x: [-6, 6, -6] } : {}}
                  transition={{ duration: 0.3, repeat: status === "distracted" ? Infinity : 0 }}>
                  <DuckSprite mood={duckMoodMap[status]} size={110} rarity={DUCK.rarity} />
                </motion.div>

                {/* Duck speech bubble */}
                <AnimatePresence mode="wait">
                  <motion.div key={status}
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="mt-1 px-4 py-2 rounded-2xl text-sm font-bold shadow-md max-w-xs text-center"
                    style={{
                      fontFamily: "'Nunito', sans-serif",
                      background: "white",
                      color: statusTextColor[status],
                      border: `1.5px solid ${statusTextColor[status]}30`,
                    }}>
                    {status === "focused"      && "Keep going! I'm proud 🌟"}
                    {status === "questionable" && "Hey, look at your screen! 👀"}
                    {status === "distracted"   && "Please come back! 😟"}
                    {status === "away"         && "Where did you go? 🔍"}
                    {status === "recovering"   && "Almost! Hold steady ↩"}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT — camera + stats */}
            <div className="w-72 flex flex-col gap-4 p-5 border-l border-gray-100 bg-white overflow-y-auto">

              {/* Webcam pip */}
              <div className="flex flex-col items-center gap-2">
                <WebcamPip status={status} score={score} />
                <p className="text-xs text-gray-400 font-medium">AI Attention Tracking</p>
              </div>

              {/* Timer */}
              <div className="flex justify-center">
                <CircularTimer
                  totalSeconds={duration}
                  remainingSeconds={remaining}
                  attentionScore={score}
                  status={status}
                />
              </div>

              {/* Warning pills */}
              <AnimatePresence>
                {warnings.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-1.5">
                    {warnings.map(w => (
                      <span key={w} className="px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" }}>
                        {w}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Streak + session stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Streak", value: "5 days", emoji: "🔥" },
                  { label: "XP Rate", value: "+12/min", emoji: "⭐" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 flex flex-col gap-0.5 border border-gray-100">
                    <span className="text-lg">{s.emoji}</span>
                    <span className="font-black text-gray-800 text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>{s.value}</span>
                    <span className="text-xs text-gray-400">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Room strip */}
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">Room</p>
                <div className="flex flex-col gap-2">
                  {ROOM.members.slice(0, 3).map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm">{m.avatar}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                          style={{ background: m.status === "focused" ? "#22c55e" : m.status === "distracted" ? "#ef4444" : "#94a3b8" }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 flex-1">{m.name}</span>
                      <div className="h-1.5 w-14 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${m.score}%`, background: m.score >= 70 ? "#22c55e" : "#ef4444" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distraction overlay */}
      <DistractionAlert
        visible={mode === "running" && status === "distracted" && (countdown ?? 0) <= 7}
        countdown={countdown ?? 0}
        warnings={warnings}
      />

      <SessionFailed visible={mode === "failed"} onRetry={() => setMode("idle")} onExit={() => {}} />
      <SessionComplete visible={mode === "complete"} xpGained={Math.round((duration / 60) * 12)} duckName={DUCK.name} onContinue={() => setMode("idle")} />
    </div>
  );
}
