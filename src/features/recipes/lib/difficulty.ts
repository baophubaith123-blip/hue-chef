/**
 * Difficulty tiers shared by recipe cards, detail header and filters.
 * Tier names themselves live in i18n (recipe.difficultyNames, index = tier - 1).
 */
export function difficultyName(names: string[], difficulty: number): string {
  const tier = Math.min(5, Math.max(1, difficulty));
  return names[tier - 1] ?? '';
}

/** Filled-star string for a difficulty tier, e.g. tier 3 -> "★★★". */
export function difficultyStars(difficulty: number): string {
  const tier = Math.min(5, Math.max(1, difficulty));
  return '★'.repeat(tier);
}
