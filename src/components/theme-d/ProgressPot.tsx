import styles from '@/components/theme-d/ProgressPot.module.css';

interface ProgressPotProps {
  /** Progress 0–100 across the whole run. */
  percent: number;
  /** Current step index (0-based) and total steps for the step bar. */
  stepIndex: number;
  stepTotal: number;
  label: string;
  noiNoiSrc: string;
}

const R = 52;
const CIRC = 2 * Math.PI * R;

/**
 * Theme D progress pot — progress ring around Nồi Nồi plus a step bar
 * (Kế hoạch 1, Phần 2.2).
 */
export function ProgressPot({ percent, stepIndex, stepTotal, label, noiNoiSrc }: ProgressPotProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const filled = (clamped / 100) * CIRC;
  return (
    <div className={styles.wrap}>
      <div className={styles.ringWrap} role="img" aria-label={label}>
        <svg viewBox="0 0 140 140" className={styles.ring} aria-hidden focusable="false">
          <circle cx="70" cy="70" r={R} className={styles.track} />
          <circle
            cx="70"
            cy="70"
            r={R}
            className={styles.progress}
            strokeDasharray={`${filled} ${CIRC - filled}`}
            transform="rotate(-90 70 70)"
          />
        </svg>
        <img className={styles.mascot} src={noiNoiSrc} alt="" aria-hidden />
        <span className={styles.percent}>{Math.round(clamped)}%</span>
      </div>
      <div className={styles.steps} aria-hidden>
        {Array.from({ length: stepTotal }, (_, i) => (
          <span
            key={i}
            className={`${styles.step} ${i < stepIndex ? styles.stepDone : ''} ${i === stepIndex ? styles.stepCurrent : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
