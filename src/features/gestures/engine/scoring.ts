/**
 * Shared scoring frame for all 14 gesture actions (Kế hoạch 1, mục 3.5).
 * Every module — gesture path AND button path — reports the same four
 * metrics and this function turns them into the single 0–100 action score
 * that flows into the run's existing score components. The button path is
 * scored by the identical frame with no ceiling (chốt: đường nút bằng
 * điểm đường cử chỉ, không trần 85).
 */
export interface GestureMetrics {
  /** Share of the required work actually done, 0..1. */
  completion: number;
  /** Closeness to the ideal (zone centre, target spot, beat), 0..1. */
  accuracy: number;
  /** Steadiness / on-beat quality of the motion, 0..1. */
  rhythm: number;
  /** Count of clear mistakes (splash out, overshoot, wrong item…). */
  faults: number;
}

const FAULT_PENALTY = 6;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function scoreFromMetrics(metrics: GestureMetrics): number {
  const raw =
    100 *
      (0.5 * clamp01(metrics.completion) +
        0.35 * clamp01(metrics.accuracy) +
        0.15 * clamp01(metrics.rhythm)) -
    FAULT_PENALTY * Math.max(0, metrics.faults);
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export type GestureQuality = 'perfect' | 'good' | 'ok' | 'fail';

export function qualityForScore(score: number): GestureQuality {
  if (score >= 85) return 'perfect';
  if (score >= 65) return 'good';
  if (score >= 40) return 'ok';
  return 'fail';
}
