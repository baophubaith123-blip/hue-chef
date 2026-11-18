import type { DishGrade } from '@/components/theme-d/DishGradeFrame';

/**
 * Dish grade for the shared 5-grade frame system (Kế hoạch hợp nhất,
 * mục 6.11; chốt M3: the grade is fixed by the dish, the player's own
 * stars render separately inside the frame).
 *
 * Grade 5 "Đặc biệt" is reserved for cok-only special recipes; none
 * exist in the current catalogue, so the two top regular difficulties
 * (4★ Cực khó and 5★ Địa ngục — "cấp khó nhất của món thường") share
 * the grade-4 Cung đình frame.
 */
export function dishGradeFor(recipe: { difficulty: number }): DishGrade {
  const d = Math.min(5, Math.max(1, recipe.difficulty));
  return (d >= 4 ? 4 : d) as DishGrade;
}
