import type { AppealStatus, AppealType } from '@/features/support/types';
import { useAppeals } from '@/contexts/AppealContext';
import { useTranslation } from '@/i18n/useTranslation';
import { EmptyState } from '@/components/EmptyState';
import styles from '@/features/support/components/AppealList.module.css';

interface AppealListProps {
  filters?: {
    status?: AppealStatus;
    supportId?: string;
  };
  onSelect?: (appealId: string) => void;
  compact?: boolean;
  limit?: number;
}

export function AppealList({ filters, onSelect, compact = false, limit }: AppealListProps) {
  const { t, dict } = useTranslation();
  const { listAppeals, findUserById } = useAppealsCtxHelpers();
  const appeals = listAppeals(filters);
  const display = limit ? appeals.slice(0, limit) : appeals;

  if (display.length === 0) {
    return <EmptyState title={t('support.appealsEmpty')} description={t('support.noAppealsYet')} />;
  }

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
      {!compact ? (
        <header className={styles.tableHeader}>
          <span>{t('support.colType')}</span>
          <span>{t('support.colAppellant')}</span>
          <span>{t('common.status')}</span>
          <span>{t('common.createdAt')}</span>
          <span className={styles.actionsHeader}>{t('common.actions')}</span>
        </header>
      ) : null}
      <ul className={styles.list}>
        {display.map((appeal) => {
          const appellant = findUserById(appeal.appellantId);
          const typeLabel = dict.support.typeLabels[appeal.type as AppealType];
          const statusLabel = dict.appeal.statusLabels[appeal.status];
          return (
            <li
              key={appeal.id}
              className={styles.row}
              onClick={() => onSelect?.(appeal.id)}
              role={onSelect ? 'button' : undefined}
            >
              <div className={styles.typeCell}>
                <span className={`${styles.typeChip} ${styles[`type_${appeal.type}`]}`}>
                  {typeLabel}
                </span>
              </div>
              <div className={styles.appellantCell}>
                {appellant?.avatar ? (
                  <img
                    src={appellant.avatar}
                    alt={appellant.name}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {(appellant?.name ?? '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.appellantInfo}>
                  <div className={styles.appellantName}>
                    {appellant?.name ?? appeal.appellantId}
                  </div>
                  <div className={styles.subjectLine}>{appeal.subject}</div>
                </div>
              </div>
              <div className={styles.statusCell}>
                <span
                  className={`${styles.statusChip} ${styles[`status_${appeal.status}`]}`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className={styles.createdCell}>
                {new Date(appeal.updatedAt).toLocaleDateString()}
              </div>
              {onSelect ? (
                <button
                  type="button"
                  className={styles.viewButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(appeal.id);
                  }}
                >
                  {t('common.view')} →
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { useSupport } from '@/contexts/SupportContext';
import { useMemo } from 'react';

function useAppealsCtxHelpers() {
  const appealsCtx = useAppeals();
  const supportCtx = useSupport();
  return useMemo(
    () => ({
      listAppeals: appealsCtx.listAppeals,
      findUserById: supportCtx.findUserById,
    }),
    [appealsCtx, supportCtx],
  );
}
