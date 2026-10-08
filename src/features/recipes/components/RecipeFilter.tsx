import type { RecipeCategory } from '@/data/types';

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

const CATEGORIES: Array<{ value: RecipeCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'bun', label: 'Bún' },
  { value: 'com', label: 'Cơm' },
  { value: 'banh', label: 'Bánh' },
  { value: 'che', label: 'Chè' },
  { value: 'nem', label: 'Nem' },
];

export function RecipeFilter({ value, onChange }: RecipeFilterProps) {
  const update = (patch: Partial<RecipeFilterState>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className={styles.bar}>
      <label className={styles.field}>
        <span className={styles.label}>Search</span>
        <input
          className={styles.input}
          type="search"
          placeholder="Search without diacritics…"
          value={value.search}
          onChange={(event) => update({ search: event.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Category</span>
        <select
          className={styles.select}
          value={value.category}
          onChange={(event) =>
            update({ category: event.target.value as RecipeFilterState['category'] })
          }
        >
          {CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Difficulty</span>
        <select
          className={styles.select}
          value={value.difficulty}
          onChange={(event) =>
            update({ difficulty: event.target.value as RecipeFilterState['difficulty'] })
          }
        >
          <option value="all">All</option>
          {[1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={String(level)}>
              Level {level}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Sort</span>
        <select
          className={styles.select}
          value={value.sort}
          onChange={(event) => update({ sort: event.target.value as RecipeSort })}
        >
          <option value="name-asc">Name A–Z</option>
          <option value="difficulty-desc">Hardest first</option>
          <option value="duration-asc">Shortest time</option>
          <option value="score-desc">Highest score</option>
        </select>
      </label>
    </div>
  );
}
