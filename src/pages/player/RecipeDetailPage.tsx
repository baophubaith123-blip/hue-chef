import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { Modal } from '@/components/Modal';
import { CoinPill } from '@/components/theme-d/CoinPill';
import { DishGradeFrame } from '@/components/theme-d/DishGradeFrame';
import { GoldButton } from '@/components/theme-d/GoldButton';
import { NoiNoi } from '@/components/theme-d/NoiNoi';
import { WoodButton } from '@/components/theme-d/WoodButton';
import { dishArtFor } from '@/components/theme-d/dish-art';
import { getIngredientById } from '@/data/ingredients';
import { difficultyName } from '@/features/recipes/lib/difficulty';
import { dishGradeFor } from '@/features/recipes/lib/grade';
import { GESTURE_ICONS, gestureForStep } from '@/data/gesture-map';
import { RecipeComments } from '@/features/comments/components/RecipeComments';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { bossChapterForRecipe, chapterForRecipe } from '@/features/journey/lib/chapters';
import { isDishSellable } from '@/features/journey/lib/journey';
import { useAuth } from '@/contexts/AuthContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { formatDuration } from '@/lib/format';
import { SceneShell } from '@/pages/player/SceneShell';
import { useTranslation } from '@/i18n/useTranslation';
import { ImageWithFallback } from '@/components/ImageWithFallback';

