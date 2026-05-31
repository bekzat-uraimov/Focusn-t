import {
  ObjectDetector,
  FilesetResolver,
  type ObjectDetectorResult,
  type Detection,
  type Category,
} from "@mediapipe/tasks-vision";

const PHONE_LABEL = "cell phone";
const CONFIDENCE_THRESHOLD = 0.6;
const DETECTION_INTERVAL_FRAMES = 10;

export interface PhoneDetectionResult {
  detected: boolean;
  /** normalized bbox — use to correlate with hand position */
  bbox: { xMin: number; yMin: number; xMax: number; yMax: number } | null;
}

let detector: ObjectDetector | null = null;
let frameCount = 0;
let lastResult: PhoneDetectionResult = { detected: false, bbox: null };

export async function initPhoneDetector(): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );
  detector = await ObjectDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    scoreThreshold: CONFIDENCE_THRESHOLD,
    categoryAllowlist: [PHONE_LABEL],
  });
}

export function detectPhone(
  video: HTMLVideoElement,
  timestampMs: number
): PhoneDetectionResult {
  frameCount++;
  if (!detector || frameCount % DETECTION_INTERVAL_FRAMES !== 0) {
    return lastResult;
  }

  const result: ObjectDetectorResult = detector.detectForVideo(video, timestampMs);

  const phoneDetection = result.detections.find((d: Detection) =>
    d.categories.some(
      (c: Category) => c.categoryName === PHONE_LABEL && c.score >= CONFIDENCE_THRESHOLD
    )
  );

  if (!phoneDetection || !phoneDetection.boundingBox) {
    lastResult = { detected: false, bbox: null };
  } else {
    const b = phoneDetection.boundingBox;
    const w = video.videoWidth;
    const h = video.videoHeight;
    lastResult = {
      detected: true,
      bbox: {
        xMin: b.originX / w,
        yMin: b.originY / h,
        xMax: (b.originX + b.width) / w,
        yMax: (b.originY + b.height) / h,
      },
    };
  }

  return lastResult;
}

export function disposePhoneDetector(): void {
  detector?.close();
  detector = null;
  frameCount = 0;
  lastResult = { detected: false, bbox: null };
}
