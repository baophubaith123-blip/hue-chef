import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
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
import { motion, useReducedMotion } from 'framer-motion';

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
  const reduceMotion = useReducedMotion();

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

        <header className={styles.head}>
          <span className={styles.hangTag}>{dict.nav.recipes}</span>
          <div className={styles.titlePlaque}>
            <h1 className={styles.pageTitle}>{dict.recipe.listTitle}</h1>
            <p className={styles.pageSub}>{dict.recipe.listSubtitle(visibleRecipes.length)}</p>
          </div>
        </header>

        <RecipeFilter value={filters} onChange={setFilters} />

        {isLoading ? (
          <Loading label={dict.recipe.listLoading} />
        ) : visibleRecipes.length === 0 ? (
          <EmptyState title={dict.scene.noResults} description={dict.scene.noResultsHint} />
        ) : (
          <ul className={styles.grid}>
            {visibleRecipes.map((recipe, idx) => (
              <motion.li
                key={recipe.id}
                className={styles.item}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx, 11) * 0.04 }}
              >
                <SceneDishCard recipe={recipe} lockedPrice={lockedPriceFor(recipe)} />
              </motion.li>
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
