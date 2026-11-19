import type { Recipe } from '@/data/types';
import { getIngredientById } from '@/data/ingredients';

/**
 * Picky-customer substitution law (Kế hoạch hợp nhất, mục 6.3): some
 * stall customers arrive with a hard dietary request — strict
 * vegetarian, no heat, a shrimp / peanut allergy, no fermented paste.
 * The player must answer with the ONE house-correct handling for the
 * dish on order; a wrong swap is punished heavily (the batch is
 * diagnosed `request-violated`, see diagnosis.ts), because in a real
 * kitchen these requests are about health and trust, not taste.
 *
 * The law is fully data-driven: REQUEST_RULES declares, per request
 * kind, how offenders are found in a recipe, which handling is
 * correct, and which tempting swap is the trap. `applicableRequestsFor`
 * only interprets that table — it invents no rule of its own.
 *
 * Why each correct handling is what it is:
 *  — vegetarian (strict, eggs included): every protein except tofu is
 *    an offender. Tofu is the canonical swap; straw mushroom and bean
 *    sprout follow because they carry the bite / freshness a Hue dish
 *    loses with its meat. Egg is the trap: it looks plant-adjacent to
 *    a careless cook but breaks a strict vegetarian request.
 *  — no-spicy: chili leaves the dish, period. Black pepper is the
 *    trap — a different plant, the same burn.
 *  — no-shrimp (allergy): fresh and dried shrimp both count. Pork
 *    mince, cha lua and fish cake keep the savoury body of the dish
 *    without shellfish. Crab is the trap: cross-allergy risk.
 *  — no-peanut (allergy): sesame is the classic sprinkled-seed swap —
 *    same nutty finish, different allergen family in this house law.
 *    Lotus seed is the trap: "another seed" is not a safety argument.
 *  — no-fish-paste (no mam ruoc / mam nem): fish sauce keeps the
 *    fermented depth in a milder form. Salt is the trap: it seasons
 *    but strips the dish of its soul.
 *
 * In every request the third option is `keep` — serve the dish
 * unchanged — which is always wrong: ignoring a stated request is the
 * worst answer a kitchen can give.
 */

export type RequestKind =
  | 'vegetarian'
  | 'no-spicy'
  | 'no-shrimp'
  | 'no-peanut'
  | 'no-fish-paste';

export interface SubstitutionOption {
  id: string;
  action: 'replace' | 'remove' | 'keep';
  substituteId?: string;
  correct: boolean;
}

export interface ApplicableRequest {
  kind: RequestKind;
  offenderIds: string[];
  options: SubstitutionOption[];
}

/** How a rule finds the ingredients that break its request. */
export type OffenderSpec =
  | { mode: 'category'; category: string; excludeIds: string[] }
  | { mode: 'ids'; ids: string[] };

/**
 * One row of the substitution law. The two wrong options of every
 * request are always the same shape — replace with `decoySubstituteId`
 * (the trap) and `keep` — so a rule only names its trap; the builder
 * below assembles all three options from the row alone.
 */
export interface SubstitutionRule {
  kind: RequestKind;
  offender: OffenderSpec;
  correctAction: 'replace' | 'remove';
  /**
   * Correct substitute ids. When `pickFirstUnused` is true this is a
   * priority list and the first id not already in the dish wins; when
   * false it holds the single canonical swap, used even if the dish
   * already contains it (leaning on it instead of the offender).
   * Empty when `correctAction` is 'remove'.
   */
  correctSubstitutes: string[];
  pickFirstUnused: boolean;
  decoySubstituteId: string;
}

export const REQUEST_RULES: SubstitutionRule[] = [
  {
    kind: 'vegetarian',
    // Strict vegetarian: every protein is an offender except tofu;
    // egg is a protein in the catalogue, so it offends too.
    offender: { mode: 'category', category: 'protein', excludeIds: ['tofu'] },
    correctAction: 'replace',
    correctSubstitutes: ['tofu', 'straw-mushroom', 'bean-sprout'],
    pickFirstUnused: true,
    decoySubstituteId: 'egg',
  },
  {
    kind: 'no-spicy',
    offender: { mode: 'ids', ids: ['chili'] },
    correctAction: 'remove',
    correctSubstitutes: [],
    pickFirstUnused: false,
    decoySubstituteId: 'black-pepper',
  },
  {
    kind: 'no-shrimp',
    offender: { mode: 'ids', ids: ['shrimp', 'dried-shrimp'] },
    correctAction: 'replace',
    correctSubstitutes: ['pork-mince', 'cha-lua', 'fish-cake'],
    pickFirstUnused: true,
    decoySubstituteId: 'crab',
  },
  {
    kind: 'no-peanut',
    offender: { mode: 'ids', ids: ['peanut'] },
    correctAction: 'replace',
    correctSubstitutes: ['sesame'],
    pickFirstUnused: false,
    decoySubstituteId: 'lotus-seed',
  },
  {
    kind: 'no-fish-paste',
    offender: { mode: 'ids', ids: ['shrimp-paste', 'fermented-fish'] },
    correctAction: 'replace',
    correctSubstitutes: ['fish-sauce'],
    pickFirstUnused: false,
    decoySubstituteId: 'salt',
  },
];

