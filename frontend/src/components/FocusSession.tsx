"use client";

import { useRef, useEffect, useCallback } from "react";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { useFocusDetection } from "@/lib/focus/useFocusDetection";
import type { FocusMode, FocusState, ModeThresholds } from "@/lib/focus/types";

interface FocusSessionProps {
  mode: FocusMode;
  enabled: boolean;
  isDark: boolean;
  thresholdOverrides?: Partial<ModeThresholds>;
  onSessionFailed: () => void;
  onStateChange: (state: Pick<FocusState, "status" | "attentionScore" | "countdownRemaining" | "activeWarnings">) => void;
}

export default function FocusSession({
  mode,
  enabled,
  isDark,
  thresholdOverrides,
  onSessionFailed,
  onStateChange,
}: FocusSessionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<import("@mediapipe/tasks-vision").NormalizedLandmark[][] | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  const handleFailed = useCallback(() => onSessionFailed(), [onSessionFailed]);

  const focusState = useFocusDetection({
    mode,
    videoRef,
    landmarksRef,
    thresholdOverrides,
    enabled,
    onSessionFailed: handleFailed,
  });

  useEffect(() => {
    onStateChangeRef.current({
      status: focusState.status,
      attentionScore: focusState.attentionScore,
      countdownRemaining: focusState.countdownRemaining,
      activeWarnings: focusState.activeWarnings,
    });
  }, [focusState.status, focusState.attentionScore, focusState.countdownRemaining]);

  // Webcam lifecycle
  useEffect(() => {
    if (!enabled) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error(err);
        onSessionFailed();
      });
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled]);

  // Face mesh RAF loop
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const W = canvas.width;
      const H = canvas.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);
      const landmarks = landmarksRef.current?.[0];
      if (!landmarks) { rafRef.current = requestAnimationFrame(draw); return; }

      const drawConns = (conns: { start: number; end: number }[], color: string, lw: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (const c of conns) {
          const s = landmarks[c.start];
          const e = landmarks[c.end];
          if (!s || !e) continue;
          ctx.moveTo((1 - s.x) * W, s.y * H);
          ctx.lineTo((1 - e.x) * W, e.y * H);
        }
        ctx.stroke();
      };

      const a = isDark ? "rgba(129,140,248," : "rgba(79,70,229,";
      drawConns(FaceLandmarker.FACE_LANDMARKS_TESSELATION, `${a}0.38)`, 0.65);
      drawConns(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, `${a}0.85)`, 1.6);
      drawConns(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, `${a}1.0)`, 2.0);
      drawConns(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, `${a}1.0)`, 2.0);
      drawConns(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, `${a}0.85)`, 1.6);
      drawConns(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, `${a}0.85)`, 1.6);
      drawConns(FaceLandmarker.FACE_LANDMARKS_LIPS, "rgba(192,132,252,0.95)", 2.0);
      drawConns(FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, "rgba(56,189,248,1.0)", 2.0);
      drawConns(FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, "rgba(56,189,248,1.0)", 2.0);

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isDark]);

  const cardBg = isDark ? "rgba(10,10,20,0.65)" : "rgba(255,255,255,0.62)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.85)";
  const shadow = isDark
    ? "0 24px 64px rgba(0,0,0,0.75)"
    : "0 16px 48px rgba(30,100,180,0.2)";

  const W = 248;
  const H = 186;

  if (!enabled) {
    // Idle placeholder
    return (
      <div
        className="hud-enter"
        style={{
          width: `${W}px`,
          height: `${H}px`,
          borderRadius: "18px",
          background: cardBg,
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          border: `1px solid ${cardBorder}`,
          boxShadow: shadow,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {/* Camera icon */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 7l-7 5 7 5V7z"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        <span style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Focus Detection
        </span>
        <span style={{ color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.18)", fontSize: "11px", letterSpacing: "0.01em" }}>
          Starts with session
        </span>
      </div>
    );
  }

  return (
    <div
      className="hud-enter"
      style={{
        width: `${W}px`,
        height: `${H}px`,
        borderRadius: "18px",
        overflow: "hidden",
        position: "relative",
        background: "#000",
        border: `1px solid ${cardBorder}`,
        boxShadow: shadow,
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
      {/* Score overlay */}
      <div style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        borderRadius: "8px",
        padding: "3px 9px",
        color: focusState.attentionScore >= 75 ? "#34d399" : focusState.attentionScore >= 50 ? "#fbbf24" : "#f87171",
        fontSize: "12px",
        fontWeight: 700,
        fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
      }}>
        {Math.round(focusState.attentionScore)}
      </div>
    </div>
  );
}
