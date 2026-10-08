import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import type { Recipe } from '@/data/types';
import { RecipeStatusBadge } from '@/features/editor/components/RecipeStatusBadge';
import { formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/editor/components/MyRecipeCard.module.css';

interface MyRecipeCardProps {
  recipe: Recipe;
  canEdit: boolean;
  onDelete?: () => void;
}

export function MyRecipeCard({ recipe, canEdit, onDelete }: MyRecipeCardProps) {
  const { t, dict } = useTranslation();
  const categoryLabel = dict.recipe.categoryLabels[recipe.category];

  return (
    <article className={styles.card}>
      {recipe.image ? (
        <Link to={`/editor/recipes/${recipe.id}`} className={styles.imageLink} aria-hidden>
          <img
            className={styles.image}
            src={recipe.image}
            alt={recipe.name}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </Link>
      ) : null}
      <div className={styles.head}>
        <h3 className={styles.title}>
          <Link className={styles.titleLink} to={`/editor/recipes/${recipe.id}`}>
            {recipe.name}
          </Link>
        </h3>
        <RecipeStatusBadge status={recipe.status} />
      </div>
      <p className={styles.meta}>
        {categoryLabel} · {formatDuration(recipe.duration)} · {t('recipe.difficulty')}{' '}
        {'★'.repeat(recipe.difficulty)}
      </p>
      {recipe.rejectionReason ? (
        <p className={styles.reason}>
          <strong>{t('common.reason')}:</strong> {recipe.rejectionReason}
        </p>
      ) : null}
      <div className={styles.actions}>
        <Link className={styles.link} to={`/editor/recipes/${recipe.id}`}>
          {t('common.view')}
        </Link>
        {canEdit ? (
          <Link className={styles.link} to={`/editor/recipes/${recipe.id}/edit`}>
            {t('common.edit')}
          </Link>
        ) : null}
        {canEdit && onDelete ? (
          <Button type="button" variant="ghost" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
