import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { SEED_INGREDIENTS } from '@/data/ingredients';
import type { Ingredient } from '@/data/types';
import { useRecipes } from '@/contexts/RecipeContext';
import { AppError } from '@/lib/errors';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

export function isEmoji(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  // Match strictly 1 emoji (including compound emojis, ZWJ sequences, variation selectors)
  const emojiRegex =
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})(\uFE0F|\u200D(\p{Extended_Pictographic}|\p{Emoji_Presentation}))*$/u;
  return emojiRegex.test(trimmed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidIngredient(x: unknown): x is Ingredient {
  if (!isRecord(x)) return false;
  return typeof x.id === 'string' && typeof x.name === 'string';
}

function loadStoredIngredients(): Ingredient[] {
  const data = getJsonStorage<unknown>(STORAGE_KEYS.ingredients);
  if (!Array.isArray(data) || data.length === 0) {
    setJsonStorage(STORAGE_KEYS.ingredients, SEED_INGREDIENTS);
    return SEED_INGREDIENTS;
  }

  const valid = data.filter(isValidIngredient);
  if (valid.length === 0) {
    setJsonStorage(STORAGE_KEYS.ingredients, SEED_INGREDIENTS);
    return SEED_INGREDIENTS;
  }

  const seedEmojiMap = new Map(SEED_INGREDIENTS.map((s) => [s.id, s.fallbackEmoji]));
  const result: Ingredient[] = valid.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category || 'other',
    fallbackEmoji: item.fallbackEmoji || seedEmojiMap.get(item.id) || '🍲',
    image: item.image,
    unit: item.unit,
    description: item.description,
  }));

  // Merge in seed ingredients the stored list predates (same pattern as
  // recipes): returning users must see newly added seeds in the pickers.
  const storedIds = new Set(result.map((i) => i.id));
  for (const seed of SEED_INGREDIENTS) {
    if (!storedIds.has(seed.id)) result.push({ ...seed });
  }

  setJsonStorage(STORAGE_KEYS.ingredients, result);
  return result;
}

interface IngredientState {
  ingredients: Ingredient[];
}

type IngredientAction =
  | { type: 'SET'; ingredients: Ingredient[] }
  | { type: 'ADD'; ingredient: Ingredient }
  | { type: 'UPDATE'; id: string; patch: Partial<Ingredient> }
  | { type: 'DELETE'; id: string };

function ingredientReducer(state: IngredientState, action: IngredientAction): IngredientState {
  switch (action.type) {
    case 'SET':
      return { ingredients: action.ingredients };
    case 'ADD':
      return { ingredients: [...state.ingredients, action.ingredient] };
    case 'UPDATE':
      return {
        ingredients: state.ingredients.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item,
        ),
      };
    case 'DELETE':
      return {
        ingredients: state.ingredients.filter((item) => item.id !== action.id),
      };
    default:
      return state;
  }
}

export interface IngredientUsageCheck {
  used: boolean;
  recipeNames: string[];
}

export interface IngredientContextValue {
  ingredients: Ingredient[];
  addIngredient: (data: Omit<Ingredient, 'id'> & { id?: string }) => Ingredient;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, 'id'>>) => Ingredient;
  deleteIngredient: (id: string) => void;
  getIngredientById: (id: string) => Ingredient | undefined;
  isIngredientUsed: (id: string) => IngredientUsageCheck;
}

const IngredientContext = createContext<IngredientContextValue | null>(null);

