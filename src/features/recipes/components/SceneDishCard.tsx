import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ImageWithFallback } from '@/components/ImageWithFallback';
import { dishArtClearFor } from '@/components/theme-d/dish-art';
import { gameIcon } from '@/components/theme-d/game-assets';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import type { Recipe } from '@/data/types';
import { difficultyName, difficultyStars } from '@/features/recipes/lib/difficulty';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

import cardEasy from '@/assets/theme-d/game/r4-card-easy.webp';
import cardNormal from '@/assets/theme-d/game/r4-card-normal.webp';
import cardHard from '@/assets/theme-d/game/r4-card-hard.webp';
import cardVhard from '@/assets/theme-d/game/r4-card-vhard.webp';
import cardSpecial from '@/assets/theme-d/game/r4-card-special.webp';

import styles from '@/features/recipes/components/SceneDishCard.module.css';

interface SceneDishCardProps {
  recipe: Recipe;
  /** When set, the dish is locked for the current player: show this price. */
  lockedPrice?: number;
}

type DifficultyTier = 1 | 2 | 3 | 4 | 5;

/** Đợt lan 4: one approved card frame per difficulty tier — the beauty
 *  escalates with the tier exactly as on the approved card sheet
 *  (Dễ bamboo → Thường wood → Khó carved + ribbon → Rất khó black
 *  lacquer + gold → Đặc biệt golden dragons). The frame art carries
 *  the tier name on its own sign, so no real text duplicates it. */
const TIER_FRAMES: Record<DifficultyTier, string> = {
  1: cardEasy,
  2: cardNormal,
  3: cardHard,
  4: cardVhard,
  5: cardSpecial,
};

const TIER_CLASS: Record<DifficultyTier, string> = {
  1: styles.tier1,
  2: styles.tier2,
  3: styles.tier3,
  4: styles.tier4,
  5: styles.tier5,
};

function tierFor(difficulty: number): DifficultyTier {
  return Math.min(5, Math.max(1, difficulty)) as DifficultyTier;
}

/**
 * Theme D scene dish card (Đợt lan 4): the dish lives inside the
 * approved per-tier card frame — square dish art (never cropped) in
 * the frame's transparent interior, real text (name, category, time,
 * score/price) on the paper face inside the frame.
 */
export function SceneDishCard({ recipe, lockedPrice }: SceneDishCardProps) {
  const { dict } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
  const { user } = useAuth();

  const categoryLabel = recipeCategoryLabel(recipe.category);
  const tierName = difficultyName(dict.recipe.difficultyNames, recipe.difficulty);
  const grade = dishGradeFor(recipe);
  const gradeLabel = dict.recipe.gradeNames[grade - 1] ?? '';
  const tier = tierFor(recipe.difficulty);
  const isLocked = lockedPrice !== undefined;

  // The player's own best stars for this dish (same rule as RecipeCard:
  // the frame shows the dish's fixed grade, these stars are the player's).
  const bestStars = useMemo(() => {
    const entries = (user?.cookedRecipes ?? []).filter((entry) => entry.recipeId === recipe.id);
    return entries.reduce((max, entry) => Math.max(max, entry.stars), 0);
  }, [user?.cookedRecipes, recipe.id]);

  return (
    <article className={`${styles.card} ${TIER_CLASS[tier]} ${isLocked ? styles.cardLocked : ''}`}>
      <img src={TIER_FRAMES[tier]} alt="" className={styles.frameImg} draggable={false} />
      <div className={styles.inner}>
        <Link
          to={`/recipes/${recipe.id}`}
          className={styles.imageLink}
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className={styles.imageWrap}>
            <ImageWithFallback
              className={styles.image}
              src={dishArtClearFor(recipe)}
              alt={recipe.name}
              fallbackTitle={recipe.name}
              loading="lazy"
            />
            {isLocked ? <div className={styles.lockVeil} aria-hidden="true" /> : null}
          </div>
          {/* Badges ride the cell's wooden FRAME edge (top corners,
              straddling the border) — never over the dish itself. */}
          <div className={styles.difficultyBadge}>
            <span className={styles.difficultyStars}>{difficultyStars(recipe.difficulty)}</span>
            <span className={styles.difficultyName}>{tierName}</span>
          </div>
          <div className={styles.timeBadge}>
            {gameIcon('clock') ? (
              <img src={gameIcon('clock')} alt="" className={styles.badgeIcon} />
            ) : (
              <span aria-hidden="true">⏱</span>
            )}{' '}
            {formatDuration(recipe.duration)}
          </div>
        </Link>

        <div className={styles.body}>
          <h3 className={styles.title}>
            <Link to={`/recipes/${recipe.id}`} className={styles.titleLink}>
              {recipe.name}
            </Link>
          </h3>

          <div className={styles.metaRow}>
            <span className={styles.categoryBadge}>{categoryLabel}</span>
            <span className={styles.gradeName}>{gradeLabel}</span>
          </div>

          {bestStars > 0 ? (
            <p className={styles.yourStars}>{dict.recipe.yourStars(bestStars)}</p>
          ) : null}

          <div className={`${styles.plaque} ${isLocked ? styles.plaqueLocked : ''}`}>
            {isLocked ? (
              <>
                {gameIcon('lock') ? (
                  <img src={gameIcon('lock')} alt="" className={styles.plaqueIcon} />
                ) : (
                  <span aria-hidden="true">🔒</span>
                )}
                <span>{lockedPrice.toLocaleString()} xu</span>
              </>
            ) : (
              <>
                {gameIcon('star') ? (
                  <img src={gameIcon('star')} alt="" className={styles.plaqueIcon} />
                ) : (
                  <span aria-hidden="true">⭐</span>
                )}
                <span>{recipe.baseScore.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
