import { getIngredientById } from '@/data/ingredients';
import { seededUnit } from '@/features/stall/lib/day';

/**
 * Đông Ba market rules (Kế hoạch hợp nhất, mục 6.1 + Phần 11):
 * every ingredient has a base price; each game day the price reseeds
 * deterministically inside ±30% of base. The game never buys for the
 * player — a cheap day is an opportunity, not an automation.
 */

/** Base price in xu of one inventory unit, by ingredient group. One unit
 * is exactly what one batch (one portion) of a dish consumes. */
const BASE_PRICE_BY_CATEGORY: Record<string, number> = {
  protein: 14,
  vegetable: 7,
  spice: 9,
  grain: 8,
  'dau-hat': 10,
  other: 11,
};

/** Premium ingredients priced above their group base. */
const PRICE_MULTIPLIER_OVERRIDES: Record<string, number> = {
  'birds-nest': 8,
  crab: 3,
  squid: 2.5,
  tuna: 2,
  'dried-shrimp': 2,
  shrimp: 2,
  'beef-shank': 2,
  snakehead: 2,
  'lotus-seed': 1.8,
  'beef-tendon': 1.8,
  longan: 1.6,
  'pork-hock': 1.5,
  'cha-lua': 1.5,
  'fish-cake': 1.4,
  'pork-crackling': 1.4,
};

export function basePriceFor(ingredientId: string): number {
  const ingredient = getIngredientById(ingredientId);
  const base = BASE_PRICE_BY_CATEGORY[ingredient?.category ?? 'other'] ?? 11;
  const multiplier = PRICE_MULTIPLIER_OVERRIDES[ingredientId] ?? 1;
  return Math.max(2, Math.round(base * multiplier));
}

/** Today's price: base × (0.70..1.30), reseeded per day + ingredient. */
export function dailyPriceFor(ingredientId: string, dayKey: string): number {
  const unit = seededUnit(`market:${dayKey}:${ingredientId}`);
  const factor = 0.7 + unit * 0.6;
  return Math.max(1, Math.round(basePriceFor(ingredientId) * factor));
}

/** Signed change of today's price against base, as a ratio (−0.3..+0.3). */
export function dailyChangeFor(ingredientId: string, dayKey: string): number {
  const base = basePriceFor(ingredientId);
  if (base <= 0) return 0;
  return (dailyPriceFor(ingredientId, dayKey) - base) / base;
}

/**
 * Pantry shelf life in game days (Phần 11): fresh goods (protein,
 * vegetables) keep 2 days, dry goods (grain, spice, beans, other) 7.
 * Cold storage multiplies the span (Gói H6, mục 8.2): tủ lạnh ×2,
 * tủ đông ×4 — the factor comes from lib/support's shelfLifeFactor
 * and is applied when the lot is bought, so a lot keeps the expiry
 * it was bought under even if the gear is sold later (it never is).
 */
export function shelfLifeDaysFor(ingredientId: string, storageFactor = 1): number {
  const category = getIngredientById(ingredientId)?.category ?? 'other';
  const base = category === 'protein' || category === 'vegetable' ? 2 : 7;
  return base * Math.max(1, Math.round(storageFactor));
}
