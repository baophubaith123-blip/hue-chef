import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from 'react';



import { SEED_RECIPES } from '@/data/recipes';
import type { Recipe, RecipeStatus } from '@/data/types';
import type { PublicUser } from '@/features/auth/types';
import { validateMinigames } from '@/features/recipes/validation';
import { AppError } from '@/lib/errors';
import { appendAudit } from '@/features/admin/lib/audit';
import { suggestPriceCoins } from '@/lib/pricing';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

if (import.meta.env.DEV) {
  for (const recipe of SEED_RECIPES) {
    const validIngredientIds = recipe.ingredients.map((i) => i.ingredientId);
    const result = validateMinigames(recipe.minigames, recipe.difficulty, validIngredientIds);
    if (!result.valid) {
      throw new Error(
        `[DEV-VALIDATION-ERROR] Recipe "${recipe.name}" (${recipe.id}, ${recipe.difficulty} stars) failed minigame validation: ${result.errors.join(', ')}`,
      );
    }
  }
}



interface RecipeContextValue {

  recipes: Recipe[];

  isLoading: boolean;

  getRecipeById: (id: string) => Recipe | undefined;

  getApprovedRecipes: () => Recipe[];

  getRecipesByEditor: (editorId: string) => Recipe[];

  getPendingRecipes: () => Recipe[];

  addRecipe: (recipe: Recipe) => void;

  updateRecipe: (id: string, patch: Partial<Recipe>) => void;

  deleteRecipe: (id: string) => void;

  updateRecipeAsEditor: (id: string, editorId: string, patch: Partial<Recipe>) => void;

  deleteRecipeAsEditor: (id: string, editorId: string) => void;

  submitRecipeForReview: (id: string, editorId: string) => void;

  approveRecipe: (id: string, actor?: PublicUser) => Recipe;

  rejectRecipe: (id: string, reason: string, actor?: PublicUser) => Recipe;

}



const RecipeContext = createContext<RecipeContextValue | null>(null);



function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidRecipeObject(x: unknown): x is Recipe {
  if (!isRecord(x)) return false;
  return typeof x.id === 'string' && typeof x.name === 'string';
}

function withDefaultStatus(recipe: Recipe): Recipe {
  return {
    ...recipe,
    status: recipe.status ?? 'approved',
    minigames: Array.isArray(recipe.minigames) ? recipe.minigames : [],
    // Recipes stored before the coin economy existed get a suggested price.
    priceCoins:
      typeof recipe.priceCoins === 'number'
        ? recipe.priceCoins
        : suggestPriceCoins(recipe.difficulty, recipe.baseScore),
  };
}

function loadInitialRecipes(): Recipe[] {
  const stored = getJsonStorage<unknown>(STORAGE_KEYS.recipes);
  const seeded = SEED_RECIPES.map((recipe) => withDefaultStatus(recipe));

  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    setJsonStorage(STORAGE_KEYS.recipes, seeded);
    return seeded;
  }

  const validStored = stored.filter(isValidRecipeObject);
  if (validStored.length === 0) {
    setJsonStorage(STORAGE_KEYS.recipes, seeded);
    return seeded;
  }

  const updatedSeedMap = new Map(seeded.map((r) => [r.id, r]));

  const result = validStored.map((r) => {
    const seedVersion = updatedSeedMap.get(r.id);
    if (seedVersion) {
      // The stored copy wins: edits an admin/editor made to a seed recipe
      // must survive reloads (previously only its status did). Seed fields
      // only backfill values the stored copy predates entirely.
      return withDefaultStatus({
        ...seedVersion,
        ...r,
        status: r.status ?? seedVersion.status,
      });
    }
    return withDefaultStatus(r);
  });

  for (const s of seeded) {
    if (!result.some((r) => r.id === s.id)) {
      result.push(s);
    }
  }

  setJsonStorage(STORAGE_KEYS.recipes, result);
  return result;
}



function assertEditorOwnsRecipe(recipe: Recipe, editorId: string): void {

  if (recipe.editorId !== editorId) {

    throw new AppError('You cannot modify another editor’s recipe', 'FORBIDDEN');

  }

}



function assertEditorEditableStatus(status: RecipeStatus | undefined): void {

  const value = status ?? 'draft';

  if (value === 'pending' || value === 'approved') {

    throw new AppError('Recipe cannot be edited in its current status', 'INVALID_STATUS');

  }

}



