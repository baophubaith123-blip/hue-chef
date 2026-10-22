import type { Ingredient } from '@/data/types';

export const SEED_INGREDIENTS: Ingredient[] = [
  { id: 'beef-shank', name: 'Bắp bò', category: 'protein', fallbackEmoji: '🥩' },
  { id: 'pork-belly', name: 'Ba chỉ heo', category: 'protein', fallbackEmoji: '🥓' },
  { id: 'shrimp', name: 'Tôm sú', category: 'protein', fallbackEmoji: '🦐' },
  { id: 'clams', name: 'Hến', category: 'protein', fallbackEmoji: '🦪' },
  { id: 'pork-mince', name: 'Thịt heo băm', category: 'protein', fallbackEmoji: '🥩' },
  { id: 'grilled-pork', name: 'Thịt nướng', category: 'protein', fallbackEmoji: '🍖' },
  { id: 'nem-skewer', name: 'Nem lụi', category: 'protein', fallbackEmoji: '🍢' },
  { id: 'rice-noodle', name: 'Bún tươi', category: 'grain', fallbackEmoji: '🍜' },
  { id: 'rice', name: 'Gạo tẻ', category: 'grain', fallbackEmoji: '🍚' },
  { id: 'rice-flour', name: 'Bột gạo', category: 'grain', fallbackEmoji: '🌾' },
  { id: 'tapioca', name: 'Bột năng', category: 'grain', fallbackEmoji: '🥣' },
  { id: 'corn', name: 'Bắp tươi', category: 'vegetable', fallbackEmoji: '🌽' },
  { id: 'lotus-seed', name: 'Hạt sen', category: 'other', fallbackEmoji: '🪷' },
  { id: 'bean-sprout', name: 'Giá đỗ', category: 'vegetable', fallbackEmoji: '🌱' },
  { id: 'banana-leaf', name: 'Lá chuối', category: 'vegetable', fallbackEmoji: '🍃' },
  { id: 'herbs-mix', name: 'Rau sống', category: 'vegetable', fallbackEmoji: '🥗' },
  { id: 'lemongrass', name: 'Sả', category: 'spice', fallbackEmoji: '🌿' },
  { id: 'shrimp-paste', name: 'Mắm ruốc', category: 'spice', fallbackEmoji: '🏺' },
  { id: 'fish-sauce', name: 'Nước mắm', category: 'spice', fallbackEmoji: '🍶' },
  { id: 'peanut', name: 'Đậu phộng', category: 'other', fallbackEmoji: '🥜' },
  { id: 'turmeric', name: 'Nghệ', category: 'spice', fallbackEmoji: '🫚' },
  { id: 'shallot', name: 'Hành tím', category: 'vegetable', fallbackEmoji: '🧅' },
  { id: 'garlic', name: 'Tỏi', category: 'vegetable', fallbackEmoji: '🧄' },
  { id: 'chili', name: 'Ớt', category: 'spice', fallbackEmoji: '🌶️' },
  { id: 'coconut-milk', name: 'Nước cốt dừa', category: 'other', fallbackEmoji: '🥥' },
  { id: 'palm-sugar', name: 'Đường thốt nốt', category: 'other', fallbackEmoji: '🍯' },
  { id: 'rice-paper', name: 'Bánh tráng', category: 'grain', fallbackEmoji: '🥟' },
  { id: 'pork-hock', name: 'Giò heo', category: 'protein', fallbackEmoji: '🍖' },
  { id: 'fermented-fish', name: 'Mắm nêm', category: 'spice', fallbackEmoji: '🫙' },
  { id: 'crispy-pancake-batter', name: 'Bột bánh xèo', category: 'grain', fallbackEmoji: '🥞' },
  { id: 'pork-crackling', name: 'Da heo quay', category: 'protein', fallbackEmoji: '🥓' },
  { id: 'dried-shrimp', name: 'Tôm khô', category: 'protein', fallbackEmoji: '🦐' },
];

export function getIngredientById(id: string): Ingredient | undefined {
  return SEED_INGREDIENTS.find((item) => item.id === id);
}
