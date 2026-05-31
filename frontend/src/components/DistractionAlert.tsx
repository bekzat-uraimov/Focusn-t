"use client";

import type { FocusState } from "@/lib/focus/types";

interface Props {
  status: FocusState["status"];
  countdown: number | null;
  warnings: string[];
  isDark: boolean;
}

const LABELS: Partial<Record<FocusState["status"], string>> = {
  questionable: "Getting distracted",
  distracted: "Very distracted",
  away: "Face not visible",
  recovering: "Recovering focus",
};

const COLORS: Partial<Record<FocusState["status"], string>> = {
  questionable: "#fbbf24",
  distracted: "#f87171",
  away: "#94a3b8",
  recovering: "#34d399",
};

export default function DistractionAlert({ status, countdown, warnings, isDark }: Props) {
  const visible = status === "questionable" || status === "distracted" || status === "away" || status === "recovering";
  if (!visible) return null;

  const color = COLORS[status] ?? "#94a3b8";
  const label = LABELS[status] ?? status;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", animation: "float-in 0.3s cubic-bezier(0.16,1,0.3,1) both" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${color}50`,
        borderRadius: "20px",
        padding: "7px 14px",
        boxShadow: `0 0 24px ${color}20`,
      }}>
        <span style={{
          width: "7px", height: "7px", borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: status !== "recovering" ? "pulse-dot 1s ease-in-out infinite" : "none",
          flexShrink: 0,
        }} />
        <span style={{ color: isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.75)", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {label}
        </span>
        {countdown !== null && (
          <span style={{
            background: `${color}22`,
            border: `1px solid ${color}55`,
            color,
            borderRadius: "8px",
            padding: "2px 8px",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
          }}>
            {countdown}s
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div style={{ display: "flex", gap: "5px" }}>
          {warnings.slice(0, 2).map((w) => (
            <span key={w} style={{
              background: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
              color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
              borderRadius: "10px",
              padding: "2px 9px",
              fontSize: "11px",
              letterSpacing: "0.03em",
            }}>
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
