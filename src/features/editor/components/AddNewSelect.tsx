import { useState } from 'react';

import { Button } from '@/components/Button';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/editor/components/AddNewSelect.module.css';

export interface AddNewSelectOption {
  value: string;
  label: string;
}

interface AddNewSelectProps {
  id?: string;
  value: string;
  options: AddNewSelectOption[];
  addOptionLabel: string;
  newPlaceholder: string;
  onChange: (value: string) => void;
  /** Create the new entry; return the value to select, or null to stay. */
  onAddNew: (name: string) => string | null;
  selectClassName?: string;
}

const ADD_NEW = '__add_new__';

/**
 * A select whose last option is "＋ add new…" — choosing it reveals an
 * inline input so the user can register their own entry (category, unit,
 * step action…) instead of being limited to the built-in presets.
 */
export function AddNewSelect({
  id,
  value,
  options,
  addOptionLabel,
  newPlaceholder,
  onChange,
  onAddNew,
  selectClassName,
}: AddNewSelectProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const confirmAdd = () => {
    const name = draft.trim();
    if (!name) return;
    const created = onAddNew(name);
    if (created !== null) {
      onChange(created);
      setDraft('');
      setAdding(false);
    }
  };

  if (adding) {
    return (
      <div className={styles.addRow}>
        <input
          id={id}
          className={styles.input}
          value={draft}
          placeholder={newPlaceholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              confirmAdd();
            }
          }}
        />
        <Button type="button" onClick={confirmAdd}>
          {t('common.add')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setDraft('');
            setAdding(false);
          }}
        >
          {t('common.cancel')}
        </Button>
      </div>
    );
  }

  return (
    <select
      id={id}
      className={selectClassName}
      value={value}
      onChange={(event) => {
        if (event.target.value === ADD_NEW) {
          setAdding(true);
          return;
        }
        onChange(event.target.value);
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      <option value={ADD_NEW}>{addOptionLabel}</option>
    </select>
  );
}
