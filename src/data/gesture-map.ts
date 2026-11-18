import type { CookingStep } from '@/data/types';

/**
 * Gesture assignment for the 14-action cooking engine (Kế hoạch hợp nhất,
 * Phần 3 + Kế hoạch 1, Phần 6). This file is CONFIG ONLY: it never touches
 * the recipe data itself, so balancing the gesture layer never edits a
 * recipe. Assignment pipeline (Kế hoạch 1, mục 6.1): extract every step's
 * action verb → map by the verb table below → 100% manual review of all
 * 258 distinct action labels in the 50 seeded dishes (reviewed 2026-11-18;
 * context misfires are pinned in LABEL_OVERRIDES).
 */

export type GestureId =
  | 'khuay'
  | 'nem'
  | 'hap'
  | 'xao'
  | 'chien'
  | 'thai'
  | 'gap-tha'
  | 'day-nap'
  | 'giu-lua'
  | 'luoc'
  | 'tron'
  | 'rot'
  | 'trang-tri'
  | 'cham-nhip';

/** Display icon per gesture (recipe detail teaches the move before play). */
export const GESTURE_ICONS: Record<GestureId, string> = {
  khuay: '🌀',
  nem: '🧂',
  hap: '♨️',
  xao: '🍳',
  chien: '🥘',
  thai: '🔪',
  'gap-tha': '🥢',
  'day-nap': '🍲',
  'giu-lua': '🔥',
  luoc: '💧',
  tron: '🥗',
  rot: '🫗',
  'trang-tri': '🌸',
  'cham-nhip': '🎵',
};

export const GESTURE_IDS: GestureId[] = [
  'khuay',
  'nem',
  'hap',
  'xao',
  'chien',
  'thai',
  'gap-tha',
  'day-nap',
  'giu-lua',
  'luoc',
  'tron',
  'rot',
  'trang-tri',
  'cham-nhip',
];

/**
 * Exact-label overrides from the manual review: labels whose surface verb
 * is a dish name or a secondary action, not the step's real gesture.
 */
const LABEL_OVERRIDES: Record<string, GestureId> = {
  'Tráng trứng': 'chien', // spreading egg sheets in a hot pan = fry/flip
  'Tráng & chiên bánh': 'chien',
  'Tráng bánh': 'hap', // batter spread on a steam cloth
  'Tráng bánh ướt': 'hap',
  'Làm mỡ hành': 'rot', // hot oil poured over scallions
  'Hoàn thiện nước chấm': 'khuay',
  'Hoàn thiện bột': 'tron',
  'Hoàn thiện nhân': 'tron',
  'Tạo độ sánh': 'khuay',
  'Tạo màu chả': 'tron',
  'Ủ tôm lên men': 'day-nap', // seal the jar and keep the lid on
  'Luộc bánh bột lọc': 'luoc', // "bột lọc" is the dish name, not straining
  'Rim thịt băm': 'giu-lua', // simmering; "băm" describes the meat, not the act
  'Pha mắm nêm': 'khuay', // "mắm nêm" is a sauce name; the act is mixing
  'Sơ chế thịt kho': 'gap-tha', // a prep step; "kho" names the target dish
};

/**
 * Verb table, checked in order — the first rule whose verb appears as a
 * whole syllable token in the label wins. Syllable-token matching keeps
 * dish names from misfiring ("khoai" never matches "kho", "đổ" (pour)
 * never matches "đồ" (steam), "nem" the dish never matches "nêm").
 */
