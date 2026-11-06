// Scoring rules for the NEW stages of the 5-stage run.
//
// Like lib/combo, these points are an extension layer: every stage returns
// one bonus number that CookingContext adds on top of the total computed by
// lib/score.ts (which stays 100% untouched).

/** Market: points for each correct ingredient type collected at the stall. */
export const MARKET_PICK_POINTS = 15;
/** Market: penalty for grabbing an ingredient that is not on the list. */
export const MARKET_WRONG_PENALTY = 10;
/** Market: extra bonus for collecting the complete shopping list. */
export const MARKET_FULL_LIST_BONUS = 50;

/** Catch: points per correct ingredient caught (combo gains come on top). */
export const CATCH_POINTS = 10;
/** Catch: penalty when a correct ingredient falls past the pot. */
export const CATCH_MISS_PENALTY = 5;

/** Seasoning can add at most this fraction of the step's own points. */
export const SEASON_MAX_BONUS_RATIO = 0.5;

/**
 * Seasoning bonus for one step. `closeness` is 1 when the needle stops dead
 * centre of the gold zone and decays to 0 at the "good" boundary.
 */
export function seasonBonusFor(stepPoints: number, closeness: number): number {
  const clamped = Math.min(1, Math.max(0, closeness));
  return Math.round(stepPoints * SEASON_MAX_BONUS_RATIO * clamped);
}

/** Finish stage: a dead-on tap ("Tuyệt vời"). */
export const FINISH_PERFECT_POINTS = 50;
/** Finish stage: a near tap ("Tốt") earns up to this many points. */
export const FINISH_GOOD_MAX_POINTS = 40;
/** Finish stage: penalty for a tap that overshoots the ring ("Trượt"). */
export const FINISH_MISS_PENALTY = 20;

/** Offset ratio (0 = dead centre on the rim) at which a tap stops being "Tốt". */
export const FINISH_GOOD_WINDOW = 0.25;

/** Points for a "Tốt" tap, scaled by how close to the rim it landed. */
export function finishGoodPoints(offsetRatio: number): number {
  const closeness = 1 - Math.min(1, Math.max(0, offsetRatio) / FINISH_GOOD_WINDOW);
  return Math.max(5, Math.round(FINISH_GOOD_MAX_POINTS * closeness));
}
