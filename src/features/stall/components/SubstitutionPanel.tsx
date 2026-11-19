import { useState } from 'react';

import { getIngredientById } from '@/data/ingredients';
import { GoldButton } from '@/components/theme-d';
import {
  REQUEST_ICONS,
  type ApplicableRequest,
  type SubstitutionOption,
} from '@/features/stall/lib/substitutions';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/stall/components/SubstitutionPanel.module.css';

interface SubstitutionPanelProps {
  request: ApplicableRequest;
  /** The option the cook has confirmed, once confirmed. */
  chosen: SubstitutionOption | null;
  onConfirm: (option: SubstitutionOption) => void;
}

function ingredientName(ingredientId: string): string {
  return getIngredientById(ingredientId)?.name ?? ingredientId;
}

function ingredientChip(ingredientId: string): string {
  const ingredient = getIngredientById(ingredientId);
  return `${ingredient?.fallbackEmoji ?? '•'} ${ingredient?.name ?? ingredientId}`;
}

/**
 * The picky customer's substitution choice (Kế hoạch hợp nhất, mục
 * 6.3, Gói H5): shown during a sell cook whose order carries a special
 * request. The cook picks ONE handling — substitute by the dish's law,
 * a tempting wrong swap, or keep the original recipe — and confirms.
 * The panel never reveals which option the law blesses; the verdict
 * lands on the finished batch (quality kept, or −25 and a diagnosis).
 */
export function SubstitutionPanel({ request, chosen, onConfirm }: SubstitutionPanelProps) {
  const { dict } = useTranslation();
  const s = dict.stall;
  const [pickedId, setPickedId] = useState<string | null>(null);

  const requestName = s.requestNames[request.kind] ?? request.kind;
  const offenderNames = request.offenderIds.map(ingredientName).join(', ');

  const optionLabel = (option: SubstitutionOption): string => {
    if (option.action === 'replace' && option.substituteId) {
      return s.subOptionReplace(offenderNames, ingredientName(option.substituteId));
    }
    if (option.action === 'remove') return s.subOptionRemove(offenderNames);
    return s.subOptionKeep;
  };

  if (chosen) {
    return (
      <div className={styles.chosenCard} role="status">
        <span className={styles.chosenIcon} aria-hidden>
          {REQUEST_ICONS[request.kind]}
        </span>
        <span>
          {s.requestChip(requestName)} · {s.subChosenNote(optionLabel(chosen))}
        </span>
      </div>
    );
  }

  const picked = request.options.find((option) => option.id === pickedId) ?? null;

  return (
    <section className={styles.card} aria-label={s.subPanelTitle}>
      <h3 className={styles.title}>
        <span aria-hidden>{REQUEST_ICONS[request.kind]}</span> {s.subPanelTitle}
      </h3>
      <p className={styles.body}>{s.subPanelBody(requestName, offenderNames)}</p>
      <p className={styles.offenders}>
        {request.offenderIds.map((id) => (
          <span key={id} className={styles.offenderChip}>
            {ingredientChip(id)}
          </span>
        ))}
      </p>
      <div className={styles.options} role="radiogroup" aria-label={s.subPanelTitle}>
        {request.options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={pickedId === option.id}
            className={pickedId === option.id ? styles.optionPicked : styles.option}
            onClick={() => setPickedId(option.id)}
          >
            {optionLabel(option)}
          </button>
        ))}
      </div>
      <div className={styles.footer}>
        <span className={styles.penalty}>⚠ {s.subPenaltyNote}</span>
        <GoldButton disabled={!picked} onClick={() => picked && onConfirm(picked)}>
          {s.subConfirm}
        </GoldButton>
      </div>
    </section>
  );
}
