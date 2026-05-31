"use client";

import type { FocusStatus } from "@/lib/focus/types";

type SessionState = "idle" | "running" | "completed" | "failed";

interface TimerProps {
  remaining: number;
  duration: number;
  state: SessionState;
  isDark: boolean;
  attentionScore: number;
  focusStatus: FocusStatus;
  formatTime: (s: number) => string;
  onStart: () => void;
  onGiveUp: () => void;
  onReset: () => void;
  onDurationChange: (d: number) => void;
  durations: number[];
}

const SESSION_LABEL: Record<SessionState, string> = {
  idle: "Ready",
  running: "Focusing",
  completed: "Complete",
  failed: "Abandoned",
};

export default function Timer({
  remaining,
  duration,
  state,
  isDark,
  attentionScore,
  focusStatus,
  formatTime,
  onStart,
  onGiveUp,
  onReset,
  onDurationChange,
  durations,
}: TimerProps) {
  const progress = duration > 0 ? 1 - remaining / duration : 0;

  // Status dot reflects focus when running
  const dotColor =
    state === "running"
      ? focusStatus === "focused" || focusStatus === "recovering"
        ? "#818cf8"
        : focusStatus === "questionable"
        ? "#fbbf24"
        : focusStatus === "distracted"
        ? "#f87171"
        : "#94a3b8"
      : state === "completed"
      ? "#34d399"
      : state === "failed"
      ? "#f87171"
      : isDark
      ? "rgba(255,255,255,0.2)"
      : "rgba(0,0,0,0.18)";

  const scoreColor =
    attentionScore >= 75 ? "#34d399" : attentionScore >= 50 ? "#fbbf24" : "#f87171";

  const textPrimary = isDark ? "rgba(255,255,255,0.95)" : "#0f172a";
  const textSecondary = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.42)";
  const cardBg = isDark ? "rgba(10,10,20,0.65)" : "rgba(255,255,255,0.62)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.85)";
  const pillBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
  const progressTrack = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const dActive = {
    bg: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    text: isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)",
  };

  const timeColor =
    state === "completed" ? "#22c55e" :
    state === "failed" ? (isDark ? "#fca5a5" : "#ef4444") :
    textPrimary;

  return (
    <div
      className="hud-enter"
      style={{
        width: "268px",
        background: cardBg,
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        border: `1px solid ${cardBorder}`,
        borderRadius: "24px",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: isDark
          ? "0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03) inset"
          : "0 16px 48px rgba(30,100,180,0.2), 0 0 0 1px rgba(255,255,255,0.5) inset",
      }}
    >
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span
            style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: dotColor,
              boxShadow: state !== "idle" ? `0 0 8px ${dotColor}` : "none",
              animation: state === "running" ? "pulse-dot 2s ease-in-out infinite" : "none",
              flexShrink: 0,
            }}
          />
          <span style={{ color: textSecondary, fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
            {SESSION_LABEL[state]}
          </span>
        </div>

        {state === "running" && (
          <span style={{ color: scoreColor, fontSize: "12px", fontWeight: 700, fontFamily: "'SF Mono', 'JetBrains Mono', monospace" }}>
            {Math.round(attentionScore)}
          </span>
        )}
      </div>

      {/* Time */}
      <div style={{
        fontSize: "62px",
        fontWeight: 200,
        color: timeColor,
        letterSpacing: "-0.04em",
        fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace",
        lineHeight: 1,
        textAlign: "center",
        transition: "color 0.5s",
        userSelect: "none",
      }}>
        {formatTime(remaining)}
      </div>

      {/* Progress bar */}
      {(state === "running" || state === "completed") && (
        <div style={{ width: "100%", height: "2px", background: progressTrack, borderRadius: "1px", overflow: "hidden", marginTop: "-8px" }}>
          <div style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, #6366f1, #a78bfa)",
            borderRadius: "1px",
            transition: "width 1s linear",
          }} />
        </div>
      )}

      {/* Duration presets */}
      {state === "idle" && (
        <div style={{ display: "flex", gap: "4px", background: pillBg, borderRadius: "14px", padding: "4px" }}>
          {durations.map((d) => (
            <button
              key={d}
              className="duration-btn"
              onClick={() => onDurationChange(d)}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                background: d === duration ? dActive.bg : "transparent",
                color: d === duration ? dActive.text : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
                letterSpacing: "-0.01em",
              }}
            >
              {d / 60}m
            </button>
          ))}
        </div>
      )}

      {/* Action */}
      <div style={{ width: "100%" }}>
        {state === "idle" && (
          <button
            className="focus-btn"
            onClick={onStart}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "14px",
              border: "1px solid rgba(99,102,241,0.35)",
              background: isDark
                ? "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))"
                : "linear-gradient(135deg, rgba(99,102,241,0.88), rgba(139,92,246,0.78))",
              color: isDark ? "rgba(255,255,255,0.9)" : "#fff",
              fontSize: "14px", fontWeight: 600, cursor: "pointer", letterSpacing: "-0.02em",
              boxShadow: isDark ? "0 0 24px rgba(99,102,241,0.12)" : "0 4px 20px rgba(99,102,241,0.3)",
            }}
          >
            Start Focus
          </button>
        )}

        {state === "running" && (
          <button
            className="giveup-btn"
            onClick={onGiveUp}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "14px",
              border: `1px solid rgba(239,68,68,${isDark ? "0.25" : "0.35"})`,
              background: `rgba(239,68,68,${isDark ? "0.07" : "0.08"})`,
              color: isDark ? "rgba(252,165,165,0.85)" : "#dc2626",
              fontSize: "14px", fontWeight: 600, cursor: "pointer", letterSpacing: "-0.02em",
            }}
          >
            Give Up
          </button>
        )}

        {(state === "completed" || state === "failed") && (
          <>
            <p style={{
              textAlign: "center",
              marginBottom: "12px",
              fontSize: "12px",
              color: state === "completed" ? "rgba(52,211,153,0.8)" : isDark ? "rgba(252,165,165,0.65)" : "#ef4444",
            }}>
              {state === "completed" ? "A new world joined your galaxy" : "The planet drifts back into the void"}
            </p>
            <button
              className="reset-btn"
              onClick={onReset}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "14px",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.1)"}`,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)",
                fontSize: "14px", fontWeight: 600, cursor: "pointer", letterSpacing: "-0.02em",
              }}
            >
              New Session
            </button>
          </>
        )}
      </div>
    </div>
  );
}
