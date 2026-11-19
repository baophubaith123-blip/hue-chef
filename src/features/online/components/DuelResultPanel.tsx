import { GoldButton } from '@/components/theme-d';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/online/components/DuelResultPanel.module.css';

interface DuelResultPanelProps {
  /** sent = the challenge run was recorded; answered = the answer run
   * was booked against the challenger's ghost; error = the online
   * booking failed (the run itself still counted locally as played). */
  variant: 'sent' | 'answered' | 'error';
  score: number;
  stars: number;
  opponentName: string;
  /** Answered duels only: both totals + the verdict for this player. */
  myScore?: number;
  theirScore?: number;
  result?: 'win' | 'lose' | 'draw' | null;
  onBack: () => void;
}

/**
 * End-of-run panel for duel runs (Gói H9): mirrors the H7 event panels
 * — the run's own booking (challenge created / answer submitted) is
 * reported here, never as learning progress.
 */
export function DuelResultPanel({
  variant,
  score,
  stars,
  opponentName,
  myScore,
  theirScore,
  result,
  onBack,
}: DuelResultPanelProps) {
  const { dict } = useTranslation();
  const d = dict.online;
  const title =
    variant === 'sent' ? d.challengeSentTitle : d.duelResultTitle;
  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className={styles.title}>⚔️ {title}</h2>
        <p className={styles.dishLine}>
          <span className={styles.stars}>
            {'★'.repeat(Math.max(0, Math.min(5, stars)))}
            {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, stars))))}
          </span>{' '}
          · {score}
        </p>
        {variant === 'sent' ? <p className={styles.body}>{d.challengeSentBody}</p> : null}
        {variant === 'answered' ? (
          <>
            <p className={styles.body}>
              {d.vsLabel(opponentName)} ·{' '}
              {d.scoreLine(myScore ?? score, theirScore ?? 0)}
            </p>
            <p className={styles.verdict}>
              {result === 'win'
                ? d.resultWin
                : result === 'lose'
                  ? d.resultLose
                  : d.resultDraw}
            </p>
          </>
        ) : null}
        {variant === 'error' ? <p className={styles.body}>{d.loadError}</p> : null}
        <div className={styles.actions}>
          <GoldButton onClick={onBack}>{d.backToDuels}</GoldButton>
        </div>
      </div>
    </div>
  );
}
