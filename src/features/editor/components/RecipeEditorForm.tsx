import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { DynamicFormList } from '@/components/DynamicFormList';
import { useAuth } from '@/contexts/AuthContext';
import { useIngredients } from '@/contexts/IngredientContext';
import { useTaxonomy } from '@/contexts/TaxonomyContext';
import type { RecipeGameplayConfig } from '@/data/types';
import type { RecipeFormErrors, RecipeFormValues } from '@/features/editor/types';
import {
  hasRecipeFormErrors,
  validateRecipeForm,
} from '@/features/editor/lib/validate-recipe-form';
import { canSubmitForReview, REQUIRED_ACTION_BY_STARS } from '@/features/recipes/validation';
import { useTranslation } from '@/i18n/useTranslation';
import { SCORE_BANDS, suggestPriceCoins } from '@/lib/pricing';

import { AddNewSelect } from './AddNewSelect';
import { MinigameFormList } from './MinigameFormList';
import { RecipePreviewModal } from './RecipePreviewModal';
import { TaxonomyManager } from './TaxonomyManager';
import styles from '@/features/editor/components/RecipeEditorForm.module.css';

export type RecipeFormSubmitMode = 'draft' | 'submit';

interface RecipeEditorFormProps {
  initialValues: RecipeFormValues;
  draftLabel: string;
  submitLabel: string;
  showSubmitButton?: boolean;
  /** Id of the already-saved recipe (edit mode) — enables the test run
   * inside the preview modal. */
  savedRecipeId?: string;
  onSubmit: (values: RecipeFormValues, mode: RecipeFormSubmitMode) => void | Promise<void>;
}

