import styles from '@/components/theme-d/FestivalGarland.module.css';

interface FestivalGarlandProps {
  className?: string;
}

const PENNANTS = ['#b03e26', '#e9a23b', '#faf5ef', '#c97a1f', '#b03e26', '#f6c453', '#faf5ef', '#e9a23b'];
const LANTERNS = [
  { x: 120, color: '#e9a23b' },
  { x: 480, color: '#b03e26' },
  { x: 840, color: '#f6c453' },
];

/**
 * Theme D festival garland — lantern + pennant string reused at the top of
 * every screen (Kế hoạch 1, Phần 2.3). Pure SVG/CSS, decorative only.
 */
export function FestivalGarland({ className = '' }: FestivalGarlandProps) {
  return (
    <div className={`${styles.garland} ${className}`} aria-hidden>
      <svg className={styles.svg} viewBox="0 0 960 92" preserveAspectRatio="xMidYMin slice" focusable="false">
        <path d="M0 6 Q 480 58 960 6" fill="none" stroke="rgba(67, 48, 27, 0.55)" strokeWidth="3" />
        {PENNANTS.map((color, i) => {
          const x = 60 + i * 108;
          const y = 16 + Math.sin((i / (PENNANTS.length - 1)) * Math.PI) * 16;
          return (
            <g key={color + i} className={styles.sway} style={{ animationDelay: `${i * 0.35}s` }}>
              <path d={`M${x} ${y} h34 l-17 26 z`} fill={color} stroke="rgba(67,48,27,0.35)" strokeWidth="1.5" />
            </g>
          );
        })}
        {LANTERNS.map((lantern, i) => (
          <g key={lantern.x} className={styles.sway} style={{ animationDelay: `${0.6 + i * 0.5}s` }}>
            <line x1={lantern.x} y1={18 + i * 4} x2={lantern.x} y2={34} stroke="rgba(67,48,27,0.6)" strokeWidth="2.5" />
            <ellipse cx={lantern.x} cy={52} rx="17" ry="19" fill={lantern.color} stroke="rgba(67,48,27,0.4)" strokeWidth="1.5" />
            <ellipse cx={lantern.x} cy={52} rx="8" ry="19" fill="rgba(255,246,224,0.35)" />
            <rect x={lantern.x - 8} y={31} width="16" height="5" rx="2" fill="#8a5a2b" />
            <line x1={lantern.x} y1={71} x2={lantern.x} y2={82} stroke={lantern.color} strokeWidth="3" />
          </g>
        ))}
      </svg>
    </div>
  );
}
