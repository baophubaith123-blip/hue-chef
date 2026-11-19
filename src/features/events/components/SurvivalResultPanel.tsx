import { GoldButton, WoodButton } from '@/components/theme-d';
import { SURVIVAL_MAX_STRIKES } from '@/features/events/lib/survival';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/events/components/SurvivalResultPanel.module.css';

interface SurvivalResultPanelProps {
  /** Score of the dish just cooked. */
  score: number;
  stars: number;
  success: boolean;
  /** Dishes cleared in the run so far (after this dish was booked). */
  cleared: number;
  /** Run total score after this dish. */
  totalScore: number;
  strikes: number;
  /** The run ended with this dish (3 strikes or queue exhausted). */
  ended: boolean;
  /** The run ended because the whole queue was played. */
  queueDone: boolean;
  isBest: boolean;
  onNext: () => void;
  onEnd: () => void;
}

/**
 * End-of-dish panel for a survival run (Gói H7): the dish's verdict,
 * the run's standing (cleared dishes, total score, strikes) and the
 * choice to push on to the next dish or walk away with the record.
 */
export function SurvivalResultPanel({
  score,
  stars,
  success,
  cleared,
  totalScore,
  strikes,
  ended,
  queueDone,
  isBest,
  onNext,
  onEnd,
}: SurvivalResultPanelProps) {
  const { dict } = useTranslation();
  const d = dict.events.survival;
  const title = ended
    ? queueDone
      ? d.runCompleteTitle
      : d.runOverTitle
    : success
      ? d.dishClearedTitle
      : d.dishFailedTitle;
  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className={styles.title}>{success ? '🏆' : '💥'} {title}</h2>
        <p className={styles.dishLine}>
          <span className={styles.stars}>
            {'★'.repeat(Math.max(0, Math.min(5, stars)))}
            {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, stars))))}
          </span>{' '}
          · {score}
        </p>
        <p className={styles.stats}>{d.finalStats(cleared, totalScore)}</p>
        <p className={styles.strikes}>{d.strikesLabel(strikes, SURVIVAL_MAX_STRIKES)}</p>
        {isBest && ended ? <p className={styles.best}>🎉 {d.newBest}</p> : null}
        <div className={styles.actions}>
          {!ended ? (
            <>
              <WoodButton onClick={onEnd}>{d.endRun}</WoodButton>
              <GoldButton onClick={onNext}>{d.nextDish}</GoldButton>
            </>
          ) : (
            <GoldButton onClick={onEnd}>{d.backToSurvival}</GoldButton>
          )}
        </div>
      </div>
    </div>
  );
}
