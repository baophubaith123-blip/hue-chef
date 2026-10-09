import { useMemo } from 'react';

import type { Achievement } from '@/data/types';
import { AchievementBadge } from '@/features/achievements/components/AchievementBadge';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/achievements/components/AchievementList.module.css';

type AchievementFilter = 'all' | 'unlocked' | 'locked';

export interface AchievementListItem {
  achievement: Achievement;
  unlocked: boolean;
  progressPct: number;
  unlockedAt?: string;
}

interface AchievementListProps {
  items: AchievementListItem[];
  filter?: AchievementFilter;
  onFilterChange?: (filter: AchievementFilter) => void;
}

export function AchievementList({ items, filter = 'all', onFilterChange }: AchievementListProps) {
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unlocked':
        return items.filter((item) => item.unlocked);
      case 'locked':
        return items.filter((item) => !item.unlocked);
      case 'all':
      default:
        return items;
    }
  }, [items, filter]);

  const filters: { key: AchievementFilter; label: string }[] = [
    { key: 'all', label: t('achievements.filterAll') },
    { key: 'unlocked', label: t('achievements.filterUnlocked') },
    { key: 'locked', label: t('achievements.filterLocked') },
  ];

  if (items.length === 0 || filtered.length === 0) {
    return (
      <div className={styles.wrap}>
        <div className={styles.filterBar}>
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'primary' : 'secondary'}
              onClick={() => onFilterChange?.(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <EmptyState title={t('achievements.locked')} />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.filterBar} role="tablist" aria-label={t('nav.achievements')}>
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'primary' : 'secondary'}
            onClick={() => onFilterChange?.(f.key)}
            aria-selected={filter === f.key}
            role="tab"
          >
            {f.label}
          </Button>
        ))}
      </div>
      <div className={styles.grid} role="list">
        {filtered.map((item) => (
          <div key={item.achievement.id} role="listitem">
            <AchievementBadge
              achievement={item.achievement}
              unlocked={item.unlocked}
              progressPct={item.progressPct}
              unlockedAt={item.unlockedAt}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
