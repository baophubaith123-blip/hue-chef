import styles from '@/components/theme-d/CoinPill.module.css';

export type CoinCurrency = 'xu' | 'cok';

interface CoinPillProps {
  amount: number;
  currency?: CoinCurrency;
  label?: string;
  className?: string;
}

/** Theme D currency pill — gold coin for xu, ruby gem for cok (Kế hoạch 1, Phần 2.2). */
export function CoinPill({ amount, currency = 'xu', label, className = '' }: CoinPillProps) {
  const formatted = amount.toLocaleString('vi-VN');
  const text = label ?? (currency === 'xu' ? 'xu' : 'cok');
  return (
    <span className={`${styles.pill} ${currency === 'cok' ? styles.cok : styles.xu} ${className}`}>
      {currency === 'xu' ? (
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden focusable="false">
          <circle cx="12" cy="12" r="10" fill="#f6c453" stroke="#a86e14" strokeWidth="2" />
          <circle cx="12" cy="12" r="6" fill="none" stroke="#a86e14" strokeWidth="1.6" />
          <path d="M12 8.2v7.6M9.4 10.2c.7-1 1.6-1.4 2.6-1.4 1.4 0 2.4.8 2.4 1.9 0 2.6-4.9 1.5-4.9 3.9 0 1.1 1.1 1.9 2.5 1.9 1 0 1.9-.4 2.6-1.3" fill="none" stroke="#8a5a00" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden focusable="false">
          <path d="M7 3h10l3.5 6L12 21 3.5 9z" fill="#f43f5e" stroke="#881337" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M3.5 9h17M12 21 8.8 9l2-6M12 21l3.2-12-2-6" fill="none" stroke="#881337" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M8 6.2 6.2 8.4M16.5 5.5l-1.2 2" stroke="#ffe4e6" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
      <span className={styles.amount}>{formatted}</span>
      <span className={styles.label}>{text}</span>
    </span>
  );
}
