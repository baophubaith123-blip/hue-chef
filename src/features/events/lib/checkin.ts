import { SEED_RECIPES } from '@/data/recipes';
import { dayDiff, seededUnit } from '@/features/stall/lib/day';

/**
 * Check-in, dish of the day and streak rules (Gói H7, ý tưởng 20 —
 * Kế hoạch hợp nhất Phần 7 + mục 6.8):
 *
 * — Check-in runs on a 7-day cycle of CONSECUTIVE claims. Miss a day
 *   and the cycle restarts at day 1. Days 1–6 pay xu; day 7 pays a
 *   bigger purse plus exactly 1 cok — the plan's sanctioned secondary
 *   cok source (chốt N1/M1). The cap math: 1 cok per 7 days at most,
 *   while a single VIP order served at Đạt chuẩn already pays 1 cok
 *   and a Hoàn hảo 2 — the stall stays the main cok road by a wide
 *   margin, and the festival bonus (stall store) is net-negative by
 *   ticket price, so the ≈1/4 secondary ceiling holds.
 *
 * — Dish of the day: one dish of the original 50, drawn
 *   deterministically from the day key. Its ×2 is defined precisely
 *   and measurably: in the LEARNING loop the run's XP is doubled; in
 *   the SELL loop the order's tip and stall EXP are doubled (booked
 *   inside serveCore, mirrored by the stall page's serve preview).
 *   The price itself is never doubled — the capital law of mục 6.12
 *   stays untouched.
 *
 * — Streak: consecutive days with at least one real cook or serve.
 *   The streak is "live" while the last play day is today or
 *   yesterday; one skipped day breaks it (currentStreak reads 0).
 */

export interface CheckinReward {
  xu: number;
  cok: number;
}

export const CHECKIN_REWARDS: CheckinReward[] = [
  { xu: 20, cok: 0 },
  { xu: 30, cok: 0 },
  { xu: 40, cok: 0 },
  { xu: 50, cok: 0 },
  { xu: 60, cok: 0 },
  { xu: 80, cok: 0 },
  { xu: 150, cok: 1 },
];

/** The cycle day (1..7) a claim on `today` would land on. */
export function nextCycleDay(lastClaimDay: string, cycleDay: number, today: string): number {
  if (!lastClaimDay) return 1;
  const gap = dayDiff(lastClaimDay, today);
  if (gap === 1) return cycleDay >= 7 ? 1 : cycleDay + 1;
  return 1; // same day (not claimable) or a broken chain of claims
}

/** All 50 original dish ids, in data order — the DotD universe. */
export const DOTD_RECIPE_IDS: string[] = SEED_RECIPES.map((recipe) => recipe.id);

/** The dish of the day for a game day key: deterministic, one dish. */
export function dishOfDayId(dayKey: string): string {
  const idx = Math.floor(seededUnit(`dotd:${dayKey}`) * DOTD_RECIPE_IDS.length);
  return DOTD_RECIPE_IDS[Math.min(DOTD_RECIPE_IDS.length - 1, idx)] ?? DOTD_RECIPE_IDS[0] ?? '';
}

export function isDishOfDay(recipeId: string, dayKey: string): boolean {
  return recipeId !== '' && recipeId === dishOfDayId(dayKey);
}

/** Live streak for display: 0 once a full day has been skipped. */
export function currentStreak(count: number, lastPlayDay: string, today: string): number {
  if (!lastPlayDay) return 0;
  const gap = dayDiff(lastPlayDay, today);
  return gap <= 1 ? count : 0;
}
