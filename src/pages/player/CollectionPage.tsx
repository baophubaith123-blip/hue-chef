import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/CollectionPage.module.css';

interface CollectionItem {
  recipeId: string;
  name: string;
  image: string;
  timesCooked: number;
  bestScore: number;
  stars: number;
}

export default function CollectionPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getApprovedRecipes } = useRecipes();
  const recipes = getApprovedRecipes();

  const items = useMemo<CollectionItem[]>(() => {
    if (!user) return [];
    const cookedIds = user.cookedRecipes ?? [];
    const counts = new Map<string, number>();
    for (const id of cookedIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const uniqueIds = Array.from(counts.keys());
    return uniqueIds
      .map((id) => {
        const recipe = recipes.find((r) => r.id === id);
        if (!recipe) return null;
        const timesCooked = counts.get(id) ?? 0;
        const bestScore = 0;
        const stars = Math.min(5, Math.max(0, Math.round(bestScore / 200)));
        return {
          recipeId: recipe.id,
          name: recipe.name,
          image: recipe.image,
          timesCooked,
          bestScore,
          stars,
        };
      })
      .filter((x): x is CollectionItem => x !== null);
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
                    <img src={item.image} alt={item.name} className={styles.image} />
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
                    </div>
                    <div className={styles.stars} aria-label={`${item.stars} ${t('collection.stars')}`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < item.stars ? styles.starFilled : styles.starEmpty}>
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
