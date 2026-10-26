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
      <div className={styles.container}>
        <header className={styles.head}>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon} aria-hidden="true">🍲</span>
            <h1 className={styles.title}>Danh sách công thức món Huế</h1>
          </div>
          <p className={styles.subtitle}>
            {visibleRecipes.length} món ăn truyền thống Cố Đô sẵn sàng để bạn trổ tài nấu nướng
          </p>
        </header>

        <RecipeFilter value={filters} onChange={setFilters} />

        {isLoading ? (
          <Loading label="Đang chuẩn bị công thức ẩm thực..." />
        ) : (
          <RecipeGrid recipes={visibleRecipes} />
        )}
      </div>
    </PlayerShell>
  );
}
