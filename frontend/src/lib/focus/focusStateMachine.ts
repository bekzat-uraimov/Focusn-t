import type { FocusStatus, ModeThresholds } from "./types";

export interface StateMachineInput {
  facePresent: boolean;
  attentionScore: number;
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
  questionableCountdownStartMs: number | null;
  distractedCountdownStartMs: number | null;
  recoveryStartMs: number | null;
  recoveringFrom: "questionable" | "distracted" | null;
  awayStartMs: number | null;
}

export class FocusStateMachine {
  private s: InternalState = this.blank();

  private blank(): InternalState {
    return {
      status: "focused",
      questionableCountdownStartMs: null,
      distractedCountdownStartMs: null,
      recoveryStartMs: null,
      recoveringFrom: null,
      awayStartMs: null,
    };
  }

  reset(): void { this.s = this.blank(); }

  tick(input: StateMachineInput): StateMachineOutput {
    const { facePresent, attentionScore, thresholds, nowMs } = input;
    const s = this.s;

    // ── AWAY ─────────────────────────────────────────────────────────────────
    if (!facePresent) {
      if (s.awayStartMs === null) s.awayStartMs = nowMs;
      if ((nowMs - s.awayStartMs) / 1000 >= thresholds.awayGraceSecs) {
        s.status = "away";
        s.recoveryStartMs = null;
        return { status: "away", countdownRemaining: null, recoveryRemaining: null, sessionFailed: false };
      }
      return this.snapshot(thresholds, nowMs, false);
    }
    s.awayStartMs = null;

    const isGood = attentionScore >= thresholds.recoveryScoreThreshold;
    const isQuestionable = attentionScore < thresholds.questionableScoreThreshold && attentionScore >= thresholds.distractedScoreThreshold;
    const isDistracted = attentionScore < thresholds.distractedScoreThreshold;

    // ── RECOVERY ─────────────────────────────────────────────────────────────
    if (isGood && (s.status === "questionable" || s.status === "distracted" || s.status === "recovering" || s.status === "away")) {
      if (s.recoveryStartMs === null) {
        s.recoveryStartMs = nowMs;
        s.recoveringFrom = (s.status === "recovering" || s.status === "away") ? s.recoveringFrom : s.status as "questionable" | "distracted";
        s.status = "recovering";
      }
      const remaining = Math.max(0, thresholds.recoveryRequiredSecs - (nowMs - s.recoveryStartMs) / 1000);
      if (remaining === 0) {
        s.status = "focused";
        s.questionableCountdownStartMs = null;
        s.distractedCountdownStartMs = null;
        s.recoveryStartMs = null;
        s.recoveringFrom = null;
        return { status: "focused", countdownRemaining: null, recoveryRemaining: null, sessionFailed: false };
      }
      return { status: "recovering", countdownRemaining: null, recoveryRemaining: Math.ceil(remaining), sessionFailed: false };
    }

    // score dropped again during recovery → cancel recovery
    if (!isGood && s.status === "recovering") {
      s.status = s.recoveringFrom ?? "questionable";
      s.recoveryStartMs = null;
    }

    // ── FOCUSED ───────────────────────────────────────────────────────────────
    if (s.status === "focused") {
      if (!isQuestionable && !isDistracted) {
        return { status: "focused", countdownRemaining: null, recoveryRemaining: null, sessionFailed: false };
      }
      // enter questionable or distracted directly based on score
      if (isDistracted) {
        s.status = "distracted";
        s.distractedCountdownStartMs = nowMs;
      } else {
        s.status = "questionable";
        s.questionableCountdownStartMs = nowMs;
      }
    }

    // ── QUESTIONABLE ──────────────────────────────────────────────────────────
    if (s.status === "questionable") {
      // score dropped below distracted threshold → escalate immediately
      if (isDistracted) {
        s.status = "distracted";
        s.distractedCountdownStartMs = nowMs;
        s.questionableCountdownStartMs = null;
      } else if (!isQuestionable && !isDistracted) {
        // score recovered above questionable threshold but not enough for full recovery
        // stay questionable, reset countdown
        s.questionableCountdownStartMs = nowMs;
      } else {
        if (s.questionableCountdownStartMs === null) s.questionableCountdownStartMs = nowMs;
        const elapsed = (nowMs - s.questionableCountdownStartMs) / 1000;
        const remaining = Math.max(0, thresholds.questionableCountdownSecs - elapsed);
        if (remaining === 0) {
          s.status = "distracted";
          s.distractedCountdownStartMs = nowMs;
          s.questionableCountdownStartMs = null;
        } else {
          return { status: "questionable", countdownRemaining: Math.ceil(remaining), recoveryRemaining: null, sessionFailed: false };
        }
      }
    }

    // ── DISTRACTED ────────────────────────────────────────────────────────────
    if (s.status === "distracted") {
      if (s.distractedCountdownStartMs === null) s.distractedCountdownStartMs = nowMs;
      const elapsed = (nowMs - s.distractedCountdownStartMs) / 1000;
      const remaining = Math.max(0, thresholds.distractedCountdownSecs - elapsed);
      if (remaining === 0) {
        return { status: "distracted", countdownRemaining: 0, recoveryRemaining: null, sessionFailed: true };
      }
      return { status: "distracted", countdownRemaining: Math.ceil(remaining), recoveryRemaining: null, sessionFailed: false };
    }

    return this.snapshot(thresholds, nowMs, false);
  }

  private snapshot(t: ModeThresholds, nowMs: number, sessionFailed: boolean): StateMachineOutput {
    const s = this.s;
    let countdownRemaining: number | null = null;
    if (s.status === "questionable" && s.questionableCountdownStartMs !== null) {
      countdownRemaining = Math.ceil(Math.max(0, t.questionableCountdownSecs - (nowMs - s.questionableCountdownStartMs) / 1000));
    } else if (s.status === "distracted" && s.distractedCountdownStartMs !== null) {
      countdownRemaining = Math.ceil(Math.max(0, t.distractedCountdownSecs - (nowMs - s.distractedCountdownStartMs) / 1000));
    }
    let recoveryRemaining: number | null = null;
    if (s.status === "recovering" && s.recoveryStartMs !== null) {
      recoveryRemaining = Math.ceil(Math.max(0, t.recoveryRequiredSecs - (nowMs - s.recoveryStartMs) / 1000));
    }
    return { status: s.status, countdownRemaining, recoveryRemaining, sessionFailed };
  }
}
