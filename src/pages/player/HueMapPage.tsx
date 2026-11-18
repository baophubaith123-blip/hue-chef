import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Badge } from '@/components/theme-d/Badge';
import { BOSS_JUDGE_IMAGE, SCENES } from '@/components/theme-d/assets';
import { DishGradeFrame } from '@/components/theme-d/DishGradeFrame';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { KraftCard } from '@/components/theme-d/KraftCard';
import { NoiNoi } from '@/components/theme-d/NoiNoi';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { Recipe } from '@/data/types';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { CHAPTERS, previousChapter } from '@/features/journey/lib/chapters';
import {
  BOSS_PASS_STARS,
  bestStarsByRecipe,
  chapterProgress,
  type ChapterProgress,
} from '@/features/journey/lib/journey';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/HueMapPage.module.css';

function DishNode({
  recipe,
  bestStars,
  gradeLabel,
}: {
  recipe: Recipe;
  bestStars: number;
  gradeLabel: string;
}) {
  return (
    <Link to={`/recipes/${recipe.id}`} className={styles.dishLink}>
      <DishGradeFrame grade={dishGradeFor(recipe)} gradeLabel={gradeLabel}>
        <div className={styles.dishCard}>
          <ImageWithFallback
            className={styles.dishImage}
            src={recipe.image}
            alt={recipe.name}
            fallbackTitle={recipe.name}
          />
          <span className={styles.dishName}>{recipe.name}</span>
          <span className={bestStars > 0 ? styles.dishStars : styles.dishStarsEmpty}>
            {bestStars > 0
              ? `${'★'.repeat(bestStars)}${'☆'.repeat(5 - bestStars)}`
              : '☆☆☆☆☆'}
          </span>
        </div>
      </DishGradeFrame>
    </Link>
  );
}

function ChapterSection({ progress }: { progress: ChapterProgress }) {
  const { dict } = useTranslation();
  const { user } = useAuth();
  const { getRecipeById } = useRecipes();
  const j = dict.journey;
  const chapter = progress.chapter;
  const text = j.chapters[chapter.id];
  const best = useMemo(() => bestStarsByRecipe(user), [user]);
  const bossRecipe = getRecipeById(chapter.bossRecipeId);
  const prev = previousChapter(chapter);
  const prevName = prev ? j.chapters[prev.id]?.name ?? '' : '';
  const state = progress.bossState;

  return (
    <KraftCard as="section" className={styles.chapter}>
      <div className={styles.chapterHead}>
        <img className={styles.chapterScene} src={SCENES[chapter.scene]} alt="" />
        <div className={styles.chapterHeadText}>
          <div className={styles.chapterTitleRow}>
            <Badge tone="brick">{j.chapterLabel(chapter.order)}</Badge>
            <Badge tone="paper">{j.dishCount(progress.total)}</Badge>
            {progress.licensed ? <Badge tone="gold">📜 {j.licenseTitle}</Badge> : null}
          </div>
          <h2 className={styles.chapterName}>{text?.name}</h2>
          <p className={styles.chapterTagline}>{text?.tagline}</p>
          <p className={styles.chapterProgress}>
            {j.cookedProgress(progress.cookedCount, progress.total)}
            {' · '}
            {j.albumSetProgress(progress.albumCount, progress.total)}
          </p>
          <p className={styles.teacherLine}>
            <span className={styles.teacherLabel}>{j.teacherLabel}:</span>{' '}
            <strong>{text?.teacherName}</strong> — {text?.teacherRole}
          </p>
        </div>
        <NoiNoi
          pose={chapter.teacherPose}
          alt={text?.teacherName ?? ''}
          size={110}
          className={styles.teacherArt}
        />
      </div>

      <div className={styles.dishGrid}>
        {progress.dishes.map((dish) => (
          <DishNode
            key={dish.id}
            recipe={dish}
            bestStars={best.get(dish.id) ?? 0}
            gradeLabel={dict.recipe.gradeNames[dishGradeFor(dish) - 1] ?? ''}
          />
        ))}
      </div>

      <div className={styles.bossPanel}>
        <img className={styles.judgeArt} src={BOSS_JUDGE_IMAGE} alt={j.judgeAlt} />
        <div className={styles.bossText}>
          <h3 className={styles.bossName}>
            {j.bossTitle}
            {bossRecipe ? `: ${bossRecipe.name}` : ''}
          </h3>
          <p className={styles.bossRule}>{j.bossRule(BOSS_PASS_STARS)}</p>
          {state.kind === 'passed' ? (
            <>
              <p className={styles.bossStateOk}>🏆 {j.bossPassed}</p>
              <p className={styles.sellableLabel}>{j.licenseSellableList}:</p>
              <div className={styles.sellableChips}>
                {progress.dishes.map((dish) => (
                  <span key={dish.id} className={styles.sellableChip}>
                    {dish.name}
                  </span>
                ))}
              </div>
            </>
          ) : state.kind === 'ready' ? (
            <>
              <p className={styles.bossStateReady}>✨ {j.bossReady}</p>
              <Link to={`/cooking/${chapter.bossRecipeId}?boss=${chapter.id}`}>
                <GoldButton>{j.bossEnter}</GoldButton>
              </Link>
            </>
          ) : (
            <p className={styles.bossStateLocked}>
              🔒{' '}
              {state.reason === 'need-prev-license'
                ? j.bossLockedPrev(prevName)
                : j.bossLockedDishes(progress.cookedCount, progress.total)}
            </p>
          )}
          {state.kind === 'passed' ? (
            <Link
              className={styles.bossReplayLink}
              to={`/cooking/${chapter.bossRecipeId}?boss=${chapter.id}`}
            >
              {j.bossReplay}
            </Link>
          ) : null}
        </div>
      </div>
    </KraftCard>
  );
}

export default function HueMapPage() {
  const { dict } = useTranslation();
  const { user } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const j = dict.journey;
  const recipes = getApprovedRecipes();

  const progresses = useMemo(
    () => CHAPTERS.map((chapter) => chapterProgress(user, chapter, recipes)),
    [user, recipes],
  );
  const licenseCount = progresses.filter((progress) => progress.licensed).length;

  return (
    <PlayerShell>
      <div className={styles.container}>
        <div className={styles.head}>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon} aria-hidden="true">
              🗺️
            </span>
            <h1 className={styles.title}>{j.mapTitle}</h1>
          </div>
          <p className={styles.subtitle}>{j.mapSubtitle}</p>
          <p className={styles.licenseSummary}>
            📜 {j.licenseTitle}: {licenseCount}/{CHAPTERS.length}
            {licenseCount === 0 ? ` — ${j.licenseNone}` : ''}
          </p>
        </div>

        <div className={styles.mapHero}>
          <img className={styles.mapImage} src={SCENES['ban-do-hue']} alt={j.mapTitle} />
        </div>

        {progresses.map((progress) => (
          <ChapterSection key={progress.chapter.id} progress={progress} />
        ))}
      </div>
    </PlayerShell>
  );
}
