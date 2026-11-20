import { GoldButton, WoodButton } from '@/components/theme-d';
import { qualityBandForLevel } from '@/features/stall/lib/pricing-sell';
import type { CookedBatch } from '@/features/stall/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/stall/components/SellResultPanel.module.css';

interface SellResultPanelProps {
  batch: CookedBatch;
  recipeName: string;
  recipeImage: string;
  /** Expected stall price before tip (0 when the batch cannot be sold). */
  pricePreview: number;
  canRetry: boolean;
  onBackToStall: () => void;
  onRetry: () => void;
}

/**
 * End-of-run panel for a sell cook (Kế hoạch hợp nhất, mục 6.5): the
 * batch's quality level, its flavour diagnosis and the capital-law
 * numbers — the player then carries it back to the stall and decides
 * there whether to serve or discard it.
 */
export function SellResultPanel({
  batch,
  recipeName,
  recipeImage,
  pricePreview,
  canRetry,
  onBackToStall,
  onRetry,
}: SellResultPanelProps) {
  const { dict } = useTranslation();
  const s = dict.stall;
  const band = qualityBandForLevel(batch.level);
  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={s.sellResultTitle}>
        <div className={styles.ledger}>
          <h2 className={styles.ledgerTitle}>{s.sellResultTitle}</h2>
          <div className={styles.panelBody}>
        <div className={styles.dishRow}>
          <img src={recipeImage} alt="" className={styles.dishImg} />
          <div>
            <strong>{recipeName}</strong>
            <p className={styles[`quality_${batch.level}`]}>
              {s.sellResultQuality}: {s.qualityNames[batch.level]} · {batch.qualityScore}/100
            </p>
          </div>
        </div>
        <p className={styles.label}>{s.sellResultDiagnosis}</p>
        <ul className={styles.diagnosis}>
          {batch.diagnosis.map((key) => (
            <li key={key}>{s.diagnosisNames[key] ?? key}</li>
          ))}
        </ul>
        {batch.requestOutcome ? (
          <p className={batch.requestOutcome === 'ok' ? styles.requestOk : styles.requestBad}>
            {batch.requestOutcome === 'ok'
              ? s.sellResultRequestOk
              : batch.requestOutcome === 'wrong'
                ? s.sellResultRequestWrong
                : s.sellResultRequestIgnored}
          </p>
        ) : null}
        <div className={styles.numbers}>
          <p>
            {s.sellResultCost}: <strong>{batch.cost} xu</strong>
          </p>
          {band.sellable ? (
            <p>
              {s.sellResultPrice}: <strong>{pricePreview} xu</strong>
            </p>
          ) : (
            <p className={styles.spoiledNote}>{s.sellResultSpoiled}</p>
          )}
        </div>
        <div className={styles.actions}>
          <WoodButton disabled={!canRetry} onClick={onRetry}>
            🔄 {canRetry ? s.sellRetry : s.sellRetryBlocked}
          </WoodButton>
          <GoldButton onClick={onBackToStall}>🏪 {s.sellToCounter}</GoldButton>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