export function IngredientProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(ingredientReducer, {
    ingredients: loadStoredIngredients(),
  });

  const { recipes } = useRecipes();

  // Sync state when localStorage changes or on mount
  useEffect(() => {
    const list = loadStoredIngredients();
    dispatch({ type: 'SET', ingredients: list });
  }, []);

  const isIngredientUsed = useCallback(
    (id: string): IngredientUsageCheck => {
      const matchedRecipeNames: string[] = [];

      for (const r of recipes) {
        const inIngredients = (r.ingredients ?? []).some((i) => i.ingredientId === id);
        const inSteps = (r.steps ?? []).some((s) => (s.requiredIngredients ?? []).includes(id));
        const inMinigames = (r.minigames ?? []).some(
          (m) => m.type === 'action-cooking' && m.data.ingredientId === id,
        );

        if (inIngredients || inSteps || inMinigames) {
          matchedRecipeNames.push(r.name);
        }
      }

      return {
        used: matchedRecipeNames.length > 0,
        recipeNames: matchedRecipeNames,
      };
    },
    [recipes],
  );

  const addIngredient = useCallback<IngredientContextValue['addIngredient']>(
    (data) => {
      const name = data.name.trim();
      if (!name) {
        throw new AppError('Tên nguyên liệu không được để trống', 'REQUIRED_NAME');
      }

      // Check duplicate name
      const isDuplicate = state.ingredients.some(
        (item) => item.name.toLowerCase().trim() === name.toLowerCase(),
      );
      if (isDuplicate) {
        throw new AppError('Tên nguyên liệu đã tồn tại', 'DUPLICATE_NAME');
      }

      // Check emoji
      const emoji = data.fallbackEmoji ? data.fallbackEmoji.trim() : '';
      if (!emoji || !isEmoji(emoji)) {
        throw new AppError('Biểu tượng emoji là bắt buộc và phải là emoji hợp lệ', 'INVALID_EMOJI');
      }

      const id = data.id || `ing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newIngredient: Ingredient = {
        id,
        name,
        category: data.category || 'other',
        fallbackEmoji: emoji,
        image: data.image,
        unit: data.unit ? data.unit.trim() : undefined,
        description: data.description ? data.description.trim() : undefined,
      };

      const nextList = [...state.ingredients, newIngredient];
      setJsonStorage(STORAGE_KEYS.ingredients, nextList);
      dispatch({ type: 'ADD', ingredient: newIngredient });
      return newIngredient;
    },
    [state.ingredients],
  );

  const updateIngredient = useCallback<IngredientContextValue['updateIngredient']>(
    (id, patch) => {
      const existing = state.ingredients.find((item) => item.id === id);
      if (!existing) {
        throw new AppError('Không tìm thấy nguyên liệu', 'NOT_FOUND');
      }

      if (patch.name !== undefined) {
        const name = patch.name.trim();
        if (!name) {
          throw new AppError('Tên nguyên liệu không được để trống', 'REQUIRED_NAME');
        }
        const isDuplicate = state.ingredients.some(
          (item) => item.id !== id && item.name.toLowerCase().trim() === name.toLowerCase(),
        );
        if (isDuplicate) {
          throw new AppError('Tên nguyên liệu đã tồn tại', 'DUPLICATE_NAME');
        }
      }

      if (patch.fallbackEmoji !== undefined) {
        const emoji = patch.fallbackEmoji.trim();
        if (!emoji || !isEmoji(emoji)) {
          throw new AppError('Biểu tượng emoji là bắt buộc và phải là emoji hợp lệ', 'INVALID_EMOJI');
        }
      }

      const updated: Ingredient = {
        ...existing,
        ...patch,
        name: patch.name !== undefined ? patch.name.trim() : existing.name,
        fallbackEmoji:
          patch.fallbackEmoji !== undefined ? patch.fallbackEmoji.trim() : existing.fallbackEmoji,
        unit: patch.unit !== undefined ? (patch.unit ? patch.unit.trim() : undefined) : existing.unit,
        description:
          patch.description !== undefined
            ? (patch.description ? patch.description.trim() : undefined)
            : existing.description,
      };

      const nextList = state.ingredients.map((item) => (item.id === id ? updated : item));
      setJsonStorage(STORAGE_KEYS.ingredients, nextList);
      dispatch({ type: 'UPDATE', id, patch: updated });
      return updated;
    },
    [state.ingredients],
  );

  const deleteIngredient = useCallback<IngredientContextValue['deleteIngredient']>(
    (id) => {
      const check = isIngredientUsed(id);
      if (check.used) {
        throw new AppError(
          `Không thể xóa nguyên liệu đang được dùng trong: ${check.recipeNames.join(', ')}`,
          'INGREDIENT_IN_USE',
        );
      }

      const nextList = state.ingredients.filter((item) => item.id !== id);
      setJsonStorage(STORAGE_KEYS.ingredients, nextList);
      dispatch({ type: 'DELETE', id });
    },
    [isIngredientUsed, state.ingredients],
  );

  const getIngredientById = useCallback<IngredientContextValue['getIngredientById']>(
    (id) => {
      const found = state.ingredients.find((item) => item.id === id);
      if (found) return found;
      return SEED_INGREDIENTS.find((item) => item.id === id);
    },
    [state.ingredients],
  );

  const value = useMemo<IngredientContextValue>(
    () => ({
      ingredients: state.ingredients,
      addIngredient,
      updateIngredient,
      deleteIngredient,
      getIngredientById,
      isIngredientUsed,
    }),
    [
      state.ingredients,
      addIngredient,
      updateIngredient,
      deleteIngredient,
      getIngredientById,
      isIngredientUsed,
    ],
  );

  return <IngredientContext.Provider value={value}>{children}</IngredientContext.Provider>;
}

export function useIngredients(): IngredientContextValue {
  const ctx = useContext(IngredientContext);
  if (!ctx) {
    throw new AppError('useIngredients must be used within IngredientProvider', 'MISSING_PROVIDER');
  }
  return ctx;
}
