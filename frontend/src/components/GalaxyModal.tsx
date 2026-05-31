"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { api, PlanetDetail } from "@/lib/api";

const PlanetScene = dynamic(() => import("@/components/PlanetScene"), { ssr: false });

const PLANET_COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f87171"];
const MODE_COLORS   = { coding: "#818cf8", writing: "#a78bfa" } as Record<string, string>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatMins(secs: number) {
  const m = Math.floor(secs / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export default function GalaxyModal({ isOpen, onClose, isDark }: Props) {
  const [planets, setPlanets] = useState<PlanetDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const t         = (dark: string, light: string) => isDark ? dark : light;
  const overlay   = t("rgba(3,3,10,0.78)", "rgba(10,30,80,0.55)");
  const cardBg    = t("rgba(10,10,22,0.85)", "rgba(255,255,255,0.72)");
  const border    = `1px solid ${t("rgba(255,255,255,0.08)","rgba(0,0,0,0.09)")}`;
  const textStrong = t("rgba(255,255,255,0.9)", "rgba(0,0,0,0.82)");
  const textMid   = t("rgba(255,255,255,0.6)", "rgba(0,0,0,0.58)");
  const textFaint = t("rgba(255,255,255,0.35)", "rgba(0,0,0,0.35)");
  const itemBg    = t("rgba(255,255,255,0.04)", "rgba(0,0,0,0.04)");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.galaxy.planets()
      .then((d) => setPlanets(d.planets))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: overlay,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{
        width: "min(700px, 96vw)",
        maxHeight: "82vh",
        background: cardBg,
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border,
        borderRadius: 24,
        boxShadow: t("0 32px 80px rgba(0,0,0,0.8)","0 24px 60px rgba(30,80,180,0.2)"),
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "float-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: border }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: textStrong }}>
              Your Galaxy
            </div>
            <div style={{ fontSize: 13, color: textFaint, marginTop: 3 }}>
              {planets.length} {planets.length === 1 ? "world" : "worlds"} collected
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            background: t("rgba(255,255,255,0.06)","rgba(0,0,0,0.06)"),
            border, color: textMid, fontSize: 18, cursor: "pointer",
          }}>×</button>
        </div>

        {/* 3D galaxy preview */}
        <div style={{ position: "relative", height: 220, width: "100%", overflow: "hidden", flexShrink: 0 }}>
          <Suspense fallback={null}>
            <PlanetScene
              progress={0}
              hasFailed={false}
              isActive={false}
              modelIndex={0}
              collectedCount={planets.length}
              isDark={isDark}
              attentionScore={100}
            />
          </Suspense>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
            background: `linear-gradient(to bottom, transparent, ${cardBg})`,
            pointerEvents: "none",
          }} />
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "20px 28px 28px", flex: 1 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ height: 110, borderRadius: 16, background: itemBg, border, animation: "pulse-dot 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : planets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: textFaint }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🪐</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                No planets yet.<br />Complete your first focus session to start building your galaxy.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {planets.map((p) => {
                const dotColor = PLANET_COLORS[p.collection_index % PLANET_COLORS.length];
                const scoreColor = (p.session.avg_attention_score ?? 0) >= 75 ? "#34d399"
                  : (p.session.avg_attention_score ?? 0) >= 50 ? "#fbbf24" : "#f87171";
                return (
                  <div key={p.id} style={{
                    background: itemBg,
                    border,
                    borderRadius: 16,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}>
                    {/* Planet dot + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: dotColor, boxShadow: `0 0 12px ${dotColor}60`, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: textStrong }}>
                          World #{p.collection_index + 1}
                        </div>
                        <div style={{ fontSize: 11, color: textFaint }}>{formatDate(p.created_at)}</div>
                      </div>
                    </div>
                    {/* Stats */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 8,
                        background: `${MODE_COLORS[p.session.mode] ?? "#818cf8"}18`,
                        color: MODE_COLORS[p.session.mode] ?? "#818cf8",
                        border: `1px solid ${MODE_COLORS[p.session.mode] ?? "#818cf8"}30`,
                        textTransform: "capitalize",
                      }}>
                        {p.session.mode}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 8,
                        background: t("rgba(255,255,255,0.05)","rgba(0,0,0,0.05)"),
                        color: textMid, border,
                      }}>
                        {formatMins(p.session.duration_seconds)}
                      </span>
                      {p.session.avg_attention_score != null && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 8,
                          background: `${scoreColor}14`, color: scoreColor,
                          border: `1px solid ${scoreColor}30`,
                          fontFamily: "'SF Mono','JetBrains Mono',monospace",
                        }}>
                          {Math.round(p.session.avg_attention_score)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
