import type { RecipeStatus } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/editor/components/RecipeStatusBadge.module.css';

interface RecipeStatusBadgeProps {
  status: RecipeStatus | undefined;
}

export function RecipeStatusBadge({ status }: RecipeStatusBadgeProps) {
  const { t } = useTranslation();
  const value: RecipeStatus = status ?? 'draft';
  const labels: Record<RecipeStatus, string> = {
    draft: t('recipeStatus.draft'),
    pending: t('recipeStatus.pending'),
    approved: t('recipeStatus.approved'),
    rejected: t('recipeStatus.rejected'),
  };
  return (
    <span className={[styles.badge, styles[value]].filter(Boolean).join(' ')}>
      {labels[value]}
    </span>
  );
}
