import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Badge } from '@/components/theme-d/Badge';
import { BOSS_JUDGE_IMAGE, SCENES } from '@/components/theme-d/assets';
import { dishArtFor } from '@/components/theme-d/dish-art';
import type { DishGrade } from '@/components/theme-d/DishGradeFrame';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { NoiNoi } from '@/components/theme-d/NoiNoi';
import { WoodPanel } from '@/components/theme-d/WoodPanel';
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
import { SceneShell } from '@/pages/player/SceneShell';

import steleArt from '@/assets/theme-d/game/r4-stage-stele.webp';

import styles from '@/pages/player/HueMapPage.module.css';

const GRADE_RING: Record<DishGrade, string> = {
  1: styles.grade1,
  2: styles.grade2,
  3: styles.grade3,
  4: styles.grade4,
  5: styles.grade5,
};

function DishNode({
  recipe,
  bestStars,
  gradeLabel,
}: {
  recipe: Recipe;
  bestStars: number;
  gradeLabel: string;
}) {
  const grade = dishGradeFor(recipe);
  const cooked = bestStars > 0;
  return (
    <li className={styles.pathNode}>
      <Link to={`/recipes/${recipe.id}`} className={styles.dishLink}>
        <span
          className={`${styles.medallion} ${GRADE_RING[grade]} ${
            cooked ? styles.medallionCooked : styles.medallionFresh
          }`}
          title={gradeLabel}
        >
          <ImageWithFallback
            className={styles.dishArt}
            src={dishArtFor(recipe)}
            alt={recipe.name}
            fallbackTitle={recipe.name}
          />
        </span>
        <span className={styles.dishName}>{recipe.name}</span>
        <span className={bestStars > 0 ? styles.dishStars : styles.dishStarsEmpty}>
          {bestStars > 0
            ? `${'★'.repeat(bestStars)}${'☆'.repeat(5 - bestStars)}`
            : '☆☆☆☆☆'}
        </span>
      </Link>
    </li>
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
    <WoodPanel title={text?.name} titleLevel="h2" bodyClassName={styles.chapterBody}>
      <div className={styles.chapterHead}>
        <span className={styles.chapterSceneFrame}>
          <img className={styles.chapterScene} src={SCENES[chapter.scene]} alt="" />
        </span>
        <div className={styles.chapterHeadText}>
          <div className={styles.chapterTitleRow}>
            <Badge tone="brick">{j.chapterLabel(chapter.order)}</Badge>
            <Badge tone="paper">{j.dishCount(progress.total)}</Badge>
            {progress.licensed ? <Badge tone="gold">📜 {j.licenseTitle}</Badge> : null}
          </div>
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

      <ol className={styles.path}>
        {progress.dishes.map((dish) => (
          <DishNode
            key={dish.id}
            recipe={dish}
            bestStars={best.get(dish.id) ?? 0}
            gradeLabel={dict.recipe.gradeNames[dishGradeFor(dish) - 1] ?? ''}
          />
        ))}
      </ol>

      <div className={styles.bossConnector} aria-hidden="true" />

      <div className={styles.bossPanel}>
        <div className={styles.steleStage}>
          <img className={styles.steleArt} src={steleArt} alt="" aria-hidden="true" />
          <div className={styles.steleFace}>
            <h3 className={styles.bossName}>
              {j.bossTitle}
              {bossRecipe ? `: ${bossRecipe.name}` : ''}
            </h3>
            <p className={styles.bossRule}>{j.bossRule(BOSS_PASS_STARS)}</p>
            {state.kind === 'passed' ? (
              <p className={styles.bossStateOk}>🏆 {j.bossPassed}</p>
            ) : state.kind === 'ready' ? (
              <>
                <p className={styles.bossStateReady}>✨ {j.bossReady}</p>
                <Link to={`/cooking/${chapter.bossRecipeId}?boss=${chapter.id}`}>
                  <GoldButton className={styles.steleBtn}>{j.bossEnter}</GoldButton>
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
          </div>
          <div className={styles.bossMedallionWrap}>
          <span
            className={`${styles.bossMedallion} ${
              state.kind === 'passed'
                ? styles.bossPassedRing
                : state.kind === 'ready'
                  ? styles.bossReadyRing
                  : styles.bossLockedRing
            }`}
          >
            {bossRecipe ? (
              <ImageWithFallback
                className={styles.bossArt}
                src={dishArtFor(bossRecipe)}
                alt={bossRecipe.name}
                fallbackTitle={bossRecipe.name}
              />
            ) : (
              <img className={styles.bossArt} src={BOSS_JUDGE_IMAGE} alt="" />
            )}
          </span>
          <span className={styles.bossCrown} aria-hidden="true">
            👑
          </span>
          {state.kind === 'passed' ? (
            <span className={styles.bossMedalBadge} aria-hidden="true">
              🏆
            </span>
          ) : null}
          {state.kind === 'locked' ? (
            <span className={styles.bossLockBadge} aria-hidden="true">
              🔒
            </span>
          ) : null}
        </div>
        </div>
        {state.kind === 'passed' ? (
          <div className={styles.steleFoot}>
            <p className={styles.sellableLabel}>{j.licenseSellableList}:</p>
            <div className={styles.sellableChips}>
              {progress.dishes.map((dish) => (
                <span key={dish.id} className={styles.sellableChip}>
                  {dish.name}
                </span>
              ))}
            </div>
            <Link
              className={styles.bossReplayLink}
              to={`/cooking/${chapter.bossRecipeId}?boss=${chapter.id}`}
            >
              {j.bossReplay}
            </Link>
          </div>
        ) : null}
        <img className={styles.judgeArt} src={BOSS_JUDGE_IMAGE} alt={j.judgeAlt} />
      </div>
    </WoodPanel>
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
    <SceneShell>
      <section className={styles.board}>
        <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

        <header className={styles.head}>
          <span className={styles.hangTag}>{dict.nav.map}</span>
          <div className={styles.titlePlaque}>
            <div className={styles.titleRow}>
              <span className={styles.titleIcon} aria-hidden="true">
                🗺️
              </span>
              <h1 className={styles.pageTitle}>{j.mapTitle}</h1>
            </div>
            <p className={styles.pageSub}>{j.mapSubtitle}</p>
          </div>
          <p className={styles.licenseSummary}>
            📜 {j.licenseTitle}: {licenseCount}/{CHAPTERS.length}
            {licenseCount === 0 ? ` — ${j.licenseNone}` : ''}
          </p>
        </header>

        <div className={styles.mapHero}>
          <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />
          <img className={styles.mapImage} src={SCENES['ban-do-hue']} alt={j.mapTitle} />
        </div>

        <div className={styles.chapters}>
          {progresses.map((progress) => (
            <ChapterSection key={progress.chapter.id} progress={progress} />
          ))}
        </div>
      </section>
    </SceneShell>
  );
}
