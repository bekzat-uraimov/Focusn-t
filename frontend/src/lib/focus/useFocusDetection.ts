import { useEffect, useRef, useCallback, useState } from "react";
import type { MutableRefObject, RefObject } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { FocusMode, FocusState, ModeThresholds } from "./types";
import { MODE_THRESHOLDS } from "./types";
import { extractHeadPose } from "./headPoseAnalyzer";
import {
  initPhoneDetector,
  detectPhone,
  disposePhoneDetector,
} from "./phoneDetector";
import {
  initHandAnalyzer,
  detectHandsForVideo,
  disposeHandAnalyzer,
} from "./handAnalyzer";
import {
  computeAttentionScore,
  extractBlendshapes,
  resetScorer,
} from "./attentionScorer";
import { FocusStateMachine } from "./focusStateMachine";

interface UseFocusDetectionOptions {
  mode: FocusMode;
  videoRef: RefObject<HTMLVideoElement>;
  /** Written each frame with the raw face landmarks for mesh drawing. */
  landmarksRef?: MutableRefObject<NormalizedLandmark[][] | null>;
  /** Override specific threshold values (e.g. pitchDownLimit for writing mode). */
  thresholdOverrides?: Partial<ModeThresholds>;
  onSessionFailed?: () => void;
  onStatusChange?: (status: FocusState["status"]) => void;
  onScoreChange?: (score: number) => void;
  enabled?: boolean;
}

const IDLE_STATE: FocusState = {
  status: "focused",
  attentionScore: 100,
  activeWarnings: [],
  countdownRemaining: null,
  recoveryRemaining: null,
  pitch: 0,
  yaw: 0,
  phoneDetected: false,
  handInLap: false,
  facePresent: false,
};

export function useFocusDetection({
  mode,
  videoRef,
  landmarksRef,
  thresholdOverrides,
  onSessionFailed,
  onStatusChange,
  onScoreChange,
  enabled = true,
}: UseFocusDetectionOptions): FocusState {
  const [focusState, setFocusState] = useState<FocusState>(IDLE_STATE);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const stateMachineRef = useRef(new FocusStateMachine());
  const rafRef = useRef<number>(0);
  const prevStatusRef = useRef<FocusState["status"]>("focused");
  const failedRef = useRef(false);
  const loopCleanupRef = useRef<(() => void) | null>(null);

  const startLoop = useCallback((): (() => void) => {
    let bgInterval: ReturnType<typeof setInterval> | null = null;

    function loop() {
      const video = videoRef.current;
      const landmarker = faceLandmarkerRef.current;

      if (!video || !landmarker || video.readyState < 2) {
        if (document.visibilityState === "visible") {
          rafRef.current = requestAnimationFrame(loop);
        }
        return;
      }

      const nowMs = performance.now();
      const thresholds = thresholdOverrides
        ? { ...MODE_THRESHOLDS[mode], ...thresholdOverrides }
        : MODE_THRESHOLDS[mode];

      const faceResult: FaceLandmarkerResult = landmarker.detectForVideo(video, nowMs);

      if (landmarksRef) {
        landmarksRef.current = faceResult.faceLandmarks?.length
          ? faceResult.faceLandmarks
          : null;
      }

      const pose = extractHeadPose(faceResult);

      const blendshapeCategories = faceResult.faceBlendshapes?.[0]?.categories ?? [];
      const blendshapes = extractBlendshapes(blendshapeCategories);

      const phoneResult = detectPhone(video, nowMs);
      const hands = detectHandsForVideo(video, nowMs, phoneResult.bbox);

      const { score, activeWarnings } = computeAttentionScore(
        pose,
        blendshapes,
        phoneResult.detected,
        hands.handInLap,
        thresholds
      );

      const output = stateMachineRef.current.tick({
        facePresent: pose.facePresent,
        attentionScore: score,
        thresholds,
        nowMs,
      });

      if (output.status !== prevStatusRef.current) {
        prevStatusRef.current = output.status;
        onStatusChange?.(output.status);
      }

      if (output.sessionFailed && !failedRef.current) {
        failedRef.current = true;
        onSessionFailed?.();
      }

      onScoreChange?.(score);

      setFocusState({
        status: output.status,
        attentionScore: score,
        activeWarnings,
        countdownRemaining: output.countdownRemaining,
        recoveryRemaining: output.recoveryRemaining,
        pitch: pose.pitch,
        yaw: pose.yaw,
        phoneDetected: phoneResult.detected,
        handInLap: hands.handInLap,
        facePresent: pose.facePresent,
      });

      // Only self-reschedule via rAF when visible; setInterval drives background
      if (document.visibilityState === "visible") {
        rafRef.current = requestAnimationFrame(loop);
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(rafRef.current);
        bgInterval = setInterval(loop, 800);
      } else {
        if (bgInterval !== null) { clearInterval(bgInterval); bgInterval = null; }
        rafRef.current = requestAnimationFrame(loop);
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (bgInterval !== null) clearInterval(bgInterval);
    };
  }, [mode, videoRef, landmarksRef, thresholdOverrides, onSessionFailed, onStatusChange, onScoreChange]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function setup() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
        outputFaceBlendshapes: true,
      });

      if (cancelled) { landmarker.close(); return; }

      faceLandmarkerRef.current = landmarker;
      await Promise.all([initPhoneDetector(), initHandAnalyzer()]);
      stateMachineRef.current.reset();
      resetScorer();
      failedRef.current = false;
      loopCleanupRef.current = startLoop();
    }

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      loopCleanupRef.current?.();
      loopCleanupRef.current = null;
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
      disposePhoneDetector();
      disposeHandAnalyzer();
    };
  }, [enabled, startLoop]);

  return focusState;
}
