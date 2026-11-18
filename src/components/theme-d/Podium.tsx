import styles from '@/components/theme-d/Podium.module.css';

export interface PodiumEntry {
  id: string;
  name: string;
  score: number;
  /** 1, 2 or 3 — rendered on the matching chest. */
  rank: 1 | 2 | 3;
}

interface PodiumProps {
  entries: PodiumEntry[];
  scoreLabel: string;
}

/** Theme D podium — top 3 on treasure chests with initial medals (Kế hoạch 1, Phần 2.2). */
export function Podium({ entries, scoreLabel }: PodiumProps) {
  const ordered = [...entries].sort((a, b) => a.rank - b.rank);
  const visualOrder = [ordered.find((e) => e.rank === 2), ordered.find((e) => e.rank === 1), ordered.find((e) => e.rank === 3)].filter(
    (e): e is PodiumEntry => Boolean(e),
  );
  return (
    <div className={styles.podium}>
      {visualOrder.map((entry) => (
        <div key={entry.id} className={`${styles.slot} ${styles[`rank${entry.rank}`]}`}>
          <span className={styles.medal} aria-hidden>
            {entry.rank}
          </span>
          <span className={styles.avatar} aria-hidden>
            {entry.name.trim().charAt(0).toUpperCase()}
          </span>
          <span className={styles.name}>{entry.name}</span>
          <span className={styles.score}>
            {entry.score.toLocaleString('vi-VN')} {scoreLabel}
          </span>
          <span className={styles.chest} aria-hidden>
            <svg viewBox="0 0 64 48" className={styles.chestSvg} focusable="false">
              <path d="M6 20 Q32 4 58 20 L58 26 L6 26 Z" fill="#a86e14" stroke="#6e4520" strokeWidth="2.5" />
              <rect x="6" y="26" width="52" height="17" rx="3" fill="#8a5a2b" stroke="#6e4520" strokeWidth="2.5" />
              <rect x="27" y="20" width="10" height="14" rx="2" fill="#e9a23b" stroke="#6e4520" strokeWidth="2" />
              <circle cx="32" cy="27" r="2.6" fill="#43301b" />
            </svg>
          </span>
        </div>
      ))}
    </div>
  );
}
