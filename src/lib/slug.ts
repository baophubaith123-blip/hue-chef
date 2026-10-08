export function removeDiacritics(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function normalizeSearchText(value: string): string {
  return removeDiacritics(value.trim().toLowerCase());
}

export function createRecipeSlugId(name: string): string {
  const slug = normalizeSearchText(name)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${slug || 'recipe'}-${suffix}`;
}
