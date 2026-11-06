import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useIngredients } from '@/contexts/IngredientContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import type { RecipeFormValues } from '@/features/editor/types';
import { MinigameSummary } from '@/features/recipes/components/MinigameSummary';
import { canSubmitForReview } from '@/features/recipes/validation';
import { formatDuration } from '@/lib/format';
import { useTranslation } from '@/i18n/useTranslation';

import styles from '@/features/editor/components/RecipePreviewModal.module.css';

interface RecipePreviewModalProps {
  values: RecipeFormValues;
  /** Set when the recipe already exists (saved draft) — enables test-run. */
  savedRecipeId?: string;
  canSubmit: boolean;
  onClose: () => void;
  onSubmitForReview: () => void;
}

interface CheckItem {
  ok: boolean;
  label: string;
}

/**
 * "Xem trước công thức": renders the recipe exactly as players will see it
 * and runs the pre-submit checklist, so the editor can verify everything is
 * sensible before sending it to the admin.
 */
export function RecipePreviewModal({
  values,
  savedRecipeId,
  canSubmit,
  onClose,
  onSubmitForReview,
}: RecipePreviewModalProps) {
  const { t, dict } = useTranslation();
  const { ingredients } = useIngredients();
  const { recipeCategoryLabel } = useTaxonomy();

  const chosenIngredients = values.ingredients.filter((ref) => ref.ingredientId);
  const quizCount = (values.minigames ?? []).filter((m) => m.type === 'quiz').length;
  const minigamesOk = canSubmitForReview(
    values.minigames,
    values.difficulty,
    chosenIngredients.map((ref) => ref.ingredientId),
  );

  const checks: CheckItem[] = [
    { ok: values.name.trim() !== '', label: t('editorPreview.checkName') },
    { ok: values.image.trim() !== '', label: t('editorPreview.checkImage') },
    { ok: values.description.trim() !== '', label: t('editorPreview.checkDescription') },
    {
      ok:
        chosenIngredients.length >= 3 &&
        chosenIngredients.every((ref) => ref.amount.trim() !== ''),
      label: t('editorPreview.checkIngredients'),
    },
    {
      ok:
        values.steps.length >= 1 &&
        values.steps.every((s) => s.title.trim() !== '' && s.description.trim() !== '') &&
        values.steps.some((s) => (s.requiredIngredients?.length ?? 0) > 0),
      label: t('editorPreview.checkSteps'),
    },
    { ok: quizCount >= 1, label: t('editorPreview.checkQuiz') },
    { ok: minigamesOk, label: t('editorPreview.checkMinigames') },
  ];
  const allOk = checks.every((c) => c.ok);

  const gameplay = values.gameplay ?? {};
  const stageRows: Array<{ label: string; on: boolean }> = [
    { label: t('editorGameplay.stageMarket'), on: gameplay.marketEnabled !== false },
    { label: t('editorGameplay.stageCatch'), on: gameplay.catchEnabled !== false },
    { label: t('editorGameplay.stageSeason'), on: gameplay.seasonEnabled !== false },
    { label: t('editorGameplay.stageFinish'), on: gameplay.finishEnabled !== false },
    { label: t('editorGameplay.stageQuiz'), on: gameplay.quizEnabled !== false },
  ];

  const ingredientName = (id: string): string =>
    ingredients.find((i) => i.id === id)?.name ?? id;

  return (
    <Modal
      title={t('editorPreview.title')}
      isOpen
      onClose={onClose}
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            {t('common.close')}
          </Button>
          {savedRecipeId ? (
            <Link to={`/cooking/${savedRecipeId}?preview=1`}>
              <Button variant="secondary">🎮 {t('editorGameplay.tryRun')}</Button>
            </Link>
          ) : null}
          {canSubmit ? (
            <Button onClick={onSubmitForReview} disabled={!allOk}>
              {t('editorPreview.submitNow')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className={styles.body}>
        {values.image ? (
          <img
            className={styles.hero}
            src={values.image}
            alt={values.name}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <h3 className={styles.name}>{values.name || '—'}</h3>
        <p className={styles.meta}>
          {recipeCategoryLabel(values.category)} · {formatDuration(values.duration)} ·{' '}
          {'★'.repeat(values.difficulty)} {dict.recipe.difficultyNames[values.difficulty - 1] ?? ''} ·{' '}
          {values.baseScore} {t('recipe.pts')}
          {values.priceCoins > 0 ? ` · ${values.priceCoins.toLocaleString()} xu` : ''}
        </p>
        <p className={styles.description}>{values.description}</p>

        <h4 className={styles.sectionTitle}>{t('recipe.ingredients')}</h4>
        {chosenIngredients.length === 0 ? (
          <p className={styles.muted}>—</p>
        ) : (
          <ul className={styles.list}>
            {chosenIngredients.map((ref) => (
              <li key={ref.ingredientId}>
                {ingredientName(ref.ingredientId)} — {ref.amount}
              </li>
            ))}
          </ul>
        )}

        <h4 className={styles.sectionTitle}>{t('recipe.steps')}</h4>
        {values.steps.length === 0 ? (
          <p className={styles.muted}>—</p>
        ) : (
          <ol className={styles.list}>
            {values.steps.map((step, idx) => (
              <li key={idx}>
                <strong>{step.title || '—'}</strong>
                {step.actionLabel ? <span className={styles.actionChip}>{step.actionLabel}</span> : null}
                <div className={styles.stepDesc}>{step.description}</div>
              </li>
            ))}
          </ol>
        )}

        <h4 className={styles.sectionTitle}>
          🎮 {t('editorMinigames.summaryTitle')} · {(values.minigames ?? []).length}
        </h4>
        <MinigameSummary minigames={values.minigames ?? []} />

        <h4 className={styles.sectionTitle}>{t('editorPreview.stagesTitle')}</h4>
        <ul className={styles.stageList}>
          {stageRows.map((row) => (
            <li key={row.label} className={styles.stageItem}>
              <span>{row.label}</span>
              <span className={row.on ? styles.stageOn : styles.stageOff}>
                {row.on ? t('editorPreview.stageOn') : t('editorPreview.stageOff')}
              </span>
            </li>
          ))}
        </ul>

        <h4 className={styles.sectionTitle}>✅ {t('editorPreview.checklistTitle')}</h4>
        <ul className={styles.checkList}>
          {checks.map((check) => (
            <li key={check.label} className={check.ok ? styles.checkOk : styles.checkFail}>
              {check.ok ? '✓' : '✗'} {check.label}
            </li>
          ))}
        </ul>
        {!savedRecipeId ? <p className={styles.hint}>{t('editorPreview.runTestNeedSave')}</p> : null}
      </div>
    </Modal>
  );
}
