import type { Recipe } from '@/data/types';
import type { RecipeFilterState } from '@/features/recipes/components/RecipeFilter';
import { normalizeSearchText } from '@/lib/slug';

export function filterAndSortRecipes(recipes: Recipe[], filters: RecipeFilterState): Recipe[] {
  let list = [...recipes];

  if (filters.category !== 'all') {
    list = list.filter((recipe) => recipe.category === filters.category);
  }

  if (filters.difficulty !== 'all') {
    const level = Number(filters.difficulty) as Recipe['difficulty'];
    list = list.filter((recipe) => recipe.difficulty === level);
  }

  const query = normalizeSearchText(filters.search);
  if (query) {
    list = list.filter((recipe) => {
      const name = normalizeSearchText(recipe.name);
      const description = normalizeSearchText(recipe.description);
      return name.includes(query) || description.includes(query);
    });
  }

  switch (filters.sort) {
    case 'difficulty-desc':
      list.sort((a, b) => b.difficulty - a.difficulty || a.name.localeCompare(b.name));
      break;
    case 'duration-asc':
      list.sort((a, b) => a.duration - b.duration || a.name.localeCompare(b.name));
      break;
    case 'score-desc':
      list.sort((a, b) => b.baseScore - a.baseScore || a.name.localeCompare(b.name));
      break;
    case 'name-asc':
    default:
      list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      break;
  }

  return list;
}