import styles from '@/pages/player/RecipeDetailPage.module.css';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, getRecipeById } = useRecipes();
  const { user, purchaseRecipe } = useAuth();
  const { t, dict } = useTranslation();
  const { recipeCategoryLabel } = useTaxonomy();
  const [buyConfirmOpen, setBuyConfirmOpen] = useState(false);
  const [justBought, setJustBought] = useState(false);
  const reduceMotion = useReducedMotion();

  if (!id) {
    return <Navigate to="/recipes" replace />;
  }

  const recipe = getRecipeById(id);

  if (isLoading) {
    return (
      <SceneShell>
        <div className={styles.statePanel}>
          <Loading label={t('cooking.preparingKitchen')} />
        </div>
      </SceneShell>
    );
  }

  if (!recipe || (recipe.status ?? 'approved') !== 'approved') {
    return (
      <SceneShell>
        <div className={styles.statePanel}>
          <EmptyState
            title={t('cooking.cannotCook')}
            description={t('cooking.recipeMissing')}
          />
          <Link className={styles.back} to="/recipes">
            {t('cooking.backToRecipes')}
          </Link>
        </div>
      </SceneShell>
    );
  }

  const categoryLabel = recipeCategoryLabel(recipe.category);
  const grade = dishGradeFor(recipe);
  const gradeLabel = dict.recipe.gradeNames[grade - 1] ?? '';
  const bestStars = (user?.cookedRecipes ?? [])
    .filter((entry) => entry.recipeId === recipe.id)
    .reduce((max, entry) => Math.max(max, entry.stars), 0);
  const owned = isRecipeOwned(user, recipe);
  const balance = user?.coins ?? 0;
  const canAfford = balance >= recipe.priceCoins;
  // Gói H3 — journey placement of this dish: its chapter, whether the
  // player may sell it at the stall, and whether it is a boss dish.
  const journeyChapter = chapterForRecipe(recipe);
  const journeyChapterName = journeyChapter
    ? dict.journey.chapters[journeyChapter.id]?.name ?? journeyChapter.id
    : '';
  const sellable = isDishSellable(user, recipe);
  const bossChapter = bossChapterForRecipe(recipe.id);

  const handleConfirmBuy = () => {
    if (purchaseRecipe(recipe.id, recipe.priceCoins)) {
      setJustBought(true);
    }
    setBuyConfirmOpen(false);
  };

  return (
    <SceneShell>
      <div className={styles.container}>
        <Link className={styles.backLink} to="/recipes">
          ← {t('cooking.backToRecipes')}
        </Link>

        <motion.article
          className={styles.board}
          initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        >
          <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
          <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

          <header className={styles.header}>
            <h1 className={styles.title}>{recipe.name}</h1>
            <div className={styles.gradeRow}>
              <span className={styles.gradeChip}>{gradeLabel}</span>
              {bestStars > 0 ? <span className={styles.yourStars}>{dict.recipe.yourStars(bestStars)}</span> : null}
            </div>
            <p className={styles.description}>{recipe.description}</p>

            <div className={styles.chipsRow}>
              <div className={styles.chip}>
                <span className={styles.chipValue}>⏱ {formatDuration(recipe.duration)}</span>
                <span className={styles.chipLabel}>{t('dashboard.time')}</span>
              </div>
              <div className={styles.chip}>
                <span className={styles.metricStars}>
                  {'★'.repeat(recipe.difficulty)}
                  {'☆'.repeat(5 - recipe.difficulty)}
                </span>
                <span className={styles.chipLabel}>
                  {t('recipe.difficulty')} · {difficultyName(dict.recipe.difficultyNames, recipe.difficulty)}
                </span>
              </div>
              <div className={styles.chip}>
                <span className={styles.chipValue}>📋 {(recipe.steps ?? []).length}</span>
                <span className={styles.chipLabel}>{t('cooking.steps')}</span>
              </div>
              <div className={styles.chip}>
                <span className={styles.chipValue}>⭐ {recipe.baseScore}</span>
                <span className={styles.chipLabel}>{t('recipe.baseScore')}</span>
              </div>
            </div>
          </header>

          <div className={styles.boardGrid}>
            <div className={styles.mediaColumn}>
              <DishGradeFrame grade={grade} gradeLabel={gradeLabel}>
                <div className={styles.imageWrap}>
                  <ImageWithFallback
                    className={styles.image}
                    src={dishArtFor(recipe)}
                    alt={recipe.name}
                    fallbackTitle={recipe.name}
                  />
                  <span className={styles.categoryBadge}>{categoryLabel}</span>
                </div>
              </DishGradeFrame>

              <div className={styles.ctaBox}>
                {owned ? (
                  <>
                    <Link to={`/cooking/${recipe.id}`} className={styles.cookNowLink}>
                      <GoldButton className={styles.cookNowBtn}>
                        🔥 {dict.dashboard.heroPlayNow}
                      </GoldButton>
                    </Link>
                    {recipe.priceCoins > 0 ? (
                      <p className={styles.ownedNote}>
                        {justBought ? dict.shop.justBought : dict.shop.ownedNote}
                      </p>
                    ) : (
                      <p className={styles.ownedNote}>{dict.shop.freeNote}</p>
                    )}
                  </>
                ) : (
                  <div className={styles.buyPanel}>
                    <div className={styles.pricePlaque}>
                      <span className={styles.buyLockIcon} aria-hidden="true">
                        🔒
                      </span>
                      <CoinPill amount={recipe.priceCoins} currency="xu" />
                    </div>
                    <p className={styles.buyBalance}>
                      {dict.shop.yourBalance(balance.toLocaleString())}
                    </p>
                    <GoldButton
                      className={styles.cookNowBtn}
                      disabled={!canAfford}
                      onClick={() => setBuyConfirmOpen(true)}
                    >
                      🪙 {dict.shop.buyButton}
                    </GoldButton>
                    {!canAfford ? (
                      <p className={styles.buyHint}>
                        {dict.shop.needMore((recipe.priceCoins - balance).toLocaleString())}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {/* Nguyên liệu cần dùng */}
            <section className={`${styles.panel} ${styles.ingredientsPanel}`}>
              <h2 className={styles.sectionTitle}>
                <span>🧺</span> {t('cooking.ingredients')} ({recipe.ingredients.length})
              </h2>
              <ul className={styles.ingredientsList}>
                {recipe.ingredients.map((item) => {
                  const ingredient = getIngredientById(item.ingredientId);
                  return (
                    <li key={item.ingredientId} className={styles.ingredientRow}>
                      <span className={styles.ingredientIcon}>
                        {ingredient?.fallbackEmoji || '🍲'}
                      </span>
                      <span className={styles.ingredientName}>
                        {ingredient?.name ?? item.ingredientId}
                      </span>
                      <span className={styles.ingredientAmount}>{item.amount}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <div className={styles.rightColumn}>
              {/* Gói H3 — journey chapter, sell license status, boss entry */}
              {journeyChapter ? (
                <section className={styles.journeyBox}>
                  <div className={styles.journeyRow}>
                    <span className={styles.journeyLabel}>
                      🗺️ {dict.journey.detailChapterLabel}:{' '}
                      <strong>
                        {dict.journey.chapterLabel(journeyChapter.order)} · {journeyChapterName}
                      </strong>
                    </span>
                    <Link className={styles.journeyMapLink} to="/map">
                      {dict.journey.detailViewMap}
                    </Link>
                  </div>
                  <p className={sellable ? styles.journeySellable : styles.journeyNotSellable}>
                    {sellable
                      ? `📜 ${dict.journey.detailSellable}`
                      : `🔒 ${dict.journey.detailNotSellable(journeyChapterName)}`}
                  </p>
                  {bossChapter ? (
                    <div className={styles.journeyBossRow}>
                      <span className={styles.journeyBossNote}>
                        👑 {dict.journey.detailBossDish}
                      </span>
                      {owned ? (
                        <Link to={`/cooking/${recipe.id}?boss=${bossChapter.id}`} className={styles.bossLink}>
                          <GoldButton>{dict.journey.bossEnter}</GoldButton>
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {/* Các bước nấu */}
              <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>
                  <span>📋</span> {t('cooking.steps')} ({(recipe.steps ?? []).length})
                </h2>
                <ol className={styles.stepsList}>
                  {(recipe.steps ?? []).map((step, idx) => (
                    <li key={step.id} className={styles.stepItem}>
                      <span className={styles.stepNum}>{idx + 1}</span>
                      <div className={styles.stepContent}>
                        <strong className={styles.stepTitle}>{step.title}</strong>
                        <span className={styles.stepGesture}>
                          <span aria-hidden>{GESTURE_ICONS[gestureForStep(step)]}</span>
                          {dict.cooking.gestures.names[gestureForStep(step)]}
                        </span>
                        <p className={styles.stepDesc}>{step.description}</p>
                        {step.requiredIngredients.length > 0 ? (
                          <div className={styles.stepIngredients}>
                            {step.requiredIngredients.map((ingId) => {
                              const ing = getIngredientById(ingId);
                              return (
                                <span key={ingId} className={styles.stepIngredientChip}>
                                  {ing?.fallbackEmoji ? `${ing.fallbackEmoji} ` : ''}
                                  {ing?.name ?? ingId}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <NoiNoi pose="gioi-thieu" size={104} alt="" className={styles.noiNoi} />
            </div>
          </div>
        </motion.article>

        <motion.section
          className={styles.commentsPanel}
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: reduceMotion ? 0 : 0.12 }}
        >
          <RecipeComments recipeId={recipe.id} />
        </motion.section>
      </div>

      <Modal
        isOpen={buyConfirmOpen}
        title={dict.shop.confirmTitle}
        onClose={() => setBuyConfirmOpen(false)}
        footer={
          <div className={styles.buyModalFooter}>
            <WoodButton onClick={() => setBuyConfirmOpen(false)}>
              {dict.shop.cancel}
            </WoodButton>
            <GoldButton onClick={handleConfirmBuy}>
              🪙 {dict.shop.confirmBuy}
            </GoldButton>
          </div>
        }
      >
        <p className={styles.buyModalBody}>
          {dict.shop.confirmBody(
            recipe.name,
            recipe.priceCoins.toLocaleString(),
            (balance - recipe.priceCoins).toLocaleString(),
          )}
        </p>
      </Modal>
    </SceneShell>
  );
}
