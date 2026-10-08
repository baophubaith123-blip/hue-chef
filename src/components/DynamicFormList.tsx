import type { ReactNode } from 'react';

import { Button } from '@/components/Button';

import styles from '@/components/DynamicFormList.module.css';

interface DynamicFormListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  renderItem: (
    item: T,
    index: number,
    update: (patch: Partial<T>) => void,
    remove: () => void,
  ) => ReactNode;
  addLabel: string;
  itemLabel?: string;
  minItems?: number;
}

export function DynamicFormList<T>({
  items,
  onChange,
  createItem,
  renderItem,
  addLabel,
  itemLabel = 'Item',
  minItems = 1,
}: DynamicFormListProps<T>) {
  const updateAt = (index: number, patch: Partial<T>) => {
    onChange(items.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const removeAt = (index: number) => {
    if (items.length <= minItems) {
      return;
    }
    onChange(items.filter((_, idx) => idx !== index));
  };

  const addItem = () => {
    onChange([...items, createItem()]);
  };

  return (
    <div>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={index} className={styles.item}>
            <div className={styles.itemHeader}>
              <p className={styles.itemTitle}>
                {itemLabel} {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                disabled={items.length <= minItems}
                onClick={() => removeAt(index)}
              >
                Remove
              </Button>
            </div>
            {renderItem(item, index, (patch) => updateAt(index, patch), () => removeAt(index))}
          </li>
        ))}
      </ul>
      <div className={styles.addRow}>
        <Button type="button" variant="secondary" onClick={addItem}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
