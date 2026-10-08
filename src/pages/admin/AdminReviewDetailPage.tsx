import { Navigate, useParams } from 'react-router-dom';

import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { useMail } from '@/contexts/MailContext';
import { useRecipes } from '@/contexts/RecipeContext';
import { ReviewDetail } from '@/features/admin/components/ReviewDetail';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

export default function AdminReviewDetailPage() {
  const { t } = useTranslation();
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

  return (
    <AdminShell>
      <ReviewDetail
        recipe={recipe}
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
