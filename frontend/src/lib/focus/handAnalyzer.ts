import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

export interface HandAnalysis {
  handsPresent: boolean;
  /** wrist y in normalized [0,1] coords; 1 = bottom of frame */
  wristY: number | null;
  /** hand is in lower 30% of frame — likely in lap */
  handInLap: boolean;
  /** hand landmark bbox overlaps with phone detection region */
  handNearPhone: boolean;
}

let landmarker: HandLandmarker | null = null;
const LAP_Y_THRESHOLD = 0.70;

export async function initHandAnalyzer(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );
  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
}

/**
 * phoneBbox: normalized {xMin, yMin, xMax, yMax} from ObjectDetector result.
 * Pass null if phone detector is unavailable.
 */
export function analyzeHands(
  result: HandLandmarkerResult,
  phoneBbox: { xMin: number; yMin: number; xMax: number; yMax: number } | null
): HandAnalysis {
  if (!result.landmarks || result.landmarks.length === 0) {
    return { handsPresent: false, wristY: null, handInLap: false, handNearPhone: false };
  }

  // Wrist = landmark index 0
  const wristYValues = result.landmarks.map((hand) => hand[0].y);
  const maxWristY = Math.max(...wristYValues);

  const handInLap = maxWristY > LAP_Y_THRESHOLD;

  // Check if any hand landmark is inside the phone bounding box
  let handNearPhone = false;
  if (phoneBbox) {
    for (const hand of result.landmarks) {
      for (const lm of hand) {
        if (
          lm.x >= phoneBbox.xMin &&
          lm.x <= phoneBbox.xMax &&
          lm.y >= phoneBbox.yMin &&
          lm.y <= phoneBbox.yMax
        ) {
          handNearPhone = true;
          break;
        }
      }
      if (handNearPhone) break;
    }
  }

  return {
    handsPresent: true,
    wristY: maxWristY,
    handInLap,
    handNearPhone,
  };
}

export function detectHandsForVideo(
  video: HTMLVideoElement,
  timestampMs: number,
  phoneBbox: { xMin: number; yMin: number; xMax: number; yMax: number } | null
): HandAnalysis {
  if (!landmarker) {
    return { handsPresent: false, wristY: null, handInLap: false, handNearPhone: false };
  }
  const result = landmarker.detectForVideo(video, timestampMs);
  return analyzeHands(result, phoneBbox);
}

export function disposeHandAnalyzer(): void {
  landmarker?.close();
  landmarker = null;
}