export function RecipeEditorForm({
  initialValues,
  draftLabel,
  submitLabel,
  showSubmitButton = true,
  savedRecipeId,
  onSubmit,
}: RecipeEditorFormProps) {
  const { t, dict } = useTranslation();
  const { ingredients } = useIngredients();
  const { user } = useAuth();
  const {
    recipeCategoryOptions,
    recipeCategoryLabel,
    addCategory,
    stepActions: customStepActions,
    addStepAction,
  } = useTaxonomy();
  const [values, setValues] = useState<RecipeFormValues>(initialValues);
  const [errors, setErrors] = useState<RecipeFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const isMinigamesValid = useMemo(() => {
    const ingIds = values.ingredients.map((r) => r.ingredientId).filter(Boolean);
    return canSubmitForReview(values.minigames, values.difficulty, ingIds);
  }, [values.minigames, values.difficulty, values.ingredients]);

  // The 5-stage run needs real step ingredients (market/catch/cook stages
  // are generated from them) and at least one quiz for stage ⑤.
  const hasStepIngredients = useMemo(
    () => values.steps.some((step) => (step.requiredIngredients?.length ?? 0) > 0),
    [values.steps],
  );
  const quizCount = useMemo(
    () => (values.minigames ?? []).filter((m) => m.type === 'quiz').length,
    [values.minigames],
  );
  const canSubmitForReviewNow = isMinigamesValid && hasStepIngredients && quizCount >= 1;

  const gameplay = values.gameplay ?? {};
  const setGameplay = (patch: Partial<RecipeGameplayConfig>) => {
    setValues({ ...values, gameplay: { ...gameplay, ...patch } });
  };
  const GAMEPLAY_RANGES: Record<'marketSeconds' | 'catchSpeed' | 'finishSeconds', [number, number]> = {
    marketSeconds: [10, 180],
    catchSpeed: [0.5, 2],
    finishSeconds: [5, 60],
  };
  const setGameplayNumber = (
    key: 'marketSeconds' | 'catchSpeed' | 'finishSeconds',
    raw: string,
  ) => {
    if (raw === '') {
      setGameplay({ [key]: undefined });
      return;
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    const [min, max] = GAMEPLAY_RANGES[key];
    setGameplay({ [key]: Math.min(max, Math.max(min, value)) });
  };
  const stageToggles: Array<{
    key: 'marketEnabled' | 'catchEnabled' | 'seasonEnabled' | 'finishEnabled' | 'quizEnabled';
    label: string;
  }> = [
    { key: 'marketEnabled', label: t('editorGameplay.stageMarket') },
    { key: 'catchEnabled', label: t('editorGameplay.stageCatch') },
    { key: 'seasonEnabled', label: t('editorGameplay.stageSeason') },
    { key: 'finishEnabled', label: t('editorGameplay.stageFinish') },
    { key: 'quizEnabled', label: t('editorGameplay.stageQuiz') },
  ];

  const runValidation = (): boolean => {
    const nextErrors = validateRecipeForm(values);
    const translated: RecipeFormErrors = {};
    for (const [key, value] of Object.entries(nextErrors) as Array<
      [keyof RecipeFormErrors, string | undefined]
    >) {
      translated[key] = value ? t(value) : undefined;
    }
    setErrors(translated);
    return !hasRecipeFormErrors(nextErrors);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!runValidation()) return;
    setSubmitting(true);
    try {
      await onSubmit(values, 'draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!runValidation() || !canSubmitForReviewNow) return;
    setSubmitting(true);
    try {
      await onSubmit(values, 'submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.imagePreviewWrap}>
        {values.image ? (
          <img
            className={styles.imagePreview}
            src={values.image}
            alt={values.name || t('recipe.image')}
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="recipe-name">
          {t('recipe.name')}
        </label>
        <input
          id="recipe-name"
          className={styles.input}
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
        />
        {errors.name ? <p className={styles.error}>{errors.name}</p> : null}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recipe-category">
            {t('recipe.category')}
          </label>
          <AddNewSelect
            id="recipe-category"
            selectClassName={styles.select}
            value={values.category}
            options={recipeCategoryOptions.map((option) => ({
              value: option.id,
              label: recipeCategoryLabel(option.id),
            }))}
            addOptionLabel={t('taxonomy.addCategoryOption')}
            newPlaceholder={t('taxonomy.newCategoryPlaceholder')}
            onChange={(category) => setValues({ ...values, category })}
            onAddNew={(name) => {
              try {
                return addCategory('recipe', name, user?.id ?? 'seed-editor').id;
              } catch {
                return null;
              }
            }}
          />
          <TaxonomyManager kind="recipe" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recipe-difficulty">
            {t('recipe.difficulty')}
          </label>
          <select
            id="recipe-difficulty"
            className={styles.select}
            value={values.difficulty}
            onChange={(event) => {
              const difficulty = Number(
                event.target.value,
              ) as RecipeFormValues['difficulty'];
              if (difficulty === 1) {
                setValues({ ...values, difficulty, baseScore: 400, priceCoins: 0 });
                return;
              }
              const band = SCORE_BANDS[difficulty];
              const baseScore = Math.min(
                band.max,
                Math.max(band.min, values.baseScore || band.min),
              );
              setValues({
                ...values,
                difficulty,
                baseScore,
                priceCoins: suggestPriceCoins(difficulty, baseScore),
              });
            }}
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {'★'.repeat(level)}{'☆'.repeat(5 - level)} · {level}/5
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recipe-duration">
            {t('recipe.duration')}
          </label>
          <input
            id="recipe-duration"
            className={styles.input}
            type="number"
            min={60}
            step={10}
            value={values.duration}
            onChange={(event) =>
              setValues({ ...values, duration: Number(event.target.value) || 0 })
            }
          />
          {errors.duration ? <p className={styles.error}>{errors.duration}</p> : null}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recipe-base-score">
            {dict.editorPricing.baseScore}
          </label>
          <input
            id="recipe-base-score"
            className={styles.input}
            type="number"
            min={0}
            step={25}
            disabled={values.difficulty === 1}
            value={values.difficulty === 1 ? 400 : values.baseScore}
            onChange={(event) =>
              setValues({ ...values, baseScore: Number(event.target.value) || 0 })
            }
          />
          {values.difficulty === 1 ? (
            <p className={styles.hint}>{dict.editorPricing.freeNote}</p>
          ) : (
            <p className={styles.hint}>
              {dict.editorPricing.bandHint(
                SCORE_BANDS[values.difficulty].min,
                SCORE_BANDS[values.difficulty].max,
              )}
            </p>
          )}
          {errors.baseScore ? <p className={styles.error}>{errors.baseScore}</p> : null}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recipe-price-coins">
            {dict.editorPricing.priceCoins}
          </label>
          <input
            id="recipe-price-coins"
            className={styles.input}
            type="number"
            min={0}
            step={5}
            disabled={values.difficulty === 1}
            value={values.difficulty === 1 ? 0 : values.priceCoins}
            onChange={(event) =>
              setValues({ ...values, priceCoins: Number(event.target.value) || 0 })
            }
          />
          {values.difficulty > 1 ? (
            <button
              type="button"
              className={styles.suggestBtn}
              onClick={() =>
                setValues({
                  ...values,
                  priceCoins: suggestPriceCoins(values.difficulty, values.baseScore),
                })
              }
            >
              ↻ {dict.editorPricing.suggest} (
              {suggestPriceCoins(values.difficulty, values.baseScore).toLocaleString()} xu)
            </button>
          ) : null}
          {errors.priceCoins ? <p className={styles.error}>{errors.priceCoins}</p> : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="recipe-image">
          {t('recipe.imageUrl')}
        </label>
        <input
          id="recipe-image"
          className={styles.input}
          placeholder="https://..."
          value={values.image}
          onChange={(event) => setValues({ ...values, image: event.target.value })}
        />
        {errors.image ? <p className={styles.error}>{errors.image}</p> : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="recipe-description">
          {t('recipe.description')}
        </label>
        <textarea
          id="recipe-description"
          className={styles.textarea}
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
        />
        {errors.description ? <p className={styles.error}>{errors.description}</p> : null}
      </div>

      <h3 className={styles.sectionTitle}>{t('recipe.ingredients')}</h3>
      {errors.ingredients ? <p className={styles.error}>{errors.ingredients}</p> : null}
      <DynamicFormList
        items={values.ingredients}
        onChange={(ingredients) => setValues({ ...values, ingredients })}
        createItem={() => ({ ingredientId: '', amount: '' })}
        addLabel={t('recipe.addIngredient')}
        itemLabel={t('recipe.ingredient')}
        minItems={3}
        renderItem={(item, _index, update) => (
          <div className={styles.ingredientRow}>
            <select
              className={styles.select}
              value={item.ingredientId}
              onChange={(event) => update({ ingredientId: event.target.value })}
            >
              <option value="">—</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.fallbackEmoji} {ingredient.name}
                </option>
              ))}
            </select>
            <input
              className={styles.input}
              placeholder={t('recipe.amount')}
              value={item.amount}
              onChange={(event) => update({ amount: event.target.value })}
            />
          </div>
        )}
      />

      <h3 className={styles.sectionTitle}>{t('recipe.steps')}</h3>
      <p className={styles.hint}>{t('editorSteps.intro')}</p>
      {errors.steps ? <p className={styles.error}>{errors.steps}</p> : null}
      <DynamicFormList
        items={values.steps}
        onChange={(steps) => setValues({ ...values, steps })}
        createItem={() => ({
          title: '',
          description: '',
          duration: 30,
          durationSeconds: 30,
          requiredIngredients: [],
          actionLabel: dict.cooking.defaultActionLabel,
        })}
        addLabel={t('recipe.addStep')}
        itemLabel={t('recipe.step')}
        minItems={3}
        renderItem={(item, _index, update) => (
          <div>
            <div className={styles.stepFields}>
              <div className={styles.stepField}>
                <label className={styles.stepFieldLabel}>{t('editorSteps.titleLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={t('editorSteps.titlePlaceholder')}
                  value={item.title}
                  onChange={(event) => update({ title: event.target.value })}
                />
              </div>
              <div className={styles.stepField}>
                <label className={styles.stepFieldLabel}>{t('editorSteps.descLabel')}</label>
                <input
                  className={styles.input}
                  placeholder={t('editorSteps.descPlaceholder')}
                  value={item.description}
                  onChange={(event) => update({ description: event.target.value })}
                />
              </div>
              <div className={styles.stepFieldSmall}>
                <label className={styles.stepFieldLabel}>{t('editorSteps.durationLabel')}</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  step={5}
                  value={item.duration ?? item.durationSeconds ?? 30}
                  onChange={(event) => {
                    const dur = Number(event.target.value) || 0;
                    update({ duration: dur, durationSeconds: dur });
                  }}
                />
                <span className={styles.stepHint}>{t('editorSteps.durationHint')}</span>
              </div>
            </div>
            <div className={styles.stepExtra}>
              <div className={styles.stepField}>
                <label className={styles.stepFieldLabel}>{t('editorGameplay.stepActionLabel')}</label>
                <AddNewSelect
                  selectClassName={styles.select}
                  value={item.actionLabel}
                  options={[
                    ...new Set([
                      ...dict.editorSteps.presetActions,
                      ...customStepActions,
                      ...(item.actionLabel ? [item.actionLabel] : []),
                    ]),
                  ].map((action) => ({ value: action, label: action }))}
                  addOptionLabel={t('taxonomy.addActionOption')}
                  newPlaceholder={t('taxonomy.newActionPlaceholder')}
                  onChange={(actionLabel) => update({ actionLabel })}
                  onAddNew={(name) => {
                    addStepAction(name);
                    return name.trim();
                  }}
                />
                <span className={styles.stepHint}>{t('editorSteps.actionHint')}</span>
              </div>
              <p className={styles.stepHint}>{t('editorSteps.ingredientsHint')}</p>
              <div className={styles.chipRow}>
                <span className={styles.chipLabel}>{t('editorGameplay.stepIngredients')}:</span>
                {values.ingredients
                  .filter((ref) => ref.ingredientId)
                  .map((ref) => {
                    const ing = ingredients.find((i) => i.id === ref.ingredientId);
                    const active = (item.requiredIngredients ?? []).includes(ref.ingredientId);
                    return (
                      <button
                        key={ref.ingredientId}
                        type="button"
                        className={[styles.chip, active ? styles.chipOn : '']
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          const current = item.requiredIngredients ?? [];
                          update({
                            requiredIngredients: active
                              ? current.filter((id) => id !== ref.ingredientId)
                              : [...current, ref.ingredientId],
                          });
                        }}
                      >
                        {ing?.fallbackEmoji} {ing?.name ?? ref.ingredientId}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      />

      <h3 className={styles.sectionTitle}>{t('editorMinigames.title')}</h3>
      <p className={styles.label}>{t('editorMinigames.subtitle')}</p>
      <MinigameFormList
        minigames={values.minigames ?? []}
        onChange={(minigames) => setValues({ ...values, minigames })}
        stars={values.difficulty}
        recipeIngredients={values.ingredients}
      />

      <h3 className={styles.sectionTitle}>{t('editorGameplay.title')}</h3>
      <p className={styles.label}>{t('editorGameplay.subtitle')}</p>
      <div className={styles.toggleGrid}>
        {stageToggles.map((toggle) => (
          <label key={toggle.key} className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={gameplay[toggle.key] !== false}
              onChange={(event) => setGameplay({ [toggle.key]: event.target.checked })}
            />
            {toggle.label}
          </label>
        ))}
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gameplay-market-seconds">
            {t('editorGameplay.marketSeconds')}
          </label>
          <input
            id="gameplay-market-seconds"
            className={styles.input}
            type="number"
            min={10}
            max={180}
            placeholder={t('editorGameplay.autoPlaceholder')}
            value={gameplay.marketSeconds ?? ''}
            onChange={(event) => setGameplayNumber('marketSeconds', event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gameplay-catch-speed">
            {t('editorGameplay.catchSpeed')}
          </label>
          <input
            id="gameplay-catch-speed"
            className={styles.input}
            type="number"
            min={0.5}
            max={2}
            step={0.1}
            placeholder={t('editorGameplay.autoPlaceholder')}
            value={gameplay.catchSpeed ?? ''}
            onChange={(event) => setGameplayNumber('catchSpeed', event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gameplay-finish-seconds">
            {t('editorGameplay.finishSeconds')}
          </label>
          <input
            id="gameplay-finish-seconds"
            className={styles.input}
            type="number"
            min={5}
            max={60}
            placeholder={t('editorGameplay.autoPlaceholder')}
            value={gameplay.finishSeconds ?? ''}
            onChange={(event) => setGameplayNumber('finishSeconds', event.target.value)}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={() => setShowPreview(true)}>
          {t('editorPreview.openButton')}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '…' : draftLabel}
        </Button>
        {showSubmitButton ? (
          <Button
            type="button"
            variant="secondary"
            disabled={submitting || !canSubmitForReviewNow}
            onClick={handleSubmitForReview}
            className={styles.submitBtn}
            title={
              !isMinigamesValid
                ? t('editorMinigames.insufficientAction', {
                    required: REQUIRED_ACTION_BY_STARS[values.difficulty],
                    current: (values.minigames ?? []).filter(
                      (m) => m.type === 'action-cooking',
                    ).length,
                  } as Record<string, unknown>)
                : ''
            }
          >
            {submitting ? '…' : submitLabel}
          </Button>
        ) : null}
      </div>
      {showSubmitButton && !hasStepIngredients ? (
        <p className={styles.hint}>⚠ {t('editorGameplay.needsStepIngredients')}</p>
      ) : null}
      {showSubmitButton && quizCount < 1 ? (
        <p className={styles.hint}>⚠ {t('editorGameplay.needsQuiz')}</p>
      ) : null}
      {showPreview ? (
        <RecipePreviewModal
          values={values}
          savedRecipeId={savedRecipeId}
          canSubmit={showSubmitButton}
          onClose={() => setShowPreview(false)}
          onSubmitForReview={() => {
            setShowPreview(false);
            void handleSubmitForReview();
          }}
        />
      ) : null}
    </form>
  );
}
