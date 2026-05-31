import type { FocusStatus, ModeThresholds } from "./types";

export interface StateMachineInput {
  facePresent: boolean;
  poseDistracted: boolean;
  phoneDetected: boolean;
  handInLap: boolean;
  thresholds: ModeThresholds;
  nowMs: number;
}

export interface StateMachineOutput {
  status: FocusStatus;
  countdownRemaining: number | null;
  recoveryRemaining: number | null;
  sessionFailed: boolean;
}

interface InternalState {
  status: FocusStatus;
  /** when current distraction phase started */
  distractionStartMs: number | null;
  /** when the questionable countdown started */
  questionableCountdownStartMs: number | null;
  /** when the distracted countdown started */
  distractedCountdownStartMs: number | null;
  /** when clean-pose recovery started */
  recoveryStartMs: number | null;
  /** which status we're recovering from */
  recoveringFrom: "questionable" | "distracted" | null;
  awayStartMs: number | null;
}

export class FocusStateMachine {
  private s: InternalState = this.blank();

  private blank(): InternalState {
    return {
      status: "focused",
      distractionStartMs: null,
      questionableCountdownStartMs: null,
      distractedCountdownStartMs: null,
      recoveryStartMs: null,
      recoveringFrom: null,
      awayStartMs: null,
    };
  }

  reset(): void { this.s = this.blank(); }

  tick(input: StateMachineInput): StateMachineOutput {
    const { facePresent, poseDistracted, phoneDetected, handInLap, thresholds, nowMs } = input;
    const s = this.s;

    // ── AWAY ─────────────────────────────────────────────────────────────────
    if (!facePresent) {
      if (s.awayStartMs === null) s.awayStartMs = nowMs;
      if ((nowMs - s.awayStartMs) / 1000 >= thresholds.awayGraceSecs) {
        s.status = "away";
        s.recoveryStartMs = null;
        return { status: "away", countdownRemaining: null, recoveryRemaining: null, sessionFailed: false };
      }
      return this.current(thresholds, nowMs);
    }
    s.awayStartMs = null;

    // hand-in-lap counts as a distraction signal (soft — same as pose distracted)
    const isDistracted = poseDistracted || phoneDetected || handInLap;

    // ── RECOVERY (clean pose after being distracted/questionable) ────────────
    if (!isDistracted && (s.status === "questionable" || s.status === "distracted" || s.status === "recovering")) {
      if (s.recoveryStartMs === null) {
        s.recoveryStartMs = nowMs;
        s.recoveringFrom = s.status === "recovering" ? s.recoveringFrom : s.status as "questionable" | "distracted";
        s.status = "recovering";
      }
      const recoveredFor = (nowMs - s.recoveryStartMs) / 1000;
      const remaining = Math.max(0, thresholds.recoveryRequiredSecs - recoveredFor);
      if (remaining === 0) {
        // recovery complete
        s.status = "focused";
        s.distractionStartMs = null;
        s.questionableCountdownStartMs = null;
        s.distractedCountdownStartMs = null;
        s.recoveryStartMs = null;
        s.recoveringFrom = null;
        return { status: "focused", countdownRemaining: null, recoveryRemaining: null, sessionFailed: false };
      }
      return {
        status: "recovering",
        countdownRemaining: null,
        recoveryRemaining: Math.ceil(remaining),
        sessionFailed: false,
      };
    }

    // distraction resumed during recovery → cancel recovery, go back
    if (isDistracted && s.status === "recovering") {
      s.status = s.recoveringFrom ?? "questionable";
      s.recoveryStartMs = null;
      // don't reset countdown timers — they keep running
    }

    // ── FOCUSED → no distraction ─────────────────────────────────────────────
    if (!isDistracted && s.status === "focused") {
      s.distractionStartMs = null;
      return { status: "focused", countdownRemaining: null, recoveryRemaining: null, sessionFailed: false };
    }

    // ── DISTRACTED → questionable countdown first ────────────────────────────
    if (isDistracted) {
      if (s.distractionStartMs === null) s.distractionStartMs = nowMs;

      // Enter questionable
      if (s.status === "focused") {
        s.status = "questionable";
        s.questionableCountdownStartMs = nowMs;
      }

      if (s.status === "questionable") {
        if (s.questionableCountdownStartMs === null) s.questionableCountdownStartMs = nowMs;
        const elapsed = (nowMs - s.questionableCountdownStartMs) / 1000;
        const remaining = Math.max(0, thresholds.questionableCountdownSecs - elapsed);

        if (remaining > 0) {
          return {
            status: "questionable",
            countdownRemaining: Math.ceil(remaining),
            recoveryRemaining: null,
            sessionFailed: false,
          };
        }
        // questionable countdown expired → distracted
        s.status = "distracted";
        s.distractedCountdownStartMs = nowMs;
      }

      if (s.status === "distracted") {
        if (s.distractedCountdownStartMs === null) s.distractedCountdownStartMs = nowMs;
        const elapsed = (nowMs - s.distractedCountdownStartMs) / 1000;
        const remaining = Math.max(0, thresholds.distractedCountdownSecs - elapsed);

        if (remaining === 0) {
          return { status: "distracted", countdownRemaining: 0, recoveryRemaining: null, sessionFailed: true };
        }
        return {
          status: "distracted",
          countdownRemaining: Math.ceil(remaining),
          recoveryRemaining: null,
          sessionFailed: false,
        };
      }
    }

    return this.current(thresholds, nowMs);
  }

  private current(thresholds: ModeThresholds, nowMs: number): StateMachineOutput {
    const s = this.s;
    let countdownRemaining: number | null = null;
    if (s.status === "questionable" && s.questionableCountdownStartMs !== null) {
      const e = (nowMs - s.questionableCountdownStartMs) / 1000;
      countdownRemaining = Math.ceil(Math.max(0, thresholds.questionableCountdownSecs - e));
    } else if (s.status === "distracted" && s.distractedCountdownStartMs !== null) {
      const e = (nowMs - s.distractedCountdownStartMs) / 1000;
      countdownRemaining = Math.ceil(Math.max(0, thresholds.distractedCountdownSecs - e));
    }
    let recoveryRemaining: number | null = null;
    if (s.status === "recovering" && s.recoveryStartMs !== null) {
      const e = (nowMs - s.recoveryStartMs) / 1000;
      recoveryRemaining = Math.ceil(Math.max(0, thresholds.recoveryRequiredSecs - e));
    }
    return { status: s.status, countdownRemaining, recoveryRemaining, sessionFailed: false };
  }
}
