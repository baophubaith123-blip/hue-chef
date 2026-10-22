import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ImageWithFallback } from '@/components/ImageWithFallback';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import type { CookedRecipeEntry } from '@/features/auth/types';
import { useTranslation } from '@/i18n/useTranslation';
import { formatDuration } from '@/lib/format';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/CollectionPage.module.css';

interface CollectionItem {
  recipeId: string;
  name: string;
  image: string;
  timesCooked: number;
  bestScore: number;
  bestStars: 1 | 2 | 3 | 4 | 5;
  lastCookedAt: string;
  bestTimeUsed: number;
}

export default function CollectionPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const recipes = getApprovedRecipes();

  const items = useMemo<CollectionItem[]>(() => {
    if (!user) return [];
    const entries: CookedRecipeEntry[] = Array.isArray(user.cookedRecipes) ? user.cookedRecipes : [];

    const grouped = new Map<string, CookedRecipeEntry[]>();
    for (const entry of entries) {
      if (!entry || !entry.recipeId) continue;
      const list = grouped.get(entry.recipeId) ?? [];
      list.push(entry);
      grouped.set(entry.recipeId, list);
    }

    const recipeImageByName = new Map<string, string>();
    for (const r of recipes) recipeImageByName.set(r.id, r.image);

    const result: CollectionItem[] = [];
    for (const [recipeId, list] of grouped.entries()) {
      const first = list[0];
      if (!first) continue;
      let bestScore = 0;
      let bestStars: 1 | 2 | 3 | 4 | 5 = 1;
      let bestTimeUsed = 0;
      let lastCookedAt = first.cookedAt;
      for (const entry of list) {
        if ((entry.score ?? 0) > bestScore) {
          bestScore = entry.score ?? 0;
          bestStars = entry.stars ?? 1;
          bestTimeUsed = entry.timeUsed ?? 0;
        }
        if (entry.cookedAt && entry.cookedAt > lastCookedAt) {
          lastCookedAt = entry.cookedAt;
        }
      }
      const recipe = recipes.find((r) => r.id === recipeId || r.name === first.recipeName);
      const name = recipe?.name ?? first.recipeName ?? recipeId;
      const image = recipe?.image || first.image || recipeImageByName.get(recipeId) || '';
      result.push({
        recipeId,
        name,
        image,
        timesCooked: list.length,
        bestScore,
        bestStars,
        bestTimeUsed,
        lastCookedAt,
      });
    }
    result.sort((a, b) => (a.lastCookedAt < b.lastCookedAt ? 1 : -1));
    return result;
  }, [user, recipes]);

  return (
    <PlayerShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('collection.title')}</h1>
          <p className={styles.intro}>{t('collection.intro')}</p>
        </div>
      </header>
      <Card>
        {items.length === 0 ? (
          <EmptyState title={t('collection.empty')} />
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <Link
                key={item.recipeId}
                to={`/recipes/${item.recipeId}`}
                className={styles.cardLink}
              >
                <article className={styles.card}>
                  <div className={styles.imageWrap}>
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      fallbackTitle={item.name}
                      className={styles.image}
                    />
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>{t('collection.timesCooked')}</span>
                        <span className={styles.statValue}>{item.timesCooked}</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>{t('collection.bestScore')}</span>
                        <span className={styles.statValue}>{item.bestScore}</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>{t('collection.timeUsed')}</span>
                        <span className={styles.statValue}>{formatDuration(item.bestTimeUsed)}</span>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>{t('collection.lastCooked')}</span>
                        <span className={styles.statValue}>
                          {new Date(item.lastCookedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className={styles.stars}
                      aria-label={`${item.bestStars} ${t('collection.stars')}`}
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < item.bestStars ? styles.starFilled : styles.starEmpty}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className={styles.cardAction}>
                      <Button variant="secondary" fullWidth>
                        {t('common.view')}
                      </Button>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </PlayerShell>
  );
}
