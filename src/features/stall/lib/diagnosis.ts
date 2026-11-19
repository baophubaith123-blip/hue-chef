/**
 * Flavour diagnosis of a sell batch (Kế hoạch hợp nhất, mục 6.5): honest
 * words generated from the mistakes the run actually made — the stage
 * ratios of the run's own score parts, never invented. The player reads
 * the diagnosis and decides: serve, or discard and cook again (the
 * "nêm lại" rescue card of the support systems arrives in H6).
 */

export type DiagnosisKey =
  | 'balanced'
  | 'too-salty'
  | 'too-bland'
  | 'season-off'
  | 'undercooked'
  | 'ingredient-tired'
  | 'ingredient-bruised'
  | 'finish-off'
  | 'overcooked-soft'
  /** Gói H5: the batch broke its picky customer's request (mục 6.3). */
  | 'request-violated';

export interface DiagnosisInput {
  /** Earned ratio 0..1 per run component; absent = stage not played. */
  ratios: Partial<Record<'market' | 'catch' | 'cook' | 'season' | 'finish' | 'quiz' | 'time', number>>;
  wrongCount: number;
  /**
   * Signed seasoning deviation from the seasoning bar: negative means
   * the needle stopped early (thiếu vị), positive means it ran past the
   * zone (quá tay). Absent on the gesture path, which reports no side.
   */
  seasonDeviation?: number | null;
}

interface Fault {
  key: DiagnosisKey;
  severity: number;
}

export function diagnoseBatch(input: DiagnosisInput): DiagnosisKey[] {
  const { ratios, wrongCount } = input;
  const faults: Fault[] = [];

  const season = ratios.season;
  if (season !== undefined && season < 0.55) {
    const deviation = input.seasonDeviation ?? null;
    if (deviation !== null && deviation > 0.25) {
      faults.push({ key: 'too-salty', severity: 1 - season });
    } else if (deviation !== null && deviation < -0.25) {
      faults.push({ key: 'too-bland', severity: 1 - season });
    } else {
      faults.push({ key: 'season-off', severity: 1 - season });
    }
  }

  const cook = ratios.cook;
  if ((cook !== undefined && cook < 0.5) || wrongCount >= 3) {
    faults.push({ key: 'undercooked', severity: Math.max(1 - (cook ?? 0.5), wrongCount >= 3 ? 0.6 : 0) });
  }
  const market = ratios.market;
  if (market !== undefined && market < 0.5) {
    faults.push({ key: 'ingredient-tired', severity: 1 - market });
  }
  const caught = ratios.catch;
  if (caught !== undefined && caught < 0.5) {
    faults.push({ key: 'ingredient-bruised', severity: 1 - caught });
  }
  const finish = ratios.finish;
  if (finish !== undefined && finish < 0.5) {
    faults.push({ key: 'finish-off', severity: 1 - finish });
  }
  const time = ratios.time;
  if (time !== undefined && time < 0.12) {
    faults.push({ key: 'overcooked-soft', severity: 0.9 });
  }

  if (faults.length === 0) return ['balanced'];
  return faults
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 2)
    .map((fault) => fault.key);
}

/**
 * Diagnosis of a background-pot batch (Gói H5): no run stages exist to
 * read faults from, so the words follow the pot's rolled quality —
 * steady simmering reads as balanced, a weak roll reads as the two
 * faults an unattended pot plausibly earns.
 */
export function diagnoseBackgroundPot(qualityScore: number): DiagnosisKey[] {
  if (qualityScore >= 65) return ['balanced'];
  if (qualityScore >= 50) return ['season-off'];
  return ['undercooked'];
}
