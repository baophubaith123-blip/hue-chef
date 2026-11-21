import type { Recipe } from '@/data/types';
import type { PublicUser } from '@/features/auth/types';
import {
  chapterForRecipe,
  dishesOfChapter,
  previousChapter,
  type ChapterDef,
} from '@/features/journey/lib/chapters';

/**
 * Journey rules of the learning loop (Kế hoạch hợp nhất, Phần 4 — with
 * the per-dish boss law Bảo chốt 2026-11-20 replacing the H3 chapter
 * license law):
 * — a boss stage is judged more strictly than a normal run: the run must
 *   reach BOSS_PASS_STARS (a normal win only needs the 40% threshold);
 * — EVERY dish has its own boss: learn a dish (cook it at ≥1★) and its
 *   boss stage opens; beating it grants the sell license for THAT dish
 *   only. Boss difficulty follows the dish's own tier — a 1★ dish is the
 *   easiest boss, a special-tier dish the hardest — because the boss run
 *   cooks the dish itself under the strict bar;
 * — the chapter boss keeps its gate (every dish of the chapter learned
 *   at ≥1★ + the previous chapter's boss beaten) but changes role: it is
 *   the AREA-UNLOCK milestone of the journey and grants no sell license;
 * — LEGACY conversion: a stored chapter license (luật H3 cũ) still
 *   counts in full — it implies the chapter boss was beaten AND a dish
 *   license for every dish of that chapter, so nothing earned is lost;
 * — a dish enters the album with its culture card at ALBUM_UNLOCK_STARS
 *   best stars or more (mục 4.4).
 * Everything here is derived from the player's recorded runs and stored
 * license fields, so legacy progress is recognised automatically.
 */
export const BOSS_PASS_STARS = 3;
export const ALBUM_UNLOCK_STARS = 3;

/** Best stars the player ever reached per dish (0 = never cooked). */
export function bestStarsByRecipe(user: PublicUser | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of user?.cookedRecipes ?? []) {
    if (!entry || !entry.recipeId) continue;
    const current = map.get(entry.recipeId) ?? 0;
    if ((entry.stars ?? 0) > current) map.set(entry.recipeId, entry.stars ?? 0);
  }
  return map;
}

/** Best final score the player ever reached per dish. */
export function bestScoreByRecipe(user: PublicUser | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of user?.cookedRecipes ?? []) {
    if (!entry || !entry.recipeId) continue;
    const current = map.get(entry.recipeId) ?? 0;
    if ((entry.score ?? 0) > current) map.set(entry.recipeId, entry.score ?? 0);
  }
  return map;
}

function unionIds(a: string[] = [], b: string[] = []): string[] {
  return Array.from(new Set([...a, ...b]));
}

/**
 * True when the chapter's Ngự thiện boss counts as beaten: a stored
 * boss clear (luật mới), or a legacy chapter license — those players
 * beat the boss under the old law, and the clear is theirs to keep.
 */
export function hasBossClear(
  user: Pick<PublicUser, 'bossClears' | 'sellLicenses'> | null,
  chapterId: string,
): boolean {
  if (!user) return false;
  return (
    (user.bossClears ?? []).includes(chapterId) ||
    (user.sellLicenses ?? []).includes(chapterId)
  );
}

/**
 * True when this dish may be sold at the stall: it holds its own dish
 * license (per-dish boss win), or its chapter carries a legacy chapter
 * license, which converts into a dish license for every dish of the
 * chapter (quy đổi người chơi cũ — nothing earned is lost).
 */
export function hasDishLicense(user: PublicUser | null, recipe: Recipe): boolean {
  if (!user) return false;
  if ((user.dishLicenses ?? []).includes(recipe.id)) return true;
  const chapter = chapterForRecipe(recipe);
  return chapter !== undefined && (user.sellLicenses ?? []).includes(chapter.id);
}

/** Dish ids a set of legacy chapter licenses converts into. */
export function expandChapterLicenses(chapterIds: string[], recipes: Recipe[]): string[] {
  if (chapterIds.length === 0) return [];
  const wanted = new Set(chapterIds);
  return recipes
    .filter((recipe) => {
      const chapter = chapterForRecipe(recipe);
      return chapter !== undefined && wanted.has(chapter.id);
    })
    .map((recipe) => recipe.id);
}

/** The full effective chapter-boss-clear list of a record (stored + legacy). */
export function effectiveBossClears(
  user: Pick<PublicUser, 'bossClears' | 'sellLicenses'> | null,
): string[] {
  if (!user) return [];
  return unionIds(user.bossClears, user.sellLicenses);
}

