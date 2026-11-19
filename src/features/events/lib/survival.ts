import type { Recipe } from '@/data/types';

/**
 * Survival mode (Gói H7, ý tưởng 11 — Kế hoạch hợp nhất Phần 7): a
 * LEARNING-loop endurance run. The cook faces dish after dish from
 * their own repertoire, easiest first and harder as the run goes;
 * every failed dish is a strike, and the third strike ends the run.
 * The mode keeps its own record (most dishes cleared, best total
 * score) and never touches per-dish learning progress — a survival
 * cook is a feat of endurance, not a lesson.
 */

export const SURVIVAL_MAX_STRIKES = 3;
export const SURVIVAL_QUEUE_LENGTH = 10;
export const SURVIVAL_MIN_OWNED = 3;

/**
 * Build a run's queue: owned dishes grouped by difficulty ascending,
 * shuffled inside each group (variety without breaking the ramp),
 * capped at SURVIVAL_QUEUE_LENGTH.
 */
export function buildSurvivalQueue(owned: Recipe[], rng: () => number): Recipe[] {
  const groups = new Map<number, Recipe[]>();
  for (const recipe of owned) {
    const group = groups.get(recipe.difficulty) ?? [];
    group.push(recipe);
    groups.set(recipe.difficulty, group);
  }
  const queue: Recipe[] = [];
  for (const difficulty of [...groups.keys()].sort((a, b) => a - b)) {
    const group = [...(groups.get(difficulty) ?? [])].sort(() => rng() - 0.5);
    queue.push(...group);
  }
  return queue.slice(0, SURVIVAL_QUEUE_LENGTH);
}
