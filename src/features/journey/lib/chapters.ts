import type { Recipe } from '@/data/types';
import type { NoiNoiPose, SceneKey } from '@/components/theme-d/assets';

/**
 * The Hue journey of the learning loop (Kế hoạch hợp nhất, mục 4.1):
 * 50 dishes arranged into three chapters along the city — street carts
 * and Đông Ba market, old-town eateries, then the imperial kitchen.
 * Membership follows the plan's rising-difficulty rule, so any dish
 * (seeded or editor-made) belongs to exactly one chapter by its ★ tier.
 * Each chapter ends in a Ngự thiện boss stage (mục 4.2): beating it
 * grants the sell license for the whole chapter.
 */
export interface ChapterDef {
  id: string;
  order: number;
  /** The chapter's signature dish, cooked as the boss stage. */
  bossRecipeId: string;
  scene: SceneKey;
  /** Nồi Nồi pose of the chapter's teacher companion. */
  teacherPose: NoiNoiPose;
  minDifficulty: number;
  maxDifficulty: number;
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'dong-ba',
    order: 1,
    bossRecipeId: 'banh-bot-loc',
    scene: 'cho',
    teacherPose: 'keo-xe',
    minDifficulty: 1,
    maxDifficulty: 2,
  },
  {
    id: 'pho-co',
    order: 2,
    bossRecipeId: 'banh-trang-cuon',
    scene: 'san-le-hoi',
    teacherPose: 'gioi-thieu',
    minDifficulty: 3,
    maxDifficulty: 3,
  },
  {
    id: 'cung-dinh',
    order: 3,
    bossRecipeId: 'bun-bo-hue',
    scene: 'ngu-thien',
    teacherPose: 'mc',
    minDifficulty: 4,
    maxDifficulty: 5,
  },
];

export function chapterById(chapterId: string | null | undefined): ChapterDef | undefined {
  return CHAPTERS.find((chapter) => chapter.id === chapterId);
}

export function chapterForRecipe(recipe: Pick<Recipe, 'difficulty'>): ChapterDef | undefined {
  return CHAPTERS.find(
    (chapter) => recipe.difficulty >= chapter.minDifficulty && recipe.difficulty <= chapter.maxDifficulty,
  );
}

/** The chapter whose boss stage cooks this dish, if it is a signature dish. */
export function bossChapterForRecipe(recipeId: string): ChapterDef | undefined {
  return CHAPTERS.find((chapter) => chapter.bossRecipeId === recipeId);
}

/** Dishes of a chapter, easiest first — the order they line the map path. */
export function dishesOfChapter(recipes: Recipe[], chapter: ChapterDef): Recipe[] {
  return recipes
    .filter(
      (recipe) => recipe.difficulty >= chapter.minDifficulty && recipe.difficulty <= chapter.maxDifficulty,
    )
    .sort((a, b) => a.difficulty - b.difficulty || a.baseScore - b.baseScore);
}

export function previousChapter(chapter: ChapterDef): ChapterDef | undefined {
  return CHAPTERS.find((candidate) => candidate.order === chapter.order - 1);
}
