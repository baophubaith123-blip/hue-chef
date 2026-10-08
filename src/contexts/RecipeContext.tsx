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

import { AppError } from '@/lib/errors';

import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';



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

  approveRecipe: (id: string) => Recipe;

  rejectRecipe: (id: string, reason: string) => Recipe;

}



const RecipeContext = createContext<RecipeContextValue | null>(null);



function withDefaultStatus(recipe: Recipe): Recipe {

  return {

    ...recipe,

    status: recipe.status ?? 'approved',

  };

}



function loadInitialRecipes(): Recipe[] {

  const stored = getJsonStorage<Recipe[]>(STORAGE_KEYS.recipes);

  if (!stored || !Array.isArray(stored) || stored.length === 0) {

    const seeded = SEED_RECIPES.map((recipe) => withDefaultStatus(recipe));

    setJsonStorage(STORAGE_KEYS.recipes, seeded);

    return seeded;

  }

  return stored.map((recipe) => withDefaultStatus(recipe));

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

      updateRecipe(id, {

        status: 'pending',

        submittedAt: new Date().toISOString(),

        rejectionReason: undefined,

      });

    },

    [getRecipeById, updateRecipe],

  );



  const approveRecipe = useCallback(

    (id: string): Recipe => {

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

      return updated;

    },

    [getRecipeById, updateRecipe],

  );



  const rejectRecipe = useCallback(

    (id: string, reason: string): Recipe => {

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