export const REQUEST_KINDS: RequestKind[] = REQUEST_RULES.map((rule) => rule.kind);

export const REQUEST_ICONS: Record<RequestKind, string> = {
  vegetarian: '🥬',
  'no-spicy': '🌶️',
  'no-shrimp': '🦐',
  'no-peanut': '🥜',
  'no-fish-paste': '🏺',
};

function offenderIdsFor(recipe: Recipe, spec: OffenderSpec): string[] {
  if (spec.mode === 'ids') {
    const inDish = new Set(recipe.ingredients.map((ref) => ref.ingredientId));
    return spec.ids.filter((id) => inDish.has(id));
  }
  const seen = new Set<string>();
  const offenders: string[] = [];
  for (const ref of recipe.ingredients) {
    if (seen.has(ref.ingredientId)) continue;
    seen.add(ref.ingredientId);
    if (spec.excludeIds.includes(ref.ingredientId)) continue;
    if (getIngredientById(ref.ingredientId)?.category === spec.category) {
      offenders.push(ref.ingredientId);
    }
  }
  return offenders;
}

function replaceOption(kind: RequestKind, substituteId: string, correct: boolean): SubstitutionOption {
  return { id: `${kind}:replace:${substituteId}`, action: 'replace', substituteId, correct };
}

function removeOption(kind: RequestKind, correct: boolean): SubstitutionOption {
  return { id: `${kind}:remove`, action: 'remove', correct };
}

/**
 * The correct option of a rule for one concrete dish. For priority-list
 * rules the first substitute the dish does not already contain wins;
 * in the worst case — every candidate is already in the dish, so a
 * swap would only duplicate an ingredient — the honest correct answer
 * degrades to removing the offenders outright.
 */
function correctOptionFor(rule: SubstitutionRule, recipeIds: Set<string>): SubstitutionOption {
  if (rule.correctAction === 'remove') return removeOption(rule.kind, true);
  if (rule.pickFirstUnused) {
    const pick = rule.correctSubstitutes.find(
      (id) => !recipeIds.has(id) && getIngredientById(id) !== undefined,
    );
    return pick !== undefined ? replaceOption(rule.kind, pick, true) : removeOption(rule.kind, true);
  }
  const canonical = rule.correctSubstitutes[0];
  if (canonical !== undefined && getIngredientById(canonical) !== undefined) {
    return replaceOption(rule.kind, canonical, true);
  }
  return removeOption(rule.kind, true);
}

/** Small deterministic string hash (djb2) — stable across runs and
 * devices, so a dish + request always shuffles the same way. */
function hashOf(text: string): number {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function requestForKind(recipe: Recipe, kind: RequestKind): ApplicableRequest | null {
  const rule = REQUEST_RULES.find((row) => row.kind === kind);
  if (rule === undefined) return null;
  const offenderIds = offenderIdsFor(recipe, rule.offender);
  if (offenderIds.length === 0) return null;

  const recipeIds = new Set(recipe.ingredients.map((ref) => ref.ingredientId));
  const ordered: SubstitutionOption[] = [
    correctOptionFor(rule, recipeIds),
    replaceOption(kind, rule.decoySubstituteId, false),
    { id: `${kind}:keep`, action: 'keep', correct: false },
  ];
  // Rotate the correct answer's slot by a hash of dish + request, so
  // its position is stable per dish but cannot be memorised globally.
  const shift = hashOf(`${recipe.id}:${kind}`) % ordered.length;
  const options = ordered.slice(shift).concat(ordered.slice(0, shift));
  return { kind, offenderIds, options };
}

export function applicableRequestsFor(recipe: Recipe): ApplicableRequest[] {
  const result: ApplicableRequest[] = [];
  for (const kind of REQUEST_KINDS) {
    const request = requestForKind(recipe, kind);
    if (request !== null) result.push(request);
  }
  return result;
}
