import type { HeadPose } from "./headPoseAnalyzer";
import type { ModeThresholds } from "./types";

export interface BlendshapeSignals {
  eyeBlinkLeft: number;   // 0-1, 1 = fully closed
  eyeBlinkRight: number;
  eyeLookOutLeft: number; // looking away from nose
  eyeLookOutRight: number;
  eyeLookDownLeft: number;
  eyeLookDownRight: number;
}

export interface AttentionResult {
  score: number;          // 0-100, EMA-smoothed
  rawScore: number;       // unsmoothed, useful for debugging
  activeWarnings: string[]; // human-readable factors reducing focus
}

const BLINK_THRESHOLD    = 0.55; // above = eye closing/closed
const GAZE_OUT_THRESHOLD = 0.45; // above = eye looking sideways
const GAZE_DOWN_THRESHOLD = 0.50;

let smoothedScore = 100;

export function resetScorer(): void {
  smoothedScore = 100;
}

export function computeAttentionScore(
  pose: HeadPose,
  blendshapes: BlendshapeSignals,
  phoneDetected: boolean,
  handInLap: boolean,
  thresholds: ModeThresholds
): AttentionResult {
  const warnings: string[] = [];
  let penalty = 0;

  // ── Yaw (looking left/right) ─────────────────────────────────────────────
  const yawAbs = Math.abs(pose.yaw);
  if (yawAbs > thresholds.yawLimit) {
    const excess = yawAbs - thresholds.yawLimit;
    penalty += Math.min(40, excess * 2.2);
    warnings.push(pose.yaw > 0 ? "looking right" : "looking left");
  } else if (yawAbs > thresholds.yawLimit * 0.7) {
    penalty += 10;
    // soft warning — not shown unless it's the only factor
  }

  // ── Pitch (looking up/down) ──────────────────────────────────────────────
  if (pose.pitch > thresholds.pitchUpLimit) {
    const excess = pose.pitch - thresholds.pitchUpLimit;
    penalty += Math.min(35, excess * 2.5);
    warnings.push("looking up");
  } else if (pose.pitch < thresholds.pitchDownLimit) {
    const excess = Math.abs(pose.pitch) - Math.abs(thresholds.pitchDownLimit);
    penalty += Math.min(35, excess * 2.5);
    warnings.push("looking down");
  }

  // ── Eye gaze (blendshapes) ────────────────────────────────────────────────
  const avgBlinkLeft  = blendshapes.eyeBlinkLeft;
  const avgBlinkRight = blendshapes.eyeBlinkRight;
  const avgBlink = (avgBlinkLeft + avgBlinkRight) / 2;

  if (avgBlink > BLINK_THRESHOLD) {
    const closedness = (avgBlink - BLINK_THRESHOLD) / (1 - BLINK_THRESHOLD);
    penalty += Math.min(25, closedness * 30);
    if (avgBlink > 0.75) warnings.push("eyes closing");
  }

  const gazeOut = Math.max(blendshapes.eyeLookOutLeft, blendshapes.eyeLookOutRight);
  if (gazeOut > GAZE_OUT_THRESHOLD) {
    penalty += Math.min(20, (gazeOut - GAZE_OUT_THRESHOLD) * 40);
    if (gazeOut > 0.55) warnings.push("eyes looking away");
  }

  const gazeDown = Math.max(blendshapes.eyeLookDownLeft, blendshapes.eyeLookDownRight);
  if (gazeDown > GAZE_DOWN_THRESHOLD && pose.pitch > -10) {
    // eyes looking down while head is level = phone in lap or fidgeting
    penalty += Math.min(15, (gazeDown - GAZE_DOWN_THRESHOLD) * 30);
    if (gazeDown > 0.65) warnings.push("eyes looking down");
  }

  // ── Phone ─────────────────────────────────────────────────────────────────
  if (phoneDetected) {
    penalty += 40;
    warnings.push("phone detected");
  }

  // ── Hand in lap ───────────────────────────────────────────────────────────
  if (handInLap) {
    penalty += 20;
    warnings.push("hand in lap");
  }

  // ── No face ───────────────────────────────────────────────────────────────
  if (!pose.facePresent) {
    penalty = 100;
    warnings.length = 0;
    warnings.push("face not visible");
  }

  const rawScore = Math.max(0, Math.min(100, 100 - penalty));

  // EMA smoothing — slow to drop (0.12), fast to recover (0.25)
  const alpha = rawScore < smoothedScore ? 0.12 : 0.25;
  smoothedScore = smoothedScore * (1 - alpha) + rawScore * alpha;
  const score = Math.round(smoothedScore);

  return { score, rawScore: Math.round(rawScore), activeWarnings: warnings };
}

export function extractBlendshapes(
  categories: { categoryName: string; score: number }[]
): BlendshapeSignals {
  const get = (name: string) =>
    categories.find((c) => c.categoryName === name)?.score ?? 0;

  return {
    eyeBlinkLeft:     get("eyeBlinkLeft"),
    eyeBlinkRight:    get("eyeBlinkRight"),
    eyeLookOutLeft:   get("eyeLookOutLeft"),
    eyeLookOutRight:  get("eyeLookOutRight"),
    eyeLookDownLeft:  get("eyeLookDownLeft"),
    eyeLookDownRight: get("eyeLookDownRight"),
  };
}
