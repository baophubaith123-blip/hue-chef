import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { Modal } from '@/components/Modal';
import { getIngredientById } from '@/data/ingredients';
import { difficultyName } from '@/features/recipes/lib/difficulty';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { formatDuration } from '@/lib/format';
import { PlayerShell } from '@/pages/player/PlayerShell';
import { useTranslation } from '@/i18n/useTranslation';
import { ImageWithFallback } from '@/components/ImageWithFallback';

import styles from '@/pages/player/RecipeDetailPage.module.css';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, getRecipeById } = useRecipes();
  const { user, purchaseRecipe } = useAuth();
  const { t, dict } = useTranslation();
  const [buyConfirmOpen, setBuyConfirmOpen] = useState(false);
  const [justBought, setJustBought] = useState(false);

  if (!id) {
    return <Navigate to="/recipes" replace />;
  }

  const recipe = getRecipeById(id);

  if (isLoading) {
    return (
      <PlayerShell>
        <Loading label={t('cooking.preparingKitchen')} />
      </PlayerShell>
    );
  }

  if (!recipe || (recipe.status ?? 'approved') !== 'approved') {
    return (
      <PlayerShell>
        <EmptyState
          title={t('cooking.cannotCook')}
          description={t('cooking.recipeMissing')}
        />
        <Link className={styles.back} to="/recipes">
          {t('cooking.backToRecipes')}
        </Link>
      </PlayerShell>
    );
  }

  const categoryLabel = dict.recipe.categoryLabels[recipe.category] ?? recipe.category;
  const owned = isRecipeOwned(user, recipe);
  const balance = user?.coins ?? 0;
  const canAfford = balance >= recipe.priceCoins;

  const handleConfirmBuy = () => {
    if (purchaseRecipe(recipe.id, recipe.priceCoins)) {
      setJustBought(true);
    }
    setBuyConfirmOpen(false);
  };

  return (
    <PlayerShell>
      <div className={styles.container}>
        <Link className={styles.backLink} to="/recipes">
          ← {t('cooking.backToRecipes')}
        </Link>

        <article className={styles.recipeCard}>
          <div className={styles.mediaColumn}>
            <div className={styles.imageWrap}>
              <ImageWithFallback
                className={styles.image}
                src={recipe.image}
                alt={recipe.name}
                fallbackTitle={recipe.name}
              />
              <span className={styles.categoryBadge}>{categoryLabel}</span>
            </div>

            <div className={styles.metricsBox}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>{t('recipe.difficulty')}</span>
                <span className={styles.metricStars}>
                  {'★'.repeat(recipe.difficulty)}
                  {'☆'.repeat(5 - recipe.difficulty)}
                </span>
                <span className={styles.metricTier}>
                  {difficultyName(dict.recipe.difficultyNames, recipe.difficulty)}
                </span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>{t('dashboard.time')}</span>
                <span className={styles.metricValue}>⏱ {formatDuration(recipe.duration)}</span>
              </div>
              <div className={styles.metricDivider} />
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>{t('recipe.baseScore')}</span>
                <span className={styles.metricValue}>⭐ {recipe.baseScore}</span>
              </div>
            </div>

            <div className={styles.ctaBox}>
              {owned ? (
                <>
                  <Link to={`/cooking/${recipe.id}`} className={styles.cookNowLink}>
                    <Button variant="primary" className={styles.cookNowBtn}>
                      🔥 {dict.dashboard.heroPlayNow}
                    </Button>
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
                  <div className={styles.buyPriceRow}>
                    <span className={styles.buyLockIcon} aria-hidden="true">
                      🔒
                    </span>
                    <span className={styles.buyPrice}>
                      {recipe.priceCoins.toLocaleString()} xu
                    </span>
                  </div>
                  <p className={styles.buyBalance}>
                    {dict.shop.yourBalance(balance.toLocaleString())}
                  </p>
                  <Button
                    variant="primary"
                    className={styles.cookNowBtn}
                    disabled={!canAfford}
                    onClick={() => setBuyConfirmOpen(true)}
                  >
                    🪙 {dict.shop.buyButton}
                  </Button>
                  {!canAfford ? (
                    <p className={styles.buyHint}>
                      {dict.shop.needMore((recipe.priceCoins - balance).toLocaleString())}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className={styles.infoColumn}>
            <header className={styles.header}>
              <h1 className={styles.title}>{recipe.name}</h1>
              <p className={styles.description}>{recipe.description}</p>
            </header>

            {/* Nguyên liệu cần dùng */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span>🧺</span> {t('cooking.ingredients')} ({recipe.ingredients.length})
              </h2>
              <div className={styles.ingredientsGrid}>
                {recipe.ingredients.map((item) => {
                  const ingredient = getIngredientById(item.ingredientId);
                  return (
                    <div key={item.ingredientId} className={styles.ingredientPill}>
                      <span className={styles.ingredientEmoji}>
                        {ingredient?.fallbackEmoji || '🍲'}
                      </span>
                      <div className={styles.ingredientMeta}>
                        <span className={styles.ingredientName}>
                          {ingredient?.name ?? item.ingredientId}
                        </span>
                        <span className={styles.ingredientAmount}>{item.amount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Các bước nấu */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span>📋</span> {t('cooking.steps')} ({(recipe.steps ?? []).length})
              </h2>
              <ol className={styles.stepsList}>
                {(recipe.steps ?? []).map((step, idx) => (
                  <li key={step.id} className={styles.stepItem}>
                    <span className={styles.stepNum}>{idx + 1}</span>
                    <div className={styles.stepContent}>
                      <strong className={styles.stepTitle}>{step.title}</strong>
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
          </div>
        </article>
      </div>

      <Modal
        isOpen={buyConfirmOpen}
        title={dict.shop.confirmTitle}
        onClose={() => setBuyConfirmOpen(false)}
        footer={
          <div className={styles.buyModalFooter}>
            <Button variant="secondary" onClick={() => setBuyConfirmOpen(false)}>
              {dict.shop.cancel}
            </Button>
            <Button variant="primary" onClick={handleConfirmBuy}>
              🪙 {dict.shop.confirmBuy}
            </Button>
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
    </PlayerShell>
  );
}
