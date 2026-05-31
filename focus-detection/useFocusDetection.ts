import { useEffect, useRef, useCallback, useState } from "react";
import type { RefObject } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { FocusMode, FocusState } from "./types";
import { MODE_THRESHOLDS } from "./types";
import { extractHeadPose, isPoseDistracted } from "./headPoseAnalyzer";
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
import { FocusStateMachine } from "./focusStateMachine";

interface UseFocusDetectionOptions {
  mode: FocusMode;
  videoRef: RefObject<HTMLVideoElement>;
  onSessionFailed?: () => void;
  onStatusChange?: (status: FocusState["status"]) => void;
  enabled?: boolean;
}

const IDLE_STATE: FocusState = {
  status: "focused",
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
  onSessionFailed,
  onStatusChange,
  enabled = true,
}: UseFocusDetectionOptions): FocusState {
  const [focusState, setFocusState] = useState<FocusState>(IDLE_STATE);

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const stateMachineRef = useRef(new FocusStateMachine());
  const rafRef = useRef<number>(0);
  const prevStatusRef = useRef<FocusState["status"]>("focused");
  const failedRef = useRef(false);

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
        outputFaceBlendshapes: false,
      });

      if (cancelled) { landmarker.close(); return; }

      faceLandmarkerRef.current = landmarker;
      await Promise.all([initPhoneDetector(), initHandAnalyzer()]);
      stateMachineRef.current.reset();
      failedRef.current = false;
      startLoop();
    }

    setup();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
      disposePhoneDetector();
      disposeHandAnalyzer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const startLoop = useCallback(() => {
    function loop() {
      const video = videoRef.current;
      const landmarker = faceLandmarkerRef.current;

      if (!video || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const nowMs = performance.now();
      const thresholds = MODE_THRESHOLDS[mode];

      const faceResult: FaceLandmarkerResult = landmarker.detectForVideo(video, nowMs);
      const pose = extractHeadPose(faceResult);

      const phoneResult = detectPhone(video, nowMs);
      const hands = detectHandsForVideo(video, nowMs, phoneResult.bbox);

      const poseDistracted = isPoseDistracted(
        pose,
        thresholds.yawLimit,
        thresholds.pitchUpLimit,
        thresholds.pitchDownLimit
      );

      const output = stateMachineRef.current.tick({
        facePresent: pose.facePresent,
        poseDistracted,
        phoneDetected: phoneResult.detected,
        handInLap: hands.handInLap,
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

      setFocusState({
        status: output.status,
        countdownRemaining: output.countdownRemaining,
        recoveryRemaining: output.recoveryRemaining,
        pitch: pose.pitch,
        yaw: pose.yaw,
        phoneDetected: phoneResult.detected,
        handInLap: hands.handInLap,
        facePresent: pose.facePresent,
      });

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [mode, videoRef, onSessionFailed, onStatusChange]);

  return focusState;
}
