import type { Recipe } from '@/data/types';

// Difficulty-driven timings for the 5-stage run (market → catch →
// cook+season → finish → quiz). A recipe may override a few numbers via
// recipe.gameplay; anything unset falls back to these ★ tables so every
// existing recipe works with zero extra data.

export const MARKET_SECONDS_BY_DIFFICULTY: Record<number, number> = {
  1: 30,
  2: 35,
  3: 45,
  4: 52,
  5: 60,
};

/** Shopping list stays readable this long before it hides (3★ and up). */
export const MARKET_VIEW_SECONDS = 8;
/** Peeking at the hidden list again costs this many seconds of market time. */
export const MARKET_PEEK_COST_SECONDS = 5;
/** A peek shows the list for this long, then it hides (and reshuffles). */
export const MARKET_PEEK_SHOW_SECONDS = 3;
/** Decoys mixed into the market stall, by difficulty. */
export const MARKET_DECOY_COUNT: Record<number, number> = {
  1: 4,
  2: 6,
  3: 9,
  4: 12,
  5: 16,
};

const CATCH_FALL_MS_BY_DIFFICULTY: Record<number, number> = {
  1: 4600,
  2: 4100,
  3: 3600,
  4: 3100,
  5: 2600,
};

const CATCH_SPAWN_MS_BY_DIFFICULTY: Record<number, number> = {
  1: 1250,
  2: 1100,
  3: 950,
  4: 820,
  5: 700,
};

const CATCH_DECOY_RATIO_BY_DIFFICULTY: Record<number, number> = {
  1: 0.3,
  2: 0.38,
  3: 0.45,
  4: 0.52,
  5: 0.58,
};

export const FINISH_SECONDS_BY_DIFFICULTY: Record<number, number> = {
  1: 10,
  2: 12,
  3: 15,
  4: 18,
  5: 20,
};

const FINISH_RING_GROW_MS_BY_DIFFICULTY: Record<number, number> = {
  1: 1700,
  2: 1550,
  3: 1400,
  4: 1200,
  5: 1050,
};

const FINISH_SPAWN_MS_BY_DIFFICULTY: Record<number, number> = {
  1: 1350,
  2: 1250,
  3: 1100,
  4: 950,
  5: 820,
};

export interface ResolvedStageConfig {
  marketEnabled: boolean;
  catchEnabled: boolean;
  seasonEnabled: boolean;
  finishEnabled: boolean;
  quizEnabled: boolean;
  marketSeconds: number;
  /** Seconds the shopping list stays visible before hiding; 0 = never hides. */
  marketViewSeconds: number;
  marketPeekCostSeconds: number;
  marketPeekShowSeconds: number;
  marketDecoyCount: number;
  /** Milliseconds one falling token needs to cross the whole catch field. */
  catchFallMs: number;
  catchSpawnMs: number;
  catchDecoyRatio: number;
  finishSeconds: number;
  finishRingGrowMs: number;
  finishSpawnMs: number;
  /** How many rhythm rings may grow at the same time (2 only at 5★). */
  finishMaxRings: number;
}

export function resolveStageConfig(recipe: Recipe): ResolvedStageConfig {
  const d = recipe.difficulty;
  const g = recipe.gameplay ?? {};
  const catchSpeed = Math.min(2, Math.max(0.5, g.catchSpeed ?? 1));
  return {
    marketEnabled: g.marketEnabled !== false,
    catchEnabled: g.catchEnabled !== false,
    seasonEnabled: g.seasonEnabled !== false,
    finishEnabled: g.finishEnabled !== false,
    quizEnabled: g.quizEnabled !== false,
    marketSeconds: g.marketSeconds ?? MARKET_SECONDS_BY_DIFFICULTY[d] ?? 30,
    marketViewSeconds: d >= 3 ? MARKET_VIEW_SECONDS : 0,
    marketPeekCostSeconds: MARKET_PEEK_COST_SECONDS,
    marketPeekShowSeconds: MARKET_PEEK_SHOW_SECONDS,
    marketDecoyCount: MARKET_DECOY_COUNT[d] ?? 6,
    catchFallMs: Math.round((CATCH_FALL_MS_BY_DIFFICULTY[d] ?? 3600) / catchSpeed),
    catchSpawnMs: CATCH_SPAWN_MS_BY_DIFFICULTY[d] ?? 950,
    catchDecoyRatio: CATCH_DECOY_RATIO_BY_DIFFICULTY[d] ?? 0.45,
    finishSeconds: g.finishSeconds ?? FINISH_SECONDS_BY_DIFFICULTY[d] ?? 12,
    finishRingGrowMs: FINISH_RING_GROW_MS_BY_DIFFICULTY[d] ?? 1400,
    finishSpawnMs: FINISH_SPAWN_MS_BY_DIFFICULTY[d] ?? 1100,
    finishMaxRings: d >= 5 ? 2 : 1,
  };
}

/** The first stage a new session starts in, honouring the recipe toggles. */
export function firstStagePhase(recipe: Recipe): 'market' | 'catch' | 'running' {
  const cfg = resolveStageConfig(recipe);
  if (cfg.marketEnabled) return 'market';
  if (cfg.catchEnabled) return 'catch';
  return 'running';
}

/** Milliseconds for one full back-and-forth pass of the seasoning needle. */
export function seasonSweepMs(difficulty: number, ingredientCount: number): number {
  const base = 1600 - (difficulty - 1) * 90 - (ingredientCount - 1) * 130;
  return Math.max(750, base);
}

/** Width of the gold "just right" zone as a 0..1 ratio of the bar. */
export function seasonZoneRatio(difficulty: number, ingredientCount: number): number {
  const ratio = 0.26 - (difficulty - 1) * 0.014 - (ingredientCount - 1) * 0.045;
  return Math.max(0.1, ratio);
}
