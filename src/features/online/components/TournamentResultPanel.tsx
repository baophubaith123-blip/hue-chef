import { GoldButton } from '@/components/theme-d';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/online/components/DuelResultPanel.module.css';

interface TournamentResultPanelProps {
  /** booked = the score reached the weekly board; error = the online
   * booking failed (the run itself still counted locally as played). */
  variant: 'booked' | 'error';
  score: number;
  stars: number;
  onBack: () => void;
}

/** End-of-run panel for weekly-tournament runs (Gói H9). */
export function TournamentResultPanel({
  variant,
  score,
  stars,
  onBack,
}: TournamentResultPanelProps) {
  const { dict } = useTranslation();
  const d = dict.online;
  const title = variant === 'booked' ? d.tournamentBookedTitle : d.tournamentTitle;
  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={title}>
        <h2 className={styles.title}>🏆 {title}</h2>
        <p className={styles.dishLine}>
          <span className={styles.stars}>
            {'★'.repeat(Math.max(0, Math.min(5, stars)))}
            {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, stars))))}
          </span>{' '}
          · {score}
        </p>
        {variant === 'booked' ? (
          <p className={styles.body}>{d.tournamentBookedBody(score)}</p>
        ) : (
          <p className={styles.body}>{d.loadError}</p>
        )}
        <div className={styles.actions}>
          <GoldButton onClick={onBack}>{d.backToTournament}</GoldButton>
        </div>
      </div>
    </div>
  );
}
