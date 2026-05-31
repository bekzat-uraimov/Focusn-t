"use client";

import { useEffect, useState } from "react";
import { api, AnalyticsSummary, SessionResponse } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

function formatMins(mins: number) {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AnalyticsModal({ isOpen, onClose, isDark }: Props) {
  const [summary,  setSummary]  = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading,  setLoading]  = useState(false);

  const t         = (dark: string, light: string) => isDark ? dark : light;
  const overlay   = t("rgba(3,3,10,0.78)", "rgba(10,30,80,0.55)");
  const cardBg    = t("rgba(10,10,22,0.85)", "rgba(255,255,255,0.72)");
  const border    = `1px solid ${t("rgba(255,255,255,0.08)","rgba(0,0,0,0.09)")}`;
  const textStrong = t("rgba(255,255,255,0.9)", "rgba(0,0,0,0.82)");
  const textMid   = t("rgba(255,255,255,0.6)", "rgba(0,0,0,0.58)");
  const textFaint = t("rgba(255,255,255,0.35)", "rgba(0,0,0,0.35)");
  const tileBg    = t("rgba(255,255,255,0.04)", "rgba(0,0,0,0.04)");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([api.analytics.summary(), api.analytics.sessions(10)])
      .then(([s, ss]) => { setSummary(s); setSessions(ss); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const totalModes = summary ? Object.values(summary.mode_breakdown).reduce((a, b) => a + b, 0) : 0;
  const scoreColor = summary?.avg_attention_score != null
    ? summary.avg_attention_score >= 75 ? "#34d399"
      : summary.avg_attention_score >= 50 ? "#fbbf24" : "#f87171"
    : textFaint;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: overlay, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{
        width: "min(660px, 96vw)", maxHeight: "86vh",
        background: cardBg, backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
        border, borderRadius: 24,
        boxShadow: t("0 32px 80px rgba(0,0,0,0.8)","0 24px 60px rgba(30,80,180,0.2)"),
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "float-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: border }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: textStrong }}>Analytics</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: t("rgba(255,255,255,0.06)","rgba(0,0,0,0.06)"), border, color: textMid, fontSize: 18, cursor: "pointer",
          }}>×</button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 28px 28px", flex: 1 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[0,1,2,3].map((i) => (
                <div key={i} style={{ height: 80, borderRadius: 14, background: tileBg, border, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : summary ? (
            <>
              {/* Stat tiles */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Sessions", value: String(summary.total_sessions) },
                  { label: "Focus time", value: formatMins(summary.total_focus_minutes) },
                  { label: "Avg score", value: summary.avg_attention_score != null ? String(Math.round(summary.avg_attention_score)) : "—", color: scoreColor },
                  { label: "Current streak", value: `${summary.current_streak_days}d` },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: tileBg, border, borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, color: textFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.04em", color: color ?? textStrong, fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Mode breakdown */}
              {totalModes > 0 && (
                <div style={{ background: tileBg, border, borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: textFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>Mode breakdown</div>
                  {Object.entries(summary.mode_breakdown).map(([mode, count]) => {
                    const pct = Math.round((count / totalModes) * 100);
                    const barColor = mode === "coding" ? "#818cf8" : "#a78bfa";
                    return (
                      <div key={mode} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, color: textMid, textTransform: "capitalize" }}>{mode}</span>
                          <span style={{ fontSize: 12, color: textFaint, fontFamily: "monospace" }}>{count} · {pct}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: t("rgba(255,255,255,0.07)","rgba(0,0,0,0.07)"), overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}, ${barColor}aa)`, borderRadius: 3, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Streak row */}
              <div style={{ background: tileBg, border, borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: textFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Current streak</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#34d399", fontFamily: "monospace" }}>{summary.current_streak_days} days</div>
                </div>
                <div style={{ width: 1, background: t("rgba(255,255,255,0.06)","rgba(0,0,0,0.06)") }} />
                <div>
                  <div style={{ fontSize: 11, color: textFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Longest streak</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: textStrong, fontFamily: "monospace" }}>{summary.longest_streak_days} days</div>
                </div>
              </div>

              {/* Recent sessions */}
              {sessions.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: textFaint, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Recent sessions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {sessions.map((s) => {
                      const resultColor = s.result === "completed" ? "#34d399" : s.result === "failed" ? "#f87171" : textFaint;
                      return (
                        <div key={s.id} style={{ background: tileBg, border, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: resultColor, boxShadow: `0 0 6px ${resultColor}`, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: textMid, textTransform: "capitalize", minWidth: 50 }}>{s.mode}</span>
                          <span style={{ fontSize: 12, color: textFaint }}>{formatDate(s.started_at)}</span>
                          <span style={{ fontSize: 12, color: textMid, marginLeft: "auto" }}>{Math.floor(s.duration_seconds / 60)}m</span>
                          {s.avg_attention_score != null && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: s.avg_attention_score >= 75 ? "#34d399" : s.avg_attention_score >= 50 ? "#fbbf24" : "#f87171", fontFamily: "monospace" }}>
                              {Math.round(s.avg_attention_score)}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: resultColor, fontWeight: 600, textTransform: "capitalize", minWidth: 60, textAlign: "right" }}>{s.result ?? "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", color: textFaint, fontSize: 14 }}>
              No data yet — complete some sessions first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
