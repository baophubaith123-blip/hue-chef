import { GoldButton, WoodButton } from '@/components/theme-d';
import { qualityBandForLevel } from '@/features/stall/lib/pricing-sell';
import type { CookedBatch } from '@/features/stall/types';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/events/components/FeastResultPanel.module.css';

interface FeastResultPanelProps {
  batch: CookedBatch;
  recipeName: string;
  recipeImage: string;
  /** Expected feast price in xu (feast factor + stall income factor). */
  pricePreview: number;
  canRetry: boolean;
  /** Set once the feast has been served to the village. */
  served: { xu: number; exp: number } | null;
  onServe: () => void;
  onDiscard: () => void;
  onRetry: () => void;
  onBack: () => void;
}

/**
 * End-of-run panel for a village feast cook (Gói H7): same paper card
 * as the sell panel — quality, flavour diagnosis, real cost — but the
 * batch is served to the whole village at once from here, once a day.
 */
export function FeastResultPanel({
  batch,
  recipeName,
  recipeImage,
  pricePreview,
  canRetry,
  served,
  onServe,
  onDiscard,
  onRetry,
  onBack,
}: FeastResultPanelProps) {
  const { dict } = useTranslation();
  const s = dict.stall;
  const f = dict.events.feast;
  const band = qualityBandForLevel(batch.level);
  const spoiled = batch.level === 'spoiled';
  return (
    <div className={styles.overlay}>
      <div className={styles.card} role="dialog" aria-modal="true" aria-label={f.resultTitle}>
        <h2 className={styles.title}>🎉 {f.resultTitle}</h2>
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
        <div className={styles.numbers}>
          <p>
            {s.sellResultCost}: <strong>{batch.cost} xu</strong>
          </p>
          {band.sellable && !spoiled ? (
            <p>
              {s.sellResultPrice}: <strong>{pricePreview} xu</strong>
            </p>
          ) : null}
        </div>
        {spoiled ? (
          <>
            <p className={styles.spoiledNote}>{f.spoiledNote}</p>
            <div className={styles.actions}>
              <WoodButton onClick={onDiscard}>{f.discardButton}</WoodButton>
              <GoldButton onClick={onBack}>{f.backToStall}</GoldButton>
            </div>
          </>
        ) : served ? (
          <>
            <p className={styles.servedLine}>{f.servedLine(served.xu, served.exp)}</p>
            <div className={styles.actions}>
              <GoldButton onClick={onBack}>{f.backToStall}</GoldButton>
            </div>
          </>
        ) : (
          <div className={styles.actions}>
            <WoodButton onClick={onDiscard}>{f.discardButton}</WoodButton>
            {canRetry ? (
              <WoodButton onClick={onRetry}>{f.retryButton}</WoodButton>
            ) : null}
            <GoldButton onClick={onServe}>
              {f.serveButton} · {pricePreview} xu
            </GoldButton>
          </div>
        )}
      </div>
    </div>
  );
}
