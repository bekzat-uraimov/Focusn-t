"use client";

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import Timer from "@/components/Timer";
import DistractionAlert from "@/components/DistractionAlert";
import type { FocusMode, FocusState } from "@/lib/focus/types";

const PlanetScene = dynamic(() => import("@/components/PlanetScene"), { ssr: false });
const FocusSession = dynamic(() => import("@/components/FocusSession"), { ssr: false });

const DURATIONS = [15 * 60, 25 * 60, 45 * 60, 60 * 60];

type SessionState = "idle" | "running" | "completed" | "failed";

const FOCUS_LABEL: Record<FocusState["status"], string> = {
  focused: "Focused",
  questionable: "Drifting",
  distracted: "Distracted",
  away: "Away",
  recovering: "Recovering",
};

const WARNING_ICONS: Record<string, string> = {
  "looking right": "→",
  "looking left": "←",
  "looking up": "↑",
  "looking down": "↓",
  "eyes closing": "~",
  "phone detected": "📵",
  "hand in lap": "✋",
  "gaze out": "👁",
};

export default function Home() {
  const [duration, setDuration] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [modelIndex, setModelIndex] = useState(0);
  const [collected, setCollected] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [focusMode, setFocusMode] = useState<FocusMode>("coding");
  // Pitch down limit for writing mode (degrees, stored as negative)
  const [pitchDownLimit, setPitchDownLimit] = useState(-40);

  const [focusStatus, setFocusStatus] = useState<FocusState["status"]>("focused");
  const [attentionScore, setAttentionScore] = useState(100);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const collectedRef = useRef(0);
  const notificationRef = useRef<Notification | null>(null);
  const awayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("focusnt_collected");
    const n = stored ? parseInt(stored, 10) : 0;
    setCollected(n);
    collectedRef.current = n;
  }, []);

  const clearTick = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startSession = useCallback(() => {
    clearTick();
    setElapsed(0);
    setSessionState("running");
    setModelIndex(Math.floor(Math.random() * 4));
    setFocusStatus("focused");
    setAttentionScore(100);
    setCountdown(null);
    setWarnings([]);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [clearTick]);

  const giveUp = useCallback(() => {
    clearTick();
    notificationRef.current?.close();
    notificationRef.current = null;
    setSessionState("failed");
    setTimeout(() => { setSessionState("idle"); setElapsed(0); }, 2500);
  }, [clearTick]);

  const reset = useCallback(() => {
    clearTick();
    notificationRef.current?.close();
    notificationRef.current = null;
    setSessionState("idle");
    setElapsed(0);
  }, [clearTick]);

  const handleFocusStateChange = useCallback(
    (s: Pick<FocusState, "status" | "attentionScore" | "countdownRemaining" | "activeWarnings">) => {
      setFocusStatus(s.status);
      setAttentionScore(s.attentionScore);
      setCountdown(s.countdownRemaining);
      setWarnings(s.activeWarnings);
    },
    []
  );

  useEffect(() => {
    if (sessionState !== "running") return;
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= duration) {
          clearTick();
          notificationRef.current?.close();
          notificationRef.current = null;
          setSessionState("completed");
          const n = collectedRef.current + 1;
          collectedRef.current = n;
          setCollected(n);
          localStorage.setItem("focusnt_collected", String(n));
        }
        return next;
      });
    }, 1000);
    return clearTick;
  }, [sessionState, duration, clearTick]);

  // Notification + beep for distracted AND away states
  useEffect(() => {
    if (sessionState !== "running") {
      notificationRef.current?.close();
      notificationRef.current = null;
      return;
    }

    const isAlert = focusStatus === "distracted" || focusStatus === "away" || focusStatus === "questionable";

    if (isAlert) {
      if (!notificationRef.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
        const isAway = focusStatus === "away";
        const isQuestionable = focusStatus === "questionable";
        const n = new Notification(
          isAway ? "⚠️ focusn't — Face not visible"
          : isQuestionable ? "⚠️ focusn't — Getting distracted"
          : "⚠️ focusn't — Very distracted",
          {
            body: isAway
              ? "You left your session 🪐 Look at the camera to continue."
              : isQuestionable
              ? "Heads up 🪐 Refocus before your session fails."
              : "Refocus now 🪐 Session fails in 5 seconds.",
            icon: "/favicon.ico",
            tag: "focus-alert",
            requireInteraction: false,
          }
        );
        n.onclick = () => window.focus();
        notificationRef.current = n;

        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.4);
        } catch {}
      }
    } else {
      notificationRef.current?.close();
      notificationRef.current = null;
    }
  }, [focusStatus, sessionState]);

  // Auto-fail session after 30s of "away" (face not visible)
  useEffect(() => {
    if (sessionState !== "running" || focusStatus !== "away") {
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
        awayTimeoutRef.current = null;
      }
      return;
    }
    awayTimeoutRef.current = setTimeout(() => {
      awayTimeoutRef.current = null;
      giveUp();
    }, 30000);
    return () => {
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
        awayTimeoutRef.current = null;
      }
    };
  }, [focusStatus, sessionState, giveUp]);

  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;
  const remaining = Math.max(0, duration - elapsed);
  const isActive = sessionState === "running" || sessionState === "completed";

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Threshold overrides: always apply pitchDownLimit for writing mode
  const thresholdOverrides = useMemo(
    () => focusMode === "writing" ? { pitchDownLimit } : undefined,
    [focusMode, pitchDownLimit]
  );

  const vignetteRgb =
    focusStatus === "distracted" ? "220,38,38" :
    focusStatus === "questionable" ? "217,119,6" :
    focusStatus === "away" ? "100,116,139" : null;
  const showVignette = !!vignetteRgb && sessionState === "running";
  const showBigCountdown = sessionState === "running" && focusStatus === "distracted" && countdown !== null;

  const scoreColor = attentionScore >= 75 ? "#34d399" : attentionScore >= 50 ? "#fbbf24" : "#f87171";

  const bg = isDark
    ? "radial-gradient(ellipse at 72% 18%, rgba(55,25,95,0.45) 0%, transparent 55%), radial-gradient(ellipse at 18% 82%, rgba(15,35,75,0.35) 0%, transparent 50%), #03030a"
    : "linear-gradient(180deg, #1565c0 0%, #1e88e5 18%, #42a5f5 40%, #81d4fa 65%, #b3e5fc 85%, #e1f5fe 100%)";

  const t = (dark: string, light: string) => isDark ? dark : light;
  const textFaint = t("rgba(255,255,255,0.35)", "rgba(0,0,0,0.38)");
  const textMid   = t("rgba(255,255,255,0.6)", "rgba(0,0,0,0.58)");
  const textStrong = t("rgba(255,255,255,0.9)", "rgba(0,0,0,0.78)");
  const glass = t("rgba(10,10,20,0.6)", "rgba(255,255,255,0.62)");
  const glassBorder = t("rgba(255,255,255,0.08)", "rgba(255,255,255,0.82)");
  const glassShadow = t("0 16px 48px rgba(0,0,0,0.65)", "0 12px 40px rgba(30,100,180,0.18)");

  const CAM_W = 248;
  const CAM_TOP = 78;
  const CAM_LEFT = 32;

  return (
    <main style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: bg, zIndex: 0 }} />

      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <Suspense fallback={null}>
          <PlanetScene
            progress={progress}
            hasFailed={sessionState === "failed"}
            isActive={isActive}
            modelIndex={modelIndex}
            collectedCount={collected}
            isDark={isDark}
            attentionScore={attentionScore}
          />
        </Suspense>
      </div>

      {/* Vignette */}
      {showVignette && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 2,
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(${vignetteRgb},0.45) 100%)`,
          pointerEvents: "none",
          animation: focusStatus === "distracted" ? "vignette-pulse 1.5s ease-in-out infinite" : "none",
        }} />
      )}

      {/* Big distracted countdown */}
      {showBigCountdown && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          zIndex: 4, pointerEvents: "none", textAlign: "center",
          animation: "countdown-pulse 1s ease-in-out infinite",
        }}>
          <div style={{
            fontSize: countdown! <= 5 ? "172px" : "128px",
            fontWeight: 100,
            color: `rgba(248,113,113,${countdown! <= 5 ? 1 : 0.82})`,
            fontFamily: "'SF Mono','JetBrains Mono',monospace",
            letterSpacing: "-0.06em",
            lineHeight: 1,
            textShadow: "0 0 80px rgba(239,68,68,0.55)",
            transition: "font-size 0.3s, color 0.3s",
          }}>
            {countdown}
          </div>
          <div style={{ color: "rgba(248,113,113,0.55)", fontSize: "13px", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: "10px" }}>
            refocus now
          </div>
        </div>
      )}

      {/* UI layer */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>

        {/* ── Top bar ── */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 32px", pointerEvents: "auto" }}>
          <span style={{ color: textStrong, fontSize: "15px", fontWeight: 600, letterSpacing: "-0.02em" }}>
            focusn&rsquo;t
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {sessionState === "idle" && (
              <div style={{ display: "flex", background: t("rgba(255,255,255,0.06)","rgba(0,0,0,0.06)"), border: `1px solid ${glassBorder}`, borderRadius: "14px", padding: "3px" }}>
                {(["coding", "writing"] as const).map((m) => (
                  <button key={m} onClick={() => setFocusMode(m)} style={{
                    padding: "5px 14px", borderRadius: "11px", border: "none", cursor: "pointer",
                    background: focusMode === m ? t("rgba(255,255,255,0.1)","rgba(0,0,0,0.1)") : "transparent",
                    color: focusMode === m ? textStrong : textFaint,
                    fontSize: "12px", fontWeight: 500, letterSpacing: "0.02em", transition: "all 0.15s",
                  }}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            )}
            {sessionState !== "idle" && (
              <span style={{ color: textFaint, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{focusMode}</span>
            )}
            <button onClick={() => setIsDark(d => !d)} style={{
              background: t("rgba(255,255,255,0.07)","rgba(0,0,0,0.07)"),
              border: `1px solid ${t("rgba(255,255,255,0.12)","rgba(0,0,0,0.1)")}`,
              borderRadius: "20px", padding: "5px 14px", cursor: "pointer",
              color: textMid, fontSize: "13px", fontWeight: 500, transition: "all 0.2s",
            }}>
              {isDark ? "☀ Day" : "☽ Night"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", color: textFaint, fontSize: "13px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", display: "inline-block", background: collected > 0 ? "#818cf8" : t("rgba(255,255,255,0.15)","rgba(0,0,0,0.15)"), boxShadow: collected > 0 ? "0 0 8px #818cf8" : "none" }} />
              {collected} {collected === 1 ? "world" : "worlds"}
            </div>
          </div>
        </div>

        {/* ── Left column: camera + pitch slider + warnings ── */}
        <div style={{ position: "absolute", top: `${CAM_TOP}px`, left: `${CAM_LEFT}px`, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "auto" }}>

          {/* Camera / focus detection widget */}
          <Suspense fallback={null}>
            <FocusSession
              mode={focusMode}
              enabled={sessionState === "running"}
              isDark={isDark}
              thresholdOverrides={thresholdOverrides}
              onSessionFailed={giveUp}
              onStateChange={handleFocusStateChange}
            />
          </Suspense>

          {/* Pitch angle slider — writing mode only */}
          {focusMode === "writing" && (
            <div style={{
              width: `${CAM_W}px`,
              background: glass,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${glassBorder}`,
              borderRadius: "14px",
              padding: "12px 16px",
              boxShadow: glassShadow,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ color: textMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Look-down angle
                </span>
                <span style={{ color: textStrong, fontSize: "12px", fontWeight: 700, fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>
                  {Math.abs(pitchDownLimit)}°
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={65}
                value={Math.abs(pitchDownLimit)}
                onChange={(e) => setPitchDownLimit(-Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "#818cf8",
                  cursor: "pointer",
                  height: "4px",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ color: textFaint, fontSize: "10px" }}>strict</span>
                <span style={{ color: textFaint, fontSize: "10px" }}>relaxed</span>
              </div>
            </div>
          )}

          {/* Live warnings / focus report */}
          {sessionState === "running" && warnings.length > 0 && (
            <div style={{
              width: `${CAM_W}px`,
              background: glass,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${glassBorder}`,
              borderRadius: "14px",
              padding: "12px 14px",
              boxShadow: glassShadow,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}>
              <span style={{ color: textFaint, fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px" }}>
                Dropping because
              </span>
              {warnings.map((w) => {
                const icon = WARNING_ICONS[w] ?? "·";
                return (
                  <div key={w} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: t("rgba(255,255,255,0.04)","rgba(0,0,0,0.04)"),
                    border: `1px solid ${t("rgba(255,255,255,0.07)","rgba(0,0,0,0.07)")}`,
                    borderRadius: "9px",
                    padding: "5px 10px",
                  }}>
                    <span style={{ fontSize: "13px", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                    <span style={{ color: textMid, fontSize: "12px", fontWeight: 500, letterSpacing: "-0.01em", textTransform: "capitalize" }}>
                      {w}
                    </span>
                    <span style={{ marginLeft: "auto", color: "#f87171", fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>
                      ↓
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Timer — bottom right ── */}
        <div style={{ position: "absolute", bottom: "32px", right: "32px", pointerEvents: "auto" }}>
          <Timer
            remaining={remaining}
            duration={duration}
            state={sessionState}
            isDark={isDark}
            attentionScore={attentionScore}
            focusStatus={focusStatus}
            formatTime={formatTime}
            onStart={startSession}
            onGiveUp={giveUp}
            onReset={reset}
            onDurationChange={setDuration}
            durations={DURATIONS}
          />
        </div>

        {/* ── Distraction alert — top center ── */}
        {sessionState === "running" && (
          <div style={{ position: "absolute", top: "90px", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}>
            <DistractionAlert
              status={focusStatus}
              countdown={focusStatus !== "distracted" ? countdown : null}
              warnings={[]}
              isDark={isDark}
            />
          </div>
        )}

        {/* ── Bottom status pill — center ── */}
        {sessionState === "running" && (
          <div style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both", pointerEvents: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: t("rgba(0,0,0,0.5)","rgba(255,255,255,0.65)"),
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${t("rgba(255,255,255,0.08)","rgba(0,0,0,0.08)")}`,
              borderRadius: "20px", padding: "8px 18px",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: scoreColor, boxShadow: `0 0 8px ${scoreColor}`, animation: "pulse-dot 2s infinite", flexShrink: 0 }} />
              <span style={{ color: textMid, fontSize: "13px", fontWeight: 500 }}>{FOCUS_LABEL[focusStatus]}</span>
              <span style={{ width: "1px", height: "14px", background: t("rgba(255,255,255,0.1)","rgba(0,0,0,0.1)") }} />
              <span style={{ color: scoreColor, fontSize: "13px", fontWeight: 700, fontFamily: "'SF Mono','JetBrains Mono',monospace" }}>{Math.round(attentionScore)}</span>
              <span style={{ width: "1px", height: "14px", background: t("rgba(255,255,255,0.1)","rgba(0,0,0,0.1)") }} />
              <span style={{ color: textFaint, fontSize: "12px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{focusMode}</span>
            </div>
          </div>
        )}

        {/* ── Galaxy hint — above timer ── */}
        <div style={{ position: "absolute", right: "32px", bottom: `${32 + 260 + 16}px`, color: t("rgba(255,255,255,0.13)","rgba(0,0,0,0.18)"), fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500, pointerEvents: "none" }}>
          your galaxy →
        </div>
      </div>
    </main>
  );
}
