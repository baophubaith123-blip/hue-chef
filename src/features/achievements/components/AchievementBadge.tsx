import { AchievementIcon } from '@/components/AchievementIcon';
import type { Achievement } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/achievements/components/AchievementBadge.module.css';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  progressPct?: number;
  unlockedAt?: string;
  onClick?: () => void;
}

export function AchievementBadge({
  achievement,
  unlocked = false,
  progressPct = 0,
  unlockedAt,
  onClick,
}: AchievementBadgeProps) {
  const { t } = useTranslation();
  const safeProgress = Math.max(0, Math.min(100, progressPct));

  return (
    <article
      className={`${styles.badge} ${unlocked ? styles.unlocked : styles.locked}`}
      aria-label={unlocked ? t('achievements.unlocked') : t('achievements.locked')}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={styles.iconWrap}>
        <AchievementIcon
          badgeId={achievement.id}
          category={achievement.category}
          size="md"
          locked={!unlocked}
        />
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{achievement.name}</h3>
        <p className={styles.description}>{achievement.description}</p>
        {!unlocked ? (
          <div
            className={styles.progressWrap}
            role="progressbar"
            aria-valuenow={safeProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.progressBar} style={{ width: `${safeProgress}%` }} />
          </div>
        ) : null}
        {unlocked && unlockedAt ? (
          <p className={styles.unlockedAt}>
            {t('achievements.unlockedAt')}: {new Date(unlockedAt).toLocaleDateString()}
          </p>
        ) : null}
      </div>
    </article>
  );
}
