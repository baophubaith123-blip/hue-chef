// Score rescaling for the 5-stage run (approved by the author 2026-11-06).
//
// The recipe's baseScore is the MAXIMUM a full run can earn — the number on
// the recipe card is the dish's value, not just one ingredient of the total.
// Each run component earns a weighted share of that maximum by performance
// ratio (0..1), so a flawless run lands exactly on baseScore and mistakes
// shave off percentages instead of inflating the total. lib/score.ts stays
// untouched; its star thresholds (95/80/60/35%) are mirrored for the ratio.

import { comboBonusForStreak } from './combo';
import {
  CATCH_POINTS,
  MARKET_FULL_LIST_BONUS,
  MARKET_PICK_POINTS,
} from './stage-bonus';

/** Weighted share of the dish's value per run component (sums to 1). */
export const SCORE_WEIGHTS = {
  market: 0.15,
  catch: 0.15,
  cook: 0.3,
  season: 0.1,
  finish: 0.15,
  quiz: 0.1,
  time: 0.05,
} as const;

export type ScoreComponentKey = keyof typeof SCORE_WEIGHTS;

/** Max points each component can earn in a run (0 = component inactive). */
export type ScorePlan = Record<ScoreComponentKey, number>;

const COMPONENT_ORDER: ScoreComponentKey[] = [
  'market',
  'catch',
  'cook',
  'season',
  'finish',
  'quiz',
  'time',
];

export function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Split baseScore into per-component maxima. Weights renormalise over the
 * ACTIVE components (a run without a quiz stage still tops out at
 * baseScore), and integer shares are distributed by largest remainder so
 * they always sum to exactly baseScore.
 */
export function computeScorePlan(
  baseScore: number,
  active: Record<ScoreComponentKey, boolean>,
): ScorePlan {
  const plan: ScorePlan = {
    market: 0,
    catch: 0,
    cook: 0,
    season: 0,
    finish: 0,
    quiz: 0,
    time: 0,
  };
  const activeKeys = COMPONENT_ORDER.filter((key) => active[key]);
  const totalWeight = activeKeys.reduce((sum, key) => sum + SCORE_WEIGHTS[key], 0);
  if (totalWeight <= 0 || baseScore <= 0) {
    return plan;
  }
  const exact = activeKeys.map((key) => ({
    key,
    value: (baseScore * SCORE_WEIGHTS[key]) / totalWeight,
  }));
  let assigned = 0;
  for (const entry of exact) {
    plan[entry.key] = Math.floor(entry.value);
    assigned += plan[entry.key];
  }
  let remainder = baseScore - assigned;
  const byFraction = [...exact].sort(
    (a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)),
  );
  for (const entry of byFraction) {
    if (remainder <= 0) break;
    plan[entry.key] += 1;
    remainder -= 1;
  }
  return plan;
}

/** Star rating for a final ratio of earned / maximum (mirrors lib/score). */
export function starsForRatio(ratio: number): 1 | 2 | 3 | 4 | 5 {
  if (ratio >= 0.95) return 5;
  if (ratio >= 0.8) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.35) return 2;
  return 1;
}

/** Total combo bonus of a perfect streak of `count` consecutive successes. */
export function comboMaxForStreaks(count: number): number {
  let total = 0;
  for (let streak = 2; streak <= count; streak += 1) {
    total += comboBonusForStreak(streak);
  }
  return total;
}

/** Raw maximum of the market stage (all picks + full-list bonus). */
export function marketRawMax(uniqueCount: number): number {
  return uniqueCount * MARKET_PICK_POINTS + MARKET_FULL_LIST_BONUS;
}

/**
 * Reference maximum of the catch stage: all catches plus HALF the perfect
 * combo run. A clean catch-all with a mostly-alive combo already reaches
 * the cap (the ratio clamps at 1); the combo is a booster, not two-thirds
 * of the stage's value.
 */
export function catchRawMax(uniqueCount: number): number {
  return uniqueCount * CATCH_POINTS + comboMaxForStreaks(uniqueCount) * 0.5;
}
