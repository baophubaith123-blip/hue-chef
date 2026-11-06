import { useState } from 'react';

import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/recipes/components/RecipeFilter.module.css';

export type RecipeSort =
  | 'name-asc'
  | 'difficulty-asc'
  | 'difficulty-desc'
  | 'duration-asc'
  | 'score-desc';

export interface RecipeFilterState {
  search: string;
  category: string;
  difficulty: 'all' | '1' | '2' | '3' | '4' | '5';
  sort: RecipeSort;
}

interface RecipeFilterProps {
  value: RecipeFilterState;
  onChange: (next: RecipeFilterState) => void;
}

type OpenPanel = 'category' | 'difficulty' | null;

/**
 * Search + two click-to-open filter dropdowns (category, difficulty).
 * The filter choices stay hidden behind their buttons — nothing is spread
 * out as a row of pills.
 */
export function RecipeFilter({ value, onChange }: RecipeFilterProps) {
  const { t, dict } = useTranslation();
  const { recipeCategoryOptions, recipeCategoryLabel } = useTaxonomy();
  const [open, setOpen] = useState<OpenPanel>(null);

  const update = (patch: Partial<RecipeFilterState>) => {
    onChange({ ...value, ...patch });
  };

  const categoryValueLabel =
    value.category === 'all' ? t('recipeFilter.all') : recipeCategoryLabel(value.category);
  const difficultyValueLabel =
    value.difficulty === 'all'
      ? t('recipeFilter.all')
      : `${'★'.repeat(Number(value.difficulty))} ${dict.recipe.difficultyNames[Number(value.difficulty) - 1] ?? ''}`;
  const hasActiveFilters = value.category !== 'all' || value.difficulty !== 'all' || value.search !== '';

  const toggle = (panel: OpenPanel) => {
    setOpen((current) => (current === panel ? null : panel));
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filtersRow}>
        <div className={styles.dropdownWrap}>
          <button
            type="button"
            className={`${styles.dropdownBtn} ${value.category !== 'all' ? styles.dropdownBtnActive : ''}`}
            aria-expanded={open === 'category'}
            onClick={() => toggle('category')}
          >
            🏷️ {t('recipeFilter.categoryButton')}: <strong>{categoryValueLabel}</strong>
            <span aria-hidden="true">▾</span>
          </button>
          {open === 'category' ? (
            <div className={styles.dropdownPanel} role="listbox" aria-label={t('recipeFilter.categoryButton')}>
              <button
                type="button"
                className={`${styles.dropdownOption} ${value.category === 'all' ? styles.dropdownOptionActive : ''}`}
                onClick={() => {
                  update({ category: 'all' });
                  setOpen(null);
                }}
              >
                {t('recipeFilter.all')}
              </button>
              {recipeCategoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.dropdownOption} ${value.category === option.id ? styles.dropdownOptionActive : ''}`}
                  onClick={() => {
                    update({ category: option.id });
                    setOpen(null);
                  }}
                >
                  {recipeCategoryLabel(option.id)}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.dropdownWrap}>
          <button
            type="button"
            className={`${styles.dropdownBtn} ${value.difficulty !== 'all' ? styles.dropdownBtnActive : ''}`}
            aria-expanded={open === 'difficulty'}
            onClick={() => toggle('difficulty')}
          >
            ⭐ {t('recipeFilter.difficultyButton')}: <strong>{difficultyValueLabel}</strong>
            <span aria-hidden="true">▾</span>
          </button>
          {open === 'difficulty' ? (
            <div className={styles.dropdownPanel} role="listbox" aria-label={t('recipeFilter.difficultyButton')}>
              <button
                type="button"
                className={`${styles.dropdownOption} ${value.difficulty === 'all' ? styles.dropdownOptionActive : ''}`}
                onClick={() => {
                  update({ difficulty: 'all' });
                  setOpen(null);
                }}
              >
                {t('recipeFilter.all')}
              </button>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.dropdownOption} ${value.difficulty === String(level) ? styles.dropdownOptionActive : ''}`}
                  onClick={() => {
                    update({ difficulty: String(level) as RecipeFilterState['difficulty'] });
                    setOpen(null);
                  }}
                >
                  {'★'.repeat(level)} {dict.recipe.difficultyNames[level - 1] ?? ''}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => {
              update({ category: 'all', difficulty: 'all', search: '' });
              setOpen(null);
            }}
          >
            ✕ {t('recipeFilter.clear')}
          </button>
        ) : null}
      </div>

      <div className={styles.searchWrapper}>
        <span className={styles.searchIcon} aria-hidden="true">🔍</span>
        <input
          className={styles.searchInput}
          type="search"
          placeholder={t('recipe.searchPlaceholder')}
          aria-label={t('recipe.searchPlaceholder')}
          value={value.search}
          onChange={(event) => update({ search: event.target.value })}
        />
      </div>

      {open ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-hidden="true"
          tabIndex={-1}
          onClick={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}
