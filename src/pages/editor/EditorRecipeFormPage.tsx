import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { useRecipes } from '@/contexts/RecipeContext';
import {
  RecipeEditorForm,
  type RecipeFormSubmitMode,
} from '@/features/editor/components/RecipeEditorForm';
import { useEditorRecipes } from '@/features/editor/hooks/useEditorRecipes';
import {
  defaultRecipeFormValues,
  formValuesToRecipe,
  recipeToFormValues,
} from '@/features/editor/lib/recipe-form';
import { findUserById, loadUsers, saveUsers } from '@/features/auth/store';
import type { RecipeFormValues } from '@/features/editor/types';
import { AppError } from '@/lib/errors';
import { useTranslation } from '@/i18n/useTranslation';
import { EditorShell } from '@/pages/editor/EditorShell';

export default function EditorRecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoading, getRecipeById, addRecipe, updateRecipeAsEditor, submitRecipeForReview } =
    useRecipes();
  const { editorId, assertCanEditRecipe, canEditRecipe } = useEditorRecipes();

  const isEditMode = Boolean(id);

  if (!editorId) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <EditorShell>
        <Loading label={t('common.loading')} />
      </EditorShell>
    );
  }

  const existing = isEditMode && id ? getRecipeById(id) : undefined;

  if (isEditMode) {
    try {
      assertCanEditRecipe(existing);
    } catch (error) {
      if (error instanceof AppError && error.code === 'FORBIDDEN') {
        return (
          <EditorShell>
            <Card title={t('common.review')}>
              <p>{t('errors.forbiddenEdit')}</p>
            </Card>
          </EditorShell>
        );
      }
      return <Navigate to="/editor/recipes" replace />;
    }
  }

  const initialValues = existing ? recipeToFormValues(existing) : defaultRecipeFormValues();
  const canSubmitDirectly = !existing || canEditRecipe(existing);

  const persistRecipeFromValues = (values: RecipeFormValues) => {
    const recipe = formValuesToRecipe(values, editorId, existing);

    if (existing) {
      updateRecipeAsEditor(existing.id, editorId, recipe);
      return { id: existing.id, isNew: false };
    }

    addRecipe({ ...recipe, status: 'draft', editorId });
    const users = loadUsers();
    const editor = findUserById(users, editorId);
    if (editor) {
      const next = users.map((user) =>
        user.id === editorId
          ? { ...user, recipeCount: (user.recipeCount ?? 0) + 1 }
          : user,
      );
      saveUsers(next);
    }
    return { id: recipe.id, isNew: true };
  };

  const handleSave = async (values: RecipeFormValues, mode: RecipeFormSubmitMode) => {
    const { id: recipeId } = persistRecipeFromValues(values);
    if (mode === 'submit') {
      submitRecipeForReview(recipeId, editorId);
    }
    navigate(`/editor/recipes/${recipeId}`);
  };

  return (
    <EditorShell>
      <Card title={isEditMode ? t('editor.editRecipeTitle') : t('editor.newRecipeTitle')}>
        <RecipeEditorForm
          initialValues={initialValues}
          draftLabel={isEditMode ? t('editor.saveDraft') : t('editor.createDraft')}
          submitLabel={t('editor.saveAndSubmit')}
          showSubmitButton={canSubmitDirectly}
          onSubmit={handleSave}
        />
      </Card>
    </EditorShell>
  );
}
