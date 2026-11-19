/**
 * Kitchen incidents (Gói H7, ý tưởng 14 — Kế hoạch hợp nhất Phần 7):
 * mid-run accidents in BOTH loops — the fire dies, the knife is dull,
 * the salt runs out, the pot boils over. An incident blocks the step's
 * action until the cook deals with it through a small hands-on fix
 * (hold to relight, tap to sharpen…). The run clock never stops, so
 * dawdling costs time points — that is the "ignore it" price, paid
 * through the scoring frame's own time component. If the grace window
 * fully expires, the accident burns in as ONE cooking mistake through
 * the engine's existing wrong-drop channel (wrong count + cook-points
 * penalty, and the sell diagnosis hears about it) — never more than
 * once per incident, and incidents are capped per run so a run can be
 * unlucky but never buried.
 */

export type IncidentId = 'lua-tat' | 'dao-cun' | 'het-muoi' | 'nuoc-tran';

export interface IncidentDef {
  id: IncidentId;
  icon: string;
  /** 'hold' = keep the fix button pressed; 'taps' = press it N times. */
  fixKind: 'hold' | 'taps';
  /** Milliseconds for 'hold', press count for 'taps'. */
  fixAmount: number;
}

export const INCIDENT_DEFS: IncidentDef[] = [
  { id: 'lua-tat', icon: '🔥', fixKind: 'hold', fixAmount: 1500 },
  { id: 'dao-cun', icon: '🔪', fixKind: 'taps', fixAmount: 3 },
  { id: 'het-muoi', icon: '🧂', fixKind: 'taps', fixAmount: 2 },
  { id: 'nuoc-tran', icon: '💧', fixKind: 'hold', fixAmount: 1000 },
];

export function incidentDefById(id: string): IncidentDef {
  return INCIDENT_DEFS.find((def) => def.id === id) ?? INCIDENT_DEFS[0];
}

/** Time the cook has to react before the accident burns in. */
export const INCIDENT_GRACE_MS = 20_000;

/** Hard cap of incidents per run, whatever the dice say. */
export const INCIDENT_MAX_PER_RUN = 2;

/**
 * Sentinel "ingredient" of the burn-in penalty: it is required by no
 * step of any dish, so dropping it takes the engine's ordinary
 * wrong-drop path — the one penalty channel every mode shares.
 */
export const INCIDENT_PENALTY_INGREDIENT = '__incident__';

export interface IncidentPlanEntry {
  /** Step index (into the run's steps) at which the incident strikes. */
  stepIndex: number;
  defId: IncidentId;
}

/**
 * Roll a run's incident plan. Runs with fewer than 3 steps stay
 * clean; longer runs usually meet exactly one incident (65%), a
 * second one is rare (15%), and none strike on the first step — the
 * cook always gets to settle in. Deterministic callers (tests, the
 * ?fx=1 hook) bypass this and build the plan themselves.
 */
export function planIncidents(stepCount: number, rng: () => number): IncidentPlanEntry[] {
  if (stepCount < 3) return [];
  const plan: IncidentPlanEntry[] = [];
  const pickStep = (exclude: number[]): number => {
    const options: number[] = [];
    for (let i = 1; i < stepCount; i += 1) {
      if (!exclude.includes(i)) options.push(i);
    }
    if (options.length === 0) return -1;
    return options[Math.floor(rng() * options.length)] ?? options[0];
  };
  const pickDef = (): IncidentId =>
    INCIDENT_DEFS[Math.floor(rng() * INCIDENT_DEFS.length)]?.id ?? 'lua-tat';

  if (rng() < 0.65) {
    const step = pickStep([]);
    if (step >= 0) plan.push({ stepIndex: step, defId: pickDef() });
  }
  if (plan.length === 1 && rng() < 0.15) {
    const step = pickStep(plan.map((entry) => entry.stepIndex));
    if (step >= 0) plan.push({ stepIndex: step, defId: pickDef() });
  }
  return plan.sort((a, b) => a.stepIndex - b.stepIndex);
}
