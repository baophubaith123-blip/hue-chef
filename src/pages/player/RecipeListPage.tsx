import { useMemo, useState } from 'react';

import { Loading } from '@/components/Loading';
import { useRecipes } from '@/contexts/RecipeContext';
import {
  RecipeFilter,
  type RecipeFilterState,
} from '@/features/recipes/components/RecipeFilter';
import { RecipeGrid } from '@/features/recipes/components/RecipeGrid';
import { filterAndSortRecipes } from '@/features/recipes/lib/filter-recipes';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/RecipeListPage.module.css';

const DEFAULT_FILTERS: RecipeFilterState = {
  search: '',
  category: 'all',
  difficulty: 'all',
  sort: 'name-asc',
};

export default function RecipeListPage() {
  const { isLoading, getApprovedRecipes } = useRecipes();
  const [filters, setFilters] = useState<RecipeFilterState>(DEFAULT_FILTERS);

  const visibleRecipes = useMemo(() => {
    const approved = getApprovedRecipes();
    return filterAndSortRecipes(approved, filters);
  }, [filters, getApprovedRecipes]);

  return (
    <PlayerShell>
      <header className={styles.head}>
        <h1 className={styles.title}>Hue recipes</h1>
        <p className={styles.subtitle}>
          {visibleRecipes.length} dishes · filter, search without diacritics, then cook
        </p>
      </header>
      <RecipeFilter value={filters} onChange={setFilters} />
      {isLoading ? <Loading label="Loading recipes…" /> : <RecipeGrid recipes={visibleRecipes} />}
    </PlayerShell>
  );
}
