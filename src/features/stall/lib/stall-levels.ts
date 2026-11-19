import type { Recipe } from '@/data/types';
import { dishGradeFor } from '@/features/recipes/lib/grade';

/**
 * Stall levels (Kế hoạch hợp nhất, mục 8.3) — the stall's SIZE, bought
 * with xu plus conditions. Deliberately a different ladder from stall
 * STARS (mục 6.7): stars are reputation earned in EXP and can never be
 * bought; levels are scale — more tables, a longer menu, a prettier
 * scene, and an income bonus applied at the very end of the pricing
 * law (mục 6.12: after the capital formula, before nothing else).
 *
 * Costs and conditions are the plan's starting table (chốt M2: Muse
 * balances, H10 re-tunes from play data). Levels never decrease.
 */
export interface StallLevelDef {
  level: number;
  /** Xu cost to upgrade INTO this level (level 1 is the default). */
  cost: number;
  /** Stall stars (reputation) required. */
  starsNeeded: number;
  /** Licensed dishes required. */
  licensedNeeded: number;
  /** Level 5 also demands a Cung đình / Đặc biệt dish among the licensed. */
  needsTopGradeDish: boolean;
  /** Income bonus applied to the dish price at settle time (mục 6.12). */
  incomeBonus: number;
  /** Scene tables — how many customers can sit at once. */
  tables: number;
  /** Dishes the on-sale menu may hold at once. */
  menuCap: number;
}

export const STALL_LEVELS: StallLevelDef[] = [
  { level: 1, cost: 0, starsNeeded: 1, licensedNeeded: 0, needsTopGradeDish: false, incomeBonus: 0, tables: 2, menuCap: 3 },
  { level: 2, cost: 500, starsNeeded: 2, licensedNeeded: 5, needsTopGradeDish: false, incomeBonus: 0.1, tables: 4, menuCap: 5 },
  { level: 3, cost: 1500, starsNeeded: 3, licensedNeeded: 8, needsTopGradeDish: false, incomeBonus: 0.2, tables: 6, menuCap: 7 },
  { level: 4, cost: 4000, starsNeeded: 4, licensedNeeded: 12, needsTopGradeDish: false, incomeBonus: 0.35, tables: 9, menuCap: 10 },
  { level: 5, cost: 10000, starsNeeded: 5, licensedNeeded: 18, needsTopGradeDish: true, incomeBonus: 0.5, tables: 12, menuCap: 15 },
];

export const MAX_STALL_LEVEL = STALL_LEVELS.length;

export function stallLevelDef(level: number): StallLevelDef {
  const clamped = Math.min(MAX_STALL_LEVEL, Math.max(1, Math.round(level)));
  return STALL_LEVELS[clamped - 1] ?? STALL_LEVELS[0];
}

/** Final settle multiplier of a level: ×1.0 / ×1.10 / ×1.20 / ×1.35 / ×1.50. */
export function incomeFactorForLevel(level: number): number {
  return 1 + stallLevelDef(level).incomeBonus;
}

export function tablesForLevel(level: number): number {
  return stallLevelDef(level).tables;
}

export function menuCapForLevel(level: number): number {
  return stallLevelDef(level).menuCap;
}

/** VIPs seek out the palace-grade stall: at level 5 they come half again as often. */
export const LEVEL5_VIP_BOOST = 1.5;

export type UpgradeMissing = 'stars' | 'licensed' | 'topGrade';

export interface UpgradeStatus {
  /** The level the player would upgrade into, or null at the top. */
  next: StallLevelDef | null;
  /** Conditions (other than xu, which the wallet owns) still unmet. */
  missing: UpgradeMissing[];
  ok: boolean;
}

/**
 * Can this player upgrade? Xu is deliberately NOT checked here — the
 * wallet lives on the user record and the page checks the balance;
 * the store re-validates everything else when booking the upgrade.
 */
export function upgradeStatusFor(params: {
  level: number;
  stars: number;
  licensed: Recipe[];
}): UpgradeStatus {
  const next = STALL_LEVELS[params.level] ?? null; // index = current level → next def
  if (!next) return { next: null, missing: [], ok: false };
  const missing: UpgradeMissing[] = [];
  if (params.stars < next.starsNeeded) missing.push('stars');
  if (params.licensed.length < next.licensedNeeded) missing.push('licensed');
  if (
    next.needsTopGradeDish &&
    !params.licensed.some((recipe) => dishGradeFor(recipe) >= 4)
  ) {
    missing.push('topGrade');
  }
  return { next, missing, ok: missing.length === 0 };
}
