import { Card } from '@/components/Card';
import { Loading } from '@/components/Loading';
import { useRecipes } from '@/contexts/RecipeContext';
import { ReviewQueue } from '@/features/admin/components/ReviewQueue';
import { useTranslation } from '@/i18n/useTranslation';
import { AdminShell } from '@/pages/admin/AdminShell';

export default function AdminReviewPage() {
  const { t } = useTranslation();
  const { isLoading, getPendingRecipes } = useRecipes();
  const pending = getPendingRecipes();

  return (
    <AdminShell>
      <Card title={t('admin.reviewQueueTitle')}>
        <p>{t('admin.reviewQueueIntro')}</p>
      </Card>
      {isLoading ? (
        <Loading label={t('common.loading')} />
      ) : (
        <ReviewQueue recipes={pending} />
      )}
    </AdminShell>
  );
}
