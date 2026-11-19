import type { Recipe } from '@/data/types';
import type { CustomerMood, CustomerTier } from '@/components/theme-d/assets';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import type { StallCustomer } from '@/features/stall/types';

/**
 * Who walks up to the stall (Kế hoạch hợp nhất, mục 5.7 + Phần 11):
 * three customer tiers drawn true to type. The richer the stall's
 * reputation, the richer the crowd: tier ratios slide from 80/18/2 at
 * 1 star toward 55/35/10 at 5 stars. VIPs are the only cok source.
 */

interface TierRatios {
  thuong: number;
  giau: number;
  vip: number;
}

export function tierRatiosForStars(stars: number): TierRatios {
  const s = Math.min(5, Math.max(1, stars));
  const f = (s - 1) / 4; // 0 at 1 star, 1 at 5 stars
  return {
    thuong: 0.8 - 0.25 * f,
    giau: 0.18 + 0.17 * f,
    vip: 0.02 + 0.08 * f,
  };
}

export function rollTier(stars: number, roll: number, vipBoost = 1): CustomerTier {
  const ratios = tierRatiosForStars(stars);
  // Stall level 5 (mục 8.3): VIPs visit more often — their share grows
  // and the ordinary share gives the room up.
  const vip = Math.min(0.9, ratios.vip * Math.max(1, vipBoost));
  const giau = ratios.giau;
  if (roll < vip) return 'vip';
  if (roll < vip + giau) return 'giau';
  return 'thuong';
}

/** Base patience per tier in ms; VIPs judge fastest (mục 5.7). The
 * values are generous because a sell cook replays the full 5-stage
 * engine — the tension is real but a good run always fits. */
const PATIENCE_BY_TIER: Record<CustomerTier, number> = {
  thuong: 480_000,
  giau: 450_000,
  vip: 420_000,
};

export function patienceForTier(tier: CustomerTier, jitterUnit: number): number {
  const base = PATIENCE_BY_TIER[tier];
  return Math.round(base * (0.9 + jitterUnit * 0.2));
}

/** Largest order size grows with stall stars (Phần 11: 1→3 dishes). */
export function maxQtyForStars(stars: number): number {
  if (stars >= 5) return 3;
  if (stars >= 3) return 2;
  return 1;
}

export function rollQty(tier: CustomerTier, stars: number, roll: number): number {
  const max = maxQtyForStars(stars);
  if (max <= 1) return 1;
  // Higher tiers order more; the roll is skewed toward 1.
  const tierBoost = tier === 'vip' ? 0.25 : tier === 'giau' ? 0.15 : 0;
  if (roll < 0.45 + tierBoost) return 1;
  if (max >= 3 && roll > 0.9) return 3;
  return 2;
}

/**
 * Pick the dish a customer orders from the licensed menu: ordinary
 * customers order everyday dishes, rich customers reach higher, VIPs
 * prefer the top grades (and Đặc biệt dishes above all, mục 6.11).
 */
export function pickDishForTier(
  tier: CustomerTier,
  sellable: Recipe[],
  roll: number,
): Recipe | null {
  if (sellable.length === 0) return null;
  const weightOf = (recipe: Recipe): number => {
    const grade = dishGradeFor(recipe);
    if (tier === 'vip') return [0.5, 1, 2, 4, 8][grade - 1] ?? 1;
    if (tier === 'giau') return [1, 2, 2.5, 2, 1][grade - 1] ?? 1;
    return [4, 2.5, 1.2, 0.5, 0.2][grade - 1] ?? 1;
  };
  const total = sellable.reduce((sum, recipe) => sum + weightOf(recipe), 0);
  let cursor = roll * total;
  for (const recipe of sellable) {
    cursor -= weightOf(recipe);
    if (cursor <= 0) return recipe;
  }
  return sellable[sellable.length - 1] ?? null;
}

/**
 * Patience left in ms at a moment in time (Gói H6): a freeze card
 * holds the clock still — while frozen, elapsed time is read at the
 * freeze moment; after the freeze ends, the frozen span is excluded.
 * Spans of earlier freezes accumulate in patienceBankedMs.
 */
export function patienceLeftMs(customer: StallCustomer, now: number): number {
  const banked = customer.patienceBankedMs ?? 0;
  let elapsed: number;
  if (customer.freezeStart !== undefined && customer.freezeUntil !== undefined) {
    if (now < customer.freezeUntil) {
      elapsed = customer.freezeStart - customer.arrivedAt - banked;
    } else {
      elapsed = now - customer.arrivedAt - banked - (customer.freezeUntil - customer.freezeStart);
    }
  } else {
    elapsed = now - customer.arrivedAt - banked;
  }
  return Math.max(0, customer.patienceMs - Math.max(0, elapsed));
}

/** Patience left as a 0..1 ratio at a moment in time. */
export function patienceLeftRatio(customer: StallCustomer, now: number): number {
  if (customer.patienceMs <= 0) return 0;
  return Math.min(1, Math.max(0, patienceLeftMs(customer, now) / customer.patienceMs));
}

/**
 * The face the scene shows (mục 2.7): expressions follow the patience
 * bar, so the player reads the stall's health from faces alone.
 */
export function moodForCustomer(customer: StallCustomer, now: number): CustomerMood {
  if (customer.state === 'served') return 'vui';
  if (customer.state === 'left') return 'buon';
  const ratio = patienceLeftRatio(customer, now);
  if (ratio <= 0.25) return 'tuc-gian';
  if (ratio <= 0.55) return 'sot-ruot';
  return 'binh-thuong';
}