/** The full effective per-dish license list of a record (stored + legacy conversion). */
export function effectiveDishLicenses(
  user: Pick<PublicUser, 'dishLicenses' | 'sellLicenses'> | null,
  recipes: Recipe[],
): string[] {
  if (!user) return [];
  return unionIds(
    user.dishLicenses,
    expandChapterLicenses(user.sellLicenses ?? [], recipes),
  );
}

export interface LicenseMigration {
  dishLicenses: string[];
  bossClears: string[];
  /** True when the materialised lists differ from what is stored. */
  changed: boolean;
}

/**
 * Materialise the new-law license fields of a stored record: legacy
 * chapter licenses expand into per-dish licenses for every dish of
 * those chapters and also count as chapter boss clears. Pure and
 * idempotent — running it on an already-migrated record changes
 * nothing, so it is safe to apply on every load / sync seam.
 */
export function migrateLicenseFields(
  user: Pick<PublicUser, 'dishLicenses' | 'bossClears' | 'sellLicenses'>,
  recipes: Recipe[],
): LicenseMigration {
  const dishLicenses = effectiveDishLicenses(user, recipes);
  const bossClears = effectiveBossClears(user);
  const sameList = (a: string[], b: string[]): boolean =>
    a.length === b.length && a.every((id, index) => id === b[index]);
  return {
    dishLicenses,
    bossClears,
    changed:
      !sameList(dishLicenses, user.dishLicenses ?? []) ||
      !sameList(bossClears, user.bossClears ?? []),
  };
}

export type DishBossState =
  | { kind: 'licensed' }
  | { kind: 'ready' }
  | { kind: 'locked' };

/**
 * The per-dish boss of one dish: licensed once its boss is beaten,
 * ready as soon as the dish is learned (cooked at ≥1★), locked before.
 */
export function dishBossStateFor(user: PublicUser | null, recipe: Recipe): DishBossState {
  if (hasDishLicense(user, recipe)) return { kind: 'licensed' };
  const best = bestStarsByRecipe(user).get(recipe.id) ?? 0;
  return best >= 1 ? { kind: 'ready' } : { kind: 'locked' };
}

export interface ChapterProgress {
  chapter: ChapterDef;
  dishes: Recipe[];
  total: number;
  /** Dishes cooked successfully at least once. */
  cookedCount: number;
  /** Dishes whose culture card is unlocked in the album (≥3★ best). */
  albumCount: number;
  albumComplete: boolean;
  /** The chapter boss counts as beaten (area-unlock milestone). */
  bossCleared: boolean;
  /** Dishes of this chapter holding a sell license. */
  licensedDishes: Recipe[];
  bossState: BossState;
}

export type BossBlockReason = 'need-dishes' | 'need-prev-boss';

export type BossState =
  | { kind: 'passed' }
  | { kind: 'ready' }
  | { kind: 'locked'; reason: BossBlockReason };

export function bossStateFor(
  user: PublicUser | null,
  chapter: ChapterDef,
  recipes: Recipe[],
): BossState {
  if (hasBossClear(user, chapter.id)) return { kind: 'passed' };
  const best = bestStarsByRecipe(user);
  const dishes = dishesOfChapter(recipes, chapter);
  const cookedAll = dishes.every((dish) => (best.get(dish.id) ?? 0) >= 1);
  if (!cookedAll) return { kind: 'locked', reason: 'need-dishes' };
  const prev = previousChapter(chapter);
  if (prev && !hasBossClear(user, prev.id)) {
    return { kind: 'locked', reason: 'need-prev-boss' };
  }
  return { kind: 'ready' };
}

export function chapterProgress(
  user: PublicUser | null,
  chapter: ChapterDef,
  recipes: Recipe[],
): ChapterProgress {
  const best = bestStarsByRecipe(user);
  const dishes = dishesOfChapter(recipes, chapter);
  const cookedCount = dishes.filter((dish) => (best.get(dish.id) ?? 0) >= 1).length;
  const albumCount = dishes.filter((dish) => (best.get(dish.id) ?? 0) >= ALBUM_UNLOCK_STARS).length;
  return {
    chapter,
    dishes,
    total: dishes.length,
    cookedCount,
    albumCount,
    albumComplete: dishes.length > 0 && albumCount === dishes.length,
    bossCleared: hasBossClear(user, chapter.id),
    licensedDishes: dishes.filter((dish) => hasDishLicense(user, dish)),
    bossState: bossStateFor(user, chapter, recipes),
  };
}

/** Every dish the player may sell at the stall: the dishes holding a dish license. */
export function sellableRecipes(user: PublicUser | null, recipes: Recipe[]): Recipe[] {
  if (!user) return [];
  return recipes.filter((recipe) => hasDishLicense(user, recipe));
}

/** True when this dish may be sold at the stall (it holds a dish license). */
export function isDishSellable(user: PublicUser | null, recipe: Recipe): boolean {
  return hasDishLicense(user, recipe);
}
