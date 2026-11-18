import styles from '@/components/theme-d/IngredientTray.module.css';

export interface IngredientTrayItem {
  id: string;
  label: string;
  imageSrc?: string;
  selected?: boolean;
  disabled?: boolean;
}

interface IngredientTrayProps {
  items: IngredientTrayItem[];
  onSelect?: (id: string) => void;
  ariaLabel: string;
}

/** Theme D ingredient tray — wooden divided tray, one plate per ingredient (Kế hoạch 1, Phần 2.2). */
export function IngredientTray({ items, onSelect, ariaLabel }: IngredientTrayProps) {
  return (
    <div className={styles.tray} role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.cell} ${item.selected ? styles.selected : ''}`}
          disabled={item.disabled}
          aria-pressed={item.selected || undefined}
          onClick={() => onSelect?.(item.id)}
        >
          <span className={styles.plate}>
            {item.imageSrc ? <img className={styles.plateImg} src={item.imageSrc} alt="" aria-hidden /> : null}
          </span>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
