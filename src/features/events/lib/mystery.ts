import { SEED_INGREDIENTS, getIngredientById } from '@/data/ingredients';
import type { Recipe } from '@/data/types';
import { applicableRequestsFor } from '@/features/stall/lib/substitutions';
import type { MysterySwap } from '@/features/events/types';

/**
 * Mystery ingredient box (Gói H7, ý tưởng 10 — Kế hoạch hợp nhất
 * Phần 7 + mục 6.10): the box holds a LIMITED pantry for one dish —
 * a few of its required ingredients are missing, and in their place
 * the box offers a stand-in. The cook improvises with what the box
 * gives: the run is the ordinary 5-stage engine played on a synthetic
 * copy of the recipe whose steps ask for the stand-ins instead.
 *
 * Stand-ins are honest ones, never traps: first the house
 * substitution law's correct swap for that ingredient (the same law
 * picky customers follow, mục 6.3), else another ingredient of the
 * same category. Scoring stays the engine's own — the run's points
 * and stars come out of the unchanged scoring frame; the box only
 * changes WHAT is asked, never how it is scored.
 */

export const MYSTERY_STANDARD_PRICE_XU = 60;
export const MYSTERY_PREMIUM_PRICE_COK = 3;
/** Reward of a finished standard box: a base purse plus per-★ spice. */
export function mysteryStandardRewardXu(recipe: Recipe): number {
  return 40 + 10 * recipe.difficulty;
}
/** Reward of a finished premium box, on top of its guaranteed card. */
export const MYSTERY_PREMIUM_REWARD_XU = 150;

interface SwapCandidate extends MysterySwap {
  /** House-law swaps rank above same-category improvisation. */
  law: boolean;
}

function candidateSwaps(recipe: Recipe): SwapCandidate[] {
  const steps = recipe.steps ?? [];
  const requiredAll = new Set<string>();
  for (const step of steps) {
    for (const id of step.requiredIngredients) requiredAll.add(id);
  }
  const out: SwapCandidate[] = [];
  const seen = new Set<string>();

  const push = (stepIndex: number, fromId: string, toId: string, law: boolean) => {
    const key = `${stepIndex}:${fromId}`;
    if (seen.has(key) || fromId === toId) return;
    seen.add(key);
    out.push({ stepIndex, fromId, toId, law });
  };

  // (a) The house substitution law: an offender ingredient whose
  // correct handling is a replacement gives a lawful stand-in.
  for (const request of applicableRequestsFor(recipe)) {
    const correct = request.options.find((option) => option.correct);
    if (!correct || correct.action !== 'replace' || !correct.substituteId) continue;
    if (requiredAll.has(correct.substituteId)) continue;
    for (const offenderId of request.offenderIds) {
      steps.forEach((step, stepIndex) => {
        if (step.requiredIngredients.includes(offenderId)) {
          push(stepIndex, offenderId, correct.substituteId ?? '', true);
        }
      });
    }
  }

  // (b) Same-category improvisation for the remaining steps.
  steps.forEach((step, stepIndex) => {
    for (const fromId of step.requiredIngredients) {
      if (out.some((swap) => swap.stepIndex === stepIndex && swap.fromId === fromId)) continue;
      const from = getIngredientById(fromId);
      if (!from) continue;
      const candidates = ALL_INGREDIENT_IDS.filter((id) => {
        if (id === fromId || requiredAll.has(id)) return false;
        return getIngredientById(id)?.category === from.category;
      });
      const toId = candidates[0];
      if (toId) push(stepIndex, fromId, toId, false);
    }
  });

  return out;
}

const ALL_INGREDIENT_IDS: string[] = SEED_INGREDIENTS.map((ingredient) => ingredient.id);

/**
 * Draw the box's swaps for a dish: standard boxes swap 1–2
 * ingredients, premium boxes 2–3 (a harder improvisation for a
 * richer purse). Returns null when the dish offers no swap at all.
 */
export function buildMysterySwaps(
  recipe: Recipe,
  premium: boolean,
  rng: () => number,
): MysterySwap[] | null {
  const candidates = candidateSwaps(recipe);
  if (candidates.length === 0) return null;
  const shuffled = [...candidates].sort(() => rng() - 0.5);
  // House-law swaps first — the box should teach the law, not dodge it.
  shuffled.sort((a, b) => Number(b.law) - Number(a.law));
  const want = premium ? Math.min(3, shuffled.length) : Math.min(2, shuffled.length);
  const picked: MysterySwap[] = [];
  const usedFrom = new Set<string>();
  for (const candidate of shuffled) {
    if (picked.length >= want) break;
    if (usedFrom.has(candidate.fromId)) continue;
    usedFrom.add(candidate.fromId);
    picked.push({ stepIndex: candidate.stepIndex, fromId: candidate.fromId, toId: candidate.toId });
  }
  return picked.length > 0 ? picked : null;
}

/**
 * The synthetic recipe a mystery run is played on: same dish, same
 * scoring frame, with the box's stand-ins written into the steps and
 * the ingredient list (a stand-in inherits the missing ingredient's
 * amount; if it was already listed, the two entries merge).
 */
export function applyMysterySwaps(recipe: Recipe, swaps: MysterySwap[]): Recipe {
  const byStep = new Map<number, Map<string, string>>();
  for (const swap of swaps) {
    const map = byStep.get(swap.stepIndex) ?? new Map<string, string>();
    map.set(swap.fromId, swap.toId);
    byStep.set(swap.stepIndex, map);
  }
  const steps = (recipe.steps ?? []).map((step, index) => {
    const map = byStep.get(index);
    if (!map) return step;
    return {
      ...step,
      requiredIngredients: step.requiredIngredients.map((id) => map.get(id) ?? id),
    };
  });
  const swapByFrom = new Map(swaps.map((swap) => [swap.fromId, swap.toId]));
  const seen = new Set<string>();
  const ingredients: Recipe['ingredients'] = [];
  for (const ref of recipe.ingredients) {
    const nextId = swapByFrom.get(ref.ingredientId) ?? ref.ingredientId;
    if (seen.has(nextId)) continue;
    seen.add(nextId);
    ingredients.push({ ...ref, ingredientId: nextId });
  }
  return { ...recipe, steps, ingredients };
}
