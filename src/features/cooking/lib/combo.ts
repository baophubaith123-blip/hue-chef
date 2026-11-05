// Combo & streak bonus rules for the cooking game.
//
// These bonuses are an EXTENSION layer around lib/score.ts: the base
// drag-drop score is still computed 100% by calculateScore() in lib/score,
// and combo/streak/speed bonuses are added on top of it (the same channel
// minigame bonus points already use). lib/score.ts itself is untouched.

/** A combo streak only stays alive this long after the last correct drop. */
export const COMBO_WINDOW_MS = 2000;

/** Bonus points grow +10 per consecutive success, capped at +50. */
export const COMBO_STEP_BONUS = 10;
export const COMBO_MAX_BONUS = 50;

/**
 * Bonus earned by a success that extends a streak to `streak` in a row.
 * The first success of a streak earns no bonus; the 2nd earns +10,
 * the 3rd +20, ... capped at +50 from the 6th onwards.
 */
export function comboBonusForStreak(streak: number): number {
  if (streak < 2) return 0;
  return Math.min(COMBO_STEP_BONUS * (streak - 1), COMBO_MAX_BONUS);
}

/** Speed bonus can add at most this fraction of a quiz question's reward. */
export const SPEED_BONUS_MAX_RATIO = 0.5;

/**
 * Quiz speed bonus: answering instantly earns up to +50% of the question
 * reward; the bonus decays linearly to 0 as the timer runs out.
 */
export function speedBonusForQuiz(scoreReward: number, timeLeft: number, timeLimit: number): number {
  if (timeLimit <= 0 || timeLeft <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, timeLeft / timeLimit));
  return Math.round(scoreReward * SPEED_BONUS_MAX_RATIO * ratio);
}
