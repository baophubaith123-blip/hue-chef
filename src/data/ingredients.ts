import type { Ingredient } from '@/data/types';

export const SEED_INGREDIENTS: Ingredient[] = [
  { id: 'beef-shank', name: 'Bắp bò', category: 'protein' },
  { id: 'pork-belly', name: 'Ba chỉ heo', category: 'protein' },
  { id: 'shrimp', name: 'Tôm sú', category: 'protein' },
  { id: 'clams', name: 'Hến', category: 'protein' },
  { id: 'pork-mince', name: 'Thịt heo băm', category: 'protein' },
  { id: 'grilled-pork', name: 'Thịt nướng', category: 'protein' },
  { id: 'nem-skewer', name: 'Nem lụi', category: 'protein' },
  { id: 'rice-noodle', name: 'Bún tươi', category: 'grain' },
  { id: 'rice', name: 'Gạo tẻ', category: 'grain' },
  { id: 'rice-flour', name: 'Bột gạo', category: 'grain' },
  { id: 'tapioca', name: 'Bột năng', category: 'grain' },
  { id: 'corn', name: 'Bắp tươi', category: 'vegetable' },
  { id: 'lotus-seed', name: 'Hạt sen', category: 'other' },
  { id: 'bean-sprout', name: 'Giá đỗ', category: 'vegetable' },
  { id: 'banana-leaf', name: 'Lá chuối', category: 'vegetable' },
  { id: 'herbs-mix', name: 'Rau sống', category: 'vegetable' },
  { id: 'lemongrass', name: 'Sả', category: 'spice' },
  { id: 'shrimp-paste', name: 'Mắm ruốc', category: 'spice' },
  { id: 'fish-sauce', name: 'Nước mắm', category: 'spice' },
  { id: 'peanut', name: 'Đậu phộng', category: 'other' },
  { id: 'turmeric', name: 'Nghệ', category: 'spice' },
  { id: 'shallot', name: 'Hành tím', category: 'vegetable' },
  { id: 'garlic', name: 'Tỏi', category: 'vegetable' },
  { id: 'chili', name: 'Ớt', category: 'spice' },
  { id: 'coconut-milk', name: 'Nước cốt dừa', category: 'other' },
  { id: 'palm-sugar', name: 'Đường thốt nốt', category: 'other' },
  { id: 'rice-paper', name: 'Bánh tráng', category: 'grain' },
  { id: 'pork-hock', name: 'Giò heo', category: 'protein' },
  { id: 'fermented-fish', name: 'Mắm nêm', category: 'spice' },
  { id: 'crispy-pancake-batter', name: 'Bột bánh xèo', category: 'grain' },
  { id: 'pork-crackling', name: 'Da heo quay', category: 'protein' },
  { id: 'dried-shrimp', name: 'Tôm khô', category: 'protein' },
];

export function getIngredientById(id: string): Ingredient | undefined {
  return SEED_INGREDIENTS.find((item) => item.id === id);
}
