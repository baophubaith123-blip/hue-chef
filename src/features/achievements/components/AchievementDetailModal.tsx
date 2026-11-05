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
  unlockedAt?: string;
  onClose: () => void;
}

const RARITY_CLASS: Record<string, string> = {
  common: 'rarityCommon',
  rare: 'rarityRare',
  epic: 'rarityEpic',
  legendary: 'rarityLegendary',
};

export function AchievementDetailModal({
  achievement,
  isUnlocked,
  progress,
  unlockedAt,
  onClose,
}: AchievementDetailModalProps) {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();

  const rarity = achievement.rarity ?? 'common';
  const rarityLabel =
    rarity === 'rare'
      ? t('achievements.rarityRare')
      : rarity === 'epic'
        ? t('achievements.rarityEpic')
        : rarity === 'legendary'
          ? t('achievements.rarityLegendary')
          : t('achievements.rarityCommon');
  const rarityClass = styles[RARITY_CLASS[rarity]] ?? styles.rarityCommon;

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
        <span className={`${styles.rarityChip} ${rarityClass}`}>{rarityLabel}</span>
        <p className={styles.desc}>{achievement.description}</p>

        {achievement.story ? (
          <div className={styles.storyBox}>
            <span className={styles.storyLabel}>{t('achievements.storyLabel')}</span>
            <p>"{achievement.story}"</p>
          </div>
        ) : null}

        {isUnlocked ? (
          <div className={styles.unlockedBadge}>
            <span>✓ {t('achievements.unlocked')}</span>
            {unlockedAt ? (
              <span className={styles.unlockedDate}>
                · {t('achievements.unlockedAt')}: {new Date(unlockedAt).toLocaleDateString()}
              </span>
            ) : null}
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
