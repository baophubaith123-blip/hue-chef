import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from '@/components/Card';
import { AppealList } from '@/features/support/components/AppealList';
import { useAppeals } from '@/contexts/AppealContext';
import { useTranslation } from '@/i18n/useTranslation';
import type { AppealStatus } from '@/features/support/types';
import { SupportShell } from '@/pages/support/SupportShell';

import styles from '@/pages/support/SupportAppealsPage.module.css';

export default function SupportAppealsPage() {
  const { t, dict } = useTranslation();
  const navigate = useNavigate();
  const { listAppeals } = useAppeals();
  const [statusFilter, setStatusFilter] = useState<AppealStatus | 'all'>('all');
  const allAppeals = listAppeals();

  const filters = useMemo(
    () => [
      { key: 'all', label: t('common.all'), count: allAppeals.length },
      {
        key: 'open',
        label: dict.appeal.statusLabels.open,
        count: allAppeals.filter((a) => a.status === 'open').length,
      },
      {
        key: 'recommended',
        label: dict.appeal.statusLabels.recommended,
        count: allAppeals.filter((a) => a.status === 'recommended').length,
      },
      {
        key: 'resolved',
        label: dict.appeal.statusLabels.resolved,
        count: allAppeals.filter((a) => a.status === 'resolved').length,
      },
      {
        key: 'rejected',
        label: dict.appeal.statusLabels.rejected,
        count: allAppeals.filter((a) => a.status === 'rejected').length,
      },
    ],
    [allAppeals, dict.appeal.statusLabels, t],
  );

  return (
    <SupportShell>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('support.appealsTitle')}</h1>
            <p className={styles.intro}>{t('support.appealsIntro')}</p>
          </div>
        </header>

        <div className={styles.filters} role="tablist" aria-label="Appeal status filters">
          {filters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={statusFilter === f.key}
              className={`${styles.filterBtn} ${statusFilter === f.key ? styles.filterActive : ''}`}
              onClick={() =>
                setStatusFilter(f.key === 'all' ? 'all' : (f.key as AppealStatus))
              }
              type="button"
            >
              <span>{f.label}</span>
              <span className={styles.filterCount}>{f.count}</span>
            </button>
          ))}
        </div>

        <Card>
          <AppealList
            filters={statusFilter === 'all' ? undefined : { status: statusFilter }}
            onSelect={(id) => navigate(`/support/appeals/${id}`)}
          />
        </Card>
      </div>
    </SupportShell>
  );
}
