import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { WoodSign } from '@/components/theme-d/WoodSign';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import { useRecipes } from '@/contexts/RecipeContext';
import type { Recipe } from '@/data/types';
import {
  RecipeFilter,
  type RecipeFilterState,
} from '@/features/recipes/components/RecipeFilter';
import { SceneDishCard } from '@/features/recipes/components/SceneDishCard';
import { filterAndSortRecipes } from '@/features/recipes/lib/filter-recipes';
import { countOwnedRecipes, isRecipeOwned } from '@/features/recipes/lib/ownership';
import { SceneShell } from '@/pages/player/SceneShell';

import styles from '@/pages/player/RecipeListPage.module.css';

const DEFAULT_FILTERS: RecipeFilterState = {
  search: '',
  category: 'all',
  difficulty: 'all',
  sort: 'difficulty-asc',
};

export default function RecipeListPage() {
  const { isLoading, getApprovedRecipes } = useRecipes();
  const { user } = useAuth();
  const { dict } = useTranslation();
  const [filters, setFilters] = useState<RecipeFilterState>(DEFAULT_FILTERS);

  const lockedPriceFor = (recipe: Recipe): number | undefined =>
    isRecipeOwned(user, recipe) ? undefined : recipe.priceCoins;

  const approvedRecipes = useMemo(() => getApprovedRecipes(), [getApprovedRecipes]);

  const visibleRecipes = useMemo(
    () => filterAndSortRecipes(approvedRecipes, filters),
    [approvedRecipes, filters],
  );

  const ownedCount = useMemo(
    () => countOwnedRecipes(user, approvedRecipes),
    [user, approvedRecipes],
  );

  return (
    <SceneShell active="recipes">
      <section className={styles.board}>
        <span className={`${styles.rivet} ${styles.rivetTl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetTr}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBl}`} aria-hidden="true" />
        <span className={`${styles.rivet} ${styles.rivetBr}`} aria-hidden="true" />

        <header className={styles.head}>
          <span className={styles.hangTag}>{dict.nav.recipes}</span>
          <WoodSign
            title={`🍲 ${dict.recipe.listTitle}`}
            subtitle={dict.recipe.listSubtitle(visibleRecipes.length)}
          />
        </header>

        <RecipeFilter value={filters} onChange={setFilters} />

        {isLoading ? (
          <Loading label={dict.recipe.listLoading} />
        ) : visibleRecipes.length === 0 ? (
          <EmptyState title={dict.scene.noResults} description={dict.scene.noResultsHint} />
        ) : (
          <ul className={styles.grid}>
            {visibleRecipes.map((recipe) => (
              <li key={recipe.id} className={styles.item}>
                <SceneDishCard recipe={recipe} lockedPrice={lockedPriceFor(recipe)} />
              </li>
            ))}
          </ul>
        )}

        <footer className={styles.statusBar}>
          <span className={styles.statusLeft}>
            {dict.recipe.listSubtitle(visibleRecipes.length)}
          </span>
          <span className={styles.statusRight}>
            {dict.scene.openedCount(ownedCount, approvedRecipes.length)}
          </span>
        </footer>
      </section>
    </SceneShell>
  );
}
