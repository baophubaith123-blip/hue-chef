/**
 * Economy rules for the coin (xu) system — single source of truth shared by
 * seed data, the editor form and the player-facing shop UI.
 *
 * - 1★ dishes are free and always worth exactly 400 points.
 * - Higher tiers live in point bands; within a band every dish carries its
 *   own baseScore, and the buy price follows from the score so a more
 *   valuable dish always costs more, even inside the same tier.
 * - A run only counts as a WIN at >= 40% of the dish's baseScore.
 */

export type DifficultyTier = 1 | 2 | 3 | 4 | 5;

export const SCORE_BANDS: Record<DifficultyTier, { min: number; max: number }> = {
  1: { min: 400, max: 400 },
  2: { min: 900, max: 1200 },
  3: { min: 1300, max: 1650 },
  4: { min: 1800, max: 2200 },
  5: { min: 2500, max: 3000 },
};

/** Price factor per tier applied on top of baseScore / 10. */
export const PRICE_FACTORS: Record<DifficultyTier, number> = {
  1: 0,
  2: 1.3,
  3: 3,
  4: 4.4,
  5: 6,
};

/** Suggested buy price (xu) for a dish; 1★ dishes are free. */
export function suggestPriceCoins(difficulty: number, baseScore: number): number {
  const tier = Math.min(5, Math.max(1, Math.round(difficulty))) as DifficultyTier;
  if (tier === 1) return 0;
  const raw = (baseScore / 10) * PRICE_FACTORS[tier];
  return Math.max(5, Math.round(raw / 5) * 5);
}

/** A run wins only when the final score reaches this share of baseScore. */
export const WIN_SCORE_RATIO = 0.4;

/** Minimum final score that still counts as a win for a dish. */
export function winThreshold(baseScore: number): number {
  return Math.ceil(baseScore * WIN_SCORE_RATIO);
}

/** Coins earned by a winning run before bonuses: 10 points = 1 xu. */
export function coinsForScore(finalScore: number): number {
  return Math.floor(Math.max(0, finalScore) / 10);
}

/** Extra coin ratio granted the first time a player completes a dish. */
export const FIRST_CLEAR_BONUS_RATIO = 0.5;
