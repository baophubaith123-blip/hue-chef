import { useMemo, useState } from 'react';

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
import { RecipeGrid } from '@/features/recipes/components/RecipeGrid';
import { filterAndSortRecipes } from '@/features/recipes/lib/filter-recipes';
import { isRecipeOwned } from '@/features/recipes/lib/ownership';
import { PlayerShell } from '@/pages/player/PlayerShell';

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

  const visibleRecipes = useMemo(() => {
    const approved = getApprovedRecipes();
    return filterAndSortRecipes(approved, filters);
  }, [filters, getApprovedRecipes]);

  return (
    <PlayerShell>
      <div className={styles.container}>
        <header className={styles.head}>
          <WoodSign
            title={`🍲 ${dict.recipe.listTitle}`}
            subtitle={dict.recipe.listSubtitle(visibleRecipes.length)}
          />
        </header>

        <RecipeFilter value={filters} onChange={setFilters} />

        {isLoading ? (
          <Loading label={dict.recipe.listLoading} />
        ) : (
          <div className={`${styles.gridScroll} scroll-slim`}>
            <RecipeGrid recipes={visibleRecipes} lockedPriceFor={lockedPriceFor} />
          </div>
        )}
      </div>
    </PlayerShell>
  );
}
