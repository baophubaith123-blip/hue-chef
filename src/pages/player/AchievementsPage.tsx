import { useEffect, useMemo, useState } from 'react';

import { AchievementIcon } from '@/components/AchievementIcon';
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
  const {
    allAchievements,
    isUnlocked,
    unlockedForUser,
    getProgressPct,
    getProgressDetail,
    checkAndUnlockForUser,
  } = useAchievements();
  const [filter, setFilter] = useState<AchievementFilter>('all');
  const [selectedItem, setSelectedItem] = useState<AchievementListItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync unlock state with cooked history on open: achievements whose
  // conditions are already met (e.g. seeded accounts) become unlocked.
  useEffect(() => {
    if (!user) return;
    const newly = checkAndUnlockForUser(user, {});
    if (newly.length > 0) setRefreshKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
  }, [user, allAchievements, isUnlocked, unlockedForUser, getProgressPct, refreshKey]);

  // Derived stats
  const level = user?.level ?? 1;
  const exp = user?.exp ?? 0;
  const maxExp = user?.maxExp ?? 1000;
  const expPct = Math.min(100, Math.round((exp / (maxExp || 1000)) * 100));

  const cookedRecipes = user?.cookedRecipes ?? [];
  const totalScore = cookedRecipes.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const cookedCount = cookedRecipes.length;
  const unlockedBadges = items.filter((i) => i.unlocked);

  return (
    <PlayerShell>
      <div className={styles.container}>
        {/* Profile Card Header (Image 1 Style) */}
        <section className={styles.profileHeaderCard}>
          <div className={styles.userMainRow}>
            <div className={styles.avatarWrapper}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarInitials}>
                  {user?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
              )}
              {user?.equippedAchievementId ? (
                <div className={styles.badgeOverlay}>
                  <AchievementIcon badgeId={user.equippedAchievementId} size="xs" />
                </div>
              ) : null}
            </div>

            <div className={styles.userMeta}>
              <div className={styles.userNameRow}>
                <h1 className={styles.userName}>{user?.name || 'Người chơi'}</h1>
                <span className={styles.levelBadge}>Lv.{level}</span>
              </div>
              <div className={styles.expSection}>
                <div className={styles.expText}>
                  <span>{exp} / {maxExp} EXP</span>
                  <span>{expPct}%</span>
                </div>
                <div className={styles.expTrack}>
                  <div className={styles.expFill} style={{ width: `${expPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Stat boxes (Image 1 Style) */}
          <div className={styles.statsSummaryGrid}>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{totalScore.toLocaleString()}</span>
              <span className={styles.statLabel}>Điểm tích lũy</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{cookedCount}</span>
              <span className={styles.statLabel}>Món đã nấu</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>{unlockedBadges.length}</span>
              <span className={styles.statLabel}>Thành tựu đạt</span>
            </div>
          </div>
        </section>

        {/* Unlocked Badges Showcase */}
        {unlockedBadges.length > 0 && (
          <section className={styles.badgesShowcaseSection}>
            <h2 className={styles.sectionTitle}>Huy hiệu đã đạt</h2>
            <div className={styles.badgesGrid}>
              {unlockedBadges.map((item) => (
                <button
                  key={item.achievement.id}
                  type="button"
                  className={styles.badgePillCard}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className={styles.badgeIconCircle}>
                    <AchievementIcon badgeId={item.achievement.id} size="md" />
                  </div>
                  <span className={styles.badgeName}>{item.achievement.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All Achievements List Card */}
        <section className={styles.fullListSection}>
          <h2 className={styles.sectionTitle}>{t('achievements.title')}</h2>
          <Card>
            <AchievementList
              items={items}
              filter={filter}
              onFilterChange={setFilter}
              onSelectAchievement={setSelectedItem}
            />
          </Card>
        </section>

        {selectedItem && user ? (
          <AchievementDetailModal
            achievement={selectedItem.achievement}
            isUnlocked={selectedItem.unlocked}
            progress={(() => {
              const detail = getProgressDetail(user, selectedItem.achievement.id, {});
              return { current: detail.current, target: detail.target, percent: detail.pct };
            })()}
            unlockedAt={selectedItem.unlockedAt}
            onClose={() => setSelectedItem(null)}
          />
        ) : null}
      </div>
    </PlayerShell>
  );
}
