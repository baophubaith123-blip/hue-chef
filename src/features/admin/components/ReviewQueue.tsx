import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/EmptyState';
import { findUserById, loadUsers } from '@/features/auth/store';
import type { Recipe } from '@/data/types';
import { formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/admin/components/ReviewQueue.module.css';

interface ReviewQueueProps {
  recipes: Recipe[];
}

export function ReviewQueue({ recipes }: ReviewQueueProps) {
  const { t, dict } = useTranslation();

  if (recipes.length === 0) {
    return (
      <EmptyState title={t('admin.queueEmpty')} description={t('admin.queueHint')} />
    );
  }

  const users = loadUsers();

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('admin.colRecipe')}</th>
            <th>{t('admin.colEditor')}</th>
            <th>{t('admin.colCategory')}</th>
            <th>{t('admin.colDuration')}</th>
            <th>{t('admin.colSubmitted')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {recipes.map((recipe) => {
            const editor = recipe.editorId ? findUserById(users, recipe.editorId) : undefined;
            const categoryLabel = dict.recipe.categoryLabels[recipe.category];
            return (
              <tr key={recipe.id} className={styles.row}>
                <td>
                  <div className={styles.recipeCell}>
                    {recipe.image ? (
                      <img
                        className={styles.thumb}
                        src={recipe.image}
                        alt={recipe.name}
                        onError={(event) => {
                          (event.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                        }}
                      />
                    ) : null}
                    <div>
                      <div className={styles.recipeName}>{recipe.name}</div>
                      <div className={styles.recipeDifficulty}>
                        {'★'.repeat(recipe.difficulty)}
                        {'☆'.repeat(5 - recipe.difficulty)}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.editorCell}>
                    {editor ? (
                      <>
                        {editor.avatar ? (
                          <img className={styles.avatar} src={editor.avatar} alt={editor.name} />
                        ) : null}
                        <span>{editor.name}</span>
                      </>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={styles.categoryChip}>{categoryLabel}</span>
                </td>
                <td>{formatDuration(recipe.duration)}</td>
                <td>
                  <span className={styles.submittedDate}>
                    {recipe.submittedAt
                      ? new Date(recipe.submittedAt).toLocaleDateString(undefined, {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </td>
                <td>
                  <Link className={styles.link} to={`/admin/review/${recipe.id}`}>
                    {t('common.review')} →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
