import styles from '@/components/theme-d/SeasonMeter.module.css';

interface SeasonMeterProps {
  label: string;
  /** Current value 0–100. */
  value: number;
  /** "Chuẩn vị" zone as [start, end] percentages. */
  zoneStart?: number;
  zoneEnd?: number;
  lowLabel: string;
  highLabel: string;
}

function clampPercent(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/** Theme D seasoning meter — gold "chuẩn vị" zone with a moving needle (Kế hoạch 1, Phần 2.2). */
export function SeasonMeter({ label, value, zoneStart = 62, zoneEnd = 82, lowLabel, highLabel }: SeasonMeterProps) {
  const v = clampPercent(value);
  const inZone = v >= zoneStart && v <= zoneEnd;
  return (
    <div className={styles.meter}>
      <div className={styles.head}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.state} ${inZone ? styles.inZone : ''}`}>{inZone ? '✓' : ''}</span>
      </div>
      <div
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(v)}
      >
        <div
          className={styles.zone}
          style={{ left: `${zoneStart}%`, width: `${zoneEnd - zoneStart}%` }}
          aria-hidden
        />
        <div className={styles.needle} style={{ left: `${v}%` }} aria-hidden />
      </div>
      <div className={styles.ends} aria-hidden>
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
