import type { Recipe } from '@/data/types';
import type { PublicUser } from '@/features/auth/types';
import {
  chapterForRecipe,
  dishesOfChapter,
  previousChapter,
  type ChapterDef,
} from '@/features/journey/lib/chapters';

/**
 * Journey rules of the learning loop (Kế hoạch hợp nhất, Phần 4):
 * — a boss stage is judged more strictly than a normal run: the run must
 *   reach BOSS_PASS_STARS (a normal win only needs the 40% threshold);
 * — beating a chapter's boss grants the sell license for every dish of
 *   that chapter (chốt 1) — licenses are earned only this way;
 * — a dish enters the album with its culture card at ALBUM_UNLOCK_STARS
 *   best stars or more (mục 4.4).
 * Everything here is derived from the player's recorded runs, so legacy
 * progress is recognised automatically: cooked dishes count toward the
 * boss gate and the album from the first day, nothing is re-locked.
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

export function hasSellLicense(user: PublicUser | null, chapterId: string): boolean {
  return (user?.sellLicenses ?? []).includes(chapterId);
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
  licensed: boolean;
  bossState: BossState;
}

export type BossBlockReason = 'need-dishes' | 'need-prev-license';

export type BossState =
  | { kind: 'passed' }
  | { kind: 'ready' }
  | { kind: 'locked'; reason: BossBlockReason };

export function bossStateFor(
  user: PublicUser | null,
  chapter: ChapterDef,
  recipes: Recipe[],
): BossState {
  if (hasSellLicense(user, chapter.id)) return { kind: 'passed' };
  const best = bestStarsByRecipe(user);
  const dishes = dishesOfChapter(recipes, chapter);
  const cookedAll = dishes.every((dish) => (best.get(dish.id) ?? 0) >= 1);
  if (!cookedAll) return { kind: 'locked', reason: 'need-dishes' };
  const prev = previousChapter(chapter);
  if (prev && !hasSellLicense(user, prev.id)) {
    return { kind: 'locked', reason: 'need-prev-license' };
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
    licensed: hasSellLicense(user, chapter.id),
    bossState: bossStateFor(user, chapter, recipes),
  };
}

/** Every dish the player may sell at the stall: the dishes of licensed chapters. */
export function sellableRecipes(user: PublicUser | null, recipes: Recipe[]): Recipe[] {
  if (!user) return [];
  const licensed = new Set(user.sellLicenses ?? []);
  if (licensed.size === 0) return [];
  return recipes.filter((recipe) => {
    const chapter = chapterForRecipe(recipe);
    return chapter !== undefined && licensed.has(chapter.id);
  });
}

/** True when this dish may be sold at the stall (its chapter is licensed). */
export function isDishSellable(user: PublicUser | null, recipe: Recipe): boolean {
  const chapter = chapterForRecipe(recipe);
  return chapter !== undefined && hasSellLicense(user, chapter.id);
}
