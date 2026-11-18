import styles from '@/components/theme-d/TimingRing.module.css';

interface TimingRingProps {
  /** Needle angle in degrees, 0 = top, clockwise. */
  angle: number;
  /** Zone arc spans in degrees, starting at the top and going clockwise. */
  perfectSpan?: number;
  goodSpan?: number;
  size?: number;
  label: string;
}

const R = 84;
const CIRC = 2 * Math.PI * R;

/** Arc segment drawn from the top of the ring, clockwise. */
function arc(fromDeg: number, spanDeg: number): { dash: string; offset: number } {
  const len = (spanDeg / 360) * CIRC;
  return { dash: `${len} ${CIRC - len}`, offset: -(fromDeg / 360) * CIRC + CIRC * 0.25 };
}

/**
 * Theme D timing ring — glowing gold ring with Tuyệt vời / Tốt / Trượt zones
 * (Kế hoạch 1, Phần 2.2). Zones are drawn thick and bright in BOTH themes
 * (Phase 20.1 lesson: no faint translucent zones on light backgrounds).
 */
export function TimingRing({ angle, perfectSpan = 36, goodSpan = 84, size = 220, label }: TimingRingProps) {
  const good = arc(-goodSpan / 2, goodSpan);
  const perfect = arc(-perfectSpan / 2, perfectSpan);
  return (
    <div className={styles.wrap} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 200 200" className={styles.svg} aria-hidden focusable="false">
        <circle cx="100" cy="100" r={R} className={styles.track} />
        <circle
          cx="100"
          cy="100"
          r={R}
          className={styles.zoneGood}
          strokeDasharray={good.dash}
          strokeDashoffset={good.offset}
        />
        <circle
          cx="100"
          cy="100"
          r={R}
          className={styles.zonePerfect}
          strokeDasharray={perfect.dash}
          strokeDashoffset={perfect.offset}
        />
        <g className={styles.needle} style={{ transform: `rotate(${angle}deg)` }}>
          <line x1="100" y1="100" x2="100" y2="26" className={styles.needleLine} />
          <circle cx="100" cy="26" r="7" className={styles.needleTip} />
        </g>
        <circle cx="100" cy="100" r="10" className={styles.hub} />
      </svg>
    </div>
  );
}
