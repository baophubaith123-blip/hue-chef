import { AchievementIcon } from '@/components/AchievementIcon';
import type { Achievement } from '@/data/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/achievements/components/AchievementBadge.module.css';

import silkBamboo from '@/assets/theme-d/game/r4-silk-banner-bamboo.webp';
import silkCreamWave from '@/assets/theme-d/game/r4-silk-banner-cream-wave.webp';
import silkGoldLotus from '@/assets/theme-d/game/r4-silk-banner-gold-lotus.webp';
import silkPhoenix from '@/assets/theme-d/game/r4-silk-banner-phoenix.webp';
import silkRedFloral from '@/assets/theme-d/game/r4-silk-banner-red-floral.webp';

const SILK_BANNERS = [silkRedFloral, silkGoldLotus, silkPhoenix, silkCreamWave, silkBamboo];

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked?: boolean;
  progressPct?: number;
  unlockedAt?: string;
  onClick?: () => void;
  /** Đợt 4: which embroidered silk banner dresses this badge (cycles 0–4). */
  silkIndex?: number;
}

export function AchievementBadge({
  achievement,
  unlocked = false,
  progressPct = 0,
  unlockedAt,
  onClick,
  silkIndex = 0,
}: AchievementBadgeProps) {
  const { t } = useTranslation();
  const safeProgress = Math.max(0, Math.min(100, progressPct));
  const rarity = achievement.rarity ?? 'common';
  const rarityLabel =
    rarity === 'rare'
      ? t('achievements.rarityRare')
      : rarity === 'epic'
        ? t('achievements.rarityEpic')
        : rarity === 'legendary'
          ? t('achievements.rarityLegendary')
          : t('achievements.rarityCommon');
  const rarityClass =
    rarity === 'rare'
      ? styles.rarityRare
      : rarity === 'epic'
        ? styles.rarityEpic
        : rarity === 'legendary'
          ? styles.rarityLegendary
          : styles.rarityCommon;

  return (
    <article
      className={`${styles.badge} ${unlocked ? styles.unlocked : styles.locked} ${rarityClass}`}
      aria-label={unlocked ? t('achievements.unlocked') : t('achievements.locked')}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        className={`${styles.silkBanner} ${unlocked ? '' : styles.silkLocked}`}
        src={SILK_BANNERS[silkIndex % SILK_BANNERS.length]}
        alt=""
        aria-hidden="true"
      />
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
        <span className={styles.rarityChip}>{rarityLabel}</span>
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
