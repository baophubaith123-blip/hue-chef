import type { GestureId, GestureParams } from '@/data/gesture-map';

export type { GestureId, GestureParams };

/** How the player performs the action: real pointer gesture, or the
 * button fallback (Kế hoạch 1, mục 3.6 — same 0–100 frame, no score cap). */
export type GestureMode = 'gesture' | 'button';

export interface GestureModuleProps {
  params: GestureParams;
  mode: GestureMode;
  /** Display names of the step's key ingredients, used as drag chips. */
  ingredientNames: string[];
  /** Called exactly once with the action score, 0–100. */
  onDone: (score: number) => void;
}
