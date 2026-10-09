import { useMemo, useState } from 'react';

import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useAchievements } from '@/contexts/AchievementContext';
import { AchievementList } from '@/features/achievements/components/AchievementList';
import type { AchievementListItem } from '@/features/achievements/components/AchievementList';
import { AchievementDetailModal } from '@/features/achievements/components/AchievementDetailModal';
import { useTranslation } from '@/i18n/useTranslation';
import { PlayerShell } from '@/pages/player/PlayerShell';

import styles from '@/pages/player/AchievementsPage.module.css';

type AchievementFilter = 'all' | 'unlocked' | 'locked';

export default function AchievementsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { allAchievements, isUnlocked, unlockedForUser, getProgressPct } = useAchievements();
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const [selectedItem, setSelectedItem] = useState<AchievementListItem | null>(null);

  const items = useMemo<AchievementListItem[]>(() => {
    if (!user) return [];
    const unlockedList = unlockedForUser(user.id);
    return allAchievements.map((a) => {
      const unlocked = isUnlocked(user.id, a.id);
      const unlockedAt = unlockedList.find((u) => u.id === a.id)?.unlockedAt;
      return {
        achievement: a,
        unlocked,
        progressPct: getProgressPct(user, a.id, {}),
        unlockedAt,
      };
    });
  }, [user, allAchievements, isUnlocked, unlockedForUser, getProgressPct]);

  return (
    <PlayerShell>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('achievements.title')}</h1>
          <p className={styles.intro}>{t('achievements.intro')}</p>
        </div>
      </header>
      <Card>
        <AchievementList
          items={items}
          filter={filter}
          onFilterChange={setFilter}
          onSelectAchievement={setSelectedItem}
        />
      </Card>

      {selectedItem ? (
        <AchievementDetailModal
          achievement={selectedItem.achievement}
          isUnlocked={selectedItem.unlocked}
          progress={{
            current: Math.round((selectedItem.progressPct / 100) * 5),
            target: 5,
            percent: selectedItem.progressPct,
          }}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}
    </PlayerShell>
  );
}
