import { Link, Navigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { getIngredientById } from '@/data/ingredients';
import { useRecipes } from '@/contexts/RecipeContext';
import { formatDuration } from '@/lib/format';
import { PlayerShell } from '@/pages/player/PlayerShell';
import { useTranslation } from '@/i18n/useTranslation';
import { ImageWithFallback } from '@/components/ImageWithFallback';

import styles from '@/pages/player/RecipeDetailPage.module.css';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoading, getRecipeById } = useRecipes();
  const { t, dict } = useTranslation();

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
              <Link to={`/cooking/${recipe.id}`} className={styles.cookNowLink}>
                <Button variant="primary" className={styles.cookNowBtn}>
                  🔥 {dict.dashboard.heroPlayNow}
                </Button>
              </Link>
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
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </article>
      </div>
    </PlayerShell>
  );
}
