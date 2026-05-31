"use client";

import { useEffect, useRef, useState } from "react";

interface WebcamPipProps {
  status?: "focused" | "questionable" | "distracted" | "away" | "recovering";
  score?: number;
}

const borderColors = {
  focused:     "#22c55e",
  questionable:"#fbbf24",
  distracted:  "#ef4444",
  away:        "#818cf8",
  recovering:  "#67e8f9",
};

export function WebcamPip({ status = "focused", score = 92 }: WebcamPipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const landmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Start webcam
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await new Promise<void>(r => { videoRef.current!.onloadeddata = () => r(); });
        if (cancelled) return;

        // Load MediaPipe dynamically
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: false,
          outputFaceBlendshapes: false,
        });
        if (cancelled) { lm.close(); return; }

        landmarkerRef.current = lm;
        setReady(true);

        // Draw loop
        function draw() {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(draw); return; }

          const ctx = canvas.getContext("2d")!;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw mirrored video
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          // Face mesh
          const result = (landmarkerRef.current as { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks?: {x:number;y:number}[][] } }).detectForVideo(video, performance.now());
          if (result.faceLandmarks?.length) {
            ctx.save();
            // mirror the landmark drawing
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);

            const lms = result.faceLandmarks[0];
            // Draw dots only (lightweight for small pip)
            ctx.fillStyle = "rgba(82, 183, 136, 0.7)";
            for (const lm of lms) {
              const x = lm.x * canvas.width;
              const y = lm.y * canvas.height;
              ctx.beginPath();
              ctx.arc(x, y, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }

            // Gaze arrow from nose tip
            const nose = lms[1];
            if (nose) {
              const nx = nose.x * canvas.width;
              const ny = nose.y * canvas.height;
              ctx.strokeStyle = status === "focused" ? "#52b788" : status === "distracted" ? "#ef4444" : "#fbbf24";
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(nx, ny, 18, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }

          rafRef.current = requestAnimationFrame(draw);
        }
        rafRef.current = requestAnimationFrame(draw);

      } catch {
        if (!cancelled) setError(true);
      }
    }

    init();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const borderColor = borderColors[status];

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      width: 220, height: 165,
      border: `2.5px solid ${borderColor}`,
      boxShadow: `0 0 20px ${borderColor}40, 0 4px 20px rgba(0,0,0,0.15)`,
      transition: "border-color 0.4s, box-shadow 0.4s",
    }}>
      {/* Actual video (hidden — canvas draws on top) */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-0" />

      {/* Canvas with face mesh */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" style={{ transform: "none" }} />

      {/* Not-ready state */}
      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100">
          <div className="text-2xl animate-pulse">📷</div>
          <span className="text-xs text-gray-400 font-medium">Loading AI…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100">
          <div className="text-2xl">🚫</div>
          <span className="text-xs text-gray-400 font-medium">No camera</span>
        </div>
      )}

      {/* Score badge */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{ background: "rgba(0,0,0,0.55)", color: borderColor, backdropFilter: "blur(6px)" }}>
        {score}%
      </div>

      {/* Status dot */}
      <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
        style={{ background: borderColor, boxShadow: `0 0 8px ${borderColor}` }} />

      {/* AI label */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-bold"
        style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.7)", fontSize: 9, backdropFilter: "blur(4px)" }}>
        AI TRACKING
      </div>
    </div>
  );
}
