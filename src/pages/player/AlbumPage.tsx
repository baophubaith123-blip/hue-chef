import { useMemo, useState } from 'react';

import { ImageWithFallback } from '@/components/ImageWithFallback';
import { Badge } from '@/components/theme-d/Badge';
import { DishGradeFrame } from '@/components/theme-d/DishGradeFrame';
import { Modal } from '@/components/theme-d/Modal';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { WoodPanel } from '@/components/theme-d/WoodPanel';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { gameIcon } from '@/components/theme-d/game-assets';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { getCultureCard } from '@/data/culture-cards';
import type { Recipe } from '@/data/types';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { CHAPTERS, dishesOfChapter } from '@/features/journey/lib/chapters';
import {
  ALBUM_UNLOCK_STARS,
  bestScoreByRecipe,
  bestStarsByRecipe,
} from '@/features/journey/lib/journey';
import { useTranslation } from '@/i18n/useTranslation';
import { SceneShell } from '@/pages/player/SceneShell';

import styles from '@/pages/player/AlbumPage.module.css';

export default function AlbumPage() {
  const { dict, locale } = useTranslation();
  const { user } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const j = dict.journey;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const recipes = getApprovedRecipes();
  const bestStars = useMemo(() => bestStarsByRecipe(user), [user]);
  const bestScores = useMemo(() => bestScoreByRecipe(user), [user]);

  const sections = useMemo(
    () =>
      CHAPTERS.map((chapter) => {
        const dishes = dishesOfChapter(recipes, chapter);
        const unlocked = dishes.filter(
          (dish) => (bestStars.get(dish.id) ?? 0) >= ALBUM_UNLOCK_STARS,
        ).length;
        return { chapter, dishes, unlocked, complete: dishes.length > 0 && unlocked === dishes.length };
      }),
    [recipes, bestStars],
  );
  const totalDishes = sections.reduce((sum, section) => sum + section.dishes.length, 0);
  const totalUnlocked = sections.reduce((sum, section) => sum + section.unlocked, 0);

  const selected: Recipe | undefined = selectedId
    ? recipes.find((recipe) => recipe.id === selectedId)
    : undefined;
  const selectedCard = selected ? getCultureCard(selected.id) : undefined;
  const selectedText = selectedCard ? selectedCard[locale] : undefined;
  const selectedChapter = selected
    ? CHAPTERS.find(
        (chapter) =>
          selected.difficulty >= chapter.minDifficulty && selected.difficulty <= chapter.maxDifficulty,
      )
    : undefined;

  return (
    <SceneShell>
      <section className={styles.board}>
        <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

        <header className={styles.head}>
          <span className={styles.hangTag}>{dict.nav.album}</span>
          <div className={styles.titlePlaque}>
            <h1 className={styles.pageTitle}>{j.albumTitle}</h1>
            <p className={styles.pageSub}>{j.albumSubtitle}</p>
            <p className={styles.progressPlaque}>
              {gameIcon('album') ? (
                <img src={gameIcon('album')} alt="" className={styles.progressIcon} />
              ) : (
                <span aria-hidden="true">🃏</span>
              )}
              <span>{j.albumProgress(totalUnlocked, totalDishes)}</span>
            </p>
          </div>
        </header>

        {sections.map(({ chapter, dishes, unlocked, complete }) => (
          <WoodPanel
            key={chapter.id}
            title={j.chapters[chapter.id]?.name}
            titleLevel="h2"
            className={styles.albumPanel}
            bodyClassName={styles.albumBody}
          >
            <div className={styles.sectionMeta}>
              <Badge tone="brick">{j.chapterLabel(chapter.order)}</Badge>
              <div className={styles.sectionBadges}>
                <Badge tone="paper">{j.albumSetProgress(unlocked, dishes.length)}</Badge>
                {complete ? <Badge tone="gold">🏆 {j.albumSetComplete}</Badge> : null}
              </div>
            </div>

            <div className={styles.grid}>
              {dishes.map((dish) => {
                const stars = bestStars.get(dish.id) ?? 0;
                const unlockedCard = stars >= ALBUM_UNLOCK_STARS;
                const gradeLabel = dict.recipe.gradeNames[dishGradeFor(dish) - 1] ?? '';
                return (
                  <DishGradeFrame
                    key={dish.id}
                    grade={dishGradeFor(dish)}
                    gradeLabel={gradeLabel}
                    className={styles.frameWrap}
                  >
                    <article className={styles.card}>
                      <div className={styles.imageWrap}>
                        <ImageWithFallback
                          className={unlockedCard ? styles.image : styles.imageLocked}
                          src={dishArtFor(dish)}
                          alt={dish.name}
                          fallbackTitle={dish.name}
                        />
                        {unlockedCard ? null : (
                          <span className={styles.lockMedallion} aria-hidden="true">
                            {gameIcon('lock') ? (
                              <img src={gameIcon('lock')} alt="" className={styles.lockIcon} />
                            ) : (
                              <span>🔒</span>
                            )}
                          </span>
                        )}
                      </div>

                      <div className={styles.body}>
                        <h3 className={styles.dishName}>{dish.name}</h3>
                        {unlockedCard ? (
                          <>
                            <span className={styles.dishStars}>
                              {'★'.repeat(stars)}
                              {'☆'.repeat(5 - stars)}
                            </span>
                            <WoodButton
                              className={styles.viewButton}
                              onClick={() => setSelectedId(dish.id)}
                            >
                              {j.albumViewCard}
                            </WoodButton>
                          </>
                        ) : (
                          <span className={styles.lockedHint}>
                            {j.albumLockedHint(ALBUM_UNLOCK_STARS)}
                            {stars > 0
                              ? ` · ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`
                              : ''}
                          </span>
                        )}
                      </div>
                    </article>
                  </DishGradeFrame>
                );
              })}
            </div>
          </WoodPanel>
        ))}
      </section>

      <Modal
        open={Boolean(selected && selectedText)}
        title={selected?.name ?? ''}
        onClose={() => setSelectedId(null)}
        closeLabel={dict.common.close}
      >
        {selected && selectedText ? (
          <div className={styles.modalBody}>
            <ImageWithFallback
              className={styles.modalImage}
              src={dishArtFor(selected)}
              alt={selected.name}
              fallbackTitle={selected.name}
            />
            <div className={styles.modalMeta}>
              {selectedChapter ? (
                <Badge tone="brick">
                  {j.chapterLabel(selectedChapter.order)} · {j.chapters[selectedChapter.id]?.name}
                </Badge>
              ) : null}
              <span className={styles.modalBest}>
                {j.albumYourBest(bestScores.get(selected.id) ?? 0, bestStars.get(selected.id) ?? 0)}
              </span>
            </div>
            <h3 className={styles.modalSectionTitle}>{j.albumOrigin}</h3>
            <p className={styles.modalText}>{selectedText.origin}</p>
            <h3 className={styles.modalSectionTitle}>{j.albumStory}</h3>
            <p className={styles.modalText}>{selectedText.story}</p>
          </div>
        ) : null}
      </Modal>
    </SceneShell>
  );
}
