export type FocusMode = "coding" | "writing";

export type FocusStatus =
  | "focused"
  | "questionable"
  | "distracted"
  | "away"
  | "recovering";

export interface FocusState {
  status: FocusStatus;
  /** seconds remaining in current countdown (null when idle) */
  countdownRemaining: number | null;
  /** seconds remaining in recovery confirmation (null when not recovering) */
  recoveryRemaining: number | null;
  pitch: number;
  yaw: number;
  phoneDetected: boolean;
  handInLap: boolean;
  facePresent: boolean;
}

export interface ModeThresholds {
  yawLimit: number;
  pitchUpLimit: number;
  /** adjustable — writing mode exposes this as a slider */
  pitchDownLimit: number;
  /** seconds in questionable before → distracted */
  questionableCountdownSecs: number;
  /** seconds in distracted before session fails */
  distractedCountdownSecs: number;
  /** seconds with no face before → away */
  awayGraceSecs: number;
  /** seconds of clean focus required to exit questionable/distracted */
  recoveryRequiredSecs: number;
}

export const MODE_THRESHOLDS: Record<FocusMode, ModeThresholds> = {
  coding: {
    yawLimit: 25,
    pitchUpLimit: 20,
    pitchDownLimit: -25,
    questionableCountdownSecs: 20,
    distractedCountdownSecs: 10,
    awayGraceSecs: 3,
    recoveryRequiredSecs: 3,
  },
  writing: {
    yawLimit: 30,
    pitchUpLimit: 20,
    pitchDownLimit: -40,  // user-adjustable in UI
    questionableCountdownSecs: 20,
    distractedCountdownSecs: 10,
    awayGraceSecs: 3,
    recoveryRequiredSecs: 3,
  },
};
