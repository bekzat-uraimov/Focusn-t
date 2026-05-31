export type FocusMode = "coding" | "writing";

export type FocusStatus =
  | "focused"
  | "questionable"
  | "distracted"
  | "away"
  | "recovering";

export interface FocusState {
  status: FocusStatus;
  /** 0–100. Tree health. Below 70 = questionable, below 50 = distracted. */
  attentionScore: number;
  /** human-readable reasons attention score is low */
  activeWarnings: string[];
  countdownRemaining: number | null;
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
  pitchDownLimit: number;
  /** score below this → questionable + 20s countdown */
  questionableScoreThreshold: number;
  /** score below this → distracted + 10s countdown */
  distractedScoreThreshold: number;
  /** score above this needed to start recovery */
  recoveryScoreThreshold: number;
  questionableCountdownSecs: number;
  distractedCountdownSecs: number;
  awayGraceSecs: number;
  recoveryRequiredSecs: number;
}

export const MODE_THRESHOLDS: Record<FocusMode, ModeThresholds> = {
  coding: {
    yawLimit: 25,
    pitchUpLimit: 20,
    pitchDownLimit: -25,
    questionableScoreThreshold: 70,
    distractedScoreThreshold: 50,
    recoveryScoreThreshold: 75,
    questionableCountdownSecs: 20,
    distractedCountdownSecs: 10,
    awayGraceSecs: 3,
    recoveryRequiredSecs: 3,
  },
  writing: {
    yawLimit: 30,
    pitchUpLimit: 20,
    pitchDownLimit: -40,
    questionableScoreThreshold: 70,
    distractedScoreThreshold: 50,
    recoveryScoreThreshold: 75,
    questionableCountdownSecs: 20,
    distractedCountdownSecs: 10,
    awayGraceSecs: 3,
    recoveryRequiredSecs: 3,
  },
};
