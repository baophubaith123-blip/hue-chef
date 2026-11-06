import { normalizeSearchText } from '@/lib/slug';
import { getJsonStorage, setJsonStorage, STORAGE_KEYS } from '@/lib/storage';

/**
 * Taxonomy registry: the categories / units / step-action verbs that are NOT
 * hard-coded presets. Built-in presets keep their ids and i18n labels; this
 * store holds everything editors added themselves (plus the Phase-15 seeded
 * categories, which are recorded as created by the editor demo account so
 * the editor can manage them like their own).
 */
export interface CustomCategory {
  id: string;
  name: string;
  nameEn?: string;
  kind: 'recipe' | 'ingredient';
  createdBy: string;
  createdAt: string;
}

export interface TaxonomyData {
  categories: CustomCategory[];
  units: string[];
  stepActions: string[];
}

export const TAXONOMY_SEED_EDITOR_ID = 'seed-editor';

const SEED_TIME = '2026-11-07T00:00:00.000Z';

const SEEDED_CATEGORIES: CustomCategory[] = [
  {
    id: 'goi-tron-cuon',
    name: 'Gỏi · Trộn · Cuốn',
    nameEn: 'Salads · Mixed · Rolls',
    kind: 'recipe',
    createdBy: TAXONOMY_SEED_EDITOR_ID,
    createdAt: SEED_TIME,
  },
  {
    id: 'canh-lau',
    name: 'Canh · Lẩu',
    nameEn: 'Soups · Hotpots',
    kind: 'recipe',
    createdBy: TAXONOMY_SEED_EDITOR_ID,
    createdAt: SEED_TIME,
  },
  {
    id: 'mon-man',
    name: 'Món mặn',
    nameEn: 'Savory mains',
    kind: 'recipe',
    createdBy: TAXONOMY_SEED_EDITOR_ID,
    createdAt: SEED_TIME,
  },
  {
    id: 'dau-hat',
    name: 'Đậu · Hạt',
    nameEn: 'Beans · Seeds',
    kind: 'ingredient',
    createdBy: TAXONOMY_SEED_EDITOR_ID,
    createdAt: SEED_TIME,
  },
];

export const PRESET_UNITS: string[] = [
  'g', 'kg', 'ml', 'l',
  'quả', 'trái', 'củ', 'con', 'cái', 'miếng', 'lá', 'cây', 'xiên', 'tổ',
  'thanh', 'bông', 'muỗng canh', 'muỗng cà phê', 'gói', 'hộp',
];

export const PRESET_RECIPE_CATEGORY_IDS: string[] = ['bun', 'com', 'banh', 'che', 'nem'];
export const PRESET_INGREDIENT_CATEGORY_IDS: string[] = [
  'protein', 'vegetable', 'spice', 'grain', 'other',
];

function emptyTaxonomy(): TaxonomyData {
  return { categories: [...SEEDED_CATEGORIES], units: [], stepActions: [] };
}

export function loadTaxonomy(): TaxonomyData {
  const stored = getJsonStorage<TaxonomyData>(STORAGE_KEYS.taxonomy);
  if (
    !stored ||
    !Array.isArray(stored.categories) ||
    !Array.isArray(stored.units) ||
    !Array.isArray(stored.stepActions)
  ) {
    const seeded = emptyTaxonomy();
    setJsonStorage(STORAGE_KEYS.taxonomy, seeded);
    return seeded;
  }
  // Seeded categories must exist even for stores created before them shipped.
  const merged = [...stored.categories];
  for (const seed of SEEDED_CATEGORIES) {
    if (!merged.some((c) => c.id === seed.id && c.kind === seed.kind)) {
      merged.push(seed);
    }
  }
  return { categories: merged, units: stored.units, stepActions: stored.stepActions };
}

export function saveTaxonomy(data: TaxonomyData): void {
  setJsonStorage(STORAGE_KEYS.taxonomy, data);
}

export function makeCategoryId(name: string, taken: Set<string>): string {
  const slug = normalizeSearchText(name)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const base = slug || 'loai-moi';
  let id = base;
  let suffix = 2;
  while (taken.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

/**
 * Resolve the display label of a category id: i18n preset labels first,
 * then editor-registered names (localized when an English name exists),
 * then the raw id so the UI never breaks.
 */
export function categoryLabel(
  id: string,
  presetLabels: Record<string, string>,
  customs: CustomCategory[],
  locale: 'vi' | 'en',
): string {
  const preset = presetLabels[id];
  if (preset) return preset;
  const custom = customs.find((c) => c.id === id);
  if (custom) {
    return locale === 'en' && custom.nameEn ? custom.nameEn : custom.name;
  }
  return id;
}
