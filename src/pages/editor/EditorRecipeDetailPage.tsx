import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { getIngredientById } from '@/data/ingredients';
import { useRecipes } from '@/contexts/RecipeContext';
import { RecipeStatusBadge } from '@/features/editor/components/RecipeStatusBadge';
import { useEditorRecipes } from '@/features/editor/hooks/useEditorRecipes';
import { formatDuration } from '@/lib/format';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { EditorShell } from '@/pages/editor/EditorShell';

import shellStyles from '@/pages/common/RoleShell.module.css';
import styles from '@/pages/editor/EditorRecipeDetailPage.module.css';

export default function EditorRecipeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t, dict } = useTranslation();
  const { isLoading, getRecipeById, submitRecipeForReview, deleteRecipeAsEditor } = useRecipes();
  const { editorId, canEditRecipe } = useEditorRecipes();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!id || !editorId) {
    return <Navigate to="/editor/recipes" replace />;
  }

  const recipe = getRecipeById(id);

  if (isLoading) {
    return (
      <EditorShell>
        <Loading label={t('common.loading')} />
      </EditorShell>
    );
  }

  if (!recipe || recipe.editorId !== editorId) {
    return (
      <EditorShell>
        <Card title={t('errors.recipeNotFound')}>
          <p>{t('errors.forbiddenEdit')}</p>
          <Link to="/editor/recipes">{t('editor.backToMyRecipes')}</Link>
        </Card>
      </EditorShell>
    );
  }

  const status = recipe.status ?? 'draft';
  const canSubmit = status === 'draft' || status === 'rejected';
  const editable = canEditRecipe(recipe);

  const handleSubmitReview = () => {
    setError(null);
    setMessage(null);
    try {
      submitRecipeForReview(recipe.id, editorId);
      setMessage(t('editor.submittedForReview'));
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.code === 'INVALID_STATUS' ? t('errors.onlyDraftSubmit') : err.message);
      }
    }
  };

  const handleDelete = () => {
    setError(null);
    try {
      deleteRecipeAsEditor(recipe.id, editorId);
      navigate('/editor/recipes');
    } catch (err) {
      if (err instanceof AppError) {
        setError(
          err.code === 'INVALID_STATUS'
            ? t('errors.approvedCannotDelete')
            : err.message,
        );
      }
    }
  };

  const categoryLabel = dict.recipe.categoryLabels[recipe.category];

  return (
    <EditorShell>
      <Link className={styles.back} to="/editor/recipes">
        {t('editor.backToMyRecipes')}
      </Link>
      <div className={styles.head}>
        <h1 className={styles.title}>{recipe.name}</h1>
        <RecipeStatusBadge status={recipe.status} />
      </div>
      <p className={shellStyles.pageIntro}>
        {categoryLabel} · {formatDuration(recipe.duration)} · {t('recipe.difficulty')}{' '}
        {'★'.repeat(recipe.difficulty)}
      </p>
      {recipe.image ? (
        <div className={styles.heroWrap}>
          <img
            className={styles.hero}
            src={recipe.image}
            alt={recipe.name}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : null}
      {recipe.rejectionReason ? (
        <div className={styles.rejectedBanner}>
          <strong>{t('editor.lastRejection')}</strong>
          <p className={styles.rejectedReason}>{recipe.rejectionReason}</p>
        </div>
      ) : null}
      {message ? <p className={styles.success}>{message}</p> : null}
      {error ? <p className={shellStyles.errorBanner}>{error}</p> : null}

      <Card title={t('editor.summary')}>
        <p>{recipe.description}</p>
        <h3 className={styles.sectionTitle}>{t('recipe.ingredients')}</h3>
        <ul>
          {recipe.ingredients.map((item) => (
            <li key={item.ingredientId}>
              {getIngredientById(item.ingredientId)?.name ?? item.ingredientId} — {item.amount}
            </li>
          ))}
        </ul>
        <h3 className={styles.sectionTitle}>{t('recipe.steps')}</h3>
        <ol className={styles.stepsList}>
          {recipe.steps.map((step) => (
            <li key={step.id} className={styles.stepItem}>
              <div>
                <strong className={styles.stepTitle}>{step.title}</strong>
                <span className={styles.stepTime}> ({formatDuration(step.durationSeconds)})</span>
              </div>
              <p className={styles.stepDesc}>{step.description}</p>
            </li>
          ))}
        </ol>
        <div className={styles.actions}>
          {editable ? (
            <Link to={`/editor/recipes/${recipe.id}/edit`}>
              <Button variant="secondary">{t('common.edit')}</Button>
            </Link>
          ) : null}
          {canSubmit ? (
            <Button type="button" onClick={handleSubmitReview} className={styles.submitBtn}>
              {t('editor.submitForReview')}
            </Button>
          ) : null}
          {editable ? (
            <Button type="button" variant="ghost" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          ) : null}
        </div>
      </Card>
    </EditorShell>
  );
}
