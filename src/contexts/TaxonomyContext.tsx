import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { AppError } from '@/lib/errors';
import {
  categoryLabel,
  loadTaxonomy,
  makeCategoryId,
  PRESET_INGREDIENT_CATEGORY_IDS,
  PRESET_RECIPE_CATEGORY_IDS,
  PRESET_UNITS,
  saveTaxonomy,
  type CustomCategory,
  type TaxonomyData,
} from '@/lib/taxonomy';
import { useTranslation } from '@/i18n/useTranslation';

export interface CategoryOption {
  id: string;
  custom?: CustomCategory;
}

interface TaxonomyContextValue {
  data: TaxonomyData;
  recipeCategoryOptions: CategoryOption[];
  ingredientCategoryOptions: CategoryOption[];
  recipeCategoryLabel: (id: string) => string;
  ingredientCategoryLabel: (id: string) => string;
  addCategory: (kind: 'recipe' | 'ingredient', name: string, createdBy: string) => CustomCategory;
  removeCategory: (id: string, kind: 'recipe' | 'ingredient') => void;
  units: string[];
  addUnit: (name: string) => void;
  stepActions: string[];
  addStepAction: (name: string) => void;
}

const TaxonomyContext = createContext<TaxonomyContextValue | null>(null);

export function TaxonomyProvider({ children }: { children: ReactNode }) {
  const { dict, locale } = useTranslation();
  const [data, setData] = useState<TaxonomyData>(() => loadTaxonomy());

  const persist = useCallback((next: TaxonomyData) => {
    setData(next);
    saveTaxonomy(next);
  }, []);

  const addCategory = useCallback<TaxonomyContextValue['addCategory']>(
    (kind, name, createdBy) => {
      const trimmed = name.trim();
      if (!trimmed) {
        throw new AppError('Category name is required', 'REQUIRED');
      }
      const presetIds = kind === 'recipe' ? PRESET_RECIPE_CATEGORY_IDS : PRESET_INGREDIENT_CATEGORY_IDS;
      const taken = new Set<string>([
        ...presetIds,
        ...data.categories.filter((c) => c.kind === kind).map((c) => c.id),
      ]);
      const nameTaken = data.categories.some(
        (c) => c.kind === kind && c.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (nameTaken) {
        throw new AppError('Category already exists', 'DUPLICATE_CATEGORY');
      }
      const entry: CustomCategory = {
        id: makeCategoryId(trimmed, taken),
        name: trimmed,
        kind,
        createdBy,
        createdAt: new Date().toISOString(),
      };
      persist({ ...data, categories: [...data.categories, entry] });
      return entry;
    },
    [data, persist],
  );

  const removeCategory = useCallback<TaxonomyContextValue['removeCategory']>(
    (id, kind) => {
      persist({
        ...data,
        categories: data.categories.filter((c) => !(c.id === id && c.kind === kind)),
      });
    },
    [data, persist],
  );

  const addUnit = useCallback<TaxonomyContextValue['addUnit']>(
    (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const all = [...PRESET_UNITS, ...data.units];
      if (all.some((u) => u.toLowerCase() === trimmed.toLowerCase())) return;
      persist({ ...data, units: [...data.units, trimmed] });
    },
    [data, persist],
  );

  const addStepAction = useCallback<TaxonomyContextValue['addStepAction']>(
    (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (data.stepActions.some((a) => a.toLowerCase() === trimmed.toLowerCase())) return;
      persist({ ...data, stepActions: [...data.stepActions, trimmed] });
    },
    [data, persist],
  );

  const value = useMemo<TaxonomyContextValue>(() => {
    const recipeCustoms = data.categories.filter((c) => c.kind === 'recipe');
    const ingredientCustoms = data.categories.filter((c) => c.kind === 'ingredient');
    return {
      data,
      recipeCategoryOptions: [
        ...PRESET_RECIPE_CATEGORY_IDS.map((id) => ({ id })),
        ...recipeCustoms.map((c) => ({ id: c.id, custom: c })),
      ],
      ingredientCategoryOptions: [
        ...PRESET_INGREDIENT_CATEGORY_IDS.map((id) => ({ id })),
        ...ingredientCustoms.map((c) => ({ id: c.id, custom: c })),
      ],
      recipeCategoryLabel: (id) =>
        categoryLabel(id, dict.recipe.categoryLabels, recipeCustoms, locale),
      ingredientCategoryLabel: (id) =>
        categoryLabel(id, dict.editor.ingredientCategoryLabels, ingredientCustoms, locale),
      addCategory,
      removeCategory,
      units: [...PRESET_UNITS, ...data.units],
      addUnit,
      stepActions: data.stepActions,
      addStepAction,
    };
  }, [data, dict, locale, addCategory, removeCategory, addUnit, addStepAction]);

  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>;
}

export function useTaxonomy(): TaxonomyContextValue {
  const ctx = useContext(TaxonomyContext);
  if (!ctx) {
    throw new AppError('useTaxonomy must be used within TaxonomyProvider', 'MISSING_PROVIDER');
  }
  return ctx;
}
