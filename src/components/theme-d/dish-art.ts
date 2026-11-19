/**
 * Dish illustrations (Gói Game-Shell): the flat sheet-style set in
 * `assets/theme-d/dishes-flat/`, keyed by recipe id (file name = id).
 * The earlier watercolor set stays on disk in `assets/theme-d/dishes/`
 * untouched — only this mapping switched, so the whole game now speaks
 * one illustration style.
 */
const flatModules = import.meta.glob<string>('../../assets/theme-d/dishes-flat/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const DISH_ART: Record<string, string> = Object.fromEntries(
  Object.entries(flatModules).map(([path, url]) => {
    const base = path.split('/').pop() ?? path;
    return [base.replace(/\.webp$/, ''), url];
  }),
);

export function dishArtFor(recipe: { id: string; image: string }): string {
  return DISH_ART[recipe.id] ?? recipe.image;
}
