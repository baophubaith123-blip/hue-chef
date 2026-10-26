import type { RecipeCategory } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/recipes/components/RecipeFilter.module.css';

export type RecipeSort = 'name-asc' | 'difficulty-desc' | 'duration-asc' | 'score-desc';

export interface RecipeFilterState {
  search: string;
  category: RecipeCategory | 'all';
  difficulty: 'all' | '1' | '2' | '3' | '4' | '5';
  sort: RecipeSort;
}

interface RecipeFilterProps {
  value: RecipeFilterState;
  onChange: (next: RecipeFilterState) => void;
}

const CATEGORY_KEYS: Array<{ value: RecipeCategory | 'all'; key: string; defaultLabel: string }> = [
  { value: 'all', key: 'recipe.allCategories', defaultLabel: 'Tất cả' },
  { value: 'bun', key: 'recipe.categoryLabels.bun', defaultLabel: 'Bún' },
  { value: 'com', key: 'recipe.categoryLabels.com', defaultLabel: 'Cơm' },
  { value: 'banh', key: 'recipe.categoryLabels.banh', defaultLabel: 'Bánh' },
  { value: 'che', key: 'recipe.categoryLabels.che', defaultLabel: 'Chè' },
  { value: 'nem', key: 'recipe.categoryLabels.nem', defaultLabel: 'Nem' },
];

export function RecipeFilter({ value, onChange }: RecipeFilterProps) {
  const { t } = useTranslation();

  const update = (patch: Partial<RecipeFilterState>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className={styles.filterContainer}>
      {/* Category Pills (Image 1 Style) */}
      <div className={styles.categoryPills} role="tablist" aria-label="Bộ lọc danh mục">
        {CATEGORY_KEYS.map((item) => {
          const isActive = value.category === item.value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ''}`}
              onClick={() => update({ category: item.value })}
            >
              {t(item.key) || item.defaultLabel}
            </button>
          );
        })}
      </div>

      {/* Search Input Bar (Image 1 Right aligned) */}
      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon} aria-hidden="true">🔍</span>
        <input
          className={styles.searchInput}
          type="search"
          placeholder={t('recipe.searchPlaceholder') || 'Tìm kiếm món ăn...'}
          aria-label={t('recipe.searchPlaceholder') || 'Tìm kiếm món ăn...'}
          value={value.search}
          onChange={(event) => update({ search: event.target.value })}
        />
      </div>
    </div>
  );
}
