import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/Button';
import { DynamicFormList } from '@/components/DynamicFormList';
import { useIngredients } from '@/contexts/IngredientContext';
import type { RecipeCategory } from '@/data/types';
import type { RecipeFormErrors, RecipeFormValues } from '@/features/editor/types';
import {
  hasRecipeFormErrors,
  validateRecipeForm,
} from '@/features/editor/lib/validate-recipe-form';
import { canSubmitForReview, REQUIRED_ACTION_BY_STARS } from '@/features/recipes/validation';
import { useTranslation } from '@/i18n/useTranslation';

import { MinigameFormList } from './MinigameFormList';
import styles from '@/features/editor/components/RecipeEditorForm.module.css';

export type RecipeFormSubmitMode = 'draft' | 'submit';

interface RecipeEditorFormProps {
  initialValues: RecipeFormValues;
  draftLabel: string;
  submitLabel: string;
  showSubmitButton?: boolean;
  onSubmit: (values: RecipeFormValues, mode: RecipeFormSubmitMode) => void | Promise<void>;
}

const CATEGORIES: RecipeCategory[] = ['bun', 'com', 'banh', 'che', 'nem'];

export function RecipeEditorForm({
  initialValues,
  draftLabel,
  submitLabel,
  showSubmitButton = true,
  onSubmit,
}: RecipeEditorFormProps) {
  const { t, dict } = useTranslation();
  const { ingredients } = useIngredients();
  const [values, setValues] = useState<RecipeFormValues>(initialValues);
  const [errors, setErrors] = useState<RecipeFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const isMinigamesValid = useMemo(() => {
    const ingIds = values.ingredients.map((r) => r.ingredientId).filter(Boolean);
    return canSubmitForReview(values.minigames, values.difficulty, ingIds);
  }, [values.minigames, values.difficulty, values.ingredients]);

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
    if (!runValidation() || !isMinigamesValid) return;
    setSubmitting(true);
    try {
      await onSubmit(values, 'submit');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabels = dict.recipe.categoryLabels;

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
          <select
            id="recipe-category"
            className={styles.select}
            value={values.category}
            onChange={(event) =>
              setValues({ ...values, category: event.target.value as RecipeCategory })
            }
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="recipe-difficulty">
            {t('recipe.difficulty')}
          </label>
          <select
            id="recipe-difficulty"
            className={styles.select}
            value={values.difficulty}
            onChange={(event) =>
              setValues({
                ...values,
                difficulty: Number(event.target.value) as RecipeFormValues['difficulty'],
              })
            }
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
          actionLabel: 'Thực hiện',
        })}
        addLabel={t('recipe.addStep')}
        itemLabel={t('recipe.step')}
        minItems={3}
        renderItem={(item, _index, update) => (
          <div className={styles.stepRow}>
            <input
              className={styles.input}
              placeholder={t('recipe.title')}
              value={item.title}
              onChange={(event) => update({ title: event.target.value })}
            />
            <input
              className={styles.input}
              placeholder={t('recipe.description')}
              value={item.description}
              onChange={(event) => update({ description: event.target.value })}
            />
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

      <div className={styles.actions}>
        <Button type="submit" disabled={submitting}>
          {submitting ? '…' : draftLabel}
        </Button>
        {showSubmitButton ? (
          <Button
            type="button"
            variant="secondary"
            disabled={submitting || !isMinigamesValid}
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
    </form>
  );
}
