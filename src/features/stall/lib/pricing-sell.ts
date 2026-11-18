import type { DishGrade } from '@/components/theme-d/DishGradeFrame';
import type { SellQualityLevel } from '@/features/stall/types';

/**
 * Sell pricing law (Kế hoạch hợp nhất, mục 6.5 / 6.6 / 6.12 + Phần 11):
 *
 *   price = real batch cost × (1 + margin by dish grade)
 *           × learned-star multiplier × quality multiplier, then + tip.
 *
 * Invariants the numbers below are calibrated to keep (checked by bot):
 *  — Đạt chuẩn or better ALWAYS profits after cost, at every grade;
 *  — Tốt still profits, but clearly thinner;
 *  — Cháy sells at roughly break-even; Hỏng can never be sold;
 *  — a ±30% market swing cannot break the minimum margin, because the
 *    price is anchored to the cost actually paid, never to a list price.
 */

/** Profit margin over real cost, by the dish's fixed grade (mục 6.12). */
export const GRADE_MARGIN: Record<DishGrade, number> = {
  1: 0.4,
  2: 0.55,
  3: 0.75,
  4: 1.0,
  5: 1.5,
};

export interface QualityBand {
  level: SellQualityLevel;
  /** Lowest 0–100 score of the band. */
  minScore: number;
  /** Multiplier on the price (Phần 11, calibrated at H4 — see header). */
  priceFactor: number;
  /** Stall EXP the stall earns when an order is served at this level. */
  exp: number;
  /** Share of the maximum tip the level can earn at full satisfaction. */
  tipFactor: number;
  sellable: boolean;
}

/**
 * Quality bands (mục 6.5). Phần 11 sketched ×1.2 / ×1.0 / ×0.7 / ×0.3,
 * but ×0.7 for Tốt and ×0.3 for Cháy would push a grade-1 dish below its
 * cost (1.40 × 0.7 = 0.98; 1.40 × 0.3 = 0.42), breaking the capital law
 * of mục 6.12 — so Tốt is calibrated to ×0.8 (1.40 × 0.8 = 1.12, a thin
 * profit) and Cháy to ×0.72 (1.40 × 0.72 ≈ 1.01, break-even), exactly
 * the calibration H4 was charged with; H10 re-checks with play data.
 */
export const QUALITY_BANDS: QualityBand[] = [
  { level: 'perfect', minScore: 90, priceFactor: 1.2, exp: 20, tipFactor: 1, sellable: true },
  { level: 'standard', minScore: 75, priceFactor: 1.0, exp: 20, tipFactor: 0.8, sellable: true },
  { level: 'good', minScore: 60, priceFactor: 0.8, exp: 10, tipFactor: 0.5, sellable: true },
  { level: 'burned', minScore: 40, priceFactor: 0.72, exp: 2, tipFactor: 0.1, sellable: true },
  { level: 'spoiled', minScore: 0, priceFactor: 0, exp: 0, tipFactor: 0, sellable: false },
];

export function qualityBandForScore(score: number): QualityBand {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  return QUALITY_BANDS.find((band) => clamped >= band.minScore) ?? QUALITY_BANDS[QUALITY_BANDS.length - 1];
}

export function qualityBandForLevel(level: SellQualityLevel): QualityBand {
  return QUALITY_BANDS.find((band) => band.level === level) ?? QUALITY_BANDS[QUALITY_BANDS.length - 1];
}

/** Learned-star price multiplier (mục 6.6): 3★ ×1.0 — 4★ ×1.15 — 5★ ×1.3.
 * Fewer stars never push the multiplier below 1, so the capital law's
 * minimum margin holds for freshly licensed dishes too. */
export function starMultiplierFor(bestStars: number): number {
  if (bestStars >= 5) return 1.3;
  if (bestStars >= 4) return 1.15;
  return 1.0;
}

/** Dish price before tip, from the batch's real cost. */
export function priceForBatch(params: {
  cost: number;
  grade: DishGrade;
  bestStars: number;
  level: SellQualityLevel;
}): number {
  const band = qualityBandForLevel(params.level);
  if (!band.sellable) return 0;
  const raw =
    params.cost *
    (1 + GRADE_MARGIN[params.grade]) *
    starMultiplierFor(params.bestStars) *
    band.priceFactor;
  return Math.max(1, Math.round(raw));
}

/**
 * Tip (Phần 11): up to 20% of the dish price, scaled by how much of the
 * customer's patience is left when the dish lands and by quality.
 */
export function tipForBatch(params: {
  price: number;
  level: SellQualityLevel;
  patienceLeftRatio: number;
}): number {
  const band = qualityBandForLevel(params.level);
  if (!band.sellable || params.price <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, params.patienceLeftRatio));
  return Math.round(params.price * 0.2 * ratio * band.tipFactor);
}

/** Cok a served VIP order pays (Phần 11): Đạt chuẩn+ 1, Hoàn hảo 2. */
export function cokForServe(level: SellQualityLevel): number {
  if (level === 'perfect') return 2;
  if (level === 'standard') return 1;
  return 0;
}

/** Stall EXP for a lost order: a little, never negative (chốt 3). */
export const LOST_ORDER_EXP = 2;

/** Cumulative EXP thresholds for stall stars 2..5 (Phần 11). */
export const STALL_EXP_THRESHOLDS = [100, 250, 500, 900];

export function stallStarsForExp(exp: number): number {
  let stars = 1;
  for (const threshold of STALL_EXP_THRESHOLDS) {
    if (exp >= threshold) stars += 1;
  }
  return Math.min(5, stars);
}

/** Customer volume multiplier per stall star (Phần 11). */
export const STALL_VOLUME: Record<number, number> = {
  1: 1.0,
  2: 1.25,
  3: 1.5,
  4: 1.8,
  5: 2.2,
};

/** Scene tables: more stars, more seats (stall size upgrades are H6). */
export function tablesForStars(stars: number): number {
  return 2 + Math.min(5, Math.max(1, stars));
}

/**
 * Shift length (chốt N4 — Muse balances). The plan sketches ~3 minutes
 * growing to ~5, but a sell cook reuses the full 5-stage engine, whose
 * run alone takes minutes; the shift is therefore calibrated longer so
 * a player can cook and serve several orders per shift. H10 re-tunes.
 */
export function shiftDurationMs(stars: number): number {
  const s = Math.min(5, Math.max(1, stars));
  return (420 + (s - 1) * 60) * 1000;
}

/** Customers a shift receives: base flow scaled by the star volume. */
export function shiftQuotaForStars(stars: number): number {
  const volume = STALL_VOLUME[Math.min(5, Math.max(1, stars))] ?? 1;
  return Math.round(5 * volume);
}
