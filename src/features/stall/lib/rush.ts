import type { StallShift } from '@/features/stall/types';

/**
 * Shift rhythm and rush hour (Kế hoạch hợp nhất, mục 5.5 + 5.8, Gói H5):
 * a shift breathes — a quiet opening, a packed middle (the rush hour,
 * when customers pour in and background pots earn their keep), then a
 * quiet tail before the shutters close. The phase is a pure function
 * of the shift's own timeline, so every screen agrees on it.
 */

export type ShiftPhase = 'early' | 'rush' | 'late';

/** Rush window: the middle 40% of the shift (30% → 70% elapsed). */
export const RUSH_START_RATIO = 0.3;
export const RUSH_END_RATIO = 0.7;

export function shiftElapsedRatio(shift: StallShift, now: number): number {
  const duration = shift.endsAt - shift.startedAt;
  if (duration <= 0) return 1;
  return Math.min(1, Math.max(0, (now - shift.startedAt) / duration));
}

export function shiftPhaseAt(shift: StallShift, now: number): ShiftPhase {
  const ratio = shiftElapsedRatio(shift, now);
  if (ratio < RUSH_START_RATIO) return 'early';
  if (ratio < RUSH_END_RATIO) return 'rush';
  return 'late';
}

/**
 * Spawn pacing per phase: the base interval (shift length ÷ quota) is
 * stretched while the stall warms up and winds down, and compressed
 * hard during rush hour — customers arrive more than twice as fast.
 */
export function spawnFactorForPhase(phase: ShiftPhase): number {
  if (phase === 'rush') return 0.45;
  if (phase === 'early') return 1.45;
  return 1.3;
}

/**
 * Share of customers who arrive with a special request (mục 6.3):
 * picky eaters find famous stalls — the rate grows with stall stars,
 * 8% at 1 star up to 28% at 5 stars (starting parameters, Phần 11
 * spirit; H10 re-tunes with play data).
 */
export function pickyRateForStars(stars: number): number {
  const s = Math.min(5, Math.max(1, stars));
  return 0.08 + 0.05 * (s - 1);
}

/** Heavy quality penalty for a wrong or ignored substitution (mục 6.3:
 * "thay sai bị trừ nặng vào điểm chất lượng"). */
export const SUBSTITUTION_PENALTY = 25;

/** Tip bonus factor when a picky request is honoured by the book
 * (Phần 11: tip is highest when the order is fast AND right). */
export const REQUEST_OK_TIP_FACTOR = 1.25;
