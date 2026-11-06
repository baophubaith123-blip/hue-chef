import { useIngredients } from '@/contexts/IngredientContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/editor/components/TaxonomyManager.module.css';

interface TaxonomyManagerProps {
  kind: 'recipe' | 'ingredient';
}

/**
 * Lists the custom categories of one kind with a delete button. A category
 * that is still in use cannot be removed (the button is disabled and says
 * why) so existing content never loses its label.
 */
export function TaxonomyManager({ kind }: TaxonomyManagerProps) {
  const { t } = useTranslation();
  const { data, removeCategory } = useTaxonomy();
  const { recipes } = useRecipes();
  const { ingredients } = useIngredients();

  const customs = data.categories.filter((c) => c.kind === kind);
  if (customs.length === 0) return null;

  const usageCount = (id: string): number =>
    kind === 'recipe'
      ? recipes.filter((r) => r.category === id).length
      : ingredients.filter((i) => i.category === id).length;

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>{t('taxonomy.myCategoriesTitle')}</p>
      <ul className={styles.list}>
        {customs.map((entry) => {
          const used = usageCount(entry.id);
          return (
            <li key={entry.id} className={styles.item}>
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.count}>({used})</span>
              <button
                type="button"
                className={styles.deleteBtn}
                disabled={used > 0}
                title={used > 0 ? t('taxonomy.categoryInUse') : t('common.delete')}
                onClick={() => {
                  if (window.confirm(t('common.confirm'))) {
                    removeCategory(entry.id, kind);
                  }
                }}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
