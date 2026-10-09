import { AchievementIcon } from '@/components/AchievementIcon';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import type { Achievement } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from './AchievementDetailModal.module.css';

interface AchievementDetailModalProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: { current: number; target: number; percent: number };
  onClose: () => void;
}

export function AchievementDetailModal({
  achievement,
  isUnlocked,
  progress,
  onClose,
}: AchievementDetailModalProps) {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  const isEquipped = user?.equippedAchievementId === achievement.id;

  const handleEquip = () => {
    if (!isUnlocked) return;
    updateProfile({ equippedAchievementId: isEquipped ? null : achievement.id });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.iconWrap}>
          <AchievementIcon
            badgeId={achievement.id}
            category={achievement.category}
            size="lg"
            locked={!isUnlocked}
          />
        </div>

        <h2 className={styles.title}>{achievement.name}</h2>
        <p className={styles.desc}>{achievement.description}</p>

        {achievement.story ? (
          <div className={styles.storyBox}>
            <p>"{achievement.story}"</p>
          </div>
        ) : null}

        {isUnlocked ? (
          <div className={styles.unlockedBadge}>
            <span>✓ {t('profile.equipped') !== undefined ? 'Đã mở khoá' : 'Unlocked'}</span>
          </div>
        ) : progress ? (
          <div className={styles.progressWrap}>
            <div className={styles.progressText}>
              <span>Tiến độ</span>
              <span>
                {progress.current} / {progress.target} ({Math.round(progress.percent)}%)
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, progress.percent)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className={styles.actions}>
          {isUnlocked ? (
            <Button
              variant={isEquipped ? 'secondary' : 'primary'}
              onClick={handleEquip}
              style={{ width: '100%' }}
            >
              {isEquipped ? 'Bỏ đeo thành tích' : t('profile.equip')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