const VERB_RULES: Array<{ gesture: GestureId; verbs: string[] }> = [
  { gesture: 'trang-tri', verbs: ['trình', 'bày', 'dọn', 'dựng', 'hoàn'] },
  { gesture: 'rot', verbs: ['chan', 'rót', 'lọc', 'đổ'] },
  { gesture: 'nem', verbs: ['nêm', 'rắc'] },
  { gesture: 'hap', verbs: ['hấp', 'chưng', 'đồ'] },
  { gesture: 'khuay', verbs: ['khuấy', 'quấy', 'pha', 'thắng', 'sên'] },
  { gesture: 'thai', verbs: ['thái', 'cắt', 'bào', 'băm', 'tỉa'] },
  { gesture: 'tron', verbs: ['trộn', 'ướp', 'đảo', 'nhào', 'nhồi'] },
  { gesture: 'xao', verbs: ['xào', 'phi', 'rang'] },
  { gesture: 'chien', verbs: ['chiên', 'nướng', 'quay', 'rán'] },
  { gesture: 'cham-nhip', verbs: ['giã', 'đập', 'quết'] },
  { gesture: 'luoc', verbs: ['luộc', 'chần', 'trụng', 'nhúng', 'đun'] },
  { gesture: 'gap-tha', verbs: ['thả', 'thêm', 'xếp'] },
  // Waiting / gentle-heat steps (simmer, braise, soak, settle) use the
  // hold-the-fire gesture instead of a dead countdown (Kế hoạch 1, Phần 6).
  { gesture: 'giu-lua', verbs: ['hầm', 'ninh', 'kho', 'rim', 'nấu', 'ngâm', 'lắng', 'ủ'] },
];

/** Fallback for verbs outside the catalog (Kế hoạch 1, Phần 3 catalog note). */
export const DEFAULT_GESTURE: GestureId = 'gap-tha';

function gestureForText(text: string): GestureId | null {
  const tokens = text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  for (const rule of VERB_RULES) {
    if (rule.verbs.some((verb) => tokens.includes(verb))) {
      return rule.gesture;
    }
  }
  return null;
}

/** The gesture a cooking step is played with. */
export function gestureForStep(step: CookingStep): GestureId {
  const label = (step.actionLabel ?? '').trim();
  if (label && LABEL_OVERRIDES[label]) {
    return LABEL_OVERRIDES[label];
  }
  if (label) {
    const fromLabel = gestureForText(label);
    if (fromLabel) return fromLabel;
  }
  const fromTitle = gestureForText(step.title ?? '');
  if (fromTitle) return fromTitle;
  return DEFAULT_GESTURE;
}

/**
 * Difficulty parameters per gesture (Kế hoạch 1, mục 6.4): harder dishes
 * demand more repetitions, narrower target zones and longer holds.
 * `count` = repetitions the gesture asks for; `zone` = target-zone width
 * as a 0..1 ratio; `holdMs` = base hold/duration budget.
 */
export interface GestureParams {
  count: number;
  zone: number;
  holdMs: number;
  maxMs: number;
}

export function gestureParams(gesture: GestureId, difficulty: number): GestureParams {
  const d = Math.min(5, Math.max(1, difficulty));
  const base: Record<GestureId, GestureParams> = {
    khuay: { count: 2 + d, zone: 0.34 - d * 0.02, holdMs: 0, maxMs: 25000 },
    nem: { count: 1, zone: 0.3 - d * 0.025, holdMs: 0, maxMs: 20000 },
    hap: { count: 3, zone: 0.3 - d * 0.02, holdMs: 2600 - d * 200, maxMs: 25000 },
    xao: { count: 3 + d, zone: 0.32 - d * 0.02, holdMs: 0, maxMs: 25000 },
    chien: { count: 1 + Math.floor(d / 2), zone: 0.3 - d * 0.025, holdMs: 0, maxMs: 20000 },
    thai: { count: 3 + d, zone: 0.3 - d * 0.02, holdMs: 0, maxMs: 25000 },
    'gap-tha': { count: 3, zone: 0.4 - d * 0.02, holdMs: 0, maxMs: 20000 },
    'day-nap': { count: 1, zone: 0.34 - d * 0.02, holdMs: 1400 + d * 200, maxMs: 20000 },
    'giu-lua': { count: 1, zone: 0.36 - d * 0.025, holdMs: 3200 + d * 500, maxMs: 30000 },
    luoc: { count: 1 + Math.floor(d / 2), zone: 0.3 - d * 0.02, holdMs: 2400 - d * 150, maxMs: 25000 },
    tron: { count: 4 + d, zone: 0.34 - d * 0.02, holdMs: 0, maxMs: 25000 },
    rot: { count: 1, zone: 0.3 - d * 0.02, holdMs: 0, maxMs: 20000 },
    'trang-tri': { count: 4, zone: 0.42 - d * 0.02, holdMs: 0, maxMs: 25000 },
    'cham-nhip': { count: 3 + d, zone: 0.3 - d * 0.025, holdMs: 0, maxMs: 25000 },
  };
  return base[gesture];
}
