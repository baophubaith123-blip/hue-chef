import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Loading } from '@/components/Loading';
import { useRecipes } from '@/contexts/RecipeContext';
import { MyRecipeCard } from '@/features/editor/components/MyRecipeCard';
import { useEditorRecipes } from '@/features/editor/hooks/useEditorRecipes';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { EditorShell } from '@/pages/editor/EditorShell';

import shellStyles from '@/pages/common/RoleShell.module.css';

export default function EditorMyRecipesPage() {
  const { t } = useTranslation();
  const { myRecipes, isLoading, canEditRecipe, editorId } = useEditorRecipes();
  const { deleteRecipeAsEditor } = useRecipes();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (recipeId: string) => {
    setError(null);
    try {
      deleteRecipeAsEditor(recipeId, editorId);
    } catch (err) {
      if (err instanceof AppError) {
        setError(
          err.code === 'INVALID_STATUS'
            ? t('errors.approvedCannotDelete')
            : err.message,
        );
      } else {
        setError(t('errors.recipeNotFound'));
      }
    }
  };

  return (
    <EditorShell>
      <Card title={t('editor.myRecipesTitle')}>
        <p>{t('editor.myRecipesHint')}</p>
        {error ? <p className={shellStyles.errorBanner}>{error}</p> : null}
        <div className={shellStyles.actionsRow}>
          <Link to="/editor/recipes/new">
            <Button>{t('nav.newRecipe')}</Button>
          </Link>
        </div>
      </Card>
      {isLoading ? (
        <Loading label={t('common.loading')} />
      ) : myRecipes.length === 0 ? (
        <EmptyState title={t('editor.noRecipesYet')} description={t('editor.createFirstDraft')} />
      ) : (
        <ul className={shellStyles.grid}>
          {myRecipes.map((recipe) => (
            <li key={recipe.id}>
              <MyRecipeCard
                recipe={recipe}
                canEdit={canEditRecipe(recipe)}
                onDelete={() => handleDelete(recipe.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </EditorShell>
  );
}