export function RecipeProvider({ children }: { children: ReactNode }) {

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {

    setRecipes(loadInitialRecipes());

    setIsLoading(false);

  }, []);



  const persist = useCallback((next: Recipe[]) => {

    setRecipes(next);

    setJsonStorage(STORAGE_KEYS.recipes, next);

  }, []);



  const getRecipeById = useCallback(

    (id: string) => recipes.find((recipe) => recipe.id === id),

    [recipes],

  );



  const getApprovedRecipes = useCallback(

    () => recipes.filter((recipe) => (recipe.status ?? 'approved') === 'approved'),

    [recipes],

  );



  const getRecipesByEditor = useCallback(

    (editorId: string) =>

      recipes.filter((recipe) => recipe.editorId === editorId).sort((a, b) => a.name.localeCompare(b.name, 'vi')),

    [recipes],

  );



  const getPendingRecipes = useCallback(

    () =>

      recipes

        .filter((recipe) => recipe.status === 'pending')

        .sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '')),

    [recipes],

  );



  const addRecipe = useCallback(

    (recipe: Recipe) => {

      persist([...recipes, withDefaultStatus(recipe)]);

    },

    [persist, recipes],

  );



  const updateRecipe = useCallback(

    (id: string, patch: Partial<Recipe>) => {

      const index = recipes.findIndex((recipe) => recipe.id === id);

      if (index === -1) {

        throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND');

      }

      const next = recipes.map((recipe, idx) =>

        idx === index ? { ...recipe, ...patch } : recipe,

      );

      persist(next);

    },

    [persist, recipes],

  );



  const deleteRecipe = useCallback(

    (id: string) => {

      persist(recipes.filter((recipe) => recipe.id !== id));

    },

    [persist, recipes],

  );



  const updateRecipeAsEditor = useCallback(

    (id: string, editorId: string, patch: Partial<Recipe>) => {

      const recipe = getRecipeById(id);

      if (!recipe) {

        throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND');

      }

      assertEditorOwnsRecipe(recipe, editorId);

      assertEditorEditableStatus(recipe.status);

      updateRecipe(id, { ...patch, status: 'draft', rejectionReason: undefined });

    },

    [getRecipeById, updateRecipe],

  );



  const deleteRecipeAsEditor = useCallback(

    (id: string, editorId: string) => {

      const recipe = getRecipeById(id);

      if (!recipe) {

        throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND');

      }

      assertEditorOwnsRecipe(recipe, editorId);

      if ((recipe.status ?? 'draft') === 'approved') {

        throw new AppError('Approved recipes cannot be deleted', 'INVALID_STATUS');

      }

      deleteRecipe(id);

    },

    [deleteRecipe, getRecipeById],

  );



  const submitRecipeForReview = useCallback(

    (id: string, editorId: string) => {

      const recipe = getRecipeById(id);

      if (!recipe) {

        throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND');

      }

      assertEditorOwnsRecipe(recipe, editorId);

      const status = recipe.status ?? 'draft';

      if (status !== 'draft' && status !== 'rejected') {

        throw new AppError('Only draft or rejected recipes can be submitted', 'INVALID_STATUS');

      }

      // Content gate enforced HERE (not only in the form): the detail page
      // submits through this same path, so a dish must be complete no
      // matter which screen sends it for review.
      const hasStepIngredients = (recipe.steps ?? []).some(
        (s) => (s.requiredIngredients ?? []).length > 0,
      );
      const quizCount = (recipe.minigames ?? []).filter((m) => m.type === 'quiz').length;
      const minigameCheck = validateMinigames(
        recipe.minigames,
        recipe.difficulty,
        recipe.ingredients.map((i) => i.ingredientId),
      );
      if (!hasStepIngredients || quizCount < 1 || !minigameCheck.valid) {
        throw new AppError('Recipe content is incomplete', 'RECIPE_INCOMPLETE');
      }

      updateRecipe(id, {

        status: 'pending',

        submittedAt: new Date().toISOString(),

        rejectionReason: undefined,

      });

    },

    [getRecipeById, updateRecipe],

  );



  const approveRecipe = useCallback(

    (id: string, actor?: PublicUser): Recipe => {

      const recipe = getRecipeById(id);

      if (!recipe) {

        throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND');

      }

      if (recipe.status !== 'pending') {

        throw new AppError('Recipe is not pending review', 'INVALID_STATUS');

      }

      const updated: Recipe = {

        ...recipe,

        status: 'approved',

        reviewedAt: new Date().toISOString(),

        rejectionReason: undefined,

      };

      updateRecipe(id, updated);

      appendAudit(actor ?? null, 'recipe.approve', {

        targetId: id,

        targetType: 'recipe',

        detail: { name: updated.name },

      });

      return updated;

    },

    [getRecipeById, updateRecipe],

  );



  const rejectRecipe = useCallback(

    (id: string, reason: string, actor?: PublicUser): Recipe => {

      const trimmed = reason.trim();

      if (!trimmed) {

        throw new AppError('Rejection reason is required', 'VALIDATION');

      }

      const recipe = getRecipeById(id);

      if (!recipe) {

        throw new AppError('Recipe not found', 'RECIPE_NOT_FOUND');

      }

      if (recipe.status !== 'pending') {

        throw new AppError('Recipe is not pending review', 'INVALID_STATUS');

      }

      const updated: Recipe = {

        ...recipe,

        status: 'rejected',

        reviewedAt: new Date().toISOString(),

        rejectionReason: trimmed,

      };

      updateRecipe(id, updated);

      appendAudit(actor ?? null, 'recipe.reject', {

        targetId: id,

        targetType: 'recipe',

        detail: { name: updated.name, reason: trimmed },

      });

      return updated;

    },

    [getRecipeById, updateRecipe],

  );



  const value = useMemo(

    () => ({

      recipes,

      isLoading,

      getRecipeById,

      getApprovedRecipes,

      getRecipesByEditor,

      getPendingRecipes,

      addRecipe,

      updateRecipe,

      deleteRecipe,

      updateRecipeAsEditor,

      deleteRecipeAsEditor,

      submitRecipeForReview,

      approveRecipe,

      rejectRecipe,

    }),

    [

      recipes,

      isLoading,

      getRecipeById,

      getApprovedRecipes,

      getRecipesByEditor,

      getPendingRecipes,

      addRecipe,

      updateRecipe,

      deleteRecipe,

      updateRecipeAsEditor,

      deleteRecipeAsEditor,

      submitRecipeForReview,

      approveRecipe,

      rejectRecipe,

    ],

  );



  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;

}



export function useRecipes(): RecipeContextValue {

  const ctx = useContext(RecipeContext);

  if (!ctx) {

    throw new AppError('useRecipes must be used within RecipeProvider', 'RECIPE_CONTEXT');

  }

  return ctx;

}



export type { RecipeStatus };


