import { Navigate, useParams } from 'react-router-dom';

import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { useMail } from '@/contexts/MailContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { ReviewDetail } from '@/features/admin/components/ReviewDetail';
import { resolveStageConfig } from '@/features/cooking/lib/stage-config';
import { MinigameSummary } from '@/features/recipes/components/MinigameSummary';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

export default function AdminReviewDetailPage() {
  const { t, dict } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { isLoading, getRecipeById, approveRecipe, rejectRecipe } = useRecipes();
  const { sendRecipeApprovedMail, sendRecipeRejectedMail } = useMail();

  if (!id) {
    return <Navigate to="/admin/review" replace />;
  }

  const recipe = getRecipeById(id);

  if (isLoading) {
    return (
      <AdminShell>
        <Loading label={t('common.loading')} />
      </AdminShell>
    );
  }

  if (!recipe || recipe.status !== 'pending') {
    return (
      <AdminShell>
        <Card title={t('admin.notInQueue')}>
          <p>{t('admin.notInQueueDesc')}</p>
        </Card>
      </AdminShell>
    );
  }

  const editorId = recipe.editorId;
  if (!editorId) {
    return (
      <AdminShell>
        <Card title={t('admin.invalidRecipe')}>
          <p>{t('admin.invalidRecipeDesc')}</p>
        </Card>
      </AdminShell>
    );
  }

  const stageCfg = resolveStageConfig(recipe);
  const quizCount = (recipe.minigames ?? []).filter((m) => m.type === 'quiz').length;
  const hasStepIngredients = (recipe.steps ?? []).some(
    (step) => step.requiredIngredients.length > 0,
  );
  const enabledStages =
    (stageCfg.marketEnabled ? 1 : 0) +
    (stageCfg.catchEnabled ? 1 : 0) +
    (stageCfg.seasonEnabled ? 1 : 0) +
    (stageCfg.finishEnabled ? 1 : 0) +
    (stageCfg.quizEnabled && quizCount > 0 ? 1 : 0);
  const runReady = hasStepIngredients && quizCount >= 1 && enabledStages === 5;

  return (
    <AdminShell>
      <Card title={dict.editorGameplay.title}>
        <p>
          {runReady ? <strong>{dict.editorGameplay.readyBadge}</strong> : null}{' '}
          {dict.editorGameplay.readyDetail(enabledStages, quizCount)}
          {!hasStepIngredients ? ` · ⚠ ${dict.editorGameplay.needsStepIngredients}` : ''}
          {quizCount < 1 ? ` · ⚠ ${dict.editorGameplay.needsQuiz}` : ''}
        </p>
      </Card>
      <ReviewDetail
        recipe={recipe}
        minigamesSlot={<MinigameSummary minigames={recipe.minigames} />}
        onApprove={() => {
          const updated = approveRecipe(recipe.id);
          sendRecipeApprovedMail(editorId, updated.id, updated.name);
        }}
        onReject={(reason) => {
          const updated = rejectRecipe(recipe.id, reason);
          sendRecipeRejectedMail(editorId, updated.id, updated.name, reason);
        }}
      />
    </AdminShell>
  );
}
