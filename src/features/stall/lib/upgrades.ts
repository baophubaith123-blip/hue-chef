import { qualityBandForScore } from '@/features/stall/lib/pricing-sell';
import type { SellQualityLevel } from '@/features/stall/types';

/**
 * Kitchen upgrades bought with xu (Kế hoạch hợp nhất, ý tưởng 5, Gói
 * H5): the cook's own three tool lines. Prices climb steeply per level
 * (Phần 11: upgrade costs are the economy's main xu sink). Effects are
 * engine parameters, never score edits — a better knife widens the
 * target zone the gesture modules judge against (see
 * features/skills/lib/skills for the combined scale), a better stove
 * widens the fire zone and simmers background pots faster and tastier,
 * a bigger pot adds parallel background pots.
 *
 * These lines are deliberately distinct from the H6 support gear
 * (fridge / freezer / slicer / dough mixer / extra stove).
 */

export type UpgradeKind = 'knife' | 'stove' | 'pot';

/** Xu price of each next level, in order (index = current level). */
export const UPGRADE_PRICES: Record<UpgradeKind, number[]> = {
  knife: [300, 700, 1500],
  stove: [350, 800, 1700],
  pot: [500, 1200],
};

export function upgradeMaxLevel(kind: UpgradeKind): number {
  return UPGRADE_PRICES[kind].length;
}

/** Price of the next level, or null when the line is maxed. */
export function nextUpgradePrice(kind: UpgradeKind, level: number): number | null {
  return UPGRADE_PRICES[kind][level] ?? null;
}

/** Background pots that can simmer at once: 1 + pot level + extra
 * stoves (Gói H6 support gear, mục 8.2 — bought at the market or
 * granted at stall level 3). Together with the one active cook on
 * the main stove, even a starter stall runs 2 batches in parallel. */
export function potCapacityFor(potLevel: number, extraStoves = 0): number {
  return 1 + Math.max(0, potLevel) + Math.max(0, extraStoves);
}

/**
 * How long a background pot simmers: slower for harder dishes, faster
 * on a better stove (−8% per stove level), floored so a pot is never
 * instant. Starting parameters (Phần 11 spirit), H10 re-tunes.
 */
export function backgroundPotDurationMs(difficulty: number, stoveLevel: number): number {
  const d = Math.min(5, Math.max(1, difficulty));
  const base = (75 + d * 15) * 1000;
  const faster = base * (1 - 0.08 * Math.max(0, stoveLevel));
  return Math.round(Math.max(45_000, faster));
}

/**
 * Quality a background pot rolls when it starts: the cook's learned
 * stars for the dish and the stove do the talking, plus a luck roll.
 * Capped at 78 — a background pot can reach Đạt chuẩn but never Hoàn
 * hảo (90+); perfection still needs the player's own hands.
 */
export function rollBackgroundQuality(bestStars: number, stoveLevel: number, roll: number): number {
  const raw = 48 + 5 * Math.max(0, bestStars) + 3 * Math.max(0, stoveLevel) + roll * 14;
  return Math.round(Math.min(78, Math.max(35, raw)));
}

export function backgroundLevelFor(qualityScore: number): SellQualityLevel {
  return qualityBandForScore(qualityScore).level;
}
