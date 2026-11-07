import { getIngredientById } from '@/data/ingredients';
import { useDragDrop } from '@/features/cooking/hooks/useDragDrop';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/cooking/components/CookingPot.module.css';

export interface PotDropFx {
  key: number;
  ingredientName: string;
  points: number;
}

interface CookingPotProps {
  disabled?: boolean;
  onDropOnPot: (ingredientId: string) => void;
  shake?: boolean;
  sparkle?: boolean;
  potIngredients: string[];
  requiredCount?: number;
  actionButtonLabel: string | null;
  onExecuteAction: () => void;
  /** Current combo streak (badge shows from ×2). */
  comboStreak?: number;
  /** Timestamp of the last correct drop — restarts the badge countdown bar. */
  lastComboAt?: number | null;
  /** Transient "+points" popup + "added to pot" pill after a correct drop. */
  dropFx?: PotDropFx | null;
}

export function CookingPot({
  disabled = false,
  onDropOnPot,
  shake = false,
  sparkle = false,
  potIngredients,
  requiredCount = 0,
  actionButtonLabel,
  onExecuteAction,
  comboStreak = 0,
  lastComboAt = null,
  dropFx = null,
}: CookingPotProps) {
  const { t } = useTranslation();
  const { potActive, potDropZoneProps } = useDragDrop({ onDropOnPot });

  return (
    <section className={styles.column} aria-label={t('cooking.pot')}>
      <h2 className={styles.title}>{t('cooking.pot')}</h2>
      <div
        className={[
          styles.pot,
          potActive && !disabled ? styles.potActive : '',
          shake ? styles.potShake : '',
          sparkle ? styles.potSparkle : '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...(disabled ? {} : potDropZoneProps)}
      >
        {comboStreak >= 2 ? (
          <span className={styles.comboBadge} aria-live="polite">
            🔥 {t('cooking.comboLabel')} ×{comboStreak}
            <span key={lastComboAt ?? 0} className={styles.comboTimerBar} aria-hidden />
          </span>
        ) : null}
        {dropFx ? (
          <div key={dropFx.key} className={styles.fxWrap} aria-hidden>
            <span className={styles.fxPoints}>+{dropFx.points} ✓</span>
            <span className={styles.fxPill}>
              {t('cooking.addedToPot', { name: dropFx.ingredientName })}
            </span>
          </div>
        ) : null}
        <div className={styles.potInner}>
          <div className={styles.potStage} aria-hidden>
            <span className={`${styles.steamPuff} ${styles.steamPuff1}`} />
            <span className={`${styles.steamPuff} ${styles.steamPuff2}`} />
            <span className={`${styles.steamPuff} ${styles.steamPuff3}`} />
            <img src="/images/noi-noi-2d.webp" alt="" className={styles.potImg} />
          </div>
          <p className={styles.potHint}>
            {disabled ? t('cooking.sessionEnded') : t('cooking.dropIngredientsHere')}
          </p>
          {requiredCount > 0 ? (
            <div className={styles.slotsWrap}>
              <div className={styles.slots} aria-hidden>
                {Array.from({ length: requiredCount }).map((_, slotIdx) => (
                  <span
                    key={slotIdx}
                    className={[
                      styles.slot,
                      slotIdx < potIngredients.length ? styles.slotFilled : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                ))}
              </div>
              <p className={styles.potCount}>
                {t('cooking.potProgress', { placed: potIngredients.length, total: requiredCount })}
              </p>
            </div>
          ) : null}
          {potIngredients.length > 0 ? (
            <div className={styles.chips}>
              {potIngredients.map((id, index) => {
                const ing = getIngredientById(id);
                return (
                  <span key={`${id}-${index}`} className={styles.chip}>
                    {ing?.fallbackEmoji ? `${ing.fallbackEmoji} ` : ''}
                    {ing?.name || id}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className={styles.potCount}>{t('cooking.potEmpty')}</p>
          )}
        </div>
      </div>

      {!disabled && actionButtonLabel ? (
        <button
          type="button"
          className={styles.actionButton}
          onClick={onExecuteAction}
        >
          ✨ {actionButtonLabel}
        </button>
      ) : null}
    </section>
  );
}
