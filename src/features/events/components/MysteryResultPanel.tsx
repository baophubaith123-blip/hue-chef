import { GoldButton } from '@/components/theme-d';
import type { CardKind } from '@/features/stall/lib/support';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/events/components/MysteryResultPanel.module.css';

interface MysteryResultPanelProps {
  score: number;
  stars: number;
  success: boolean;
  /** Xu purse booked for this run (0 on a loss or a consumed box). */
  rewardXu: number;
  /** Guaranteed card of a premium box, when one was granted. */
  rewardCard: CardKind | null;
  onBack: () => void;
}

/**
 * End-of-run panel for a mystery box (Gói H7): what the improvisation
 * earned — the xu purse needs a win, a premium box's card is granted
 * for finishing the run either way.
 */
export function MysteryResultPanel({
  score,
  stars,
  success,
  rewardXu,
  rewardCard,
  onBack,
}: MysteryResultPanelProps) {
  const { dict } = useTranslation();
  const d = dict.events.mystery;
  const title = success ? d.resultTitle : d.resultFailedTitle;
  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className={styles.title}>{success ? '🎁' : '📦'} {title}</h2>
        <p className={styles.dishLine}>
          <span className={styles.stars}>
            {'★'.repeat(Math.max(0, Math.min(5, stars)))}
            {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, stars))))}
          </span>{' '}
          · {score}
        </p>
        {rewardXu > 0 ? <p className={styles.reward}>{d.rewardLine(rewardXu)}</p> : null}
        {rewardCard ? (
          <p className={styles.reward}>{d.cardLine(dict.stall.support.cardNames[rewardCard])}</p>
        ) : null}
        {!success && !rewardCard ? <p className={styles.noReward}>{d.noRewardLine}</p> : null}
        <div className={styles.actions}>
          <GoldButton onClick={onBack}>{d.backToMystery}</GoldButton>
        </div>
      </div>
    </div>
  );
}
