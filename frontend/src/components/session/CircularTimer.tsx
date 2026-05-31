"use client";

import { motion } from "framer-motion";

interface CircularTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  attentionScore: number;
  status: "focused" | "questionable" | "distracted" | "away" | "recovering";
}

const statusColors = {
  focused:     { ring: "#FFD166", glow: "rgba(255,209,102,0.3)", text: "#FFD166" },
  questionable:{ ring: "#fbbf24", glow: "rgba(251,191,36,0.3)",  text: "#fbbf24" },
  distracted:  { ring: "#ef4444", glow: "rgba(239,68,68,0.4)",   text: "#ef4444" },
  away:        { ring: "#818cf8", glow: "rgba(129,140,248,0.3)", text: "#818cf8" },
  recovering:  { ring: "#67e8f9", glow: "rgba(103,232,249,0.3)", text: "#67e8f9" },
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CircularTimer({ totalSeconds, remainingSeconds, attentionScore, status }: CircularTimerProps) {
  const progress = remainingSeconds / totalSeconds;
  const colors = statusColors[status];

  const R = 110;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: `0 0 60px ${colors.glow}` }}
        animate={{ boxShadow: [`0 0 40px ${colors.glow}`, `0 0 80px ${colors.glow}`, `0 0 40px ${colors.glow}`] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* SVG rings */}
      <svg width="280" height="280" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="140" cy="140" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        {/* Score ring (inner, thinner) */}
        <motion.circle
          cx="140" cy="140" r="90" fill="none"
          stroke={attentionScore >= 70 ? "#52b788" : attentionScore >= 50 ? "#fbbf24" : "#ef4444"}
          strokeWidth="4"
          strokeDasharray={2 * Math.PI * 90}
          strokeDashoffset={2 * Math.PI * 90 * (1 - attentionScore / 100)}
          strokeLinecap="round"
          animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - attentionScore / 100) }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Time ring */}
        <motion.circle
          cx="140" cy="140" r={R} fill="none"
          stroke={colors.ring}
          strokeWidth="10"
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-1 z-10">
        <motion.div
          className="font-display text-5xl font-black tracking-tight"
          style={{ color: colors.text, fontFamily: "'Nunito', sans-serif" }}
          animate={{ scale: status === "distracted" ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: status === "distracted" ? Infinity : 0 }}
        >
          {formatTime(remainingSeconds)}
        </motion.div>

        <div className="text-white/40 text-sm font-medium tracking-widest uppercase">
          {status === "focused"      && "focusing"}
          {status === "questionable" && "⚠ check in"}
          {status === "distracted"   && "refocus!"}
          {status === "away"         && "come back"}
          {status === "recovering"   && "↩ hold it"}
        </div>

        {/* Attention score badge */}
        <motion.div
          className="mt-1 px-3 py-1 rounded-full text-xs font-bold"
          style={{
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${colors.ring}40`,
            color: colors.ring,
          }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {attentionScore}% focus
        </motion.div>
      </div>
    </div>
  );
}
