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
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
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

  const value = useMemo(
    () => ({
      recipes,
      isLoading,
      getRecipeById,
      getApprovedRecipes,
      addRecipe,
      updateRecipe,
      deleteRecipe,
    }),
    [recipes, isLoading, getRecipeById, getApprovedRecipes, addRecipe, updateRecipe, deleteRecipe],
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
